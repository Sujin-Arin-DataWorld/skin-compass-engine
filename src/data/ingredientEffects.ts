// =================================================
// src/data/ingredientEffects.ts
// Maps INCI ingredients → skin axis effects (+beneficial / -harmful)
// Used by compatibility scoring for ingredient-skin compatibility
// =================================================

import type { SkinAxis } from '@/types/skinProfile';

/**
 * Each ingredient maps to partial SkinAxis effects.
 * Values: +1 to +3 = beneficial, -1 to -3 = harmful.
 * Keys are lowercase, underscore-separated INCI-like names
 * to match against product ingredient lists.
 */
export const INGREDIENT_EFFECTS: Record<string, Partial<Record<SkinAxis, number>>> = {
  // ── Hydration & Barrier ──
  'hyaluronic_acid':       { hyd: +3, bar: +1 },
  'sodium_hyaluronate':    { hyd: +3, bar: +1 },
  'ceramide_np':           { bar: +3, hyd: +2, sen: +1 },
  'ceramide_ap':           { bar: +3, hyd: +2 },
  'ceramide_eop':          { bar: +3, hyd: +1 },
  'phytosphingosine':      { bar: +3, hyd: +2 },
  'cholesterol':           { bar: +2, hyd: +1 },
  'squalane':              { hyd: +2, bar: +2 },
  'glycerin':              { hyd: +2, bar: +1 },
  'panthenol':             { hyd: +2, bar: +2, sen: +1 },
  'betaine':               { hyd: +2, sen: +1 },
  'urea':                  { hyd: +2, texture: +1 },
  'shea_butter':           { hyd: +2, bar: +1 },
  'jojoba_oil':            { hyd: +1, bar: +1, seb: +1 },

  // ── Brightening & Anti-pigmentation ──
  'niacinamide':           { seb: +2, pigment: +2, bar: +1, texture: +1 },
  'ascorbic_acid':         { ox: +3, pigment: +2, aging: +1 },
  'ascorbyl_glucoside':    { ox: +2, pigment: +2 },
  'arbutin':               { pigment: +3 },
  'alpha_arbutin':         { pigment: +3 },
  'tranexamic_acid':       { pigment: +2 },
  'licorice_root_extract': { pigment: +2, sen: +1 },
  'glutathione':           { pigment: +2, ox: +1 },
  'kojic_acid':            { pigment: +2, sen: -1 },

  // ── Anti-aging ──
  'retinol':               { aging: +3, texture: +2, acne: +1, sen: -2 },
  'retinal':               { aging: +3, texture: +2, sen: -1 },
  'retinyl_palmitate':     { aging: +1, texture: +1 },
  'bakuchiol':             { aging: +2, texture: +1 },
  'peptide_complex':       { aging: +2, bar: +1 },
  'palmitoyl_tripeptide':  { aging: +2 },
  'adenosine':             { aging: +2, texture: +1 },
  'epidermal_growth_factor': { aging: +2, texture: +1, bar: +1 },

  // ── Acne & Sebum Control ──
  'salicylic_acid':        { acne: +3, seb: +2, texture: +1, sen: -1 },
  'benzoyl_peroxide':      { acne: +3, seb: +1, sen: -2, hyd: -1 },
  'tea_tree_oil':          { acne: +2, seb: +1, sen: -1 },
  'azelaic_acid':          { acne: +2, pigment: +1, texture: +1 },
  'zinc_pca':              { seb: +2, acne: +1 },
  'sulfur':                { acne: +2, seb: +2, hyd: -1 },
  'witch_hazel':           { seb: +1, acne: +1, hyd: -1 },

  // ── Soothing & Sensitivity ──
  'centella_asiatica':     { sen: +2, bar: +2, acne: +1 },
  'madecassoside':         { sen: +2, bar: +2 },
  'asiaticoside':          { sen: +2, bar: +1 },
  'allantoin':             { sen: +2, bar: +1 },
  'bisabolol':             { sen: +2 },
  'calendula_extract':     { sen: +2, bar: +1 },
  'aloe_vera':             { sen: +1, hyd: +1 },
  'chamomile_extract':     { sen: +2 },
  'mugwort_extract':       { sen: +2, acne: +1 },

  // ── Antioxidant ──
  'tocopherol':            { ox: +2, aging: +1 },
  'tocopheryl_acetate':    { ox: +2 },
  'resveratrol':           { ox: +2, aging: +1 },
  'green_tea_extract':     { ox: +2, sen: +1 },
  'ferulic_acid':          { ox: +2, pigment: +1 },
  'coenzyme_q10':          { ox: +2, aging: +1 },
  'astaxanthin':           { ox: +3, aging: +1 },

  // ── Texture & Exfoliation ──
  'glycolic_acid':         { texture: +3, pigment: +1, sen: -1 },
  'lactic_acid':           { texture: +2, hyd: +1, sen: -1 },
  'mandelic_acid':         { texture: +2, pigment: +1 },
  'pha_gluconolactone':    { texture: +2, hyd: +1 },
  'polyhydroxy_acid':      { texture: +2, hyd: +1 },

  // ── Makeup Stability ──
  'dimethicone':           { makeup_stability: +2, bar: +1 },
  'cyclopentasiloxane':    { makeup_stability: +2 },
  'silica':                { makeup_stability: +1, seb: +1 },
  'polymethyl_methacrylate': { makeup_stability: +2, texture: +1 },

  // ── Potentially Irritating ──
  'alcohol_denat':         { sen: -2, bar: -2, hyd: -1 },
  'denatured_alcohol':     { sen: -2, bar: -2, hyd: -1 },
  'fragrance':             { sen: -1 },
  'parfum':                { sen: -1 },
  'essential_oil_blend':   { sen: -1 },
  'sodium_lauryl_sulfate': { sen: -2, bar: -2 },
  'sodium_laureth_sulfate': { sen: -1, bar: -1 },
  'menthol':               { sen: -1 },
  'camphor':               { sen: -1 },
  'citrus_oil':            { sen: -1, pigment: -1 },
  'linalool':              { sen: -1 },
  'limonene':              { sen: -1 },
};

// ── Safety flag ingredients (high-caution list) ──
// Ingredients with EWG high hazard or known allergen potential
export const CAUTION_INGREDIENTS: Set<string> = new Set([
  'alcohol_denat',
  'denatured_alcohol',
  'sodium_lauryl_sulfate',
  'formaldehyde',
  'hydroquinone',
  'triclosan',
  'oxybenzone',
  'parabens',
  'methylisothiazolinone',
  'benzalkonium_chloride',
  'coal_tar',
  'diethanolamine',
  'phthalates',
  'toluene',
  'resorcinol',
  'petroleum_distillates',
  'butylated_hydroxyanisole',
  'ethanolamines',
  'fragrance',
  'parfum',
]);

/**
 * Normalize a raw INCI ingredient string to a lookup key.
 * Example: "Hyaluronic Acid" → "hyaluronic_acid"
 *          "Ceramide NP" → "ceramide_np"
 */
export function normalizeIngredient(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[(),-]/g, ' ')    // Remove punctuation
    .replace(/\s+/g, '_')       // Spaces → underscores
    .replace(/_+/g, '_')        // Collapse multiple underscores
    .replace(/^_|_$/g, '');     // Trim leading/trailing underscores
}
