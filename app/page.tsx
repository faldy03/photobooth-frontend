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
      className="h-screen w-screen bg-[#FAF9F6] flex flex-col justify-center items-center font-sans text-[#4A4A4A] select-none cursor-pointer overflow-hidden transition-all duration-700 bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)]"
    >
      {/* Mengimpor Font Premium Cormorant Garamond */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
        rel="stylesheet" 
      />

      {/* ================= CENTER SECTION (BRAND LOGO) ================= */}
      <div 
        className={`text-center space-y-3 transition-all duration-1000 transform ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <h1 
          className="text-5xl md:text-7xl font-normal tracking-[0.25em] uppercase text-[#4A4A4A] select-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          HELLO.PICTA
        </h1>
        
        <p 
          className="text-[10px] md:text-xs font-light tracking-[0.6em] uppercase text-[#7A7A7A] select-none pl-[0.6em] opacity-80"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          PHOTOBOOTH
        </p>
      </div>

      {/* ================= BOTTOM SECTION (SUBTLE INDICATOR) ================= */}
      <div 
        className={`absolute bottom-16 text-[9px] font-bold tracking-[0.3em] uppercase text-[#4A4A4A]/30 transition-all duration-1000 delay-500 transform ${
          animate ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        TAP ANYWHERE TO START
      </div>
    </div>
  );
}