/**
 * PRODUCT RECOMMENDATION ENGINE
 *
 * Matches AI skin analysis scores to real products from product_db_merged.json.
 * Uses `skin_concerns` field in the product DB to find relevant recommendations.
 *
 * Score → Concern mapping:
 *   HIGH_IS_BAD axes (seb, sen, acne, pigment, texture, aging, ox):
 *     health score < 45 → needs care for that concern
 *   LOW_IS_BAD axes (hyd, bar, makeup_stability):
 *     health score < 45 → needs care for that concern
 *
 * Health score = toHealthScore(axis, rawScore)
 */
import type { SkinAxisScores } from '@/types/skinAnalysis';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import productDbJson from '@/data/product_db_merged.json';

/** Axis Korean label for display in product badges */
export const AXIS_KO_SHORT: Record<string, string> = {
  seb: '피지',
  hyd: '수분',
  bar: '장벽',
  sen: '민감도',
  acne: '트러블',
  pigment: '색소',
  texture: '피부결',
  aging: '노화',
  ox: '산화',
  makeup_stability: '화장지속',
};

// ── Score axis → product skin_concern mapping ─────────────────────────────
const AXIS_TO_CONCERNS: Record<string, string[]> = {
  seb: ['excess_sebum', 'pores'],
  hyd: ['dehydration', 'barrier_damage'],
  bar: ['barrier_damage', 'irritation', 'redness'],
  sen: ['irritation', 'redness'],
  acne: ['acne', 'pores', 'excess_sebum'],
  pigment: ['dark_spots', 'PIH', 'uneven_tone', 'dullness'],
  texture: ['pores', 'dullness'],
  aging: ['fine_lines', 'wrinkles', 'elasticity_loss'],
  ox: ['dullness', 'uv_protection', 'dark_spots'],
  makeup_stability: ['excess_sebum', 'pores', 'dehydration'],
};

const HIGH_IS_BAD = new Set(['seb', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox']);

function toHealthScore(key: string, value: number): number {
  return HIGH_IS_BAD.has(key) ? 100 - value : value;
}

// ── Product interface (minimal for recommendation) ────────────────────────
export interface RecommendedProduct {
  id: string;
  name: { ko: string; en: string; de: string };
  brand: string;
  priceEur: number;
  routineSlot: string;
  oneLiner: { ko: string; en: string; de: string };
  matchedConcerns: string[];
  matchScore: number; // higher = better match
  targetAxes: string[];
}

/**
 * Get product recommendations based on AI scores.
 * Returns max 5 products, prioritized by match score.
 */
export function getRecommendedProducts(
  scores: SkinAxisScores,
  maxCount = 5,
): RecommendedProduct[] {
  // 1. Find axes that need care (healthScore < 50)
  const weakAxes: { axis: string; healthScore: number; concerns: string[] }[] = [];
  for (const [axis, rawScore] of Object.entries(scores)) {
    const hs = toHealthScore(axis, rawScore);
    if (hs < 50) {
      weakAxes.push({
        axis,
        healthScore: hs,
        concerns: AXIS_TO_CONCERNS[axis] ?? [],
      });
    }
  }

  // Sort by worst health score first
  weakAxes.sort((a, b) => a.healthScore - b.healthScore);

  // 2. Collect all relevant concerns
  const relevantConcerns = new Set(weakAxes.flatMap(a => a.concerns));
  if (relevantConcerns.size === 0) return [];

  // 3. Match products from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProducts: any[] = (productDbJson as any).products ?? [];

  const scored: RecommendedProduct[] = [];
  for (const p of allProducts) {
    const productConcerns: string[] = p.skin_concerns ?? [];
    const matched = productConcerns.filter(c => relevantConcerns.has(c));
    if (matched.length === 0) continue;

    // Calculate match score: more matched concerns = higher score
    // Also weight by how severe the user's concern is
    let matchScore = 0;
    const targetAxes: string[] = [];
    for (const wa of weakAxes) {
      const overlap = wa.concerns.filter(c => matched.includes(c));
      if (overlap.length > 0) {
        matchScore += overlap.length * (50 - wa.healthScore); // worse = higher weight
        targetAxes.push(wa.axis);
      }
    }

    scored.push({
      id: p.id,
      name: {
        ko: p.name_kr ?? p.name_en,
        en: p.name_en ?? p.id,
        de: p.name_de ?? p.name_en,
      },
      brand: p.brand ?? '',
      priceEur: p.price_eur ?? 0,
      routineSlot: p.routine_slot ?? '',
      oneLiner: {
        ko: p.one_liner_kr ?? '',
        en: p.one_liner_en ?? '',
        de: p.one_liner_de ?? '',
      },
      matchedConcerns: matched,
      matchScore,
      targetAxes: [...new Set(targetAxes)],
    });
  }

  // 4. Sort by match score, deduplicate by routine_slot, take top N
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Prefer diverse routine slots (don't recommend 3 serums)
  const seen = new Set<string>();
  const result: RecommendedProduct[] = [];
  for (const p of scored) {
    const slotKey = p.routineSlot.replace(/_am|_pm|_am_pm|_spot/, '');
    if (!seen.has(slotKey)) {
      result.push(p);
      seen.add(slotKey);
      if (result.length >= maxCount) break;
    }
  }

  // If not enough diverse slots, fill with best remaining
  if (result.length < maxCount) {
    for (const p of scored) {
      if (!result.find(r => r.id === p.id)) {
        result.push(p);
        if (result.length >= maxCount) break;
      }
    }
  }

  return result;
}

// ── Legacy PRODUCT_RULES export for backward compatibility ────────────────
// This is kept so any existing imports don't break.
import type { ProductRule } from '@/types/skinAnalysis';
export const PRODUCT_RULES: ProductRule[] = [];
