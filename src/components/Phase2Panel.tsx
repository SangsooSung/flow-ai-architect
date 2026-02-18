import { useState, useRef } from "react";
import type { ArtifactReference, Phase2Data, AnalyzedArtifact, ValidationResult } from "@/types/project";
import { mockPhase2Data } from "@/data/mockData";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Table2,
  GitBranch,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface Phase2PanelProps {
  artifacts: ArtifactReference[];
  onComplete: (data: Phase2Data) => void;
  processing: boolean;
}

export function Phase2Panel({ artifacts, onComplete, processing }: Phase2PanelProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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
    }, 2500);
  };

  const handleComplete = () => {
    onComplete(mockPhase2Data);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Artifact Analysis</h3>
        <p className="text-sm text-muted-foreground">
          The transcript analysis identified the following files. Upload them to validate and detail the requirements.
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
            <span className="text-sm font-semibold text-emerald-700">Artifact Analysis Complete</span>
          </div>

          {/* Analyzed Artifacts */}
          {mockPhase2Data.artifacts.map((artifact) => (
            <ArtifactAnalysisCard key={artifact.id} artifact={artifact} />
          ))}

          {/* Validation Results */}
          <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">Cross-Reference Validation</h4>
            </div>
            <div className="p-4 space-y-2">
              {mockPhase2Data.validationResults.map((result, i) => (
                <ValidationRow key={i} result={result} />
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
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

function ArtifactAnalysisCard({ artifact }: { artifact: AnalyzedArtifact }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="border border-border/60 rounded-2xl bg-white overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">{artifact.name}</h4>
            <p className="text-xs text-muted-foreground">{artifact.fileName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {showTable ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {showTable && (
        <div className="overflow-x-auto border-b border-border/40">
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
      )}

      <div className="p-4 space-y-3">
        {/* Formulas */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Formulas Detected
          </p>
          <div className="space-y-1">
            {artifact.formulasFound.map((f, i) => (
              <code key={i} className="block text-[11px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-mono leading-relaxed">
                {f}
              </code>
            ))}
          </div>
        </div>

        {/* Relationships */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            Entity Relationships
          </p>
          <div className="space-y-1">
            {artifact.entityRelationships.map((r, i) => (
              <p key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                {r}
              </p>
            ))}
          </div>
        </div>

        {/* Data Types */}
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
    </div>
  );
}

function ValidationRow({ result }: { result: ValidationResult }) {
  const icon =
    result.status === "match" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    ) : result.status === "mismatch" ? (
      <AlertTriangle className="w-4 h-4 text-amber-500" />
    ) : (
      <Info className="w-4 h-4 text-cyan-500" />
    );

  const bg =
    result.status === "match"
      ? "bg-emerald-50/50"
      : result.status === "mismatch"
      ? "bg-amber-50/50"
      : "bg-cyan-50/50";

  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-xl ${bg}`}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{result.field}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
      </div>
    </div>
  );
}
