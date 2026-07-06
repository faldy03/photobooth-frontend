"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Loader2, RefreshCw, CheckCircle2, ImageIcon, MousePointerClick, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export default function SessionStartedPage() {
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photosRef = useRef<string[]>([]);

  // ==========================================
  // KONSTANTA BINGKAI 2R (3 LUBANG KEMBAR)
  // ==========================================
  const REQUIRED_SELECTIONS = 3; 

  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    countdown_duration_seconds: 5,
    max_photos_taken: 6, 
  });
  
  const [cameraError, setCameraError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const [sessionState, setSessionState] = useState<'initializing' | 'ready' | 'capturing' | 'review' | 'done'>('initializing');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [currentShot, setCurrentShot] = useState(1);

  useEffect(() => {
    const savedFrameUrl = localStorage.getItem("selected_frame_url");
    if (!savedFrameUrl) {
      router.push("/frame-selection"); 
      return;
    }
    setFrameUrl(savedFrameUrl);

    const fetchSettings = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/kiosk/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setSettings({
            countdown_duration_seconds: Number(json.data.countdown_duration_seconds) || 5,
            max_photos_taken: Number(json.data.max_photos_taken) || 6,
          });
        }
      } catch (err) {
        console.error("Gagal memuat setting, menggunakan default.");
      }
    };
    fetchSettings();

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setSessionState('ready');
        }
      } catch (err) {
        setCameraError("Kamera tidak ditemukan.");
        setSessionState('initializing');
      }
    };
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [router]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (context) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    }
    return null;
  };

  const takeSingleShot = async (shotIndex: number) => {
    setCurrentShot(shotIndex);
    for (let c = settings.countdown_duration_seconds; c > 0; c--) {
      setCountdown(c);
      await sleep(1000);
    }
    setCountdown(null);

    setIsFlashing(true);
    await sleep(50); 
    const photo = captureFrame();
    await sleep(250); 
    setIsFlashing(false);
    return photo;
  };

  const startPhotoSession = async () => {
    setSessionState('capturing');
    photosRef.current = [];
    setPhotos([]);
    setSelectedIndices([]); 

    for (let i = 0; i < settings.max_photos_taken; i++) {
      const pic = await takeSingleShot(i + 1);
      if (pic) {
        photosRef.current = [...photosRef.current, pic];
        setPhotos([...photosRef.current]);
      }
    }
    setSessionState('review');
  };

  const handleRetakeSpecific = async (indexToRetake: number) => {
    setSessionState('capturing');
    const pic = await takeSingleShot(indexToRetake + 1);
    
    if (pic) {
      const updated = [...photosRef.current];
      updated[indexToRetake] = pic;
      photosRef.current = updated;
      setPhotos([...updated]);
      
      setSelectedIndices(selectedIndices.filter((i) => i !== indexToRetake));
    }
    setSessionState('review');
  };

  const toggleSelection = (index: number) => {
    if (sessionState !== 'review') return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      if (selectedIndices.length >= REQUIRED_SELECTIONS) {
        toast.error("BINGKAI PENUH", { description: `Bingkai 2R hanya membutuhkan ${REQUIRED_SELECTIONS} foto. Batalkan pilihan lain dulu.` });
        return;
      }
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const finishSession = () => {
    if (selectedIndices.length < REQUIRED_SELECTIONS) {
      toast.error("BELUM LENGKAP", { 
        description: `Silakan pilih ${REQUIRED_SELECTIONS - selectedIndices.length} foto lagi untuk memenuhi bingkai.` 
      });
      return;
    }

    setSessionState('done');
    const finalSelectedPhotos = selectedIndices.map(index => photosRef.current[index]);
    localStorage.setItem("captured_photos", JSON.stringify(finalSelectedPhotos));
    
    setTimeout(() => {
      router.push("/result");
    }, 2000);
  };

  if (cameraError) {
    return (
      <div className="min-h-screen bg-[#EFE9DB] flex items-center justify-center p-6 text-retro-charcoal">
        <div className="bg-red-100 border-[4px] border-retro-charcoal p-8 flex flex-col items-center shadow-[12px_12px_0_0_#262626]">
          <AlertCircle size={64} className="text-[#FF0000] mb-4" />
          <h1 className="text-2xl font-black">Akses Kamera Gagal</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#EFE9DB] flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 font-sans text-retro-charcoal overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* ================================================== */}
      {/* 1. SISI KIRI: KAMERA UTAMA                         */}
      {/* ================================================== */}
      <div className="flex-1 min-w-0 relative bg-retro-charcoal border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex flex-col overflow-hidden">
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-white border-[3px] border-retro-charcoal px-4 py-2 shadow-[4px_4px_0_0_#262626]">
            <h2 className="font-black uppercase tracking-widest text-[#FF0000] text-xs md:text-sm">
              {sessionState === 'review' ? "📸 KAMERA RETAKE" : "📸 LIVE KAMERA"}
            </h2>
          </div>
        </div>

        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />

        <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-100 ${isFlashing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-[150px] md:text-[300px] font-black text-[#FF0000] drop-shadow-[8px_8px_0_rgba(255,255,255,1)] animate-in zoom-in duration-300">
              {countdown}
            </span>
          </div>
        )}

        {sessionState === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-retro-charcoal/80 backdrop-blur-sm">
            <Loader2 className="animate-spin mb-4" size={48} />
          </div>
        )}

        {sessionState === 'done' && (
          <div className="absolute inset-0 bg-retro-charcoal/95 z-[60] flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
            <h1 className="text-5xl font-black text-[#FF0000]">MANTAP!</h1>
            <p className="font-bold mt-4 tracking-widest uppercase">Memproses Cetakan 2R...</p>
          </div>
        )}

        {sessionState === 'ready' && (
          <div className="absolute bottom-10 left-0 w-full flex justify-center z-20">
            <Button onClick={startPhotoSession} className="bg-[#FF0000] hover:bg-[#d9383a] text-white px-10 h-20 text-2xl font-black uppercase border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] animate-bounce active:translate-y-1 active:shadow-none transition-all">
              <Camera size={36} className="mr-3"/> MULAI BERPOSE
            </Button>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 2. TENGAH: PREVIEW FRAME 2R (ABSOLUTE POSITIONING) */}
      {/* ================================================== */}
      {sessionState === 'review' && (
        <div className="hidden md:flex w-[340px] xl:w-[420px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex-col animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-retro-charcoal text-white text-center py-4 border-b-[4px] border-retro-charcoal shrink-0">
            <h3 className="font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="text-[#FF0000]" /> Pratinjau 2R Strip
            </h3>
          </div>
          
          <div className="flex-1 bg-[#EFE9DB] p-4 flex flex-col items-center justify-center overflow-hidden">
            
            {/* WADAH CETAK 4x6 (Rasio 2:3) */}
            <div className="relative w-full max-w-[320px] aspect-[2/3] border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] bg-white overflow-hidden">
              
              {/* ================= LAYER 0: KOORDINAT ABSOLUT FOTO MENTAH ================= */}
              {Array.from({ length: REQUIRED_SELECTIONS }).map((_, i) => {
                const selectedPhotoIndex = selectedIndices[i];
                const photoData = selectedPhotoIndex !== undefined ? photos[selectedPhotoIndex] : null;
                
                // Koordinat presisi sesuai lubang SVG Generator (Rasio 1200x1800)
                // Y1: 320/1800 = 17.777%, Y2: 720/1800 = 40%, Y3: 1120/1800 = 62.222%
                const topPos = i === 0 ? '17.777%' : i === 1 ? '40%' : '62.222%';
                
                // Dimensi Box Foto: Lebar 480/1200 = 40%, Tinggi 360/1800 = 20%
                const boxStyle = { top: topPos, width: '40%', height: '20%' };

                return (
                  <div key={`slots-${i}`}>
                    {/* --- SLOT STRIP KIRI (X: 60/1200 = 5%) --- */}
                    <div className="absolute bg-gray-200 overflow-hidden" style={{ ...boxStyle, left: '5%' }}>
                      {photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoData} className="w-full h-full object-cover scale-x-[-1] animate-in zoom-in-95 duration-300" alt={`L-${i}`} />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-black text-[8px] uppercase">SLOT {i + 1}</span>
                      )}
                    </div>

                    {/* --- SLOT STRIP KANAN (X: 660/1200 = 55%) --- */}
                    <div className="absolute bg-gray-200 overflow-hidden" style={{ ...boxStyle, left: '55%' }}>
                      {photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoData} className="w-full h-full object-cover scale-x-[-1] animate-in zoom-in-95 duration-300" alt={`R-${i}`} />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-black text-[8px] uppercase">SLOT {i + 1}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ================= LAYER 1: FRAME OVERLAY PNG ================= */}
              {frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={frameUrl} 
                  alt="Frame Overlay" 
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" 
                />
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. SISI KANAN: GRID FOTO MENTAH UNTUK DISELEKSI   */}
      {/* ================================================== */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-white border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex flex-col">
        <div className="bg-retro-charcoal text-white text-center py-4 border-b-[4px] border-retro-charcoal shrink-0">
          <h3 className="font-black uppercase tracking-widest flex items-center justify-center gap-2">
            🖼️ Pilihan Jepretan
          </h3>
        </div>
        
        <div className="flex-1 bg-[#EFE9DB] p-4 flex flex-col min-h-0 overflow-hidden">
          
          <div className="text-xs font-black uppercase text-retro-charcoal mb-4 text-center bg-white border-[2px] border-retro-charcoal p-2 shadow-[2px_2px_0_0_#262626] shrink-0">
            {sessionState === 'review' ? (
              <span className="flex items-center justify-center gap-2">
                <MousePointerClick size={16} className="text-[#FF0000]" /> 
                Pilih {REQUIRED_SELECTIONS} Foto Terbaik Anda
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
                <div key={i} className={`flex flex-col border-[3px] border-retro-charcoal bg-white p-2 relative h-max transition-all ${isSelected ? 'shadow-[6px_6px_0_0_#FF0000] -translate-y-1' : 'shadow-[4px_4px_0_0_#262626]'}`}>
                  
                  <div 
                    onClick={() => toggleSelection(i)}
                    className={`w-full overflow-hidden border-[2px] relative flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'border-[#FF0000] ring-4 ring-[#FF0000]/20' : 'border-retro-charcoal bg-gray-200 hover:opacity-90'}`}
                  >
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} className="w-full h-auto object-contain scale-x-[-1]" alt={`Shot ${i+1}`} />
                        
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-in fade-in duration-200">
                            <div className="bg-[#FF0000] text-white w-14 h-14 flex items-center justify-center rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-in zoom-in-50 spin-in-12 duration-300">
                              <Check size={32} strokeWidth={4} />
                            </div>
                            <div className="absolute top-2 right-2 bg-white text-[#FF0000] font-black px-2 py-1 text-[10px] border-2 border-[#FF0000]">
                              URUTAN #{selectionOrder}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-[4/3] w-full flex items-center justify-center bg-gray-200">
                        <ImageIcon className="text-retro-charcoal/20" size={32} />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 bg-retro-charcoal text-white font-black px-2 py-0.5 text-[10px] shadow-[2px_2px_0_0_#FF0000] z-10">
                      #{i + 1}
                    </div>
                  </div>

                  <Button 
                    onClick={(e) => { e.stopPropagation(); handleRetakeSpecific(i); }}
                    disabled={sessionState !== 'review' || !photo}
                    variant="outline"
                    className="mt-2 h-10 w-full border-[2px] border-retro-charcoal bg-white font-black uppercase text-xs hover:bg-[#FF0000] hover:text-white transition-all shadow-[2px_2px_0_0_#262626] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                  >
                    <RefreshCw size={14} className="mr-2" strokeWidth={3} /> Retake
                  </Button>
                </div>
              );
            })}
          </div>

          {sessionState === 'review' && (
            <div className="mt-2 shrink-0 space-y-3 pt-2 border-t-[3px] border-dashed border-retro-charcoal">
              <div className="flex justify-between items-center px-2 font-black uppercase text-sm">
                <span>Total Pilihan:</span>
                <span className="text-[#FF0000] text-lg bg-white px-2 py-1 border-2 border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                  {selectedIndices.length} / {REQUIRED_SELECTIONS}
                </span>
              </div>
              <Button 
                onClick={finishSession}
                className="w-full h-16 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] font-black text-lg uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
              >
                CETAK FOTO <CheckCircle2 className="ml-2" size={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}