// ═══════════════════════════════════════════════════════════════════════════════
// store-training-image/index.ts
//
// Phase 2 GDPR Two-Track — Track 2: Persistent Image Storage
//
// SEPARATED from analyze-skin to avoid timeout pressure (Groq ~30s + upload).
// Called AFTER analysis completes, when user opts in to ai_training consent.
//
// Flow:
//   1. Verify authenticated user (anonymous users cannot consent)
//   2. Check active ai_training consent in user_consents
//   3. Upload base64 JPEG to Supabase Storage (secure-skin-images bucket)
//   4. Link to skin_analysis_logs via image_url column
//   5. Insert skin_journey_photos record (CASCADE-deletable via consent FK)
//
// Security:
//   - Requires valid auth token (not anon key)
//   - Verifies consent exists before storing anything
//   - All writes are transactional (if Storage upload fails, no DB records created)
//   - Images auto-expire via 90-day TTL on user_consents (CASCADE DELETE)
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET_NAME = "skin-images";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function errorResponse(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Authenticate user (REQUIRED — no anonymous storage) ────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return errorResponse(401, "Authentication required to store training images");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return errorResponse(401, "Invalid or expired authentication token");
    }

    const userId = user.id;

    // ── 2. Parse request body ─────────────────────────────────────────────
    const { analysis_id, image_base64 } = await req.json();

    if (!analysis_id || typeof analysis_id !== "string") {
      return errorResponse(400, "analysis_id is required");
    }
    if (!image_base64 || typeof image_base64 !== "string") {
      return errorResponse(400, "image_base64 is required");
    }

    // Basic size guard: reject images > 2MB base64 (~1.5MB decoded)
    if (image_base64.length > 2_800_000) {
      return errorResponse(413, "Image too large (max ~2MB)");
    }

    // ── 3. Verify active ai_training consent ──────────────────────────────
    const { data: consent, error: consentErr } = await supabase
      .from("user_consents")
      .select("id")
      .eq("user_id", userId)
      .eq("consent_type", "ai_training")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("granted_at", { ascending: false })
      .limit(1)
      .single();

    if (consentErr || !consent) {
      return errorResponse(403, "Active ai_training consent required. Please opt in first.");
    }

    // ── 4. Verify analysis_id belongs to this user ────────────────────────
    const { data: analysis, error: analysisErr } = await supabase
      .from("skin_analysis_logs")
      .select("id, user_id, image_url")
      .eq("id", analysis_id)
      .single();

    if (analysisErr || !analysis) {
      return errorResponse(404, "Analysis not found");
    }
    if (analysis.user_id !== userId) {
      return errorResponse(403, "Analysis does not belong to you");
    }
    if (analysis.image_url) {
      // Already stored — idempotent success
      return new Response(
        JSON.stringify({ success: true, already_stored: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 5. Decode base64 and upload to Storage ────────────────────────────
    // Strip data URI prefix if present
    const rawBase64 = image_base64.replace(/^data:image\/[a-z]+;base64,/, "");

    let imageBytes: Uint8Array;
    try {
      const binaryString = atob(rawBase64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
    } catch {
      return errorResponse(400, "Invalid base64 image data");
    }

    const storagePath = `${userId}/${analysis_id}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBytes, {
        contentType: "image/jpeg",
        upsert: false, // Don't overwrite existing files
      });

    if (uploadErr) {
      console.error(`[store-training-image] Upload failed:`, uploadErr.message);
      return errorResponse(502, "Failed to upload image to storage");
    }

    console.log(`[store-training-image] Uploaded: ${storagePath}`);

    // ── 6. Update skin_analysis_logs.image_url ────────────────────────────
    const { error: updateErr } = await supabase
      .from("skin_analysis_logs")
      .update({ image_url: storagePath, updated_at: new Date().toISOString() })
      .eq("id", analysis_id);

    if (updateErr) {
      // Rollback: delete uploaded file if DB update fails
      console.error(`[store-training-image] DB update failed, rolling back upload:`, updateErr.message);
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return errorResponse(500, "Failed to link image to analysis record");
    }

    // ── 7. Insert skin_journey_photos (for CASCADE deletion on consent revoke) ─
    const { error: journeyErr } = await supabase
      .from("skin_journey_photos")
      .insert({
        user_id: userId,
        consent_id: consent.id,
        storage_path: storagePath,
        analysis_id: analysis_id,
        journey_day: 0,
      });

    if (journeyErr) {
      // Non-fatal: image is already stored and linked, journey record is a bonus
      console.warn(`[store-training-image] Journey photo insert failed (non-fatal):`, journeyErr.message);
    }

    // ── 8. Success ────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        storage_path: storagePath,
        consent_id: consent.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[store-training-image] Unhandled error:", err);
    return errorResponse(500, err instanceof Error ? err.message : "Internal server error");
  }
});
