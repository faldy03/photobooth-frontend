"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, RefreshCw, DollarSign, Timer, Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    price_per_session: "",
    session_duration_minutes: "",
    countdown_duration_seconds: "",
    max_photos_taken: "",
  });

  // Fetch data setting dari server
  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://127.0.0.1:8000/api/kiosk/settings", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengambil konfigurasi.");
      
      if (json.data) {
        setFormData({
          price_per_session: json.data.price_per_session || "35000",
          session_duration_minutes: json.data.session_duration_minutes || "5",
          countdown_duration_seconds: json.data.countdown_duration_seconds || "5",
          max_photos_taken: json.data.max_photos_taken || "6",
        });
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://127.0.0.1:8000/api/admin/system-settings", {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: JSON.stringify(formData),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan konfigurasi.");
      
      toast.success("BERHASIL DISIMPAN!", { description: "Parameter operasional kios telah diperbarui secara global." });
    } catch (err: unknown) {
      toast.error("GAGAL MENYIMPAN!", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-retro-charcoal max-w-3xl mx-auto font-sans pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Settings size={32} className="text-[#FF0000]" />
            Konfigurasi Global Sistem
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Pengendalian Parameter Operasional Mesin Photobooth
          </p>
        </div>
        <Button
          onClick={fetchSettings}
          disabled={loading}
          className="border-[3px] border-retro-charcoal bg-white hover:bg-[#EFE9DB] text-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none h-12 px-4"
        >
          <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#262626]">
          <AlertCircle size={24} className="text-[#FF0000]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 uppercase font-black tracking-widest animate-pulse text-retro-charcoal/50">
          Sinkronisasi Parameter Sistem...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] p-6 space-y-6">
            
            {/* CONFIG 1: HARGA SESI */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[2px] border-dashed border-retro-charcoal/30 pb-6">
              <div className="max-w-md">
                <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                  <DollarSign size={18} className="text-[#FF0000]" strokeWidth={3} /> Tarif Per Sesi Foto
                </h3>
                <p className="text-xs text-retro-charcoal/60 font-bold uppercase mt-1">
                  Nominal tarif dasar paket yang akan di-generate menjadi kode QRIS DOKU pada layar mesin kios.
                </p>
              </div>
              <div className="w-full md:w-48 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-black text-sm text-retro-charcoal/50">Rp</span>
                <Input required type="number" min="0" name="price_per_session" value={formData.price_per_session} onChange={handleInputChange} className="pl-9 h-12 border-[2px] border-retro-charcoal font-black text-base" />
              </div>
            </div>

            {/* CONFIG 2: DURASI TOTAL SESI */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[2px] border-dashed border-retro-charcoal/30 pb-6">
              <div className="max-w-md">
                <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                  <Timer size={18} className="text-[#FF0000]" strokeWidth={3} /> Batas Durasi Sesi Bilik
                </h3>
                <p className="text-xs text-retro-charcoal/60 font-bold uppercase mt-1">
                  Alokasi waktu maksimal dalam satuan menit bagi pengguna di dalam bilik sebelum sesi berakhir otomatis.
                </p>
              </div>
              <div className="w-full md:w-48 relative">
                <Input required type="number" min="1" name="session_duration_minutes" value={formData.session_duration_minutes} onChange={handleInputChange} className="h-12 border-[2px] border-retro-charcoal font-black text-base pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-black text-xs uppercase text-retro-charcoal/50">Menit</span>
              </div>
            </div>

            {/* CONFIG 3: TIMER HITUNG MUNDUR KAMERA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[2px] border-dashed border-retro-charcoal/30 pb-6">
              <div className="max-w-md">
                <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                  <Camera size={18} className="text-[#FF0000]" strokeWidth={3} /> Waktu Hitung Mundur Potret
                </h3>
                <p className="text-xs text-retro-charcoal/60 font-bold uppercase mt-1">
                  Jeda waktu (detik) untuk hitung mundur otomatis di layar kios sebelum kamera melakukan pengambilan jepretan.
                </p>
              </div>
              <div className="w-full md:w-48 relative">
                <Input required type="number" min="1" name="countdown_duration_seconds" value={formData.countdown_duration_seconds} onChange={handleInputChange} className="h-12 border-[2px] border-retro-charcoal font-black text-base pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-black text-xs uppercase text-retro-charcoal/50">Detik</span>
              </div>
            </div>

            {/* CONFIG 4: JUMLAH MAKSIMAL JEPRETAN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div className="max-w-md">
                <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                  <Image size={18} className="text-[#FF0000]" strokeWidth={3} /> Kuota Jepretan Per Sesi
                </h3>
                <p className="text-xs text-retro-charcoal/60 font-bold uppercase mt-1">
                  Jumlah batas pengambilan gambar yang diberikan kepada pelanggan untuk kemudian dipilih ke dalam layout bingkai.
                </p>
              </div>
              <div className="w-full md:w-48 relative">
                <Input required type="number" min="1" name="max_photos_taken" value={formData.max_photos_taken} onChange={handleInputChange} className="h-12 border-[2px] border-retro-charcoal font-black text-base pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-black text-xs uppercase text-retro-charcoal/50">Foto</span>
              </div>
            </div>

          </div>

          {/* BUTTON SIMPAN */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest h-14 px-8 text-base"
            >
              <Save size={20} strokeWidth={3} />
              <span>{submitting ? "MENYIMPAN..." : "SIMPAN KONFIGURASI GLOBAL"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}