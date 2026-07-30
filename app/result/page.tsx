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
  Image as ImageIcon,
  Clock
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
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>("");

  // A. Timer Sesi Dinamis mengikuti system_setting (session_duration_minutes)
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    const startSessionTimeout = async () => {
      let durationMinutes = 5;
      try {
        const res = await fetch(getApiUrl("/api/kiosk/settings"));
        const json = await res.json();
        if (json.success && json.data && json.data.session_duration_minutes) {
          durationMinutes = Number(json.data.session_duration_minutes);
        }
      } catch (err) {
        console.error("Gagal mengambil session_duration_minutes:", err);
      }

      let startTimeStr = localStorage.getItem("session_start_time");
      if (!startTimeStr) {
        startTimeStr = String(Date.now());
        localStorage.setItem("session_start_time", startTimeStr);
      }
      const startTime = Number(startTimeStr);
      const totalSecondsAllowed = durationMinutes * 60;

      const updateTimer = () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remaining = totalSecondsAllowed - elapsedSeconds;

        if (remaining <= 0) {
          clearInterval(timerId);
          localStorage.removeItem("captured_photos");
          localStorage.removeItem("selected_frame_url");
          localStorage.removeItem("selected_frame_data"); 
          localStorage.removeItem("transaction_id");
          localStorage.removeItem("session_start_time");
          router.push("/");
        } else {
          const m = Math.floor(remaining / 60);
          const s = remaining % 60;
          setSessionTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      };

      updateTimer();
      timerId = setInterval(updateTimer, 1000);
    };

    startSessionTimeout();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [router]);

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
      const payload = {
        final_photo: mergedImage,
        raw_photos: rawPhotos,
        transaction_id: transactionIdNum,
        kiosk_device_id: 1,
      };

      const responseLaravel = await fetch(getApiUrl("/api/sessions/save-photos"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
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
      // 2. KIRIM UNTUK DI-PRINT (Fisik ke Mesin DNP)
      // ================================================================
      const pureBase64 = mergedImage.replace(/^data:image\/\w+;base64,/, "");

      // Cek apakah berjalan di dalam aplikasi Electron (Desktop App)
      if (typeof window !== 'undefined' && (window as any).electron) {
        try {
          (window as any).electron.printPhoto(mergedImage);
          toast.success("Foto Sedang Dicetak!", { description: "Silakan ambil foto fisik Anda di mesin printer." });
        } catch (elecError) {
          console.error("Gagal cetak melalui Electron IPC:", elecError);
          toast.error("Gagal Mencetak", { description: "Gagal terhubung ke modul cetak Electron." });
        }
      } else {
        // Fallback: Kirim ke Node.js local agent port 3001 jika dijalankan di browser biasa
        try {
          const responseNode = await fetch("http://127.0.0.1:3001/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              final_photo_base64: pureBase64,
              final_photo_url: resultLaravel.download_link,
              source: "drive"
            }),
          });

          if (!responseNode.ok) {
            throw new Error("Respon Node.js tidak OK");
          }
          
          toast.success("Foto Sedang Dicetak!", { description: "Silakan ambil foto fisik Anda di mesin printer." });
          
        } catch (nodeError) {
          console.error("Gagal koneksi ke Node.js Printer:", nodeError);
          toast.warning("Soft File Siap", { description: "Namun gagal terhubung ke mesin printer fisik (Node.js)." });
        }
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
  };  return (
    <div className="min-h-screen bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex flex-col items-center justify-center p-6 font-sans text-[#4A4A4A] relative overflow-hidden">
      <Toaster position="top-center" richColors />
      <canvas ref={canvasRef} className="hidden" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* HEADER */}
      <div className="absolute top-8 w-full flex justify-center z-20 px-8">
        {sessionTimeLeft && (
          <div className="absolute top-0 right-8 bg-white border border-[#4A4A4A]/25 px-3 py-1 font-bold text-xs uppercase tracking-widest shadow-sm rounded-full flex items-center gap-1.5 z-50">
            <Clock size={14} className="text-[#4A4A4A] animate-pulse" />
            <span className="font-bold text-xs md:text-sm text-[#4A4A4A]">{sessionTimeLeft}</span>
          </div>
        )}
        <div className="bg-white border border-[#4A4A4A]/10 px-6 py-2 shadow-sm rounded-full">
          <h1 
            className="text-base md:text-lg font-normal uppercase tracking-[0.15em] text-[#4A4A4A] flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Printer size={20} /> STUDIO PENCETAKAN
          </h1>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-24 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        
        {/* SISI KIRI: HASIL FINAL (PREVIEW) */}
        <div className="w-full max-w-[360px] shrink-0 bg-white border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative rounded-xl overflow-hidden animate-in slide-in-from-left-8 duration-700">
          <div className="bg-[#FAF9F6] text-[#4A4A4A] text-center py-3 border-b border-[#4A4A4A]/10 shrink-0">
            <h3 
              className="font-normal uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-1.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <Sparkles size={14} /> Pratinjau Cetakan 2R
            </h3>
          </div>

          <div className="p-4 bg-gray-55 flex items-center justify-center min-h-[460px]">
            {isPreparingPreview ? (
              <div className="flex flex-col items-center justify-center text-[#4A4A4A]">
                <Loader2 size={36} className="animate-spin mb-3 text-[#4A4A4A]" />
                <p className="font-bold uppercase tracking-widest text-[10px]">
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
                    className="w-full h-auto border border-white/60 shadow-md rounded"
                  />
                )}
                {isPrinting && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#4A4A4A] shadow-[0_0_15px_#4A4A4A] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SISI KANAN: STATUS, TOMBOL CETAK & QR */}
        <div className="flex-1 max-w-[460px] flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 delay-200">
          
          <div className="bg-white border border-[#4A4A4A]/10 p-8 shadow-sm text-center rounded-xl">
            {isPreparingPreview ? (
              <>
                <ImageIcon size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" strokeWidth={1.5} />
                <h2 className="text-2xl font-normal uppercase text-[#4A4A4A] animate-pulse mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Menyiapkan...
                </h2>
                <p className="font-bold text-[#7A7A7A] uppercase tracking-widest text-[9px] opacity-80">
                  Sedang menggabungkan foto dengan frame.
                </p>
              </>
            ) : isPrinting ? (
              <>
                <Printer size={48} className="mx-auto text-[#4A4A4A] mb-4 animate-bounce" strokeWidth={1.5} />
                <h2 className="text-2xl font-normal uppercase text-[#4A4A4A] animate-pulse mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Mencetak...
                </h2>
                <p className="font-bold text-[#7A7A7A] uppercase tracking-widest text-[9px] opacity-80">
                  Mengirim data ke printer DNP RX1HS.
                </p>
              </>
            ) : errorMsg && !qrUrl ? (
              <>
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-normal uppercase text-red-600 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GAGAL</h2>
                <p className="font-bold text-red-500/80 uppercase tracking-widest text-[9px]">
                  {errorMsg}
                </p>
              </>
            ) : !qrUrl ? (
              <>
                <Sparkles size={48} className="mx-auto text-yellow-500 mb-4" strokeWidth={1.5} />
                <h2 className="text-2xl font-normal uppercase text-[#4A4A4A] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  HASIL SIAP!
                </h2>
                <p className="font-bold text-[#7A7A7A] uppercase tracking-widest text-xs">
                  Cek pratinjau di sebelah kiri sebelum mencetak.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" strokeWidth={2} />
                <h2 className="text-2xl font-normal uppercase text-[#4A4A4A] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>SELESAI!</h2>
                <p className="font-bold text-[#7A7A7A] uppercase tracking-widest text-xs">
                  Ambil foto fisik Anda.
                </p>
              </>
            )}
          </div>

          <div className={`bg-white border border-[#4A4A4A]/10 p-6 shadow-sm flex flex-col items-center text-center transition-all duration-500 rounded-xl ${(isPreparingPreview || isPrinting) ? "opacity-50 grayscale pointer-events-none" : "opacity-100"}`}>
            
            {!qrUrl ? (
              <div className="w-full flex flex-col gap-4">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-[#7A7A7A] mb-1">
                   Konfirmasi Cetak
                 </h3>
                 <Button
                  onClick={handlePrint}
                  disabled={isPreparingPreview || isPrinting}
                  className="h-14 w-full bg-[#4A4A4A] hover:bg-[#333] text-white border-none font-bold text-sm uppercase tracking-widest rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> CETAK FOTO
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] border-b border-[#4A4A4A]/10 pb-2.5 w-full mb-4 flex items-center justify-center gap-1.5 text-[#7A7A7A]">
                  <QrCode size={18} className="text-[#4A4A4A]" /> Scan Soft File
                </h3>

                <div className="bg-white border border-[#4A4A4A]/10 p-3 mb-3 inline-block rounded-lg shadow-sm">
                  <QRCodeSVG value={qrUrl} size={180} level={"H"} includeMargin={false} />
                </div>

                <p className="text-[10px] font-bold text-yellow-600 uppercase mb-3 animate-pulse">
                  ⚠️ Tersedia hanya selama 60 menit!
                </p>

                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="w-full mt-2 block">
                  <Button type="button" className="w-full h-10 border border-[#4A4A4A]/10 bg-[#FAF9F6] hover:bg-white text-[#4A4A4A] font-bold uppercase tracking-widest text-[10px] rounded-lg">
                    🧪 Buka Link di Tab Baru
                  </Button>
                </a>
              </>
            )}
          </div>

          <Button
            onClick={handleFinish}
            disabled={isPreparingPreview || isPrinting}
            className="h-12 w-full bg-white hover:bg-[#FAF9F6] border border-[#4A4A4A]/20 text-[#4A4A4A] shadow-sm font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
          >
            KEMBALI KE BERANDA <Home size={16} />
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