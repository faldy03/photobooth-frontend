"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      className="relative h-screen w-screen bg-[#FAF9F6] flex flex-col justify-center items-center font-sans text-[#4A4A4A] select-none cursor-pointer overflow-hidden"
    >
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
      `}</style>

      {/* ================= BACKGROUND ANIMASI ================= */}
      <div className="absolute inset-0 bg-[radial-gradient(#FAF9F6_50%,#EFEBE2_100%)] animate-breathing-bg pointer-events-none z-0" />

      {/* ================= CENTER SECTION (BRAND LOGO) ================= */}
      <div 
        className="text-center space-y-3 z-10"
      >
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

      {/* ================= BOTTOM SECTION (SUBTLE INDICATOR) ================= */}
      <div 
        className="absolute bottom-16 text-[9px] font-bold tracking-[0.3em] uppercase text-[#4A4A4A] z-10 animate-pulse-opacity"
      >
        TAP ANYWHERE TO START
      </div>
    </div>
  );
}