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
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [chartTab, setChartTab] = useState<"daily" | "cumulative">("daily");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        };

        const [vouchersRes, usersRes, statsRes, kiosksRes] = await Promise.all([
          fetch(getApiUrl("/api/admin/vouchers"), { headers }),
          fetch(getApiUrl("/api/admin/users"), { headers }),
          fetch(getApiUrl("/api/admin/transactions/statistics"), { headers }),
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

        // 3. Ambil Total Pendapatan & Pendapatan Harian
        let totalRevenue = 0;
        let dailyRev = [];
        if (statsRes.ok && statsData.success) {
          totalRevenue = statsData.data.total_revenue || 0;
          dailyRev = statsData.data.daily_revenue || [];
        }

        // Memperbarui state dengan data dari database
        setStats({
          revenue: totalRevenue,
          activeVouchers: activeCount,
          totalUsers: userCount, 
        });
        setDailyRevenue(dailyRev);

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
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Offline
        </span>
      );
    }
    if (kiosk.status === "maintenance" || kiosk.is_camera_connected === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Perawatan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        Active
      </span>
    );
  };

  const renderCameraStatus = (kiosk: KioskDevice) => {
    if (kiosk.status === "offline") {
      return <span className="text-xs text-gray-300 font-bold uppercase">-</span>;
    }
    return kiosk.is_camera_connected ? (
      <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50/50 border border-green-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
        📷 DSLR READY
      </span>
    ) : (
      <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50/50 border border-red-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
        ⚠️ DSLR ERROR
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Activity size={40} className="text-[#FF0000] animate-pulse" strokeWidth={2.5} />
        <div className="font-bold uppercase tracking-widest text-gray-500 animate-pulse text-sm">
          Menyinkronkan Data Server...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
          Dashboard Ikhtisar
        </h1>
        <p className="text-xs font-bold mt-1 text-gray-400 uppercase tracking-widest">
          Pantauan Kinerja Kios Photobooth
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* KARTU 1: PENDAPATAN */}
        <Link href="/admin/transaction" className="block group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-100/50 p-6 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Pendapatan
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] group-hover:bg-[#FF0000] group-hover:text-white transition-all duration-300">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-gray-900 break-all flex items-center gap-1.5">
              Rp {Number(stats.revenue).toLocaleString('id-ID')}
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#FF0000] transition-colors" />
            </h3>
          </motion.div>
        </Link>

        {/* KARTU 2: VOUCHER */}
        <Link href="/admin/voucher" className="block group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-100/50 p-6 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Kupon Aktif
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] group-hover:bg-[#FF0000] group-hover:text-white transition-all duration-300">
                <Ticket size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-gray-900 flex items-baseline gap-2">
              {stats.activeVouchers} 
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kupon</span>
              <ArrowUpRight size={16} className="text-gray-300 ml-auto group-hover:text-[#FF0000] transition-colors" />
            </h3>
          </motion.div>
        </Link>

        {/* KARTU 3: PENGGUNA */}
        <Link href="/admin/users" className="block group">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-100/50 p-6 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Akun
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] group-hover:bg-[#FF0000] group-hover:text-white transition-all duration-300">
                <Users size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-gray-900 flex items-baseline gap-2">
              {stats.totalUsers} 
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">User</span>
              <ArrowUpRight size={16} className="text-gray-300 ml-auto group-hover:text-[#FF0000] transition-colors" />
            </h3>
          </motion.div>
        </Link>
        
      </div>

      {/* SECTION GRAFIK PENDAPATAN */}
      {(() => {
        const totalAllTime = stats.revenue;
        const totalLast7Days = dailyRevenue.reduce((acc, curr) => acc + curr.revenue, 0);
        const baseline = Math.max(0, totalAllTime - totalLast7Days);

        let runningSum = baseline;
        const cumulativeData = dailyRevenue.map((item) => {
          runningSum += item.revenue;
          return {
            ...item,
            cumulative: runningSum,
          };
        });

        return (
          <div className="bg-white border border-gray-100/50 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                  Analisis Pendapatan Kios
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Visualisasi data omset penjualan 7 hari terakhir
                </p>
              </div>
              <div className="flex border border-gray-100 bg-gray-50 rounded-xl p-1 overflow-hidden">
                <button
                  onClick={() => setChartTab("daily")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                    chartTab === "daily"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setChartTab("cumulative")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                    chartTab === "cumulative"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Total Akumulasi
                </button>
              </div>
            </div>

            {/* AREA GRAFIK SVG */}
            {dailyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-gray-300">
                Belum ada data pendapatan 7 hari terakhir.
              </div>
            ) : (
              <div className="relative">
                {chartTab === "daily" ? (
                  // 📊 GRAFIK BATANG HARIAN (Clean Capsules)
                  <div className="w-full">
                    <div className="h-64 w-full relative flex items-end">
                      {/* Grid Y-Axis Lines & Labels */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-bold uppercase tracking-wider text-gray-300 pr-2">
                        <div className="border-b border-dashed border-gray-100 pb-1">
                          Rp {Number(Math.max(...dailyRevenue.map((d) => d.revenue), 100000)).toLocaleString("id-ID")}
                        </div>
                        <div className="border-b border-dashed border-gray-100 pb-1">
                          Rp {Number(Math.max(...dailyRevenue.map((d) => d.revenue), 100000) / 2).toLocaleString("id-ID")}
                        </div>
                        <div className="border-b border-gray-200/50 pb-1">
                          Rp 0
                        </div>
                      </div>

                      {/* Bars Container */}
                      <div className="w-full h-[80%] flex justify-around items-end z-10 px-4">
                        {dailyRevenue.map((item, idx) => {
                          const maxVal = Math.max(...dailyRevenue.map((d) => d.revenue), 100000);
                          const percent = (item.revenue / maxVal) * 100;

                          return (
                            <div
                              key={`bar-${idx}`}
                              className="flex flex-col items-center flex-1 group/bar relative"
                              onMouseEnter={() => setHoveredIndex(idx)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            >
                              {/* Tooltip */}
                              {hoveredIndex === idx && (
                                <div className="absolute -top-12 z-20 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in zoom-in-95 duration-150">
                                  Rp {Number(item.revenue).toLocaleString("id-ID")}
                                </div>
                              )}

                              {/* Clean Rounded Bar */}
                              <div
                                className={`w-8 md:w-12 rounded-t-md transition-all duration-300 relative cursor-pointer ${
                                  item.revenue > 0 
                                    ? "bg-[#FF0000] hover:bg-red-600 shadow-md shadow-red-500/10" 
                                    : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                                }`}
                                style={{ height: `${Math.max(percent, 4)}%` }}
                              >
                                {item.revenue > 0 && (
                                  <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,transparent_4px,transparent_8px)] rounded-t-md" />
                                )}
                              </div>

                              {/* Label Hari */}
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-3">
                                {item.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 📈 GRAFIK GARIS AKUMULASI (Modern Line-Area Grid)
                  <div className="w-full">
                    <div className="h-64 w-full relative flex items-end">
                      {/* Grid Y-Axis Lines & Labels */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-bold uppercase tracking-wider text-gray-300 pr-2">
                        <div className="border-b border-dashed border-gray-100 pb-1">
                          Rp {Number(Math.max(...cumulativeData.map((d) => d.cumulative), 100000)).toLocaleString("id-ID")}
                        </div>
                        <div className="border-b border-dashed border-gray-100 pb-1">
                          Rp {Number(Math.max(...cumulativeData.map((d) => d.cumulative), 100000) / 2).toLocaleString("id-ID")}
                        </div>
                        <div className="border-b border-gray-200/50 pb-1">
                          Rp 0
                        </div>
                      </div>

                      {/* SVG Line / Area chart */}
                      <div className="w-full h-[80%] z-10 relative">
                        <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Area Path */}
                          {(() => {
                            const maxVal = Math.max(...cumulativeData.map((d) => d.cumulative), 100000);
                            const points = cumulativeData.map((item, idx) => {
                              const x = (idx / 6) * 700;
                              const y = 200 - (item.cumulative / maxVal) * 180;
                              return { x, y };
                            });

                            if (points.length === 0) return null;

                            const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                            return (
                              <path
                                d={pathD}
                                fill="url(#chart-area-grad)"
                              />
                            );
                          })()}

                          {/* Line Path */}
                          {(() => {
                            const maxVal = Math.max(...cumulativeData.map((d) => d.cumulative), 100000);
                            const points = cumulativeData.map((item, idx) => {
                              const x = (idx / 6) * 700;
                              const y = 200 - (item.cumulative / maxVal) * 180;
                              return `${x},${y}`;
                            });

                            return (
                              <polyline
                                fill="none"
                                stroke="#FF0000"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points.join(' ')}
                              />
                            );
                          })()}
                        </svg>

                        {/* Interactive dots overlay */}
                        <div className="absolute inset-0 flex justify-between px-0 z-20">
                          {cumulativeData.map((item, idx) => {
                            const maxVal = Math.max(...cumulativeData.map((d) => d.cumulative), 100000);
                            const percentY = (item.cumulative / maxVal) * 180; // max 180px out of 200px

                            return (
                              <div
                                key={`dot-${idx}`}
                                className="flex flex-col items-center relative flex-1"
                                style={{ height: '100%' }}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              >
                                {/* Point Dot */}
                                <div
                                  className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#FF0000] bg-white shadow-sm cursor-pointer hover:scale-125 transition-transform duration-150"
                                  style={{ bottom: `${percentY - 7}px` }}
                                />

                                {/* Tooltip */}
                                {hoveredIndex === idx && (
                                  <div
                                    className="absolute z-20 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in zoom-in-95 duration-150"
                                    style={{ bottom: `${percentY + 16}px` }}
                                  >
                                    Rp {Number(item.cumulative).toLocaleString("id-ID")}
                                  </div>
                                )}

                                {/* Label Hari */}
                                <span className="absolute bottom-0 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {item.day}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* MONITORING KIOS QUICK-VIEW */}
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <MonitorSmartphone size={20} className="text-[#FF0000]" />
            Pemantauan Kios & DSLR
          </h2>
          <Link href="/admin/kiosk" className="text-xs font-bold uppercase tracking-wider text-[#FF0000] hover:underline flex items-center gap-1">
            Lihat Detail <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Clean Table Container */}
        <div className="border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">ID Perangkat</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-center">Status Kios</th>
                <th className="p-4 text-center">Kamera DSLR</th>
                <th className="p-4 pr-6 text-center">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-xs text-gray-700">
              {kiosks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-400 uppercase tracking-wider text-[11px]">
                    Belum ada mesin kios yang terdaftar.
                  </td>
                </tr>
              ) : (
                kiosks.map((kiosk) => (
                  <tr key={kiosk.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 pl-6 font-bold uppercase text-gray-900">{kiosk.device_id}</td>
                    <td className="p-4 uppercase text-gray-500">{kiosk.location_name}</td>
                    <td className="p-4 text-center">{renderKioskStatus(kiosk)}</td>
                    <td className="p-4 text-center">{renderCameraStatus(kiosk)}</td>
                    <td className="p-4 pr-6 text-center text-[10px] text-gray-400">
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