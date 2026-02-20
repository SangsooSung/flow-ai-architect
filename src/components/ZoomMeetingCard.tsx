import { Video, Clock, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import type { ZoomMeetingRow } from "@/types/database";

interface ZoomMeetingCardProps {
  meeting: ZoomMeetingRow;
  transcriptAvailable: boolean;
  onSelectTranscript?: () => void;
  onLinkToProject?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  scheduled: { label: "Scheduled", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400", icon: Clock },
  bot_joining: { label: "Bot Joining", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400", icon: Loader2 },
  in_progress: { label: "In Progress", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400", icon: Video },
  processing: { label: "Processing", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400", icon: Loader2 },
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400", icon: AlertCircle },
};

export function ZoomMeetingCard({
  meeting,
  transcriptAvailable,
  onSelectTranscript,
  onLinkToProject,
}: ZoomMeetingCardProps) {
  const config = statusConfig[meeting.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;
  const isAnimating = meeting.status === "bot_joining" || meeting.status === "processing";

  const duration = meeting.started_at && meeting.ended_at
    ? Math.round(
        (new Date(meeting.ended_at).getTime() - new Date(meeting.started_at).getTime()) / 60000
      )
    : null;

  return (
    <div className="border-2 border-border rounded-2xl p-4 bg-card hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {meeting.topic || "Zoom Meeting"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(meeting.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${isAnimating ? "animate-spin" : ""}`} />
          {config.label}
        </span>
      </div>

      {duration !== null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>{duration} min</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {transcriptAvailable && onSelectTranscript && (
          <button
            onClick={onSelectTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Use Transcript
          </button>
        )}
        {!meeting.project_id && onLinkToProject && (
          <button
            onClick={onLinkToProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 rounded-lg hover:bg-muted transition-colors"
          >
            Link to Project
          </button>
        )}
      </div>
    </div>
  );
}
