/**
 * DuelCard.tsx — Asymmetric K vs G product comparison (Slide 1 inline accordion)
 *
 * KR = BEST MATCH: thick green border + badge + FILLED CTA
 * DE = alternative: thin border + no badge + GHOST CTA
 * Progress bar shows ingredient match score for each product.
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { useProducts } from '../hooks/useProducts';
import { calcComplianceScore } from '../utils/routineHelpers';
import { calculateMatchScore } from '../data/axisIngredientMap';
import type { FaceZone, SkinProfile, RequiredIngredient, PriceTier, Product } from '../types';
import type { Product as EngineProduct } from '@/engine/types';
import CompatibilityBadge from '@/components/product/CompatibilityBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'de';

export interface DuelCardProps {
  zone: FaceZone;
  matchedProfile: SkinProfile;
  requiredIngredients: RequiredIngredient[];
  onProductSelect: (zone: FaceZone, product: Product, tier: PriceTier) => void;
  selectedProductId?: string | null;
}

interface ScoredProduct {
  product: Product;
  compliance: ReturnType<typeof calcComplianceScore>;
  matchScore: { matched: number; total: number; percentage: number };
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const T = {
  best_match:       { ko: '최적 매칭', de: 'BESTE WAHL', en: 'BEST MATCH' },
  add_to_routine:   { ko: '루틴에 추가', de: 'Zur Routine hinzufügen', en: 'Add to routine' },
  added:            { ko: '✓ 추가됨', de: '✓ Hinzugefügt', en: '✓ Added' },
  select_alt:       { ko: '선택', de: 'Auswählen', en: 'Select' },
  match_score:      { ko: '{matched}/{total} 성분 매칭', de: '{matched}/{total} Wirkstoff-Match', en: '{matched}/{total} ingredient match' },
  required_ings:    { ko: '필요 성분 {N}개', de: '{N} benötigte Wirkstoffe', en: '{N} required ingredients' },
  kbeauty_note:     { ko: 'K-Beauty = 더 높은 성분 매칭', de: 'K-Beauty = Höherer Wirkstoff-Match', en: 'K-Beauty = Higher ingredient match' },
  gbeauty_note:     { ko: 'G-Beauty = 가성비 우선', de: 'G-Beauty = Bestes Preis-Leistungs-Verhältnis', en: 'G-Beauty = Best value' },
  daily_price:      { ko: '하루 €{price}', de: '€{price} pro Tag', en: '€{price}/day' },
  months:           { ko: '~{N}개월', de: '~{N} Monate', en: '~{N} months' },
  no_products:      { ko: '이 부위에 맞는 제품을 준비 중입니다', de: 'Passende Produkte werden vorbereitet…', en: 'Preparing matched products for this zone…' },
  loading:          { ko: '제품 로딩 중…', de: 'Lade Produkte…', en: 'Loading products…' },
  error_retry:      { ko: '다시 시도', de: 'Wiederholen', en: 'Retry' },
  per_ml:           { ko: '/ml', en: '/ml', de: '/ml' },
  product_select:   { ko: '{zone} 관리 제품 선택', de: '{zone} Pflegeprodukt wählen', en: 'Choose {zone} care product' },
} as const;

function tx(key: keyof typeof T, lang: Lang, vars?: Record<string, string | number>): string {
  let s: string = (T[key] as Record<string, string>)[lang] ?? (T[key] as Record<string, string>).en;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

// ── Ingredient alias map (same as DuelCard original) ──────────────────────────

const INGREDIENT_ALIASES: Record<string, string[]> = {
  'salicylic acid (bha)':           ['salicylic acid', 'bha', 'beta hydroxy acid'],
  'niacinamide':                    ['niacinamide', 'nicotinamide', 'vitamin b3'],
  'zinc pca':                       ['zinc pca', 'zinc', 'zinc oxide'],
  'hyaluronic acid (multi-weight)': ['hyaluronic acid', 'sodium hyaluronate'],
  'hyaluronic acid':                ['hyaluronic acid', 'sodium hyaluronate'],
  'panthenol':                      ['panthenol', 'dexpanthenol', 'provitamin b5', 'd-panthenol'],
  'ectoin':                         ['ectoin'],
  'tea tree oil':                   ['tea tree', 'melaleuca'],
  'centella asiatica extract':      ['centella', 'cica', 'madecassoside', 'asiaticoside', 'centella asiatica'],
  'ceramide np':                    ['ceramide', 'ceramide np', 'ceramide ap', 'ceramide eop'],
  'madecassoside':                  ['madecassoside', 'cica', 'centella'],
  'allantoin':                      ['allantoin'],
  'squalane':                       ['squalane', 'squalene'],
  'tranexamic acid':                ['tranexamic acid', 'tranexamic'],
  'alpha-arbutin':                  ['arbutin', 'alpha-arbutin', 'alpha arbutin'],
  'azelaic acid':                   ['azelaic acid'],
  'l-ascorbic acid':                ['ascorbic acid', 'vitamin c', 'ethyl ascorbic acid', 'ascorbyl glucoside'],
  'aha (glycolic acid)':            ['glycolic acid', 'aha', 'lactic acid', 'alpha hydroxy acid'],
  'retinol':                        ['retinol', 'retinal', 'retinaldehyde', 'vitamin a'],
  'lactic acid':                    ['lactic acid', 'aha'],
  'peptides':                       ['peptide', 'palmitoyl', 'matrixyl', 'argireline', 'copper peptide'],
  'ferulic acid':                   ['ferulic acid'],
  'adenosine':                      ['adenosine'],
  'cholesterol':                    ['cholesterol'],
  'fatty acids':                    ['fatty acid', 'stearic acid', 'palmitic acid'],
  'green tea extract':              ['green tea', 'camellia sinensis', 'egcg'],
};

// ── Lab Product → Engine Product adapter (for CompatibilityBadge) ─────────────

const PROFILE_TO_AXES: Record<SkinProfile, string[]> = {
  oily_acne:        ['seb', 'acne'],
  dehydrated_oily:  ['hyd', 'seb'],
  dry_barrier:      ['hyd', 'bar'],
  sensitive:        ['sen'],
  aging_elasticity: ['aging'],
  post_menopause:   ['aging', 'hyd'],
  pigmentation:     ['pigment'],
  mens:             ['seb'],
  combination:      [],
};

const PROFILE_TO_SKIN: Record<SkinProfile, string> = {
  oily_acne:        'oily',
  dehydrated_oily:  'combination',
  dry_barrier:      'dry',
  sensitive:        'sensitive',
  aging_elasticity: 'normal',
  post_menopause:   'dry',
  pigmentation:     'combination',
  mens:             'oily',
  combination:      'combination',
};

function toEngineProduct(p: Product): EngineProduct {
  return {
    id: p.id,
    key_ingredients: p.ingredients.map((i) => i.name_en),
    target_axes: p.target_profiles.flatMap((prof) => PROFILE_TO_AXES[prof] ?? []),
    for_skin: [...new Set(p.target_profiles.map((prof) => PROFILE_TO_SKIN[prof] ?? 'combination'))],
  } as unknown as EngineProduct;
}

function filterProductsByIngredients(products: Product[], requiredIngredientIds: string[]): Product[] {
  // BUG FIX: was `return []` — now returns all products when no specific requirements
  if (requiredIngredientIds.length === 0) return products;
  const searchTerms: string[] = [];
  for (const id of requiredIngredientIds) {
    const aliases = INGREDIENT_ALIASES[id.toLowerCase()];
    if (aliases) searchTerms.push(...aliases);
    else searchTerms.push(id.replace(/_/g, ' ').toLowerCase());
  }
  return products.filter(product => {
    const names = product.ingredients.map(i => (i.name_en || '').toLowerCase());
    // @ts-ignore
    const inci = product.ingredients.map(i => (i.name_inci || '').toLowerCase());
    const roles = product.ingredients.map(i => (i.role || '').toLowerCase());
    const concerns = (product.skin_concerns ?? []).map(c => c.toLowerCase());
    return searchTerms.some(term =>
      names.some(n => n.includes(term)) ||
      inci.some(n => n.includes(term)) ||
      roles.some(r => r.includes(term)) ||
      concerns.some(c => c.includes(term))
    );
  });
}

// Maps slot-based virtual zones → the routine_slot values they cover
const SLOT_ROUTINE_SLOTS: Partial<Record<string, string[]>> = {
  slot_cleanser:    ['cleanser', 'cleanser_oil'],
  slot_toner:       ['toner', 'toner_exfoliant', 'essence', 'toner_essence'],
  slot_serum_am:    ['serum_am', 'serum_am_pm'],
  slot_moisturizer: ['moisturizer_light', 'moisturizer_rich', 'moisturizer_allinone', 'moisturizer', 'moisturizer_night'],
  slot_spf:         ['spf', 'sunscreen'],
  slot_serum_pm:    ['serum_pm', 'serum_spot', 'serum_am_pm'],
  slot_eye_cream:   ['eye_cream'],
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const shimmer = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: '14px 16px',
      background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {[48, 32, 56, 24].map((w, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          style={{ height: i === 0 ? 14 : 10, borderRadius: 4, width: `${w}%`, background: shimmer }} />
      ))}
      <div style={{ height: 36, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', marginTop: 4 }} />
    </div>
  );
}

// ── Product card (BEST MATCH or alternative) ──────────────────────────────────

function ProductCard({
  scored, isBestMatch, isSelected, onSelect, lang, isDark,
}: {
  scored: ScoredProduct;
  isBestMatch: boolean;
  isSelected: boolean;
  onSelect: () => void;
  lang: Lang;
  isDark: boolean;
}) {
  const { product, matchScore } = scored;
  const engineProduct = useMemo(() => toEngineProduct(product), [product]);
  const GREEN = '#4A9E68';
  const GREEN_LIGHT = '#3D6B4A';
  const AMBER = '#BA7517';

  const name = lang === 'ko' ? product.name_kr : lang === 'de' ? (product as any).name_de ?? product.name_en : product.name_en;

  // Daily price: assume 1ml/day
  const supplyDays = product.volume_ml;
  const dailyPrice = supplyDays > 0 ? (product.price_eur / supplyDays).toFixed(2) : '—';
  const supplyMonths = supplyDays > 0 ? Math.max(1, Math.round(supplyDays / 30)) : 1;

  const barColor = isBestMatch ? GREEN : AMBER;
  const barPct = Math.max(4, matchScore.percentage);

  return (
    <div style={{
      flex: 1, minWidth: 0,
      borderRadius: 12, padding: 'clamp(12px, 2vw, 16px)',
      background: isDark
        ? (isBestMatch ? 'rgba(28,28,30,0.65)' : 'rgba(28,28,30,0.45)')
        : (isBestMatch ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)'),
      border: isBestMatch
        ? `2px solid rgba(74,158,104,0.35)`
        : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* BEST MATCH badge */}
      {isBestMatch && (
        <div style={{
          position: 'absolute', top: -10, right: 12,
          background: isDark ? 'rgba(74,158,104,0.12)' : 'rgba(74,158,104,0.1)',
          color: isDark ? GREEN : GREEN_LIGHT,
          border: `1px solid ${isDark ? 'rgba(74,158,104,0.25)' : 'rgba(74,158,104,0.2)'}`,
          fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', fontWeight: 700, letterSpacing: '0.08em',
          borderRadius: 99, padding: '3px 10px',
          whiteSpace: 'nowrap',
        }}>
          {tx('best_match', lang)}
        </div>
      )}

      {/* Flag + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: isBestMatch ? 4 : 0 }}>
        <span style={{ fontSize: 16 }}>{product.country === 'KR' ? '🇰🇷' : '🇩🇪'}</span>
        <span style={{
          fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        }}>
          {product.brand}
        </span>
      </div>

      {/* Product name */}
      <p style={{
        fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)', fontWeight: 600,
        color: isDark ? '#F5F5F7' : '#1B2838',
        margin: 0, lineHeight: 1.3,
      }}>{name}</p>

      {/* Match score + progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 600,
            color: barColor,
          }}>
            {tx('match_score', lang, { matched: matchScore.matched, total: matchScore.total })}
          </span>
          <span style={{
            fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 700, color: barColor,
          }}>{matchScore.percentage}%</span>
        </div>
        {/* Progress bar */}
        <div style={{
          height: 6, borderRadius: 3,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', borderRadius: 3, background: barColor }}
          />
        </div>
      </div>

      {/* Price + supply */}
      <div style={{
        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
        color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
      }}>
        <span style={{ fontWeight: 600, color: isDark ? '#F5F5F7' : '#1B2838' }}>
          €{product.price_eur.toFixed(2)}
        </span>
        {' / '}{product.volume_ml}ml · {tx('months', lang, { N: supplyMonths })}
      </div>
      <div style={{
        fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)',
        color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
      }}>
        {tx('daily_price', lang, { price: dailyPrice })}
      </div>

      {/* Compatibility badge — compact mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CompatibilityBadge product={engineProduct} variant="compact" />
        <span style={{
          fontSize: 'clamp(0.5625rem, 0.75vw, 0.625rem)',
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {lang === 'ko' ? '피부 적합도' : lang === 'de' ? 'Hautverträglichkeit' : 'Skin Fit'}
        </span>
      </div>

      {/* CTA */}
      {isBestMatch ? (
        /* Filled CTA */
        <motion.button
          whileHover={{ y: -1, boxShadow: isDark ? '0 6px 20px rgba(74,158,104,0.25)' : '0 6px 20px rgba(61,107,74,0.28)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          style={{
            width: '100%', padding: 'clamp(8px, 1.5vw, 10px) 20px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: isSelected
              ? (isDark ? 'rgba(74,158,104,0.35)' : 'rgba(61,107,74,0.25)')
              : (isDark ? '#2D6B4A' : 'linear-gradient(135deg, #6B9E76, #3D6B4A)'),
            color: '#F5F5F7',
            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 600,
            minHeight: 44,
            transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {isSelected ? tx('added', lang) : tx('add_to_routine', lang)}
        </motion.button>
      ) : (
        /* Ghost CTA */
        <motion.button
          whileHover={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: isDark ? '#F5F5F7' : '#1B2838' }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          style={{
            width: '100%', padding: 'clamp(8px, 1.5vw, 10px) 20px',
            borderRadius: 10, cursor: 'pointer',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? '#86868B' : '#6B7280',
            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 500,
            minHeight: 44,
            transition: 'all 0.15s',
          }}
        >
          {isSelected ? tx('added', lang) : tx('select_alt', lang)}
        </motion.button>
      )}
    </div>
  );
}

// ── Tier tabs ─────────────────────────────────────────────────────────────────

function TierTabs({
  available, selected, onChange, isDark, lang,
}: {
  available: PriceTier[];
  selected: PriceTier;
  onChange: (t: PriceTier) => void;
  isDark: boolean;
  lang: Lang;
}) {
  const TIER_LABELS: Record<PriceTier, { ko: string; en: string; de: string }> = {
    entry:   { ko: '기본', en: 'Entry', de: 'Basis' },
    full:    { ko: '풀', en: 'Full', de: 'Voll' },
    premium: { ko: '프리미엄', en: 'Premium', de: 'Premium' },
  };
  const GREEN = '#4A9E68';

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
      {(['entry', 'full', 'premium'] as PriceTier[]).map((tier) => {
        const isAvail = available.includes(tier);
        const isActive = selected === tier;
        return (
          <button key={tier} disabled={!isAvail} onClick={() => isAvail && onChange(tier)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)',
              fontWeight: 600, letterSpacing: '0.05em', cursor: isAvail ? 'pointer' : 'default',
              border: isActive ? `1.5px solid ${GREEN}33` : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              background: isActive ? `${GREEN}12` : 'transparent',
              color: isActive ? GREEN : isAvail
                ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)')
                : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)'),
              transition: 'all 0.15s',
            }}
          >
            {TIER_LABELS[tier][lang]}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DuelCard({
  zone, matchedProfile: _matchedProfile, requiredIngredients, onProductSelect, selectedProductId,
}: DuelCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();
  const lang = (['ko', 'de'] as Lang[]).includes(language as Lang) ? language as Lang : 'en';

  const [selectedTier, setSelectedTier] = useState<PriceTier>('entry');
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedProductId ?? null);

  // Use external selectedProductId if provided
  const activeSelectedId = selectedProductId ?? localSelectedId;

  const { products: allProducts, isLoading, error, refetch } = useProducts({});

  const zoneProducts = useMemo(() => {
    const reqNames = requiredIngredients
      .filter(r => r.name_en !== 'HOLD_ALL_ACTIVES')
      .map(r => r.name_en);

    const slotSlots = SLOT_ROUTINE_SLOTS[zone];
    if (slotSlots) {
      // Slot-based mode: filter by routine_slot first, then ingredient match
      const bySlot = allProducts.filter(p => slotSlots.includes(p.routine_slot));
      if (reqNames.length === 0) return bySlot;
      const ingFiltered = filterProductsByIngredients(bySlot, reqNames);
      // Fallback: if ingredient filter is too strict for this slot (e.g. SPF w/ BHA requirement), show all slot products
      return ingFiltered.length > 0 ? ingFiltered : bySlot;
    }

    // Face-zone mode: filter by application_zones, then by ingredients
    const byZone = allProducts.filter(p =>
      (p.application_zones as string[]).includes(zone) ||
      (p.application_zones as string[]).includes('whole_face')
    );
    if (reqNames.length === 0) return byZone;
    const ingFiltered = filterProductsByIngredients(byZone, reqNames);
    // Fallback: if no products match required ingredients, show all zone products
    return ingFiltered.length > 0 ? ingFiltered : byZone;
  }, [allProducts, zone, requiredIngredients]);

  const availableTiers = useMemo((): PriceTier[] =>
    (['entry', 'full', 'premium'] as PriceTier[]).filter(tier =>
      zoneProducts.some(p => p.price_tier === tier)
    ),
  [zoneProducts]);

  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier(availableTiers[0]);
    }
  }, [availableTiers, selectedTier]);

  const requirements = useMemo(() =>
    requiredIngredients
      .filter(i => i.name_en !== 'HOLD_ALL_ACTIVES')
      .map(i => ({ name_en: i.name_en, min_concentration: i.min_concentration })),
  [requiredIngredients]);

  const { krScored, deScored } = useMemo(() => {
    const tierProducts = zoneProducts.filter(p => p.price_tier === selectedTier);
    const score = (p: Product): ScoredProduct => ({
      product: p,
      compliance: calcComplianceScore(p, requirements),
      matchScore: calculateMatchScore(
        requiredIngredients,
        p.ingredients.map(i => i.name_en),
      ),
    });
    const kr = tierProducts.filter(p => p.country === 'KR').map(score).sort((a, b) => b.compliance.score - a.compliance.score);
    const de = tierProducts.filter(p => p.country === 'DE').map(score).sort((a, b) => b.compliance.score - a.compliance.score);
    return { krScored: kr, deScored: de };
  }, [zoneProducts, selectedTier, requirements, requiredIngredients]);

  const topKr = krScored[0] ?? null;
  const topDe = deScored[0] ?? null;

  function handleSelect(product: Product) {
    setLocalSelectedId(product.id);
    onProductSelect(zone, product, selectedTier);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#E24B4A', marginBottom: 8 }}>{error}</p>
        <button onClick={refetch} style={{
          fontSize: 11, border: '1px solid #E24B4A', color: '#E24B4A',
          background: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
        }}>
          {tx('error_retry', lang)}
        </button>
      </div>
    );
  }

  if (!topKr && !topDe) {
    return (
      <div style={{ padding: 'clamp(12px, 2vw, 16px)', textAlign: 'center' }}>
        <p style={{
          fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
          color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        }}>{tx('no_products', lang)}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'clamp(12px, 2vw, 16px) 0' }}>
      {/* Tier tabs */}
      {availableTiers.length > 1 && (
        <TierTabs
          available={availableTiers}
          selected={selectedTier}
          onChange={setSelectedTier}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* Required ingredients count */}
      {requirements.length > 0 && (
        <p style={{
          fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', fontWeight: 600,
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          letterSpacing: '0.08em', marginBottom: 10,
        }}>
          {tx('required_ings', lang, { N: requirements.length })}
        </p>
      )}

      {/* K vs G cards */}
      <div style={{
        display: 'flex', gap: 'clamp(8px, 1.5vw, 12px)',
        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        alignItems: 'stretch',
      }}>
        {topKr && (
          <ProductCard
            scored={topKr}
            isBestMatch={true}
            isSelected={activeSelectedId === topKr.product.id}
            onSelect={() => handleSelect(topKr.product)}
            lang={lang}
            isDark={isDark}
          />
        )}
        {topDe && (
          <ProductCard
            scored={topDe}
            isBestMatch={false}
            isSelected={activeSelectedId === topDe.product.id}
            onSelect={() => handleSelect(topDe.product)}
            lang={lang}
            isDark={isDark}
          />
        )}
      </div>

      {/* K vs G footnote */}
      <p style={{
        fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)',
        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
        textAlign: 'center', marginTop: 10,
      }}>
        {tx('kbeauty_note', lang)} · {tx('gbeauty_note', lang)}
      </p>
    </div>
  );
}
