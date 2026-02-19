import type { ConflictResolution } from "@/types/project";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle, HelpCircle, ShieldAlert } from "lucide-react";

interface ConflictResolutionViewProps {
  conflicts: ConflictResolution[];
  blockingQuestions: string[];
}

export function ConflictResolutionView({ conflicts, blockingQuestions }: ConflictResolutionViewProps) {
  const criticalConflicts = conflicts.filter((c) => c.severity === "critical");
  const warningConflicts = conflicts.filter((c) => c.severity === "warning");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Conflict Resolution & Open Questions</h3>
          <p className="text-xs text-muted-foreground">Where meeting claims diverged from spreadsheet reality</p>
        </div>
      </div>

      {/* Critical Alert */}
      {criticalConflicts.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">{criticalConflicts.length} Critical Conflicts Require Resolution</h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              These conflicts must be resolved with the client before development can proceed.
              The data contradicts verbal requirements in ways that affect core functionality.
            </p>
          </div>
        </div>
      )}

      {/* Conflicts */}
      <div className="space-y-4">
        {/* Critical */}
        {criticalConflicts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h4 className="font-semibold text-sm text-rose-800 dark:text-rose-300">Critical Conflicts</h4>
            </div>
            <div className="space-y-3">
              {criticalConflicts.map((conflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} />
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warningConflicts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">Warnings</h4>
            </div>
            <div className="space-y-3">
              {warningConflicts.map((conflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blocking Questions */}
      <div className="border-2 border-amber-200 dark:border-amber-800 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30">
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-300">Blocking Questions</h4>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            {blockingQuestions.length} questions
          </span>
        </div>
        <div className="p-4 space-y-2">
          {blockingQuestions.map((question, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-amber-100 dark:border-amber-900">
              <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-foreground">{question}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Note */}
      <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Resolution Process:</strong> Schedule a follow-up call with the client to address these conflicts. 
          Document all decisions in the project record. Update the PRD once conflicts are resolved.
        </p>
      </div>
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: ConflictResolution }) {
  const isCritical = conflict.severity === "critical";

  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${
      isCritical ? "border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20" : "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
    }`}>
      <div className="p-4 space-y-3">
        {/* Client Claim */}
        <div className="flex items-start gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isCritical ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300" : "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300"
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Client Stated</p>
            <p className="text-sm text-foreground">{conflict.clientClaim}</p>
          </div>
        </div>

        {/* Data Reality */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Data Shows</p>
            <p className="text-sm text-foreground">{conflict.dataReality}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex items-start gap-2 bg-card rounded-xl p-3 border border-indigo-100 dark:border-indigo-900">
          <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">Recommendation</p>
            <p className="text-sm text-foreground/80">{conflict.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className={`px-4 py-2 border-t flex items-center justify-between ${
        isCritical ? "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
      }`}>
        <span className={`text-[10px] font-bold ${isCritical ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"}`}>
          {conflict.severity.toUpperCase()}
        </span>
        <span className={`text-[10px] font-medium ${conflict.resolved ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
          {conflict.resolved ? "✓ Resolved" : "Pending Resolution"}
        </span>
      </div>
    </div>
  );
}
