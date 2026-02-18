import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { PhaseStepper } from "@/components/PhaseStepper";
import { Phase1Output } from "@/components/Phase1Output";
import { Phase3Panel } from "@/components/Phase3Panel";
import { SchemaDict } from "@/components/phase2/SchemaDict";
import { LogicEngine } from "@/components/phase2/LogicEngine";
import { RealityCheck } from "@/components/phase2/RealityCheck";
import { EntityInference } from "@/components/phase2/EntityInference";
import {
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  FileText,
  Layers,
  CheckCircle2,
  Database,
  Zap,
  ShieldCheck,
  GitBranch,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, deleteProject, isLoading } = useProjectContext();
  const [activeTab, setActiveTab] = useState<"overview" | "phase1" | "phase2" | "phase3">("overview");
  const [phase2SubTab, setPhase2SubTab] = useState<"schema" | "logic" | "validation" | "entities">("schema");
  const [deleting, setDeleting] = useState(false);

  const project = id ? getProject(id) : null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Project Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">This project doesn't exist or has been deleted.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
      setDeleting(false);
    }
  };

  const completedPhases = [];
  if (project.phase1) completedPhases.push(1);
  if (project.phase2) completedPhases.push(2);
  if (project.phase3) completedPhases.push(3);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: Layers },
    ...(project.phase1 ? [{ key: "phase1" as const, label: "Phase 1: Context", icon: FileText }] : []),
    ...(project.phase2 ? [{ key: "phase2" as const, label: "Phase 2: Analysis", icon: Database }] : []),
    ...(project.phase3 ? [{ key: "phase3" as const, label: "Phase 3: PRD", icon: CheckCircle2 }] : []),
  ];

  const phase2Tabs = [
    { key: "schema" as const, label: "Schema", icon: Database },
    { key: "logic" as const, label: "Logic", icon: Zap },
    { key: "validation" as const, label: "Reality Check", icon: ShieldCheck },
    { key: "entities" as const, label: "Entities", icon: GitBranch },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="animate-fade-in">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {project.clientName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50 transition-all self-start disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="mb-8 animate-slide-up">
        <PhaseStepper
          currentPhase={project.currentPhase}
          completedPhases={completedPhases}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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
      {activeTab === "overview" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              title="Phase 1: Meeting Context"
              completed={!!project.phase1}
              detail={project.phase1 ? `${project.phase1.requirements.reduce((a, m) => a + m.requirements.length, 0)} requirements extracted` : "Not started"}
            />
            <StatusCard
              title="Phase 2: Artifact Analysis"
              completed={!!project.phase2}
              detail={project.phase2 ? `${project.phase2.artifacts.length} artifacts, ${project.phase2.schemas.length} schemas` : "Not started"}
            />
            <StatusCard
              title="Phase 3: ERP Synthesis"
              completed={!!project.phase3}
              detail={project.phase3 ? `${project.phase3.confidence}% confidence, ${project.phase3.conflicts.filter(c => c.severity === 'critical').length} critical conflicts` : "Not started"}
            />
          </div>

          {!project.phase1 && (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground mb-4">This project hasn't been started yet.</p>
              <Link
                to="/project/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25"
              >
                Start Analysis
              </Link>
            </div>
          )}

          {project.phase3 && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-800">Project Complete</h4>
              </div>
              <p className="text-sm text-emerald-700">
                The ERP specification has been generated. Review the Phase 3 tab for the full PRD, 
                architecture diagrams, and conflict resolution items.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "phase1" && project.phase1 && (
        <Phase1Output data={project.phase1} />
      )}

      {activeTab === "phase2" && project.phase2 && (
        <div className="space-y-5 animate-fade-in">
          {/* Phase 2 Sub-tabs */}
          <div className="flex items-center gap-1 bg-cyan-50 rounded-xl p-1">
            {phase2Tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPhase2SubTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                  phase2SubTab === tab.key
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-cyan-600 hover:text-cyan-800"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Phase 2 Content */}
          {phase2SubTab === "schema" && (
            <SchemaDict schemas={project.phase2.schemas} />
          )}
          {phase2SubTab === "logic" && (
            <LogicEngine analysis={project.phase2.logicAnalysis} />
          )}
          {phase2SubTab === "validation" && (
            <RealityCheck validations={project.phase2.contextValidation} />
          )}
          {phase2SubTab === "entities" && (
            <EntityInference recommendations={project.phase2.normalization} />
          )}
        </div>
      )}

      {activeTab === "phase3" && project.phase3 && (
        <Phase3Panel data={project.phase3} />
      )}
    </div>
  );
}

function StatusCard({ title, completed, detail }: { title: string; completed: boolean; detail: string }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      completed
        ? "border-emerald-200 bg-emerald-50/30"
        : "border-border/60 bg-white"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
        )}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}