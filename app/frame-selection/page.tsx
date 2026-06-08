"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Layout, Grid2X2, Rows4, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FrameSelectionPage() {
  const router = useRouter();
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Daftar opsi frame foto
  const frames = [
    {
      id: "strip-3",
      name: "Classic 3 Strip",
      icon: <Rows4 size={40} />,
      desc: "3 Foto memanjang",
    },
    {
      id: "grid-4",
      name: "Grid 2x2",
      icon: <Grid2X2 size={40} />,
      desc: "4 Foto kotak rapi",
    },
    {
      id: "polaroid",
      name: "Polaroid Style",
      icon: <Square size={40} />,
      desc: "1 Foto fokus besar",
    },
    {
      id: "story",
      name: "Story Layout",
      icon: <Layout size={40} />,
      desc: "Layout gaya sosial media",
    },
  ];

  const handleStartSession = () => {
    if (!selectedFrame) return;
    setLoading(true);

    // Simpan pilihan frame ke localStorage (atau state management) agar bisa dibaca kamera nanti
    localStorage.setItem("selected_frame", selectedFrame);

    // Redirect ke halaman sesi foto sebenarnya
    setTimeout(() => {
      router.push("/session-started");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#EFE9DB] flex flex-col items-center justify-center p-6 font-sans text-retro-charcoal">
      <div className="w-full max-w-2xl bg-white border-[4px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] p-8 flex flex-col items-center">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black font-serif uppercase tracking-tight mb-2">
            PILIH BINGKAI FOTO
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-retro-charcoal/60 border-b-[4px] border-retro-charcoal pb-4">
            Tentukan gaya fotomu sebelum mulai
          </p>
        </div>

        {/* GRID PILIHAN FRAME */}
        <div className="grid grid-cols-2 gap-6 w-full mb-10">
          {frames.map((frame) => {
            const isSelected = selectedFrame === frame.id;
            return (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame.id)}
                className={`
                  flex flex-col items-center justify-center p-6 text-center transition-all
                  border-[3px] border-retro-charcoal 
                  ${
                    isSelected
                      ? "bg-retro-charcoal text-[#EFE9DB] shadow-[inset_0px_0px_0px_4px_#FF0000] scale-[1.02]"
                      : "bg-white hover:bg-[#EFE9DB] shadow-[4px_4px_0_0_#262626] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#262626]"
                  }
                `}
              >
                <div className="mb-4">{frame.icon}</div>
                <h3 className="font-black uppercase tracking-wider mb-1">
                  {frame.name}
                </h3>
                <p
                  className={`text-xs font-bold uppercase ${isSelected ? "text-[#EFE9DB]/70" : "text-retro-charcoal/60"}`}
                >
                  {frame.desc}
                </p>
                {isSelected && (
                  <div className="mt-4 bg-[#FF0000] text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest border-[2px] border-retro-charcoal">
                    Terpilih
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* TOMBOL LANJUT */}
        <Button
          onClick={handleStartSession}
          disabled={!selectedFrame || loading}
          className="w-full h-16 text-xl bg-[#FF0000] hover:bg-red-700 text-white border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:translate-y-1 active:shadow-none"
        >
          {loading ? "MENYIAPKAN KAMERA..." : "MULAI SESI FOTO"}{" "}
          <Camera className="ml-3" size={24} />
        </Button>
      </div>
    </div>
  );
}
