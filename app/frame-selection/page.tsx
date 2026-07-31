"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Image as ImageIcon, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

// 1. TAMBAH STRUKTUR CONFIG DI INTERFACE
interface PhotoAsset {
  id: number;
  name: string;
  type: string;
  image_url: string;
  is_active: boolean;
  config?: unknown; // Menampung JSON array koordinat dari database
}

export default function FrameSelectionPage() {
  const router = useRouter();
  const [frames, setFrames] = useState<PhotoAsset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<PhotoAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>("");

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
        
        // Pilih frame pertama secara otomatis sebagai default
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

  const handleStartSession = () => {
    if (!selectedFrame) return;
    setIsStarting(true);

    // Simpan URL dan ID untuk kebutuhan standar
    localStorage.setItem("selected_frame_id", selectedFrame.id.toString());
    localStorage.setItem("selected_frame_url", selectedFrame.image_url);

    // =========================================================================
    // INI KUNCI UTAMANYA: Simpan seluruh objek frame (termasuk koordinat JSON)
    // agar bisa dibaca oleh ResultPage untuk memotong foto secara presisi!
    // =========================================================================
    localStorage.setItem("selected_frame_data", JSON.stringify(selectedFrame));

    // Efek transisi sebelum pindah halaman
    setTimeout(() => {
      router.push("/session-started"); // Sesuaikan dengan rute halaman kamera Anda
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex flex-col font-sans text-[#4A4A4A] overflow-hidden relative">
      {/* Mengimpor Font Premium Cormorant Garamond */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* 1. HEADER AREA */}
      <div className="text-center pt-8 pb-4 shrink-0 z-10 relative">
        {sessionTimeLeft && (
          <div className="absolute top-4 right-6 bg-[#4A4A4A] text-[#FAF9F6] border border-[#4A4A4A] px-3.5 py-1.5 font-bold text-xs uppercase tracking-widest shadow-md rounded-full flex items-center gap-2 z-50">
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
          Geser daftar di bawah untuk memilih gaya fotomu
        </p>
      </div>

      {/* 2. AREA PRATINJAU (PREVIEW) TENGAH */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6 relative z-0">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 text-[#4A4A4A]/50">
            <ImageIcon size={64} strokeWidth={1.5} />
            <span className="font-bold uppercase tracking-widest text-xs">Memuat Koleksi...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-6 flex flex-col items-center rounded-lg shadow-sm">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <span className="font-bold uppercase text-center text-xs text-red-600">{error}</span>
          </div>
        ) : frames.length === 0 ? (
          <div className="bg-white border border-[#4A4A4A]/10 p-6 flex flex-col items-center rounded-lg shadow-sm">
            <ImageIcon size={40} className="text-[#4A4A4A]/30 mb-3" />
            <span className="font-bold uppercase text-center text-xs text-[#7A7A7A]">Belum ada bingkai yang aktif</span>
          </div>
        ) : selectedFrame ? (
          <div className="relative h-full w-full max-w-sm flex items-center justify-center transition-all duration-300">
            {/* Tampilan Frame Transparan (Efek Papan Catur di belakangnya) */}
            <div className="relative h-full w-full max-h-[55vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')] border border-[#4A4A4A]/15 shadow-[0_8px_30px_rgb(0,0,0,0.05)] bg-white overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedFrame.image_url} 
                alt={selectedFrame.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-lg"
              />
            </div>
            
            {/* Label Nama Frame Terapung */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#4A4A4A] text-white px-5 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] whitespace-nowrap flex items-center gap-1.5 shadow-sm">
              <Sparkles size={12} /> {selectedFrame.name}
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. AREA SELEKSI BAWAH (SCROLL HORIZONTAL) */}
      <div className="shrink-0 w-full bg-white/70 backdrop-blur-md border-t border-[#4A4A4A]/10 pb-8 pt-6 relative z-20">
        
        {/* Kontainer Scroll Horisontal */}
        {frames.length > 0 && (
          <div className="w-full overflow-x-auto pb-6 px-6 snap-x flex gap-4 hide-scrollbar">
            {frames.map((frame) => {
              const isSelected = selectedFrame?.id === frame.id;
              
              return (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  className={`
                    shrink-0 w-24 h-32 md:w-28 md:h-38 snap-center relative transition-all duration-200 
                    border rounded-lg flex flex-col items-center justify-center p-2
                    ${isSelected 
                      ? "border-[#4A4A4A] bg-[#FAF9F6] -translate-y-2 shadow-sm" 
                      : "border-[#4A4A4A]/10 bg-white hover:bg-[#FAF9F6] hover:-translate-y-1"
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
                    <div className="absolute -top-2.5 -right-2.5 bg-[#4A4A4A] text-white rounded-full p-1 shadow-sm border border-white">
                      <CheckCircle2 size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TOMBOL LANJUTKAN */}
        <div className="px-6 max-w-md mx-auto">
          <Button
            onClick={handleStartSession}
            disabled={!selectedFrame || isStarting}
            className="w-full h-14 text-sm bg-[#4A4A4A] hover:bg-[#333] text-white font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg shadow-sm"
          >
            {isStarting ? "MENYIAPKAN KAMERA..." : "MULAI SESI FOTO"} 
            <Camera className="ml-2" size={18} />
          </Button>
        </div>

      </div>

      {/* CSS Tambahan */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}