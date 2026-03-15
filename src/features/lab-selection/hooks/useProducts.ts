import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '../types';

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

export function useProducts(filters: ProductFilters = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any).from('products').select('*');

        if (filters.country) {
          query = query.eq('country', filters.country);
        }
        if (filters.priceTier) {
          query = query.eq('price_tier', filters.priceTier);
        }
        if (filters.fragranceFree === true) {
          query = query.eq('fragrance_free', true);
        }
        if (filters.alcoholFree === true) {
          query = query.eq('alcohol_free', true);
        }
        // Array overlap filters — Supabase PostgREST .contains() checks superset;
        // .overlaps() checks intersection (at least one element in common).
        if (filters.profiles && filters.profiles.length > 0) {
          query = query.overlaps('target_profiles', filters.profiles);
        }
        if (filters.concerns && filters.concerns.length > 0) {
          query = query.overlaps('skin_concerns', filters.concerns);
        }

        const { data, error: fetchErr } = await query;

        if (cancelled) return;

        if (fetchErr) {
          setError(fetchErr.message);
          setProducts([]);
        } else {
          setProducts((data as Product[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.country,
    filters.priceTier,
    filters.fragranceFree,
    filters.alcoholFree,
    // Stringify arrays so the effect re-runs only when values actually change
    JSON.stringify(filters.profiles),
    JSON.stringify(filters.concerns),
    tick,
  ]);

  return { products, isLoading, error, refetch };
}
