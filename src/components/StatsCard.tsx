import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "indigo" | "cyan" | "emerald" | "amber";
}

const accentStyles = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
};

const iconBg = {
  indigo: "bg-indigo-100 text-indigo-600",
  cyan: "bg-cyan-100 text-cyan-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
};

export function StatsCard({ label, value, icon, accent = "indigo" }: StatsCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${accentStyles[accent]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
