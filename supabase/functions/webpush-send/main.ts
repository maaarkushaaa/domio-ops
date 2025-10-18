import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore deno npm resolution without types
import webpush from "npm:web-push@3.6.2";

type PushRequest = {
  session_id: string;
  title: string;
  message: string;
  target_user_ids: string[];
  action_url?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase credentials", { status: 500, headers: corsHeaders });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response("Missing VAPID keys", { status: 500, headers: corsHeaders });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(token);

    if (authError || !user) {
      return new Response("Invalid token", { status: 401, headers: corsHeaders });
    }

    const payload: PushRequest = await req.json();

    if (!payload.session_id || !payload.title || !payload.message || !payload.target_user_ids?.length) {
      return new Response("Invalid request body", { status: 400, headers: corsHeaders });
    }

    const { data: session, error: sessionError } = await serviceClient
      .from("video_call_sessions")
      .select("id, host_id")
      .eq("id", payload.session_id)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response("Session not found", { status: 404, headers: corsHeaders });
    }

    const { data: participant, error: participantError } = await serviceClient
      .from("video_call_participants")
      .select("user_id")
      .eq("session_id", payload.session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (participantError || (!participant && session.host_id !== user.id)) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const { data: subscriptions, error: subscriptionsError } = await serviceClient
      .from("notification_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
      .in("user_id", payload.target_user_ids);

    if (subscriptionsError) {
      console.error("Failed to load subscriptions", subscriptionsError);
      return new Response("Failed to load subscriptions", { status: 500, headers: corsHeaders });
    }

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              type: "video_call_invite",
              sessionId: payload.session_id,
              title: payload.title,
              message: payload.message,
              actionUrl: payload.action_url ?? null,
            })
          );
          return { user_id: subscription.user_id, status: "sent" };
        } catch (error) {
          console.error("webpush error", error);
          return {
            user_id: subscription.user_id,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in webpush-send", error);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
