"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Image as ImageIcon, Sparkles, CheckCircle2, Clock, FolderClosed, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

interface PhotoAsset {
  id: number;
  name: string;
  type: string;
  image_url: string;
  is_active: boolean;
  event_name?: string;
  config?: unknown;
}

export default function FrameSelectionPage() {
  const router = useRouter();
  const [frames, setFrames] = useState<PhotoAsset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<PhotoAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>("");
  
  // Event & Folder States
  const [activeEvent, setActiveEvent] = useState<string>("Global");
  const [currentTab, setCurrentTab] = useState<"all" | "global" | "event">("all");

  // Timer Sesi
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    const startSessionTimeout = async () => {
      let durationMinutes = 5;
      try {
        const res = await fetch(getApiUrl("/api/kiosk/settings"));
        const json = await res.json();
        if (json.success && json.data) {
          durationMinutes = Number(json.data.session_duration_minutes) || 5;
          setActiveEvent(json.data.active_event_name || "Global");
        }
      } catch (err) {
        console.error("Gagal mengambil konfigurasi settings:", err);
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

  // Mengambil daftar frame aktif dari database
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch(getApiUrl("/api/kiosk/frames"));
        const data = await res.json();
        
        if (!res.ok) throw new Error("Gagal mengambil data bingkai");

        // Hanya ambil data yang bertipe 'frame' dan statusnya 'is_active' = true
        const activeFrames = data.data.filter((item: PhotoAsset) => item.type === 'frame' && item.is_active);
        
        setFrames(activeFrames);
        
        if (activeFrames.length > 0) {
          setSelectedFrame(activeFrames[0]);
        }
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFrames();
  }, []);

  // Filter frame berdasarkan Tab
  const filteredFrames = frames.filter((frame) => {
    if (currentTab === "global") {
      return !frame.event_name || frame.event_name.toLowerCase() === "global" || frame.event_name.toLowerCase() === "none";
    }
    if (currentTab === "event") {
      return frame.event_name && frame.event_name.toLowerCase() === activeEvent.toLowerCase();
    }
    return true; // "all"
  });

  const handleStartSession = () => {
    if (!selectedFrame) return;
    setIsStarting(true);

    localStorage.setItem("selected_frame_id", selectedFrame.id.toString());
    localStorage.setItem("selected_frame_url", selectedFrame.image_url);
    localStorage.setItem("selected_frame_data", JSON.stringify(selectedFrame));

    setTimeout(() => {
      router.push("/session-started"); 
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex flex-col font-sans text-[#4A4A4A] overflow-hidden relative p-6">
      
      {/* Mengimpor Font Premium Cormorant Garamond */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* 1. HEADER AREA */}
      <div className="text-center pb-4 shrink-0 z-10 relative">
        {sessionTimeLeft && (
          <div className="absolute top-0 right-2 bg-[#4A4A4A] text-[#FAF9F6] border border-[#4A4A4A] px-3.5 py-1.5 font-bold text-xs uppercase tracking-widest shadow-md rounded-full flex items-center gap-2 z-50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <Clock size={14} className="text-[#FAF9F6] animate-pulse" />
            <span>{sessionTimeLeft}</span>
          </div>
        )}
        <h1 
          className="text-3xl md:text-4xl font-normal uppercase tracking-[0.15em] drop-shadow-sm text-[#4A4A4A]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          PILIH BINGKAI FOTO
        </h1>
        <p 
          className="text-[10px] md:text-xs font-light tracking-[0.3em] text-[#7A7A7A] mt-2 uppercase opacity-80"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Pilih tema bingkai fotomu di sebelah kiri
        </p>
      </div>

      {/* 2. DUA KARTU UTAMA (SIDE-BY-SIDE GRID) */}
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch py-4">
        
        {/* KARTU KIRI: SELEKTOR EVENT & GRID FRAME */}
        <div className="bg-white border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col h-full overflow-hidden animate-in slide-in-from-left-8 duration-700">
          
          {/* Judul & Folder Info */}
          <div className="flex items-center gap-2 border-b border-[#4A4A4A]/10 pb-4 mb-4 shrink-0">
            <FolderClosed className="text-[#4A4A4A]" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#7A7A7A]">Koleksi Folder Bingkai</h3>
          </div>

          {/* Folder Tabs (Tampil jika activeEvent bukan Global) */}
          {activeEvent !== "Global" && (
            <div className="flex gap-2 mb-4 bg-gray-50 p-1.5 rounded-xl border border-gray-150 shrink-0">
              <button
                onClick={() => setCurrentTab("all")}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentTab === "all"
                    ? "bg-[#4A4A4A] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setCurrentTab("global")}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentTab === "global"
                    ? "bg-[#4A4A4A] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Global (Umum)
              </button>
              <button
                onClick={() => setCurrentTab("event")}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentTab === "event"
                    ? "bg-[#4A4A4A] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Event: {activeEvent}
              </button>
            </div>
          )}

          {/* Grid Scrollable Frame */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-[#4A4A4A]/50 py-10">
                <RefreshCw size={32} className="animate-spin" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Memuat Bingkai...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-6 text-red-500">
                <AlertCircle size={32} className="mb-2" />
                <span className="font-bold uppercase text-center text-xs">{error}</span>
              </div>
            ) : filteredFrames.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-[#7A7A7A] py-10">
                <ImageIcon size={32} className="mb-2 opacity-30" />
                <span className="font-bold uppercase text-center text-xs">Bingkai tidak ditemukan</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 content-start">
                {filteredFrames.map((frame) => {
                  const isSelected = selectedFrame?.id === frame.id;
                  
                  return (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame)}
                      className={`
                        relative transition-all duration-200 aspect-[2/3]
                        border rounded-lg flex flex-col items-center justify-center p-1.5 cursor-pointer
                        ${isSelected 
                          ? "border-[#4A4A4A] bg-[#FAF9F6] shadow-md -translate-y-0.5" 
                          : "border-[#4A4A4A]/10 bg-white hover:bg-gray-50 hover:-translate-y-0.5"
                        }
                      `}
                    >
                      {/* Thumbnail Gambar */}
                      <div className={`w-full h-full border ${isSelected ? 'border-[#4A4A4A]/25' : 'border-[#4A4A4A]/10'} bg-white overflow-hidden p-1 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPg==')] rounded`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={frame.image_url} 
                          alt={frame.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Indikator Terpilih */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-[#4A4A4A] text-white rounded-full p-1 shadow border border-white">
                          <CheckCircle2 size={10} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* KARTU KANAN: PRATINJAU BINGKAI & TOMBOL MULAI */}
        <div className="bg-white border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between h-full overflow-hidden animate-in slide-in-from-right-8 duration-700 delay-200">
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {selectedFrame ? (
              <div className="relative h-full w-full max-w-xs flex flex-col items-center justify-center py-4">
                {/* Tampilan Frame Transparan */}
                <div className="relative w-full aspect-[2/3] max-h-[48vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')] border border-[#4A4A4A]/15 shadow-md bg-white overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedFrame.image_url} 
                    alt={selectedFrame.name}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-lg"
                  />
                </div>
                
                {/* Label Nama Frame */}
                <div className="mt-4 bg-[#4A4A4A] text-white px-5 py-1.5 rounded-full font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5 shadow-sm shrink-0">
                  <Sparkles size={12} /> {selectedFrame.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <ImageIcon size={48} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Pilih bingkai terlebih dahulu</span>
              </div>
            )}
          </div>

          {/* TOMBOL LANJUTKAN */}
          <div className="w-full pt-4 border-t border-[#4A4A4A]/10 shrink-0">
            <Button
              onClick={handleStartSession}
              disabled={!selectedFrame || isStarting}
              className="w-full h-14 text-xs bg-[#4A4A4A] hover:bg-[#333] text-white font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <span>{isStarting ? "MENYIAPKAN KAMERA..." : "MULAI SESI FOTO"}</span>
              <Camera size={16} />
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}