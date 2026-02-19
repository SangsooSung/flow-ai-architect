import { Link } from "react-router-dom";
import type { Project } from "@/types/project";
import { Clock, ArrowRight, Check } from "lucide-react";

function PhaseIndicator({ phase, currentPhase, isCompleted }: { phase: number; currentPhase: number; isCompleted: boolean }) {
  const isActive = phase === currentPhase && !isCompleted;

  return (
    <div
      className={`w-2.5 h-2.5 rounded-full transition-all ${
        isCompleted
          ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
          : isActive
          ? "bg-indigo-500 shadow-sm shadow-indigo-500/30 animate-pulse-soft"
          : "bg-gray-200 dark:bg-gray-700"
      }`}
    />
  );
}

const statusColors = {
  draft: "bg-gray-100 dark:bg-gray-800 text-muted-foreground",
  in_progress: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300",
  completed: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
};

const statusLabels = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

interface ProjectCardProps {
  project: Project;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function ProjectCard({ project, isSelectable = false, isSelected = false, onToggleSelect }: ProjectCardProps) {
  const timeAgo = getTimeAgo(project.updatedAt);

  // Check if there are any incomplete phases
  const hasIncompletePhases = !project.phase1 || !project.phase2 || !project.phase3 || !project.phase4;
  const linkTo = hasIncompletePhases ? `/project/${project.id}/edit` : `/project/${project.id}`;

  // Count completed phases
  const completedPhases = [project.phase1, project.phase2, project.phase3, project.phase4].filter(Boolean).length;

  const handleClick = () => {
    if (isSelectable) {
      onToggleSelect?.(project.id);
    }
  };

  const cardClassName = `group block rounded-2xl border bg-card p-5 transition-all duration-300 ${
    isSelectable
      ? isSelected
        ? "border-indigo-500 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10 cursor-pointer"
        : "border-border/60 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer hover:shadow-md"
      : "border-border/60 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5"
  }`;

  const content = (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {isSelectable && (
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                isSelected
                  ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500"
                  : "border-border bg-card"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate transition-colors ${
              isSelectable
                ? "text-foreground"
                : "text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-400"
            }`}>
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{project.clientName}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <PhaseIndicator phase={1} currentPhase={project.currentPhase} isCompleted={!!project.phase1} />
            <PhaseIndicator phase={2} currentPhase={project.currentPhase} isCompleted={!!project.phase2} />
            <PhaseIndicator phase={3} currentPhase={project.currentPhase} isCompleted={!!project.phase3} />
            <PhaseIndicator phase={4} currentPhase={project.currentPhase} isCompleted={!!project.phase4} />
          </div>
          <span className="text-xs text-muted-foreground">
            {completedPhases}/4 completed
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </div>
      </div>

      {!isSelectable && (
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {hasIncompletePhases ? "Continue" : "View Spec"}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      )}
    </div>
  );

  if (isSelectable) {
    return (
      <div onClick={handleClick} className={cardClassName}>
        {content}
      </div>
    );
  }

  return (
    <Link to={linkTo} className={cardClassName}>
      {content}
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
