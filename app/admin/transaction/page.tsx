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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
        "http://127.0.0.1:8000/api/admin/transactions/statistics",
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
        `http://127.0.0.1:8000/api/admin/transactions?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengambil data.");

      // Laravel Pagination Structure: json.data.data (Array Item), json.data.last_page, dll.
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
      fetchStatistics(); // Memanggil statistik agar selalu sinkron dengan tabel
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
        `http://127.0.0.1:8000/api/admin/transactions/export?${queryParams}`,
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 text-retro-charcoal max-w-6xl mx-auto">
      {/* HEADER MANAJEMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-[4px] border-retro-charcoal pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <ReceiptText size={32} /> Manajemen Transaksi
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-1">
            Data dimuat langsung dari server (Server-Side)
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 md:flex-none border-[3px] border-retro-charcoal bg-[#FF0000] hover:bg-red-700 text-white shadow-[3px_3px_0_0_#262626] h-12 px-4 transition-transform active:translate-y-1 active:shadow-none font-black uppercase tracking-widest"
          >
            <Download
              className={`mr-2 ${exporting ? "animate-bounce" : ""}`}
              size={18}
            />
            {exporting ? "MEMPROSES..." : "EXPORT CSV"}
          </Button>

          <Button
            onClick={() => {
              fetchTransactions();
              fetchStatistics();
            }}
            disabled={loading}
            className="border-[3px] border-retro-charcoal bg-white hover:bg-[#EFE9DB] text-retro-charcoal shadow-[3px_3px_0_0_#262626] h-12 px-4"
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
          icon={<Wallet size={24} strokeWidth={3} />}
          variant="success"
        />
        <StatCard
          title="Pembayaran Sukses"
          value={`${Number(stats.total_success).toLocaleString("id-ID")} Transaksi`}
          icon={<CheckCircle2 size={24} strokeWidth={3} />}
          variant="green"
        />
        <StatCard
          title="Menunggu Pembayaran"
          value={`${Number(stats.total_pending).toLocaleString("id-ID")} Transaksi`}
          icon={<ClockIcon size={24} strokeWidth={3} />}
          variant="warning"
        />
      </div>

      {/* FILTER BAR & DATE RANGE */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-retro-charcoal/50">
            <Search size={18} />
          </span>
          <Input
            type="text"
            placeholder="CARI NOMOR INVOICE..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-11 h-12 border-[2px] border-retro-charcoal font-bold uppercase tracking-wider focus-visible:ring-retro-charcoal"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar
            size={20}
            className="text-retro-charcoal/50 hidden md:block"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 border-[2px] border-retro-charcoal font-bold"
          />
          <span className="font-black">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 border-[2px] border-retro-charcoal font-bold"
          />
        </div>
      </div>

      {/* TABEL TRANSAKSI RETRO */}
      <div className="border-[4px] border-retro-charcoal shadow-[8px_8px_0_0_#262626] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
              <th className="p-4">Tanggal & Waktu</th>
              <th className="p-4">Nomor Invoice</th>
              <th className="p-4">Harga Kotor</th>
              <th className="p-4">Total Bayar</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest"
                >
                  <RefreshCw className="animate-spin inline mr-2" size={18} />{" "}
                  Sedang menarik data dari Server...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-12 text-retro-charcoal/60 uppercase tracking-widest"
                >
                  Tidak ada riwayat transaksi ditemukan.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-[#EFE9DB]/30 transition-colors"
                >
                  <td className="p-4 text-retro-charcoal/70">
                    {new Date(tx.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 tracking-wider uppercase font-black">
                    {tx.invoice_number}
                  </td>
                  <td className="p-4 text-retro-charcoal/60">
                    Rp {Number(tx.gross_amount).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-lg font-black text-[#FF0000]">
                    Rp {Number(tx.net_amount).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {tx.payment_status === "success" ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-green-100 text-green-700 border-[2px] border-green-700 rounded-full">
                          <CheckCircle2 size={14} /> SUCCESS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 border-[2px] border-amber-700 rounded-full">
                          <Clock size={14} /> PENDING
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* KONTROL PAGINATION (SERVER-SIDE) */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t-[3px] border-dashed border-retro-charcoal pt-6">
          <span className="text-sm font-black uppercase tracking-widest text-retro-charcoal/70">
            TOTAL DATA DI DATABASE:{" "}
            <span className="text-[#FF0000]">{totalItems}</span> TRANSAKSI
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-white border-[2px] border-retro-charcoal px-3 py-2">
              Hal {currentPage} / {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="border-[3px] border-retro-charcoal font-black uppercase tracking-widest hover:bg-[#EFE9DB]"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="border-[3px] border-retro-charcoal font-black uppercase tracking-widest hover:bg-[#EFE9DB]"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
