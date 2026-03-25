/**
 * recheck-reminder/index.ts
 *
 * Phase 6 Step 3 — Supabase Edge Function skeleton.
 * Triggered daily by pg_cron to send re-check reminders to users
 * whose last diagnosis was exactly 28 days ago.
 *
 * pg_cron schedule (daily at 09:00 CET / 08:00 UTC):
 *   SELECT cron.schedule(
 *     'recheck-reminder-daily',
 *     '0 8 * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/recheck-reminder',
 *       headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
 *     );$$
 *   );
 *
 * Supabase table required (run once in SQL editor):
 *   CREATE TABLE IF NOT EXISTS recheck_notifications (
 *     id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id    UUID        REFERENCES auth.users(id),
 *     sent_at    TIMESTAMPTZ DEFAULT now(),
 *     channel    TEXT        CHECK (channel IN ('in_app', 'email', 'push')),
 *     acknowledged BOOLEAN   DEFAULT false
 *   );
 */

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase     = createClient(supabaseUrl, serviceKey);

    // ── 1. Find users whose last diagnosis was 28 days ago ──────────────────
    const { data: users, error: queryError } = await supabase.rpc(
      "get_users_due_for_recheck",
    );

    if (queryError) {
      console.error("[recheck-reminder] query error:", queryError.message);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. For each user, log the in-app notification ───────────────────────
    //    Email sending is wired up when an email provider (Resend / SendGrid)
    //    is chosen. Until then, we only write to recheck_notifications.
    const rows = (users as Array<{ user_id: string }>).map((u) => ({
      user_id: u.user_id,
      channel: "in_app",
    }));

    const { error: insertError } = await supabase
      .from("recheck_notifications")
      .insert(rows);

    if (insertError) {
      console.error("[recheck-reminder] insert error:", insertError.message);
    }

    // ── 3. TODO: send email via Resend / SendGrid ────────────────────────────
    //    Uncomment and configure when an email provider is ready.
    //
    //  for (const u of users) {
    //    const lang = u.foundation_data?.language ?? "en";
    //    await sendEmail({
    //      to: u.email,
    //      subject: RECHECK_SUBJECT[lang],
    //      body:    RECHECK_PROMPT[lang],
    //    });
    //  }

    return new Response(JSON.stringify({ sent: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[recheck-reminder] unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/*
 * SQL helper function to find users due for a re-check (run once in SQL editor):
 *
 * CREATE OR REPLACE FUNCTION get_users_due_for_recheck()
 * RETURNS TABLE(user_id UUID, email TEXT, foundation_data JSONB)
 * LANGUAGE sql SECURITY DEFINER AS $$
 *   SELECT DISTINCT ON (d.user_id)
 *     d.user_id,
 *     u.email,
 *     d.foundation_data
 *   FROM diagnosis_history d
 *   JOIN auth.users u ON u.id = d.user_id
 *   WHERE d.diagnosed_at = (
 *     SELECT MAX(diagnosed_at) FROM diagnosis_history WHERE user_id = d.user_id
 *   )
 *   AND d.diagnosed_at::date = (CURRENT_DATE - INTERVAL '28 days')
 *   ORDER BY d.user_id, d.diagnosed_at DESC;
 * $$;
 */
