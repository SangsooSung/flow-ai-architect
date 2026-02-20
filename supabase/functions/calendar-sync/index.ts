import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const ZOOM_URL_PATTERN = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/g;

serve(async (_req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get all users with calendar sync enabled
    const { data: connections } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("provider", "google")
      .eq("calendar_sync_enabled", true);

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: "No connections to sync" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let synced = 0;

    for (const connection of connections) {
      try {
        // Refresh token if expired
        let accessToken = connection.access_token;
        if (new Date(connection.token_expires_at) < new Date()) {
          accessToken = await refreshGoogleToken(connection, supabase);
          if (!accessToken) continue;
        }

        // Fetch upcoming events (next 24 hours)
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            new URLSearchParams({
              timeMin: now.toISOString(),
              timeMax: tomorrow.toISOString(),
              singleEvents: "true",
              orderBy: "startTime",
            }),
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!eventsResponse.ok) {
          console.error(`Failed to fetch events for user ${connection.user_id}`);
          continue;
        }

        const eventsData = await eventsResponse.json();
        const events = eventsData.items || [];

        for (const event of events) {
          // Check description, location, and conference data for Zoom URLs
          const searchText = [
            event.description || "",
            event.location || "",
            event.hangoutLink || "",
            JSON.stringify(event.conferenceData || {}),
          ].join(" ");

          const zoomMatches = [...searchText.matchAll(ZOOM_URL_PATTERN)];

          for (const match of zoomMatches) {
            const meetingUrl = match[0];
            const zoomMeetingId = match[1];

            // Check if we already have this meeting
            const { data: existing } = await supabase
              .from("zoom_meetings")
              .select("id")
              .eq("user_id", connection.user_id)
              .eq("zoom_meeting_id", zoomMeetingId)
              .maybeSingle();

            if (!existing) {
              // Create meeting record
              await supabase.from("zoom_meetings").insert({
                user_id: connection.user_id,
                zoom_meeting_id: zoomMeetingId,
                meeting_url: meetingUrl,
                topic: event.summary || "Calendar Meeting",
                status: "scheduled",
                started_at: event.start?.dateTime || event.start?.date,
              });
              synced++;
            }
          }
        }

        // Update last synced timestamp
        await supabase
          .from("calendar_connections")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", connection.id);
      } catch (error) {
        console.error(`Sync failed for user ${connection.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ message: `Synced ${synced} new meetings` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Calendar sync error:", error);
    return new Response(
      JSON.stringify({ message: "Sync failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function refreshGoogleToken(
  connection: { id: string; refresh_token: string },
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json();

    await supabase
      .from("calendar_connections")
      .update({
        access_token: tokens.access_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq("id", connection.id);

    return tokens.access_token;
  } catch {
    return null;
  }
}
