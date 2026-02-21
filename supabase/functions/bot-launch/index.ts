import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
const ECS_CLUSTER = Deno.env.get("ECS_CLUSTER") || "zoom-bot-cluster";
const ECS_ZOOM_TASK_DEFINITION = Deno.env.get("ECS_TASK_DEFINITION") || "zoom-bot-task";
const ECS_GMEET_TASK_DEFINITION = Deno.env.get("ECS_GMEET_TASK_DEFINITION") || "gmeet-bot-task";
const ECS_SUBNETS = (Deno.env.get("ECS_SUBNETS") || "").split(",");
const ECS_SECURITY_GROUPS = (Deno.env.get("ECS_SECURITY_GROUPS") || "").split(",");
const BOT_CALLBACK_URL = Deno.env.get("BOT_CALLBACK_URL") || `${SUPABASE_URL}/functions/v1/zoom-bot-callback`;

const ZOOM_URL_REGEX = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/;
const GMEET_URL_REGEX = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify the JWT token
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { meeting_url, user_id } = await req.json();

  if (!meeting_url || user_id !== user.id) {
    return new Response(
      JSON.stringify({ message: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Auto-detect platform from URL
  const zoomMatch = meeting_url.match(ZOOM_URL_REGEX);
  const gmeetMatch = meeting_url.match(GMEET_URL_REGEX);

  if (!zoomMatch && !gmeetMatch) {
    return new Response(
      JSON.stringify({ message: "Invalid meeting URL. Provide a Zoom or Google Meet URL." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const platform = zoomMatch ? "zoom" : "google_meet";
  const zoomMeetingId = zoomMatch ? zoomMatch[1] : null;
  const googleMeetCode = gmeetMatch ? gmeetMatch[1] : null;

  try {
    // Create meeting record in DB
    const { data: meeting, error: dbError } = await supabase
      .from("zoom_meetings")
      .insert({
        user_id: user.id,
        zoom_meeting_id: zoomMeetingId,
        google_meet_code: googleMeetCode,
        meeting_url,
        platform,
        status: "bot_joining",
      })
      .select()
      .single();

    if (dbError || !meeting) {
      throw new Error(`DB insert failed: ${dbError?.message}`);
    }

    // Determine task definition and container name based on platform
    const taskDefinition = platform === "zoom" ? ECS_ZOOM_TASK_DEFINITION : ECS_GMEET_TASK_DEFINITION;
    const containerName = platform === "zoom" ? "zoom-bot" : "gmeet-bot";

    // Launch Fargate task via AWS ECS RunTask API
    const taskArn = await launchFargateTask({
      meetingUrl: meeting_url,
      meetingId: meeting.id,
      userId: user.id,
      callbackUrl: BOT_CALLBACK_URL,
      taskDefinition,
      containerName,
    });

    // Store task ARN
    await supabase
      .from("zoom_meetings")
      .update({ bot_task_arn: taskArn })
      .eq("id", meeting.id);

    return new Response(
      JSON.stringify({ meeting_id: meeting.id, task_arn: taskArn }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Bot launch error:", error);
    return new Response(
      JSON.stringify({ message: error instanceof Error ? error.message : "Failed to launch bot" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

async function launchFargateTask(params: {
  meetingUrl: string;
  meetingId: string;
  userId: string;
  callbackUrl: string;
  taskDefinition: string;
  containerName: string;
}): Promise<string> {
  const endpoint = `https://ecs.${AWS_REGION}.amazonaws.com`;

  const body = {
    cluster: ECS_CLUSTER,
    taskDefinition: params.taskDefinition,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ECS_SUBNETS,
        securityGroups: ECS_SECURITY_GROUPS,
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: params.containerName,
          environment: [
            { name: "MEETING_URL", value: params.meetingUrl },
            { name: "MEETING_ID", value: params.meetingId },
            { name: "USER_ID", value: params.userId },
            { name: "CALLBACK_URL", value: params.callbackUrl },
          ],
        },
      ],
    },
  };

  // Use AWS SDK-style signing for ECS API call
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AmazonEC2ContainerServiceV20141113.RunTask",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ECS RunTask failed: ${error}`);
  }

  const result = await response.json();
  const taskArn = result.tasks?.[0]?.taskArn;

  if (!taskArn) {
    throw new Error("No task ARN returned from ECS");
  }

  return taskArn;
}
