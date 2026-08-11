"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ReceiptText,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Wallet,
  Clock as ClockIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import { getApiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState<"single" | "batch">("single");

  // Filter & Pagination State (Dikirim ke Backend)
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Meta Pagination dari Laravel
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // State Statistik
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_success: 0,
    total_pending: 0,
  });

  // Fungsi Fetch Statistik
  const fetchStatistics = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(
        getApiUrl("/api/admin/transactions/statistics"),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error("Gagal load statistik:", error);
    }
  }, []);

  // Fungsi Fetch ke Server-Side Pagination
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");

      // Susun parameter URL
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        start_date: startDate,
        end_date: endDate,
      });

      const res = await fetch(
        getApiUrl(`/api/admin/transactions?${queryParams}`),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengambil data.");

      setTransactions(json.data.data);
      setTotalPages(json.data.last_page);
      setTotalItems(json.data.total);
    } catch (err: unknown) {
      toast.error("GAGAL MEMUAT DATA", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, startDate, endDate]);

  // Efek berjalan jika filter/halaman berubah
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
      fetchStatistics(); 
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchTransactions, fetchStatistics]);

  // Fungsi Export Report Download CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const res = await fetch(
        getApiUrl(`/api/admin/transactions/export?${queryParams}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh laporan.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Transaksi_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("BERHASIL!", { description: "Laporan CSV mulai diunduh." });
    } catch (err: unknown) {
      toast.error("EXPORT GAGAL", { description: (err as Error).message });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
  }, [transactions]);

  const executeSingleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl(`/api/admin/transactions/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus transaksi.");

      toast.success("BERHASIL", { description: "Transaksi telah dihapus." });
      fetchTransactions();
      fetchStatistics();
    } catch (err: any) {
      toast.error("GAGAL MENGHAPUS", { description: err.message });
    }
  };

  const executeBatchDelete = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(getApiUrl("/api/admin/transactions/batch-delete"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus transaksi terpilih.");

      toast.success("BERHASIL", { description: `${selectedIds.length} transaksi telah dihapus.` });
      setSelectedIds([]);
      fetchTransactions();
      fetchStatistics();
    } catch (err: any) {
      toast.error("GAGAL MENGHAPUS BATCH", { description: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteOpen(false);
    if (deleteMode === "single" && deleteTargetId !== null) {
      await executeSingleDelete(deleteTargetId);
      setDeleteTargetId(null);
    } else if (deleteMode === "batch") {
      await executeBatchDelete();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-gray-900">
            <ReceiptText size={32} className="text-[#FF0000]" /> 
            Manajemen Transaksi
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Data dimuat langsung dari server (Server-Side)
          </p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button
              onClick={() => {
                setDeleteMode("batch");
                setIsDeleteOpen(true);
              }}
              className="flex-1 md:flex-none bg-[#FF0000] hover:bg-red-700 text-white rounded-xl h-11 px-4 font-bold uppercase tracking-wider flex items-center justify-center animate-in zoom-in-95 duration-200 border-none cursor-pointer"
            >
              <Trash2 className="mr-2" size={16} />
              HAPUS TERPILIH ({selectedIds.length})
            </Button>
          )}

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 md:flex-none bg-[#FF0000] hover:bg-red-700 text-white rounded-xl h-11 px-4 font-bold uppercase tracking-wider flex items-center justify-center border-none shadow-md shadow-red-500/10 cursor-pointer"
          >
            <Download
              className={`mr-2 ${exporting ? "animate-bounce" : ""}`}
              size={16}
            />
            {exporting ? "MEMPROSES..." : "EXPORT CSV"}
          </Button>

          <Button
            onClick={() => {
              fetchTransactions();
              fetchStatistics();
            }}
            disabled={loading}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-11 px-4 cursor-pointer"
          >
            <RefreshCw
              className={`${loading ? "animate-spin" : ""}`}
              size={18}
            />
          </Button>
        </div>
      </div>

      {/* KUMPULAN CARD STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${Number(stats.total_revenue).toLocaleString("id-ID")}`}
          icon={<Wallet size={20} strokeWidth={2.5} />}
        />
        <StatCard
          title="Pembayaran Sukses"
          value={`${Number(stats.total_success).toLocaleString("id-ID")} Tx`}
          icon={<CheckCircle2 size={20} strokeWidth={2.5} />}
        />
        <StatCard
          title="Menunggu Pembayaran"
          value={`${Number(stats.total_pending).toLocaleString("id-ID")} Tx`}
          icon={<ClockIcon size={20} strokeWidth={2.5} />}
        />
      </div>

      {/* FILTER BAR & DATE RANGE */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border border-gray-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={18} />
          </span>
          <Input
            type="text"
            placeholder="CARI NOMOR INVOICE..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-11 h-11 border border-gray-200 rounded-xl font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-500 bg-gray-50/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar
            size={18}
            className="text-gray-400 hidden md:block"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs font-semibold px-3"
          />
          <span className="text-gray-400 font-bold">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs font-semibold px-3"
          />
        </div>
      </div>

      {/* TABEL TRANSAKSI */}
      <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <th className="p-4 pl-6 w-12 text-center">
                <input
                  type="checkbox"
                  checked={transactions.length > 0 && selectedIds.length === transactions.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(transactions.map((tx) => tx.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#FF0000] focus:ring-[#FF0000] cursor-pointer"
                />
              </th>
              <th className="p-4">Tanggal & Waktu</th>
              <th className="p-4">Nomor Invoice</th>
              <th className="p-4">Harga Kotor</th>
              <th className="p-4">Total Bayar</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]"
                >
                  <RefreshCw className="animate-spin inline mr-2" size={18} />{" "}
                  Sedang menarik data dari Server...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center p-12 text-gray-400 uppercase tracking-wider text-[11px]"
                >
                  Tidak ada riwayat transaksi ditemukan.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className={`hover:bg-gray-50/30 transition-colors ${selectedIds.includes(tx.id) ? "bg-red-50/10" : ""}`}
                >
                  <td className="p-4 pl-6 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tx.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, tx.id]);
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== tx.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#FF0000] focus:ring-[#FF0000] cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-gray-400 font-medium">
                    {new Date(tx.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 tracking-wider uppercase font-bold text-gray-900">
                    {tx.invoice_number}
                  </td>
                  <td className="p-4 text-gray-400">
                    Rp {Number(tx.gross_amount).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#FF0000]">
                    Rp {Number(tx.net_amount).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {tx.payment_status === "success" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
                          <CheckCircle2 size={10} /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-full uppercase tracking-wider animate-pulse">
                          <Clock size={10} /> PENDING
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setDeleteTargetId(tx.id);
                          setDeleteMode("single");
                          setIsDeleteOpen(true);
                        }}
                        className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center border border-red-100 cursor-pointer p-0"
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

      {/* KONTROL PAGINATION */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-dashed border-gray-100 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            TOTAL DATA DI DATABASE:{" "}
            <span className="text-[#FF0000]">{totalItems}</span> TRANSAKSI
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-600">
              Hal {currentPage} / {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl shadow-2xl p-6 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-red-600 border-b border-gray-50 pb-4 mb-4">Peringatan Penghapusan</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            {deleteMode === "single" 
              ? "Apakah Anda yakin ingin menghapus transaksi ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan."
              : `Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi terpilih secara permanen dari database? Tindakan ini tidak dapat dibatalkan.`}
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
              Ya, Hapus!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
