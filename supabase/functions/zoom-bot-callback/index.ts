import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BOT_CALLBACK_SECRET = Deno.env.get("BOT_CALLBACK_SECRET") || "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Validate callback secret
  const authHeader = req.headers.get("X-Callback-Secret");
  if (authHeader !== BOT_CALLBACK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    meeting_id,
    user_id,
    status,
    transcript,
    speaker_segments,
    word_count,
    duration_seconds,
    error_message,
  } = await req.json();

  if (!meeting_id || !user_id) {
    return new Response(
      JSON.stringify({ message: "Missing meeting_id or user_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (status === "completed" && transcript) {
      // Determine transcript source based on meeting platform
      const { data: meetingRecord } = await supabase
        .from("zoom_meetings")
        .select("platform")
        .eq("id", meeting_id)
        .single();

      const transcriptSource = meetingRecord?.platform === "google_meet"
        ? "google_meet_bot"
        : "live_bot";

      // Store the final transcript
      await supabase.from("transcripts").insert({
        meeting_id,
        user_id,
        content: transcript,
        speaker_segments: speaker_segments || null,
        word_count: word_count || transcript.split(/\s+/).length,
        duration_seconds: duration_seconds || null,
        source: transcriptSource,
      });

      // Update meeting status
      await supabase
        .from("zoom_meetings")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", meeting_id);

      // Optionally trigger notification
      const notifUrl = `${SUPABASE_URL}/functions/v1/send-notification`;
      fetch(notifUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_id,
          type: "transcript_ready",
          meeting_id,
        }),
      }).catch(console.error); // Fire and forget
    } else if (status === "failed") {
      await supabase
        .from("zoom_meetings")
        .update({
          status: "failed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", meeting_id);

      console.error(`Bot failed for meeting ${meeting_id}: ${error_message}`);
    }

    return new Response(
      JSON.stringify({ status: "ok" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Callback processing error:", error);
    return new Response(
      JSON.stringify({ message: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
