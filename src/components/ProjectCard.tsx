import { Link } from "react-router-dom";
import type { Project } from "@/types/project";
import { Clock, ArrowRight } from "lucide-react";

function PhaseIndicator({ phase, currentPhase }: { phase: number; currentPhase: number }) {
  const isCompleted = phase < currentPhase;
  const isActive = phase === currentPhase;

  return (
    <div
      className={`w-2.5 h-2.5 rounded-full transition-all ${
        isCompleted
          ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
          : isActive
          ? "bg-indigo-500 shadow-sm shadow-indigo-500/30 animate-pulse-soft"
          : "bg-gray-200"
      }`}
    />
  );
}

const statusColors = {
  draft: "bg-gray-100 text-gray-600",
  in_progress: "bg-indigo-50 text-indigo-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const statusLabels = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

export function ProjectCard({ project }: { project: Project }) {
  const timeAgo = getTimeAgo(project.updatedAt);

  return (
    <Link
      to={`/project/${project.id}`}
      className="group block rounded-2xl border border-border/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-indigo-700 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{project.clientName}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((phase) => (
              <PhaseIndicator key={phase} phase={phase} currentPhase={project.currentPhase} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Phase {project.currentPhase}/3
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {project.status === "completed" ? "View Spec" : "Continue"}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
