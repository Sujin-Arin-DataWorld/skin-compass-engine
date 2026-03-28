// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: analyze-skin  (P0-Hardened v2)
// Secure proxy to Groq API. Never exposes GROQ_API_KEY to the frontend.
//
// P0 FIXES:
//   1. GDPR: No image storage — analysis only, photos never saved
//   2. COST: max_tokens capped at 200 (10-key JSON needs ~50 tokens)
//   3. SAFETY: NO_FACE_DETECTED pre-flight in system prompt
//   4. TIMEOUT: AbortController (45s) prevents orphan billing
//   5. i18n: All error messages in ko/en/de
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AXIS_KEYS = [
  "seb", "hyd", "bar", "sen", "acne",
  "pigment", "texture", "aging", "ox", "makeup_stability",
];

// ── i18n Error Messages ─────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  rate_limit: {
    ko: "분석 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.",
    en: "Analysis server is busy. Please try again shortly.",
    de: "Der Analyseserver ist ausgelastet. Bitte versuchen Sie es gleich erneut.",
  },
  server_error: {
    ko: "AI 분석 서버에 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    en: "A temporary error occurred with the AI server. Please try again shortly.",
    de: "Beim KI-Server ist ein vorübergehender Fehler aufgetreten. Bitte versuchen Sie es gleich erneut.",
  },
  no_face: {
    ko: "얼굴을 정확히 인식할 수 없습니다. 밝은 곳에서 정면 사진으로 다시 촬영해주세요.",
    en: "Could not detect a face clearly. Please retake the photo in bright lighting, facing the camera.",
    de: "Das Gesicht konnte nicht erkannt werden. Bitte bei guter Beleuchtung frontal erneut fotografieren.",
  },
  parse_error: {
    ko: "AI 응답을 처리할 수 없습니다. 다시 시도해주세요.",
    en: "Could not process the AI response. Please try again.",
    de: "Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.",
  },
  timeout: {
    ko: "분석 시간이 초과되었습니다. 다시 시도해주세요.",
    en: "Analysis timed out. Please try again.",
    de: "Die Analyse hat zu lange gedauert. Bitte erneut versuchen.",
  },
} as const;

type LangKey = "ko" | "en" | "de";

function detectLang(req: Request): LangKey {
  const accept = req.headers.get("accept-language") ?? "";
  if (accept.includes("ko")) return "ko";
  if (accept.includes("de")) return "de";
  return "en";
}

function errorResponse(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── System Prompt (P0: NO_FACE_DETECTED + Reasons generation) ───────────────
const SYSTEM_PROMPT = `You are a professional dermatology AI assistant for SkinStrategyLab, a skincare analysis platform.

PRIORITY RULE (MUST check FIRST):
If the image does NOT contain a clearly visible human face, or the face is too obscured/blurry/covered to analyze, STOP ALL analysis and return ONLY: {"error":"NO_FACE_DETECTED"}
Do NOT fabricate scores for non-face images. This is the highest priority rule.

If the image IS a valid human face, analyze the skin condition across 10 axes.

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
Return ONLY a valid JSON object with two top-level keys: "scores" and "reasons".
Constraint: Keep each reason strictly under 2 sentences (max 15 words each) to ensure rapid response.

Example:
{"scores":{"seb":42,"hyd":65,"bar":72,"sen":28,"acne":15,"pigment":33,"texture":22,"aging":18,"ox":25,"makeup_stability":68},"reasons":{"seb":"Mild T-zone shine observed.","hyd":"Good plumpness, minimal dehydration lines.","bar":"Healthy barrier with no visible flaking.","sen":"No significant redness or reactivity.","acne":"Skin is mostly clear.","pigment":"Minor uneven tone near cheeks.","texture":"Smooth with barely visible pores.","aging":"No visible fine lines.","ox":"Good radiance overall.","makeup_stability":"Balanced oil-hydration for decent hold."}}`;

// ── Lifestyle context builder ───────────────────────────────────────────────
function buildLifestyleContext(lifestyle: Record<string, unknown>): string {
  if (!lifestyle || typeof lifestyle !== "object" || Object.keys(lifestyle).length === 0) return "";

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

  if (lines.length === 0) return "";
  return `\n\nLIFESTYLE CONTEXT (use these factors to adjust your visual scoring — e.g. low water intake should lower hyd, high stress should increase seb/sen, poor sleep should increase bar/aging):\n${lines.join("\n")}`;
}

// ── User identification ─────────────────────────────────────────────────────
async function identifyUser(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<{ userId: string; isAnonymous: boolean }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) return { userId: user.id, isAnonymous: false };
    } catch { /* fall through to anonymous */ }
  }
  // Anonymous device fingerprint
  const ua = req.headers.get("user-agent") ?? "";
  const langHeader = req.headers.get("accept-language") ?? "";
  const encoder = new TextEncoder();
  const data = encoder.encode(ua + langHeader);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const anonId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  return { userId: anonId, isAnonymous: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const lang = detectLang(req);

  try {
    const { image_base64, lifestyle, language: reqLanguage } = await req.json();

    // Use explicit language from frontend, fallback to Accept-Language header
    const reasonLang = (reqLanguage === 'ko' || reqLanguage === 'en' || reqLanguage === 'de')
      ? reqLanguage : lang;

    if (!image_base64) {
      return errorResponse(400, "image_base64 is required");
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) throw new Error("GROQ_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const lifestyleContext = buildLifestyleContext(lifestyle);

    // ── P0 FIX 4: AbortController (45s hard timeout) ────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    const startMs = Date.now();

    try {
      // ── Groq API call with retry + User identification IN PARALLEL ────────
      const groqFetch = (): Promise<Response> =>
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,  // P0 FIX 4: Abort on timeout
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.1,
            max_tokens: 1024,  // Enough for scores + reasons JSON (~400-600 tokens)
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT + `\n\nCRITICAL LANGUAGE RULE: You MUST write ALL values inside the "reasons" object entirely in ${reasonLang === 'ko' ? 'Korean (한국어)' : reasonLang === 'de' ? 'German (Deutsch)' : 'English'}. Do NOT mix languages. The scores remain as numbers.` },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${image_base64}` },
                  },
                  {
                    type: "text",
                    text: `Analyze this face photo and return ONLY a valid JSON object with the 10 skin axis scores.${lifestyleContext}`,
                  },
                ],
              },
            ],
          }),
        });

      const [groqRes, userInfo] = await Promise.all([
        (async () => {
          let res = await groqFetch();
          // Retry once on 5xx (Groq transient errors) after 2s delay
          if (res.status >= 500 && res.status < 600) {
            console.warn(`[analyze-skin] Groq returned ${res.status}, retrying in 2s...`);
            await new Promise<void>((r) => setTimeout(r, 2_000));
            res = await groqFetch();
          }
          return res;
        })(),
        identifyUser(req, supabase),
      ]);

      clearTimeout(timeoutId);  // Clear timeout after successful response

      const inferenceLatencyMs = Date.now() - startMs;

      // ── Handle Groq error responses ─────────────────────────────────────────
      if (!groqRes.ok) {
        if (groqRes.status === 429) return errorResponse(429, ERROR_MESSAGES.rate_limit[lang]);
        if (groqRes.status >= 500) {
          const errBody = await groqRes.text();
          console.error(`[analyze-skin] Groq 500 after retry: ${errBody}`);
          return errorResponse(502, ERROR_MESSAGES.server_error[lang]);
        }
        const errBody = await groqRes.text();
        throw new Error(`Groq API error ${groqRes.status}: ${errBody}`);
      }

      // ── Parse Groq response ─────────────────────────────────────────────────
      const groqData = await groqRes.json();
      const raw = groqData.choices?.[0]?.message?.content ?? "";

      let parsed: Record<string, unknown>;
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        const match = String(raw).match(/\{[\s\S]*?\}/);
        if (!match) return errorResponse(422, ERROR_MESSAGES.parse_error[lang]);
        parsed = JSON.parse(match[0]);
      }

      // ── P0 FIX 3: Check for NO_FACE_DETECTED ─────────────────────────────
      if (parsed.error === "NO_FACE_DETECTED") {
        console.log("[analyze-skin] NO_FACE_DETECTED — rejecting analysis");
        return errorResponse(422, ERROR_MESSAGES.no_face[lang]);
      }

      // ── Extract scores (supports both nested and flat format) ─────────────
      // New format: { scores: {...}, reasons: {...} }
      // Legacy flat format: { seb: 42, hyd: 65, ... }
      const scoresSource = (parsed.scores && typeof parsed.scores === "object")
        ? parsed.scores as Record<string, unknown>
        : parsed;

      const scores: Record<string, number> = {};
      for (const key of AXIS_KEYS) {
        const val = scoresSource[key];
        scores[key] = typeof val === "number" && val >= 0 && val <= 100 ? Math.round(val) : 50;
      }

      // ── Extract reasons (nullable — frontend has fallback) ────────────────
      let reasons: Record<string, string> | null = null;
      if (parsed.reasons && typeof parsed.reasons === "object") {
        reasons = {};
        for (const key of AXIS_KEYS) {
          const val = (parsed.reasons as Record<string, unknown>)[key];
          if (typeof val === "string" && val.length > 0) {
            reasons[key] = val;
          }
        }
        // If no valid reasons were extracted, set to null
        if (Object.keys(reasons).length === 0) reasons = null;
      }

      const { userId, isAnonymous } = userInfo;

      // ── Insert DB record (non-fatal) ──────────────────────────────────────
      let analysisId: string = crypto.randomUUID();
      try {
        const { data: insertData } = await supabase
          .from("skin_analysis_logs")
          .insert({
            user_id: userId,
            is_anonymous: isAnonymous,
            scores_json: scores,
            reasons_json: reasons,
            lifestyle_json: lifestyle ?? null,
            model_version: "groq-llama-4-scout-v2",
            inference_latency_ms: inferenceLatencyMs,
            // P0 FIX 1: NO image_url field — images are never stored (GDPR)
          })
          .select("id")
          .single();

        if (insertData?.id) analysisId = insertData.id;
      } catch (dbErr) {
        console.warn("DB insert failed (non-fatal):", dbErr);
      }

      // ── P0 FIX 1: NO image upload — GDPR compliant ───────────────────────
      // Images are analyzed in-memory only. Nothing is persisted to Storage.

      return new Response(
        JSON.stringify({
          analysis_id: analysisId,
          scores,
          reasons,  // null if not generated — frontend falls back to CARE_TIPS
          model: "groq-llama-4-scout",
          version: "2.1",  // Bumped: reasons support
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    } finally {
      // ── P0 FIX 4: Always clear the timeout to prevent leaks ───────────────
      clearTimeout(timeoutId);
    }

  } catch (err) {
    // ── Catch-all with timeout-specific handling ────────────────────────────
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[analyze-skin] Request aborted (timeout or client disconnect)");
      return errorResponse(504, ERROR_MESSAGES.timeout[lang]);
    }
    console.error("[analyze-skin] Unhandled error:", err);
    return errorResponse(500, err instanceof Error ? err.message : "Internal server error");
  }
});
