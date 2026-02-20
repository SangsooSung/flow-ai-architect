import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID") || "";
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET") || "";
const ZOOM_REDIRECT_URI = Deno.env.get("ZOOM_REDIRECT_URI") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Step 1: Redirect user to Zoom OAuth
  if (!url.searchParams.has("code")) {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response("Missing user_id", { status: 400 });
    }

    const authUrl = new URL("https://zoom.us/oauth/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", ZOOM_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", ZOOM_REDIRECT_URI);
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
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: ZOOM_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return Response.redirect(`${APP_URL}/settings?error=zoom_auth_failed`, 302);
    }

    const tokens = await tokenResponse.json();

    // Get Zoom user info to get account ID
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const zoomUser = await userResponse.json();

    // Store connection in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from("zoom_connections").upsert(
      {
        user_id: userId,
        zoom_account_id: zoomUser.account_id || zoomUser.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      },
      { onConflict: "user_id,zoom_account_id" }
    );

    return Response.redirect(`${APP_URL}/settings?zoom=connected`, 302);
  } catch (error) {
    console.error("Zoom connect error:", error);
    return Response.redirect(`${APP_URL}/settings?error=zoom_connect_failed`, 302);
  }
});
