// Prompt 3.5 — PART C: Feedback Edge Function
// Accepts thumbs-up / thumbs-down from the results screen.
// Confirmed-accurate feedback becomes high-confidence Phase 2 training data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { analysis_id, feedback, comment, tags } = await req.json();

    if (!analysis_id || !["accurate", "inaccurate"].includes(feedback)) {
      return new Response(
        JSON.stringify({ error: "analysis_id and valid feedback are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve the requesting user (may be anonymous via anon key)
    const authHeader = req.headers.get("Authorization") ?? "";
    let requesterId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) requesterId = user.id;
    }

    // Fetch existing record to verify ownership
    const { data: record, error: fetchErr } = await supabase
      .from("skin_analysis_logs")
      .select("id, user_id, is_anonymous")
      .eq("id", analysis_id)
      .single();

    if (fetchErr || !record) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow update if: authenticated user owns it, OR it was anonymous
    const canUpdate =
      record.is_anonymous ||
      (requesterId && record.user_id === requesterId);

    if (!canUpdate) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabase
      .from("skin_analysis_logs")
      .update({
        user_feedback: feedback,
        feedback_comment: comment ?? null,
        feedback_tags: Array.isArray(tags) ? tags : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analysis-feedback error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
