"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw, // 🚨 Ditambahkan agar seragam dengan Kios
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    is_active: true,
  });

  // Ambil Data dari API
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/users"), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || data);
      } else {
        throw new Error(data.message || "Gagal memuat data server.");
      }
    } catch (err: unknown) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error("Koneksi Terputus", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  // Logika Paginasi & Pencarian
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Kembali ke halaman 1 jika mencari data
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setIsEditMode(true);
    setSelectedId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Kosong saat edit
      role: user.role,
      is_active: user.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const url = isEditMode
        ? getApiUrl(`/api/admin/users/${selectedId}`)
        : getApiUrl("/api/admin/users");
      const method = isEditMode ? "PUT" : "POST";

      const payload =
        isEditMode && !formData.password
          ? {
              name: formData.name,
              email: formData.email,
              role: formData.role,
              is_active: formData.is_active,
            }
          : formData;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan data.");

      toast.success(isEditMode ? "DIPERBARUI!" : "BERHASIL!", {
        description: isEditMode
          ? "Data pengguna berhasil diubah."
          : "Pengguna baru telah ditambahkan.",
      });
      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message;
      toast.error("GAGAL!", { description: errorMessage });
    }
  };

  const handleDelete = async () => {
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(
        getApiUrl(`/api/admin/users/${selectedId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("DIHAPUS!", { description: "Pengguna telah dihapus." });
      setIsDeleteOpen(false);

      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL MENGHAPUS", { description: (err as Error).message });
    }
  };

  return (
    <div className="p-6 space-y-6 text-retro-charcoal max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users size={32} className="text-[#FF0000]" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Atur Akses Staf & Pelanggan
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
          >
            <Plus size={18} strokeWidth={3} /> Tambah Akun
          </Button>
          <Button
            onClick={() => { fetchUsers(); }}
            disabled={loading}
            className="border-[3px] border-retro-charcoal bg-white hover:bg-[#EFE9DB] text-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none h-12 px-4"
          >
            <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
          </Button>
        </div>
      </div>

      {/* BANNER ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#262626]">
          <AlertCircle size={24} className="text-[#FF0000] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PENCARIAN (Diselaraskan dengan Kios) */}
      <div className="flex bg-white p-4 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-retro-charcoal/50">
            <Search size={18} strokeWidth={3} />
          </span>
          <Input
            type="text"
            placeholder="CARI NAMA ATAU EMAIL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 border-[2px] border-retro-charcoal font-bold uppercase tracking-wider focus-visible:ring-retro-charcoal w-full md:w-1/2"
          />
        </div>
      </div>

      {/* TABEL PENGGUNA (Raw Table Retro) */}
      <div className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
              <th className="p-4 text-center w-16">No</th>
              <th className="p-4">Pengguna</th>
              <th className="p-4">Kontak (Email)</th>
              <th className="p-4 text-center">Peran</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memuat data pengguna...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest">
                  Data pengguna tidak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-[#EFE9DB]/30 transition-colors">
                  <td className="p-4 text-center text-lg font-black text-retro-charcoal/70">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserCircle size={28} strokeWidth={2} className="text-[#FF0000]" />
                      <span className="font-black uppercase tracking-wider text-retro-charcoal">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-white border-[2px] border-retro-charcoal text-retro-charcoal px-3 py-1.5 font-bold tracking-widest text-xs inline-block shadow-[3px_3px_0_0_#262626]">
                      {user.email}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 bg-[#FF0000] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                        <ShieldAlert size={12} strokeWidth={3} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-white text-retro-charcoal px-3 py-1 text-[10px] font-black uppercase tracking-widest border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626]">
                        User
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-green-800 bg-green-100 border-[2px] border-green-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#166534]">
                        <CheckCircle2 size={12} strokeWidth={3} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-white bg-[#FF0000] border-[2px] border-retro-charcoal px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#262626]">
                        <XCircle size={12} strokeWidth={3} /> Diblokir
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => openEditModal(user)}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-[2px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                      >
                        <Edit size={14} strokeWidth={3} />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedId(user.id);
                          setIsDeleteOpen(true);
                        }}
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

      {/* KONTROL PAGINASI */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t-[3px] border-dashed border-retro-charcoal pt-6">
          <span className="text-sm font-black uppercase tracking-widest text-retro-charcoal/70">
            TOTAL DATA PENGGUNA: <span className="text-[#FF0000]">{filteredUsers.length}</span> AKUN
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-white border-[2px] border-retro-charcoal px-3 py-2">
              Hal {currentPage} / {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-[3px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none font-black uppercase tracking-widest"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-[3px] border-retro-charcoal bg-white shadow-[2px_2px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none font-black uppercase tracking-widest"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-charcoal border-b-[4px] border-retro-charcoal pb-4 mb-2">
              {isEditMode ? "Ubah Data Akun" : "Registrasi Akun Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">
                Nama Lengkap
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border-[3px] border-retro-charcoal font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">
                Alamat Email
              </label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border-[3px] border-retro-charcoal font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">
                Kata Sandi {isEditMode && "(Kosongkan jika tidak diubah)"}
              </label>
              <Input
                type="password"
                required={!isEditMode}
                minLength={8}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="border-[3px] border-retro-charcoal font-bold"
                placeholder="Minimal 8 karakter..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">
                  Hak Akses
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none"
                >
                  <option value="user">Pelanggan (User)</option>
                  <option value="admin">Staf (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">
                  Status Akun
                </label>
                <select
                  value={formData.is_active.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "true",
                    })
                  }
                  className="flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-sm font-bold text-retro-charcoal uppercase tracking-wider focus:outline-none"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Diblokir</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t-[3px] border-dashed border-retro-charcoal pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[3px] border-retro-charcoal bg-white shadow-[3px_3px_0_0_#262626] hover:bg-[#EFE9DB] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
              >
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-[#FF0000] border-b-[4px] border-retro-charcoal pb-4 mb-2">
              Cabut Akses Pengguna?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
            Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?
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
              onClick={handleDelete}
              className="bg-[#FF0000] hover:bg-[#d9383a] text-white border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none font-black uppercase tracking-widest"
            >
              Ya, Hapus!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}