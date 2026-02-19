import { useState, useRef } from "react";
import { Upload, FileText, X, Sparkles, Loader2 } from "lucide-react";

interface TranscriptInputProps {
  onAnalyze: (transcript: string) => void;
  processing: boolean;
}

export function TranscriptInput({ onAnalyze, processing }: TranscriptInputProps) {
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Meeting Transcript</h3>
        <p className="text-sm text-muted-foreground">
          Paste your meeting transcript below or upload a text file. Use speaker tags like{" "}
          <code className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">[Client]</code>{" "}
          and{" "}
          <code className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">[Flow_Engineer]</code>.
        </p>
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
  );
}
