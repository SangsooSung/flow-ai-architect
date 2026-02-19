import { useState, useMemo } from "react";
import type { Phase3Data } from "@/types/project";
import { ProjectOverviewSection } from "./phase3/ProjectOverviewSection";
import { ArchitectureView } from "./phase3/ArchitectureView";
import { UserFlowsView } from "./phase3/UserFlowsView";
import { MigrationPlanView } from "./phase3/MigrationPlanView";
import { ConflictResolutionView } from "./phase3/ConflictResolutionView";
import { generateFullPRD } from "@/lib/prdGenerator";
import {
  FileText,
  Copy,
  Download,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Target,
  Database,
  GitBranch,
  Truck,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

interface Phase3PanelProps {
  data: Phase3Data;
}

type TabKey = "overview" | "architecture" | "flows" | "migration" | "conflicts" | "document" | "modules";

export function Phase3Panel({ data }: Phase3PanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copied, setCopied] = useState(false);

  // Generate full PRD from structured data (memoized to avoid regeneration on every render)
  const fullPRD = useMemo(() => generateFullPRD(data), [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPRD);
    setCopied(true);
    toast.success("PRD copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullPRD], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erp-specification.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PRD downloaded as Markdown");
  };

  const tabs: { key: TabKey; label: string; icon: typeof Target; badge?: string }[] = [
    { key: "overview", label: "Overview", icon: Target },
    { key: "architecture", label: "Architecture", icon: Database },
    { key: "flows", label: "User Flows", icon: GitBranch },
    { key: "migration", label: "Migration", icon: Truck },
    { key: "conflicts", label: "Conflicts", icon: ShieldAlert, badge: `${data.conflicts.filter(c => c.severity === 'critical').length}` },
    { key: "document", label: "Full PRD", icon: FileText },
    { key: "modules", label: "Modules", icon: Layers },
  ];

  const criticalCount = data.conflicts.filter((c) => c.severity === "critical").length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">ERP Technical Specification</h3>
          <p className="text-sm text-muted-foreground">
            Developer-ready PRD synthesized from transcript and artifact analysis.
          </p>
        </div>
        <ConfidenceBadge confidence={data.confidence} criticalConflicts={criticalCount} />
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy PRD"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Download Full PRD
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-card text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.key === "conflicts" && parseInt(tab.badge) > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <ProjectOverviewSection overview={data.projectOverview} />
        )}

        {activeTab === "architecture" && (
          <ArchitectureView architecture={data.architecture} />
        )}

        {activeTab === "flows" && (
          <UserFlowsView flows={data.userFlows} />
        )}

        {activeTab === "migration" && (
          <MigrationPlanView plan={data.migrationPlan} />
        )}

        {activeTab === "conflicts" && (
          <ConflictResolutionView
            conflicts={data.conflicts}
            blockingQuestions={data.blockingQuestions}
          />
        )}

        {activeTab === "document" && (
          <DocumentView markdown={fullPRD} />
        )}

        {activeTab === "modules" && (
          <ModulesView data={data} />
        )}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence, criticalConflicts }: { confidence: number; criticalConflicts: number }) {
  const hasIssues = criticalConflicts > 0;
  const color = hasIssues
    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
    : confidence >= 80
    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
    : confidence >= 60
    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
    : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";

  const icon = hasIssues ? (
    <AlertTriangle className="w-4 h-4" />
  ) : confidence >= 80 ? (
    <Shield className="w-4 h-4" />
  ) : (
    <AlertTriangle className="w-4 h-4" />
  );

  return (
    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${color}`}>
      {icon}
      <div>
        <p className="text-xs font-bold leading-none">{confidence}% Confidence</p>
        <p className="text-[10px] opacity-70 mt-0.5">
          {hasIssues ? `${criticalConflicts} critical conflicts` : "Transcript + Artifact alignment"}
        </p>
      </div>
    </div>
  );
}

function DocumentView({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");

  return (
    <div className="border border-border/60 rounded-2xl bg-card p-5 md:p-8 max-h-[600px] overflow-y-auto">
      <div className="prose prose-sm max-w-none">
        {lines.map((line, i) => {
          if (line.startsWith("# ")) {
            return <h1 key={i} className="text-2xl font-bold text-foreground mt-0 mb-4">{line.slice(2)}</h1>;
          }
          if (line.startsWith("## ")) {
            return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border/40">{line.slice(3)}</h2>;
          }
          if (line.startsWith("### ")) {
            return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(4)}</h3>;
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={i} className="font-bold text-foreground mt-4 mb-1">{line.slice(2, -2)}</p>;
          }
          if (line.startsWith("- ")) {
            return (
              <div key={i} className="flex items-start gap-2 ml-2 my-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground/80">{renderInlineMarkdown(line.slice(2))}</span>
              </div>
            );
          }
          if (line.startsWith("```")) {
            return null;
          }
          if (line.startsWith("|")) {
            return <p key={i} className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{line}</p>;
          }
          if (line.startsWith("---")) {
            return <hr key={i} className="my-6 border-border/40" />;
          }
          if (line.trim() === "") {
            return <div key={i} className="h-2" />;
          }
          return <p key={i} className="text-sm text-foreground/80 leading-relaxed my-1">{renderInlineMarkdown(line)}</p>;
        })}
      </div>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return <strong key={`${i}-${j}`} className="font-semibold text-foreground">{bp.slice(2, -2)}</strong>;
      }
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

function ModulesView({ data }: { data: Phase3Data }) {
  const priorityColors = {
    Critical: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    High: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Medium: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    Low: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">ERP Modules</h3>
          <p className="text-xs text-muted-foreground">Functional modules with requirements mapping</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.modules.map((mod) => (
          <div key={mod.name} className="border border-border/60 rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-sm text-foreground">{mod.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[mod.priority]}`}>
                {mod.priority}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">{mod.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {mod.requirements.map((req) => (
                  <span key={req} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
