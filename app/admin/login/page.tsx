"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

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
      const res = await fetch(getApiUrl("/api/admin/login"), {
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

      setTimeout(() => {
        if (data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      }, 800); 

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans"> 
      <Toaster position="top-right" richColors />
      
      {/* Main Container Card */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100/50">
        
        {/* LEFT COLUMN: Modern Branding Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#1E1E1E] via-[#2A1212] to-[#400B0B] p-12 flex flex-col items-center justify-between text-white relative min-h-[300px] md:min-h-[500px]">
          {/* Subtle background overlay grid */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="w-full z-10 flex flex-col justify-center items-center flex-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-center uppercase">
              BOOTH
              <span className="text-[#FF0000]">FLOW.</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-3 text-center font-bold">
              Admin Control Center
            </p>
          </div>

          <div className="w-full z-10 mt-auto text-center md:text-left">
            <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
              © {new Date().getFullYear()} BoothFlow. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Minimalist Login Form */}
        <div className="md:w-1/2 p-10 md:p-14 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Login
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to manage your photobooth kiosks.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 font-semibold rounded-xl">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-sans font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@boothflow.com"
                className="w-full h-12 rounded-xl border border-gray-200 px-4 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] transition-all bg-gray-50/30"
              />
            </div>

            <div>
              <label className="block font-sans font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl border border-gray-200 pl-4 pr-12 focus:ring-1 focus:ring-[#FF0000] focus:border-[#FF0000] transition-all bg-gray-50/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full text-base h-12 mt-4 rounded-xl bg-[#FF0000] hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/10 hover:shadow-red-500/20 border-none cursor-pointer"
            >
              Masuk Sistem
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
