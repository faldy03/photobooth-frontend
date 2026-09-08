"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, RefreshCw, CheckCircle2, ImageIcon, MousePointerClick, Check, Sparkles, Clock, RotateCcw, X, ZoomIn } from "lucide-react";
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
  const [showFramePreviewModal, setShowFramePreviewModal] = useState<boolean>(false);
  const [zoomedPhotoIndex, setZoomedPhotoIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // States untuk Webcam Selector
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
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

  // 0. Ambil konfigurasi sistem terupdate dari backend
  useEffect(() => {
    const fetchKioskSettings = async () => {
      try {
        const res = await fetch(getApiUrl("/api/kiosk/settings"));
        const data = await res.json();
        if (data.success && data.data) {
          setSettings({
            countdown_duration_seconds: Number(data.data.countdown_duration_seconds) || 5,
            max_photos_taken: Number(data.data.max_photos_taken) || 6,
          });
        }
      } catch (err) {
        console.error("Gagal memuat konfigurasi kios dari database:", err);
      }
    };
    fetchKioskSettings();
  }, []);

  // 1. Load data frame dari localStorage pada saat load awal
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
          if (configObj.slots.length === 8) {
            setRequiredSelections(4); // 2R strip dengan 4 foto unik di kiri (diduplikat ke kanan)
          } else if (configObj.slots.length === 6) {
            setRequiredSelections(3); // 2R strip dengan 3 foto unik di kiri (diduplikat ke kanan)
          } else if (configObj.slots.length > 0) {
            setRequiredSelections(configObj.slots.length);
          }
        }
      } catch (err) {
        console.error("Gagal mengekstrak koordinat frame:", err);
      }
    }
  }, [router]);

  // 2. Minta izin akses kamera dan daftarkan semua list videoinput
  useEffect(() => {
    const listWebcams = async () => {
      try {
        // Minta akses kamera agar label perangkat terisi lengkap
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Enumerate semua media input
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);

        // Hentikan stream sementara
        tempStream.getTracks().forEach(track => track.stop());

        if (videoDevices.length > 0) {
          const saved = localStorage.getItem("selected_webcam_id");
          const exists = videoDevices.some(d => d.deviceId === saved);
          setSelectedDeviceId(exists && saved ? saved : videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Gagal mendeteksi webcam di laptop:", err);
        toast.error("Webcam Tidak Ditemukan", { description: "Hubungkan webcam/kamera lalu refresh halaman." });
      }
    };

    listWebcams();
  }, []);

  // 3. Muat Live Stream setiap kali kamera yang dipilih (selectedDeviceId) berubah
  useEffect(() => {
    if (!selectedDeviceId) return;

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
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          localStream = stream;
          setSessionState('ready');
        }
      } catch (err) {
        console.error("Gagal memulai stream webcam terpilih:", err);
        toast.error("Webcam Preview Gagal", { description: "Gagal memuat pratinjau webcam terpilih." });
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
      
      // Saat c === 1: Buat jeda angka 1 lebih singkat (500ms), lalu picu shutter & flash bersamaan
      if (c === 1) {
        await sleep(400);
        // C. SURUH CANON MENJEPRET & NYALAKAN FLASH SEKETIKA
        setIsFlashing(true);
        setCountdown(null);
        fetch("http://127.0.0.1:3001/capture", { method: "POST", mode: "no-cors" }).catch(() => {});
        break;
      }
      
      await sleep(1000);
    }

    // D. CARI FILE BARU YANG MASUK (NATIVE ELECTRON OS EVENT + HIGH-SPEED FALLBACK)
    let newPhotoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 35; // Polling 100ms = 3.5 detik

    let cleanupListener: (() => void) | null = null;

    // 1. Pemicu Utama: Native Electron OS File Event (0ms Delay!)
    const electronPromise = new Promise<string>((resolve) => {
      if (typeof window !== 'undefined' && (window as any).electron?.onPhotoReceived) {
        const unsub = (window as any).electron.onPhotoReceived((photoData: { filename: string; url: string }) => {
          if (photoData && photoData.url && photoData.filename !== lastFileName) {
            console.log('[FRONTEND INSTANT] Foto diterima via Native IPC Event:', photoData.filename);
            resolve(photoData.url);
          }
        });
        if (typeof unsub === 'function') {
          cleanupListener = unsub;
        }
      }
    });

    // 2. Backup Polling (100ms) untuk Laragon Lokal & Cloud
    const pollingPromise = (async () => {
      while (attempts < maxAttempts) {
        await sleep(100);
        
        // Cek Laragon Lokal (http://localhost:8000)
        try {
          const resLocal = await fetch(`http://localhost:8000/api/kiosk/latest-photo?t=${Date.now()}`);
          const dataLocal = await resLocal.json();
          if (dataLocal.success && dataLocal.filename !== lastFileName) {
            return dataLocal.url + "?cb=" + Date.now();
          }
        } catch (e) {}

        // Cek Cloud API Backup
        try {
          const res = await fetch(getApiUrl(`/api/kiosk/latest-photo?t=${Date.now()}`));
          const data = await res.json();
          if (data.success && data.filename !== lastFileName) {
            return data.url + "?cb=" + Date.now();
          }
        } catch (e) {}

        attempts++;
      }
      return null;
    })();

    // Ambil respon tercepat yang mendarat duluan!
    newPhotoUrl = await Promise.race([electronPromise, pollingPromise]);

    if (typeof cleanupListener === 'function') {
      (cleanupListener as () => void)();
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
    if (!photos[index]) {
      toast.error("FOTO KOSONG", { description: "Silakan tekan tombol Retake terlebih dahulu untuk mengisi foto ini." });
      return;
    }
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
    <div className="h-screen w-screen bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 font-sans text-[#4A4A4A] overflow-hidden">
      <Toaster position="top-center" richColors />
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* SISI KIRI: LAYAR PREVIEW (MENGGUNAKAN WEBCAM) */}
      <div className="flex-1 min-w-0 relative bg-retro-charcoal border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden items-center justify-center rounded-xl">
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-white/85 backdrop-blur border border-[#4A4A4A]/15 px-4 py-1.5 rounded-full shadow-sm">
            <h2 className="font-bold uppercase tracking-widest text-[#4A4A4A] text-xs md:text-sm flex items-center gap-2">
              📸 {sessionState === "review" ? "KAMERA RETAKE" : "LIVE PREVIEW"}
            </h2>
          </div>
          {sessionTimeLeft && (
            <div className="bg-[#4A4A4A] text-[#FAF9F6] border border-[#4A4A4A] px-4 py-1.5 rounded-full shadow-md flex items-center gap-2 z-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Clock size={14} className="text-[#FAF9F6] animate-pulse" />
              <span className="font-bold text-xs md:text-sm">{sessionTimeLeft}</span>
            </div>
          )}
        </div>

        {/* SELECTOR KAMERA */}
        {devices.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-white/85 backdrop-blur border border-[#4A4A4A]/15 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDeviceId(id);
                  localStorage.setItem("selected_webcam_id", id);
                }}
                className="bg-transparent font-bold uppercase text-xs focus:outline-none cursor-pointer text-[#4A4A4A]"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-white text-[#4A4A4A] font-bold">
                    {device.label || `Kamera ${device.deviceId.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* MENGGUNAKAN VIDEO TAG UNTUK WEBCAM */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />

        <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-100 ${isFlashing ? "opacity-100" : "opacity-0 pointer-events-none"}`}></div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-150">
            <div className="relative flex items-center justify-center">
              <span 
                className="text-[140px] md:text-[260px] font-black text-white animate-in zoom-in-75 duration-200 tracking-tighter"
                style={{
                  textShadow: "0 0 35px rgba(255, 255, 255, 0.9), 0 0 70px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 1)"
                }}
              >
                {countdown}
              </span>
            </div>
          </div>
        )}

        {sessionState === "done" && (
          <div className="absolute inset-0 bg-white/95 z-[60] flex flex-col items-center justify-center text-[#4A4A4A] backdrop-blur-sm animate-in fade-in duration-500">
            <h1 className="text-4xl md:text-5xl font-normal uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>MANTAP!</h1>
            <p className="font-light tracking-[0.3em] uppercase text-xs">Memproses Cetakan 2R...</p>
          </div>
        )}

        {sessionState === "ready" && (
          <div className="absolute bottom-10 left-0 w-full flex justify-center z-20">
            <Button
              onClick={startPhotoSession}
              className="bg-[#FF0000] hover:bg-[#D90000] text-white px-10 h-16 text-base tracking-widest font-extrabold uppercase border-2 border-white rounded-full shadow-[0_10px_30px_rgba(255,0,0,0.5)] animate-bounce active:scale-95 transition-all cursor-pointer"
            >
              <Camera size={22} className="mr-2.5" /> MULAI BERPOSE
            </Button>
          </div>
        )}
      </div>

      {/* TENGAH: PREVIEW FRAME */}
      {sessionState === "review" && (
        <div className="hidden md:flex w-[340px] xl:w-[400px] shrink-0 bg-white border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-col animate-in slide-in-from-bottom-8 duration-500 rounded-xl overflow-hidden">
          <div className="bg-[#FAF9F6] text-[#4A4A4A] text-center py-3 border-b border-[#4A4A4A]/10 shrink-0">
            <h3 
              className="font-normal uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-1.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <Sparkles size={14} /> Pratinjau Bingkai
            </h3>
          </div>
          <div className="flex-1 bg-[#FAF9F6] p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-[280px] aspect-[2/3] border border-[#4A4A4A]/15 shadow-sm bg-white overflow-hidden rounded-lg">
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
                        <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-[8px] uppercase">SLOT {i + 1}</span>
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

      {/* KANAN: GRID FOTO HASIL DSLR (GRID 2-KOLOM COMPACT & PROPORSIOANL) */}
      <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col rounded-xl overflow-hidden">
        <div className="bg-[#FAF9F6] text-[#4A4A4A] text-center py-2.5 border-b border-[#4A4A4A]/10 shrink-0">
          <h3 
            className="font-normal uppercase tracking-[0.1em] text-xs md:text-sm flex items-center justify-center gap-1.5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Pilihan Jepretan
          </h3>
        </div>
        <div className="flex-1 bg-[#FAF9F6] p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="text-[10px] font-bold uppercase text-[#7A7A7A] mb-2.5 text-center bg-white border border-[#4A4A4A]/10 p-2 rounded-xl shrink-0 shadow-xs">
            {sessionState === "review" ? (
              <span className="flex items-center justify-center gap-1 text-[#4A4A4A]">
                Pilih {requiredSelections} Foto Terbaik Anda
              </span>
            ) : (
              `Menunggu foto diambil... (0/${settings.max_photos_taken})`
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 w-full flex-1 overflow-y-auto pr-1 pb-2 content-start">
            {Array.from({ length: settings.max_photos_taken }).map((_, i) => {
              const photo = photos[i];
              const selectionOrder = selectedIndices.indexOf(i) + 1;
              const isSelected = selectionOrder > 0;

              return (
                <div key={i} className={`flex flex-col border bg-white p-2 relative h-max transition-all rounded-xl shadow-xs ${isSelected ? "border-[#4A4A4A] ring-2 ring-[#4A4A4A]/20 shadow-sm" : "border-gray-200/80"}`}>
                  
                  {/* WADAH GAMBAR JEPRETAN (SENTUH UNTUK ZOOM POP-OUT) */}
                  <div 
                    onClick={() => photo && setZoomedPhotoIndex(i)} 
                    className={`w-full aspect-[4/3] overflow-hidden border relative flex items-center justify-center cursor-pointer transition-all rounded-lg group ${
                      isSelected ? "border-[#4A4A4A]" : "border-gray-200 bg-gray-50 hover:opacity-95"
                    }`}
                  >
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} className="w-full h-full object-cover scale-x-[-1] transition-transform duration-300 group-hover:scale-[1.03]" alt={`Shot ${i + 1}`} crossOrigin="anonymous" />
                        
                        {/* Zoom Hint Badge */}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 opacity-75 group-hover:opacity-100 transition-opacity">
                          <ZoomIn size={9} /> ZOOM
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 bg-black/15 flex items-center justify-center animate-in fade-in duration-200">
                            <div className="bg-[#4A4A4A] text-white w-9 h-9 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-in zoom-in-50 duration-300">
                              <Check size={20} strokeWidth={4} />
                            </div>
                            <div className="absolute top-1.5 right-1.5 bg-[#4A4A4A] text-white font-bold px-1.5 py-0.5 rounded text-[8px] tracking-wider shadow-xs">
                              #{selectionOrder}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100/70 rounded-lg text-gray-400 gap-0.5">
                        <ImageIcon className="opacity-40" size={24} />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Kosong</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 bg-[#4A4A4A]/90 text-white font-bold px-1.5 py-0.5 text-[8px] rounded z-10 shadow-xs">
                      #{i + 1}
                    </div>
                  </div>

                  {/* DUA TOMBOL AKSI RINGKAS: CEKLIS (PILIH) & RETAKE */}
                  <div className="flex gap-1.5 mt-2">
                    <Button
                      onClick={() => toggleSelection(i)}
                      disabled={sessionState !== "review" || !photo}
                      className={`flex-1 h-9 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                      }`}
                    >
                      <CheckCircle2 size={13} className={isSelected ? "text-white" : "text-gray-400"} />
                      <span>{isSelected ? `#${selectionOrder}` : "PILIH"}</span>
                    </Button>

                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRetakeSpecific(i); }}
                      disabled={sessionState !== "review"}
                      variant="outline"
                      className="h-9 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw size={12} />
                      <span>RETAKE</span>
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
          
          {sessionState === "review" && (
            <div className="mt-2 shrink-0 space-y-2.5 pt-2.5 border-t border-[#4A4A4A]/10">
              <div className="flex justify-between items-center px-1 font-bold uppercase text-[11px] text-[#7A7A7A]">
                <span>Terpilih:</span>
                <span className="text-[#4A4A4A] font-bold bg-[#FAF9F6] px-2.5 py-0.5 border border-[#4A4A4A]/10 rounded-lg text-[11px]">
                  {selectedIndices.length} / {requiredSelections}
                </span>
              </div>
              
              <Button 
                onClick={() => setShowFramePreviewModal(true)} 
                disabled={selectedIndices.length < requiredSelections}
                className="w-full h-12 bg-[#FF0000] hover:bg-[#D90000] text-white font-extrabold text-xs tracking-widest uppercase rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>SUDAH FIX / LIHAT BINGKAI</span>
                <Sparkles size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ZOOM FOTO INDIVIDUAL (POP-OUT SAAT FOTO DISENTUH/DIKLIK) */}
      {zoomedPhotoIndex !== null && photos[zoomedPhotoIndex] && (
        <div 
          onClick={() => setZoomedPhotoIndex(null)}
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-3xl shadow-2xl border border-white/20 p-5 md:p-6 max-w-2xl w-full flex flex-col items-center gap-4 relative animate-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Header Modal Zoom */}
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#4A4A4A] text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  FOTO #{zoomedPhotoIndex + 1}
                </span>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider hidden sm:inline">
                  Pratinjau Hasil Jepretan
                </span>
              </div>
              
              <button
                onClick={() => setZoomedPhotoIndex(null)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Gambar Foto Zoomed High Quality */}
            <div className="relative w-full max-h-[60vh] aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photos[zoomedPhotoIndex]} 
                alt={`Zoomed Shot ${zoomedPhotoIndex + 1}`} 
                className="w-full h-full object-contain scale-x-[-1]"
              />
            </div>

            {/* Controls / Action Buttons inside Zoom Modal */}
            <div className="flex gap-3 w-full pt-1">
              <Button
                onClick={() => {
                  toggleSelection(zoomedPhotoIndex);
                }}
                disabled={sessionState !== "review"}
                className={`flex-1 h-12 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedIndices.includes(zoomedPhotoIndex)
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                }`}
              >
                <CheckCircle2 size={18} className={selectedIndices.includes(zoomedPhotoIndex) ? "text-white" : "text-gray-400"} />
                <span>
                  {selectedIndices.includes(zoomedPhotoIndex) 
                    ? `TERPILIH (#${selectedIndices.indexOf(zoomedPhotoIndex) + 1})` 
                    : "PILIH FOTO INI"}
                </span>
              </Button>

              <Button
                onClick={() => {
                  const idx = zoomedPhotoIndex;
                  setZoomedPhotoIndex(null);
                  handleRetakeSpecific(idx);
                }}
                disabled={sessionState !== "review"}
                variant="outline"
                className="h-12 px-5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={16} />
                <span>RETAKE</span>
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL TRANSISI PRATINJAU BINGKAI FOTO (MUNCUL SAAT USER KLIK SUDAH FIX) */}
      {showFramePreviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-6 max-w-xl w-full flex flex-col items-center gap-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-gray-900 flex items-center justify-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                <Sparkles className="text-amber-500" size={24} /> Pratinjau Bingkai Foto
              </h2>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest mt-1 font-semibold">
                Foto-foto terpilih Anda telah dipasang ke dalam slot bingkai.
              </p>
            </div>

            {/* Frame Preview Display (Tampil Besar & Jelas) */}
            <div className="relative w-full max-w-[300px] md:max-w-[340px] aspect-[2/3] border border-gray-200 shadow-xl bg-gray-50 overflow-hidden rounded-2xl">
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
                    <div key={`modal-slot-${i}`} className="absolute bg-gray-200 overflow-hidden" style={dynamicStyle}>
                      {photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoData} className="w-full h-full object-cover scale-x-[-1] animate-in zoom-in-95 duration-300" alt={`Slot-${i}`} />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-[10px] uppercase">SLOT {i + 1}</span>
                      )}
                    </div>
                  );
                })
                : null}
              {frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frameUrl} alt="Frame Overlay" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 drop-shadow" />
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2 border-t border-gray-100">
              <Button
                onClick={() => setShowFramePreviewModal(false)}
                variant="outline"
                className="flex-1 h-13 border border-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-gray-50"
              >
                <RotateCcw size={16} className="mr-1.5" /> Ganti / Ubah Pilihan
              </Button>
              <Button
                onClick={finishSession}
                className="flex-1 h-13 bg-[#FF0000] hover:bg-[#D90000] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer border-none"
              >
                CETAK FOTO SEKARANG <CheckCircle2 size={18} className="ml-1.5" />
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}