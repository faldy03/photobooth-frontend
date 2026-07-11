"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, MonitorSmartphone, Activity, 
  Wifi, WifiOff, Wrench, AlertCircle, MapPin, Search, ChevronLeft, ChevronRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

interface KioskDevice {
  id: number;
  device_id: string;
  location_name: string;
  status: 'active' | 'offline' | 'maintenance';
  last_seen: string | null;
  sessions_count?: number; 
}

export default function KiosksPage() {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State Pencarian & Paginasi Client-Side
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    device_id: "",
    location_name: "",
    status: "active",
  });

  // Fetch Data Server
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/kiosk-devices"), {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil data server.");
      
      setDevices(data.data || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [refreshTrigger]);

  // Logika Filter & Paginasi
  const filteredDevices = devices.filter(d => 
    d.device_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({ device_id: "", location_name: "", status: "active" });
    setIsAddOpen(true);
  };

  const openEditModal = (device: KioskDevice) => {
    setSelectedId(device.id);
    setFormData({
      device_id: device.device_id,
      location_name: device.location_name,
      status: device.status === 'active' ? 'active' : device.status,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  // Submit Tambah
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/kiosk-devices"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mendaftarkan mesin.");
      
      toast.success("BERHASIL!", { description: "Mesin Kios baru didaftarkan." });
      setIsAddOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl(`/api/admin/kiosk-devices/${selectedId}`), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah data mesin.");
      
      toast.success("DIPERBARUI!", { description: "Data mesin kios diubah." });
      setIsEditOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // Submit Hapus
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl(`/api/admin/kiosk-devices/${selectedId}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      if (!res.ok) throw new Error("Gagal menghapus mesin.");
      
      toast.success("DIHAPUS!", { description: "Mesin dihapus dari jaringan." });
      setIsDeleteOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // Helper Render Status Badge
  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1.5 text-green-800 bg-green-100 border-[2px] border-green-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#166534]"><Wifi size={12} strokeWidth={3} /> Active</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-100 border-[2px] border-amber-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#92400E]"><Wrench size={12} strokeWidth={3} /> Perawatan</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-white bg-[#FF0000] border-[2px] border-retro-charcoal px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#262626]"><WifiOff size={12} strokeWidth={3} /> Offline</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 text-retro-charcoal max-w-6xl mx-auto font-sans">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <MonitorSmartphone size={32} className="text-[#FF0000]" />
            Manajemen Mesin Kios
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Pemantauan Fisik & Jaringan Photobooth
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Registrasi Kios</span>
          </Button>
          <Button
            onClick={() => { fetchDevices(); }}
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
            <Search size={18} />
          </span>
          <Input
            type="text"
            placeholder="CARI ID PERANGKAT ATAU LOKASI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 border-[2px] border-retro-charcoal font-bold uppercase tracking-wider focus-visible:ring-retro-charcoal w-full md:w-1/2"
          />
        </div>
      </div>

      {/* TABEL DATA KIOS */}
      <div className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
              <th className="p-4 text-center w-16">No</th>
              <th className="p-4">ID Perangkat</th>
              <th className="p-4">Lokasi Operasional</th>
              <th className="p-4 text-center">Total Sesi</th>
              <th className="p-4 text-center">Last Seen</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memindai jaringan Kios...
                </td>
              </tr>
            ) : paginatedDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  Tidak ada data Kios yang ditemukan.
                </td>
              </tr>
            ) : (
              paginatedDevices.map((device, index) => (
                <tr key={device.id} className="hover:bg-[#EFE9DB]/30 transition-colors">
                  <td className="p-4 text-center text-lg font-black text-retro-charcoal/70">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-4 tracking-wider uppercase font-black">
                    <span className="bg-white border-[2px] border-retro-charcoal px-3 py-1.5 shadow-[3px_3px_0_0_#262626]">
                      {device.device_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-retro-charcoal/80 uppercase">
                      <MapPin size={16} className="text-[#FF0000]" strokeWidth={3} />
                      {device.location_name}
                    </div>
                  </td>
                  <td className="p-4 text-center text-xl font-black">
                    {device.sessions_count || 0}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-retro-charcoal/60">
                      <Activity size={14} />
                      {device.last_seen ? new Date(device.last_seen).toLocaleString('id-ID') : "Belum Aktif"}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {renderStatus(device.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        onClick={() => openEditModal(device)} 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 border-[2px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                      >
                        <Edit size={14} strokeWidth={3} />
                      </Button>
                      <Button 
                        onClick={() => openDeleteModal(device.id)} 
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

      {/* PAGINATION CONTROLS */}
      {!loading && filteredDevices.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t-[3px] border-dashed border-retro-charcoal pt-6">
          <span className="text-sm font-black uppercase tracking-widest text-retro-charcoal/70">
            TOTAL DATA KIOS: <span className="text-[#FF0000]">{filteredDevices.length}</span> PERANGKAT
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

      {/* ================= MODAL TAMBAH ================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Registrasi Kios Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">ID Perangkat (Serial Mesin)</label>
              <Input required name="device_id" value={formData.device_id} onChange={handleInputChange} placeholder="Contoh: KIOSK-001" className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Lokasi Penempatan</label>
              <Input required name="location_name" value={formData.location_name} onChange={handleInputChange} placeholder="Contoh: Mall Kelapa Gading Lt 2" className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Status Awal</label>
              <select required name="status" value={formData.status} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <DialogFooter className="mt-6 border-t-[3px] border-dashed border-retro-charcoal pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddOpen(false)} 
                className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Daftarkan Mesin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL EDIT ================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Ubah Data Kios</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">ID Perangkat (Serial Mesin)</label>
              <Input required name="device_id" value={formData.device_id} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Lokasi Penempatan</label>
              <Input required name="location_name" value={formData.location_name} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Status Mesin</label>
              <select required name="status" value={formData.status} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <DialogFooter className="mt-6 border-t-[3px] border-dashed border-retro-charcoal pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)} 
                className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL HAPUS ================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-[#FF0000] border-b-[4px] border-retro-charcoal pb-4 mb-2">Cabut Mesin?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
            Hapus mesin ini dari jaringan pemantauan? Tindakan ini tidak akan menghapus riwayat transaksi dari mesin tersebut.
          </div>
          <DialogFooter className="flex gap-2 border-t-[3px] border-dashed border-retro-charcoal pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)} 
              className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm} 
              className="bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
            >
              Cabut Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}