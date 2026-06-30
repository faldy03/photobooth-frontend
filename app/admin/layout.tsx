"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MonitorSmartphone,
  ReceiptText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // State untuk mengontrol Sidebar (default: terbuka)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsChecking(false);
      return;
    }

    const token = localStorage.getItem("admin_token");
    const role = localStorage.getItem("customer_role");

    // Jika tidak ada token, atau role-nya BUKAN admin, tendang ke halaman depan
    if (!token || role !== "admin") {
      router.push("/");
    } else {
      setIsChecking(false); // Valid, izinkan masuk
    }
  }, [pathname, router]);

  // Pengecualian Halaman Login (agar tidak ikut render sidebar)
  if (isChecking && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-[#EFE9DB] flex flex-col items-center justify-center font-sans">
        <div className="font-black uppercase tracking-widest text-retro-charcoal animate-pulse text-xl">
          Memverifikasi Otoritas...
        </div>
      </div>
    );
  }

  // Pengecualian Halaman Login (agar tidak ikut render sidebar)
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#EFE9DB] font-sans">{children}</div>
    );
  }

  const handleLogout = () => {
    // 1. Hapus akses dari memori browser
    localStorage.removeItem("admin_token");
    localStorage.removeItem("customer_role");
    
    // 2. Munculkan notifikasi logout
    toast.success("KELUAR SISTEM!", { 
      description: "Sesi admin Anda telah diakhiri dengan aman." 
    });

    // 3. Beri jeda 800 milidetik (0.8 detik) agar notifikasi terbaca
    // sebelum melempar pengguna kembali ke halaman login
    setTimeout(() => {
      router.push("/admin/login");
    }, 800);
  };
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-[#EFE9DB] font-sans text-retro-charcoal">
      <Toaster position="top-right" richColors />
     {/* --- BAGIAN A: SIDEBAR KIRI --- */}
      <aside
        className={`bg-retro-cream border-r-[4px] border-retro-charcoal hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b-[4px] border-retro-charcoal bg-white overflow-hidden whitespace-nowrap">
          {isSidebarOpen ? (
            <h2 className="text-2xl font-black font-serif uppercase tracking-tighter drop-shadow-sm">
              STITCHED
              <span className="text-retro-red tracking-widest">BOOTH.</span>
            </h2>
          ) : (
            <h2 className="text-2xl font-black font-serif uppercase tracking-tighter text-retro-red drop-shadow-sm">
              SB.
            </h2>
          )}
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto overflow-x-hidden">
          <Link
            href="/admin/dashboard"
            title="Dashboard"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-retro-charcoal transition-all active:translate-y-1 ${
              isActive("/admin/dashboard")
                ? "bg-retro-red text-white shadow-[4px_4px_0_0_#262626]"
                : "bg-white text-retro-charcoal hover:bg-retro-cream shadow-[4px_4px_0_0_#262626]"
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Dashboard</span>
            )}
          </Link>

          <Link
            href="/admin/voucher"
            title="Voucher"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-retro-charcoal transition-all active:translate-y-1 ${
              isActive("/admin/voucher")
                ? "bg-retro-red text-white shadow-[4px_4px_0_0_#262626]"
                : "bg-white text-retro-charcoal hover:bg-retro-cream shadow-[4px_4px_0_0_#262626]"
            }`}
          >
            <Ticket size={18} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Voucher</span>
            )}
          </Link>

          <Link
            href="/admin/users"
            title="Users"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-retro-charcoal transition-all active:translate-y-1 ${
              isActive("/admin/users")
                ? "bg-retro-red text-white shadow-[4px_4px_0_0_#262626]"
                : "bg-white text-retro-charcoal hover:bg-retro-cream shadow-[4px_4px_0_0_#262626]"
            }`}
          >
            <User size={18} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Users</span>
            )}
          </Link>

          <Link
            href="/admin/transaction"
            title="transaction"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-retro-charcoal transition-all active:translate-y-1 ${
              isActive("/admin/transaction")
                ? "bg-retro-red text-white shadow-[4px_4px_0_0_#262626]"
                : "bg-white text-retro-charcoal hover:bg-retro-cream shadow-[4px_4px_0_0_#262626]"
            }`}
          >
            <ReceiptText size={18} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Transactions</span>
            )}
          </Link>

          <Link
            href="/admin/kiosk"
            title="kiosk"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-retro-charcoal transition-all active:translate-y-1 ${
              isActive("/admin/kiosk")
                ? "bg-retro-red text-white shadow-[4px_4px_0_0_#262626]"
                : "bg-white text-retro-charcoal hover:bg-retro-cream shadow-[4px_4px_0_0_#262626]"
            }`}
          >
            <MonitorSmartphone size={18} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Device</span>
            )}
          </Link>
        </nav>
      </aside>

      {/* --- BAGIAN B: AREA KANAN --- */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* HEADER ATAS */}
        <header className="h-20 bg-retro-cream border-b-[4px] border-retro-charcoal flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Tombol Toggle Sidebar Desktop */}
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} strokeWidth={3} />
              ) : (
                <PanelLeftOpen size={20} strokeWidth={3} />
              )}
            </Button>

            {/* Tombol Menu Mobile */}
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu size={20} strokeWidth={3} />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-3 hidden sm:flex">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black uppercase tracking-widest">
                  Admin Utama
                </span>
                <span className="text-[10px] font-bold text-retro-charcoal/60 uppercase">
                  Manajemen Sistem
                </span>
              </div>
              <div className="w-11 h-11 bg-[#FF0000] border-[3px] border-retro-charcoal rounded-none shadow-[3px_3px_0_0_#262626] flex items-end justify-center overflow-hidden">
                <div className="w-7 h-5 bg-white border-t-[3px] border-x-[3px] border-retro-charcoal rounded-t-sm flex justify-center">
                  <div className="w-0.5 h-full bg-retro-charcoal/30"></div>
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} strokeWidth={3} />
              <span>Keluar</span>
            </Button>
          </div>
        </header>

        {/* KONTEN HALAMAN */}
        <main className="flex-1 p-6 md:p-10 max-w-screen-2xl mx-auto w-full">
          <Toaster position="top-right" richColors />
          {children}
        </main>
      </div>
    </div>
  );
}
