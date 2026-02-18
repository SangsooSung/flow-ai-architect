import type { ProjectOverview } from "@/types/project";
import { Target, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface ProjectOverviewSectionProps {
  overview: ProjectOverview;
}

export function ProjectOverviewSection({ overview }: ProjectOverviewSectionProps) {
  return (
    <div className="space-y-5">
      {/* Objective */}
      <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 bg-gradient-to-r from-indigo-50/50 to-transparent">
          <Target className="w-4 h-4 text-indigo-600" />
          <h4 className="font-semibold text-sm text-foreground">Project Objective</h4>
        </div>
        <div className="p-4">
          <p className="text-sm text-foreground leading-relaxed">{overview.objective}</p>
        </div>
      </div>

      {/* Scope Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* In Scope */}
        <div className="border-2 border-emerald-200 rounded-2xl bg-emerald-50/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-200/60 flex items-center gap-2 bg-emerald-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-sm text-emerald-900">In Scope</h4>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {overview.scopeIn.length} items
            </span>
          </div>
          <div className="p-4 space-y-2">
            {overview.scopeIn.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Out of Scope */}
        <div className="border border-border/60 rounded-2xl bg-gray-50/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 bg-gray-50">
            <XCircle className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-sm text-gray-700">Out of Scope</h4>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {overview.scopeOut.length} items
            </span>
          </div>
          <div className="p-4 space-y-2">
            {overview.scopeOut.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Scope Management:</strong> Items marked "Out of Scope" can be addressed in future phases. 
          Any scope changes during development require formal change request approval.
        </p>
      </div>
    </div>
  );
}
