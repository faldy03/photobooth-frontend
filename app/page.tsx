"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Memicu animasi masuk secara halus setelah halaman dimuat
    setAnimate(true);
  }, []);

  const handleStart = () => {
    setAnimate(false);
    setTimeout(() => {
      router.push("/checkout");
    }, 400);
  };

  return (
    <div 
      onClick={handleStart}
      className="h-screen w-screen bg-[#FAF8F5] flex flex-col justify-between items-center p-12 md:p-16 font-sans text-[#1A1A1A] select-none cursor-pointer overflow-hidden transition-colors duration-500 hover:bg-[#F5F2EB]"
    >
      {/* ================= TOP SECTION (SUBTLE) ================= */}
      <div className={`transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-40' : '-translate-y-4 opacity-0'} text-xs font-bold tracking-[0.4em] uppercase`}>
        Booth Flow System v2.0
      </div>

      {/* ================= CENTER SECTION (BRAND MAIN LOGO) ================= */}
      <div className="flex flex-col items-center max-w-xl w-full">
        <div 
          className={`text-center transition-all duration-1000 delay-100 transform ${
            animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Tagline Kecil di Atas Brand */}
          <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-[#E53E3E] mb-3">
            Premium Photobooth
          </span>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none text-[#1A1A1A]">
            BOOTH
            <span className="block text-[#E53E3E] tracking-tight">FLOW.</span>
          </h1>

          {/* Garis Pembatas Minimalis */}
          <div className="w-16 h-[3px] bg-[#1A1A1A] mx-auto mt-6 opacity-20"></div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION (CALL TO ACTION) ================= */}
      <div 
        className={`flex flex-col items-center gap-3 transition-all duration-1000 delay-300 transform ${
          animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Tombol Interaktif yang Berkedip Lembut */}
        <div className="flex items-center gap-3 px-8 py-4 border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0_0_#1A1A1A] active:translate-y-1 active:shadow-none transition-all duration-150 animate-pulse">
          <span className="font-bold uppercase tracking-[0.2em] text-sm text-[#1A1A1A]">
            Sentuh Layar Untuk Memulai
          </span>
          <ArrowRight size={16} className="text-[#E53E3E]" />
        </div>
        
        {/* Indikator Fitur */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 mt-1">
          <Camera size={12} /> Format Cetak 2R Double Strip
        </div>
      </div>
    </div>
  );
}