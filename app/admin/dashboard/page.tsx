"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, Ticket, ArrowUpRight, Activity, Users } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // STATE DINAMIS UNTUK DATA DASBOR
  const [stats, setStats] = useState({
    revenue: 0,
    activeVouchers: 0,
    totalUsers: 0, 
  });

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

        // 🚨 Ambil data Voucher, Users, dan Statistik Transaksi secara BERSAMAAN (Paralel)
        const [vouchersRes, usersRes, statsRes] = await Promise.all([
          fetch(getApiUrl("/api/admin/vouchers"), { headers }),
          fetch(getApiUrl("/api/admin/users"), { headers }),
          fetch(getApiUrl("/api/admin/transactions/statistics"), { headers }) // API Statistik Baru
        ]);

        const vouchersData = await vouchersRes.json();
        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        
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

      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

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
    </div>
  );
}