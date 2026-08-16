"use client";

import { useState, useEffect, use } from "react";
import { 
  Download, 
  Sparkles, 
  Clock, 
  Image as ImageIcon, 
  CheckCircle2, 
  FileArchive, 
  ArrowLeft,
  Film,
  Camera,
  Share2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getApiUrl } from "@/lib/api";

interface SessionDownloadData {
  session_uuid: string;
  final_photo_url: string;
  gif_photo_url: string | null;
  raw_photo_urls: string[];
  created_at: string | null;
  download_expired_at: string | null;
}

export default function SoftFileDownloadPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  const uuid = resolvedParams.uuid;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SessionDownloadData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!uuid) return;

    const fetchSessionData = async () => {
      setLoading(true);
      setError(null);

      const fallbackData: SessionDownloadData = {
        session_uuid: uuid,
        final_photo_url: `https://boothflow.site/storage/sessions/final_${uuid}.jpg`,
        gif_photo_url: `https://boothflow.site/storage/sessions/gif_${uuid}.gif`,
        raw_photo_urls: [
          `https://boothflow.site/storage/sessions/raw_${uuid}_0.jpg`,
          `https://boothflow.site/storage/sessions/raw_${uuid}_1.jpg`,
          `https://boothflow.site/storage/sessions/raw_${uuid}_2.jpg`,
          `https://boothflow.site/storage/sessions/raw_${uuid}_3.jpg`
        ],
        created_at: new Date().toLocaleDateString(),
        download_expired_at: new Date(Date.now() + 3600000).toISOString(),
      };

      try {
        const res = await fetch(getApiUrl(`/api/kiosk/session-download/${uuid}`));
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.final_photo_url) {
            setData(json);
          } else {
            setData(fallbackData);
          }
        } else {
          setData(fallbackData);
        }
      } catch (err: any) {
        console.warn("Fallback to direct storage URLs:", err);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [uuid]);

  // Timer Kadaluarsa 60 Menit
  useEffect(() => {
    if (!data?.download_expired_at) return;

    const expiredTime = new Date(data.download_expired_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiredTime - now;

      if (distance <= 0) {
        setTimeLeft("EXPIRED");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      toast.info("Mengunduh File...", { description: filename });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Unduhan Selesai!", { description: filename });
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Soft File Photobooth Saya",
          text: "Lihat hasil foto photobooth saya di sini!",
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link Disalin!", { description: "Link soft file telah disalin ke clipboard." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-6 font-sans">
        <Loader2 size={48} className="animate-spin text-amber-400 mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-amber-400">Memuat Soft File...</h2>
        <p className="text-xs text-gray-400 mt-2">Menyiapkan cetakan 2R, GIF animasi, dan foto mentah Anda.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle size={56} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-2 text-red-400">Soft File Tidak Ditemukan</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">{error || "Masa berlaku tautan ini telah berakhir atau tidak valid."}</p>
        <Button onClick={() => window.location.reload()} className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase text-xs px-6 h-11 rounded-full">
          Coba Muat Ulang
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white font-sans selection:bg-amber-500 selection:text-black pb-16 relative overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0F0F12]/80 border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-black text-black text-xs shadow-md">
            BF
          </div>
          <span className="font-bold tracking-widest text-sm uppercase text-white">BOOTHFLOW</span>
        </div>

        {timeLeft && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-inner">
            <Clock size={13} className="animate-pulse" />
            <span>{timeLeft === "EXPIRED" ? "KADALUARSA" : timeLeft}</span>
          </div>
        )}
      </header>

      {/* HERO BANNER */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        
        <div className="text-center space-y-3 relative">
          <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={14} className="text-amber-400" /> Soft File Siap Diunduh
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-white">
            KOLEKSI FOTO STUDIO ANDA
          </h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Simpan foto strip 2R, animasi GIF berulang, dan foto mentah HD langsung ke smartphone Anda.
          </p>

          <Button
            onClick={handleShare}
            variant="outline"
            className="mt-2 h-9 px-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-full tracking-wider cursor-pointer"
          >
            <Share2 size={14} className="mr-1.5" /> Bagikan Soft File
          </Button>
        </div>

        {/* SECTION 1: HASIL CETAKAN FRAME 2R */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-bold text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <ImageIcon size={18} className="text-amber-400" /> Cetakan Frame 2R
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase bg-white/10 px-2 py-0.5 rounded">HD JPEG</span>
          </div>

          <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 flex justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.final_photo_url}
              alt="Hasil Cetakan Frame 2R"
              className="max-h-[480px] w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          <Button
            onClick={() => handleDownloadSingle(data.final_photo_url, `Frame_2R_${data.session_uuid.substring(0, 8)}.jpg`)}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={16} /> Unduh Cetakan Frame 2R (HD)
          </Button>
        </section>

        {/* SECTION 2: ANIMATED GIF */}
        {data.gif_photo_url && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-sm uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <Film size={18} className="text-rose-400" /> Foto Animasi GIF
              </h2>
              <span className="text-[10px] font-bold text-rose-300 uppercase bg-rose-500/20 px-2 py-0.5 rounded">FOTO BERGERAK</span>
            </div>

            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 flex justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.gif_photo_url}
                alt="Foto Animasi GIF"
                className="max-h-[380px] w-auto h-auto object-contain rounded-lg shadow-2xl"
              />
            </div>

            <Button
              onClick={() => handleDownloadSingle(data.gif_photo_url!, `Animated_GIF_${data.session_uuid.substring(0, 8)}.gif`)}
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={16} /> Unduh Foto Animasi GIF
            </Button>
          </section>
        )}

        {/* SECTION 3: GALERI FOTO MENTAH (RAW PHOTOS) */}
        {data.raw_photo_urls && data.raw_photo_urls.length > 0 && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-sm uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Camera size={18} className="text-cyan-400" /> Galeri Foto Mentah ({data.raw_photo_urls.length} Foto)
              </h2>
              <span className="text-[10px] font-bold text-cyan-300 uppercase bg-cyan-500/20 px-2 py-0.5 rounded">ORIGINAL DSLR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.raw_photo_urls.map((rawUrl, idx) => (
                <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col gap-2 relative group">
                  <div className="aspect-[4/3] w-full rounded-lg overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rawUrl}
                      alt={`Foto Mentah #${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDownloadSingle(rawUrl, `Raw_Photo_${idx + 1}_${data.session_uuid.substring(0, 6)}.jpg`)}
                    className="h-8 w-full bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download size={12} /> Unduh HD
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-16 text-center text-gray-500 text-[11px] uppercase tracking-wider border-t border-white/10 pt-6">
        <p>© {new Date().getFullYear()} BoothFlow Studio. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
