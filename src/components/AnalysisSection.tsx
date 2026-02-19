import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface AnalysisSectionProps {
  title: string;
  icon: ReactNode;
  accentColor: "indigo" | "cyan" | "emerald" | "amber" | "rose";
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

const borderColors = {
  indigo: "border-l-indigo-500",
  cyan: "border-l-cyan-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  rose: "border-l-rose-500",
};

const iconBg = {
  indigo: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
  cyan: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",
};

const badgeColors = {
  indigo: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300",
  cyan: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300",
  emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300",
};

export function AnalysisSection({
  title,
  icon,
  accentColor,
  children,
  defaultOpen = false,
  badge,
}: AnalysisSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border border-border/60 rounded-2xl bg-card overflow-hidden border-l-4 ${borderColors[accentColor]} transition-all duration-200 hover:shadow-sm`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[accentColor]}`}>
          {icon}
        </div>
        <span className="flex-1 font-semibold text-sm text-foreground">{title}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColors[accentColor]}`}>
            {badge}
          </span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
