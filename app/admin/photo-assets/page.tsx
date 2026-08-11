"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit, Trash2, Image as ImageIcon, CheckCircle2, XCircle, 
  AlertCircle, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, Upload, LayoutGrid, FolderClosed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

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
  event_name?: string;
  config?: { slots: Slot[] } | null;
  created_at: string;
}

const LAYOUT_PRESETS = {
  "2r_strip_3": [
    { id: 1, x: 125, y: 230, width: 420, height: 320 },
    { id: 2, x: 125, y: 615, width: 420, height: 320 },
    { id: 3, x: 125, y: 1000, width: 420, height: 320 },
    { id: 4, x: 655, y: 230, width: 420, height: 320 },
    { id: 5, x: 655, y: 615, width: 420, height: 320 },
    { id: 6, x: 655, y: 1000, width: 420, height: 320 }
  ],
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
    event_name: "Global",
  });
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/photo-assets"), {
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
    a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.event_name && a.event_name.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === "custom") return;
    
    const selectedPreset = LAYOUT_PRESETS[presetKey as keyof typeof LAYOUT_PRESETS];
    if (selectedPreset) {
      const newSlots = selectedPreset.map((slot, index) => ({
        ...slot,
        id: Date.now() + index 
      }));
      setSlots(newSlots);
      toast.success("Template Diterapkan!", { description: "Koordinat telah diisi otomatis." });
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", type: "frame", is_active: true, event_name: "Global" });
    setSlots([]); 
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
      event_name: asset.event_name || "Global",
    });
    setSlots(asset.config?.slots || []); 
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
      dataToSend.append("event_name", formData.event_name || "Global");
      
      if (formData.type === 'frame') {
        dataToSend.append("config", JSON.stringify({ slots: slots }));
      }
      
      if (selectedFile) {
        dataToSend.append("image", selectedFile);
      }

      let url = getApiUrl("/api/admin/photo-assets");
      const method = "POST";

      if (isEditMode) {
        url = getApiUrl(`/api/admin/photo-assets/${selectedId}`);
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
      const res = await fetch(getApiUrl(`/api/admin/photo-assets/${selectedId}`), {
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
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
            <ImageIcon size={32} className="text-[#FF0000]" />
            Pustaka Komponen Visual
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Pengelolaan Bingkai Overlay Kios & Penjadwalan Event
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white rounded-xl font-bold uppercase tracking-wider h-11 px-5 shadow-md shadow-red-500/10 cursor-pointer border-none"
          >
            <Plus size={18} />
            <span>Unggah Bingkai</span>
          </Button>
          <Button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-11 px-4 cursor-pointer"
          >
            <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-3 rounded-xl">
          <AlertCircle size={24} className="text-[#FF0000] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex bg-white p-4 border border-gray-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={18} />
          </span>
          <Input 
            type="text" 
            placeholder="CARI NAMA, TIPE, ATAU FOLDER EVENT..." 
            className="pl-11 h-11 border border-gray-200 rounded-xl font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-500 bg-gray-50/30 w-full md:w-1/2"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA ASET PHOTO */}
      <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <th className="p-4 pl-6 text-center w-16">No</th>
              <th className="p-4 w-32 text-center">Pratinjau</th>
              <th className="p-4">Nama Aset</th>
              <th className="p-4 text-center">Folder / Event</th>
              <th className="p-4 text-center">Tipe Komponen</th>
              <th className="p-4 text-center">Status Distribusi</th>
              <th className="p-4 pr-6 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Menarik berkas aset visual...
                </td>
              </tr>
            ) : paginatedAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  Tidak ada aset visual ditemukan di database.
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset, index) => (
                <tr key={asset.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 text-center text-gray-400 font-bold pl-6">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-2">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl mx-auto p-1 overflow-hidden flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZThlMmQ1Ii8+Cjwvc3ZnPg==')]">
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
                  <td className="p-4 tracking-wider uppercase font-bold text-gray-900 text-sm">{asset.name}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-[#FF0000]/10 text-[#FF0000] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      <FolderClosed size={10} className="mr-1" />
                      {asset.event_name || "Global"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {asset.type}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {asset.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
                        <CheckCircle2 size={10} /> AKTIF DI KIOS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full uppercase tracking-wider">
                        <XCircle size={10} /> NONAKTIF
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        onClick={() => openEditModal(asset)} 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl cursor-pointer"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        onClick={() => openDeleteModal(asset.id)} 
                        variant="destructive" 
                        size="icon" 
                        className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl cursor-pointer"
                      >
                        <Trash2 size={14} />
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
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-dashed border-gray-100 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            TOTAL ASPEK GRAFIS: <span className="text-[#FF0000]">{filteredAssets.length}</span> BERKAS
          </span>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-600">
              Hal {currentPage} / {totalPages}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH & EDIT ================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-y-auto max-h-[90vh] transition-all duration-300 ${formData.type === 'frame' ? 'max-w-4xl' : 'max-w-xl'}`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">
              {isEditMode ? "Ubah Komponen Grafis" : "Unggah Komponen Grafis"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className={formData.type === 'frame' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "space-y-4"}>
              
              {/* SISI KIRI: INPUT FORM */}
              <div className={formData.type === 'frame' ? "md:col-span-2 space-y-4" : "space-y-4"}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Aset Visual</label>
                    <Input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Garis Kotak Catur" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Folder / Event Aset</label>
                    <Input required name="event_name" value={formData.event_name} onChange={handleInputChange} placeholder="Contoh: Global atau LUSTRUM" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipe Komponen</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                      <option value="frame">Frame Overlay</option>
                      <option value="filter">Filter Visual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Status Distribusi</label>
                    <select name="is_active" value={formData.is_active.toString()} onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                      <option value="true">Aktif di Kios</option>
                      <option value="false">Simpan di Gudang (Nonaktif)</option>
                    </select>
                  </div>
                </div>

                {/* KOORDINAT SLOTS */}
                {formData.type === 'frame' && (
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                        <LayoutGrid size={16} className="text-[#FF0000]" /> Koordinat Lubang Foto
                      </label>
                      
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <select 
                          onChange={(e) => handleApplyPreset(e.target.value)}
                          defaultValue="custom"
                          className="border border-gray-200 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer text-gray-600 focus:outline-none"
                        >
                          <option value="custom">-- Pilih Template --</option>
                          <option value="2r_strip_square">Template 2R (Lubang KOTAK)</option>
                          <option value="2r_strip_3">Template 2R (6 Lubang)</option>
                          <option value="4r_grid_4">Template 4R (4 Lubang)</option>
                        </select>

                        <Button type="button" onClick={handleAddSlot} size="sm" className="bg-gray-800 text-white hover:bg-black font-bold uppercase text-[9px] tracking-wider rounded-lg h-7 px-3 border-none cursor-pointer">
                          + Custom Slot
                        </Button>
                      </div>
                    </div>
                    
                    {slots.length === 0 ? (
                      <div className="text-center p-4 text-[10px] font-bold text-gray-400 uppercase">Belum ada lubang foto ditentukan. Pilih Template di atas.</div>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {slots.map((slot, index) => (
                          <div key={slot.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
                            <div className="font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">#{index + 1}</div>
                            <Input type="number" placeholder="X" value={slot.x} onChange={(e) => handleSlotChange(index, "x", e.target.value)} className="w-full md:w-20 border border-gray-200 rounded-lg font-bold text-xs h-8 px-2" />
                            <Input type="number" placeholder="Y" value={slot.y} onChange={(e) => handleSlotChange(index, "y", e.target.value)} className="w-full md:w-20 border border-gray-200 rounded-lg font-bold text-xs h-8 px-2" />
                            <Input type="number" placeholder="Lebar" value={slot.width} onChange={(e) => handleSlotChange(index, "width", e.target.value)} className="w-full md:w-20 border border-gray-200 rounded-lg font-bold text-xs h-8 px-2" />
                            <Input type="number" placeholder="Tinggi" value={slot.height} onChange={(e) => handleSlotChange(index, "height", e.target.value)} className="w-full md:w-20 border border-gray-200 rounded-lg font-bold text-xs h-8 px-2" />
                            <Button type="button" onClick={() => handleRemoveSlot(index)} variant="destructive" size="icon" className="h-8 w-8 shrink-0 bg-red-50 text-red-500 border border-red-100 rounded-lg flex items-center justify-center p-0 cursor-pointer">
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* UPLOAD FILE */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Berkas Bingkai PNG {isEditMode && "(Kosongkan jika gambar tidak diganti)"}
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-gray-200 bg-gray-50/30 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-center gap-2"
                  >
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Klik untuk memilih berkas PNG transparan</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" className="hidden" required={!isEditMode} />
                  </div>
                </div>

                {/* AREA PREVIEW GAMBAR (Tipe Selain Frame) */}
                {formData.type !== 'frame' && previewUrl && (
                  <div className="border border-gray-100 p-2 bg-white rounded-xl shadow-sm space-y-1.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1"><Eye size={12}/> Pratinjau Berkas Terpilih:</div>
                    <div className="h-40 w-full bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center justify-center overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZThlMmQ1Ii8+Cjwvc3ZnPg==')]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* SISI KANAN: LIVE PREVIEW (Tipe Frame) */}
              {formData.type === 'frame' && (
                <div className="space-y-2 flex flex-col items-center border-t md:border-t-0 md:border-l border-dashed border-gray-100 pt-6 md:pt-0 md:pl-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 self-start flex items-center gap-1">
                    <Eye size={14} className="text-[#FF0000]" /> Pratinjau Lubang Bingkai (Live)
                  </label>
                  
                  <div className="relative w-full max-w-[240px] aspect-[2/3] bg-gray-50 border border-gray-150 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZThlMmQ1Ii8+Cjwvc3ZnPg==')]">
                    {previewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={previewUrl} 
                          alt="Live Preview Frame" 
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 animate-fade-in" 
                        />
                        {slots.map((slot, index) => {
                          const leftPct = (slot.x / 1200) * 100;
                          const topPct = (slot.y / 1800) * 100;
                          const widthPct = (slot.width / 1200) * 100;
                          const heightPct = (slot.height / 1800) * 100;
                          
                          return (
                            <div
                              key={`live-slot-preview-${slot.id}-${index}`}
                              className="absolute border-2 border-[#FF0000] bg-[#FF0000]/15 flex flex-col items-center justify-center text-[#FF0000] font-black text-[9px] uppercase z-20 pointer-events-none"
                              style={{
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                width: `${widthPct}%`,
                                height: `${heightPct}%`,
                              }}
                            >
                              <span>S{index + 1}</span>
                              <span className="text-[7px] font-bold block leading-none">{slot.width}x{slot.height}</span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center p-6 text-xs font-bold text-gray-300 uppercase">Belum ada gambar bingkai dipilih</div>
                    )}
                  </div>
                  
                  <div className="text-[9px] font-bold text-gray-400 leading-relaxed mt-2 text-center uppercase tracking-wide bg-gray-50 p-2.5 rounded-xl border border-gray-100/50 w-full">
                    Keterangan:<br/>
                    Skala Kanvas Bingkai Standar adalah <strong className="text-[#FF0000]">1200 x 1800</strong> piksel.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer">Batal</Button>
              <Button type="submit" className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none">
                {isEditMode ? "Simpan Perubahan" : "Terbitkan Bingkai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-red-600 border-b border-gray-50 pb-4 mb-4">Musnahkan Aset?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin menghapus aset visual ini secara permanen dari server? Gambar bingkai tidak akan dapat dipilih lagi oleh kios Kiosk.
          </div>
          <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer">Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none">Ya, Hapus!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}