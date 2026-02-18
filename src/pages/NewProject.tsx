import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { PhaseStepper } from "@/components/PhaseStepper";
import { TranscriptInput } from "@/components/TranscriptInput";
import { Phase1Output } from "@/components/Phase1Output";
import { Phase2Panel } from "@/components/Phase2Panel";
import { Phase3Panel } from "@/components/Phase3Panel";
import { mockPhase1Data, mockPhase3Data } from "@/data/mockData";
import type { Phase1Data, Phase2Data } from "@/types/project";
import { ArrowLeft, ArrowRight, FolderPlus } from "lucide-react";

export default function NewProject() {
  const navigate = useNavigate();
  const { createProject, updatePhase1, updatePhase2, updatePhase3 } = useProjectContext();

  const [step, setStep] = useState<"setup" | "phases">("setup");
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  const [phase1Data, setPhase1Data] = useState<Phase1Data | null>(null);
  const [phase3Data, setPhase3Data] = useState<typeof mockPhase3Data | null>(null);

  const handleCreateProject = () => {
    if (!projectName.trim() || !clientName.trim()) return;
    const project = createProject(projectName.trim(), clientName.trim());
    setProjectId(project.id);
    setStep("phases");
  };

  const handleAnalyzeTranscript = (_transcript: string) => {
    setProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      const data: Phase1Data = {
        ...mockPhase1Data,
        transcript: _transcript,
      };
      setPhase1Data(data);
      if (projectId) updatePhase1(projectId, data);
      setCompletedPhases((prev) => [...prev, 1]);
      setCurrentPhase(2);
      setProcessing(false);
    }, 3000);
  };

  const handlePhase2Complete = (data: Phase2Data) => {
    setProcessing(true);
    setTimeout(() => {
      if (projectId) updatePhase2(projectId, data);
      setCompletedPhases((prev) => [...prev, 2]);
      setCurrentPhase(3);
      setProcessing(false);

      // Auto-generate Phase 3
      setTimeout(() => {
        const p3Data = { ...mockPhase3Data, generatedAt: new Date().toISOString() };
        setPhase3Data(p3Data);
        if (projectId) updatePhase3(projectId, p3Data);
        setCompletedPhases((prev) => [...prev, 3]);
      }, 2000);
    }, 1500);
  };

  if (step === "setup") {
    return (
      <div className="max-w-xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="animate-fade-in">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up your project details to get started with AI-powered scoping.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Acme Corp Inventory ERP"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !clientName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-6"
            >
              Continue to Analysis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <h1 className="text-xl font-bold text-foreground">{projectName}</h1>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="mb-8 animate-slide-up">
        <PhaseStepper
          currentPhase={currentPhase}
          completedPhases={completedPhases}
          onPhaseClick={(phase) => {
            if (completedPhases.includes(phase) || phase === currentPhase) {
              setCurrentPhase(phase);
            }
          }}
          processing={processing}
        />
      </div>

      {/* Phase Content */}
      <div className="min-h-[400px]">
        {currentPhase === 1 && !phase1Data && (
          <TranscriptInput onAnalyze={handleAnalyzeTranscript} processing={processing} />
        )}

        {currentPhase === 1 && phase1Data && (
          <div className="space-y-4">
            <Phase1Output data={phase1Data} />
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentPhase(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
              >
                Continue to Artifact Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentPhase === 2 && phase1Data && (
          <Phase2Panel
            artifacts={phase1Data.artifactMapping}
            onComplete={handlePhase2Complete}
            processing={processing}
          />
        )}

        {currentPhase === 3 && phase3Data && (
          <Phase3Panel data={phase3Data} />
        )}

        {currentPhase === 3 && !phase3Data && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-semibold text-foreground">Generating ERP Specification...</p>
            <p className="text-xs text-muted-foreground mt-1">Synthesizing transcript and artifact data</p>
          </div>
        )}
      </div>
    </div>
  );
}
