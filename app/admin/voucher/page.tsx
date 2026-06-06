"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Ticket, CheckCircle2, XCircle, 
  CalendarDays, AlertCircle, Search, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

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
        const res = await fetch("http://127.0.0.1:8000/api/admin/vouchers", {
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
      // Mengubah format tanggal ISO ke YYYY-MM-DD untuk input date HTML
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
      const res = await fetch("http://127.0.0.1:8000/api/admin/vouchers", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah data.");
      
      toast.success("BERHASIL!", { description: "Kupon baru berhasil diterbitkan." });
      setIsAddOpen(false);
      setRefreshTrigger(prev => prev + 1); // Refresh Tabel
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  // EDIT KUPON
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://127.0.0.1:8000/api/admin/vouchers/${selectedId}`, {
        method: "PUT", // Metode PUT untuk Update di Laravel
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
      const res = await fetch(`http://127.0.0.1:8000/api/admin/vouchers/${selectedId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      if (!res.ok) throw new Error("Gagal menghapus data.");
      
      toast.success("DIHAPUS!", { description: "Kupon telah dimusnahkan." });
      setIsDeleteOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL!", { description: (err as Error).message });
    }
  };

  return (
    <div className="w-full font-sans pb-10">
      
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black font-serif uppercase tracking-tight text-retro-charcoal flex items-center gap-3">
            <Ticket size={36} className="text-retro-red" />
            Manajemen Kupon
          </h1>
          <p className="text-sm font-bold mt-2 text-retro-charcoal/70 uppercase tracking-widest">
            Sinkronisasi Database Aktif
          </p>
        </div>

        <Button 
          onClick={openAddModal} 
          className="flex items-center gap-2 bg-retro-charcoal hover:bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] transition-all active:translate-y-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Tambah Kupon</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#262626]">
          <AlertCircle size={24} className="text-retro-red" />
          <span>{error}</span>
        </div>
      )}

      {/* KOTAK PENCARIAN */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-3.5 text-retro-charcoal/50" size={20} strokeWidth={3} />
        <Input 
          type="text" placeholder="Cari kode unik..." className="pl-12"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABEL DATA */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">No</TableHead>
            <TableHead>Kode Unik</TableHead>
            <TableHead>Detail Promo</TableHead>
            <TableHead className="text-center">Pemakaian</TableHead>
            <TableHead className="text-center">Kedaluwarsa</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center w-32">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="h-32 text-center text-lg animate-pulse font-bold tracking-widest uppercase">Memuat data dari server...</TableCell></TableRow>
          ) : paginatedVouchers.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="h-32 text-center text-lg font-bold uppercase tracking-widest text-retro-charcoal/50">Data tidak ditemukan.</TableCell></TableRow>
          ) : (
            paginatedVouchers.map((voucher, index) => (
              <TableRow key={voucher.id}>
                <TableCell className="text-center font-black text-lg">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                <TableCell><span className="bg-retro-charcoal text-retro-cream px-3 py-1.5 font-bold tracking-widest text-sm inline-block shadow-[2px_2px_0_0_#d9383a]">{voucher.code}</span></TableCell>
                <TableCell>
                  <div className="text-sm font-black uppercase">{voucher.type.replace('_', ' ')}</div>
                  {voucher.discount_value > 0 && <div className="text-xs text-retro-red font-bold mt-1 tracking-wider">Nilai: {voucher.discount_value} {voucher.type === 'DISCOUNT' ? 'IDR' : ''}</div>}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-black">{voucher.used_count} <span className="text-sm font-bold text-retro-charcoal/40">/ {voucher.max_uses}</span></span>
                    <div className="w-24 bg-retro-cream border-[2px] border-retro-charcoal h-3 mt-1 overflow-hidden">
                      <div className="bg-retro-red h-full border-r-[2px] border-retro-charcoal" style={{ width: `${Math.min((voucher.used_count / voucher.max_uses) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm"><CalendarDays size={16} className="text-retro-red" strokeWidth={2.5} />{new Date(voucher.expired_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </TableCell>
                <TableCell className="text-center">
                  {voucher.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-800 bg-green-200 border-[2px] border-green-800 px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#166534]"><CheckCircle2 size={12} strokeWidth={3} /> Aktif</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white bg-retro-red border-[2px] border-retro-charcoal px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#262626]"><XCircle size={12} strokeWidth={3} /> Nonaktif</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={() => openEditModal(voucher)} variant="outline" size="icon" className="h-9 w-9 shadow-[2px_2px_0_0_#262626]"><Edit size={14} strokeWidth={3} /></Button>
                    <Button onClick={() => openDeleteModal(voucher.id)} variant="destructive" size="icon" className="h-9 w-9 shadow-[2px_2px_0_0_#262626]"><Trash2 size={14} strokeWidth={3} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* NAVIGASI PAGINASI BAWAH */}
      {!loading && filteredVouchers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <div className="text-sm font-black uppercase tracking-widest text-retro-charcoal">
            Menampilkan <span className="text-retro-red">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-retro-red">{Math.min(currentPage * itemsPerPage, filteredVouchers.length)}</span> dari <span className="text-retro-red">{filteredVouchers.length}</span> Kupon
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={20} strokeWidth={3} /></Button>
            <div className="h-11 px-4 flex items-center justify-center border-[3px] border-retro-charcoal bg-white font-black text-retro-charcoal shadow-[4px_4px_0_0_#262626]">{currentPage} / {totalPages}</div>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={20} strokeWidth={3} /></Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL / POP-UP AREA (TAMBAH, EDIT, HAPUS)
          ========================================================================= */}

      {/* 1. MODAL TAMBAH DATA */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Terbitkan Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} placeholder="Ketik kode unik (cth: PROMO2026)" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal shadow-[4px_4px_0_0_#262626] focus:outline-none focus:ring-2 focus:ring-retro-charcoal transition-all focus:-translate-y-1 focus:shadow-[6px_6px_0_0_#262626]">
                <option value="">Pilih Discount</option>
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} placeholder="100" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button type="submit">Simpan Kupon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL EDIT DATA */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">Ubah Data Kupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Kode Kupon</label>
              <Input required name="code" value={formData.code} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tipe Diskon</label>
              <select required name="type" value={formData.type} onChange={handleInputChange} className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal shadow-[4px_4px_0_0_#262626] focus:outline-none focus:ring-2 focus:ring-retro-charcoal transition-all focus:-translate-y-1 focus:shadow-[6px_6px_0_0_#262626]">
                <option value="DISCOUNT">Nominal (Rp)</option>
                <option value="FREE_SESSION">Sesi Gratis</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Nilai Diskon</label>
                <Input required type="number" min="0" name="discount_value" value={formData.discount_value} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Batas Pakai</label>
                <Input required type="number" min="1" name="max_uses" value={formData.max_uses} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">Tanggal Kedaluwarsa</label>
              <Input required type="date" name="expired_at" value={formData.expired_at} onChange={handleInputChange} />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit">Perbarui Data</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-red border-b-[4px] border-retro-charcoal pb-4 mb-2">Peringatan Penghancuran</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
              Apakah Anda yakin ingin memusnahkan kupon ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Ya, Musnahkan!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}