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

  // ==========================================
  // FUNGSI CRUD (CREATE, UPDATE, DELETE)
  // ==========================================

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
    <div className="p-6 space-y-6 text-retro-charcoal max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Ticket size={32} className="text-[#FF0000]" />
            Manajemen Kupon
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Sinkronisasi Database Aktif
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={openAddModal} 
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Tambah Kupon</span>
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

      {/* KOTAK PENCARIAN (Retro Style) */}
      <div className="flex bg-white p-4 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-retro-charcoal/50">
            <Search size={18} strokeWidth={3} />
          </span>
          <Input 
            type="text" 
            placeholder="CARI KODE UNIK ATAU TIPE..." 
            className="pl-11 h-12 border-[2px] border-retro-charcoal font-bold uppercase tracking-wider focus-visible:ring-retro-charcoal w-full md:w-1/2"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA KUPON */}
      <div className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
              <th className="p-4 text-center w-16">No</th>
              <th className="p-4">Kode Unik</th>
              <th className="p-4">Detail Promo</th>
              <th className="p-4 text-center">Pemakaian</th>
              <th className="p-4 text-center">Kedaluwarsa</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memuat data dari server...
                </td>
              </tr>
            ) : paginatedVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  Data tidak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedVouchers.map((voucher, index) => {
                // ========================================================
                // LOGIKA PENGECEKAN STATUS KUPON (KEDALUWARSA & KUOTA)
                // ========================================================
                const today = new Date();
                today.setHours(0, 0, 0, 0); 
                
                const expiredDate = new Date(voucher.expired_at);
                expiredDate.setHours(0, 0, 0, 0);

                const isExpired = expiredDate < today;
                const isQuotaFull = voucher.used_count >= voucher.max_uses;
                
                const isActuallyActive = voucher.is_active && !isExpired && !isQuotaFull;

                return (
                  <tr key={voucher.id} className="hover:bg-[#EFE9DB]/30 transition-colors">
                    <td className="p-4 text-center text-lg font-black text-retro-charcoal/70">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-4">
                      <span className="bg-retro-charcoal text-[#EFE9DB] border-[2px] border-retro-charcoal px-3 py-1.5 font-black tracking-widest text-sm inline-block shadow-[3px_3px_0_0_#d9383a]">
                        {voucher.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-black uppercase text-retro-charcoal">{voucher.type.replace('_', ' ')}</div>
                      {voucher.discount_value > 0 && (
                        <div className="text-xs text-[#FF0000] font-bold mt-1 tracking-wider">
                          Nilai: {Number(voucher.discount_value).toLocaleString('id-ID')} {voucher.type === 'DISCOUNT' ? 'IDR' : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xl font-black">{voucher.used_count} <span className="text-sm font-bold text-retro-charcoal/40">/ {voucher.max_uses}</span></span>
                        <div className="w-24 bg-[#EFE9DB] border-[2px] border-retro-charcoal h-3 mt-1 overflow-hidden shadow-[2px_2px_0_0_#262626]">
                          <div className="bg-[#FF0000] h-full border-r-[2px] border-retro-charcoal" style={{ width: `${Math.min((voucher.used_count / voucher.max_uses) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-retro-charcoal/70">
                        <CalendarDays size={16} className="text-[#FF0000]" strokeWidth={2.5} />
                        {new Date(voucher.expired_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {isActuallyActive ? (
                        <span className="inline-flex items-center gap-1.5 text-green-800 bg-green-100 border-[2px] border-green-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#166534]">
                          <CheckCircle2 size={12} strokeWidth={3} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-white bg-[#FF0000] border-[2px] border-retro-charcoal px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#262626]">
                          {isExpired ? (
                            <><XCircle size={12} strokeWidth={3} /> Kedaluwarsa</>
                          ) : isQuotaFull ? (
                            <><XCircle size={12} strokeWidth={3} /> Habis</>
                          ) : (
                            <><XCircle size={12} strokeWidth={3} /> Nonaktif</>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          onClick={() => openEditModal(voucher)} 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 border-[2px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                        >
                          <Edit size={14} strokeWidth={3} />
                        </Button>
                        <Button 
                          onClick={() => openDeleteModal(voucher.id)} 
                          variant="destructive" 
                          size="icon" 
                          className="h-9 w-9 border-[2px] border-retro-charcoal bg-[#FF0000] text-white shadow-[2px_2px_0_0_#262626] hover:bg-[#d9383a] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                        >
                          <Trash2 size={14} strokeWidth={3} />
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
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t-[3px] border-dashed border-retro-charcoal pt-6">
          <span className="text-sm font-black uppercase tracking-widest text-retro-charcoal/70">
            TOTAL KUPON: <span className="text-[#FF0000]">{filteredVouchers.length}</span> DATA
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

      {/* =========================================================================
          MODAL / POP-UP AREA (TAMBAH, EDIT, HAPUS)
          ========================================================================= */}

      {/* 1. MODAL TAMBAH DATA */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Terbitkan Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} placeholder="PROMO2026" className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} placeholder="0" className="border-[3px] border-retro-charcoal font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} placeholder="100" className="border-[3px] border-retro-charcoal font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold uppercase" />
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
                Simpan Kupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL EDIT DATA */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Ubah Data Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none">
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} className="border-[3px] border-retro-charcoal font-bold uppercase" />
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
                Perbarui Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-[#FF0000] border-b-[4px] border-retro-charcoal pb-4 mb-2">Peringatan Penghancuran</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
            Apakah Anda yakin ingin memusnahkan kupon ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.
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
              Ya, Musnahkan!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}