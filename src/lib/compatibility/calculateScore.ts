// =================================================
// src/lib/compatibility/calculateScore.ts
// Pure function: UserSkinProfile × Product → 0-100 compatibility score
// =================================================

import type { UserSkinProfile, SkinAxis } from '@/types/skinProfile';
import type { Product, AxisKey } from '@/engine/types';
import {
  BENEFICIAL_INGREDIENTS,
  CONTRAINDICATED_MAP,
  countIngredientMatches,
  ingredientListContains,
} from './ingredientLookup';

// ── Result type ──────────────────────────────────────────────────────────────

export interface CompatibilityResult {
  /** Final score 0-100 */
  total: number;
  /** Factor 1: Ingredient match (0-100, weight 55%) */
  ingredientScore: number;
  /** Factor 2: Profile/axis alignment (0-100, weight 30%) */
  profileScore: number;
  /** Factor 3: Safety/contraindication (0-100, weight 15%) */
  safetyScore: number;
  /** Human-readable flags for UI display */
  flags: CompatibilityFlag[];
}

export interface CompatibilityFlag {
  type: 'positive' | 'caution' | 'negative';
  message: string;
}

// ── Weight constants ─────────────────────────────────────────────────────────

const W_INGREDIENT = 0.55;
const W_PROFILE    = 0.30;
const W_SAFETY     = 0.15;

/** Threshold: axes with score >= this are "high concern" */
const HIGH_CONCERN_THRESHOLD = 50;

/** Sensitivity/barrier thresholds for safety penalties */
const SAFETY_HIGH_THRESHOLD = 70;

// ── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(v)));

/**
 * Map SkinAxis (skinProfile.ts) → AxisKey (engine/types.ts).
 * They're identical except the type aliases come from different files.
 */
function skinAxisToAxisKey(axis: SkinAxis): AxisKey {
  return axis as unknown as AxisKey;
}

/**
 * Get the user's high-concern axes (score >= threshold), sorted descending.
 */
function getHighConcernAxes(
  profile: UserSkinProfile,
  threshold = HIGH_CONCERN_THRESHOLD,
): SkinAxis[] {
  const entries = Object.entries(profile.scores) as [SkinAxis, number][];
  return entries
    .filter(([, score]) => score >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([axis]) => axis);
}

/**
 * Build a flat ingredient name list from the product.
 * Uses key_ingredients (always present) as the primary source.
 */
function getProductIngredientNames(product: Product): string[] {
  // key_ingredients is the reliable field available on all products
  return product.key_ingredients ?? [];
}

// ── Factor 1: Ingredient Match (55%) ─────────────────────────────────────────

function calcIngredientScore(
  profile: UserSkinProfile,
  product: Product,
  flags: CompatibilityFlag[],
): number {
  const highConcernAxes = getHighConcernAxes(profile);
  if (highConcernAxes.length === 0) return 50; // neutral baseline

  const productIngredients = getProductIngredientNames(product);
  if (productIngredients.length === 0) return 40;

  // Collect all beneficial ingredients across the user's concern axes
  // De-duplicate by normalized name
  const beneficialSet = new Set<string>();
  for (const axis of highConcernAxes) {
    const beneficial = BENEFICIAL_INGREDIENTS[axis] ?? [];
    for (const ing of beneficial) {
      beneficialSet.add(ing.toLowerCase());
    }
  }

  if (beneficialSet.size === 0) return 50;

  const beneficialArray = Array.from(beneficialSet);
  const matched = countIngredientMatches(productIngredients, beneficialArray);
  const ratio = matched / Math.min(beneficialArray.length, 8); // cap denominator to avoid dilution

  if (matched >= 3) {
    flags.push({
      type: 'positive',
      message: `Contains ${matched} beneficial ingredients for your concerns`,
    });
  }

  return clamp(ratio * 100);
}

// ── Factor 2: Profile Match (30%) ────────────────────────────────────────────

function calcProfileScore(
  profile: UserSkinProfile,
  product: Product,
  flags: CompatibilityFlag[],
): number {
  let score = 0;

  // ── Axis overlap (20 of 30 points → scaled to 0-100) ──
  const highConcernAxes = getHighConcernAxes(profile);
  const productAxes = product.target_axes ?? [];

  if (productAxes.length > 0 && highConcernAxes.length > 0) {
    const overlap = productAxes.filter(pa =>
      highConcernAxes.some(ca => skinAxisToAxisKey(ca) === pa),
    ).length;
    const axisRatio = overlap / Math.min(productAxes.length, highConcernAxes.length);
    score += axisRatio * 66.7; // axis overlap is 2/3 of profile score

    if (overlap >= 2) {
      flags.push({
        type: 'positive',
        message: `Targets ${overlap} of your concern areas`,
      });
    }
  } else {
    score += 33; // neutral if no data
  }

  // ── Skin type match (10 of 30 points → scaled to 0-100) ──
  const forSkin = product.for_skin ?? [];
  if (forSkin.length > 0) {
    const userSkinType = profile.skinType;
    if (forSkin.includes(userSkinType)) {
      score += 33.3; // full match
    } else if (forSkin.includes('all')) {
      score += 22.2; // partial — product is for "all" skin types
    } else {
      score += 5; // minimal score — mismatch
      flags.push({
        type: 'caution',
        message: `Designed for ${forSkin.join('/')} skin, yours is ${userSkinType}`,
      });
    }
  } else {
    score += 16.7; // neutral if no for_skin data
  }

  return clamp(score);
}

// ── Factor 3: Safety (15%) ───────────────────────────────────────────────────

function calcSafetyScore(
  profile: UserSkinProfile,
  product: Product,
  flags: CompatibilityFlag[],
): number {
  let score = 100;
  const productIngredients = getProductIngredientNames(product);

  // Check sensitivity contraindications
  if (profile.scores.sen >= SAFETY_HIGH_THRESHOLD) {
    const badIngredients = CONTRAINDICATED_MAP.high_sensitivity;
    const found = badIngredients.filter(bad =>
      ingredientListContains(productIngredients, bad),
    );
    if (found.length > 0) {
      score -= found.length * 20;
      flags.push({
        type: 'negative',
        message: `Contains ${found.join(', ')} — may irritate sensitive skin`,
      });
    }
  }

  // Check barrier damage contraindications
  if (profile.scores.bar >= SAFETY_HIGH_THRESHOLD) {
    const badIngredients = CONTRAINDICATED_MAP.high_barrier_damage;
    const found = badIngredients.filter(bad =>
      ingredientListContains(productIngredients, bad),
    );
    if (found.length > 0) {
      score -= found.length * 15;
      flags.push({
        type: 'negative',
        message: `Contains exfoliants — may worsen barrier damage`,
      });
    }
  }

  // Check acne-prone contraindications
  if (profile.scores.acne >= SAFETY_HIGH_THRESHOLD) {
    const badIngredients = CONTRAINDICATED_MAP.high_acne;
    const found = badIngredients.filter(bad =>
      ingredientListContains(productIngredients, bad),
    );
    if (found.length > 0) {
      score -= found.length * 15;
      flags.push({
        type: 'caution',
        message: `Contains comedogenic ingredients — may clog pores`,
      });
    }
  }

  return clamp(score);
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Calculate how compatible a product is with a user's skin profile.
 *
 * @param profile - The user's active skin profile (from Phase 1)
 * @param product - A product from the product database
 * @returns CompatibilityResult with total score (0-100), sub-scores, and flags
 *
 * Scoring weights:
 *  - Ingredient Match: 55%
 *  - Profile Match:    30%
 *  - Safety:           15%
 *
 * Pure function — no side effects, no DB calls.
 */
export function calculateCompatibilityScore(
  profile: UserSkinProfile,
  product: Product,
): CompatibilityResult {
  const flags: CompatibilityFlag[] = [];

  const ingredientScore = calcIngredientScore(profile, product, flags);
  const profileScore = calcProfileScore(profile, product, flags);
  const safetyScore = calcSafetyScore(profile, product, flags);

  const total = clamp(
    ingredientScore * W_INGREDIENT +
    profileScore * W_PROFILE +
    safetyScore * W_SAFETY,
  );

  return {
    total,
    ingredientScore,
    profileScore,
    safetyScore,
    flags,
  };
}

/**
 * Score and sort an entire product array by compatibility.
 * Returns products sorted best-match-first with their scores attached.
 */
export function rankProductsByCompatibility(
  profile: UserSkinProfile,
  products: Product[],
): Array<{ product: Product; score: CompatibilityResult }> {
  return products
    .map(product => ({
      product,
      score: calculateCompatibilityScore(profile, product),
    }))
    .sort((a, b) => b.score.total - a.score.total);
}
