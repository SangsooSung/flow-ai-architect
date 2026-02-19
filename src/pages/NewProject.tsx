import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { PhaseStepper } from "@/components/PhaseStepper";
import { TranscriptInput } from "@/components/TranscriptInput";
import { Phase1Output } from "@/components/Phase1Output";
import { ScopeSelector } from "@/components/ScopeSelector";
import { Phase2Panel } from "@/components/Phase2Panel";
import { Phase3Panel } from "@/components/Phase3Panel";
import { Phase3ProgressDisplay } from "@/components/Phase3ProgressDisplay";
import { Phase4Panel } from "@/components/Phase4Panel";
import { analyzeTranscript, analyzeArtifacts, generatePRD, generateImplementationPrompts } from "@/services/ai";
import { isBedrockConfigured } from "@/lib/bedrock";
import type { Phase1Data, Phase2Data, Phase4Data, TechStackConfig } from "@/types/project";
import { ArrowLeft, ArrowRight, FolderPlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { AnalysisProgressModal } from "@/components/AnalysisProgressModal";

interface NewProjectProps {
  mode: 'new' | 'resume';
}

export default function NewProject({ mode }: NewProjectProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createProject, updatePhase1, updatePhase2, updatePhase3, updatePhase4, getProject } = useProjectContext();

  const [step, setStep] = useState<"setup" | "phases">(mode === 'resume' ? 'phases' : 'setup');
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(id || null);
  const [creating, setCreating] = useState(false);
  const [loadingProject, setLoadingProject] = useState(mode === 'resume');

  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4>(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showingScopeSelector, setShowingScopeSelector] = useState(false);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [scopeUpdateTrigger, setScopeUpdateTrigger] = useState(0);

  const [phase1Data, setPhase1Data] = useState<Phase1Data | null>(null);
  const [phase2Data, setPhase2Data] = useState<Phase2Data | null>(null);
  const [phase3Data, setPhase3Data] = useState<Phase2Data | null>(null);
  const [phase4Data, setPhase4Data] = useState<Phase4Data | null>(null);
  const [selectedTechStack, setSelectedTechStack] = useState<TechStackConfig | undefined>(undefined);

  // Track completion states for progress bars
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [phase3Complete, setPhase3Complete] = useState(false);
  const [phase4Complete, setPhase4Complete] = useState(false);

  // Progress tracking for each phase
  const phase1Progress = useAnalysisProgress(
    1,
    processing && currentPhase === 1 && !phase1Data,
    phase1Complete
  );
  const phase2Progress = useAnalysisProgress(2, analyzing);
  const phase3Progress = useAnalysisProgress(
    3,
    processing && currentPhase === 3 && !phase3Data,
    phase3Complete
  );
  const phase4Progress = useAnalysisProgress(
    4,
    processing && currentPhase === 4 && !phase4Data,
    phase4Complete
  );

  // Load project when in resume mode
  useEffect(() => {
    if (mode === 'resume' && id) {
      const project = getProject(id);

      if (!project) {
        toast.error('Project not found');
        navigate('/');
        return;
      }

      // Initialize state from project
      setProjectName(project.name);
      setClientName(project.clientName);
      setProjectId(project.id);

      // Load phase data
      if (project.phase1) {
        setPhase1Data(project.phase1);
        setCompletedPhases(prev => [...new Set([...prev, 1])]);
      }

      if (project.phase2) {
        setPhase2Data(project.phase2);
        setCompletedPhases(prev => [...new Set([...prev, 2])]);
      }

      if (project.phase3) {
        setPhase3Data(project.phase3);
        setCompletedPhases(prev => [...new Set([...prev, 3])]);
      }

      if (project.phase4) {
        setPhase4Data(project.phase4);
        setCompletedPhases(prev => [...new Set([...prev, 4])]);
      }

      // Determine which phase to show
      if (project.phase4) {
        // Phase 4 complete - show results
        setCurrentPhase(4);
      } else if (project.phase3) {
        // Phase 3 complete - show results
        setCurrentPhase(3);
      } else if (project.phase2 && project.phase1) {
        // Phase 2 complete - trigger Phase 3 generation
        setCurrentPhase(3);
        setLoadingProject(false);
        setStep('phases');
        toast.success(`Resuming: ${project.name}`);

        // Auto-generate Phase 3 after state is set
        setTimeout(async () => {
          setProcessing(true);
          setPhase3Complete(false);
          try {
            const p3Data = await generatePRD(project.phase1!, project.phase2);

            // Signal completion - show 100% progress
            setPhase3Complete(true);

            // Wait 500ms to show 100% before dismissing modal
            await new Promise(resolve => setTimeout(resolve, 500));

            setPhase3Data(p3Data);

            if (project.id) {
              await updatePhase3(project.id, p3Data);
            }

            setCompletedPhases(prev => [...new Set([...prev, 3])]);
            toast.success("Phase 3 complete: ERP Specification generated!");
          } catch (error) {
            console.error("Failed to generate Phase 3:", error);
            toast.error(`Phase 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setProcessing(false);
            setPhase3Complete(false);
          }
        }, 500);
        return; // Early return to prevent duplicate loading state reset
      } else if (project.phase1) {
        // Phase 1 complete - show Phase 2
        setCurrentPhase(2);
      } else {
        // No phases complete - start from Phase 1
        setCurrentPhase(1);
      }

      setLoadingProject(false);
      setStep('phases');
      toast.success(`Resuming: ${project.name}`);
    }
  }, [mode, id, getProject, navigate, updatePhase3]);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !clientName.trim()) return;
    
    setCreating(true);
    try {
      const project = await createProject(projectName.trim(), clientName.trim());
      setProjectId(project.id);
      setStep("phases");
      toast.success("Project created successfully");
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyzeTranscript = async (_transcript: string) => {
    setProcessing(true);
    setPhase1Complete(false);

    try {
      // Check if AWS Bedrock is configured
      if (!isBedrockConfigured()) {
        toast.warning("AWS Bedrock not configured - using mock data. Configure .env to use real AI.");
      }

      // Call Phase 1 AI (or mock data if not configured)
      const data = await analyzeTranscript(_transcript);

      // Signal completion - show 100% progress
      setPhase1Complete(true);

      // Wait 500ms to show 100% before dismissing modal
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize all modules and artifacts as in-scope by default
      // Include the transcript in the data
      const dataWithScope: Phase1Data = {
        ...data,
        transcript: _transcript,
        requirements: data.requirements.map(mod => ({ ...mod, inScope: true })),
        artifactMapping: data.artifactMapping.map(art => ({ ...art, inScope: true })),
      };

      setPhase1Data(dataWithScope);

      if (projectId) {
        await updatePhase1(projectId, dataWithScope);
      }

      setCompletedPhases((prev) => [...prev, 1]);
      toast.success("Phase 1 complete: Requirements extracted");
    } catch (error) {
      console.error("Failed to analyze transcript:", error);
      toast.error(`Phase 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setPhase1Complete(false);
    }
  };

  const handleScopeConfirmed = async (updatedData: Phase1Data) => {
    setPhase1Data(updatedData);

    if (projectId) {
      await updatePhase1(projectId, updatedData);
    }

    setShowingScopeSelector(false);

    if (isEditingScope) {
      // Return to Phase 2 after editing scope
      setCurrentPhase(2);
      setIsEditingScope(false);
      setScopeUpdateTrigger(prev => prev + 1); // Trigger Phase2Panel to update
      toast.success("Scope updated - artifact list refreshed");
    } else {
      // First time setting scope
      setCurrentPhase(2);
      toast.success("Scope confirmed - ready to upload artifacts");
    }
  };

  const handleEditScope = () => {
    setIsEditingScope(true);
    setCurrentPhase(1);
    setShowingScopeSelector(true);
  };

  const handlePhase2Complete = async (data: Phase2Data) => {
    if (!phase1Data) {
      toast.error("Phase 1 data is missing");
      return;
    }

    setProcessing(true);
    setPhase3Complete(false);

    try {
      // Save Phase 2 data
      setPhase2Data(data);
      if (projectId) {
        await updatePhase2(projectId, data);
      }

      setCompletedPhases((prev) => [...prev, 2]);
      setCurrentPhase(3);
      toast.success("Phase 2 complete: Artifact analysis done");

      // Auto-generate Phase 3 PRD
      try {
        const p3Data = await generatePRD(phase1Data, data);

        // Signal completion - show 100% progress
        setPhase3Complete(true);

        // Wait 500ms to show 100% before dismissing modal
        await new Promise(resolve => setTimeout(resolve, 500));

        setPhase3Data(p3Data);

        if (projectId) {
          await updatePhase3(projectId, p3Data);
        }

        setCompletedPhases((prev) => [...prev, 3]);
        toast.success("Phase 3 complete: ERP Specification generated!");
      } catch (error) {
        console.error("Failed to generate Phase 3:", error);
        toast.error(`Phase 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to complete Phase 2:", error);
      toast.error(`Phase 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setPhase3Complete(false);
    }
  };

  const handleGeneratePhase4 = async () => {
    if (!phase3Data) {
      toast.error("Phase 3 data is missing");
      return;
    }

    setProcessing(true);
    setPhase4Complete(false);
    setCurrentPhase(4); // Switch to Phase 4 to show progress

    try {
      // Check if AWS Bedrock is configured
      if (!isBedrockConfigured()) {
        toast.warning("AWS Bedrock not configured - using mock data. Configure .env to use real AI.");
      }

      const p4Data = await generateImplementationPrompts(phase3Data, selectedTechStack);

      // Signal completion - show 100% progress
      setPhase4Complete(true);

      // Wait 500ms to show 100% before showing results
      await new Promise(resolve => setTimeout(resolve, 500));

      setPhase4Data(p4Data);

      if (projectId) {
        await updatePhase4(projectId, p4Data);
      }

      setCompletedPhases(prev => [...new Set([...prev, 4])]);
      toast.success("Phase 4 complete: Implementation prompts generated!");
    } catch (error) {
      console.error("Failed to generate Phase 4:", error);
      toast.error(`Phase 4 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentPhase(3); // Go back to Phase 3 on error
    } finally {
      setProcessing(false);
    }
  };

  const handleTechStackRegeneration = async () => {
    if (!phase3Data) return;
    await handleGeneratePhase4();
  };

  if (loadingProject) {
    return (
      <div className="max-w-xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-foreground">Loading project...</p>
          <p className="text-xs text-muted-foreground mt-1">Restoring your progress</p>
        </div>
      </div>
    );
  }

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
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !clientName.trim() || creating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-6"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue to Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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

        {currentPhase === 1 && phase1Data && !showingScopeSelector && (
          <div className="space-y-4">
            <Phase1Output data={phase1Data} />
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowingScopeSelector(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
              >
                {completedPhases.includes(1) ? "Edit Project Scope" : "Define Project Scope"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentPhase === 1 && phase1Data && showingScopeSelector && (
          <ScopeSelector
            phase1Data={phase1Data}
            onConfirm={handleScopeConfirmed}
            onBack={() => {
              setShowingScopeSelector(false);
              if (isEditingScope) {
                setCurrentPhase(2);
                setIsEditingScope(false);
              }
            }}
            isEditMode={isEditingScope}
          />
        )}

        {currentPhase === 2 && phase1Data && (
          <Phase2Panel
            artifacts={phase1Data.artifactMapping.filter(art => art.inScope !== false)}
            onComplete={handlePhase2Complete}
            processing={processing}
            analyzing={analyzing}
            onAnalyzingChange={setAnalyzing}
            onEditScope={handleEditScope}
            scopeUpdateTrigger={scopeUpdateTrigger}
          />
        )}

        {currentPhase === 3 && phase3Data && !phase4Data && (
          <div className="space-y-4">
            <Phase3Panel data={phase3Data} />
            <div className="flex justify-end pt-6 border-t border-border">
              <button
                onClick={handleGeneratePhase4}
                disabled={processing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Prompts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Implementation Prompts
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentPhase === 3 && phase3Data && phase4Data && (
          <div className="space-y-4">
            <Phase3Panel data={phase3Data} />
            <div className="flex justify-end pt-6 border-t border-border">
              <button
                onClick={() => setCurrentPhase(4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                View Implementation Prompts
              </button>
            </div>
          </div>
        )}

        {currentPhase === 3 && !phase3Data && (
          <Phase3ProgressDisplay
            message={phase3Progress.message}
            percentage={phase3Progress.percentage}
          />
        )}

        {currentPhase === 4 && !phase4Data && (
          <AnalysisProgressModal
            isOpen={true}
            phase={4}
            title="Generating Implementation Prompts"
            message={phase4Progress.message}
            percentage={phase4Progress.percentage}
            estimatedTime="15-25 seconds"
          />
        )}

        {currentPhase === 4 && phase4Data && (
          <Phase4Panel
            data={phase4Data}
            onTechStackChange={(stack) => setSelectedTechStack(stack)}
            onRegenerate={handleTechStackRegeneration}
          />
        )}
      </div>

      {/* Progress Modals */}
      <AnalysisProgressModal
        isOpen={processing && currentPhase === 1 && !phase1Data}
        phase={1}
        title="Analyzing Transcript"
        message={phase1Progress.message}
        percentage={phase1Progress.percentage}
        estimatedTime="30-60 seconds"
      />

      <AnalysisProgressModal
        isOpen={analyzing}
        phase={2}
        title="Analyzing Artifacts"
        message={phase2Progress.message}
        percentage={phase2Progress.percentage}
        estimatedTime="10-20 seconds"
      />
    </div>
  );
}