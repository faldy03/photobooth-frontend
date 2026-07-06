"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Download,
  CheckCircle2,
  Home,
  Loader2,
  Sparkles,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export default function ResultPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper untuk memotong foto secara proporsional di canvas
  const drawImageProp = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const offsetX = 0.5,
      offsetY = 0.5;
    const iw = img.width,
      ih = img.height;
    let r = Math.min(w / iw, h / ih),
      nw = iw * r,
      nh = ih * r,
      ar = 1;
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
    nw *= ar;
    nh *= ar;
    const cw = iw / (nw / w),
      ch = ih / (nh / h);
    let cx = (iw - cw) * offsetX,
      cy = (ih - ch) * offsetY;
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    ctx.drawImage(img, cx, cy, Math.min(cw, iw), Math.min(ch, ih), x, y, w, h);
  };

  useEffect(() => {
    const frameUrl = localStorage.getItem("selected_frame_url");
    const photosData = localStorage.getItem("captured_photos");
    // ✅ FIX: baca transaction_id lebih awal dan validasi sebelum proses jalan
    const transactionId = localStorage.getItem("transaction_id");

    if (!frameUrl || !photosData) {
      toast.error("Data Sesi Hilang!");
      router.push("/");
      return;
    }

    // ✅ FIX: transaction_id di database adalah integer (foreign key),
    // jadi harus dikonversi dan divalidasi sebagai angka, bukan string sembarangan.
    const transactionIdNumber = transactionId ? parseInt(transactionId, 10) : NaN;

    if (!transactionId || Number.isNaN(transactionIdNumber)) {
      // ✅ FIX: cegah upload dengan transaction_id null/bukan angka yang
      // menyebabkan error "The transaction id field must be an integer"
      toast.error("Transaksi Tidak Ditemukan!", {
        description: "Sesi pembayaran tidak valid, silakan ulangi dari awal.",
      });
      setIsProcessing(false);
      setErrorMsg("Transaksi tidak ditemukan atau tidak valid. Silakan ulangi dari halaman pembayaran.");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    const photos: string[] = JSON.parse(photosData);

    const processAndUpload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resolusi 2R Double Strip HD (300 DPI)
      canvas.width = 1200;
      canvas.height = 1800;
      ctx.fillStyle = "#EFE9DB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loadImage = (
        src: string,
        label: string,
      ): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Gagal memuat ${label}`));
          img.src = src;
        });
      };

      // Fungsi untuk membypass blokir CORS Canvas
      const fetchImageAsBase64 = async (url: string): Promise<string> => {
        try {
          if (url.startsWith("data:")) return url;

          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Gagal membaca blob"));
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.warn("Fetch base64 gagal, menggunakan URL asli:", error);
          return url;
        }
      };

      try {
        // 1. Gambar Foto ke Strip Kiri & Kanan
        for (let i = 0; i < photos.length; i++) {
          const img = await loadImage(photos[i], `Foto #${i + 1}`);
          const w = 480,
            h = 360;
          const yPositions = [320, 720, 1120];
          const y = yPositions[i];

          // Duplikasi ke dua sisi
          [60, 660].forEach((x) => {
            ctx.save();
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            drawImageProp(ctx, img, 0, 0, w, h);
            ctx.restore();
          });
        }

        // 2. TIMPA DENGAN FRAME PNG (BAGIAN YANG DIPERBAIKI)
        const proxyUrl = `http://127.0.0.1:8000/api/proxy-image?url=${encodeURIComponent(frameUrl)}`;
        const safeFrameBase64 = await fetchImageAsBase64(proxyUrl);
        
        const frameImg = await loadImage(safeFrameBase64, "Frame");
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

        // 3. Konversi ke Base64 untuk preview & upload
        const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setMergedImage(finalDataUrl);

        // 4. KIRIM KE LARAVEL BACKEND
        const response = await fetch(
          "http://127.0.0.1:8000/api/sessions/save-photos",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              final_photo: finalDataUrl,
              raw_photos: photos,
              transaction_id: transactionIdNumber,
              kiosk_device_id: 1, 
            }),
          },
        );

        const result = await response.json();

        if (result.success) {
          setQrUrl(result.download_link);
          toast.success("BERHASIL!", {
            description: "Foto tersimpan di cloud selama 1 jam.",
          });
        } else {
          throw new Error(result.message || "Gagal menyimpan ke database.");
        }
      } catch (error: unknown) {
        console.error("Proses Error:", error);
        setErrorMsg((error as Error).message);
        toast.error("Gagal Memproses", {
          description: (error as Error).message,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    setTimeout(processAndUpload, 1000); 
  }, [router]);

  const handleFinish = () => {
    localStorage.removeItem("captured_photos");
    localStorage.removeItem("selected_frame_url");
    localStorage.removeItem("transaction_id"); // ✅ FIX: bersihkan juga transaction_id
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#EFE9DB] flex flex-col items-center justify-center p-6 font-sans text-retro-charcoal relative overflow-hidden">
      <Toaster position="top-center" richColors />
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <div className="absolute top-8 w-full flex justify-center z-20">
        <div className="bg-white border-[4px] border-retro-charcoal px-8 py-3 shadow-[6px_6px_0_0_#262626]">
          <h1 className="text-2xl font-black uppercase tracking-widest text-[#FF0000] flex items-center gap-3">
            <Printer size={28} strokeWidth={3} /> STUDIO PENCETAKAN
          </h1>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-24 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* SISI KIRI: HASIL FINAL */}
        <div className="w-full max-w-[400px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[16px_16px_0_0_#262626] flex flex-col relative animate-in slide-in-from-left-8 duration-700">
          <div className="bg-retro-charcoal text-white text-center py-3 border-b-[4px] border-retro-charcoal">
            <h3 className="font-black uppercase text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-[#FF0000]" /> Hasil Cetakan 2R
            </h3>
          </div>

          <div className="p-4 bg-gray-100 flex items-center justify-center min-h-[500px]">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center text-retro-charcoal">
                <Loader2
                  size={48}
                  className="animate-spin mb-4 text-[#FF0000]"
                />
                <p className="font-black uppercase tracking-widest">
                  Melebur & Mengunggah...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center text-center text-[#FF0000] p-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="font-bold">Error Sistem</p>
                <p className="text-xs text-gray-500 mt-2">{errorMsg}</p>
              </div>
            ) : (
              <div className="relative group w-full">
                {mergedImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mergedImage}
                    alt="Final Print"
                    className="w-full h-auto border-[4px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  />
                )}
                {/* Garis Animasi Scanning */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF0000] shadow-[0_0_15px_#FF0000] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>
              </div>
            )}
          </div>
        </div>

        {/* SISI KANAN: STATUS & QR */}
        <div className="flex-1 max-w-[500px] flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 delay-200">
          <div className="bg-white border-[4px] border-retro-charcoal p-8 shadow-[8px_8px_0_0_#262626] text-center">
            {isProcessing ? (
              <>
                <h2 className="text-3xl font-black uppercase text-retro-charcoal animate-pulse mb-2">
                  Memproses...
                </h2>
                <p className="font-bold text-retro-charcoal/60 uppercase tracking-widest text-xs">
                  Jangan tutup halaman ini.
                </p>
              </>
            ) : errorMsg ? (
              <>
                <h2 className="text-3xl font-black uppercase text-[#FF0000] mb-2">
                  GAGAL
                </h2>
                <p className="font-bold text-retro-charcoal/60 uppercase tracking-widest text-xs">
                  Cek koneksi internet mesin Kios.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2
                  size={64}
                  className="mx-auto text-[#FF0000] mb-4"
                  strokeWidth={3}
                />
                <h2 className="text-3xl font-black uppercase text-retro-charcoal mb-2">
                  SELESAI!
                </h2>
                <p className="font-bold text-retro-charcoal/70 uppercase tracking-widest text-sm">
                  Ambil foto fisik Anda dan scan QR di bawah.
                </p>
              </>
            )}
          </div>

          <div
            className={`bg-white border-[4px] border-retro-charcoal p-8 shadow-[8px_8px_0_0_#262626] flex flex-col items-center text-center transition-all duration-500 ${isProcessing || errorMsg ? "opacity-50 grayscale pointer-events-none" : "opacity-100"}`}
          >
            <h3 className="text-xl font-black uppercase tracking-widest border-b-[3px] border-dashed border-retro-charcoal pb-3 w-full mb-6 flex items-center justify-center gap-2">
              <QrCode size={24} className="text-[#FF0000]" /> Scan Soft File
            </h3>

            <div className="bg-white border-[4px] border-retro-charcoal p-3 mb-4 inline-block shadow-[4px_4px_0_0_#262626]">
              {qrUrl ? (
                <QRCodeSVG
                  value={qrUrl}
                  size={200}
                  level={"H"}
                  includeMargin={false}
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center">
                  <Loader2 className="animate-spin text-gray-300" />
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-[#FF0000] uppercase mb-4 animate-pulse">
              ⚠️ Tersedia hanya selama 60 menit!
            </p>

            <Button
              variant="outline"
              className="w-full border-[3px] border-retro-charcoal font-black uppercase tracking-widest hover:bg-[#EFE9DB] shadow-[4px_4px_0_0_#262626] truncate"
            >
              {qrUrl
                ? qrUrl.replace("http://", "").replace("https://", "")
                : "Menunggu Link..."}
            </Button>

            {/* ✅ DEV ONLY: tombol untuk buka langsung link download di tab baru,
                supaya bisa test tanpa perlu scan QR pakai HP.
                Hapus/comment blok ini nanti sebelum rilis ke production. */}
            {qrUrl && (
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 block"
              >
                <Button
                  type="button"
                  className="w-full h-12 border-[3px] border-dashed border-retro-charcoal bg-yellow-200 hover:bg-yellow-300 text-retro-charcoal font-black uppercase tracking-widest shadow-[4px_4px_0_0_#262626]"
                >
                  🧪 [DEV] Buka Link di Tab Baru
                </Button>
              </a>
            )}
          </div>

          <Button
            onClick={handleFinish}
            disabled={isProcessing}
            className="h-20 w-full bg-retro-charcoal hover:bg-black text-white border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#FF0000] font-black text-xl uppercase tracking-widest active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            KEMBALI KE BERANDA <Home size={28} strokeWidth={3} />
          </Button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `,
        }}
      />
    </div>
  );
}