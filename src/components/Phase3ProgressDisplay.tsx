import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface Milestone {
  id: string;
  label: string;
  completedAt: number; // percentage when this milestone is considered complete
}

const PHASE3_MILESTONES: Milestone[] = [
  { id: "synthesis", label: "Synthesizing requirements from transcript and data", completedAt: 10 },
  { id: "architecture", label: "Building database architecture model", completedAt: 30 },
  { id: "flows", label: "Generating user workflows and permissions", completedAt: 60 },
  { id: "migration", label: "Creating migration plan and timeline", completedAt: 85 },
  { id: "finalize", label: "Finalizing specification document", completedAt: 95 }
];

interface Phase3ProgressDisplayProps {
  message: string;
  percentage: number;
}

export function Phase3ProgressDisplay({ message, percentage }: Phase3ProgressDisplayProps) {
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Update completed milestones based on current percentage
    const newCompleted = new Set<string>();
    PHASE3_MILESTONES.forEach(milestone => {
      if (percentage >= milestone.completedAt) {
        newCompleted.add(milestone.id);
      }
    });
    setCompletedMilestones(newCompleted);
  }, [percentage]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 animate-fade-in">
      {/* Header with animated icon */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse-soft">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-lg">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Generating ERP Specification
        </h2>
        <p className="text-sm text-muted-foreground">
          Creating your comprehensive product requirement document
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{message}</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>

      {/* Milestone checklist */}
      <div className="bg-card rounded-2xl border-2 border-border p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Generation Progress</h3>
        </div>

        <div className="space-y-3">
          {PHASE3_MILESTONES.map((milestone, index) => {
            const isCompleted = completedMilestones.has(milestone.id);
            const isCurrent = !isCompleted && (index === 0 || completedMilestones.has(PHASE3_MILESTONES[index - 1].id));

            return (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 transition-all duration-300 ${
                  isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-scale-in" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${
                    isCompleted ? 'text-foreground line-through' :
                    isCurrent ? 'text-foreground font-medium' :
                    'text-muted-foreground'
                  }`}>
                    {milestone.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with time estimate */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Typically takes 15-30 seconds
        </p>
      </div>
    </div>
  );
}
