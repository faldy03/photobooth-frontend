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
  Clock,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getApiUrl } from "@/lib/api";

const FILTERS = [
  { id: "original", name: "Original", value: "none", image_url: undefined },
  { id: "bw", name: "B&W Klasik", value: "grayscale(100%) contrast(1.1)", image_url: undefined },
  { id: "vintage", name: "Vintage Retro", value: "sepia(50%) contrast(0.95) brightness(1.05)", image_url: undefined },
  { id: "warm", name: "Warm / Hangat", value: "sepia(20%) saturate(1.15) contrast(1.02)", image_url: undefined },
  { id: "cool", name: "Cool / Nordik", value: "saturate(0.8) hue-rotate(-10deg) brightness(1.02)", image_url: undefined },
  { id: "vivid", name: "Vivid Cerah", value: "contrast(1.15) saturate(1.2) brightness(1.02)", image_url: undefined },
  { id: "noir", name: "Dramatic Noir", value: "grayscale(100%) contrast(1.4) brightness(0.95)", image_url: undefined },
  { id: "teal", name: "Cinematic Teal", value: "contrast(1.1) saturate(1.1) hue-rotate(-15deg) brightness(0.98)", image_url: undefined },
  { id: "gold", name: "Summer Gold", value: "sepia(25%) saturate(1.3) contrast(1.05) brightness(1.02)", image_url: undefined },
  { id: "lomo", name: "Lomo Retro", value: "saturate(1.4) contrast(1.25) brightness(0.98)", image_url: undefined },
  { id: "fade", name: "Soft Fade", value: "contrast(0.85) saturate(0.9) brightness(1.08) sepia(10%)", image_url: undefined },
  { id: "ice", name: "Cold Ice", value: "saturate(0.7) hue-rotate(15deg) brightness(1.04) contrast(0.95)", image_url: undefined }
];

export default function ResultPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State Management
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isPreparingPreview, setIsPreparingPreview] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [rawPhotos, setRawPhotos] = useState<string[]>([]);
  const [transactionIdNum, setTransactionIdNum] = useState<number>(NaN);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>("");
  
  // Alur Langkah & Filter
  const [currentStep, setCurrentStep] = useState<"filter" | "print">("filter");
  const [selectedFilter, setSelectedFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selected_filter") || "original";
    }
    return "original";
  });

  // Fitur Reprint & Database Filters
  const [reprintPriceText, setReprintPriceText] = useState("Rp 15.000");
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [dbFilters, setDbFilters] = useState<any[]>([]);

  // A. Timer Sesi Dinamis mengikuti system_setting (session_duration_minutes)
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    const startSessionTimeout = async () => {
      let durationMinutes = 5;
      try {
        const res = await fetch(getApiUrl("/api/kiosk/settings"));
        const json = await res.json();
        if (json.success && json.data) {
          durationMinutes = Number(json.data.session_duration_minutes) || 5;
          if (json.data.price_per_reprint) {
            const price = Number(json.data.price_per_reprint);
            setReprintPriceText(`Rp ${price.toLocaleString("id-ID")}`);
          }
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
          localStorage.removeItem("selected_filter");
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

  // B. SMART CROP ANTI-PENYOK
  const drawImageProp = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip(); 
    
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let renderW, renderH, renderX, renderY;

    if (imgRatio > boxRatio) {
      renderH = h;
      renderW = img.width * (h / img.height);
      renderX = x - (renderW - w) / 2; 
      renderY = y;
    } else {
      renderW = w;
      renderH = img.height * (w / img.width);
      renderX = x;
      renderY = y - (renderH - h) / 2; 
    }
    
    ctx.drawImage(img, renderX, renderY, renderW, renderH);
    ctx.restore();
  };

  // C. Inisialisasi Data awal & database filters
  useEffect(() => {
    const frameUrlData = localStorage.getItem("selected_frame_url");
    const photosData = localStorage.getItem("captured_photos");
    const transactionId = localStorage.getItem("transaction_id");

    if (!frameUrlData || !photosData) {
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
    setFrameUrl(frameUrlData);

    // Ambil Filter Visual Aktif dari Database
    const fetchFilters = async () => {
      try {
        const res = await fetch(getApiUrl("/api/kiosk/filters"));
        const json = await res.json();
        if (json.success && json.data) {
          setDbFilters(json.data);
        }
      } catch (err) {
        console.error("Gagal memuat filter dari database:", err);
      }
    };
    fetchFilters();

    // Cek callback reprint pembayaran sukses
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reprint_success") === "true") {
        window.history.replaceState({}, '', '/result');
        setShouldAutoPrint(true);
        setCurrentStep("print");
        toast.success("PEMBAYARAN TAMBAHAN BERHASIL!", { description: "Mengirim ulang cetakan ke mesin printer..." });
      }
    }
  }, [router]);

  // Gabungkan filter lokal dan filter database
  const allFiltersList = [
    ...FILTERS,
    ...dbFilters.map((dbF) => {
      let cssVal = "none";
      if (dbF.config) {
        try {
          const parsed = typeof dbF.config === "string" ? JSON.parse(dbF.config) : dbF.config;
          cssVal = parsed.css_filter || "none";
        } catch (e) {
          console.error("Gagal parse config css_filter:", e);
        }
      }
      return {
        id: `db-${dbF.id}`,
        name: dbF.name,
        value: cssVal,
        image_url: dbF.image_url,
      };
    })
  ];

  // D. Efek Redraw Canvas Setiap Kali Filter Berubah
  useEffect(() => {
    if (!frameUrl || rawPhotos.length === 0) return;

    const generatePreview = async () => {
      setIsPreparingPreview(true);
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

        // Resolusi filter yang dipilih
        const activeFilterObj = allFiltersList.find((f) => f.id === selectedFilter) || allFiltersList[0];
        const cssFilterValue = activeFilterObj ? activeFilterObj.value : "none";

        // 1. MENGGAMBAR FOTO RAW (DENGAN SMART CROP, CANVAS FILTER, & TEXTURE OVERLAYS)
        if (slots.length > 0) {
          for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const photoIndex = i % rawPhotos.length; 
            const img = await loadSafeImage(rawPhotos[photoIndex], `Foto #${photoIndex + 1}`);

            ctx.save();
            ctx.translate(slot.x + slot.width, slot.y);
            ctx.scale(-1, 1); 
            
            // Terapkan Filter Visual ke Kanvas
            ctx.filter = cssFilterValue;
            
            drawImageProp(ctx, img, 0, 0, slot.width, slot.height);
            ctx.restore();

            // Jika filter dari database memiliki gambar overlay png transparan
            if (activeFilterObj && activeFilterObj.image_url) {
              try {
                const overlayImg = await loadSafeImage(activeFilterObj.image_url, `Overlay Filter ${activeFilterObj.name}`);
                ctx.drawImage(overlayImg, slot.x, slot.y, slot.width, slot.height);
              } catch (e) {
                console.warn("Gagal memuat image filter overlay", e);
              }
            }
          }
        } else {
          for (let i = 0; i < rawPhotos.length; i++) {
            const img = await loadSafeImage(rawPhotos[i], `Foto #${i + 1}`);
            const w = 480, h = 360;
            const yPositions = [320, 720, 1120];
            const y = yPositions[i];

            [60, 660].forEach(async (x) => {
              ctx.save();
              ctx.translate(x + w, y);
              ctx.scale(-1, 1);
              
              // Terapkan Filter Visual ke Kanvas
              ctx.filter = cssFilterValue;
              
              drawImageProp(ctx, img, 0, 0, w, h);
              ctx.restore();

              // Jika filter memiliki gambar overlay png transparan
              if (activeFilterObj && activeFilterObj.image_url) {
                try {
                  const overlayImg = await loadSafeImage(activeFilterObj.image_url, `Overlay Filter ${activeFilterObj.name}`);
                  ctx.drawImage(overlayImg, x, y, w, h);
                } catch (e) {
                  console.warn("Gagal memuat image filter overlay", e);
                }
              }
            });
          }
        }

        // 2. MENGGAMBAR FRAME OVERLAY (Tanpa filter agar frame tetap tajam)
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

    generatePreview();
  }, [frameUrl, rawPhotos, selectedFilter, dbFilters]);

  // E. Pemicu Cetak Otomatis (Jika Kembali dari Reprint Sukses)
  useEffect(() => {
    if (mergedImage && shouldAutoPrint) {
      setShouldAutoPrint(false);
      handlePrint();
    }
  }, [mergedImage, shouldAutoPrint]);

  const handleSelectFilter = (filterId: string) => {
    setSelectedFilter(filterId);
    localStorage.setItem("selected_filter", filterId);
  };

  const handlePrint = async () => {
    if (!mergedImage) return;
    
    setIsPrinting(true);
    setErrorMsg(null);

    try {
      // 1. Simpan ke Database & Request QR Download Link (Selalu simpan / update)
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

      const textLaravel = await responseLaravel.text();
      let resultLaravel;
      try {
        resultLaravel = JSON.parse(textLaravel);
      } catch (parseError) {
        console.error("Laravel membalas dengan HTML/Error Server:", textLaravel);
        throw new Error("Server Database Laravel gagal merespon dengan benar.");
      }

      if (!resultLaravel.success) {
        throw new Error(resultLaravel.message || "Gagal menyimpan data.");
      }

      setQrUrl(resultLaravel.download_link);

      // 2. Kirim perintah cetak ke mesin printer
      const pureBase64 = mergedImage.replace(/^data:image\/\w+;base64,/, "");

      if (typeof window !== 'undefined' && (window as any).electron) {
        try {
          (window as any).electron.printPhoto(mergedImage);
          toast.success("Foto Sedang Dicetak!", { description: "Silakan ambil foto fisik Anda di mesin printer." });
        } catch (elecError) {
          console.error("Gagal cetak melalui Electron IPC:", elecError);
          toast.error("Gagal Mencetak", { description: "Gagal terhubung ke modul cetak Electron." });
        }
      } else {
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

          if (!responseNode.ok) throw new Error("Respon Node.js tidak OK");
          
          toast.success("Foto Sedang Dicetak!", { description: "Silakan ambil foto fisik Anda di mesin printer." });
        } catch (nodeError) {
          console.error("Gagal koneksi ke Node.js Printer:", nodeError);
          toast.warning("Soft File Siap", { description: "Namun gagal terhubung ke printer fisik." });
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

  const handleReprintRedirect = () => {
    router.push("/checkout?type=reprint");
  };

  const handleFinish = () => {
    localStorage.removeItem("captured_photos");
    localStorage.removeItem("selected_frame_url");
    localStorage.removeItem("selected_frame_data"); 
    localStorage.removeItem("selected_filter");
    localStorage.removeItem("transaction_id");
    router.push("/");
  };

  return (
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
          <div className="absolute top-0 right-8 bg-[#4A4A4A] text-[#FAF9F6] border border-[#4A4A4A] px-3.5 py-1.5 font-bold text-xs uppercase tracking-widest shadow-md rounded-full flex items-center gap-2 z-50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <Clock size={14} className="text-[#FAF9F6] animate-pulse" />
            <span className="font-bold text-xs md:text-sm">{sessionTimeLeft}</span>
          </div>
        )}
        <div className="bg-white border border-[#4A4A4A]/10 px-6 py-2 shadow-sm rounded-full">
          <h1 
            className="text-base md:text-lg font-normal uppercase tracking-[0.15em] text-[#4A4A4A] flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <Printer size={20} /> {currentStep === "filter" ? "PILIHAN FILTER FOTO" : "STUDIO PENCETAKAN"}
          </h1>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-24 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center font-sans">
        
        {/* SISI KIRI: PRATINJAU CETAKAN (CANVAS PREVIEW) */}
        <div className="w-full max-w-[340px] shrink-0 bg-white border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative rounded-xl overflow-hidden animate-in slide-in-from-left-8 duration-700">
          <div className="bg-[#FAF9F6] text-[#4A4A4A] text-center py-3 border-b border-[#4A4A4A]/10 shrink-0">
            <h3 
              className="font-normal uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-1.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <Sparkles size={14} /> Pratinjau Hasil
            </h3>
          </div>

          <div className="p-4 bg-gray-55 flex items-center justify-center min-h-[460px]">
            {isPreparingPreview ? (
              <div className="flex flex-col items-center justify-center text-[#4A4A4A]">
                <Loader2 size={36} className="animate-spin mb-3 text-[#4A4A4A]" />
                <p className="font-bold uppercase tracking-widest text-[10px]">
                  Memproses Filter...
                </p>
              </div>
            ) : (
              <div className="relative group w-full">
                {mergedImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mergedImage}
                    alt="Final Print Preview"
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

        {/* SISI KANAN: LANGKAH FILTER ATAU PRINT */}
        <div className="flex-1 max-w-[460px] flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 delay-200">
          
          {currentStep === "filter" ? (
            /* ================= LANGKAH 1: PILIH FILTER ================= */
            <div className="bg-white border border-[#4A4A4A]/10 p-6 shadow-sm flex flex-col gap-4 rounded-xl w-full">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#4A4A4A] mb-1">
                  Pilih Efek Filter
                </h3>
                <p className="text-[10px] text-[#7A7A7A] uppercase tracking-wider font-semibold">Terapkan filter visual favorit Anda ke foto</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 max-h-[36vh] overflow-y-auto pr-1">
                {allFiltersList.map((f) => {
                  const isActive = selectedFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFilter(f.id)}
                      className={`p-4 border rounded-xl text-center transition-all font-bold uppercase text-[10px] tracking-wider cursor-pointer ${
                        isActive
                          ? "border-[#4A4A4A] bg-[#FAF9F6] shadow-sm text-[#4A4A4A]"
                          : "border-[#4A4A4A]/10 bg-white hover:bg-[#FAF9F6] text-[#7A7A7A]"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => {
                  setCurrentStep("print");
                  handlePrint(); // Panggil fungsi cetak & generate QR otomatis ketika klik lanjut
                }}
                disabled={isPreparingPreview}
                className="h-14 w-full bg-[#4A4A4A] hover:bg-[#333] text-white border-none font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Lanjut ke Cetakan</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            /* ================= LANGKAH 2: HASIL CETAKAN & QR ================= */
            <div className="flex flex-col gap-6 w-full">
              
              {/* Status Box */}
              <div className="bg-white border border-[#4A4A4A]/10 p-8 shadow-sm text-center rounded-xl">
                {isPrinting ? (
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
                ) : (
                  <>
                    <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" strokeWidth={2} />
                    <h2 className="text-2xl font-normal uppercase text-[#4A4A4A] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>SELESAI!</h2>
                    <p className="font-bold text-[#7A7A7A] uppercase tracking-widest text-xs">
                      Foto fisik Anda sedang dicetak otomatis.
                    </p>
                  </>
                )}
              </div>

              {/* QR Code Soft File Box */}
              <div className={`bg-white border border-[#4A4A4A]/10 p-6 shadow-sm flex flex-col items-center text-center transition-all duration-500 rounded-xl ${isPrinting ? "opacity-50 grayscale pointer-events-none" : "opacity-100"}`}>
                {qrUrl ? (
                  <>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] border-b border-[#4A4A4A]/10 pb-2.5 w-full mb-4 flex items-center justify-center gap-1.5 text-[#7A7A7A]">
                      <QrCode size={16} className="text-[#4A4A4A]" /> Scan Soft File
                    </h3>

                    <div className="bg-white border border-[#4A4A4A]/10 p-3 mb-3 inline-block rounded-lg shadow-sm">
                      <QRCodeSVG value={qrUrl} size={160} level={"H"} includeMargin={false} />
                    </div>

                    <p className="text-[10px] font-bold text-yellow-600 uppercase mb-3 animate-pulse">
                      ⚠️ Tersedia hanya selama 60 menit!
                    </p>

                    <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="w-full mt-2 block font-bold">
                      <Button type="button" className="w-full h-10 border border-[#4A4A4A]/10 bg-[#FAF9F6] hover:bg-white text-[#4A4A4A] font-bold uppercase tracking-widest text-[9px] rounded-lg cursor-pointer">
                        🧪 Buka Link di Tab Baru
                      </Button>
                    </a>

                    {/* FITUR PRINT TAMBAHAN / REPRINT */}
                    <div className="w-full border-t border-dashed border-[#4A4A4A]/15 mt-5 pt-5">
                      <Button
                        onClick={handleReprintRedirect}
                        disabled={isPrinting}
                        className="w-full h-12 bg-[#FF0000] hover:bg-[#d9383a] text-white border-none font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer size={14} /> Cetak Lembar Tambahan ({reprintPriceText})
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Loader2 size={24} className="animate-spin mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Menghasilkan QR Code...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentStep("filter")}
                  disabled={isPrinting}
                  variant="outline"
                  className="h-12 flex-1 border border-[#4A4A4A]/20 bg-white text-[#4A4A4A] shadow-sm font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Ganti Filter
                </Button>

                <Button
                  onClick={handleFinish}
                  disabled={isPrinting}
                  className="h-12 flex-1 bg-white hover:bg-[#FAF9F6] border border-[#4A4A4A]/20 text-[#4A4A4A] shadow-sm font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Beranda <Home size={16} />
                </Button>
              </div>

            </div>
          )}

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