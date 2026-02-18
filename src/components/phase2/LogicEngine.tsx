import type { LogicAnalysis } from "@/types/project";
import { Sparkles, Calculator, Tag, Key, Shield, Lightbulb } from "lucide-react";

interface LogicEngineProps {
  analysis: LogicAnalysis;
}

const confidenceColors = {
  Certain: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Likely: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Inferred: "bg-amber-50 text-amber-700 border-amber-200",
};

export function LogicEngine({ analysis }: LogicEngineProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Logic Reverse-Engineering</h3>
          <p className="text-xs text-muted-foreground">The "Secret Sauce" — extracted business rules from spreadsheet formulas</p>
        </div>
      </div>

      {/* Calculated Fields */}
      <div className="border-2 border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-indigo-200/60 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <h4 className="font-semibold text-sm text-indigo-900">Calculated Fields</h4>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {analysis.calculatedFields.length} formulas
          </span>
        </div>
        <div className="p-4 space-y-3">
          {analysis.calculatedFields.map((field, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{field.fieldName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{field.sourceArtifact}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceColors[field.confidence]}`}>
                    {field.confidence}
                  </span>
                </div>
              </div>
              <code className="block text-[11px] bg-slate-900 text-emerald-400 px-3 py-2 rounded-lg font-mono leading-relaxed overflow-x-auto">
                {field.formula}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Categorical Rules */}
      <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-sm text-foreground">Categorical Rules (Enumerations)</h4>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            {analysis.categoricalRules.length} enums
          </span>
        </div>
        <div className="p-4 space-y-3">
          {analysis.categoricalRules.map((rule, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-purple-50/30 border border-purple-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-sm text-purple-900">{rule.columnName}</span>
                <span className="text-[10px] text-muted-foreground">({rule.sourceArtifact})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                {rule.distinctValues.map((val) => (
                  <span key={val} className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-700 text-[11px] font-medium">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>These columns should be implemented as database ENUMs or lookup tables for data integrity.</span>
          </div>
        </div>
      </div>

      {/* Implicit Keys */}
      <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-600" />
          <h4 className="font-semibold text-sm text-foreground">Implicit Keys</h4>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            {analysis.implicitKeys.length} keys
          </span>
        </div>
        <div className="p-4 space-y-2">
          {analysis.implicitKeys.map((key, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-amber-50/30 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                key.keyType === "Primary" ? "bg-amber-100 text-amber-600" :
                key.keyType === "Foreign" ? "bg-cyan-100 text-cyan-600" :
                "bg-purple-100 text-purple-600"
              }`}>
                {key.keyType === "Primary" ? <Key className="w-4 h-4" /> :
                 key.keyType === "Foreign" ? <Shield className="w-4 h-4" /> :
                 <Tag className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-sm text-foreground">{key.columnName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    key.keyType === "Primary" ? "bg-amber-50 text-amber-700" :
                    key.keyType === "Foreign" ? "bg-cyan-50 text-cyan-700" :
                    "bg-purple-50 text-purple-700"
                  }`}>
                    {key.keyType}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({key.sourceArtifact})</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{key.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
