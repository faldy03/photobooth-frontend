"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Home,
  Loader2,
  Sparkles,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getApiUrl } from "@/lib/api";

export default function ResultPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State Management
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isPreparingPreview, setIsPreparingPreview] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [rawPhotos, setRawPhotos] = useState<string[]>([]);
  const [transactionIdNum, setTransactionIdNum] = useState<number>(NaN);

  // =====================================================================
  // FUNGSI BARU: SMART CROP ANTI-PENYOK
  // =====================================================================
  const drawImageProp = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    ctx.save();
    // 1. Buat topeng (masking) seukuran kotak lubang frame
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip(); // Potong segala sesuatu yang keluar dari kotak ini
    
    // 2. Hitung rasio asli foto kamera vs rasio lubang
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let renderW, renderH, renderX, renderY;

    if (imgRatio > boxRatio) {
      // Jika foto lebih lebar -> Crop presisi kiri & kanan
      renderH = h;
      renderW = img.width * (h / img.height);
      renderX = x - (renderW - w) / 2; // Posisikan persis di tengah
      renderY = y;
    } else {
      // Jika foto lebih tinggi -> Crop presisi atas & bawah
      renderW = w;
      renderH = img.height * (w / img.width);
      renderX = x;
      renderY = y - (renderH - h) / 2; // Posisikan persis di tengah
    }
    
    // 3. Gambar fotonya (bagian yang berlebih otomatis tidak akan tergambar karena ctx.clip)
    ctx.drawImage(img, renderX, renderY, renderW, renderH);
    ctx.restore();
  };

  useEffect(() => {
    const frameUrl = localStorage.getItem("selected_frame_url");
    const photosData = localStorage.getItem("captured_photos");
    const transactionId = localStorage.getItem("transaction_id");

    if (!frameUrl || !photosData) {
      toast.error("Data Sesi Hilang!");
      router.push("/");
      return;
    }

    const transactionIdNumber = transactionId ? parseInt(transactionId, 10) : NaN;
    setTransactionIdNum(transactionIdNumber);

    if (!transactionId || Number.isNaN(transactionIdNumber)) {
      toast.error("Transaksi Tidak Ditemukan!", { description: "Sesi pembayaran tidak valid." });
      setIsPreparingPreview(false);
      setErrorMsg("Transaksi tidak valid. Silakan ulangi dari halaman pembayaran.");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    const photos: string[] = JSON.parse(photosData);
    setRawPhotos(photos);

    const generatePreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 1800;
      ctx.fillStyle = "#EFE9DB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const createImgObj = (src: string, label: string, crossOrigin = false): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (crossOrigin && !src.startsWith("data:")) img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Gagal membuat objek gambar: ${label}`));
          img.src = src;
        });
      };

      const loadSafeImage = async (src: string, label: string): Promise<HTMLImageElement> => {
        try {
          if (src.startsWith("data:")) {
            return await createImgObj(src, label);
          }

          const res = await fetch(src, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          return await createImgObj(base64, label);
        } catch (error) {
          console.warn(`Fetch Blob gagal untuk ${label}, mencoba metode direct...`, error);
          return await createImgObj(src, label, true); 
        }
      };

      try {
        const frameDataStr = localStorage.getItem("selected_frame_data");
        let slots: { x: number; y: number; width: number; height: number }[] = [];
        
        if (frameDataStr) {
          try {
            const frameData = JSON.parse(frameDataStr);
            let configObj = frameData.config;
            if (typeof configObj === 'string') configObj = JSON.parse(configObj);
            if (configObj && Array.isArray(configObj.slots)) slots = configObj.slots;
          } catch (err) {
            console.error("Gagal mengekstrak koordinat frame:", err);
          }
        }

        // 1. MENGGAMBAR FOTO RAW (DENGAN SMART CROP)
        if (slots.length > 0) {
          for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const photoIndex = i % photos.length; 
            const img = await loadSafeImage(photos[photoIndex], `Foto #${photoIndex + 1}`);

            ctx.save();
            ctx.translate(slot.x + slot.width, slot.y);
            ctx.scale(-1, 1); 
            drawImageProp(ctx, img, 0, 0, slot.width, slot.height);
            ctx.restore();
          }
        } else {
          for (let i = 0; i < photos.length; i++) {
            const img = await loadSafeImage(photos[i], `Foto #${i + 1}`);
            const w = 480, h = 360;
            const yPositions = [320, 720, 1120];
            const y = yPositions[i];

            [60, 660].forEach((x) => {
              ctx.save();
              ctx.translate(x + w, y);
              ctx.scale(-1, 1);
              drawImageProp(ctx, img, 0, 0, w, h);
              ctx.restore();
            });
          }
        }

        // 2. MENGGAMBAR FRAME OVERLAY
        let frameImg;
        try {
          const proxyUrl = getApiUrl(`/api/proxy-image?url=${encodeURIComponent(frameUrl)}`);
          frameImg = await loadSafeImage(proxyUrl, "Frame Proxy");
        } catch (e) {
          console.warn("Proxy gagal, mencoba direct frame url...");
          frameImg = await loadSafeImage(frameUrl, "Frame Asli");
        }
        
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

        // 3. GENERATE HASIL AKHIR
        const finalDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setMergedImage(finalDataUrl);

      } catch (error: unknown) {
        console.error("Preview Error:", error);
        setErrorMsg((error as Error).message || "Gagal memproses gambar");
        toast.error("Gagal Menyiapkan Pratinjau");
      } finally {
        setIsPreparingPreview(false);
      }
    };

    setTimeout(generatePreview, 800); 
  }, [router]);

const handlePrint = async () => {
    if (!mergedImage) return;
    
    setIsPrinting(true);
    setErrorMsg(null);

    try {
      // ================================================================
      // 1. SIMPAN KE LARAVEL (Untuk Database & Generate QR Soft File)
      // ================================================================
      const responseLaravel = await fetch(getApiUrl("/api/sessions/save-photos"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          final_photo: mergedImage,
          raw_photos: rawPhotos,
          transaction_id: transactionIdNum,
          kiosk_device_id: 1, 
        }),
      });

      // PROTEKSI BARU: Cek apakah Laravel membalas dengan teks/HTML alih-alih JSON
      const textLaravel = await responseLaravel.text();
      let resultLaravel;
      try {
        resultLaravel = JSON.parse(textLaravel);
      } catch (parseError) {
        console.error("Laravel membalas dengan HTML/Error Server:", textLaravel);
        throw new Error("Server Database (Laravel) gagal merespon dengan benar. Pastikan limit upload php.ini sudah diperbesar.");
      }

      if (!resultLaravel.success) {
        throw new Error(resultLaravel.message || "Gagal menyimpan data ke server Laravel.");
      }

      setQrUrl(resultLaravel.download_link);

      // ================================================================
      // 2. KIRIM KE NODE.JS (Untuk Mencetak Fisik ke Mesin DNP)
      // ================================================================
      const pureBase64 = mergedImage.replace(/^data:image\/\w+;base64,/, "");

      try {
        const responseNode = await fetch("http://127.0.0.1:3001/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 🚨 PERBAIKAN: Namanya disamakan dengan yang dicari oleh Node.js (final_photo_base64)
          body: JSON.stringify({ final_photo_base64: pureBase64 }), 
        });

        if (!responseNode.ok) {
          throw new Error("Respon Node.js tidak OK");
        }
        
        toast.success("Foto Sedang Dicetak!", { description: "Silakan ambil foto fisik Anda di mesin printer." });
        
      } catch (nodeError) {
        console.error("Gagal koneksi ke Node.js Printer:", nodeError);
        toast.warning("Soft File Siap", { description: "Namun gagal terhubung ke mesin printer fisik (Node.js)." });
      }

    } catch (error: unknown) {
      console.error("Upload Error:", error);
      setErrorMsg((error as Error).message);
      toast.error("Gagal Memproses Data", { description: (error as Error).message });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleFinish = () => {
    localStorage.removeItem("captured_photos");
    localStorage.removeItem("selected_frame_url");
    localStorage.removeItem("selected_frame_data"); 
    localStorage.removeItem("transaction_id");
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
        
        {/* SISI KIRI: HASIL FINAL (PREVIEW) */}
        <div className="w-full max-w-[400px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[16px_16px_0_0_#262626] flex flex-col relative animate-in slide-in-from-left-8 duration-700">
          <div className="bg-retro-charcoal text-white text-center py-3 border-b-[4px] border-retro-charcoal">
            <h3 className="font-black uppercase text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-[#FF0000]" /> Pratinjau Cetakan 2R
            </h3>
          </div>

          <div className="p-4 bg-gray-100 flex items-center justify-center min-h-[500px]">
            {isPreparingPreview ? (
              <div className="flex flex-col items-center justify-center text-retro-charcoal">
                <Loader2 size={48} className="animate-spin mb-4 text-[#FF0000]" />
                <p className="font-black uppercase tracking-widest">
                  Melebur Foto...
                </p>
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
                {isPrinting && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#FF0000] shadow-[0_0_15px_#FF0000] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SISI KANAN: STATUS, TOMBOL CETAK & QR */}
        <div className="flex-1 max-w-[500px] flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 delay-200">
          
          <div className="bg-white border-[4px] border-retro-charcoal p-8 shadow-[8px_8px_0_0_#262626] text-center">
            {isPreparingPreview ? (
              <>
                <ImageIcon size={64} className="mx-auto text-gray-300 mb-4 animate-pulse" strokeWidth={2} />
                <h2 className="text-3xl font-black uppercase text-retro-charcoal animate-pulse mb-2">
                  Menyiapkan...
                </h2>
                <p className="font-bold text-retro-charcoal/60 uppercase tracking-widest text-xs">
                  Sedang menggabungkan foto dengan frame.
                </p>
              </>
            ) : isPrinting ? (
              <>
                <Printer size={64} className="mx-auto text-[#FF0000] mb-4 animate-bounce" strokeWidth={2} />
                <h2 className="text-3xl font-black uppercase text-retro-charcoal animate-pulse mb-2">
                  Mencetak...
                </h2>
                <p className="font-bold text-retro-charcoal/60 uppercase tracking-widest text-xs">
                  Mengirim data ke printer DNP RX1HS.
                </p>
              </>
            ) : errorMsg && !qrUrl ? (
              <>
                <AlertTriangle size={64} className="mx-auto text-[#FF0000] mb-4" />
                <h2 className="text-3xl font-black uppercase text-[#FF0000] mb-2">GAGAL</h2>
                <p className="font-bold text-retro-charcoal/60 uppercase tracking-widest text-xs">
                  {errorMsg}
                </p>
              </>
            ) : !qrUrl ? (
              <>
                <Sparkles size={64} className="mx-auto text-yellow-500 mb-4" strokeWidth={2} />
                <h2 className="text-3xl font-black uppercase text-retro-charcoal mb-2">
                  HASIL SIAP!
                </h2>
                <p className="font-bold text-retro-charcoal/70 uppercase tracking-widest text-sm">
                  Cek pratinjau di sebelah kiri sebelum mencetak.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 size={64} className="mx-auto text-[#FF0000] mb-4" strokeWidth={3} />
                <h2 className="text-3xl font-black uppercase text-retro-charcoal mb-2">SELESAI!</h2>
                <p className="font-bold text-retro-charcoal/70 uppercase tracking-widest text-sm">
                  Ambil foto fisik Anda.
                </p>
              </>
            )}
          </div>

          <div className={`bg-white border-[4px] border-retro-charcoal p-8 shadow-[8px_8px_0_0_#262626] flex flex-col items-center text-center transition-all duration-500 ${(isPreparingPreview || isPrinting) ? "opacity-50 grayscale pointer-events-none" : "opacity-100"}`}>
            
            {!qrUrl ? (
              <div className="w-full flex flex-col gap-4">
                 <h3 className="text-xl font-black uppercase tracking-widest text-retro-charcoal mb-2">
                   Konfirmasi Cetak
                 </h3>
                 <Button
                  onClick={handlePrint}
                  disabled={isPreparingPreview || isPrinting}
                  className="h-24 w-full bg-[#FF0000] hover:bg-red-700 text-white border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] font-black text-3xl uppercase tracking-widest active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-4"
                >
                  <Printer size={36} strokeWidth={3} /> CETAK FOTO
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black uppercase tracking-widest border-b-[3px] border-dashed border-retro-charcoal pb-3 w-full mb-6 flex items-center justify-center gap-2">
                  <QrCode size={24} className="text-[#FF0000]" /> Scan Soft File
                </h3>

                <div className="bg-white border-[4px] border-retro-charcoal p-3 mb-4 inline-block shadow-[4px_4px_0_0_#262626]">
                  <QRCodeSVG value={qrUrl} size={200} level={"H"} includeMargin={false} />
                </div>

                <p className="text-xs font-bold text-[#FF0000] uppercase mb-4 animate-pulse">
                  ⚠️ Tersedia hanya selama 60 menit!
                </p>

                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="w-full mt-3 block">
                  <Button type="button" className="w-full h-12 border-[3px] border-dashed border-retro-charcoal bg-yellow-200 hover:bg-yellow-300 text-retro-charcoal font-black uppercase tracking-widest shadow-[4px_4px_0_0_#262626]">
                    🧪 Buka Link di Tab Baru
                  </Button>
                </a>
              </>
            )}
          </div>

          <Button
            onClick={handleFinish}
            disabled={isPreparingPreview || isPrinting}
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