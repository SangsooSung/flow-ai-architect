import { useState, useRef } from "react";
import type { ArtifactReference, Phase2Data, AnalyzedArtifact } from "@/types/project";
import { mockPhase2Data } from "@/data/mockData";
import { SchemaDict } from "./phase2/SchemaDict";
import { LogicEngine } from "./phase2/LogicEngine";
import { RealityCheck } from "./phase2/RealityCheck";
import { EntityInference } from "./phase2/EntityInference";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Sparkles,
  Table2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Database,
  Zap,
  ShieldCheck,
  GitBranch,
} from "lucide-react";

interface Phase2PanelProps {
  artifacts: ArtifactReference[];
  onComplete: (data: Phase2Data) => void;
  processing: boolean;
}

type TabKey = "preview" | "schema" | "logic" | "validation" | "entities";

export function Phase2Panel({ artifacts, onComplete, processing }: Phase2PanelProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("preview");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = (artifactId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [artifactId]: file.name }));
  };

  const allUploaded = artifacts.every((a) => uploadedFiles[a.id]);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      setActiveTab("schema");
    }, 2500);
  };

  const handleComplete = () => {
    onComplete(mockPhase2Data);
  };

  const tabs: { key: TabKey; label: string; icon: typeof Database }[] = [
    { key: "preview", label: "Data Preview", icon: Table2 },
    { key: "schema", label: "Schema", icon: Database },
    { key: "logic", label: "Logic Engine", icon: Zap },
    { key: "validation", label: "Reality Check", icon: ShieldCheck },
    { key: "entities", label: "Entities", icon: GitBranch },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Artifact Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Upload the spreadsheets mentioned in the transcript to validate and detail the requirements.
        </p>
      </div>

      {/* Artifact Upload Cards */}
      <div className="space-y-3">
        {artifacts.map((artifact) => {
          const isUploaded = !!uploadedFiles[artifact.id];
          return (
            <div
              key={artifact.id}
              className={`border-2 rounded-2xl p-4 transition-all duration-300 ${
                isUploaded
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-amber-200 bg-amber-50/20 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isUploaded ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                }`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{artifact.name}</h4>
                    {isUploaded && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{artifact.context}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {artifact.expectedFields.map((field) => (
                      <span key={field} className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground font-medium">
                        {field}
                      </span>
                    ))}
                  </div>

                  {isUploaded ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-medium">{uploadedFiles[artifact.id]}</span>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={(el) => { fileRefs.current[artifact.id] = el; }}
                        type="file"
                        accept=".xlsx,.csv,.xls"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(artifact.id, file);
                        }}
                      />
                      <button
                        onClick={() => fileRefs.current[artifact.id]?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-amber-300 text-sm font-medium text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload .xlsx or .csv
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analyze Button */}
      {allUploaded && !analyzed && (
        <div className="flex justify-center animate-slide-up">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Spreadsheets...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Uploaded Files
              </>
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analyzed && (
        <div className="space-y-5 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            <span className="text-sm font-semibold text-emerald-700">Data Logic Technical Report</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === "preview" && (
              <div className="space-y-4">
                {mockPhase2Data.artifacts.map((artifact) => (
                  <ArtifactPreviewCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            )}

            {activeTab === "schema" && (
              <SchemaDict schemas={mockPhase2Data.schemas} />
            )}

            {activeTab === "logic" && (
              <LogicEngine analysis={mockPhase2Data.logicAnalysis} />
            )}

            {activeTab === "validation" && (
              <RealityCheck validations={mockPhase2Data.contextValidation} />
            )}

            {activeTab === "entities" && (
              <EntityInference recommendations={mockPhase2Data.normalization} />
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end pt-4 border-t border-border/40">
            <button
              onClick={handleComplete}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate ERP Specification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtifactPreviewCard({ artifact }: { artifact: AnalyzedArtifact }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3.5 border-b border-border/40 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Table2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-foreground">{artifact.name}</h4>
            <p className="text-xs text-muted-foreground">{artifact.fileName} • {artifact.headers.length} columns • {artifact.sampleRows.length} sample rows</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  {artifact.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {artifact.sampleRows.map((row, i) => (
                  <tr key={i} className="border-t border-border/30">
                    {artifact.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap font-mono">
                        {row[h] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border/40 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Formulas Detected ({artifact.formulasFound.length})
              </p>
              <div className="space-y-1">
                {artifact.formulasFound.map((f, i) => (
                  <code key={i} className="block text-[11px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-mono leading-relaxed">
                    {f}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Column Types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(artifact.dataTypes).map(([col, type]) => (
                  <span key={col} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 border border-border text-muted-foreground">
                    <span className="font-semibold text-foreground">{col}</span>: {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
