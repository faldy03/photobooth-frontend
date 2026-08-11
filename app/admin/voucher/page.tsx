"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Ticket, CheckCircle2, XCircle, 
  CalendarDays, AlertCircle, Search, ChevronLeft, ChevronRight, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

interface Voucher {
  id: number;
  code: string;
  type: string;
  discount_value: number;
  max_uses: number;
  used_count: number;
  expired_at: string;
  is_active: boolean;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State untuk me-refresh tabel setelah CRUD
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State Paginasi & Pencarian
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // STATE UNTUK MODAL (POP-UP)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // State Data Formulir
  const [formData, setFormData] = useState({
    code: "",
    type: "DISCOUNT",
    discount_value: "",
    max_uses: "",
    expired_at: "",
  });

  // MENGAMBIL DATA DARI SERVER
  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(getApiUrl("/api/admin/vouchers"), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal mengambil data server.");
        
        if (data && Array.isArray(data.data)) setVouchers(data.data);
        else if (Array.isArray(data)) setVouchers(data);
        else setVouchers([]);
      } catch (err: unknown) {
        setError((err as Error).message);
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [refreshTrigger]);

  // LOGIKA PENCARIAN & PAGINASI
  const filteredVouchers = vouchers.filter((v) => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage) || 1;
  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({ code: "", type: "DISCOUNT", discount_value: "", max_uses: "", expired_at: "" });
    setIsAddOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setSelectedId(voucher.id);
    setFormData({
      code: voucher.code,
      type: voucher.type,
      discount_value: voucher.discount_value.toString(),
      max_uses: voucher.max_uses.toString(),
      expired_at: new Date(voucher.expired_at).toISOString().split('T')[0],
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  // TAMBAH KUPON
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/vouchers"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah data.");
      
      toast.success("BERHASIL!", { description: "Kupon baru berhasil diterbitkan." });
      setIsAddOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // EDIT KUPON
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl(`/api/admin/vouchers/${selectedId}`), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah data.");
      
      toast.success("DIPERBARUI!", { description: "Data kupon berhasil diubah." });
      setIsEditOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // HAPUS KUPON
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl(`/api/admin/vouchers/${selectedId}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      if (!res.ok) throw new Error("Gagal menghapus data.");
      
      toast.success("DIHAPUS!", { description: "Kupon telah dimusnahkan." });
      setIsDeleteOpen(false);
      
      if (paginatedVouchers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
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
            <Ticket size={32} className="text-[#FF0000]" />
            Manajemen Kupon
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Sinkronisasi Database Aktif
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white rounded-xl font-bold uppercase tracking-wider h-11 px-5 shadow-md shadow-red-500/10 cursor-pointer border-none"
          >
            <Plus size={18} />
            <span>Tambah Kupon</span>
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

      {/* KOTAK PENCARIAN */}
      <div className="flex bg-white p-4 border border-gray-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={18} />
          </span>
          <Input 
            type="text" 
            placeholder="CARI KODE UNIK ATAU TIPE..." 
            className="pl-11 h-11 border border-gray-200 rounded-xl font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-500 bg-gray-50/30 w-full md:w-1/2"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA KUPON */}
      <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <th className="p-4 pl-6 text-center w-16">No</th>
              <th className="p-4">Kode Unik</th>
              <th className="p-4">Detail Promo</th>
              <th className="p-4 text-center">Pemakaian</th>
              <th className="p-4 text-center">Kedaluwarsa</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memuat data dari server...
                </td>
              </tr>
            ) : paginatedVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  Data tidak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedVouchers.map((voucher, index) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0); 
                
                const expiredDate = new Date(voucher.expired_at);
                expiredDate.setHours(0, 0, 0, 0);

                const isExpired = expiredDate < today;
                const isQuotaFull = voucher.used_count >= voucher.max_uses;
                const isActuallyActive = voucher.is_active && !isExpired && !isQuotaFull;

                return (
                  <tr key={voucher.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 text-center text-gray-400 font-bold pl-6">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-900 text-white px-2.5 py-1.5 font-mono font-bold text-xs rounded tracking-widest inline-block shadow-sm">
                        {voucher.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold uppercase text-gray-900">{voucher.type.replace('_', ' ')}</div>
                      {voucher.discount_value > 0 && (
                        <div className="text-[10px] text-[#FF0000] font-bold mt-0.5 tracking-wider">
                          Nilai: {Number(voucher.discount_value).toLocaleString('id-ID')} {voucher.type === 'DISCOUNT' ? 'IDR' : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">
                          {voucher.used_count} <span className="text-xs text-gray-400 font-medium">/ {voucher.max_uses}</span>
                        </span>
                        {/* Clean Rounded progress bar */}
                        <div className="w-24 bg-gray-100 h-2 mt-1.5 overflow-hidden rounded-full">
                          <div className="bg-[#FF0000] h-full rounded-full" style={{ width: `${Math.min((voucher.used_count / voucher.max_uses) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <CalendarDays size={14} className="text-[#FF0000]" />
                        {new Date(voucher.expired_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {isActuallyActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
                          <CheckCircle2 size={10} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full uppercase tracking-wider">
                          {isExpired ? "Kedaluwarsa" : isQuotaFull ? "Habis" : "Nonaktif"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          onClick={() => openEditModal(voucher)} 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl cursor-pointer"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          onClick={() => openDeleteModal(voucher.id)} 
                          variant="destructive" 
                          size="icon" 
                          className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* KONTROL PAGINASI */}
      {!loading && filteredVouchers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-dashed border-gray-100 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            TOTAL KUPON: <span className="text-[#FF0000]">{filteredVouchers.length}</span> DATA
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

      {/* 1. MODAL TAMBAH DATA */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">Terbitkan Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} placeholder="PROMO2026" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} placeholder="0" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} placeholder="100" className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
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
                Simpan Kupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL EDIT DATA */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">Ubah Data Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]">
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase" />
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
                Perbarui Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-red-600 border-b border-gray-50 pb-4 mb-4">Peringatan Penghancuran</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin memusnahkan kupon ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.
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
              Ya, Musnahkan!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}