// Prompt 3 — Frontend service for AI skin analysis
// Calls Supabase Edge Functions as a secure proxy to Groq API.

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
): Promise<AnalysisApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  // Forward user's auth token if logged in, otherwise use anon key
  let authToken = SUPABASE_ANON_KEY;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch {
    // Fall back to anon key — analysis still works for anonymous users
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-skin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      if (res.status === 429)
        throw new Error('분석 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.');
      throw new Error(
        (err as { error?: string }).error ?? `서버 오류 (${res.status})`,
      );
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

// Prompt 3.5 — Feedback service
/**
 * Submits user accuracy feedback for a completed analysis.
 * This data becomes high-confidence training data for Phase 2 custom model.
 */
export async function submitFeedback(
  analysisId: string,
  feedback: 'accurate' | 'inaccurate',
  comment?: string,
): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/analysis-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ analysis_id: analysisId, feedback, comment }),
  });
}
