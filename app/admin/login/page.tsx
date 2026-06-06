"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Pastikan endpoint Laravel ini sudah aktif
      const res = await fetch("http://127.0.0.1:8000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Kredensial salah!");

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("customer_role", data.user.role);

      toast.success("AKSES DITERIMA!", { 
        description: `Selamat datang kembali, ${data.user.name || 'Admin'}.` 
      });

      // 🚨 Jeda waktu diperpanjang menjadi 500ms agar toast terlihat
      setTimeout(() => {
        if (data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/"); // Lempar ke halaman depan photobooth
        }
      }, 800); 

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE9DB] flex items-center justify-center p-4 font-sans"> 
      <Toaster position="top-right" richColors />
     {/* Kontainer Utama */}
      <div
        className="w-full max-w-4xl flex flex-col md:flex-row bg-retro-cream border-[4px] border-retro-charcoal rounded-none overflow-hidden"
        style={{ boxShadow: "8px 8px 0px 0px #262626" }}
      >
        {/* KOLOM KIRI (Ilustrasi Kamera) */}
        <div className="md:w-1/2 bg-retro-red p-12 flex flex-col items-center justify-center border-b-[4px] md:border-b-0 md:border-r-[4px] border-retro-charcoal">
          <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-10 tracking-wider text-center drop-shadow-md">
            STITCHED
            <br />
            BOOTH.
          </h1>

          <svg
            width="240"
            height="180"
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-xl transition-transform hover:scale-105 duration-300"
          >
            <rect
              x="20"
              y="60"
              width="200"
              height="100"
              rx="10"
              fill="#333333"
              stroke="#262626"
              strokeWidth="4"
            />
            <rect x="24" y="100" width="192" height="56" fill="#262626" />
            <path
              d="M20 70C20 64.4772 24.4772 60 30 60H210C215.523 60 220 64.4772 220 70V100H20V70Z"
              fill="#F0EBE1"
              stroke="#262626"
              strokeWidth="4"
            />
            <rect
              x="35"
              y="45"
              width="25"
              height="15"
              rx="4"
              fill="#F0EBE1"
              stroke="#262626"
              strokeWidth="4"
            />
            <circle
              cx="180"
              cy="80"
              r="12"
              fill="#1A1A1A"
              stroke="#262626"
              strokeWidth="4"
            />
            <rect x="170" y="75" width="20" height="10" fill="#333333" />
            <circle
              cx="85"
              cy="80"
              r="10"
              fill="#d9383a"
              stroke="#262626"
              strokeWidth="3"
            />
            <circle
              cx="120"
              cy="115"
              r="45"
              fill="#E5E0D8"
              stroke="#262626"
              strokeWidth="4"
            />
            <circle
              cx="120"
              cy="115"
              r="35"
              fill="#333333"
              stroke="#262626"
              strokeWidth="4"
            />
            <circle cx="120" cy="115" r="22" fill="#1A1A1A" />
            <circle cx="128" cy="107" r="6" fill="#4D4D4D" />
            <rect
              x="40"
              y="110"
              width="10"
              height="30"
              rx="5"
              fill="#E5E0D8"
              stroke="#262626"
              strokeWidth="3"
            />
            <rect
              x="190"
              y="110"
              width="10"
              height="20"
              rx="5"
              fill="#E5E0D8"
              stroke="#262626"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* KOLOM KANAN (Form Login Shadcn) */}
        <div className="md:w-1/2 p-10 md:p-14 bg-retro-cream flex flex-col justify-center">
          <h2 className="text-4xl font-serif font-black text-retro-charcoal mb-8 tracking-tight uppercase">
            Login
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-[3px] border-retro-charcoal text-retro-charcoal text-sm flex items-center gap-3 font-bold shadow-[4px_4px_0_0_#262626]">
              <AlertCircle size={20} className="text-retro-red" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-sans font-black text-retro-charcoal text-sm uppercase tracking-widest mb-2">
                Email Address
              </label>
              {/* Menggunakan Shadcn Input */}
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stitched.com"
              />
            </div>

            <div>
              <label className="block font-sans font-black text-retro-charcoal text-sm uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                {/* Menggunakan Shadcn Input */}
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-retro-charcoal hover:text-retro-red transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Menggunakan Shadcn Button */}
            <Button type="submit" className="w-full text-lg h-14 mt-4">
              Masuk Sistem
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
