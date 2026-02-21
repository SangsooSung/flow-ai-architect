import { useEffect, useState } from "react";
import { Video, Users, Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ZoomMeetingCard } from "@/components/ZoomMeetingCard";
import { ZoomConnectButton } from "@/components/ZoomConnectButton";
import type { ZoomMeetingRow, TranscriptRow } from "@/types/database";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Meetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<ZoomMeetingRow[]>([]);
  const [transcripts, setTranscripts] = useState<Map<string, TranscriptRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [launching, setLaunching] = useState(false);

  const fetchMeetings = async () => {
    if (!user) return;

    const { data: meetingsData } = await supabase
      .from("zoom_meetings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (meetingsData) {
      setMeetings(meetingsData);

      // Fetch transcripts for completed meetings
      const completedIds = meetingsData
        .filter((m) => m.status === "completed")
        .map((m) => m.id);

      if (completedIds.length > 0) {
        const { data: transcriptData } = await supabase
          .from("transcripts")
          .select("*")
          .in("meeting_id", completedIds);

        if (transcriptData) {
          const map = new Map<string, TranscriptRow>();
          transcriptData.forEach((t) => map.set(t.meeting_id, t));
          setTranscripts(map);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();

    // Subscribe to real-time meeting updates
    if (!user) return;

    const channel = supabase
      .channel("meetings-list")
      .on<ZoomMeetingRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "zoom_meetings",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLaunchBot = async () => {
    if (!meetingUrl.trim() || !user) return;

    // Validate Zoom or Google Meet URL
    const zoomUrlPattern = /https:\/\/[\w.-]+\.zoom\.us\/j\/\d+/;
    const gmeetUrlPattern = /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
    if (!zoomUrlPattern.test(meetingUrl) && !gmeetUrlPattern.test(meetingUrl)) {
      toast.error("Please enter a valid Zoom or Google Meet URL");
      return;
    }

    setLaunching(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dppjlzxdbsutmjcygitx.supabase.co";
      const response = await fetch(
        `${supabaseUrl}/functions/v1/bot-launch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            meeting_url: meetingUrl,
            user_id: user.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to launch bot");
      }

      toast.success("Bot is joining the meeting");
      setMeetingUrl("");
      setShowManualEntry(false);
      fetchMeetings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to launch bot");
    } finally {
      setLaunching(false);
    }
  };

  const handleUseTranscript = (meetingId: string) => {
    const transcript = transcripts.get(meetingId);
    if (transcript) {
      // Navigate to new project with transcript pre-populated
      navigate("/project/new", { state: { transcript: transcript.content, meetingId } });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
              Meeting Integration
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Meetings
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
            Manage meetings and access transcripts for project analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => fetchMeetings()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-indigo-300 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Send Bot
          </button>
        </div>
      </div>

      {/* Zoom Connection */}
      <div className="mb-6">
        <ZoomConnectButton />
      </div>

      {/* Manual Bot Entry */}
      {showManualEntry && (
        <div className="mb-6 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-3">Send Bot to Meeting</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 transition-all"
            />
            <button
              onClick={handleLaunchBot}
              disabled={!meetingUrl.trim() || launching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {launching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              {launching ? "Launching..." : "Send"}
            </button>
            <button
              onClick={() => {
                setShowManualEntry(false);
                setMeetingUrl("");
              }}
              className="px-3 py-2.5 rounded-xl border-2 border-border text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No meetings yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Send a bot to a Zoom or Google Meet meeting, or connect your Zoom account to capture meeting transcripts automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {meetings.map((meeting) => (
            <ZoomMeetingCard
              key={meeting.id}
              meeting={meeting}
              transcriptAvailable={transcripts.has(meeting.id)}
              onSelectTranscript={() => handleUseTranscript(meeting.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
