import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const ZOOM_WEBHOOK_SECRET_TOKEN = Deno.env.get("ZOOM_WEBHOOK_SECRET_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const payload = JSON.parse(body);

  // Handle Zoom webhook validation (CRC challenge)
  if (payload.event === "endpoint.url_validation") {
    const hashForValidate = await hmacSha256(
      ZOOM_WEBHOOK_SECRET_TOKEN,
      payload.payload.plainToken
    );
    return new Response(
      JSON.stringify({
        plainToken: payload.payload.plainToken,
        encryptedToken: hashForValidate,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate webhook signature
  const signature = req.headers.get("x-zm-signature") || "";
  const timestamp = req.headers.get("x-zm-request-timestamp") || "";
  const message = `v0:${timestamp}:${body}`;
  const expectedSignature = `v0=${await hmacSha256(ZOOM_WEBHOOK_SECRET_TOKEN, message)}`;

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (payload.event) {
      case "meeting.started": {
        const meetingId = String(payload.payload.object.id);
        await supabase
          .from("zoom_meetings")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("zoom_meeting_id", meetingId);
        break;
      }

      case "meeting.ended": {
        const meetingId = String(payload.payload.object.id);
        await supabase
          .from("zoom_meetings")
          .update({ status: "processing", ended_at: new Date().toISOString() })
          .eq("zoom_meeting_id", meetingId);
        break;
      }

      case "recording.completed": {
        const meetingId = String(payload.payload.object.id);
        const recordingFiles = payload.payload.object.recording_files || [];
        const topic = payload.payload.object.topic || "Zoom Meeting";

        // Find transcript file (VTT or transcript)
        const transcriptFile = recordingFiles.find(
          (f: { file_type: string }) =>
            f.file_type === "TRANSCRIPT" || f.file_type === "CC"
        );

        if (!transcriptFile) {
          console.log("No transcript file in recording");
          break;
        }

        // Find the meeting record
        const { data: meeting } = await supabase
          .from("zoom_meetings")
          .select("*")
          .eq("zoom_meeting_id", meetingId)
          .single();

        if (!meeting) {
          // Create a meeting record if it doesn't exist (webhook-only flow)
          // We need the user_id from the zoom_connection
          const accountId = payload.payload.object.host_id;
          const { data: connection } = await supabase
            .from("zoom_connections")
            .select("user_id")
            .eq("zoom_account_id", accountId)
            .single();

          if (!connection) {
            console.log("No matching zoom connection for account:", accountId);
            break;
          }

          const { data: newMeeting } = await supabase
            .from("zoom_meetings")
            .insert({
              user_id: connection.user_id,
              zoom_meeting_id: meetingId,
              topic,
              status: "processing",
              ended_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (newMeeting) {
            await processTranscript(supabase, newMeeting, transcriptFile);
          }
        } else {
          await processTranscript(supabase, meeting, transcriptFile);
        }

        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function processTranscript(
  supabase: ReturnType<typeof createClient>,
  meeting: { id: string; user_id: string },
  transcriptFile: { download_url: string; download_token?: string }
) {
  // Download the transcript file from Zoom
  const downloadUrl = transcriptFile.download_url;
  const headers: Record<string, string> = {};
  if (transcriptFile.download_token) {
    headers["Authorization"] = `Bearer ${transcriptFile.download_token}`;
  }

  const response = await fetch(downloadUrl, { headers });
  const rawTranscript = await response.text();

  // Format VTT transcript with speaker tags
  const formatted = formatVttTranscript(rawTranscript);
  const wordCount = formatted.split(/\s+/).length;

  // Store transcript
  await supabase.from("transcripts").insert({
    meeting_id: meeting.id,
    user_id: meeting.user_id,
    content: formatted,
    word_count: wordCount,
    source: "zoom_recording",
  });

  // Update meeting status
  await supabase
    .from("zoom_meetings")
    .update({ status: "completed" })
    .eq("id", meeting.id);
}

function formatVttTranscript(vtt: string): string {
  const lines = vtt.split("\n");
  const segments: string[] = [];
  let currentSpeaker = "";

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip VTT header, timestamps, and empty lines
    if (
      trimmed === "WEBVTT" ||
      trimmed === "" ||
      /^\d+$/.test(trimmed) ||
      /^\d{2}:\d{2}/.test(trimmed)
    ) {
      continue;
    }

    // Check for speaker tag pattern: "Speaker Name: text"
    const speakerMatch = trimmed.match(/^(.+?):\s*(.+)$/);
    if (speakerMatch) {
      const speaker = speakerMatch[1].trim();
      const text = speakerMatch[2].trim();

      if (speaker !== currentSpeaker) {
        currentSpeaker = speaker;
        segments.push(`\n[${speaker}]: ${text}`);
      } else {
        segments.push(text);
      }
    } else if (trimmed.length > 0) {
      segments.push(trimmed);
    }
  }

  return segments.join(" ").trim();
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
