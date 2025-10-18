import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase credentials", { status: 500, headers: corsHeaders });
  }

  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { error: cleanupSignalsError } = await client.rpc("delete_expired_video_call_signals");
    if (cleanupSignalsError) {
      console.error("Failed to cleanup signals", cleanupSignalsError);
      return new Response("Failed to cleanup signals", { status: 500, headers: corsHeaders });
    }

    const { data: activeSessions, error: sessionsError } = await client
      .from("video_call_sessions")
      .select("id")
      .eq("status", "active")
      .is("ended_at", null);

    if (sessionsError) {
      console.error("Failed to fetch active sessions", sessionsError);
      return new Response("Failed to fetch sessions", { status: 500, headers: corsHeaders });
    }

    const nowIso = new Date().toISOString();
    const endedSessions: string[] = [];

    for (const session of activeSessions ?? []) {
      const { data: participants, error: participantsError } = await client
        .from("video_call_participants")
        .select("connection_state, left_at")
        .eq("session_id", session.id);

      if (participantsError) {
        console.error("Failed to fetch participants", participantsError);
        continue;
      }

      const hasConnected = participants.some((participant) => participant.connection_state === "connected");
      if (!hasConnected) {
        const { error: updateError } = await client
          .from("video_call_sessions")
          .update({ status: "ended", ended_at: nowIso })
          .eq("id", session.id);

        if (updateError) {
          console.error("Failed to mark session ended", updateError);
        } else {
          endedSessions.push(session.id);
        }
      }
    }

    return new Response(JSON.stringify({ status: "ok", endedSessions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup error", error);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
