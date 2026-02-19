import type { ContextValidation } from "@/types/project";
import { CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, ArrowRight } from "lucide-react";

interface RealityCheckProps {
  validations: ContextValidation[];
}

export function RealityCheck({ validations }: RealityCheckProps) {
  const confirmed = validations.filter((v) => v.type === "confirmed");
  const discrepancies = validations.filter((v) => v.type === "discrepancy");
  const surprises = validations.filter((v) => v.type === "surprise");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Context Validation (Reality Check)</h3>
          <p className="text-xs text-muted-foreground">Comparing meeting claims against actual spreadsheet data</p>
        </div>
      </div>

      {/* Critical Discrepancies Banner */}
      {discrepancies.some((d) => d.severity === "critical") && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h4 className="font-bold text-rose-800 dark:text-rose-100 text-sm">Critical Discrepancies Found</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              The data contradicts {discrepancies.filter((d) => d.severity === "critical").length} claims from the meeting. 
              These must be resolved before development.
            </p>
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Confirmed */}
        <div className="border border-emerald-200 dark:border-emerald-800 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Confirmed</h4>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {confirmed.length}
            </span>
          </div>
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {confirmed.map((item, i) => (
              <ValidationCard key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Discrepancies */}
        <div className="border-2 border-rose-200 dark:border-rose-800 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-rose-200/60 dark:border-rose-800/60 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/50">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h4 className="font-semibold text-sm text-rose-900 dark:text-rose-300">Discrepancies</h4>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
              {discrepancies.length} CRITICAL
            </span>
          </div>
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {discrepancies.map((item, i) => (
              <ValidationCard key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Surprises */}
        <div className="border border-cyan-200 dark:border-cyan-800 rounded-2xl bg-cyan-50/30 dark:bg-cyan-950/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-200/60 dark:border-cyan-800/60 flex items-center gap-2 bg-cyan-50 dark:bg-cyan-950/50">
            <Lightbulb className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="font-semibold text-sm text-cyan-900 dark:text-cyan-100">Surprises</h4>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">
              {surprises.length}
            </span>
          </div>
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {surprises.map((item, i) => (
              <ValidationCard key={i} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Trust Data Over Words Note */}
      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Analysis Principle:</strong> When the meeting transcript contradicts the spreadsheet data, 
          the data is treated as the source of truth. Discrepancies are flagged for client clarification.
        </p>
      </div>
    </div>
  );
}

function ValidationCard({ item }: { item: ContextValidation }) {
  const typeStyles = {
    confirmed: {
      bg: "bg-card",
      border: "border-emerald-100 dark:border-emerald-900",
      badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    },
    discrepancy: {
      bg: "bg-card",
      border: item.severity === "critical" ? "border-rose-300 dark:border-rose-700" : "border-rose-100 dark:border-rose-900",
      badge: item.severity === "critical" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    },
    surprise: {
      bg: "bg-card",
      border: "border-cyan-100 dark:border-cyan-900",
      badge: item.severity === "critical" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" : "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300",
    },
  };

  const styles = typeStyles[item.type];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs text-foreground">{item.field}</span>
        {item.severity && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${styles.badge}`}>
            {item.severity}
          </span>
        )}
      </div>

      {item.meetingClaim && (
        <div className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/70">Meeting:</span> {item.meetingClaim}
        </div>
      )}

      <div className="text-[11px] text-foreground/80 bg-slate-50 dark:bg-slate-950/50 rounded-lg p-2">
        <span className="font-semibold text-foreground/70">Data:</span> {item.dataEvidence}
      </div>

      {item.recommendation && (
        <div className="flex items-start gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg p-2">
          <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{item.recommendation}</span>
        </div>
      )}
    </div>
  );
}
