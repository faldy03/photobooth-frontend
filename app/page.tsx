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
    <div className="relative h-screen w-screen bg-[#FAF9F6] flex flex-col justify-center items-center font-sans text-[#4A4A4A] select-none overflow-hidden">
      
      {/* Mengimpor Font Google Cormorant Garamond */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" 
        rel="stylesheet" 
      />

      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes fadeUpTracking {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
            letter-spacing: 0.05em;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            letter-spacing: 0.1em;
          }
        }
        @keyframes fadeUpDelay {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 0.85;
            transform: translateY(0);
          }
        }
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 0.85; 
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.03);
            box-shadow: 0 6px 28px rgba(220, 38, 38, 0.15);
          }
        }
        @keyframes breathingBg {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.95;
          }
          50% { 
            transform: scale(1.05); 
            opacity: 1;
          }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .animate-fade-up-tracking {
          animation: fadeUpTracking 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-up-delay {
          opacity: 0;
          animation: fadeUpDelay 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2.8s ease-in-out infinite;
        }
        .animate-breathing-bg {
          animation: breathingBg 18s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: floatSlow 4s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: floatSlow 4.5s ease-in-out infinite 0.5s;
        }
        .animate-float-3 {
          animation: floatSlow 5s ease-in-out infinite 1s;
        }
        .animate-float-4 {
          animation: floatSlow 4.2s ease-in-out infinite 0.2s;
        }
      `}</style>

      {/* ================= BACKGROUND ANIMASI ================= */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#FAF9F6_45%,#EFEBE2_100%)] animate-breathing-bg pointer-events-none z-0" />

      {stage === "welcome" ? (
        /* ================= WELCOME SCREEN STAGE ================= */
        <div 
          onClick={handleStartGuide}
          className="w-full h-full flex flex-col justify-center items-center cursor-pointer z-10 px-4 sm:px-8 text-center"
        >
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center space-y-3 sm:space-y-4">
            
            {/* Main Brand Title - Responsive Cormorant Garamond */}
            <h1 
              className="w-full text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.8rem] font-normal uppercase text-[#333333] select-none animate-fade-up-tracking leading-tight sm:leading-none tracking-[0.06em] sm:tracking-[0.1em] md:tracking-[0.12em] transition-all duration-300 drop-shadow-sm"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              HELLO<span className="text-red-600 font-semibold">.</span>PICTA
            </h1>
            
            {/* Subtitle - Cormorant Garamond */}
            <p 
              className="text-xs sm:text-sm md:text-base lg:text-lg font-light tracking-[0.4em] sm:tracking-[0.55em] uppercase text-[#666666] select-none pl-[0.4em] sm:pl-[0.55em] animate-fade-up-delay"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              P H O T O B O O T H
            </p>
          </div>

          {/* Responsive Animated Action Prompt Badge */}
          <div className="absolute bottom-12 sm:bottom-16 px-6 sm:px-8 py-3 rounded-full bg-white/85 backdrop-blur-md border border-[#333333]/15 text-[11px] sm:text-xs font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#222222] animate-pulse-glow flex items-center gap-2.5 transition-all">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>SENTUH DI SINI UNTUK MEMULAI</span>
          </div>
        </div>
      ) : (
        /* ================= INSTRUCTIONS GUIDE STAGE ================= */
        <div className="w-full max-w-5xl px-6 flex flex-col items-center justify-between h-full py-10 z-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header Row */}
          <div className="w-full flex items-center justify-between border-b border-[#4A4A4A]/10 pb-4">
            <Button 
              variant="ghost" 
              onClick={() => setStage("welcome")} 
              className="text-xs font-bold uppercase tracking-wider text-[#7A7A7A] hover:text-[#222222] flex items-center gap-1.5 p-0 bg-transparent hover:bg-transparent"
            >
              <ArrowLeft size={16} /> Kembali
            </Button>
            
            <div className="text-center">
              <h2 
                className="text-xl sm:text-2xl md:text-3xl font-medium uppercase tracking-widest text-[#333333]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Petunjuk Penggunaan
              </h2>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A] mt-0.5">
                4 Langkah Mudah Berfoto
              </p>
            </div>

            {/* Spacer to keep center balanced */}
            <div className="w-16"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full my-auto py-6">
            
            {/* CARD 1: BAYAR */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_35px_rgb(0,0,0,0.05)] hover:border-red-500/30 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-1 group-hover:scale-110 transition-transform duration-300">
                <Ticket size={26} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#333333] mb-2">1. Registrasi & Bayar</h3>
              <p className="text-[11px] sm:text-xs text-[#666666] leading-relaxed font-medium">
                Pilih paket sesi, masukkan kupon jika ada, lalu bayar secara praktis menggunakan QRIS.
              </p>
            </div>

            {/* CARD 2: BINGKAI */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_35px_rgb(0,0,0,0.05)] hover:border-red-500/30 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-2 group-hover:scale-110 transition-transform duration-300">
                <LayoutTemplate size={26} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#333333] mb-2">2. Pilih Bingkai</h3>
              <p className="text-[11px] sm:text-xs text-[#666666] leading-relaxed font-medium">
                Pilih bingkai hello.picta favorit Anda sebelum mulai pemotretan untuk mencocokkan gaya foto.
              </p>
            </div>

            {/* CARD 3: FOTO */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_35px_rgb(0,0,0,0.05)] hover:border-red-500/30 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-3 relative group-hover:scale-110 transition-transform duration-300">
                <Camera size={26} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#333333] mb-2">3. Pemotretan</h3>
              <p className="text-[11px] sm:text-xs text-[#666666] leading-relaxed font-medium">
                Kamera DSLR profesional siap membidik senyum terbaik Anda secara otomatis & berulang jika perlu.
              </p>
            </div>

            {/* CARD 4: FILTER & CETAK */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#4A4A4A]/10 rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_35px_rgb(0,0,0,0.05)] hover:border-red-500/30 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-4 animate-float-4 group-hover:scale-110 transition-transform duration-300">
                <Printer size={26} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#333333] mb-2">4. Filter & Cetak</h3>
              <p className="text-[11px] sm:text-xs text-[#666666] leading-relaxed font-medium">
                Terapkan filter visual retro, cetak foto fisik instan, dan scan QR code untuk mengunduh soft file foto.
              </p>
            </div>

          </div>

          {/* Proceed Button */}
          <div className="w-full flex justify-center border-t border-[#4A4A4A]/10 pt-6">
            <Button
              onClick={handleProceedToCheckout}
              className="w-full max-w-sm h-14 text-xs bg-[#222222] hover:bg-red-600 text-white font-bold uppercase tracking-widest transition-all rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border-none"
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