import { useState, useRef } from "react";
import { Upload, FileText, X, Sparkles, Loader2, Mic, ListVideo } from "lucide-react";
import { AudioTranscriptInput, type AudioUploadOptions } from "./AudioTranscriptInput";
import { TranscriptSelector } from "./TranscriptSelector";
import { uploadAudio, checkTranscriptionStatus, getTranscript } from "@/services/transcribe";
import { toast } from "sonner";

type InputTab = "paste" | "upload" | "meetings";

interface TranscriptInputProps {
  onAnalyze: (transcript: string, meetingId?: string) => void;
  processing: boolean;
  initialTranscript?: string;
}

export function TranscriptInput({ onAnalyze, processing, initialTranscript }: TranscriptInputProps) {
  const [activeTab, setActiveTab] = useState<InputTab>("paste");
  const [transcript, setTranscript] = useState(initialTranscript || "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleAudioUpload = async (file: File, options: AudioUploadOptions) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadAudio(
        file,
        {
          piiRedaction: options.piiRedaction,
          customVocabulary: options.customVocabulary,
        },
        (progress) => setUploadProgress(progress)
      );

      toast.success("Upload complete, starting transcription...");

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await checkTranscriptionStatus(response.meeting_id);

          if (status.status === "completed") {
            clearInterval(pollInterval);

            // Get the transcript
            const transcriptData = await getTranscript(response.meeting_id);
            if (transcriptData) {
              setTranscript(transcriptData.content);
              setActiveTab("paste");
              toast.success("Transcription complete!");
            }
            setUploading(false);
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            toast.error(status.error || "Transcription failed");
            setUploading(false);
          }
        } catch (err) {
          console.error("Failed to check status:", err);
        }
      }, 5000);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleMeetingSelect = (transcriptContent: string, meetingId: string) => {
    setTranscript(transcriptContent);
    setActiveTab("paste");
    toast.success("Transcript loaded from meeting");
  };

  const tabs = [
    { id: "paste" as const, label: "Paste Text", icon: FileText },
    { id: "upload" as const, label: "Upload Audio", icon: Mic },
    { id: "meetings" as const, label: "From Meetings", icon: ListVideo },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Meeting Transcript</h3>
        <p className="text-sm text-muted-foreground">
          Provide a meeting transcript to analyze. Paste text, upload an audio file, or select from previous meetings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Paste Text Tab */}
        {activeTab === "paste" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use speaker tags like{" "}
              <code className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">[Client]</code>{" "}
              and{" "}
              <code className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">[Flow_Engineer]</code>.
            </p>

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

        {/* Upload Audio Tab */}
        {activeTab === "upload" && (
          <AudioTranscriptInput
            onUpload={handleAudioUpload}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        )}

        {/* Select from Meetings Tab */}
        {activeTab === "meetings" && (
          <TranscriptSelector
            onSelect={handleMeetingSelect}
            onCancel={() => setActiveTab("paste")}
          />
        )}
      </div>
    </div>
  );
}
