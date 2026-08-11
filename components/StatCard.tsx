import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "green";
}

export default function StatCard({ title, value, icon, variant = "default" }: StatCardProps) {
  return (
    <div className="p-6 bg-white border border-gray-100/50 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
          {value}
        </h3>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] group-hover:bg-[#FF0000] group-hover:text-white transition-all duration-300">
        {icon}
      </div>
    </div>
  );
}