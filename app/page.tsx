"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Ticket, Camera, LayoutTemplate, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [animate, setAnimate] = useState(false);
  const [stage, setStage] = useState<"welcome" | "guide">("welcome");

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleStartGuide = () => {
    setStage("guide");
  };

  const handleProceedToCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="relative h-screen w-screen bg-[#FAF9F6] flex flex-col justify-center items-center font-jakarta text-[#333333] select-none overflow-hidden">
      
      {/* Custom Styles untuk Animasi & Typografi Premium */}
      <style>{`
        @keyframes fadeUpTracking {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
            letter-spacing: -0.02em;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            letter-spacing: -0.01em;
          }
        }
        @keyframes fadeUpDelay {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 0.85;
            transform: translateY(0);
          }
        }
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 0.8; 
            transform: scale(1);
            box-shadow: 0 0 15px rgba(0,0,0,0.05);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.03);
            box-shadow: 0 0 25px rgba(220,38,38,0.18);
          }
        }
        @keyframes breathingBg {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.95;
          }
          50% { 
            transform: scale(1.04); 
            opacity: 1;
          }
        }
        @keyframes floatingItem {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        .animate-fade-up-tracking {
          animation: fadeUpTracking 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-up-delay {
          opacity: 0;
          animation: fadeUpDelay 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2.5s ease-in-out infinite;
        }
        .animate-breathing-bg {
          animation: breathingBg 20s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: floatingItem 4s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: floatingItem 4.5s ease-in-out infinite 0.5s;
        }
        .animate-float-3 {
          animation: floatingItem 5s ease-in-out infinite 1s;
        }
        .animate-float-4 {
          animation: floatingItem 4.2s ease-in-out infinite 0.2s;
        }
      `}</style>

      {/* ================= BACKGROUND ANIMASI ================= */}
      <div className="absolute inset-0 bg-[radial-gradient(#FAF9F6_40%,#EFEBE2_100%)] animate-breathing-bg pointer-events-none z-0" />

      {stage === "welcome" ? (
        /* ================= WELCOME SCREEN STAGE ================= */
        <div 
          onClick={handleStartGuide}
          className="w-full h-full flex flex-col justify-center items-center cursor-pointer z-10 px-4"
        >
          <div className="text-center space-y-4 max-w-4xl flex flex-col items-center">
            {/* Small decorative badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/5 text-[#555555] text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase animate-fade-up-delay mb-2 border border-black/5">
              <Sparkles size={13} className="text-red-500 animate-pulse" />
              <span>Studio Photobooth</span>
            </div>

            {/* Main Brand Title - Syne Display Font */}
            <h1 className="font-syne text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold uppercase tracking-tight text-[#1A1A1A] select-none animate-fade-up-tracking leading-none drop-shadow-sm">
              HELLO<span className="text-red-600">.</span>PICTA
            </h1>

            {/* Subtitle - Plus Jakarta Sans with crisp tracking */}
            <p className="font-jakarta text-xs sm:text-sm md:text-base font-semibold tracking-[0.65em] uppercase text-[#666666] select-none pl-[0.65em] animate-fade-up-delay">
              P H O T O B O O T H
            </p>
          </div>

          {/* Touch to start callout badge */}
          <div className="absolute bottom-16 px-6 py-3 rounded-full bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#222222] animate-pulse-glow shadow-md flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>SENTUH DI SINI UNTUK MEMULAI</span>
          </div>
        </div>
      ) : (
        /* ================= INSTRUCTIONS GUIDE STAGE ================= */
        <div className="w-full max-w-5xl px-6 flex flex-col items-center justify-between h-full py-10 z-10 animate-in fade-in zoom-in-95 duration-500 font-jakarta">
          
          {/* Header Row */}
          <div className="w-full flex items-center justify-between border-b border-[#4A4A4A]/10 pb-4">
            <Button 
              variant="ghost" 
              onClick={() => setStage("welcome")} 
              className="text-xs font-bold uppercase tracking-wider text-[#7A7A7A] hover:text-[#1A1A1A] flex items-center gap-1.5 p-0 bg-transparent hover:bg-transparent font-jakarta"
            >
              <ArrowLeft size={16} /> Kembali
            </Button>
            
            <div className="text-center">
              <h2 className="font-syne text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-[#1A1A1A]">
                Petunjuk Penggunaan
              </h2>
              <p className="font-jakarta text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-red-600 mt-0.5">
                4 Langkah Mudah Berfoto
              </p>
            </div>

            {/* Spacer to keep center balanced */}
            <div className="w-16"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full my-auto py-8">
            
            {/* CARD 1: BAYAR */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] hover:border-red-500/30 group">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-1 group-hover:scale-110 transition-transform duration-300">
                <Ticket size={28} />
              </div>
              <h3 className="font-syne text-base font-bold uppercase tracking-wide text-[#1A1A1A] mb-2">
                1. Registrasi & Bayar
              </h3>
              <p className="font-jakarta text-xs text-[#666666] leading-relaxed font-medium">
                Pilih paket sesi, masukkan kupon jika ada, lalu bayar secara praktis menggunakan QRIS.
              </p>
            </div>

            {/* CARD 2: BINGKAI */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] hover:border-red-500/30 group">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-2 group-hover:scale-110 transition-transform duration-300">
                <LayoutTemplate size={28} />
              </div>
              <h3 className="font-syne text-base font-bold uppercase tracking-wide text-[#1A1A1A] mb-2">
                2. Pilih Bingkai
              </h3>
              <p className="font-jakarta text-xs text-[#666666] leading-relaxed font-medium">
                Pilih bingkai hello.picta favorit Anda sebelum mulai pemotretan untuk mencocokkan gaya foto.
              </p>
            </div>

            {/* CARD 3: FOTO */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] hover:border-red-500/30 group">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-3 relative group-hover:scale-110 transition-transform duration-300">
                <Camera size={28} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="font-syne text-base font-bold uppercase tracking-wide text-[#1A1A1A] mb-2">
                3. Pemotretan
              </h3>
              <p className="font-jakarta text-xs text-[#666666] leading-relaxed font-medium">
                Kamera DSLR profesional siap membidik senyum terbaik Anda secara otomatis & berulang jika perlu.
              </p>
            </div>

            {/* CARD 4: FILTER & CETAK */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] hover:border-red-500/30 group">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-4 group-hover:scale-110 transition-transform duration-300">
                <Printer size={28} />
              </div>
              <h3 className="font-syne text-base font-bold uppercase tracking-wide text-[#1A1A1A] mb-2">
                4. Filter & Cetak
              </h3>
              <p className="font-jakarta text-xs text-[#666666] leading-relaxed font-medium">
                Terapkan filter visual retro, cetak foto fisik instan, dan scan QR code untuk unduh digital file.
              </p>
            </div>

          </div>

          {/* Proceed Button */}
          <div className="w-full flex justify-center border-t border-[#4A4A4A]/10 pt-6">
            <Button
              onClick={handleProceedToCheckout}
              className="w-full max-w-sm h-14 text-xs font-jakarta bg-[#1A1A1A] hover:bg-red-600 text-white font-bold uppercase tracking-widest transition-all rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight size={16} />
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}