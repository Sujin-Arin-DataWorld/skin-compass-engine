// Prompt 3 — Frontend service for AI skin analysis
// Calls Supabase Edge Functions as a secure proxy to Groq API.
// Phase 2: Added consent management and training image storage.

import type { AnalysisApiResponse } from '@/types/skinAnalysis';
import { supabase } from '@/integrations/supabase/client';


/**
 * Sends a base64 face image to the Supabase Edge Function which calls Groq
 * and returns the 10-axis skin analysis scores.
 *
 * If the user is logged in, their auth token is forwarded so the Edge Function
 * can associate the analysis with their account (non-anonymous).
 */
export async function analyzeSkinImage(
  imageBase64: string,
  lifestyle?: Record<string, number | string>,
  language?: 'ko' | 'en' | 'de',
): Promise<AnalysisApiResponse> {
  // [PWA-FIX] Fail-fast offline check — avoids confusing network errors on spotty mobile connections
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('오프라인 상태입니다. 인터넷 연결을 확인해주세요.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000); // Match Edge Function timeout

  const body: Record<string, unknown> = { image_base64: imageBase64 };
  if (lifestyle && Object.keys(lifestyle).length > 0) body.lifestyle = lifestyle;
  if (language) body.language = language;

  // supabase.functions.invoke handles auth automatically (session token or anon key fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doInvoke = () => (supabase.functions as any).invoke('analyze-skin', {
    body,
    signal: controller.signal,
  }) as Promise<{ data: AnalysisApiResponse | null; error: (Error & { name: string; context?: Response }) | null }>;

  try {
    let result = await doInvoke();

    // [PWA-FIX] Single retry on transient network drop (FunctionsFetchError, not a timeout abort).
    // Waits 1 000ms before the second attempt. AbortController timeout remains active across both.
    if (result.error?.name === 'FunctionsFetchError') {
      const isAbort = (result.error.context as unknown as Error | undefined)?.name === 'AbortError';
      if (isAbort) {
        throw new Error('분석 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      await new Promise<void>((r) => setTimeout(r, 1_000));
      result = await doInvoke();
    }

    if (result.error) {
      if (result.error.name === 'FunctionsHttpError') {
        // Extract the server's localized error message (e.g. face-not-detected)
        let errMsg = '서버 오류';
        try {
          const errBody = await result.error.context!.json() as { error?: string };
          errMsg = errBody.error ?? errMsg;
        } catch { /* ignore body parse failure */ }
        throw new Error(errMsg);
      }
      throw new Error(result.error.message ?? '서버 오류');
    }

    return result.data as AnalysisApiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Prompt 3.5 — Feedback service (v2: structured tags)
/**
 * Submits user accuracy feedback for a completed analysis.
 * Tags provide structured, machine-readable reasons for inaccuracy.
 * This data becomes high-confidence training data for Phase 2 custom model.
 */
export async function submitFeedback(
  analysisId: string,
  feedback: 'accurate' | 'inaccurate',
  comment?: string,
  tags?: string[],
): Promise<void> {
  // fire-and-forget — no error handling intentional
  await supabase.functions.invoke('analysis-feedback', {
    body: { analysis_id: analysisId, feedback, comment, tags },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: GDPR Two-Track Pipeline
//
// NOTE: user_consents, v_training_export, get_training_stats tables/views/functions
// are not in the auto-generated Database type yet. They exist in the DB (from
// migrations 002 + 003). To permanently fix these type errors:
//   npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
// Until then, we use explicit 'any' casts on .from() / .rpc() calls.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Grants a specific GDPR consent (photo_storage or ai_training).
 * Uses Supabase client directly (RLS enforces user_id = auth.uid()).
 * Returns the consent row ID on success.
 */
export async function grantConsent(
  consentType: 'photo_storage' | 'ai_training',
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[grantConsent] No authenticated user');
    return null;
  }

  // Check if active consent already exists (idempotent)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('user_consents')
    .select('id')
    .eq('user_id', user.id)
    .eq('consent_type', consentType)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (existing?.id) return existing.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_consents')
    .insert({
      user_id: user.id,
      consent_type: consentType,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[grantConsent] Failed for ${consentType}:`, (error as Error).message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Stores a training image for an analysis via the store-training-image Edge Function.
 * Requires authenticated user + active ai_training consent.
 * Uses the capturedImageBase64 already in memory (zero-friction — no re-capture).
 */
export async function storeTrainingImage(
  analysisId: string,
  imageBase64: string,
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('store-training-image', {
      body: { analysis_id: analysisId, image_base64: imageBase64 },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, storagePath: (data as { storage_path?: string })?.storage_path };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Fetches training pipeline statistics from the get_training_stats() DB function.
 * For admin dashboard use.
 */
export async function getTrainingStats(): Promise<Record<string, number> | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_training_stats');
  if (error) {
    console.error('[getTrainingStats] RPC error:', (error as Error).message);
    return null;
  }
  return data as Record<string, number>;
}

/**
 * Fetches training-ready records from v_training_export view.
 * Returns array of training data rows for JSONL export.
 */
export async function fetchTrainingExport(): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('v_training_export')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchTrainingExport] Query error:', (error as Error).message);
    return [];
  }
  return (data ?? []) as Record<string, unknown>[];
}

