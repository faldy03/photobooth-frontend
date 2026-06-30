import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "green"; // 🚨 Tambahkan 'green' di sini
}

export default function StatCard({ title, value, icon, variant = "default" }: StatCardProps) {
  // Tema warna khas retro brutalist
  const bgColors = {
    default: "bg-white",
    success: "bg-[#EFE9DB]", // Warna cream retro asli Anda
    warning: "bg-amber-100",
    danger: "bg-[#FF0000] text-white", // Retro red
    green: "bg-green-100 text-green-800 border-green-800", // 🚨 Warna hijau retro lembut untuk sukses
  };

  const isDanger = variant === "danger";

  return (
    <div className={`p-6 border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#262626] ${bgColors[variant]}`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDanger ? 'text-white/80' : 'text-retro-charcoal/70'}`}>
          {title}
        </p>
        <h3 className={`text-3xl font-black ${isDanger ? 'text-white' : 'text-retro-charcoal'}`}>
          {value}
        </h3>
      </div>
      <div className={`p-3 border-[3px] border-retro-charcoal shadow-[3px_3px_0_0_#262626] ${isDanger ? 'bg-white text-retro-charcoal' : 'bg-white text-retro-charcoal'}`}>
        {icon}
      </div>
    </div>
  );
}