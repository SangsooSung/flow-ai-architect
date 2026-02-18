import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { PhaseStepper } from "@/components/PhaseStepper";
import { Phase1Output } from "@/components/Phase1Output";
import { Phase3Panel } from "@/components/Phase3Panel";
import {
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  FileText,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, deleteProject } = useProjectContext();
  const [activeTab, setActiveTab] = useState<"overview" | "phase1" | "phase2" | "phase3">("overview");

  const project = id ? getProject(id) : null;

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

  const handleDelete = () => {
    deleteProject(project.id);
    toast.success("Project deleted");
    navigate("/");
  };

  const completedPhases = [];
  if (project.phase1) completedPhases.push(1);
  if (project.phase2) completedPhases.push(2);
  if (project.phase3) completedPhases.push(3);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: Layers },
    ...(project.phase1 ? [{ key: "phase1" as const, label: "Phase 1", icon: FileText }] : []),
    ...(project.phase3 ? [{ key: "phase3" as const, label: "Final PRD", icon: CheckCircle2 }] : []),
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50 transition-all self-start"
          >
            <Trash2 className="w-4 h-4" />
            Delete
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
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
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
              detail={project.phase2 ? `${project.phase2.artifacts.length} artifacts analyzed` : "Not started"}
            />
            <StatusCard
              title="Phase 3: ERP Synthesis"
              completed={!!project.phase3}
              detail={project.phase3 ? `${project.phase3.confidence}% confidence` : "Not started"}
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
        </div>
      )}

      {activeTab === "phase1" && project.phase1 && (
        <Phase1Output data={project.phase1} />
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
