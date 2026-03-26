// ═══════════════════════════════════════════════════════════════════════════════
// storage-cleanup/index.ts
//
// GDPR Cascade Delete — Physical File Cleanup Edge Function
//
// Reads unprocessed entries from storage_cleanup_queue and physically removes
// the corresponding files from Supabase Storage. Designed for:
//   1. pg_cron invocation (daily at 03:05 UTC, 5 min after consent purge)
//   2. Manual invocation via POST request
//
// Security: Uses SUPABASE_SERVICE_ROLE_KEY — never expose to client.
// Resilience: If a file is already deleted (404), it's marked as processed
//             without crashing the batch (idempotent).
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 50;
const BUCKET_NAME = "skin-images";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 1. Fetch unprocessed cleanup jobs (oldest first, batch of 50) ────────
    const { data: jobs, error: fetchError } = await supabase
      .from("storage_cleanup_queue")
      .select("id, storage_path")
      .eq("processed", false)
      .order("queued_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("[storage-cleanup] Queue fetch error:", fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending cleanup jobs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[storage-cleanup] Processing ${jobs.length} cleanup job(s)...`);

    // ── 2. Process each job: delete file from Storage, mark as processed ─────
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const job of jobs) {
      try {
        // Attempt to remove the physical file from Supabase Storage
        const { error: removeError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([job.storage_path]);

        if (removeError) {
          // If the file is already gone (404-like), treat as success (idempotent)
          const msg = removeError.message?.toLowerCase() ?? "";
          if (msg.includes("not found") || msg.includes("404") || msg.includes("object not found")) {
            console.log(`[storage-cleanup] File already deleted: ${job.storage_path}`);
            skipCount++;
          } else {
            // Genuine error — log it but don't crash the batch
            console.error(`[storage-cleanup] Failed to delete ${job.storage_path}:`, removeError.message);
            await supabase
              .from("storage_cleanup_queue")
              .update({ error_msg: removeError.message })
              .eq("id", job.id);
            errorCount++;
            continue; // Skip marking as processed — will be retried next run
          }
        } else {
          successCount++;
          console.log(`[storage-cleanup] Deleted: ${job.storage_path}`);
        }

        // Mark as processed (both successful deletions and already-gone files)
        await supabase
          .from("storage_cleanup_queue")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_msg: null,
          })
          .eq("id", job.id);

      } catch (err) {
        // Unexpected error for this single job — log and continue batch
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[storage-cleanup] Unexpected error for ${job.storage_path}:`, errMsg);

        await supabase
          .from("storage_cleanup_queue")
          .update({ error_msg: errMsg })
          .eq("id", job.id);

        errorCount++;
      }
    }

    // ── 3. Return summary ────────────────────────────────────────────────────
    const summary = {
      total: jobs.length,
      deleted: successCount,
      already_gone: skipCount,
      errors: errorCount,
    };

    console.log("[storage-cleanup] Summary:", JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[storage-cleanup] Fatal error:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
