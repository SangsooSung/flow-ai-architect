import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Create Bot Edge Function
 *
 * Creates a bot session by calling the AWS Coordinator Lambda.
 * Acts as a secure intermediary - frontend calls this function,
 * this function calls the Coordinator Lambda with proper authentication.
 *
 * POST /functions/v1/create-bot
 * Body: { meeting_topic: string }
 *
 * Returns: { session_id, meeting_id, rtmp_url, stream_key }
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BOT_SECRET = Deno.env.get("BOT_SECRET") || "";
const COORDINATOR_URL = "https://dxer56bxbdhfk6exoufh5yhzcu0obvor.lambda-url.us-east-1.on.aws/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

interface CreateBotRequest {
  meeting_topic: string;
  language?: string; // BCP-47 language code for Whisper transcription
}

interface CoordinatorResponse {
  session_id: string;
  meeting_id: string;
  stream_key: string;
  rtmp_url: string;
  status: string;
  message?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Try to get user from auth header if present, otherwise use demo mode
  let userId: string = "cfea5c41-619c-4f33-9df3-380a3cc5cede"; // Default: demo user
  const authHeader = req.headers.get("Authorization");

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token && token.length > 10) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        console.log("Authenticated user:", userId);
      } else {
        console.log("Auth failed, using demo mode:", authError?.message);
      }
    }
  } else {
    console.log("No auth header, using demo mode");
  }

  // Check BOT_SECRET is configured
  if (!BOT_SECRET) {
    console.error("BOT_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "Bot service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse request body
    const body: CreateBotRequest = await req.json();

    if (!body.meeting_topic) {
      return new Response(
        JSON.stringify({ error: "meeting_topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meetingTopic = body.meeting_topic.trim();
    const language = body.language || "en"; // Default to English if not specified

    // Step 1: Create zoom_meetings record in Supabase
    const { data: meeting, error: meetingError } = await supabase
      .from("zoom_meetings")
      .insert({
        user_id: userId,
        topic: meetingTopic,
        language: language,
        platform: "zoom",
        status: "bot_joining",
        bot_provider: "custom",
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Failed to create meeting record:", meetingError);
      return new Response(
        JSON.stringify({ error: "Failed to create meeting record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created meeting: ${meeting.id}`);

    // Step 2: Call Coordinator Lambda to start session
    const coordinatorPayload = {
      action: "start_session",
      meeting_id: meeting.id,
      user_id: userId,
      topic: meetingTopic,
      language: language,
    };

    console.log("Calling Coordinator Lambda:", JSON.stringify(coordinatorPayload));

    const coordinatorResponse = await fetch(COORDINATOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": BOT_SECRET,
      },
      body: JSON.stringify(coordinatorPayload),
    });

    if (!coordinatorResponse.ok) {
      const errorText = await coordinatorResponse.text();
      console.error("Coordinator Lambda error:", coordinatorResponse.status, errorText);

      // Update meeting status to failed
      await supabase
        .from("zoom_meetings")
        .update({ status: "failed", error_details: `Coordinator error: ${errorText}` })
        .eq("id", meeting.id);

      return new Response(
        JSON.stringify({ error: "Failed to start bot session", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionData: CoordinatorResponse = await coordinatorResponse.json();
    console.log("Coordinator response:", JSON.stringify(sessionData));

    // Step 3: Update zoom_meetings with session info
    const { error: updateError } = await supabase
      .from("zoom_meetings")
      .update({
        bot_session_id: sessionData.session_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", meeting.id);

    if (updateError) {
      console.error("Failed to update meeting with session:", updateError);
      // Non-fatal - continue with response
    }

    // Step 4: Return session info to frontend
    return new Response(
      JSON.stringify({
        success: true,
        meeting_id: meeting.id,
        session_id: sessionData.session_id,
        rtmp_url: sessionData.rtmp_url,
        stream_key: sessionData.stream_key,
        status: sessionData.status,
        topic: meetingTopic,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating bot session:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
