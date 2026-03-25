// =================================================
// src/lib/compatibility/ingredientLookup.ts
// Ingredient knowledge base for compatibility scoring
// =================================================

import type { SkinAxis } from '@/types/skinProfile';

/**
 * Beneficial ingredients per skin axis.
 * When a user has a high score (concern) on an axis,
 * these ingredients are what we WANT to see in a product.
 */
export const BENEFICIAL_INGREDIENTS: Record<SkinAxis, string[]> = {
  seb: [
    'salicylic acid', 'bha', 'niacinamide', 'zinc pca', 'zinc oxide',
    'green tea', 'camellia sinensis', 'tea tree', 'witch hazel',
  ],
  hyd: [
    'hyaluronic acid', 'sodium hyaluronate', 'panthenol', 'squalane',
    'glycerin', 'ceramide', 'ectoin', 'beta-glucan', 'aloe',
  ],
  bar: [
    'ceramide', 'cholesterol', 'phytosphingosine', 'fatty acid',
    'squalane', 'panthenol', 'madecassoside', 'centella',
    'shea butter', 'allantoin',
  ],
  sen: [
    'centella', 'cica', 'madecassoside', 'asiaticoside', 'panthenol',
    'allantoin', 'bisabolol', 'oat', 'chamomile', 'aloe',
    'ceramide',
  ],
  acne: [
    'salicylic acid', 'bha', 'niacinamide', 'zinc pca', 'tea tree',
    'benzoyl peroxide', 'azelaic acid', 'retinol',
  ],
  pigment: [
    'niacinamide', 'tranexamic acid', 'arbutin', 'alpha-arbutin',
    'vitamin c', 'ascorbic acid', 'azelaic acid', 'licorice',
    'kojic acid',
  ],
  texture: [
    'retinol', 'retinal', 'aha', 'glycolic acid', 'lactic acid',
    'azelaic acid', 'niacinamide', 'peptide',
  ],
  aging: [
    'retinol', 'retinal', 'peptide', 'palmitoyl', 'matrixyl',
    'vitamin c', 'ascorbic acid', 'adenosine', 'collagen',
    'ferulic acid', 'coenzyme q10',
  ],
  ox: [
    'vitamin c', 'ascorbic acid', 'vitamin e', 'tocopherol',
    'ferulic acid', 'resveratrol', 'green tea', 'niacinamide',
    'coenzyme q10',
  ],
  makeup_stability: [
    'niacinamide', 'zinc pca', 'silica', 'dimethicone',
    'kaolin', 'mattifying',
  ],
};

/**
 * Ingredients that are potentially harmful given certain skin conditions.
 * Key = condition, value = ingredients to penalize.
 */
export const CONTRAINDICATED_MAP: Record<string, string[]> = {
  high_sensitivity: [
    'retinol', 'retinal', 'glycolic acid', 'aha', 'salicylic acid', 'bha',
    'benzoyl peroxide', 'l-ascorbic acid', 'vitamin c',
    'alcohol denat', 'fragrance', 'parfum', 'linalool', 'limonene',
  ],
  high_barrier_damage: [
    'retinol', 'retinal', 'glycolic acid', 'aha', 'salicylic acid', 'bha',
    'benzoyl peroxide', 'alcohol denat',
  ],
  high_acne: [
    'coconut oil', 'cocoa butter', 'isopropyl myristate',
    'lanolin', 'mineral oil',
  ],
};

/**
 * Fuzzy match: does the product ingredient list contain the target ingredient?
 * Uses substring matching (case-insensitive).
 */
export function ingredientListContains(
  productIngredients: string[],
  target: string,
): boolean {
  const lower = target.toLowerCase();
  return productIngredients.some(pi => pi.toLowerCase().includes(lower));
}

/**
 * Count how many target ingredients are found in the product ingredient list.
 */
export function countIngredientMatches(
  productIngredients: string[],
  targets: string[],
): number {
  const normProduct = productIngredients.map(i => i.toLowerCase());
  let count = 0;
  for (const target of targets) {
    const lower = target.toLowerCase();
    if (normProduct.some(pi => pi.includes(lower))) {
      count++;
    }
  }
  return count;
}
