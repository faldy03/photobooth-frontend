"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit, Trash2, Image as ImageIcon, CheckCircle2, XCircle, 
  AlertCircle, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, Upload, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Slot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoAsset {
  id: number;
  name: string;
  type: 'frame' | 'filter';
  file_path: string;
  image_url: string; 
  is_active: boolean;
  config?: { slots: Slot[] } | null;
  created_at: string;
}

// =========================================================================
// DAFTAR PRESET LAYOUT OTOMATIS
// Tambahkan konfigurasi frame baru di sini jika di masa depan ada desain baru
// =========================================================================
const LAYOUT_PRESETS = {
  "2r_strip_3": [
    { id: 1, x: 125, y: 230, width: 420, height: 320 },
    { id: 2, x: 125, y: 615, width: 420, height: 320 },
    { id: 3, x: 125, y: 1000, width: 420, height: 320 },
    { id: 4, x: 655, y: 230, width: 420, height: 320 },
    { id: 5, x: 655, y: 615, width: 420, height: 320 },
    { id: 6, x: 655, y: 1000, width: 420, height: 320 }
  ],
  // =========================================================
  // PRESET 2 BARU: 2R Double Strip (Lubang Kotak/Square)
  // Cocok untuk frame Picta Anda yang terbaru!
  // =========================================================
  "2r_strip_square": [
    { id: 1, x: 60, y: 60, width: 480, height: 480 },
    { id: 2, x: 60, y: 600, width: 480, height: 480 },
    { id: 3, x: 60, y: 1140, width: 480, height: 480 },
    { id: 4, x: 660, y: 60, width: 480, height: 480 },
    { id: 5, x: 660, y: 600, width: 480, height: 480 },
    { id: 6, x: 660, y: 1140, width: 480, height: 480 }
  ],
  "4r_grid_4": [
    { id: 1, x: 100, y: 100, width: 450, height: 750 },
    { id: 2, x: 650, y: 100, width: 450, height: 750 },
    { id: 3, x: 100, y: 950, width: 450, height: 750 },
    { id: 4, x: 650, y: 950, width: 450, height: 750 }
  ]
};

export default function PhotoAssetsPage() {
  const [assets, setAssets] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State Pencarian & Paginasi Client-Side
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "frame",
    is_active: true,
  });
  
  // STATE BARU UNTUK KOORDINAT FRAME
  const [slots, setSlots] = useState<Slot[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://127.0.0.1:8000/api/admin/photo-assets", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil data aset visual.");
      
      setAssets(data.data || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [refreshTrigger]);

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- LOGIKA KOORDINAT (SLOTS & PRESETS) ---
  const handleAddSlot = () => {
    setSlots([...slots, { id: Date.now(), x: 0, y: 0, width: 480, height: 360 }]);
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    setSlots(slots.filter((_, index) => index !== indexToRemove));
  };

  const handleSlotChange = (index: number, field: keyof Slot, value: string) => {
    const updatedSlots = [...slots];
    updatedSlots[index][field] = Number(value);
    setSlots(updatedSlots);
  };

  // Fungsi untuk mengisi otomatis dari template
  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === "custom") return;
    
    const selectedPreset = LAYOUT_PRESETS[presetKey as keyof typeof LAYOUT_PRESETS];
    if (selectedPreset) {
      // Buat ID unik baru agar React merender dengan benar
      const newSlots = selectedPreset.map((slot, index) => ({
        ...slot,
        id: Date.now() + index 
      }));
      setSlots(newSlots);
      toast.success("Template Diterapkan!", { description: "Koordinat telah diisi otomatis." });
    }
  };
  // ------------------------------------------

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", type: "frame", is_active: true });
    setSlots([]); // Kosongkan slots saat tambah baru
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (asset: PhotoAsset) => {
    setIsEditMode(true);
    setSelectedId(asset.id);
    setFormData({
      name: asset.name,
      type: asset.type,
      is_active: asset.is_active,
    });
    setSlots(asset.config?.slots || []); // Isi form slots dengan data dari database
    setSelectedFile(null);
    setPreviewUrl(asset.image_url); 
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("type", formData.type);
      dataToSend.append("is_active", formData.is_active ? "1" : "0");
      
      // Kirim array koordinat sebagai JSON string
      if (formData.type === 'frame') {
        dataToSend.append("config", JSON.stringify({ slots: slots }));
      }
      
      if (selectedFile) {
        dataToSend.append("image", selectedFile);
      }

      let url = "http://127.0.0.1:8000/api/admin/photo-assets";
      const method = "POST";

      if (isEditMode) {
        url = `http://127.0.0.1:8000/api/admin/photo-assets/${selectedId}`;
        dataToSend.append("_method", "PUT"); 
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        body: dataToSend, 
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memproses berkas aset visual.");
      
      toast.success(isEditMode ? "DIPERBARUI!" : "BERHASIL!", { 
        description: isEditMode ? "Komponen visual berhasil diperbarui." : "Desain bingkai baru berhasil ditambahkan." 
      });
      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("PROSES GAGAL!", { description: (err as Error).message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/admin/photo-assets/${selectedId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      if (!res.ok) throw new Error("Gagal menghapus aset dari server.");
      
      toast.success("DIHAPUS!", { description: "Komponen visual telah dimusnahkan dari penyimpanan." });
      setIsDeleteOpen(false);
      if (paginatedAssets.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  return (
    <div className="p-6 space-y-6 text-retro-charcoal max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <ImageIcon size={32} className="text-[#FF0000]" />
            Pustaka Komponen Visual
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Pengelolaan Bingkai Overlay Kios (Format PNG Transparan)
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Unggah Bingkai</span>
          </Button>
          <Button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="border-[3px] border-retro-charcoal bg-white hover:bg-[#EFE9DB] text-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none h-12 px-4"
          >
            <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#262626]">
          <AlertCircle size={24} className="text-[#FF0000]" />
          <span>{error}</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex bg-white p-4 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-retro-charcoal/50">
            <Search size={18} strokeWidth={3} />
          </span>
          <Input 
            type="text" 
            placeholder="CARI NAMA KOMPONEN ATAU TIPE..." 
            className="pl-11 h-12 border-[2px] border-retro-charcoal font-bold uppercase tracking-wider focus-visible:ring-retro-charcoal w-full md:w-1/2"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA ASET PHOTO */}
      <div className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
              <th className="p-4 text-center w-16">No</th>
              <th className="p-4 w-32 text-center">Pratinjau</th>
              <th className="p-4">Nama Aset</th>
              <th className="p-4 text-center">Tipe Komponen</th>
              <th className="p-4 text-center">Status Jaringan</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Menarik berkas aset visual...
                </td>
              </tr>
            ) : paginatedAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  Tidak ada aset visual ditemukan di database.
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset, index) => (
                <tr key={asset.id} className="hover:bg-[#EFE9DB]/30 transition-colors">
                  <td className="p-4 text-center text-lg font-black text-retro-charcoal/70">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-2 text-center">
                    <div className="w-20 h-20 bg-retro-cream border-[2px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] mx-auto p-1 overflow-hidden flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZThlMmQ1Ii8+Cjwvc3ZnPg==')]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={asset.image_url} 
                        alt={asset.name} 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyNjI2MjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0iTTIxIDE1bC01LTUtNCA0LTQtNC00IDQiLz48L3N2Zz4=";
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-4 tracking-wider uppercase font-black text-base">{asset.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-white border-[2px] border-retro-charcoal text-retro-charcoal px-3 py-1 text-xs font-black tracking-widest uppercase inline-block shadow-[2px_2px_0_0_#262626]">
                      {asset.type}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {asset.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-green-800 bg-green-100 border-[2px] border-green-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#166534]">
                        <CheckCircle2 size={12} strokeWidth={3} /> AKTIF DI KIOS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-white bg-[#FF0000] border-[2px] border-retro-charcoal px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#262626]">
                        <XCircle size={12} strokeWidth={3} /> NONAKTIF
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        onClick={() => openEditModal(asset)} 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 border-[2px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                      >
                        <Edit size={14} strokeWidth={3} />
                      </Button>
                      <Button 
                        onClick={() => openDeleteModal(asset.id)} 
                        variant="destructive" 
                        size="icon" 
                        className="h-9 w-9 border-[2px] border-retro-charcoal bg-[#FF0000] text-white shadow-[2px_2px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                      >
                        <Trash2 size={14} strokeWidth={3} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLS PAGINASI */}
      {!loading && filteredAssets.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t-[3px] border-dashed border-retro-charcoal pt-6">
          <span className="text-sm font-black uppercase tracking-widest text-retro-charcoal/70">
            TOTAL ASPEK GRAFIS: <span className="text-[#FF0000]">{filteredAssets.length}</span> BERKAS
          </span>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-white border-[2px] border-retro-charcoal px-3 py-2">
              Hal {currentPage} / {totalPages}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="border-[3px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none font-black uppercase tracking-widest"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-[3px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none font-black uppercase tracking-widest"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH & EDIT ================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">
              {isEditMode ? "Ubah Komponen Grafis" : "Unggah Komponen Grafis"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Nama Aset Visual</label>
              <Input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Garis Kotak Catur Retro" className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Tipe Komponen</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                  <option value="frame">Frame Overlay</option>
                  <option value="filter">Filter Visual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Status Distribusi</label>
                <select name="is_active" value={formData.is_active.toString()} onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                  <option value="true">Aktif di Kios</option>
                  <option value="false">Simpan di Gudang (Nonaktif)</option>
                </select>
              </div>
            </div>

            {/* KOORDINAT SLOTS DENGAN DROPDOWN PRESET */}
            {formData.type === 'frame' && (
              <div className="border-[3px] border-retro-charcoal p-4 bg-[#EFE9DB]/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <label className="block text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid size={16} /> Koordinat Lubang Foto
                  </label>
                  
                  {/* DROPDOWN TEMPLATE CEPAT */}
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select 
                      onChange={(e) => handleApplyPreset(e.target.value)}
                      defaultValue="custom"
                      className="border-[2px] border-retro-charcoal bg-white px-2 py-1 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      <option value="custom">-- Pilih Template Cepat --</option>
                      <option value="2r_strip_square">Template 2R Strip (Lubang KOTAK)</option>
                      <option value="2r_strip_3">Template 2R Strip (6 Lubang)</option>
                      <option value="4r_grid_4">Template 4R Grid (4 Lubang)</option>
                    </select>

                    <Button type="button" onClick={handleAddSlot} size="sm" className="bg-retro-charcoal text-white hover:bg-black font-bold uppercase text-[10px] tracking-wider border-[2px] border-retro-charcoal">
                      + Custom Slot
                    </Button>
                  </div>
                </div>
                
                {slots.length === 0 ? (
                  <div className="text-center p-4 text-xs font-bold text-retro-charcoal/60 uppercase">Belum ada lubang foto ditentukan. Pilih Template di atas.</div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {slots.map((slot, index) => (
                      <div key={slot.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                        <div className="font-black bg-retro-charcoal text-white px-2 py-1 text-xs">#{index + 1}</div>
                        <Input type="number" placeholder="X" value={slot.x} onChange={(e) => handleSlotChange(index, "x", e.target.value)} className="w-full md:w-20 border-[2px] border-retro-charcoal font-bold text-sm h-8" />
                        <Input type="number" placeholder="Y" value={slot.y} onChange={(e) => handleSlotChange(index, "y", e.target.value)} className="w-full md:w-20 border-[2px] border-retro-charcoal font-bold text-sm h-8" />
                        <Input type="number" placeholder="Lebar" value={slot.width} onChange={(e) => handleSlotChange(index, "width", e.target.value)} className="w-full md:w-20 border-[2px] border-retro-charcoal font-bold text-sm h-8" />
                        <Input type="number" placeholder="Tinggi" value={slot.height} onChange={(e) => handleSlotChange(index, "height", e.target.value)} className="w-full md:w-20 border-[2px] border-retro-charcoal font-bold text-sm h-8" />
                        <Button type="button" onClick={() => handleRemoveSlot(index)} variant="destructive" size="icon" className="h-8 w-8 shrink-0 border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AREA INPUT UPLOAD FILE */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">
                Berkas Bingkai PNG {isEditMode && "(Kosongkan jika gambar tidak diganti)"}
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-[3px] border-dashed border-retro-charcoal bg-[#EFE9DB]/10 p-6 text-center cursor-pointer hover:bg-[#EFE9DB]/30 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Upload size={24} className="text-retro-charcoal/50" />
                <span className="text-xs font-black uppercase tracking-wider">Klik untuk memilih berkas PNG transparan</span>
                <span className="text-[10px] font-bold text-retro-charcoal/40">Maksimal Ukuran File: 5 MB</span>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" className="hidden" required={!isEditMode} />
              </div>
            </div>

            {/* AREA PREVIEW GAMBAR */}
            {previewUrl && (
              <div className="border-[3px] border-retro-charcoal p-2 bg-white shadow-[4px_4px_0_0_#262626]">
                <div className="text-[10px] font-black uppercase tracking-widest text-retro-charcoal/50 mb-1 flex items-center gap-1"><Eye size={12}/> Pratinjau Berkas Terpilih:</div>
                <div className="h-40 w-full bg-retro-cream border-[2px] border-retro-charcoal p-2 flex items-center justify-center overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZThlMmQ1Ii8+Cjwvc3ZnPg==')]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 border-t-[3px] border-dashed border-retro-charcoal pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest">Batal</Button>
              <Button type="submit" className="bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest">
                {isEditMode ? "Simpan Perubahan" : "Terbitkan Bingkai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-[#FF0000] border-b-[4px] border-retro-charcoal pb-4 mb-2">Musnahkan Aset?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
            Apakah Anda yakin ingin menghapus aset visual ini secara permanen dari server? Gambar bingkai tidak akan dapat dipilih lagi oleh kios Kiosk.
          </div>
          <DialogFooter className="flex gap-2 border-t-[3px] border-dashed border-retro-charcoal pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest">Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest">Ya, Hapus!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}