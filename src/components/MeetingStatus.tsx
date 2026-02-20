import { useEffect, useState } from "react";
import { Video, Users, Clock, FileText, Square, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ZoomMeetingRow } from "@/types/database";

interface MeetingStatusProps {
  meetingId: string;
  onTranscriptReady?: (content: string) => void;
  onStopBot?: () => void;
}

export function MeetingStatus({ meetingId, onTranscriptReady, onStopBot }: MeetingStatusProps) {
  const [meeting, setMeeting] = useState<ZoomMeetingRow | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Fetch initial meeting state
    async function fetchMeeting() {
      const { data } = await supabase
        .from("zoom_meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

      if (data) setMeeting(data);
    }

    fetchMeeting();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on<ZoomMeetingRow>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "zoom_meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          setMeeting(payload.new);

          if (payload.new.status === "completed") {
            // Fetch transcript
            supabase
              .from("transcripts")
              .select("content, word_count")
              .eq("meeting_id", meetingId)
              .single()
              .then(({ data }) => {
                if (data) {
                  setWordCount(data.word_count || 0);
                  onTranscriptReady?.(data.content);
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, onTranscriptReady]);

  // Timer for in-progress meetings
  useEffect(() => {
    if (!meeting?.started_at || meeting.status !== "in_progress") return;

    const startTime = new Date(meeting.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [meeting?.started_at, meeting?.status]);

  if (!meeting) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border-2 border-border">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading meeting status...</span>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusMessages: Record<string, string> = {
    scheduled: "Waiting to join...",
    bot_joining: "Bot is joining the meeting...",
    in_progress: "Recording in progress",
    processing: "Processing transcript...",
    completed: "Transcript ready",
    failed: "Bot failed to join or was removed",
  };

  const isActive = meeting.status === "in_progress" || meeting.status === "bot_joining";

  return (
    <div className={`rounded-xl border-2 p-4 ${
      isActive
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
        : meeting.status === "failed"
        ? "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
        : meeting.status === "completed"
        ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20"
        : "border-border"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
          <span className="text-sm font-medium text-foreground">
            {meeting.topic || "Zoom Meeting"}
          </span>
        </div>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {statusMessages[meeting.status]}
      </p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {meeting.status === "in_progress" && (
          <>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(elapsed)}
            </span>
            {wordCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {wordCount} words
              </span>
            )}
          </>
        )}
      </div>

      {isActive && onStopBot && (
        <button
          onClick={onStopBot}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
        >
          <Square className="w-3 h-3" />
          Stop Bot
        </button>
      )}
    </div>
  );
}
