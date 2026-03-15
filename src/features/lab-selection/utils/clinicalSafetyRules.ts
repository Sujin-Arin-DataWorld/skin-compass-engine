/**
 * src/features/lab-selection/utils/clinicalSafetyRules.ts
 *
 * 5 clinical safety rules validated by dermatology review.
 * These are NOT optional UX features — they protect users from skin damage.
 *
 * Integration points are wired in Steps 7 (ZoneLabFlow) and 8 (RoutineBuilder).
 * This file only exports the pure utility functions.
 */

import { Product, RoutineStep, FinalRoutine, RequiredIngredient } from '../types';

// ============================================================
// RULE 1: Cumulative Irritation Load Counter
// ============================================================
// A user could select BHA + PHA toner + Retinol in the SAME routine.
// Each is safe individually, but combined irritation exceeds skin's tolerance,
// causing contact dermatitis.
//
// If ≥ 2 turnover actives in same slot → warning.
// If ≥ 3 → hard block + force swap.

const TURNOVER_INGREDIENTS = [
  'Salicylic Acid',    // BHA
  'Glycolic Acid',     // AHA
  'Lactic Acid',       // AHA
  'Mandelic Acid',     // AHA
  'Retinol',           // Retinoid
  'Retinaldehyde',     // Retinoid
  'Tretinoin',         // Retinoid (prescription)
  'Adapalene',         // Retinoid
  'LHA',               // Lipohydroxy acid
  'Polyhydroxy Acid',  // PHA
  'Gluconolactone',    // PHA
  'Azelaic Acid',      // Mild exfoliant (counts at 15%+)
];

export interface IrritationCheckResult {
  am_count: number;
  pm_count: number;
  am_products: string[];  // product IDs contributing to AM irritation
  pm_products: string[];
  status: 'safe' | 'warning' | 'blocked';
  warning_key: string | null;
}

export function checkCumulativeIrritation(routine: FinalRoutine): IrritationCheckResult {
  const countActives = (steps: RoutineStep[]): { count: number; ids: string[] } => {
    const found: string[] = [];
    for (const step of steps) {
      const hasTurnover = step.product.ingredients.some((ing) =>
        TURNOVER_INGREDIENTS.some((t) =>
          ing.name_en.toLowerCase().includes(t.toLowerCase())
        )
      );
      if (hasTurnover) found.push(step.product.id);
    }
    return { count: found.length, ids: found };
  };

  const am = countActives(routine.am_routine);
  const pm = countActives(routine.pm_routine);
  const maxCount = Math.max(am.count, pm.count);

  return {
    am_count: am.count,
    pm_count: pm.count,
    am_products: am.ids,
    pm_products: pm.ids,
    status: maxCount >= 3 ? 'blocked' : maxCount >= 2 ? 'warning' : 'safe',
    warning_key:
      maxCount >= 3
        ? 'lab.safety.irritation_blocked'
        : maxCount >= 2
        ? 'lab.safety.irritation_warning'
        : null,
  };
}


// ============================================================
// RULE 2: Pregnancy & Lactation Hard Filter
// ============================================================
// Retinoids are teratogenic (NCBI, ACOG, EMA all confirm).
// Topical retinol is contraindicated during pregnancy per ACOG guidelines.
// High-dose oral vitamin A and isotretinoin are Category X.
//
// If user indicates pregnancy/nursing, ALL retinoid products are hard-filtered.
// No override possible.
// Safe alternatives: Bakuchiol, Peptides, Azelaic Acid, Niacinamide, Vitamin C.

const PREGNANCY_BANNED_INGREDIENTS = [
  'Retinol',
  'Retinaldehyde',
  'Retinal',
  'Tretinoin',
  'Adapalene',
  'Tazarotene',
  'Isotretinoin',
  'Retinoic Acid',
  'Retinyl Palmitate',  // controversial but err on safe side
];

export function filterPregnancyUnsafe(
  products: Product[],
  isPregnantOrNursing: boolean
): { safe: Product[]; blocked: Product[]; alternatives_key: string | null } {
  if (!isPregnantOrNursing) {
    return { safe: products, blocked: [], alternatives_key: null };
  }

  const safe: Product[] = [];
  const blocked: Product[] = [];

  for (const product of products) {
    const hasRetinoid = product.ingredients.some((ing) =>
      PREGNANCY_BANNED_INGREDIENTS.some(
        (banned) =>
          ing.name_en.toLowerCase().includes(banned.toLowerCase()) ||
          ing.name_inci.toLowerCase().includes(banned.toLowerCase())
      )
    );

    if (hasRetinoid) {
      blocked.push(product);
    } else {
      safe.push(product);
    }
  }

  return {
    safe,
    blocked,
    alternatives_key: blocked.length > 0 ? 'lab.safety.pregnancy_alternatives' : null,
  };
}


// ============================================================
// RULE 3: Photosensitivity → Mandatory SPF Pairing
// ============================================================
// Retinol and exfoliating acids thin the stratum corneum, increasing UV
// vulnerability. Dermatologists MANDATE sunscreen when prescribing these.
//
// If PM routine contains photosensitizing ingredients, AM routine MUST have SPF.
// If SPF slot is empty → block save + show warning.

const PHOTOSENSITIZING_INGREDIENTS = [
  'Retinol',
  'Retinaldehyde',
  'Tretinoin',
  'Adapalene',
  'Glycolic Acid',
  'Lactic Acid',
  'Salicylic Acid',
  'Azelaic Acid',
  'L-Ascorbic Acid',
  'Benzoyl Peroxide',
];

export interface SpfCheckResult {
  pm_has_photosensitizer: boolean;
  am_has_spf: boolean;
  is_valid: boolean;
  warning_key: string | null;
  photosensitizing_products: string[];
}

export function checkSpfRequirement(routine: FinalRoutine): SpfCheckResult {
  const photosensitizers: string[] = [];

  for (const step of routine.pm_routine) {
    const hasPhoto = step.product.ingredients.some((ing) =>
      PHOTOSENSITIZING_INGREDIENTS.some((p) =>
        ing.name_en.toLowerCase().includes(p.toLowerCase())
      )
    );
    if (hasPhoto) photosensitizers.push(step.product.name_en);
  }

  const amHasSpf = routine.am_routine.some(
    (step) => step.product.routine_slot === 'spf'
  );

  return {
    pm_has_photosensitizer: photosensitizers.length > 0,
    am_has_spf: amHasSpf,
    is_valid: photosensitizers.length === 0 || amHasSpf,
    warning_key:
      photosensitizers.length > 0 && !amHasSpf
        ? 'lab.safety.spf_mandatory'
        : null,
    photosensitizing_products: photosensitizers,
  };
}


// ============================================================
// RULE 4: Rosacea-Prone Skin Separation
// ============================================================
// Rosacea-prone skin can react to niacinamide with severe stinging and flushing,
// even at 5%. Standard sensitive-skin protocol doesn't apply here.
//
// Detection: Diagnosis engine flags rosacea_prone based on questionnaire.
// Adjustment: Niacinamide capped at 2%. Primary actives: Azelaic Acid, Panthenol.

export interface RosaceaAdjustment {
  is_rosacea_prone: boolean;
  adjusted_ingredients: RequiredIngredient[];
  excluded_ingredients: string[];
  warning_key: string | null;
}

export function applyRosaceaFilter(
  ingredients: RequiredIngredient[],
  isRosaceaProne: boolean
): RosaceaAdjustment {
  if (!isRosaceaProne) {
    return {
      is_rosacea_prone: false,
      adjusted_ingredients: ingredients,
      excluded_ingredients: [],
      warning_key: null,
    };
  }

  const excluded: string[] = [];
  const adjusted = ingredients.map((ing) => {
    if (ing.name_en.toLowerCase().includes('niacinamide')) {
      if (ing.min_concentration !== null && ing.min_concentration > 2.0) {
        excluded.push(`Niacinamide (reduced from ${ing.min_concentration}% to 2%)`);
        return { ...ing, min_concentration: 2.0, max_concentration: 2.0 };
      }
    }
    return ing;
  });

  return {
    is_rosacea_prone: true,
    adjusted_ingredients: adjusted,
    excluded_ingredients: excluded,
    warning_key: 'lab.safety.rosacea_niacin_cap',
  };
}


// ============================================================
// RULE 5: Ceramide Complex Compliance Scoring
// ============================================================
// For barrier=extreme, single Ceramide NP is insufficient.
// Full repair requires the lipid triad: Ceramide + Cholesterol + Fatty Acids.
// Gold standard: 2:4:2 ratio. 5-Ceramide complexes score even higher.
//
// Scoring when barrier severity is 'severe' or 'extreme':
//   All 3 lipid components → 100%
//   2 of 3 → 70%
//   Ceramide only → 40%
//   None → 0%

const LIPID_TRIAD = {
  ceramide: ['Ceramide NP', 'Ceramide NS', 'Ceramide AS', 'Ceramide EOP', 'Ceramide AP', 'Ceramide'],
  cholesterol: ['Cholesterol'],
  fatty_acid: ['Fatty Acid', 'Stearic Acid', 'Palmitic Acid', 'Oleic Acid', 'Linoleic Acid'],
};

export function scoreCeramideComplex(product: Product): {
  score: number;
  has_ceramide: boolean;
  has_cholesterol: boolean;
  has_fatty_acid: boolean;
  ceramide_count: number;
  is_full_complex: boolean;
} {
  const ingredientNames = product.ingredients.map((i) => i.name_en.toLowerCase());

  const hasCeramide = LIPID_TRIAD.ceramide.some((c) =>
    ingredientNames.some((n) => n.includes(c.toLowerCase()))
  );
  const hasCholesterol = LIPID_TRIAD.cholesterol.some((c) =>
    ingredientNames.some((n) => n.includes(c.toLowerCase()))
  );
  const hasFattyAcid = LIPID_TRIAD.fatty_acid.some((c) =>
    ingredientNames.some((n) => n.includes(c.toLowerCase()))
  );

  const ceramideCount = LIPID_TRIAD.ceramide.filter((c) =>
    ingredientNames.some((n) => n.includes(c.toLowerCase()))
  ).length;

  const componentCount = [hasCeramide, hasCholesterol, hasFattyAcid].filter(Boolean).length;
  let score = 0;
  if (componentCount === 3) score = 100;
  else if (componentCount === 2) score = 70;
  else if (componentCount === 1) score = 40;

  // Bonus for multi-ceramide complex (5D)
  if (ceramideCount >= 3) score = Math.min(100, score + 10);

  return {
    score,
    has_ceramide: hasCeramide,
    has_cholesterol: hasCholesterol,
    has_fatty_acid: hasFattyAcid,
    ceramide_count: ceramideCount,
    is_full_complex: componentCount === 3,
  };
}
