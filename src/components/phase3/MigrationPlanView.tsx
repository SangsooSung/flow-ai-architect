import type { MigrationPlan } from "@/types/project";
import { Database, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface MigrationPlanViewProps {
  plan: MigrationPlan;
}

const statusStyles = {
  ready: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  needs_cleanup: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", icon: AlertTriangle },
  blocked: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-300", icon: XCircle },
};

export function MigrationPlanView({ plan }: MigrationPlanViewProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Data Migration Strategy</h3>
          <p className="text-xs text-muted-foreground">Mapping legacy spreadsheets to ERP database tables</p>
        </div>
      </div>

      {/* Mappings */}
      <div className="space-y-4">
        {plan.mappings.map((mapping, i) => {
          const status = statusStyles[mapping.status];
          const StatusIcon = status.icon;
          return (
            <div key={i} className={`border-2 ${status.border} rounded-2xl ${status.bg} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-inherit flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`w-5 h-5 ${status.text}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{mapping.sourceSheet}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{mapping.targetTable}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{mapping.estimatedRows}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text} border ${status.border}`}>
                  {mapping.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {mapping.cleanupNotes.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Cleanup Required ({mapping.cleanupNotes.length} items)
                  </p>
                  <div className="space-y-1.5">
                    {mapping.cleanupNotes.map((note, j) => (
                      <div key={j} className="flex items-start gap-2 p-2 rounded-lg bg-card/60">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground/80">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Import Order */}
      <div className="border border-border/60 rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-semibold text-sm text-foreground">Import Order (Dependency-Aware)</h4>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {plan.importOrder.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <span className="text-sm text-foreground">{step.replace(/^\d+\.\s*/, "")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          <strong>Import Strategy:</strong> Tables must be imported in dependency order to satisfy foreign key constraints. 
          Parent tables (Product, Warehouse, Vendor) must be populated before child tables (Inventory_Record, Order).
        </p>
      </div>
    </div>
  );
}
