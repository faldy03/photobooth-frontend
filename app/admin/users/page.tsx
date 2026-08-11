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
  RefreshCw,
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
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
            <Users size={32} className="text-[#FF0000]" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Atur Akses Staf & Pelanggan
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#FF0000] hover:bg-[#d9383a] text-white rounded-xl font-bold uppercase tracking-wider h-11 px-5 shadow-md shadow-red-500/10 cursor-pointer border-none"
          >
            <Plus size={18} /> Tambah Akun
          </Button>
          <Button
            onClick={() => { fetchUsers(); }}
            disabled={loading}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-11 px-4 cursor-pointer"
          >
            <RefreshCw className={`${loading ? "animate-spin" : ""}`} size={18} />
          </Button>
        </div>
      </div>

      {/* BANNER ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-3 rounded-xl">
          <AlertCircle size={24} className="text-[#FF0000] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PENCARIAN */}
      <div className="flex bg-white p-4 border border-gray-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={18} />
          </span>
          <Input
            type="text"
            placeholder="CARI NAMA ATAU EMAIL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 border border-gray-200 rounded-xl font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-500 bg-gray-50/30 w-full md:w-1/2"
          />
        </div>
      </div>

      {/* TABEL PENGGUNA */}
      <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <th className="p-4 pl-6 text-center w-16">No</th>
              <th className="p-4">Pengguna</th>
              <th className="p-4">Kontak (Email)</th>
              <th className="p-4 text-center">Peran</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  <RefreshCw className="animate-spin inline mr-2" size={18} /> Memuat data pengguna...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]">
                  Data pengguna tidak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 text-center text-gray-400 font-bold pl-6">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserCircle size={24} className="text-[#FF0000] shrink-0" />
                      <span className="font-bold uppercase tracking-wider text-gray-900">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                      {user.email}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 bg-[#FF0000]/10 text-[#FF0000] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <ShieldAlert size={10} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        User
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full uppercase tracking-wider">
                        <XCircle size={10} /> Diblokir
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => openEditModal(user)}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl cursor-pointer"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedId(user.id);
                          setIsDeleteOpen(true);
                        }}
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

      {/* KONTROL PAGINASI */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-dashed border-gray-100 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            TOTAL DATA PENGGUNA: <span className="text-[#FF0000]">{filteredUsers.length}</span> AKUN
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-600">
              Hal {currentPage} / {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-gray-900 border-b border-gray-50 pb-4 mb-4">
              {isEditMode ? "Ubah Data Akun" : "Registrasi Akun Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Nama Lengkap
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Alamat Email
              </label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
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
                className="border border-gray-200 rounded-xl h-11 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] text-sm bg-gray-50/20"
                placeholder="Minimal 8 karakter..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Hak Akses
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]"
                >
                  <option value="user">Pelanggan (User)</option>
                  <option value="admin">Staf (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
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
                  className="flex h-11 w-full border border-gray-200 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000]"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Diblokir</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t border-dashed border-gray-100 pt-4 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none"
              >
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-red-600 border-b border-gray-50 pb-4 mb-4">
              Cabut Akses Pengguna?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?
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
              onClick={handleDelete}
              className="bg-[#FF0000] hover:bg-red-600 text-white rounded-xl px-5 h-11 font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-red-500/10 cursor-pointer border-none"
            >
              Ya, Hapus!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}