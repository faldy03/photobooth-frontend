"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  Menu,
  X,
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

  // State Sidebar Desktop (Collapsible) & Mobile (Drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Tutup mobile sidebar setiap perpindahan halaman
    setIsMobileOpen(false);

    if (pathname === "/admin/login") {
      setIsChecking(false);
      return;
    }

    const token = localStorage.getItem("admin_token");
    const role = localStorage.getItem("customer_role");

    if (!token || role !== "admin") {
      router.push("/");
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center font-sans">
        <div className="font-black uppercase tracking-widest text-gray-700 animate-pulse text-sm">
          Memverifikasi Otoritas Admin...
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] font-sans">{children}</div>
    );
  }

  const handleLogout = () => {
    setIsMobileOpen(false);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("customer_role");
    
    toast.success("KELUAR SISTEM!", { 
      description: "Sesi admin Anda telah diakhiri dengan aman." 
    });

    setTimeout(() => {
      router.push("/admin/login");
    }, 600);
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/voucher", label: "Voucher", icon: Ticket },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/transaction", label: "Transactions", icon: ReceiptText },
    { href: "/admin/kiosk", label: "Device", icon: MonitorSmartphone },
    { href: "/admin/photo-assets", label: "Photo Assets", icon: ImageIcon },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans text-gray-800 relative">
      <Toaster position="top-right" richColors />
      
      {/* BACKDROP MOBILE */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR (DESKTOP & MOBILE DRAWER) --- */}
      <aside
        className={`
          bg-[#141416] text-white flex flex-col z-50 transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 md:static
          ${isMobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          ${isSidebarOpen ? "md:w-64" : "md:w-20"}
        `}
      >
        {/* Header / Logo Area Sidebar */}
        <div className="h-20 flex items-center justify-between border-b border-white/5 overflow-hidden whitespace-nowrap px-5 shrink-0">
          <div className="flex items-center gap-2">
            {(isSidebarOpen || isMobileOpen) ? (
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                BOOTH<span className="text-[#FF0000]">FLOW.</span>
              </h2>
            ) : (
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#FF0000] mx-auto">
                BF.
              </h2>
            )}
          </div>

          {/* Tombol Tutup Mobile Sidebar */}
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            const showText = isSidebarOpen || isMobileOpen;

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center ${
                  showText ? "justify-start px-4" : "justify-center px-0"
                } gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {showText && (
                  <span className="whitespace-nowrap">{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* --- TOMBOL LOGOUT (PINDAH KE FOOTER SIDEBAR) --- */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            title="Keluar dari Sistem"
            className={`w-full flex items-center ${
              (isSidebarOpen || isMobileOpen) ? "justify-start px-4" : "justify-center px-0"
            } gap-3 py-3.5 font-bold uppercase tracking-wider text-[11px] rounded-xl text-red-400 bg-red-500/10 hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer border-none group`}
          >
            <LogOut size={18} className="shrink-0 text-red-500 group-hover:text-white transition-colors" />
            {(isSidebarOpen || isMobileOpen) && (
              <span className="whitespace-nowrap">Keluar</span>
            )}
          </button>
        </div>
      </aside>

      {/* --- AREA KANAN (CONTENT & HEADER) --- */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {/* HEADER ATAS */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Toggle Sidebar Desktop Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-50 cursor-pointer"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Kecilkan Sidebar" : "Buka Sidebar"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </Button>

            {/* Tombol Menu Mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={22} />
            </Button>

            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline-block">
              Panel Admin
            </span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Admin Utama
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 hidden sm:inline-block">
                  Manajemen Sistem
                </span>
              </div>
              
              {/* Clean Initials Avatar */}
              <div className="w-10 h-10 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-xs font-black text-[#FF0000] tracking-tighter">AU</span>
              </div>
            </div>
          </div>
        </header>

        {/* KONTEN HALAMAN MAIN */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
