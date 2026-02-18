import { useState } from "react";
import type { Phase3Data } from "@/types/project";
import {
  FileText,
  Copy,
  Download,
  CheckCircle2,
  Shield,
  Database,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Phase3PanelProps {
  data: Phase3Data;
}

export function Phase3Panel({ data }: Phase3PanelProps) {
  const [activeTab, setActiveTab] = useState<"document" | "modules" | "data-model">("document");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.prdMarkdown);
    setCopied(true);
    toast.success("PRD copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([data.prdMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erp-specification.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PRD downloaded as Markdown");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">ERP Specification</h3>
          <p className="text-sm text-muted-foreground">
            Developer-ready specification generated from transcript and artifact analysis.
          </p>
        </div>
        <ConfidenceBadge confidence={data.confidence} />
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Markdown"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
        >
          <Download className="w-4 h-4" />
          Download .md
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
        {[
          { key: "document" as const, label: "Document", icon: FileText },
          { key: "modules" as const, label: "Modules", icon: Layers },
          { key: "data-model" as const, label: "Data Model", icon: Database },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "document" && <DocumentView markdown={data.prdMarkdown} />}
      {activeTab === "modules" && <ModulesView data={data} />}
      {activeTab === "data-model" && <DataModelView data={data} />}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color =
    confidence >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : confidence >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  const icon =
    confidence >= 80 ? (
      <Shield className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );

  return (
    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${color}`}>
      {icon}
      <div>
        <p className="text-xs font-bold leading-none">{confidence}% Confidence</p>
        <p className="text-[10px] opacity-70 mt-0.5">Transcript + Artifact alignment</p>
      </div>
    </div>
  );
}

function DocumentView({ markdown }: { markdown: string }) {
  // Simple markdown renderer
  const lines = markdown.split("\n");

  return (
    <div className="border border-border/60 rounded-2xl bg-white p-5 md:p-8 max-h-[600px] overflow-y-auto">
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
            return null; // Skip code fences, handled below
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
  // Handle inline code
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Handle bold
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
  const [expandedModule, setExpandedModule] = useState<string | null>(data.modules[0]?.name ?? null);

  const priorityColors = {
    Critical: "bg-rose-50 text-rose-700 border-rose-200",
    High: "bg-amber-50 text-amber-700 border-amber-200",
    Medium: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Low: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="space-y-3">
      {data.modules.map((mod) => {
        const isExpanded = expandedModule === mod.name;
        return (
          <div key={mod.name} className="border border-border/60 rounded-2xl bg-white overflow-hidden">
            <button
              onClick={() => setExpandedModule(isExpanded ? null : mod.name)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{mod.name}</p>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[mod.priority]}`}>
                {mod.priority}
              </span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-border/30 animate-fade-in">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Requirements ({mod.requirements.length})
                </p>
                <div className="space-y-1.5">
                  {mod.requirements.map((req) => (
                    <div key={req} className="flex items-center gap-2 text-sm text-foreground/80 p-1.5 rounded-lg hover:bg-muted/20">
                      <div className="w-4 h-4 rounded border-2 border-indigo-300 flex-shrink-0" />
                      <span className="font-mono text-xs text-indigo-600">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataModelView({ data }: { data: Phase3Data }) {
  return (
    <div className="space-y-3">
      {data.dataModel.map((entity) => (
        <div key={entity.name} className="border border-border/60 rounded-2xl bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm font-mono text-foreground">{entity.name}</h4>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {entity.fields.length} fields
            </span>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 font-semibold text-muted-foreground pr-4">Field</th>
                    <th className="pb-2 font-semibold text-muted-foreground pr-4">Type</th>
                    <th className="pb-2 font-semibold text-muted-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {entity.fields.map((field) => (
                    <tr key={field.name} className="border-t border-border/20">
                      <td className="py-1.5 pr-4 font-mono font-medium text-foreground">{field.name}</td>
                      <td className="py-1.5 pr-4">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono">
                          {field.type}
                        </span>
                      </td>
                      <td className="py-1.5">
                        {field.required ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {entity.relationships.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Relationships
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entity.relationships.map((rel) => (
                    <span key={rel} className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-700">
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
