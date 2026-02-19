import type { Phase1Data } from "@/types/project";
import { AnalysisSection } from "./AnalysisSection";
import {
  Target,
  Users,
  GitBranch,
  ListChecks,
  FileSpreadsheet,
  Database,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface Phase1OutputProps {
  data: Phase1Data;
}

export function Phase1Output({ data }: Phase1OutputProps) {
  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Analysis Complete</span>
      </div>

      {/* 1. Executive Summary */}
      <AnalysisSection
        title="Executive Summary & Problem Statement"
        icon={<Target className="w-4 h-4" />}
        accentColor="indigo"
        defaultOpen
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Goal</p>
            <p className="text-sm text-foreground leading-relaxed">{data.executiveSummary.goal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pain Points</p>
            <ul className="space-y-1.5">
              {data.executiveSummary.painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AnalysisSection>

      {/* 2. User Roles */}
      <AnalysisSection
        title="User Roles & Permissions"
        icon={<Users className="w-4 h-4" />}
        accentColor="cyan"
        badge={`${data.userRoles.length} roles`}
      >
        <div className="space-y-2.5">
          {data.userRoles.map((role, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold whitespace-nowrap">
                {role.name}
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </AnalysisSection>

      {/* 3. Business Logic */}
      <AnalysisSection
        title="Business Logic & Workflow"
        icon={<GitBranch className="w-4 h-4" />}
        accentColor="emerald"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Current State</p>
            <div className="space-y-2">
              {data.businessLogic.currentState.map((step) => (
                <div key={step.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{step.description}</p>
                    {step.conditional && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Condition: {step.conditional}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">Future State (ERP)</p>
            <div className="space-y-2">
              {data.businessLogic.futureState.map((step) => (
                <div key={step.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{step.description}</p>
                    {step.conditional && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Condition: {step.conditional}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnalysisSection>

      {/* 4. Functional Requirements */}
      <AnalysisSection
        title="Functional Requirements"
        icon={<ListChecks className="w-4 h-4" />}
        accentColor="indigo"
        badge={`${data.requirements.reduce((acc, m) => acc + m.requirements.length, 0)} items`}
      >
        <div className="space-y-4">
          {data.requirements.map((mod) => (
            <div key={mod.moduleName}>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                {mod.moduleName}
              </p>
              <div className="space-y-1.5">
                {mod.requirements.map((req) => (
                  <div key={req.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                    <div className="w-4 h-4 rounded border-2 border-indigo-300 dark:border-indigo-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{req.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          req.priority === "High"
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300"
                            : req.priority === "Medium"
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {req.priority}
                        </span>
                        <span className="text-[11px] text-muted-foreground italic truncate">
                          "{req.context}"
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AnalysisSection>

      {/* 5. Artifact Mapping — THE HOOK */}
      <AnalysisSection
        title="External Artifact & Data Mapping"
        icon={<FileSpreadsheet className="w-4 h-4" />}
        accentColor="amber"
        defaultOpen
        badge="Action Required"
      >
        <div className="space-y-3">
          <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            The client referenced the following external files during the meeting. Upload these files in Phase 2 to validate and detail the requirements.
          </p>
          {data.artifactMapping.map((artifact) => (
            <div key={artifact.id} className="border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 bg-amber-50/30 dark:bg-amber-950/20">
              <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                {artifact.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{artifact.context}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {artifact.expectedFields.map((field) => (
                  <span key={field} className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-medium">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AnalysisSection>

      {/* 6. Data Entities */}
      <AnalysisSection
        title="Implicit Data Entities"
        icon={<Database className="w-4 h-4" />}
        accentColor="cyan"
        badge={`${data.dataEntities.length} entities`}
      >
        <div className="flex flex-wrap gap-2">
          {data.dataEntities.map((entity) => (
            <span
              key={entity}
              className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-sm font-mono font-medium"
            >
              {entity}
            </span>
          ))}
        </div>
      </AnalysisSection>

      {/* 7. Open Questions */}
      <AnalysisSection
        title="Open Questions & Ambiguities"
        icon={<HelpCircle className="w-4 h-4" />}
        accentColor="amber"
        badge={`${data.openQuestions.length} questions`}
      >
        <div className="space-y-2">
          {data.openQuestions.map((q, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30">
              <span className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-foreground">{q}</p>
            </div>
          ))}
        </div>
      </AnalysisSection>
    </div>
  );
}
