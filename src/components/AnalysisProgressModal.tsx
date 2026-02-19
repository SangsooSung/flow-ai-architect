import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressModalProps {
  isOpen: boolean;
  phase: 1 | 2 | 3 | 4;
  title: string;
  message: string;
  percentage: number;
  estimatedTime?: string;
}

export function AnalysisProgressModal({
  isOpen,
  title,
  message,
  percentage,
  estimatedTime = "30-60 seconds"
}: AnalysisProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
        {/* Header with spinner */}
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>

        {/* Progress bar */}
        <Progress value={percentage} className="mb-4 h-2" />

        {/* Status message */}
        <p className="text-sm text-foreground font-medium text-center mb-2">
          {message}
        </p>

        {/* Percentage and estimated time */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage}% complete</span>
          <span>Typically takes {estimatedTime}</span>
        </div>
      </div>
    </div>
  );
}
