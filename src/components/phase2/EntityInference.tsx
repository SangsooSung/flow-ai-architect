import type { NormalizationRecommendation } from "@/types/project";
import { GitBranch, ArrowRight, Database, Lightbulb } from "lucide-react";

interface EntityInferenceProps {
  recommendations: NormalizationRecommendation[];
}

export function EntityInference({ recommendations }: EntityInferenceProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Entity Relationship Inference</h3>
          <p className="text-xs text-muted-foreground">Normalization recommendations for flat spreadsheet data</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="border border-border/60 rounded-2xl bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-cyan-50/50 dark:from-cyan-950/30 to-transparent">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Database className="w-3.5 h-3.5" />
                Source: {rec.sourceArtifact}
              </div>
              <p className="text-sm text-foreground font-medium">{rec.sourceDescription}</p>
            </div>

            <div className="p-4">
              {/* Visual Entity Diagram */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {rec.proposedEntities.map((entity, j) => (
                  <div key={entity.name} className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-cyan-50 dark:from-cyan-950/30 to-blue-50 dark:to-blue-950/20 border-2 border-cyan-200 dark:border-cyan-800 shadow-sm">
                      <p className="font-mono font-bold text-sm text-cyan-800 dark:text-cyan-300">{entity.name}</p>
                      <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5">{entity.linkedBy}</p>
                    </div>
                    {j < rec.proposedEntities.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                ))}
              </div>

              {/* Rationale */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Rationale</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{rec.rationale}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
        <GitBranch className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Normalization:</strong> Flat spreadsheets often combine multiple logical entities. 
          Splitting them into separate tables improves data integrity, reduces redundancy, and enables 
          flexible querying in the ERP database.
        </p>
      </div>
    </div>
  );
}
