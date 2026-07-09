"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Image as ImageIcon, Sparkles,CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Mengambil daftar frame aktif dari database
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/kiosk/frames");
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
    <div className="h-screen w-full bg-[#EFE9DB] flex flex-col font-sans text-retro-charcoal overflow-hidden">
      
      {/* 1. HEADER AREA */}
      <div className="text-center pt-8 pb-4 shrink-0 z-10 relative">
        <h1 className="text-4xl md:text-5xl font-black font-serif uppercase tracking-tighter drop-shadow-sm">
          PILIH BINGKAI FOTO
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-retro-charcoal/60 mt-2">
          Geser daftar di bawah untuk memilih gaya fotomu
        </p>
      </div>

      {/* 2. AREA PRATINJAU (PREVIEW) TENGAH */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6 relative z-0">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 text-retro-charcoal/50">
            <ImageIcon size={64} strokeWidth={1.5} />
            <span className="font-black uppercase tracking-widest text-sm">Memuat Koleksi...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-[4px] border-retro-charcoal p-6 flex flex-col items-center shadow-[8px_8px_0_0_#262626]">
            <AlertCircle size={48} className="text-[#FF0000] mb-4" />
            <span className="font-black uppercase text-center">{error}</span>
          </div>
        ) : frames.length === 0 ? (
          <div className="bg-white border-[4px] border-retro-charcoal p-6 flex flex-col items-center shadow-[8px_8px_0_0_#262626]">
            <ImageIcon size={48} className="text-retro-charcoal/50 mb-4" />
            <span className="font-black uppercase text-center">Belum ada bingkai yang aktif</span>
          </div>
        ) : selectedFrame ? (
          <div className="relative h-full w-full max-w-sm flex items-center justify-center transition-all duration-300">
            {/* Tampilan Frame Transparan (Efek Papan Catur di belakangnya) */}
            <div className="relative h-full w-full max-h-[60vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')] border-[6px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedFrame.image_url} 
                alt={selectedFrame.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xl"
              />
            </div>
            
            {/* Label Nama Frame Terapung */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FF0000] text-white px-6 py-2 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] font-black uppercase tracking-widest text-sm whitespace-nowrap flex items-center gap-2">
              <Sparkles size={16} /> {selectedFrame.name}
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. AREA SELEKSI BAWAH (SCROLL HORIZONTAL) */}
      <div className="shrink-0 w-full bg-white border-t-[6px] border-retro-charcoal shadow-[0_-8px_0_0_rgba(38,38,38,0.1)] pb-8 pt-6 relative z-20">
        
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
                    shrink-0 w-28 h-36 md:w-32 md:h-44 snap-center relative transition-all duration-200 
                    border-[4px] border-retro-charcoal flex flex-col items-center justify-center p-2
                    ${isSelected 
                      ? "bg-retro-charcoal -translate-y-4 shadow-[8px_16px_0_0_#FF0000]" 
                      : "bg-[#EFE9DB] hover:bg-[#e0d6c8] shadow-[4px_4px_0_0_#262626] hover:-translate-y-2 hover:shadow-[6px_8px_0_0_#262626]"
                    }
                  `}
                >
                  {/* Thumbnail Gambar */}
                  <div className={`w-full h-full border-[2px] ${isSelected ? 'border-white/20' : 'border-retro-charcoal'} bg-white overflow-hidden p-1 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPg==')]`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={frame.image_url} 
                      alt={frame.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Indikator Terpilih */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-[#FF0000] text-white rounded-full p-1 border-[3px] border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                      <CheckCircle2 size={16} strokeWidth={4} />
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
            className="w-full h-16 text-xl bg-[#FF0000] hover:bg-[#d9383a] text-white border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            {isStarting ? "MENYIAPKAN KAMERA..." : "MULAI SESI FOTO"} 
            <Camera className="ml-3" size={24} strokeWidth={3} />
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