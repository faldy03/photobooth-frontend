"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, MonitorSmartphone, Activity, 
  Wifi, WifiOff, Wrench, AlertCircle, MapPin, Search, ChevronLeft, ChevronRight, RefreshCw,
  Camera, CameraOff
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
  is_camera_connected?: boolean;
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
  const renderStatus = (device: KioskDevice) => {
    if (device.status === "offline") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full uppercase tracking-wider">
          <WifiOff size={10} /> Offline
        </span>
      );
    }
    
    if (device.is_camera_connected === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-full uppercase tracking-wider">
          <Wrench size={10} /> Cam Error
        </span>
      );
    }

    if (device.status === "maintenance") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-full uppercase tracking-wider">
          <Wrench size={10} /> Perawatan
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
        <Wifi size={10} /> Active
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
            <MonitorSmartphone size={32} className="text-[#FF0000]" />
            Manajemen Mesin Kios
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Pemantauan Fisik & Jaringan Photobooth
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white rounded-xl font-bold uppercase tracking-wider h-11 px-5 shadow-md shadow-red-500/10 cursor-pointer border-none"
          >
            <Plus size={18} />
            <span>Registrasi Kios</span>
          </Button>
          <Button
            onClick={() => { fetchDevices(); }}
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
            placeholder="CARI ID PERANGKAT ATAU LOKASI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 border border-gray-200 rounded-xl font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-500 bg-gray-50/30 w-full md:w-1/2"
          />
        </div>
      </div>

      {/* TABEL DATA KIOS */}
      <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <th className="p-4 pl-6 text-center w-16">No</th>
              <th className="p-4">ID Perangkat</th>
              <th className="p-4">Lokasi Operasional</th>
              <th className="p-4 text-center">Total Sesi</th>
              <th className="p-4 text-center">Last Seen</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memindai jaringan Kios...
                </td>
              </tr>
            ) : paginatedDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  Tidak ada data Kios yang ditemukan.
                </td>
              </tr>
            ) : (
              paginatedDevices.map((device, index) => (
                <tr key={device.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 text-center text-gray-400 font-bold pl-6">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-4 tracking-wider uppercase font-bold text-gray-900">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-800 text-xs font-mono font-bold">
                      {device.device_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 uppercase">
                      <MapPin size={16} className="text-[#FF0000]" />
                      {device.location_name}
                    </div>
                  </td>
                  <td className="p-4 text-center text-sm font-bold text-gray-900">
                    {device.sessions_count || 0}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-gray-400">
                      <Activity size={14} />
                      {device.last_seen ? new Date(device.last_seen).toLocaleString('id-ID') : "Belum Aktif"}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1.5 justify-center">
                      {renderStatus(device)}
                      {device.status !== 'offline' && (
                        device.is_camera_connected ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-green-700 bg-green-50/50 px-2 py-0.5 rounded border border-green-100 font-bold uppercase tracking-wider">
                            <Camera size={10} /> DSLR Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-red-600 bg-red-50/50 px-2 py-0.5 rounded border border-red-100 font-bold uppercase tracking-wider animate-pulse">
                            <CameraOff size={10} /> DSLR Error
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        onClick={() => openEditModal(device)} 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl cursor-pointer"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        onClick={() => openDeleteModal(device.id)} 
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

      {/* PAGINATION CONTROLS */}
      {!loading && filteredDevices.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-dashed border-gray-100 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            TOTAL DATA KIOS: <span className="text-[#FF0000]">{filteredDevices.length}</span> PERANGKAT
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

      {/* ================= MODAL TAMBAH ================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">Registrasi Kios Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">ID Perangkat (Serial Mesin)</label>
              <Input required name="device_id" value={formData.device_id} onChange={handleInputChange} placeholder="Contoh: KIOSK-001" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Lokasi Penempatan</label>
              <Input required name="location_name" value={formData.location_name} onChange={handleInputChange} placeholder="Contoh: Mall Kelapa Gading Lt 2" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Status Awal</label>
              <select required name="status" value={formData.status} onChange={handleInputChange} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddOpen(false)} 
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none"
              >
                Daftarkan Mesin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL EDIT ================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">Ubah Data Kios</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">ID Perangkat (Serial Mesin)</label>
              <Input required name="device_id" value={formData.device_id} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Lokasi Penempatan</label>
              <Input required name="location_name" value={formData.location_name} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Status Mesin</label>
              <select required name="status" value={formData.status} onChange={handleInputChange} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)} 
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none"
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL HAPUS ================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-red-600 border-b border-gray-50 pb-4 mb-4">Cabut Mesin?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            Hapus mesin ini dari jaringan pemantauan? Tindakan ini tidak akan menghapus riwayat transaksi dari mesin tersebut.
          </div>
          <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)} 
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm} 
              className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none"
            >
              Cabut Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}