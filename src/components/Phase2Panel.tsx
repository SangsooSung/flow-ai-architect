import { useState, useRef, useEffect } from "react";
import type { ArtifactReference, Phase2Data, AnalyzedArtifact } from "@/types/project";
import { mockPhase2Data } from "@/data/mockData";
import { SchemaDict } from "./phase2/SchemaDict";
import { LogicEngine } from "./phase2/LogicEngine";
import { RealityCheck } from "./phase2/RealityCheck";
import { EntityInference } from "./phase2/EntityInference";
import { extractSheetNames, extractSheetData, parseCSV } from "@/lib/spreadsheet";
import { toast } from "sonner";
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
  Layers,
  AlertCircle,
  X,
  RefreshCw,
  ArrowLeft,
  Info,
} from "lucide-react";

interface Phase2PanelProps {
  artifacts: ArtifactReference[];
  onComplete: (data: Phase2Data) => void;
  processing: boolean;
  analyzing: boolean;
  onAnalyzingChange: (analyzing: boolean) => void;
  onEditScope: () => void;
  scopeUpdateTrigger: number;
}

type TabKey = "preview" | "schema" | "logic" | "validation" | "entities";

export function Phase2Panel({ artifacts, onComplete, processing, analyzing, onAnalyzingChange, onEditScope, scopeUpdateTrigger }: Phase2PanelProps) {
  const [artifactStates, setArtifactStates] = useState<Record<string, {
    file: File | null;
    fileName: string;
    availableSheets: string[];
    selectedSheet: string | null;
    loading: boolean;
  }>>({});

  const [analyzed, setAnalyzed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("preview");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clean up artifact states when scope changes
  useEffect(() => {
    if (scopeUpdateTrigger > 0) {
      // Get current in-scope artifact IDs
      const inScopeIds = new Set(artifacts.map(a => a.id));

      // Filter artifact states to only keep in-scope artifacts
      setArtifactStates(prev => {
        const filtered: typeof prev = {};
        Object.keys(prev).forEach(id => {
          if (inScopeIds.has(id)) {
            filtered[id] = prev[id];
          }
        });
        return filtered;
      });

      // Reset analyzed flag if any artifacts were removed
      const hadRemovedArtifacts = Object.keys(artifactStates).some(id => !inScopeIds.has(id));
      if (hadRemovedArtifacts && analyzed) {
        setAnalyzed(false);
        toast.info("Scope changed - please re-analyze artifacts");
      }
    }
  }, [scopeUpdateTrigger, artifacts]);

  const handleFileUpload = async (artifactId: string, file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // Set loading state
    setArtifactStates(prev => ({
      ...prev,
      [artifactId]: {
        file,
        fileName: file.name,
        availableSheets: [],
        selectedSheet: null,
        loading: true,
      }
    }));

    try {
      if (fileExt === 'csv') {
        // CSV files don't have sheets
        setArtifactStates(prev => ({
          ...prev,
          [artifactId]: {
            file,
            fileName: file.name,
            availableSheets: ['Sheet1'], // Default sheet name for CSV
            selectedSheet: 'Sheet1',
            loading: false,
          }
        }));
        toast.success(`${file.name} uploaded successfully`);
      } else {
        // Extract sheet names from Excel files
        const sheetNames = await extractSheetNames(file);

        if (sheetNames.length === 0) {
          toast.error('No sheets found in this file');
          setArtifactStates(prev => {
            const newState = { ...prev };
            delete newState[artifactId];
            return newState;
          });
          return;
        }

        setArtifactStates(prev => ({
          ...prev,
          [artifactId]: {
            file,
            fileName: file.name,
            availableSheets: sheetNames,
            selectedSheet: sheetNames.length === 1 ? sheetNames[0] : null,
            loading: false,
          }
        }));

        if (sheetNames.length === 1) {
          toast.success(`${file.name} uploaded - using sheet "${sheetNames[0]}"`);
        } else {
          toast.info(`${file.name} uploaded - please select a sheet`);
        }
      }
    } catch (error) {
      console.error('Failed to process file:', error);
      toast.error('Failed to read spreadsheet file');
      setArtifactStates(prev => {
        const newState = { ...prev };
        delete newState[artifactId];
        return newState;
      });
    }
  };

  const handleSheetSelect = (artifactId: string, sheetName: string) => {
    setArtifactStates(prev => ({
      ...prev,
      [artifactId]: {
        ...prev[artifactId],
        selectedSheet: sheetName,
      }
    }));
    toast.success(`Selected sheet: ${sheetName}`);
  };

  const handleRemoveFile = (artifactId: string) => {
    setArtifactStates(prev => {
      const newState = { ...prev };
      delete newState[artifactId];
      return newState;
    });
    // Reset file input
    if (fileRefs.current[artifactId]) {
      fileRefs.current[artifactId]!.value = '';
    }
    toast.info('File removed');
  };

  const allUploaded = artifacts.every((a) => {
    const state = artifactStates[a.id];
    return state && state.file && state.selectedSheet && !state.loading;
  });

  const handleAnalyze = async () => {
    onAnalyzingChange(true);

    try {
      // Extract data from all selected sheets
      const artifactData = await Promise.all(
        artifacts.map(async (artifact) => {
          const state = artifactStates[artifact.id];
          if (!state || !state.file || !state.selectedSheet) {
            throw new Error(`Missing data for artifact: ${artifact.name}`);
          }

          const fileExt = state.fileName.split('.').pop()?.toLowerCase();
          let sheetData;

          if (fileExt === 'csv') {
            sheetData = await parseCSV(state.file);
          } else {
            sheetData = await extractSheetData(state.file, state.selectedSheet);
          }

          return {
            id: artifact.id,
            name: artifact.name,
            fileName: state.fileName,
            sheetName: state.selectedSheet,
            headers: sheetData.headers,
            sampleRows: sheetData.sampleRows,
          };
        })
      );

      console.log('Extracted artifact data:', artifactData);

      // For now, use mock data but in future this will be sent to AI
      // await analyzeArtifacts(phase1Data, artifactData);

      onAnalyzingChange(false);
      setAnalyzed(true);
      setActiveTab("schema");
      toast.success('Artifacts analyzed successfully');
    } catch (error) {
      console.error('Failed to analyze artifacts:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onAnalyzingChange(false);
    }
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

      {/* Edit Scope Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Need to change which artifacts to include?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              You can go back and modify your project scope at any time. Any uploaded files for artifacts that remain in scope will be preserved.
            </p>
            <button
              onClick={onEditScope}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Edit Project Scope
            </button>
          </div>
        </div>
      </div>

      {/* Artifact Upload Cards */}
      <div className="space-y-3">
        {artifacts.map((artifact) => {
          const state = artifactStates[artifact.id];
          const isFullyConfigured = state && state.file && state.selectedSheet && !state.loading;
          const needsSheetSelection = state && state.file && !state.selectedSheet && state.availableSheets.length > 1;

          return (
            <div
              key={artifact.id}
              className={`border-2 rounded-2xl p-4 transition-all duration-300 ${
                isFullyConfigured
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : needsSheetSelection
                  ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20"
                  : "border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isFullyConfigured
                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                    : needsSheetSelection
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                    : "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                }`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{artifact.name}</h4>
                    {isFullyConfigured && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {needsSheetSelection && <AlertCircle className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{artifact.context}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {artifact.expectedFields.map((field) => (
                      <span key={field} className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border text-muted-foreground font-medium">
                        {field}
                      </span>
                    ))}
                  </div>

                  {!state ? (
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-400 dark:hover:border-amber-600 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload .xlsx or .csv
                      </button>
                    </>
                  ) : state.loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading spreadsheet...</span>
                    </div>
                  ) : isFullyConfigured ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="font-medium">{state.fileName}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(artifact.id)}
                          className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Change
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded">
                        <Layers className="w-3 h-3" />
                        <span>Sheet: <span className="font-semibold">{state.selectedSheet}</span></span>
                      </div>
                    </div>
                  ) : needsSheetSelection ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="font-medium">{state.fileName}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          Select Sheet/Tab:
                        </label>
                        <select
                          value={state.selectedSheet || ''}
                          onChange={(e) => handleSheetSelect(artifact.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border-2 border-indigo-200 dark:border-indigo-800 rounded-lg focus:border-indigo-400 focus:outline-none bg-card"
                        >
                          <option value="">Choose a sheet...</option>
                          {state.availableSheets.map((sheet) => (
                            <option key={sheet} value={sheet}>
                              {sheet}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sheet Preview Section */}
      {allUploaded && !analyzed && !analyzing && (
        <div className="space-y-3 animate-slide-up">
          <div className="border-l-4 border-indigo-500 dark:border-indigo-600 pl-4 py-2">
            <h3 className="text-sm font-bold text-foreground mb-1">Data Preview</h3>
            <p className="text-xs text-muted-foreground">
              Review the selected sheets before analysis
            </p>
          </div>

          <div className="space-y-2">
            {artifacts.map((artifact) => {
              const state = artifactStates[artifact.id];
              if (!state || !state.selectedSheet) return null;

              return (
                <div key={artifact.id} className="border border-border/60 rounded-xl p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Table2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-semibold text-sm text-foreground">{artifact.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3" />
                      {state.fileName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {state.selectedSheet}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {allUploaded && !analyzed && (
        <div className="flex justify-center animate-slide-up">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
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
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Data Logic Technical Report</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-card text-indigo-700 dark:text-indigo-400 shadow-sm"
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
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
    <div className="border border-border/60 rounded-2xl bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3.5 border-b border-border/40 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
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
                  <code key={i} className="block text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-mono leading-relaxed">
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
                  <span key={col} className="text-[11px] px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
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
