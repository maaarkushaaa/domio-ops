import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SignalPayload {
  session_id?: string;
  session_title?: string;
  target_user_ids?: string[];
  type: "offer" | "answer" | "candidate" | "bye";
  receiver_id?: string;
  payload: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase credentials", { status: 500, headers: corsHeaders });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
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
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response("Invalid token", { status: 401, headers: corsHeaders });
    }

    const body: SignalPayload = await req.json();

    if (!body.type || !body.payload) {
      return new Response("Invalid signal payload", { status: 400, headers: corsHeaders });
    }

    let sessionId = body.session_id;

    if (!sessionId) {
      if (!body.session_title) {
        return new Response("session_title is required when session_id is missing", { status: 400, headers: corsHeaders });
      }

      const { data: createdSession, error: sessionError } = await supabaseClient
        .from("video_call_sessions")
        .insert({ title: body.session_title, host_id: user.id })
        .select()
        .single();

      if (sessionError) {
        console.error("Failed to create session", sessionError);
        return new Response("Failed to create session", { status: 500, headers: corsHeaders });
      }

      sessionId = createdSession.id;

      const participantRecords = [
        { session_id: sessionId, user_id: user.id, role: "host", connection_state: "connected" },
        ...(body.target_user_ids?.map((targetId) => ({
          session_id: sessionId,
          user_id: targetId,
          role: "guest",
          connection_state: "connecting",
        })) ?? []),
      ];

      const { error: participantsError } = await supabaseClient
        .from("video_call_participants")
        .insert(participantRecords);

      if (participantsError) {
        console.error("Failed to insert participants", participantsError);
        return new Response("Failed to insert participants", { status: 500, headers: corsHeaders });
      }
    } else {
      const { data: participant, error: participantError } = await supabaseClient
        .from("video_call_participants")
        .select("id, role")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (participantError || !participant) {
        const { error: insertError } = await supabaseClient
          .from("video_call_participants")
          .insert({ session_id: sessionId, user_id: user.id, role: "guest" });

        if (insertError) {
          console.error("Participant insert failed", insertError);
          return new Response("Participant insert failed", { status: 500, headers: corsHeaders });
        }
      } else {
        await supabaseClient
          .from("video_call_participants")
          .update({ connection_state: "connected", joined_at: new Date().toISOString(), left_at: null })
          .eq("id", participant.id);
      }
    }

    const { error: signalError } = await supabaseClient
      .from("video_call_signals")
      .insert({
        session_id: sessionId,
        sender_id: user.id,
        receiver_id: body.receiver_id ?? null,
        type: body.type,
        payload: body.payload,
      });

    if (signalError) {
      console.error("Failed to insert signal", signalError);
      return new Response("Failed to insert signal", { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ session_id: sessionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
