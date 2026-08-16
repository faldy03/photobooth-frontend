"use client";

import { useState, useEffect } from "react";

interface AnimatedGifPlayerProps {
  photos: string[];
  intervalMs?: number;
  className?: string;
}

export default function AnimatedGifPlayer({
  photos,
  intervalMs = 350,
  className = "",
}: AnimatedGifPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!photos || photos.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [photos, intervalMs]);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[currentIndex]}
        alt={`Animated Frame #${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-150"
      />
      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider">
        GIF LIVE #{currentIndex + 1}
      </div>
    </div>
  );
}
