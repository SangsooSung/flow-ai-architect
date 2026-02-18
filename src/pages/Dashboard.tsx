import { Link } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { StatsCard } from "@/components/StatsCard";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import {
  FolderOpen,
  Clock,
  CheckCircle2,
  FolderPlus,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const { projects, isLoading, error } = useProjectContext();

  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Failed to load projects</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Hero */}
      <div className="mb-8 md:mb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                AI-Powered Scoping
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Architect Dashboard
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-lg">
              Transform meeting transcripts and spreadsheets into developer-ready ERP specifications.
            </p>
          </div>
          <Link
            to="/project/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 self-start md:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-10 animate-slide-up">
        <StatsCard
          label="Total Projects"
          value={projects.length}
          icon={<FolderOpen className="w-5 h-5" />}
          accent="indigo"
        />
        <StatsCard
          label="In Progress"
          value={inProgressCount}
          icon={<Clock className="w-5 h-5" />}
          accent="cyan"
        />
        <StatsCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="emerald"
        />
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="animate-fade-in-delay">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}