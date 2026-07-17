"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, Ticket, ArrowUpRight, Activity, Users, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  interface KioskDevice {
    id: number;
    device_id: string;
    location_name: string;
    status: 'active' | 'offline' | 'maintenance';
    last_seen: string | null;
    is_camera_connected?: boolean;
  }

  // STATE DINAMIS UNTUK DATA DASBOR
  const [stats, setStats] = useState({
    revenue: 0,
    activeVouchers: 0,
    totalUsers: 0, 
  });
  const [kiosks, setKiosks] = useState<KioskDevice[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        router.push("/admin/login");
        return; // Hentikan eksekusi jika tidak ada token
      }

      try {
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        };

        // 🚨 Ambil data Voucher, Users, Statistik Transaksi, dan Kios secara BERSAMAAN (Paralel)
        const [vouchersRes, usersRes, statsRes, kiosksRes] = await Promise.all([
          fetch(getApiUrl("/api/admin/vouchers"), { headers }),
          fetch(getApiUrl("/api/admin/users"), { headers }),
          fetch(getApiUrl("/api/admin/transactions/statistics"), { headers }), // API Statistik Baru
          fetch(getApiUrl("/api/admin/kiosk-devices"), { headers })
        ]);

        const vouchersData = await vouchersRes.json();
        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        const kiosksData = await kiosksRes.json();
        
        // 1. Hitung Kupon Aktif
        let activeCount = 0;
        if (vouchersRes.ok) {
          const voucherList = vouchersData.data || vouchersData;
          if (Array.isArray(voucherList)) {
            activeCount = voucherList.filter((v: { is_active: boolean }) => v.is_active).length;
          }
        }

        // 2. Hitung Total Pengguna
        let userCount = 0;
        if (usersRes.ok) {
          const userList = usersData.data || usersData;
          if (Array.isArray(userList)) {
            userCount = userList.length; 
          }
        }

        // 3. Ambil Total Pendapatan
        let totalRevenue = 0;
        if (statsRes.ok && statsData.success) {
          totalRevenue = statsData.data.total_revenue || 0;
        }

        // Memperbarui state dengan data dari database
        setStats({
          revenue: totalRevenue,       // 🚨 Data pendapatan asli dari database
          activeVouchers: activeCount,
          totalUsers: userCount, 
        });

        if (kiosksRes.ok) {
          setKiosks(kiosksData.data || []);
        }

      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const renderKioskStatus = (kiosk: KioskDevice) => {
    if (kiosk.status === "offline") {
      return <span className="inline-flex items-center gap-1 text-[10px] text-white bg-[#FF0000] border-[2px] border-retro-charcoal px-2 py-0.5 font-black uppercase tracking-widest shadow-[1px_1px_0_0_#262626]">Offline</span>;
    }
    if (kiosk.status === "maintenance" || kiosk.is_camera_connected === false) {
      return <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border-[2px] border-amber-800 px-2 py-0.5 font-black uppercase tracking-widest shadow-[1px_1px_0_0_#92400E]">Perawatan</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] text-green-800 bg-green-100 border-[2px] border-green-800 px-2 py-0.5 font-black uppercase tracking-widest shadow-[1px_1px_0_0_#166534]">Active</span>;
  };

  const renderCameraStatus = (kiosk: KioskDevice) => {
    if (kiosk.status === "offline") {
      return <span className="text-xs text-retro-charcoal/40 font-bold uppercase">-</span>;
    }
    return kiosk.is_camera_connected ? (
      <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">📷 DSLR READY</span>
    ) : (
      <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider animate-pulse">⚠️ DSLR ERROR</span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Activity size={48} className="text-retro-red animate-pulse" strokeWidth={3} />
        <div className="font-black uppercase tracking-widest text-retro-charcoal animate-pulse">
          Menyinkronkan Data Server...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black font-serif uppercase tracking-tight text-retro-charcoal">
          Dashboard Ikhtisar
        </h1>
        <p className="text-sm font-bold mt-2 text-retro-charcoal/70 uppercase tracking-widest">
          Pantauan Kinerja Kios Photobooth
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 🚨 KARTU 1: PENDAPATAN (Diperbarui jadi interaktif & bisa diklik) */}
        <Link href="/admin/transaction" className="block focus:outline-none group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, x: -4 }}
            className="bg-white border-[4px] border-retro-charcoal p-6 cursor-pointer transition-transform h-full group-active:translate-y-1 group-active:translate-x-1"
            style={{ boxShadow: "6px 6px 0px 0px #262626" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider group-hover:text-retro-red transition-colors">
                Total Pendapatan
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={20} strokeWidth={3} className="text-retro-charcoal/50 group-hover:text-retro-red transition-colors" />
                <DollarSign className="text-retro-charcoal group-hover:text-retro-red transition-colors" size={24} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-retro-charcoal break-all">
              Rp {Number(stats.revenue).toLocaleString('id-ID')}
            </h3>
          </motion.div>
        </Link>

        {/* KARTU 2: VOUCHER */}
        <Link href="/admin/voucher" className="block focus:outline-none group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            whileHover={{ y: -4, x: -4 }}
            className="bg-retro-cream border-[4px] border-retro-charcoal p-6 cursor-pointer transition-transform h-full group-active:translate-y-1 group-active:translate-x-1"
            style={{ boxShadow: "6px 6px 0px 0px #262626" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider group-hover:text-retro-red transition-colors">
                Kupon Aktif
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={20} strokeWidth={3} className="text-retro-charcoal/50 group-hover:text-retro-red transition-colors" />
                <Ticket className="text-retro-charcoal group-hover:text-retro-red transition-colors" size={24} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-4xl font-black tracking-tight text-retro-charcoal flex items-baseline gap-2">
              {stats.activeVouchers} 
              <span className="text-sm font-bold text-retro-charcoal/60 uppercase tracking-widest">Kupon</span>
            </h3>
          </motion.div>
        </Link>

        {/* KARTU 3: PENGGUNA */}
        <Link href="/admin/users" className="block focus:outline-none group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            whileHover={{ y: -4, x: -4 }}
            className="bg-white border-[4px] border-retro-charcoal p-6 cursor-pointer transition-transform h-full group-active:translate-y-1 group-active:translate-x-1"
            style={{ boxShadow: "6px 6px 0px 0px #262626" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider group-hover:text-retro-red transition-colors">
                Total Akun
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={20} strokeWidth={3} className="text-retro-charcoal/50 group-hover:text-retro-red transition-colors" />
                <Users className="text-retro-charcoal group-hover:text-retro-red transition-colors" size={24} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-4xl font-black tracking-tight text-retro-charcoal flex items-baseline gap-2">
              {stats.totalUsers} 
              <span className="text-sm font-bold text-retro-charcoal/60 uppercase tracking-widest">User</span>
            </h3>
          </motion.div>
        </Link>
        
      </div>

      {/* MONITORING KIOS QUICK-VIEW */}
      <div className="mt-10">
        <div className="flex justify-between items-center border-b-[4px] border-retro-charcoal pb-3 mb-6">
          <h2 className="text-2xl font-black font-serif uppercase tracking-tight flex items-center gap-2">
            <MonitorSmartphone size={24} className="text-retro-red" />
            Pemantauan Kios & DSLR
          </h2>
          <Link href="/admin/kiosk" className="text-xs font-black uppercase tracking-widest text-retro-red hover:underline flex items-center gap-1">
            Lihat Detail <ArrowUpRight size={14} strokeWidth={3} />
          </Link>
        </div>

        <div className="border-[4px] border-retro-charcoal bg-white shadow-[6px_6px_0_0_#262626] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-retro-charcoal text-white uppercase text-xs font-black tracking-widest border-b-[4px] border-retro-charcoal">
                <th className="p-4">ID Perangkat</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-center">Status Kios</th>
                <th className="p-4 text-center">Kamera DSLR</th>
                <th className="p-4 text-center">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y-[3px] divide-retro-charcoal font-bold text-sm">
              {kiosks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-retro-charcoal/60 uppercase tracking-widest">
                    Belum ada mesin kios yang terdaftar.
                  </td>
                </tr>
              ) : (
                kiosks.map((kiosk) => (
                  <tr key={kiosk.id} className="hover:bg-[#EFE9DB]/30 transition-colors">
                    <td className="p-4 uppercase font-black">{kiosk.device_id}</td>
                    <td className="p-4 uppercase text-retro-charcoal/70">{kiosk.location_name}</td>
                    <td className="p-4 text-center">{renderKioskStatus(kiosk)}</td>
                    <td className="p-4 text-center">{renderCameraStatus(kiosk)}</td>
                    <td className="p-4 text-center text-xs text-retro-charcoal/60">
                      {kiosk.last_seen ? new Date(kiosk.last_seen).toLocaleString('id-ID') : "Belum Aktif"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}