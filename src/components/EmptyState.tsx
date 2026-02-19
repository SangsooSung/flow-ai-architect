import { Link } from "react-router-dom";
import { FolderPlus, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-cyan-100 dark:from-indigo-900/50 dark:to-cyan-900/50 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10">
        <Sparkles className="w-9 h-9 text-indigo-500 dark:text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        No projects yet
      </h3>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
        Start by creating a new project. Upload a meeting transcript and let AI extract your requirements automatically.
      </p>
      <Link
        to="/project/new"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5"
      >
        <FolderPlus className="w-4 h-4" />
        Create First Project
      </Link>
    </div>
  );
}
