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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
// 🚨 BARIS "import error from next..." YANG SALAH SUDAH DIHAPUS DI SINI

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
  const [error, setError] = useState(""); // State error tetap aman di sini
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
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(""); // Bersihkan pesan error saat memuat ulang
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("http://127.0.0.1:8000/api/admin/users", {
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
    setError(""); // Bersihkan error sebelum submit
    try {
      const token = localStorage.getItem("admin_token");
      const url = isEditMode
        ? `http://127.0.0.1:8000/api/admin/users/${selectedId}`
        : "http://127.0.0.1:8000/api/admin/users";
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
        `http://127.0.0.1:8000/api/admin/users/${selectedId}`,
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

      // Mengatasi bug halaman kosong jika menghapus item terakhir di sebuah halaman
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      toast.error("GAGAL MENGHAPUS", { description: (err as Error).message });
    }
  };

  return (
    <div className="w-full font-sans pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black font-serif uppercase tracking-tight text-retro-charcoal flex items-center gap-3">
            <Users size={36} className="text-retro-red" />
            Manajemen Pengguna
          </h1>
          <p className="text-sm font-bold mt-2 text-retro-charcoal/70 uppercase tracking-widest">
            Atur Akses Staf & Pelanggan
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-retro-charcoal hover:bg-retro-red text-white border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] transition-all active:translate-y-1 active:shadow-none font-black uppercase tracking-widest h-12 px-6"
        >
          <Plus size={18} strokeWidth={3} /> Tambah Akun
        </Button>
      </div>

      {/* BANNER ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#262626]">
          <AlertCircle size={24} className="text-retro-red shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PENCARIAN */}
      <div className="mb-6 relative max-w-md">
        <Search
          className="absolute left-4 top-3.5 text-retro-charcoal/50"
          size={20}
          strokeWidth={3}
        />
        <Input
          type="text"
          placeholder="Cari nama atau email..."
          className="pl-12 h-12 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABEL PENGGUNA */}
      <div className="bg-white border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] overflow-hidden">
        <Table>
          <TableHeader className="bg-retro-cream border-b-[4px] border-retro-charcoal">
            <TableRow>
              <TableHead className="w-16 text-center font-black text-retro-charcoal uppercase tracking-wider">
                No
              </TableHead>
              <TableHead className="font-black text-retro-charcoal uppercase tracking-wider">
                Pengguna
              </TableHead>
              <TableHead className="font-black text-retro-charcoal uppercase tracking-wider">
                Kontak
              </TableHead>
              <TableHead className="text-center font-black text-retro-charcoal uppercase tracking-wider">
                Peran
              </TableHead>
              <TableHead className="text-center font-black text-retro-charcoal uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-center w-32 font-black text-retro-charcoal uppercase tracking-wider">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-lg animate-pulse font-bold tracking-widest uppercase"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-lg font-bold uppercase tracking-widest text-retro-charcoal/50"
                >
                  Data tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => (
                <TableRow
                  key={user.id}
                  className="border-b-[2px] border-retro-charcoal/20"
                >
                  <TableCell className="text-center font-black text-lg">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserCircle
                        size={28}
                        strokeWidth={2}
                        className="text-retro-red"
                      />
                      <span className="font-black uppercase tracking-wider">
                        {user.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm bg-retro-cream px-2 py-1 border-[2px] border-retro-charcoal">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-retro-red text-white px-2 py-1 uppercase tracking-widest border-[2px] border-retro-charcoal">
                        <ShieldAlert size={12} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-white text-retro-charcoal px-2 py-1 uppercase tracking-widest border-[2px] border-retro-charcoal">
                        User
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-green-700">
                        <CheckCircle2 size={16} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-retro-red">
                        <XCircle size={16} /> Diblokir
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => openEditModal(user)}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626] transition-transform active:translate-y-1 active:shadow-none hover:bg-retro-cream"
                      >
                        <Edit
                          size={14}
                          strokeWidth={3}
                          className="text-retro-charcoal"
                        />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedId(user.id);
                          setIsDeleteOpen(true);
                        }}
                        size="icon"
                        className="h-9 w-9 border-[2px] border-retro-charcoal shadow-[2px_2px_0_0_#262626] transition-transform active:translate-y-1 active:shadow-none bg-retro-red hover:bg-[#CC0000]"
                      >
                        <Trash2
                          size={14}
                          strokeWidth={3}
                          className="text-white"
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* KONTROL PAGINASI */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <div className="text-sm font-black uppercase tracking-widest text-retro-charcoal">
            Menampilkan{" "}
            <span className="text-retro-red">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="text-retro-red">
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
            </span>{" "}
            dari <span className="text-retro-red">{filteredUsers.length}</span>{" "}
            Pengguna
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] disabled:opacity-50"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </Button>

            <div className="h-10 px-4 flex items-center justify-center border-[3px] border-retro-charcoal bg-white font-black shadow-[3px_3px_0_0_#262626]">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] disabled:opacity-50"
            >
              <ChevronRight size={20} strokeWidth={3} />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal rounded-none shadow-[8px_8px_0_0_#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight border-b-[4px] border-retro-charcoal pb-4 mb-2">
              {isEditMode ? "Ubah Data Akun" : "Registrasi Akun Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="border-[2px] border-retro-charcoal focus-visible:ring-retro-red"
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
                className="border-[2px] border-retro-charcoal focus-visible:ring-retro-red"
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
                className="border-[2px] border-retro-charcoal focus-visible:ring-retro-red"
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
                  className="w-full h-10 px-3 border-[2px] border-retro-charcoal bg-white font-bold text-sm shadow-[2px_2px_0_0_#262626] outline-none focus:ring-0 focus:border-retro-red"
                >
                  <option value="">Pilih Hak Akses</option>
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
                  className="w-full h-10 px-3 border-[2px] border-retro-charcoal bg-white font-bold text-sm shadow-[2px_2px_0_0_#262626] outline-none focus:ring-0 focus:border-retro-red"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Diblokir / Nonaktif</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t-[4px] border-retro-charcoal">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[2px] border-retro-charcoal font-black uppercase tracking-widest"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-retro-charcoal hover:bg-retro-red text-white border-[2px] border-retro-charcoal font-black uppercase tracking-widest shadow-[4px_4px_0_0_#262626] active:translate-y-1 active:shadow-none transition-all"
              >
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-[4px] border-retro-charcoal rounded-none shadow-[8px_8px_0_0_#262626] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif uppercase tracking-tight text-retro-red border-b-[4px] border-retro-charcoal pb-4 mb-2">
              Peringatan Penghancuran
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-bold uppercase tracking-widest text-retro-charcoal/80">
              Apakah Anda yakin ingin menghapus akun ini secara permanen?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-[2px] border-retro-charcoal font-black uppercase tracking-widest hover:bg-retro-cream"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-retro-red hover:bg-[#CC0000] border-[2px] border-retro-charcoal font-black uppercase tracking-widest shadow-[4px_4px_0_0_#262626] transition-transform active:translate-y-1 active:shadow-none"
            >
              Ya, Hapus!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}