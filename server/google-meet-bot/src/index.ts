import { MeetClient } from "./meet-client";
import { TranscribeStream } from "./transcribe-stream";
import { DiarizationFormatter } from "./diarization";
import { CallbackClient } from "./callback";
import http from "http";

// Configuration from environment variables
const MEETING_URL = process.env.MEETING_URL || "";
const MEETING_ID = process.env.MEETING_ID || "";
const USER_ID = process.env.USER_ID || "";
const CALLBACK_URL = process.env.CALLBACK_URL || "";
const MAX_RUNTIME_MS = parseInt(process.env.MAX_RUNTIME_MS || "14400000", 10); // 4 hours

if (!MEETING_URL || !MEETING_ID || !USER_ID || !CALLBACK_URL) {
  console.error("Missing required environment variables: MEETING_URL, MEETING_ID, USER_ID, CALLBACK_URL");
  process.exit(1);
}

const callbackClient = new CallbackClient(CALLBACK_URL, MEETING_ID, USER_ID);
const diarization = new DiarizationFormatter();

let transcribeStream: TranscribeStream | null = null;
let meetClient: MeetClient | null = null;
let isShuttingDown = false;

// Health check server
const healthServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", meetingId: MEETING_ID }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(8080, () => {
  console.log("Health check server listening on port 8080");
});

async function main() {
  console.log(`Starting Google Meet Bot for meeting: ${MEETING_URL}`);
  console.log(`Meeting ID: ${MEETING_ID}, User ID: ${USER_ID}`);

  // Set maximum runtime timer
  const runtimeTimer = setTimeout(async () => {
    console.log("Maximum runtime reached (4 hours). Shutting down...");
    await shutdown("max_runtime");
  }, MAX_RUNTIME_MS);

  // Warn at 3h45m
  setTimeout(() => {
    console.log("WARNING: 15 minutes remaining before auto-disconnect");
  }, MAX_RUNTIME_MS - 15 * 60 * 1000);

  try {
    // Initialize Amazon Transcribe streaming
    transcribeStream = new TranscribeStream({
      region: process.env.AWS_REGION || "us-east-1",
      languageCode: "en-US",
      mediaSampleRateHertz: 16000,
      mediaEncoding: "pcm",
      showSpeakerLabel: true,
    });

    transcribeStream.onTranscript((segment) => {
      diarization.addSegment(segment);
      console.log(`[${segment.speaker}]: ${segment.text}`);
    });

    // Initialize Google Meet client (Puppeteer-based)
    meetClient = new MeetClient({
      botName: "AI Architect Bot",
      googleEmail: process.env.GOOGLE_BOT_EMAIL,
      googlePassword: process.env.GOOGLE_BOT_PASSWORD,
    });

    meetClient.onAudioData((audioChunk: Buffer) => {
      if (transcribeStream) {
        transcribeStream.sendAudio(audioChunk);
      }
    });

    meetClient.onMeetingEnd(async () => {
      console.log("Meeting ended");
      await shutdown("meeting_ended");
    });

    meetClient.onError(async (error: Error) => {
      console.error("Meet client error:", error);
      await shutdown("error", error.message);
    });

    meetClient.onBotRejected(async () => {
      console.log("Bot was rejected/removed by host");
      await shutdown("rejected", "Bot was denied access by the meeting host");
    });

    // Join the meeting
    await meetClient.joinMeeting(MEETING_URL);
    console.log("Successfully joined meeting");

    // Start transcription stream
    await transcribeStream.start();
    console.log("Transcription started");
  } catch (error) {
    console.error("Failed to start bot:", error);
    await shutdown("error", error instanceof Error ? error.message : "Unknown error");
    clearTimeout(runtimeTimer);
  }
}

async function shutdown(reason: string, errorMessage?: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Shutting down bot. Reason: ${reason}`);

  try {
    // Stop transcription
    if (transcribeStream) {
      await transcribeStream.stop();
    }

    // Leave meeting
    if (meetClient) {
      await meetClient.leaveMeeting();
    }

    // Format final transcript
    const transcript = diarization.getFormattedTranscript();
    const segments = diarization.getSegments();
    const wordCount = transcript.split(/\s+/).length;

    // Send callback
    if (reason === "error" || reason === "rejected") {
      await callbackClient.sendFailure(errorMessage || reason);
    } else {
      await callbackClient.sendSuccess({
        transcript,
        speakerSegments: segments,
        wordCount,
        durationSeconds: diarization.getDurationSeconds(),
      });
    }
  } catch (error) {
    console.error("Shutdown error:", error);
    try {
      await callbackClient.sendFailure(`Shutdown error: ${error}`);
    } catch {
      // Last resort - nothing we can do
    }
  } finally {
    healthServer.close();
    process.exit(0);
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", () => shutdown("sigterm"));
process.on("SIGINT", () => shutdown("sigint"));

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await shutdown("fatal", err instanceof Error ? err.message : "Fatal error");
});
