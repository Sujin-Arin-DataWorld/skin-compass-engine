/**
 * productBridge.ts
 *
 * Single source of truth bridging product_db_merged.json → routineEngine.
 *
 * Responsibilities:
 *   1. Normalize flat DB fields (name_en, name_de, name_kr) → unified RealProduct
 *   2. Map 23+ granular routine_slots → 7 engine slots
 *   3. Map target_profiles → engine skin types (BaseType)
 *   4. Score & rank products by skin_concerns → weak-axis match
 *   5. Provide lookup helpers: by ID, price, slot
 *
 * This module replaces:
 *   - MockProduct interface + CATALOG + HERO_PRODUCT (routineEngine.ts)
 *   - MOCK_PRODUCT_PRICES (sharedResultsData.ts)
 */

import productDB from '@/data/product_db_merged.json';

// ─── RealProduct interface ──────────────────────────────────────────────────

export interface RealProduct {
  id: string;
  name: { en: string; de: string; ko: string };
  brand: string;
  /** Normalized engine slot: cleanser | toner | serum | treatment | moisturizer | spf | device */
  routine_slot: string;
  skin_concerns: string[];
  /** Normalized from target_profiles */
  for_skin: string[];
  price_eur: number;
  /** Extracted ingredient names for safety-gate matching */
  key_ingredients: string[];
  /** DB slot before normalization */
  _raw_slot: string;
  /** Texture type from DB */
  texture_type: string | null;
}

// ─── Slot normalization map ─────────────────────────────────────────────────

const SLOT_NORMALIZE: Record<string, string> = {
  // Cleansers
  cleanser:             'cleanser',
  cleanser_oil:         'cleanser',
  cleanser_foam:        'cleanser',
  // Toners
  toner:                'toner',
  toner_exfoliant:      'toner',
  toner_hydrating:      'toner',
  toner_essence:        'toner',
  // Essences → toner slot (layering step between toner and serum)
  essence:              'toner',
  // Serums
  serum:                'serum',
  serum_am:             'serum',
  serum_pm:             'serum',
  serum_am_pm:          'serum',
  serum_brightening:    'serum',
  serum_barrier:        'serum',
  serum_spot:           'serum',
  // Treatments
  treatment:            'treatment',
  eye_cream:            'treatment',
  neck_cream:           'treatment',
  // Moisturizers
  moisturizer:          'moisturizer',
  moisturizer_light:    'moisturizer',
  moisturizer_rich:     'moisturizer',
  moisturizer_gel:      'moisturizer',
  moisturizer_allinone: 'moisturizer',
  moisturizer_night:    'moisturizer',
  cream:                'moisturizer',
  // SPF
  spf:                  'spf',
  sunscreen:            'spf',
  sunscreen_chemical:   'spf',
  sunscreen_physical:   'spf',
  // Masks → treatment
  mask_sheet:           'treatment',
  mask_modeling:        'treatment',
  mask_sleeping:        'treatment',
  // Device
  device:               'device',
};

// ─── Target profile → engine skin type mapping ─────────────────────────────

const PROFILE_TO_SKIN: Record<string, string[]> = {
  oily_acne:        ['oily', 'combination-dehydrated-oily'],
  combination:      ['combination-dehydrated-oily', 'normal'],
  dehydrated_oily:  ['combination-dehydrated-oily'],
  dry_barrier:      ['dry'],
  dry_sensitive:    ['dry'],
  sensitive:        [],                // compatible with all skin types
  aging_elasticity: [],
  dullness:         [],
  pigmentation:     [],
  post_menopause:   ['dry', 'normal'],
  mens:             ['oily', 'normal'],
};

// ─── Skin concern → engine axis mapping ─────────────────────────────────────

const CONCERN_TO_AXIS: Record<string, string> = {
  dehydration:         'hyd',
  barrier_damage:      'bar',
  acne:                'acne',
  excess_sebum:        'seb',
  hyperpigmentation:   'pigment',
  uneven_tone:         'pigment',
  PIH:                 'pigment',
  dark_spots:          'pigment',
  fine_lines:          'aging',
  wrinkles:            'aging',
  loss_of_elasticity:  'aging',
  sun_damage:          'ox',
  sensitivity:         'sen',
  redness:             'sen',
  irritation:          'sen',
  large_pores:         'texture',
  rough_texture:       'texture',
  pores:               'texture',
  blackheads:          'texture',
  dullness:            'ox',
  texture:             'texture',
};

// ─── Name normalization ──────────────────────────────────────────────────────

function normalizeName(p: Record<string, unknown>): { en: string; de: string; ko: string } {
  if (typeof p.name === 'object' && p.name !== null && (p.name as Record<string, string>).en) {
    return p.name as { en: string; de: string; ko: string };
  }
  return {
    en: (p.name_en as string) || (p.name as string) || '?',
    de: (p.name_de as string) || (p.name_en as string) || '?',
    ko: (p.name_kr as string) || (p.name_en as string) || '?',
  };
}

// ─── Extract key ingredient names from structured ingredients array ──────────

function extractIngredientNames(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) return [];
  return ingredients
    .map((ing: Record<string, unknown>) => {
      const name = (ing.name_en as string) || (ing.name_inci as string) || '';
      const conc = ing.concentration_pct as number | null;
      if (conc && conc > 0) return `${name} ${conc}%`;
      return name;
    })
    .filter(Boolean);
}

// ─── Normalize for_skin from target_profiles ────────────────────────────────

function normalizeForSkin(targetProfiles: string[] | null): string[] {
  if (!targetProfiles || targetProfiles.length === 0) return [];
  const skinTypes = new Set<string>();
  for (const profile of targetProfiles) {
    const mapped = PROFILE_TO_SKIN[profile];
    if (mapped) {
      for (const st of mapped) skinTypes.add(st);
    }
  }
  return [...skinTypes];
}

// ─── Build product catalog ──────────────────────────────────────────────────

const rawProducts = (productDB as Record<string, unknown>).products as Record<string, unknown>[] ??
  (Array.isArray(productDB) ? productDB : []);

export const products: RealProduct[] = rawProducts.map((p) => ({
  id: p.id as string,
  name: normalizeName(p),
  brand: (p.brand as string) || '?',
  routine_slot: SLOT_NORMALIZE[(p.routine_slot as string) || ''] || 'serum',
  skin_concerns: (p.skin_concerns as string[]) || [],
  for_skin: normalizeForSkin(p.target_profiles as string[] | null),
  price_eur: (p.price_eur as number) ?? 0,
  key_ingredients: extractIngredientNames(p.ingredients),
  _raw_slot: (p.routine_slot as string) || '',
  texture_type: (p.texture_type as string) || null,
}));

// ─── Lookup helpers ─────────────────────────────────────────────────────────

const productById = new Map<string, RealProduct>(products.map((p) => [p.id, p]));

export function getProductById(id: string): RealProduct | undefined {
  return productById.get(id);
}

export function getRealProductPrice(productId: string): number {
  return productById.get(productId)?.price_eur ?? 0;
}

// ─── Core: findProductsForSlot ──────────────────────────────────────────────

/**
 * Finds and scores all products matching an engine slot.
 *
 * Scoring:
 *   - +10 for each skin_concern that maps to a weak axis
 *   - +5 for skin type compatibility (for_skin match)
 *   - Products are returned sorted by score (best match first)
 *
 * @param slot      Engine slot: cleanser | toner | serum | treatment | moisturizer | spf | device
 * @param weakAxes  Axes with healthScore < 50 (from getWeakAxes)
 * @param skinType  Engine BaseType: oily | combination-dehydrated-oily | dry | normal
 */
export function findProductsForSlot(
  slot: string,
  weakAxes: string[],
  skinType?: string,
): RealProduct[] {
  return products
    .filter((p) => {
      if (p.routine_slot !== slot) return false;
      // Skin type filtering: if product has for_skin specified and doesn't include user's type → skip
      if (skinType && p.for_skin.length > 0 && !p.for_skin.includes(skinType)) return false;
      return true;
    })
    .map((p) => {
      let matchScore = 0;
      // Score by concern → axis match
      for (const concern of p.skin_concerns) {
        const axis = CONCERN_TO_AXIS[concern];
        if (axis && weakAxes.includes(axis)) matchScore += 10;
      }
      // Bonus for skin type compatibility
      if (skinType && p.for_skin.includes(skinType)) matchScore += 5;
      return { ...p, _matchScore: matchScore };
    })
    .sort((a, b) => (b as { _matchScore: number })._matchScore - (a as { _matchScore: number })._matchScore);
}

// ─── SOS-specific lookup ────────────────────────────────────────────────────

/** SOS product IDs — used by buildSkinRescueProtocol */
export const SOS_IDS = {
  // Dongkook Pharm — Madeca MD (oily / combination-dehydrated)
  madeca_cleanser:  'KR_madeca_md_cleanser',
  madeca_serum:     'KR_madeca_md_serum',
  madeca_cream:     'KR_madeca_md_cream',
  // Aestura — Atobarrier 365 (dry / normal)
  aestura_cleanser: 'KR_aestura_atobarrier_cleanser',
  aestura_serum:    'KR_aestura_atobarrier_serum',
  aestura_cream:    'KR_aestura_atobarrier_cream',
} as const;

/** Device ID */
export const DEVICE_ID = 'KR_medicube_booster_pro';

// ─── Weak axis derivation ───────────────────────────────────────────────────

/**
 * Converts V5 health scores to a list of weak axes (score < 50).
 * This replaces manual trouble → product matching.
 */
export function getWeakAxes(healthScores: Record<string, number>): string[] {
  return Object.entries(healthScores)
    .filter(([, score]) => score < 50)
    .map(([axis]) => axis);
}
