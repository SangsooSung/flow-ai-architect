import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_CALENDAR_REDIRECT_URI") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Step 1: Redirect to Google OAuth
  if (!url.searchParams.has("code")) {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response("Missing user_id", { status: 400 });
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.readonly");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", userId);

    return Response.redirect(authUrl.toString(), 302);
  }

  // Step 2: Handle OAuth callback
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");

  if (!code || !userId) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Google token exchange failed:", error);
      return Response.redirect(`${APP_URL}/settings?error=calendar_auth_failed`, 302);
    }

    const tokens = await tokenResponse.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from("calendar_connections").upsert(
      {
        user_id: userId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        calendar_sync_enabled: true,
      },
      { onConflict: "user_id,provider" }
    );

    return Response.redirect(`${APP_URL}/settings?calendar=connected`, 302);
  } catch (error) {
    console.error("Calendar connect error:", error);
    return Response.redirect(`${APP_URL}/settings?error=calendar_connect_failed`, 302);
  }
});
