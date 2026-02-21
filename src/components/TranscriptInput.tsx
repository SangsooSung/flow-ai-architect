import { useState, useRef, useEffect } from "react";
import { Upload, FileText, X, Sparkles, Loader2, Video, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MeetingStatus } from "./MeetingStatus";
import type { ZoomMeetingRow, TranscriptRow } from "@/types/database";

interface TranscriptInputProps {
  onAnalyze: (transcript: string) => void;
  processing: boolean;
  initialTranscript?: string;
  initialMeetingId?: string;
}

type TabId = "paste" | "zoom" | "live";

export function TranscriptInput({ onAnalyze, processing, initialTranscript, initialMeetingId }: TranscriptInputProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>(initialTranscript ? "paste" : "paste");
  const [transcript, setTranscript] = useState(initialTranscript || "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Zoom tab state
  const [recentMeetings, setRecentMeetings] = useState<ZoomMeetingRow[]>([]);
  const [meetingTranscripts, setMeetingTranscripts] = useState<Map<string, TranscriptRow>>(new Map());
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  // Live bot tab state
  const [meetingUrl, setMeetingUrl] = useState("");
  const [launchingBot, setLaunchingBot] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(initialMeetingId || null);

  // Populate initial transcript if provided
  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  // Fetch recent completed meetings when Zoom tab is opened
  useEffect(() => {
    if (activeTab === "zoom" && user) {
      fetchRecentMeetings();
    }
  }, [activeTab, user]);

  const fetchRecentMeetings = async () => {
    if (!user) return;
    setLoadingMeetings(true);

    const { data: meetings } = await supabase
      .from("zoom_meetings")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (meetings && meetings.length > 0) {
      setRecentMeetings(meetings);

      const { data: transcripts } = await supabase
        .from("transcripts")
        .select("*")
        .in("meeting_id", meetings.map((m) => m.id));

      if (transcripts) {
        const map = new Map<string, TranscriptRow>();
        transcripts.forEach((t) => map.set(t.meeting_id, t));
        setMeetingTranscripts(map);
      }
    }

    setLoadingMeetings(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setTranscript(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setFileName(null);
    setTranscript("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSelectZoomTranscript = (meetingId: string) => {
    const t = meetingTranscripts.get(meetingId);
    if (t) {
      setTranscript(t.content);
      setActiveTab("paste");
    }
  };

  const handleLaunchBot = async () => {
    if (!meetingUrl.trim() || !user) return;

    const zoomUrlPattern = /https:\/\/[\w.-]+\.zoom\.us\/j\/\d+/;
    const gmeetUrlPattern = /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
    if (!zoomUrlPattern.test(meetingUrl) && !gmeetUrlPattern.test(meetingUrl)) {
      return;
    }

    setLaunchingBot(true);
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

      if (!response.ok) throw new Error("Failed to launch bot");

      const { meeting_id } = await response.json();
      setActiveMeetingId(meeting_id);
      setMeetingUrl("");
    } catch {
      // Error handled silently - user sees the UI state
    } finally {
      setLaunchingBot(false);
    }
  };

  const handleTranscriptReady = (content: string) => {
    setTranscript(content);
    setActiveTab("paste");
    setActiveMeetingId(null);
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "paste", label: "Paste / Upload", icon: FileText },
    { id: "zoom", label: "From Meetings", icon: Video },
    { id: "live", label: "Live Bot", icon: Send },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Meeting Transcript</h3>
        <p className="text-sm text-muted-foreground">
          Provide a meeting transcript to begin AI-powered requirements analysis.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "paste" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Paste your meeting transcript below or upload a text file. Use speaker tags like{" "}
            <code className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono">[Client]</code>{" "}
            and{" "}
            <code className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono">[Flow_Engineer]</code>.
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
              dragOver
                ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                : "border-border hover:border-indigo-300 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20"
            }`}
          >
            {fileName && (
              <div className="flex items-center gap-2 px-4 pt-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-sm">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium">{fileName}</span>
                  <button onClick={clearFile} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`[Flow_Engineer]: Thanks for joining today. Let's walk through your current process.\n\n[Client]: Sure. Right now, we manage everything through spreadsheets...`}
              className="w-full min-h-[280px] md:min-h-[360px] p-4 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none rounded-2xl"
            />

            {!transcript && !fileName && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop a .txt or .md file here</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.vtt"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>

            <button
              onClick={() => onAnalyze(transcript)}
              disabled={!transcript.trim() || processing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none sm:ml-auto"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Transcript
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === "zoom" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select a transcript from a recent Zoom meeting to use for analysis.
          </p>

          {loadingMeetings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No Zoom transcripts available</p>
              <p className="text-xs text-muted-foreground">
                Connect your Zoom account and record a meeting to see transcripts here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentMeetings.map((meeting) => {
                const t = meetingTranscripts.get(meeting.id);
                return (
                  <button
                    key={meeting.id}
                    onClick={() => handleSelectZoomTranscript(meeting.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-border bg-card hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {meeting.topic || "Zoom Meeting"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.created_at).toLocaleDateString()} &middot;{" "}
                        {t?.word_count ? `${t.word_count} words` : "Transcript available"}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-indigo-500 ml-3 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "live" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter a Zoom or Google Meet URL to send an AI bot that joins, records, and transcribes the meeting in real-time.
          </p>

          {activeMeetingId ? (
            <MeetingStatus
              meetingId={activeMeetingId}
              onTranscriptReady={handleTranscriptReady}
              onStopBot={() => setActiveMeetingId(null)}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button
                  onClick={handleLaunchBot}
                  disabled={!meetingUrl.trim() || launchingBot}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {launchingBot ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {launchingBot ? "Sending..." : "Send Bot"}
                </button>
              </div>

              <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  The bot will appear as "AI Architect Bot" in the meeting participant list.
                  For Zoom meetings, all participants will see a recording consent prompt.
                  For Google Meet, the bot will be visible as a participant.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
