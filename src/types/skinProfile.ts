// =================================================
// src/types/skinProfile.ts
// Shared types for skin profile persistence layer
// =================================================

/** 10-axis skin measurement scores, each 0-100 */
export interface SkinAxisScores {
  seb: number;
  hyd: number;
  bar: number;
  sen: number;
  acne: number;
  pigment: number;
  texture: number;
  aging: number;
  ox: number;
  makeup_stability: number;
}

/** Keys matching SkinAxisScores */
export type SkinAxis = keyof SkinAxisScores;

/** All 10 axis keys as array (useful for iteration) */
export const SKIN_AXES: SkinAxis[] = [
  'seb', 'hyd', 'bar', 'sen', 'acne',
  'pigment', 'texture', 'aging', 'ox', 'makeup_stability',
];

/** Mapping from SkinAxis key → DB column name */
export const AXIS_TO_DB_COLUMN: Record<SkinAxis, string> = {
  seb: 'score_sebum',
  hyd: 'score_hydration',
  bar: 'score_barrier',
  sen: 'score_sensitivity',
  acne: 'score_acne',
  pigment: 'score_pigment',
  texture: 'score_texture',
  aging: 'score_aging',
  ox: 'score_oxidation',
  makeup_stability: 'score_makeup_stability',
};

/** Reverse mapping: DB column → SkinAxis key */
export const DB_COLUMN_TO_AXIS: Record<string, SkinAxis> = Object.fromEntries(
  Object.entries(AXIS_TO_DB_COLUMN).map(([k, v]) => [v, k as SkinAxis])
) as Record<string, SkinAxis>;

/** Per-zone breakdown (7-zone face map) */
export interface ZoneScores {
  forehead: Partial<SkinAxisScores>;
  left_cheek: Partial<SkinAxisScores>;
  right_cheek: Partial<SkinAxisScores>;
  nose: Partial<SkinAxisScores>;
  chin: Partial<SkinAxisScores>;
  left_jawline: Partial<SkinAxisScores>;
  right_jawline: Partial<SkinAxisScores>;
}

export type ZoneName = keyof ZoneScores;

export const ZONE_NAMES: ZoneName[] = [
  'forehead', 'left_cheek', 'right_cheek',
  'nose', 'chin', 'left_jawline', 'right_jawline',
];

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';
export type AnalysisMethod = 'camera' | 'questionnaire';

export type SkinConcern =
  | 'acne' | 'dehydration' | 'pigmentation' | 'sensitivity'
  | 'aging' | 'barrier_damage' | 'excess_sebum' | 'texture' | 'oxidation';

/** Shape of a row in user_skin_profiles, after mapping to app types */
export interface UserSkinProfile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  scores: SkinAxisScores;
  zoneScores: ZoneScores | null;
  skinType: SkinType;
  primaryConcerns: SkinConcern[];
  analysisMethod: AnalysisMethod;
  confidenceScore: number | null;
  isActive: boolean;
}

// =================================================
// Helper: Convert a Supabase DB row → UserSkinProfile
// =================================================
export function mapDbRowToProfile(row: Record<string, unknown>): UserSkinProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    scores: {
      seb: row.score_sebum as number,
      hyd: row.score_hydration as number,
      bar: row.score_barrier as number,
      sen: row.score_sensitivity as number,
      acne: row.score_acne as number,
      pigment: row.score_pigment as number,
      texture: row.score_texture as number,
      aging: row.score_aging as number,
      ox: row.score_oxidation as number,
      makeup_stability: row.score_makeup_stability as number,
    },
    zoneScores: (row.zone_scores as ZoneScores) || null,
    skinType: row.skin_type as SkinType,
    primaryConcerns: (row.primary_concerns as SkinConcern[]) || [],
    analysisMethod: row.analysis_method as AnalysisMethod,
    confidenceScore: row.confidence_score as number | null,
    isActive: row.is_active as boolean,
  };
}

// =================================================
// Helper: Convert SkinAxisScores → flat DB column object
// =================================================
export function mapScoresToDbColumns(scores: SkinAxisScores): Record<string, number> {
  return {
    score_sebum: scores.seb,
    score_hydration: scores.hyd,
    score_barrier: scores.bar,
    score_sensitivity: scores.sen,
    score_acne: scores.acne,
    score_pigment: scores.pigment,
    score_texture: scores.texture,
    score_aging: scores.aging,
    score_oxidation: scores.ox,
    score_makeup_stability: scores.makeup_stability,
  };
}
