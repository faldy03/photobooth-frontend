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
  Image as ImageIcon,
  Settings,
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
      <div className="min-h-screen bg-[#F4F3EE] flex flex-col items-center justify-center font-sans">
        <div className="font-black uppercase tracking-widest text-gray-700 animate-pulse text-lg">
          Memverifikasi Otoritas...
        </div>
      </div>
    );
  }

  // Pengecualian Halaman Login (agar tidak ikut render sidebar)
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#F4F3EE] font-sans">{children}</div>
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
    setTimeout(() => {
      router.push("/admin/login");
    }, 800);
  };
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans text-gray-800">
      <Toaster position="top-right" richColors />
      
      {/* --- SIDEBAR KIRI --- */}
      <aside
        className={`bg-[#141416] text-white flex flex-col z-20 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/5 overflow-hidden whitespace-nowrap px-4">
          {isSidebarOpen ? (
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              BOOTH
              <span className="text-[#FF0000]">FLOW.</span>
            </h2>
          ) : (
            <h2 className="text-xl font-black uppercase tracking-tighter text-[#FF0000]">
              BF.
            </h2>
          )}
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
          <Link
            href="/admin/dashboard"
            title="Dashboard"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/dashboard")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Dashboard</span>
            )}
          </Link>

          <Link
            href="/admin/voucher"
            title="Voucher"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/voucher")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ticket size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Voucher</span>
            )}
          </Link>

          <Link
            href="/admin/users"
            title="Users"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/users")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Users</span>
            )}
          </Link>

          <Link
            href="/admin/transaction"
            title="Transactions"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/transaction")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ReceiptText size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Transactions</span>
            )}
          </Link>

          <Link
            href="/admin/kiosk"
            title="Devices"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/kiosk")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MonitorSmartphone size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Device</span>
            )}
          </Link>

          <Link
            href="/admin/photo-assets"
            title="Photo Assets"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/photo-assets")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">Photo Assets</span>
            )}
          </Link>

          <Link
            href="/admin/settings"
            title="System Settings"
            className={`flex items-center ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"} gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
              isActive("/admin/settings")
                ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings size={18} className="shrink-0" />
            {isSidebarOpen && (
              <span className="whitespace-nowrap">System Settings</span>
            )}
          </Link>
        </nav>
      </aside>

      {/* --- AREA KANAN --- */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* HEADER ATAS */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Toggle Sidebar Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-50 cursor-pointer"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </Button>

            {/* Tombol Menu Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden text-gray-500 rounded-xl">
              <Menu size={20} />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-3 hidden sm:flex">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Admin Utama
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Manajemen Sistem
                </span>
              </div>
              
              {/* Clean Initials Avatar */}
              <div className="w-10 h-10 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-xs font-black text-[#FF0000] tracking-tighter">AU</span>
              </div>
            </div>

            {/* Clean Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <LogOut size={14} className="text-gray-500" />
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
