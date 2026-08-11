"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, RefreshCw, DollarSign, Timer, Camera, Image, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    price_per_session: "",
    price_per_reprint: "",
    session_duration_minutes: "",
    countdown_duration_seconds: "",
    max_photos_taken: "",
    active_event_name: "",
  });

  // Fetch data setting dari server
  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/kiosk/settings"), {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengambil konfigurasi.");
      
      if (json.data) {
        setFormData({
          price_per_session: json.data.price_per_session || "35000",
          price_per_reprint: json.data.price_per_reprint || "15000",
          session_duration_minutes: json.data.session_duration_minutes || "5",
          countdown_duration_seconds: json.data.countdown_duration_seconds || "5",
          max_photos_taken: json.data.max_photos_taken || "6",
          active_event_name: json.data.active_event_name || "Global",
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
      const res = await fetch(getApiUrl("/api/admin/system-settings"), {
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto font-sans pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
            <Settings size={32} className="text-[#FF0000]" />
            Konfigurasi Global Sistem
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Pengendalian Parameter Operasional Mesin Kios
          </p>
        </div>
        <Button
          onClick={fetchSettings}
          disabled={loading}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-11 px-4 cursor-pointer"
        >
          <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-3 rounded-xl">
          <AlertCircle size={24} className="text-[#FF0000] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 uppercase font-bold tracking-widest animate-pulse text-gray-400 text-xs">
          Sinkronisasi Parameter Sistem...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-100/50 rounded-2xl shadow-sm p-6 space-y-6">
            
            {/* CONFIG 1: HARGA SESI */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-gray-100 pb-6">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <DollarSign size={16} className="text-[#FF0000]" /> Tarif Per Sesi Foto
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Nominal tarif dasar paket yang akan di-generate menjadi kode QRIS DOKU pada layar mesin kios.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-xs text-gray-400">Rp</span>
                <Input required type="number" min="0" name="price_per_session" value={formData.price_per_session} onChange={handleInputChange} className="pl-9 h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20" />
              </div>
            </div>

            {/* CONFIG 1B: HARGA REPRINT */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-gray-100 pb-6">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <DollarSign size={16} className="text-[#FF0000]" /> Tarif Cetak Ulang (Reprint)
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Nominal tarif cetak tambahan per lembar bagi pelanggan yang ingin melakukan reprint dari halaman hasil cetak.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-xs text-gray-400">Rp</span>
                <Input required type="number" min="0" name="price_per_reprint" value={formData.price_per_reprint} onChange={handleInputChange} className="pl-9 h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20" />
              </div>
            </div>

            {/* CONFIG 2: NAMA EVENT AKTIF (NEW) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-gray-100 pb-6">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <CalendarRange size={16} className="text-[#FF0000]" /> Folder / Event Aktif
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Nama event saat ini (contoh: LUSTRUM). Mesin kios akan otomatis menampilkan bingkai &apos;Global&apos; DAN bingkai khusus event tersebut.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <Input required type="text" name="active_event_name" value={formData.active_event_name} onChange={handleInputChange} className="h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20 uppercase" placeholder="Global" />
              </div>
            </div>

            {/* CONFIG 3: DURASI TOTAL SESI */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-gray-100 pb-6">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <Timer size={16} className="text-[#FF0000]" /> Batas Durasi Sesi Bilik
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Alokasi waktu maksimal dalam satuan menit bagi pengguna di dalam bilik sebelum sesi berakhir otomatis.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <Input required type="number" min="1" name="session_duration_minutes" value={formData.session_duration_minutes} onChange={handleInputChange} className="h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20 pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 font-bold text-[10px] uppercase text-gray-400">Menit</span>
              </div>
            </div>

            {/* CONFIG 4: TIMER HITUNG MUNDUR KAMERA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-gray-100 pb-6">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <Camera size={16} className="text-[#FF0000]" /> Waktu Hitung Mundur Potret
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Jeda waktu (detik) untuk hitung mundur otomatis di layar kios sebelum kamera melakukan pengambilan jepretan.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <Input required type="number" min="1" name="countdown_duration_seconds" value={formData.countdown_duration_seconds} onChange={handleInputChange} className="h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20 pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 font-bold text-[10px] uppercase text-gray-400">Detik</span>
              </div>
            </div>

            {/* CONFIG 5: JUMLAH MAKSIMAL JEPRETAN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div className="max-w-md">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-gray-900">
                  <Image size={16} className="text-[#FF0000]" /> Kuota Jepretan Per Sesi
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">
                  Jumlah batas pengambilan gambar yang diberikan kepada pelanggan untuk kemudian dipilih ke dalam layout bingkai.
                </p>
              </div>
              <div className="w-full md:w-56 relative">
                <Input required type="number" min="1" name="max_photos_taken" value={formData.max_photos_taken} onChange={handleInputChange} className="h-11 border border-gray-200 rounded-xl font-bold text-sm bg-gray-50/20 pr-14" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 font-bold text-[10px] uppercase text-gray-400">Foto</span>
              </div>
            </div>

          </div>

          {/* BUTTON SIMPAN */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto bg-[#FF0000] hover:bg-[#d9383a] text-white rounded-xl h-12 px-6 font-bold uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none flex items-center gap-2"
            >
              <Save size={18} />
              <span>{submitting ? "MENYIMPAN..." : "SIMPAN PARAMETER"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}