import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "indigo" | "cyan" | "emerald" | "amber";
}

const accentStyles = {
  indigo: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
  cyan: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50",
  emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
  amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
};

const iconBg = {
  indigo: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300",
  cyan: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-300",
  emerald: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300",
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
