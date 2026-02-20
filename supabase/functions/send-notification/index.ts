import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const AWS_REGION = Deno.env.get("AWS_SES_REGION") || "us-east-1";
const AWS_SES_FROM_EMAIL = Deno.env.get("AWS_SES_FROM_EMAIL") || "noreply@flowai.app";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { user_id, type, meeting_id } = await req.json();

  if (!user_id || !type) {
    return new Response(
      JSON.stringify({ message: "Missing user_id or type" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    // Default to enabled if no preferences set
    const emailEnabled = type === "transcript_ready"
      ? prefs?.email_on_transcript_ready ?? true
      : type === "phase1_complete"
      ? prefs?.email_on_phase1_complete ?? true
      : true;

    if (!emailEnabled) {
      return new Response(
        JSON.stringify({ message: "Notification disabled by user preferences" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    if (!user?.email) {
      return new Response(
        JSON.stringify({ message: "User email not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get meeting details if applicable
    let meetingTopic = "your Zoom meeting";
    if (meeting_id) {
      const { data: meeting } = await supabase
        .from("zoom_meetings")
        .select("topic")
        .eq("id", meeting_id)
        .single();

      if (meeting?.topic) {
        meetingTopic = meeting.topic;
      }
    }

    // Build email content
    const { subject, body } = buildEmailContent(type, meetingTopic);

    // Send via AWS SES
    await sendSesEmail({
      to: user.email,
      subject,
      htmlBody: body,
    });

    return new Response(
      JSON.stringify({ message: "Notification sent" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ message: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

function buildEmailContent(type: string, meetingTopic: string) {
  switch (type) {
    case "transcript_ready":
      return {
        subject: `Transcript ready: ${meetingTopic}`,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Your meeting transcript is ready</h2>
            <p>The transcript for <strong>${meetingTopic}</strong> has been processed and is ready for analysis.</p>
            <a href="${APP_URL}/meetings" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Transcript
            </a>
            <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
              You can start Phase 1 analysis directly from the Meetings page.
            </p>
          </div>
        `,
      };
    case "phase1_complete":
      return {
        subject: `Phase 1 analysis complete: ${meetingTopic}`,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Phase 1 Analysis Complete</h2>
            <p>Requirements extraction for <strong>${meetingTopic}</strong> is complete.</p>
            <a href="${APP_URL}/" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Project
            </a>
          </div>
        `,
      };
    default:
      return {
        subject: "Flow AI Architect Notification",
        body: `<p>You have a new notification from Flow AI Architect.</p>`,
      };
  }
}

async function sendSesEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
}) {
  // AWS SES v2 SendEmail API
  const endpoint = `https://email.${AWS_REGION}.amazonaws.com/v2/email/outbound-emails`;

  const body = {
    Content: {
      Simple: {
        Subject: { Data: params.subject },
        Body: {
          Html: { Data: params.htmlBody },
        },
      },
    },
    Destination: {
      ToAddresses: [params.to],
    },
    FromEmailAddress: AWS_SES_FROM_EMAIL,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // In production, use proper AWS SigV4 signing
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SES send failed: ${error}`);
  }
}
