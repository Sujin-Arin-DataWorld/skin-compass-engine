// Prompt 3 (UPDATED with Prompt 3 UPDATE — DB saving)
// Supabase Edge Function: analyze-skin
// Secure proxy to Groq API. Never exposes GROQ_API_KEY to the frontend.

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AXIS_KEYS = [
  "seb",
  "hyd",
  "bar",
  "sen",
  "acne",
  "pigment",
  "texture",
  "aging",
  "ox",
  "makeup_stability",
];

const SYSTEM_PROMPT = `You are a professional dermatology AI assistant for SkinStrategyLab, a skincare analysis platform.
Analyze the provided face photograph and evaluate the skin condition across 10 axes.

SCORING RULES:
- Each score is 0 to 100 (integer only).
- Be specific and vary your scores. Do NOT default everything to 50.
- Base your analysis on visible skin characteristics in the image.

THE 10 AXES:
- seb (Sebum/Oiliness): 0=very dry skin, 100=extremely oily. Look for: shine on forehead/nose, enlarged pores in T-zone, visible oil.
- hyd (Hydration): 0=severely dehydrated, 100=well-hydrated and plump. Look for: skin plumpness, fine dehydration lines, dullness.
- bar (Barrier Health): 0=severely compromised, 100=healthy intact barrier. Look for: visible redness, flaking, rough patches, irritation signs.
- sen (Sensitivity): 0=resilient thick skin, 100=extremely sensitive reactive skin. Look for: redness around nose/cheeks, visible capillaries, blotchiness.
- acne (Acne/Blemish Severity): 0=completely clear, 100=severe active acne. Look for: active pimples, comedones, inflamed spots, post-acne marks.
- pigment (Pigmentation Irregularity): 0=perfectly even tone, 100=heavy uneven pigmentation. Look for: dark spots, melasma patches, sun damage, freckle clusters.
- texture (Texture/Pore Visibility): 0=porcelain smooth, 100=very rough/visible pores. Look for: visible pores, bumpy texture, rough areas, acne scars.
- aging (Aging Signs): 0=no visible aging, 100=advanced aging. Look for: fine lines, wrinkles (forehead, crow's feet, nasolabial), sagging, loss of elasticity.
- ox (Oxidative Stress/Dullness): 0=radiant glowing skin, 100=extremely dull and tired. Look for: overall skin brightness, sallowness, uneven glow.
- makeup_stability (Makeup Hold Estimate): 0=makeup melts instantly, 100=all-day hold. Infer from oil level, pore size, and skin texture balance.

RESPONSE FORMAT:
Return ONLY a valid JSON object. No explanation, no markdown, no extra text.
Example: {"seb":42,"hyd":65,"bar":72,"sen":28,"acne":15,"pigment":33,"texture":22,"aging":18,"ox":25,"makeup_stability":68}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_base64, lifestyle } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Build lifestyle context string for Groq (if provided) ────────────
    let lifestyleContext = "";
    if (lifestyle && typeof lifestyle === "object" && Object.keys(lifestyle).length > 0) {
      const AGE_MAP: Record<number, string> = { 0: "Under 20", 1: "20-29", 2: "30-39", 3: "40-49", 4: "50-59", 5: "60+" };
      const GENDER_MAP: Record<number, string> = { 0: "Female", 1: "Male", 2: "Non-binary" };
      const SLEEP_MAP: Record<number, string> = { 1: "<5h (very poor)", 2: "5-6h (insufficient)", 3: "7h (adequate)", 4: "8h+ (excellent)" };
      const WATER_MAP: Record<number, string> = { 1: "1-2 glasses (very low)", 2: "3-5 glasses (moderate)", 3: "6+ glasses (good)" };
      const STRESS_MAP: Record<number, string> = { 1: "Low", 2: "Moderate", 3: "High" };
      const SEASONAL_MAP: Record<number, string> = { 0: "No significant change", 1: "Oilier summer / drier winter", 2: "Dry year-round / worse in winter", 3: "Oily year-round / worse in summer" };

      const lines: string[] = [];
      if (lifestyle.age_bracket !== undefined) lines.push(`- Age range: ${AGE_MAP[lifestyle.age_bracket as number] ?? lifestyle.age_bracket}`);
      if (lifestyle.gender !== undefined) lines.push(`- Gender: ${GENDER_MAP[lifestyle.gender as number] ?? lifestyle.gender}`);
      if (lifestyle.sleep !== undefined) lines.push(`- Sleep: ${SLEEP_MAP[lifestyle.sleep as number] ?? lifestyle.sleep}`);
      if (lifestyle.water !== undefined) lines.push(`- Water intake: ${WATER_MAP[lifestyle.water as number] ?? lifestyle.water}`);
      if (lifestyle.stress !== undefined) lines.push(`- Stress level: ${STRESS_MAP[lifestyle.stress as number] ?? lifestyle.stress}`);
      if (lifestyle.climate !== undefined) lines.push(`- Climate: ${lifestyle.climate}`);
      if (lifestyle.seasonal_change !== undefined) lines.push(`- Seasonal variation: ${SEASONAL_MAP[lifestyle.seasonal_change as number] ?? lifestyle.seasonal_change}`);

      if (lines.length > 0) {
        lifestyleContext = `\n\nLIFESTYLE CONTEXT (use these factors to adjust your visual scoring — e.g. low water intake should lower hyd, high stress should increase seb/sen, poor sleep should increase bar/aging):\n${lines.join("\n")}`;
      }
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) throw new Error("GROQ_API_KEY not configured");

    // ── Prepare Supabase client + identify user IN PARALLEL with Groq call ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const identifyUser = async (): Promise<{ userId: string; isAnonymous: boolean }> => {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) return { userId: user.id, isAnonymous: false };
      }
      // Anonymous device fingerprint
      const ua = req.headers.get("user-agent") ?? "";
      const lang = req.headers.get("accept-language") ?? "";
      const encoder = new TextEncoder();
      const data = encoder.encode(ua + lang);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const anonId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      return { userId: anonId, isAnonymous: true };
    };

    const startMs = Date.now();

    // ── Run Groq API call and user identification IN PARALLEL ────────────────
    const [groqRes, userInfo] = await Promise.all([
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.1,
          max_tokens: 4096,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${image_base64}`,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this face photo and return ONLY a valid JSON object with the 10 skin axis scores.${lifestyleContext}`,
                },
              ],
            },
          ],
        }),
      }),
      identifyUser(),
    ]);

    const inferenceLatencyMs = Date.now() - startMs;

    // ── Handle Groq response ────────────────────────────────────────────────
    if (!groqRes.ok) {
      if (groqRes.status === 429) {
        return new Response(
          JSON.stringify({
            error: "분석 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errBody = await groqRes.text();
      throw new Error(`Groq API error ${groqRes.status}: ${errBody}`);
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content ?? "";

    // ── Parse scores ───────────────────────────────────────────────────────
    let parsed: Record<string, unknown>;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      // Retry: extract first {...} block from response
      const match = String(raw).match(/\{[\s\S]*?\}/);
      if (!match) throw new Error("AI 응답을 파싱할 수 없습니다.");
      parsed = JSON.parse(match[0]);
    }

    // Validate — clamp to 0-100, default missing axes to 50
    const scores: Record<string, number> = {};
    for (const key of AXIS_KEYS) {
      const val = parsed[key];
      scores[key] =
        typeof val === "number" && val >= 0 && val <= 100
          ? Math.round(val)
          : 50;
    }

    const { userId, isAnonymous } = userInfo;

    // ── Insert DB record (non-fatal — user still gets results) ──────────────
    let analysisId: string = crypto.randomUUID();
    try {
      const { data: insertData } = await supabase
        .from("skin_analysis_logs")
        .insert({
          user_id: userId,
          is_anonymous: isAnonymous,
          scores_json: scores,
          lifestyle_json: lifestyle ?? null,
          model_version: "groq-llama-4-scout-v1",
          inference_latency_ms: inferenceLatencyMs,
        })
        .select("id")
        .single();

      if (insertData?.id) analysisId = insertData.id;
    } catch (dbErr) {
      console.warn("DB insert failed (non-fatal):", dbErr);
    }

    // ── Save image to Storage asynchronously (fire-and-forget) ─────────────
    const imagePromise = (async () => {
      try {
        const imageBytes = Uint8Array.from(atob(image_base64), (c) =>
          c.charCodeAt(0),
        );
        const filePath = `${userId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("skin-images")
          .upload(filePath, imageBytes, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (!uploadError && analysisId) {
          const { data: urlData } = supabase.storage
            .from("skin-images")
            .getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            await supabase
              .from("skin_analysis_logs")
              .update({ image_url: urlData.publicUrl })
              .eq("id", analysisId);
          }
        }
      } catch {
        // Non-fatal — analysis still succeeds without image
      }
    })();

    void imagePromise;

    return new Response(
      JSON.stringify({
        analysis_id: analysisId,
        scores,
        model: "groq-llama-4-scout",
        version: "1.0",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("analyze-skin error:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
