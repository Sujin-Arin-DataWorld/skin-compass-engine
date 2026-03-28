// Prompt 3 — Frontend service for AI skin analysis
// Calls Supabase Edge Functions as a secure proxy to Groq API.
// Phase 2: Added consent management and training image storage.

import type { AnalysisApiResponse } from '@/types/skinAnalysis';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  const timeoutId = setTimeout(() => controller.abort(), 45_000);  // Match Edge Function timeout

  // Forward user's auth token if logged in, otherwise use anon key
  let authToken = SUPABASE_ANON_KEY;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Validate token hasn't expired (JWT exp is in seconds)
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > nowSec + 30) {
          // Token valid for at least 30 more seconds
          authToken = session.access_token;
        }
        // else: token expired or about to expire — use anon key
      } catch {
        // Malformed token — use anon key
      }
    }
  } catch {
    // Fall back to anon key — analysis still works for anonymous users
  }

  try {
    const body: Record<string, unknown> = { image_base64: imageBase64 };
    if (lifestyle && Object.keys(lifestyle).length > 0) {
      body.lifestyle = lifestyle;
    }
    if (language) {
      body.language = language;
    }

    const makeRequest = (token: string): Promise<Response> =>
      fetch(`${SUPABASE_URL}/functions/v1/analyze-skin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

    // [PWA-FIX] Single automatic retry on transient network drop (TypeError: Failed to fetch).
    // Waits 1 000ms before the second attempt. AbortController timeout remains active across both.
    let res: Response;
    try {
      res = await makeRequest(authToken);
    } catch (fetchErr) {
      if (fetchErr instanceof TypeError) {
        // Network drop — wait 1s then retry once
        await new Promise<void>((r) => setTimeout(r, 1_000));
        res = await makeRequest(authToken);
      } else {
        throw fetchErr;
      }
    }

    // [AUTH-FIX] If 401 and we used a user token, retry with anon key
    if (res.status === 401 && authToken !== SUPABASE_ANON_KEY) {
      console.warn('[SkinAnalysis] Auth token rejected (401), retrying with anon key...');
      res = await makeRequest(SUPABASE_ANON_KEY);
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = (err as { error?: string }).error ?? `서버 오류 (${res.status})`;
      // Surface the server's localized error message directly
      throw new Error(errorMsg);
    }

    return (await res.json()) as AnalysisApiResponse;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('분석 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    throw e;
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
  await fetch(`${SUPABASE_URL}/functions/v1/analysis-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ analysis_id: analysisId, feedback, comment, tags }),
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/store-training-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        analysis_id: analysisId,
        image_base64: imageBase64,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { success: false, error: body.error ?? `HTTP ${res.status}` };
    }

    return { success: true, storagePath: body.storage_path };
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

