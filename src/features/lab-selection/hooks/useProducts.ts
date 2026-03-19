import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '../types';
import { TEXTURE_ORDER } from '../data/textureRules';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import productDbJson from '@/data/product_db_merged.json';

export interface ProductFilters {
  country?: string;
  profiles?: string[];
  concerns?: string[];
  priceTier?: string;
  fragranceFree?: boolean;
  alcoholFree?: boolean;
}

export interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ── Static product catalogue (normalised from product_db_merged.json) ────────────────
// Used as primary source when the Supabase `products` table is not yet seeded.

interface RawIngredient {
  name_en: string;
  name_kr?: string;
  name_inci?: string;
  concentration_pct?: number | null;
  concentration_unit?: string;
  role?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseProduct(raw: any): Product {
  const textureOrder: number =
    raw.texture_order ??
    (TEXTURE_ORDER as Record<string, number>)[raw.texture_type as string] ??
    5;

  const ingredients = ((raw.ingredients ?? []) as RawIngredient[]).map((ing) => ({
    name_en: ing.name_en,
    name_kr: ing.name_kr ?? '',
    name_inci: ing.name_inci ?? '',
    concentration_pct: ing.concentration_pct ?? null,
    concentration_unit: (ing.concentration_unit ?? '%') as '%' | 'ppm' | 'IU',
    role: ing.role ?? '',
  }));

  return {
    id: raw.id,
    name_kr: raw.name_kr,
    name_en: raw.name_en,
    name_de: raw.name_de ?? raw.name_en,
    brand: raw.brand,
    brand_kr: raw.brand_kr ?? raw.brand,
    country: raw.country,
    market_tier: raw.market_tier,
    price_tier: raw.price_tier,
    price_eur: raw.price_eur,
    price_krw: raw.price_krw ?? null,
    volume_ml: raw.volume_ml,
    price_per_ml_eur:
      raw.price_per_ml_eur ??
      (raw.volume_ml > 0 ? +(raw.price_eur / raw.volume_ml).toFixed(4) : 0),
    routine_slot: raw.routine_slot,
    texture_type: raw.texture_type,
    texture_order: textureOrder,
    ingredients,
    target_profiles: raw.target_profiles ?? [],
    target_age_range: raw.target_age_range ?? '',
    skin_concerns: raw.skin_concerns ?? [],
    application_zones: raw.application_zones ?? ['whole_face'],
    application_method: raw.application_method ?? 'leave_on',
    application_instruction_kr: raw.application_instruction_kr ?? '',
    application_instruction_en: raw.application_instruction_en ?? '',
    application_instruction_de: raw.application_instruction_de ?? '',
    application_frequency: raw.application_frequency ?? 'daily_am_pm',
    fragrance_free: raw.fragrance_free ?? false,
    alcohol_free: raw.alcohol_free ?? false,
    purchase_channels: raw.purchase_channels ?? { KR: [], DE: [], global_online: [] },
    awards: raw.awards ?? [],
    one_liner_kr: raw.one_liner_kr ?? '',
    one_liner_en: raw.one_liner_en ?? '',
    vs_comparison: raw.vs_comparison ?? null,
    duel_verdict: raw.duel_verdict ?? null,
  };
}

// Normalise once at module load — no per-render cost
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATIC_PRODUCTS: Product[] = ((productDbJson as any).products ?? []).map(normaliseProduct);

function applyFiltersLocally(products: Product[], filters: ProductFilters): Product[] {
  let result = products;
  if (filters.country) {
    result = result.filter((p) => p.country === filters.country);
  }
  if (filters.priceTier) {
    result = result.filter((p) => p.price_tier === filters.priceTier);
  }
  if (filters.fragranceFree === true) {
    result = result.filter((p) => p.fragrance_free);
  }
  if (filters.alcoholFree === true) {
    result = result.filter((p) => p.alcohol_free);
  }
  if (filters.profiles && filters.profiles.length > 0) {
    result = result.filter((p) =>
      filters.profiles!.some((prof) => (p.target_profiles as string[]).includes(prof))
    );
  }
  if (filters.concerns && filters.concerns.length > 0) {
    result = result.filter((p) =>
      filters.concerns!.some((c) => (p.skin_concerns as string[]).includes(c))
    );
  }
  return result;
}

export function useProducts(filters: ProductFilters = {}): UseProductsResult {
  const [dbProducts, setDbProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setDbProducts(null);
      setIsLoading(false);
    };

    fetchProducts();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.country,
    filters.priceTier,
    filters.fragranceFree,
    filters.alcoholFree,
    JSON.stringify(filters.profiles),
    JSON.stringify(filters.concerns),
    tick,
  ]);

  // When Supabase has no data, apply filters to static local catalogue
  const products = useMemo(() => {
    const result = dbProducts !== null ? dbProducts : applyFiltersLocally(STATIC_PRODUCTS, filters);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbProducts, JSON.stringify(filters)]);

  return { products, isLoading, error, refetch };
}
