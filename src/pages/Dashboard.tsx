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
  Trash2,
  CheckSquare,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { projects, isLoading, error, deleteProject } = useProjectContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map(p => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      // Delete all selected projects
      await Promise.all(Array.from(selectedIds).map(id => deleteProject(id)));

      toast.success(`Successfully deleted ${selectedIds.size} project(s)`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to delete some projects");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

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
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-rose-500 dark:text-rose-400" />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Projects</h2>
            {selectedIds.size === 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/60 transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                Select
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelectable={selectedIds.size > 0}
                isSelected={selectedIds.has(project.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selection Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-card border-2 border-border rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-foreground">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="h-6 w-px bg-border" />

            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === projects.length ? "Deselect All" : "Select All"}
            </button>

            <button
              onClick={handleClearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>

            <div className="h-6 w-px bg-border" />

            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-up border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete {selectedIds.size} Project{selectedIds.size > 1 ? 's' : ''}?</h3>
            </div>

            <p className="text-sm text-foreground mb-2">
              Are you sure you want to delete <strong>{selectedIds.size} project{selectedIds.size > 1 ? 's' : ''}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete all project data including Phase 1-4 analysis, PRD, and implementation prompts. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedIds.size > 1 ? 'All' : 'Project'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}