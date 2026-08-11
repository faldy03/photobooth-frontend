"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Ticket, Camera, LayoutTemplate, Printer } from "lucide-react";
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
      
      {/* Mengimpor Font Premium Cormorant Garamond */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* Custom Styles untuk Animasi Premium */}
      <style>{`
        @keyframes fadeUpTracking {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
            letter-spacing: 0.15em;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            letter-spacing: 0.25em;
          }
        }
        @keyframes fadeUpDelay {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 0.8;
            transform: translateY(0);
          }
        }
        @keyframes pulseOpacity {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.65; }
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
        @keyframes flashCamera {
          0%, 100% { opacity: 0.2; }
          45%, 55% { opacity: 1; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4)); }
        }
        .animate-fade-up-tracking {
          animation: fadeUpTracking 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-up-delay {
          opacity: 0;
          animation: fadeUpDelay 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
        .animate-pulse-opacity {
          animation: pulseOpacity 3.5s ease-in-out infinite;
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
        .animate-flash {
          animation: flashCamera 3s infinite;
        }
      `}</style>

      {/* ================= BACKGROUND ANIMASI ================= */}
      <div className="absolute inset-0 bg-[radial-gradient(#FAF9F6_50%,#EFEBE2_100%)] animate-breathing-bg pointer-events-none z-0" />

      {stage === "welcome" ? (
        /* ================= WELCOME SCREEN STAGE ================= */
        <div 
          onClick={handleStartGuide}
          className="w-full h-full flex flex-col justify-center items-center cursor-pointer z-10"
        >
          <div className="text-center space-y-3">
            <h1 
              className="text-5xl md:text-7xl font-normal uppercase text-[#4A4A4A] select-none animate-fade-up-tracking"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              HELLO.PICTA
            </h1>
            <p 
              className="text-[10px] md:text-xs font-light tracking-[0.6em] uppercase text-[#7A7A7A] select-none pl-[0.6em] animate-fade-up-delay"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              PHOTOBOOTH
            </p>
          </div>

          <div className="absolute bottom-16 text-[9px] font-bold tracking-[0.3em] uppercase text-[#4A4A4A] animate-pulse-opacity">
            SENTUH DI SINI UNTUK MEMULAI
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
              className="text-xs font-bold uppercase tracking-wider text-[#7A7A7A] hover:text-[#4A4A4A] flex items-center gap-1.5 p-0 bg-transparent hover:bg-transparent"
            >
              <ArrowLeft size={16} /> Kembali
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold uppercase tracking-widest text-[#4A4A4A]">Petunjuk Penggunaan</h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A7A7A] mt-0.5">4 Langkah Mudah Berfoto</p>
            </div>

            {/* Spacer to keep center balanced */}
            <div className="w-16"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full my-auto py-8">
            
            {/* CARD 1: BAYAR */}
            <div className="bg-white border border-[#4A4A4A]/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] group">
              <div className="w-16 h-16 rounded-full bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] mb-4 animate-float-1 group-hover:scale-105 transition-transform duration-300">
                <Ticket size={28} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4A4A4A] mb-2">1. Registrasi & Bayar</h3>
              <p className="text-[11px] text-[#7A7A7A] leading-relaxed font-semibold">
                Pilih paket sesi, masukkan kupon jika ada, lalu bayar secara praktis menggunakan QRIS.
              </p>
            </div>

            {/* CARD 2: FOTO */}
            <div className="bg-white border border-[#4A4A4A]/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] group">
              <div className="w-16 h-16 rounded-full bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] mb-4 animate-float-2 relative group-hover:scale-105 transition-transform duration-300">
                <Camera size={28} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4A4A4A] mb-2">2. Sesi Pemotretan</h3>
              <p className="text-[11px] text-[#7A7A7A] leading-relaxed font-semibold">
                Kamera DSLR profesional kami akan membidik senyum terbaik Anda secara otomatis dalam beberapa jepretan.
              </p>
            </div>

            {/* CARD 3: TEMPLATE */}
            <div className="bg-white border border-[#4A4A4A]/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] group">
              <div className="w-16 h-16 rounded-full bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] mb-4 animate-float-3 group-hover:scale-105 transition-transform duration-300">
                <LayoutTemplate size={28} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4A4A4A] mb-2">3. Frame & Filter</h3>
              <p className="text-[11px] text-[#7A7A7A] leading-relaxed font-semibold">
                Pilih bingkai hello.picta favorit Anda dan terapkan filter visual retro untuk hasil yang estetik.
              </p>
            </div>

            {/* CARD 4: DOWNLOAD */}
            <div className="bg-white border border-[#4A4A4A]/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] group">
              <div className="w-16 h-16 rounded-full bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] mb-4 animate-float-4 group-hover:scale-105 transition-transform duration-300">
                <Printer size={28} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4A4A4A] mb-2">4. Cetak & Unduh</h3>
              <p className="text-[11px] text-[#7A7A7A] leading-relaxed font-semibold">
                Ambil hasil foto fisik yang dicetak langsung, dan scan QR code di layar untuk mengunduh versi digital.
              </p>
            </div>

          </div>

          {/* Proceed Button */}
          <div className="w-full flex justify-center border-t border-[#4A4A4A]/10 pt-6">
            <Button
              onClick={handleProceedToCheckout}
              className="w-full max-w-sm h-14 text-xs bg-[#4A4A4A] hover:bg-[#333] text-white font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
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