"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, RefreshCw, CheckCircle2, ImageIcon, MousePointerClick, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getApiUrl } from "@/lib/api";

export default function SessionStartedPage() {
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const photosRef = useRef<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [frameSlots, setFrameSlots] = useState<any[]>([]);
  const [requiredSelections, setRequiredSelections] = useState(3); 
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    countdown_duration_seconds: 5,
    max_photos_taken: 6, 
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [sessionState, setSessionState] = useState<'initializing' | 'ready' | 'capturing' | 'review' | 'done'>('initializing');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Kamera selector
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // 1. Ambil setting & frame dari localStorage, serta list kamera
  useEffect(() => {
    const savedFrameUrl = localStorage.getItem("selected_frame_url");
    if (!savedFrameUrl) {
      router.push("/frame-selection"); 
      return;
    }
    setFrameUrl(savedFrameUrl);

    // Ekstrak Data Frame
    const frameDataStr = localStorage.getItem("selected_frame_data");
    if (frameDataStr) {
      try {
        const frameData = JSON.parse(frameDataStr);
        let configObj = frameData.config;
        if (typeof configObj === 'string') configObj = JSON.parse(configObj);

        if (configObj && Array.isArray(configObj.slots)) {
          setFrameSlots(configObj.slots);
          if (configObj.slots.length === 6) {
            setRequiredSelections(3);
          } else if (configObj.slots.length > 0) {
            setRequiredSelections(configObj.slots.length);
          }
        }
      } catch (err) {
        console.error("Gagal mengekstrak koordinat frame:", err);
      }
    }

    // List devices
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          const savedCam = localStorage.getItem("selected_kiosk_camera");
          const defaultCam = videoDevices.find(d => d.deviceId === savedCam) || videoDevices[0];
          setSelectedDeviceId(defaultCam.deviceId);
        }
      } catch (e) {
        console.error("Gagal mendapatkan daftar kamera:", e);
      }
    };
    getDevices();
  }, [router]);

  // 2. Efek untuk menyalakan/mengubah kamera preview
  useEffect(() => {
    if (!selectedDeviceId) return;
    localStorage.setItem("selected_kiosk_camera", selectedDeviceId);

    let active = true;
    let localStream: MediaStream | null = null;

    const startWebcamPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          } 
        });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setSessionState('ready');
        }
      } catch (err) {
        console.error("Gagal membuka kamera pilihan:", err);
        // Fallback jika deviceId exact gagal
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (!active) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          localStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setSessionState('ready');
          }
        } catch (fallbackErr) {
          console.error("Webcam tidak ditemukan:", fallbackErr);
          toast.error("Webcam Preview Gagal", { description: "Pastikan webcam laptop menyala untuk preview." });
          setSessionState('ready');
        }
      }
    };

    startWebcamPreview();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // =========================================================================
  // 2. FUNGSI MENJEPRET: MENGIRIM PERINTAH KE DSLR (via digiCamControl)
  // =========================================================================
  const takeSingleShot = async () => {
    // A. Catat nama file foto terakhir sebelum jepret
    let lastFileName = "";
    try {
      // 🚨 MENGGUNAKAN LOCALHOST BUKAN 127.0.0.1
      const preRes = await fetch(getApiUrl(`/api/kiosk/latest-photo?t=${Date.now()}`));
      const preData = await preRes.json();
      if (preData.success) lastFileName = preData.filename;
    } catch (e) {
      console.warn("Server Laravel gagal dicek di awal, pastikan php artisan serve menyala.");
    }

    // B. Hitung Mundur
    for (let c = settings.countdown_duration_seconds; c > 0; c--) {
      setCountdown(c);
      await sleep(1000);
    }
    setCountdown(null);
    setIsFlashing(true);

    // C. SURUH CANON MENJEPRET (BLOK KHUSUS KAMERA)
    try {
      await fetch("http://localhost:5513/?slc=capture&param1=0", { mode: "no-cors" });
    } catch (error) {
      console.error("Gagal menembak kamera fisik:", error);
      setIsFlashing(false);
      toast.error("KAMERA OFFLINE", { description: "Koneksi ke digiCamControl terputus." });
      return null;
    }

    // D. CARI FILE BARU YANG MASUK (BLOK KHUSUS LARAVEL)
    let newPhotoUrl = null;
    let attempts = 0;
    const maxAttempts = 12; // Sabar menunggu file dikirim lewat kabel (maksimal 6 detik)

    try {
      while (attempts < maxAttempts) {
        await sleep(500);
        // 🚨 MENGGUNAKAN LOCALHOST BUKAN 127.0.0.1
        const res = await fetch(getApiUrl(`/api/kiosk/latest-photo?t=${Date.now()}`));
        const data = await res.json();

        if (data.success && data.filename !== lastFileName) {
          newPhotoUrl = data.url + "?cb=" + Date.now();
          break; 
        }
        attempts++;
      }
    } catch (error) {
      console.error("Gagal mengecek folder Laravel:", error);
      setIsFlashing(false);
      toast.error("DATABASE OFFLINE", { description: "Gagal terhubung ke API Laravel." });
      return null;
    }

    setIsFlashing(false);

    if (newPhotoUrl) {
      return newPhotoUrl;
    } else {
      toast.error("TIDAK ADA FOTO MASUK", { description: "Kamera menjepret, tapi file tidak masuk ke folder Laravel." });
      return null;
    }
  };

  const startPhotoSession = async () => {
    setSessionState("capturing");
    photosRef.current = [];
    setPhotos([]);
    setSelectedIndices([]);

    for (let i = 0; i < settings.max_photos_taken; i++) {
      const pic = await takeSingleShot();
      photosRef.current = [...photosRef.current, pic || ""];
      setPhotos([...photosRef.current]);
    }
    setSessionState("review");
  };

  const handleRetakeSpecific = async (indexToRetake: number) => {
    setSessionState("capturing");
    const pic = await takeSingleShot();

    if (pic) {
      const updated = [...photosRef.current];
      updated[indexToRetake] = pic;
      photosRef.current = updated;
      setPhotos([...updated]);
      setSelectedIndices(selectedIndices.filter((i) => i !== indexToRetake));
    }
    setSessionState("review");
  };

  const toggleSelection = (index: number) => {
    if (sessionState !== "review") return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      if (selectedIndices.length >= requiredSelections) {
        toast.error("BINGKAI PENUH");
        return;
      }
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const finishSession = () => {
    if (selectedIndices.length < requiredSelections) {
      toast.error("BELUM LENGKAP");
      return;
    }
    setSessionState("done");
    const finalSelectedPhotos = selectedIndices.map((index) => photosRef.current[index]);
    localStorage.setItem("captured_photos", JSON.stringify(finalSelectedPhotos));
    setTimeout(() => {
      router.push("/result");
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#EFE9DB] flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 font-sans text-retro-charcoal overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* SISI KIRI: LAYAR PREVIEW (MENGGUNAKAN WEBCAM) */}
      <div className="flex-1 min-w-0 relative bg-retro-charcoal border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex flex-col overflow-hidden items-center justify-center">
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-white border-[3px] border-retro-charcoal px-4 py-2 shadow-[4px_4px_0_0_#262626]">
            <h2 className="font-black uppercase tracking-widest text-[#FF0000] text-xs md:text-sm flex items-center gap-2">
              📸 {sessionState === "review" ? "KAMERA RETAKE" : "LIVE PREVIEW"}
            </h2>
          </div>
        </div>

        {/* Dropdown Pilihan Kamera */}
        {devices.length > 1 && sessionState !== "capturing" && (
          <div className="absolute top-4 right-4 z-20">
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-white border-[3px] border-retro-charcoal px-3 py-1.5 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0_0_#262626] focus:outline-none cursor-pointer text-retro-charcoal"
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Kamera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* MENGGUNAKAN VIDEO TAG UNTUK WEBCAM (SANGAT MULUS, BEBAS LAG) */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
        />

        <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-100 ${isFlashing ? "opacity-100" : "opacity-0 pointer-events-none"}`}></div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-[150px] md:text-[300px] font-black text-[#FF0000] drop-shadow-[8px_8px_0_rgba(255,255,255,1)] animate-in zoom-in duration-300">
              {countdown}
            </span>
          </div>
        )}

        {sessionState === "done" && (
          <div className="absolute inset-0 bg-retro-charcoal/95 z-[60] flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
            <h1 className="text-5xl font-black text-[#FF0000]">MANTAP!</h1>
            <p className="font-bold mt-4 tracking-widest uppercase">Memproses Cetakan 2R...</p>
          </div>
        )}

        {sessionState === "ready" && (
          <div className="absolute bottom-10 left-0 w-full flex justify-center z-20">
            <Button
              onClick={startPhotoSession}
              className="bg-[#FF0000] hover:bg-[#d9383a] text-white px-10 h-20 text-2xl font-black uppercase border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] animate-bounce active:translate-y-1 active:shadow-none transition-all"
            >
              <Camera size={36} className="mr-3" /> MULAI BERPOSE
            </Button>
          </div>
        )}
      </div>

      {/* TENGAH: PREVIEW FRAME */}
      {sessionState === "review" && (
        <div className="hidden md:flex w-[340px] xl:w-[420px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex-col animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-retro-charcoal text-white text-center py-4 border-b-[4px] border-retro-charcoal shrink-0">
            <h3 className="font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="text-[#FF0000]" /> Pratinjau Bingkai
            </h3>
          </div>
          <div className="flex-1 bg-[#EFE9DB] p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-[320px] aspect-[2/3] border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] bg-white overflow-hidden">
              {frameSlots.length > 0
                ? frameSlots.map((slot, i) => {
                    const photoIndexToUse = i % requiredSelections;
                    const selectedPhotoIndex = selectedIndices[photoIndexToUse];
                    const photoData = selectedPhotoIndex !== undefined ? photos[selectedPhotoIndex] : null;

                    const dynamicStyle = {
                      left: `${(slot.x / 1200) * 100}%`,
                      top: `${(slot.y / 1800) * 100}%`,
                      width: `${(slot.width / 1200) * 100}%`,
                      height: `${(slot.height / 1800) * 100}%`,
                    };

                    return (
                      <div key={`slot-dinamis-${i}`} className="absolute bg-gray-200 overflow-hidden" style={dynamicStyle}>
                        {photoData ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoData} className="w-full h-full object-cover scale-x-[-1] animate-in zoom-in-95 duration-300" alt={`L-${i}`} />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-black text-[8px] uppercase">SLOT {i + 1}</span>
                        )}
                      </div>
                    );
                  })
                : null}
              {frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frameUrl} alt="Frame Overlay" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* KANAN: GRID FOTO HASIL DSLR */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex flex-col">
        <div className="bg-retro-charcoal text-white text-center py-4 border-b-[4px] border-retro-charcoal shrink-0">
          <h3 className="font-black uppercase tracking-widest flex items-center justify-center gap-2">🖼️ Pilihan Jepretan</h3>
        </div>
        <div className="flex-1 bg-[#EFE9DB] p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-black uppercase text-retro-charcoal mb-4 text-center bg-white border-[2px] border-retro-charcoal p-2 shadow-[2px_2px_0_0_#262626] shrink-0">
            {sessionState === "review" ? (
              <span className="flex items-center justify-center gap-2">
                <MousePointerClick size={16} className="text-[#FF0000]" /> Pilih {requiredSelections} Foto Terbaik Anda
              </span>
            ) : (
              `Menunggu foto diambil... (0/${settings.max_photos_taken})`
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full flex-1 overflow-y-auto pr-2 pb-4 content-start">
            {Array.from({ length: settings.max_photos_taken }).map((_, i) => {
              const photo = photos[i];
              const selectionOrder = selectedIndices.indexOf(i) + 1;
              const isSelected = selectionOrder > 0;

              return (
                <div key={i} className={`flex flex-col border-[3px] border-retro-charcoal bg-white p-2 relative h-max transition-all ${isSelected ? "shadow-[6px_6px_0_0_#FF0000] -translate-y-1" : "shadow-[4px_4px_0_0_#262626]"}`}>
                  <div onClick={() => toggleSelection(i)} className={`w-full overflow-hidden border-[2px] relative flex items-center justify-center cursor-pointer transition-all ${isSelected ? "border-[#FF0000] ring-4 ring-[#FF0000]/20" : "border-retro-charcoal bg-gray-200 hover:opacity-90"}`}>
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} className="w-full h-auto object-contain scale-x-[-1]" alt={`Shot ${i + 1}`} crossOrigin="anonymous" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-in fade-in duration-200">
                            <div className="bg-[#FF0000] text-white w-14 h-14 flex items-center justify-center rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-in zoom-in-50 spin-in-12 duration-300">
                              <Check size={32} strokeWidth={4} />
                            </div>
                            <div className="absolute top-2 right-2 bg-white text-[#FF0000] font-black px-2 py-1 text-[10px] border-2 border-[#FF0000]">URUTAN #{selectionOrder}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-[4/3] w-full flex items-center justify-center bg-gray-200">
                        <ImageIcon className="text-retro-charcoal/20" size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-retro-charcoal text-white font-black px-2 py-0.5 text-[10px] shadow-[2px_2px_0_0_#FF0000] z-10">#{i + 1}</div>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); handleRetakeSpecific(i); }} disabled={sessionState !== "review" || !photo} variant="outline" className="mt-2 h-10 w-full border-[2px] border-retro-charcoal bg-white font-black uppercase text-xs hover:bg-[#FF0000] hover:text-white transition-all shadow-[2px_2px_0_0_#262626] active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                    <RefreshCw size={14} className="mr-2" strokeWidth={3} /> Retake
                  </Button>
                </div>
              );
            })}
          </div>
          {sessionState === "review" && (
            <div className="mt-2 shrink-0 space-y-3 pt-2 border-t-[3px] border-dashed border-retro-charcoal">
              <div className="flex justify-between items-center px-2 font-black uppercase text-sm">
                <span>Total Pilihan:</span>
                <span className="text-[#FF0000] text-lg bg-white px-2 py-1 border-2 border-retro-charcoal shadow-[2px_2px_0_0_#262626]">{selectedIndices.length} / {requiredSelections}</span>
              </div>
              <Button onClick={finishSession} className="w-full h-16 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] font-black text-lg uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                CETAK FOTO <CheckCircle2 className="ml-2" size={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}