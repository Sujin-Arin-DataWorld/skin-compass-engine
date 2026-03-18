import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { useProducts } from '../hooks/useProducts';
import { calcComplianceScore } from '../utils/routineHelpers';
import type { FaceZone, SkinProfile, RequiredIngredient, PriceTier, Product } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'de';

export interface DuelCardProps {
  zone: FaceZone;
  matchedProfile: SkinProfile;
  requiredIngredients: RequiredIngredient[];
  onProductSelect: (zone: FaceZone, product: Product, tier: PriceTier) => void;
}

interface ScoredProduct {
  product: Product;
  compliance: ReturnType<typeof calcComplianceScore>;
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const T = {
  title: { ko: 'The Lab Duel: K-Beauty vs G-Beauty', en: 'The Lab Duel: K-Beauty vs G-Beauty', de: 'The Lab Duel: K-Beauty vs G-Beauty' },
  kr_label: { ko: '한국 제품', en: 'K-Beauty', de: 'K-Beauty' },
  de_label: { ko: '독일 제품', en: 'G-Beauty', de: 'G-Beauty' },
  compliance: { ko: '성분 적합도', en: 'Compliance', de: 'Compliance' },
  add_btn: { ko: '루틴에 추가', en: 'Add to Routine', de: 'Zur Routine' },
  added_btn: { ko: '추가됨 ✓', en: 'Added ✓', de: 'Hinzugefügt ✓' },
  price: { ko: '가격', en: 'Price', de: 'Preis' },
  volume: { ko: '용량', en: 'Volume', de: 'Inhalt' },
  no_kr: { ko: '이 부위에 맞는 한국 제품이 없습니다', en: 'No KR match for this zone', de: 'Kein KR-Match für diese Zone' },
  no_de: { ko: '이 부위에 맞는 독일 제품이 없습니다', en: 'No DE match for this zone', de: 'Kein DE-Match für diese Zone' },
  no_products: { ko: '이 부위의 추천 성분에 맞는 제품을 준비 중입니다', en: 'Preparing matched products for this zone…', de: 'Passende Produkte werden vorbereitet…' },
  winner_kr: { ko: '한국 제품 우위', en: 'K-Beauty wins this duel', de: 'K-Beauty gewinnt' },
  winner_de: { ko: '독일 제품 우위', en: 'G-Beauty wins this duel', de: 'G-Beauty gewinnt' },
  draw: { ko: '동점', en: 'Draw', de: 'Unentschieden' },
  loading: { ko: '제품 로딩 중…', en: 'Loading products…', de: 'Lade Produkte…' },
  error_retry: { ko: '다시 시도', en: 'Retry', de: 'Wiederholen' },
  per_ml: { ko: '/ml', en: '/ml', de: '/ml' },
} as const;

function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang];
}

// ── Compliance indicator ──────────────────────────────────────────────────────

function ComplianceIndicator({ score, isDark }: { score: number; isDark: boolean }) {
  const color = score >= 80 ? '#34D399' : score >= 50 ? '#F59E0B' : '#F87171';
  const symbol = score >= 80 ? '◎' : score >= 50 ? '△' : '✗';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 13, color }}>{symbol}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        fontFamily: "var(--font-numeric)",
      }}>
        {score}%
      </span>
    </div>
  );
}

function IngredientMatchRow({
  name, status, isDark,
}: { name: string; status: 'full' | 'partial' | 'missing'; isDark: boolean }) {
  const config = {
    full: { symbol: '◎', color: '#34D399' },
    partial: { symbol: '△', color: '#F59E0B' },
    missing: { symbol: '✗', color: '#F87171' },
  }[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontFamily: "var(--font-sans)",
    }}>
      <span style={{ color: config.color, fontSize: 11, flexShrink: 0 }}>{config.symbol}</span>
      <span style={{
        color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name.split('(')[0].trim()}
      </span>
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
    entry: { ko: '기본', en: 'Entry', de: 'Basis' },
    full: { ko: '풀', en: 'Full', de: 'Voll' },
    premium: { ko: '프리미엄', en: 'Premium', de: 'Premium' },
  };

  return (
    <div style={{
      display: 'flex', gap: 6,
      padding: '12px 20px 0',
    }}>
      {(['entry', 'full', 'premium'] as PriceTier[]).map((tier) => {
        const isAvail = available.includes(tier);
        const isActive = selected === tier;
        return (
          <button
            key={tier}
            disabled={!isAvail}
            onClick={() => isAvail && onChange(tier)}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 11,
              fontWeight: 700, letterSpacing: '0.06em', cursor: isAvail ? 'pointer' : 'default',
              border: isActive
                ? '1.5px solid hsl(var(--accent-gold))'
                : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: isActive
                ? 'rgba(200,169,81,0.12)'
                : isDark ? 'transparent' : 'rgba(0,0,0,0.02)',
              color: isActive ? 'hsl(var(--accent-gold))'
                : isAvail
                  ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)')
                  : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)'),
              fontFamily: "var(--font-sans)",
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

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({
  scored, isWinner, isSelected, onSelect, lang, isDark, zone, selectedTier,
}: {
  scored: ScoredProduct;
  isWinner: boolean;
  isSelected: boolean;
  onSelect: () => void;
  lang: Lang;
  isDark: boolean;
  zone: FaceZone;
  selectedTier: PriceTier;
}) {
  const { product, compliance } = scored;
  const GOLD = 'hsl(var(--accent-gold))';
  const ROSE = '#b76e79';

  const name = lang === 'ko' ? product.name_kr : lang === 'de' ? product.name_de : product.name_en;
  const oneLiner = lang === 'ko' ? product.one_liner_kr : product.one_liner_en;

  // Show top 3 ingredient match rows
  const topMatches = compliance.matches.slice(0, 3);

  return (
    <div
      style={{
        flex: 1, minWidth: 0,
        borderRadius: 12, padding: '14px 16px',
        background: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
        border: isWinner
          ? `2px solid ${GOLD}`
          : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isWinner
          ? (isDark ? `0 0 16px rgba(200,169,81,0.2)` : '0 2px 16px rgba(200,169,81,0.15)')
          : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative',
        opacity: 1, visibility: 'visible', minHeight: '100px'
      }}
    >
      {/* Winner badge */}
      {isWinner && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: GOLD, color: '#1a1a1a',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          padding: '2px 10px', borderRadius: 20,
          fontFamily: "var(--font-sans)",
          whiteSpace: 'nowrap',
        }}>
          ★ {lang === 'ko' ? '우위' : lang === 'de' ? 'SIEGER' : 'WINNER'}
        </div>
      )}

      {/* Flag + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 18 }}>{product.country === 'KR' ? '🇰🇷' : '🇩🇪'}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          fontFamily: "var(--font-sans)",
        }}>
          {product.brand}
        </span>
      </div>

      {/* Product name */}
      <div style={{
        fontSize: 13, fontWeight: 700, lineHeight: 1.3,
        color: isDark ? '#fff' : '#1a1a1a',
        fontFamily: "var(--font-sans)",
      }}>
        {name}
      </div>

      {/* One-liner */}
      {oneLiner && (
        <div style={{
          fontSize: 11, lineHeight: 1.5,
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          fontFamily: "var(--font-sans)",
        }}>
          {oneLiner}
        </div>
      )}

      {/* Compliance */}
      <div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          marginBottom: 5, fontFamily: "var(--font-sans)",
        }}>
          {t('compliance', lang)}
        </div>
        <ComplianceIndicator score={compliance.score} isDark={isDark} />
        {topMatches.length > 0 && (
          <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {topMatches.map((m) => (
              <IngredientMatchRow key={m.name} name={m.name} status={m.status} isDark={isDark} />
            ))}
          </div>
        )}
      </div>

      {/* Price + volume */}
      <div style={{
        display: 'flex', gap: 12,
        fontSize: 11, fontFamily: "var(--font-sans)",
        color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
      }}>
        <span>
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>
            €{product.price_eur.toFixed(2)}
          </span>
          {' / '}
          <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 10 }}>
            €{product.price_per_ml_eur.toFixed(3)}{t('per_ml', lang)}
          </span>
        </span>
        <span>{product.volume_ml}ml</span>
      </div>

      {/* Add to routine button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSelect}
        style={{
          width: '100%', padding: '9px 0', borderRadius: 8, cursor: 'pointer',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
          fontFamily: "var(--font-sans)",
          border: isSelected ? 'none' : `1.5px solid ${isDark ? 'rgba(200,169,81,0.5)' : GOLD}`,
          background: isSelected
            ? (isDark ? 'rgba(200,169,81,0.2)' : 'rgba(200,169,81,0.15)')
            : 'transparent',
          color: isSelected ? GOLD : (isDark ? 'rgba(200,169,81,0.8)' : 'hsl(var(--accent-gold) / 0.65)'),
          transition: 'all 0.15s',
        }}
      >
        {isSelected ? t('added_btn', lang) : t('add_btn', lang)}
      </motion.button>
    </div>
  );
}

// ── Empty side placeholder ────────────────────────────────────────────────────

function EmptySide({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 12, padding: '24px 16px',
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', fontSize: 11,
      color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
      fontFamily: "var(--font-sans)",
    }}>
      {message}
    </div>
  );
}

// ── VS divider ────────────────────────────────────────────────────────────────

function VsDivider({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 4, padding: '0 4px', flexShrink: 0,
    }}>
      <div style={{ width: 1, height: 32, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
      <div style={{
        fontSize: 11, fontWeight: 900, letterSpacing: '0.06em',
        color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        fontFamily: "var(--font-sans)",
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
      }}>
        VS
      </div>
      <div style={{ width: 1, height: 32, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
    </div>
  );
}

// ── Verdict banner ────────────────────────────────────────────────────────────

function VerdictBanner({
  krScore, deScore, krProduct, deProduct, lang, isDark,
}: {
  krScore: number; deScore: number;
  krProduct: Product | null; deProduct: Product | null;
  lang: Lang; isDark: boolean;
}) {
  if (!krProduct && !deProduct) return null;

  const winnerLabel = krScore > deScore
    ? t('winner_kr', lang)
    : deScore > krScore
      ? t('winner_de', lang)
      : t('draw', lang);

  const winnerColor = krScore > deScore ? '#EF4444' : '#3B82F6'; // KR=red, DE=blue

  // Use duel_verdict from winning product if available
  const winningProduct = krScore > deScore ? krProduct : deProduct;
  const reason = winningProduct?.duel_verdict
    ? (lang === 'ko' ? winningProduct.duel_verdict.reason_kr : winningProduct.duel_verdict.reason_en)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 12, padding: '10px 16px', borderRadius: 8,
        background: isDark ? `rgba(255,255,255,0.03)` : 'rgba(0,0,0,0.02)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: winnerColor, flexShrink: 0, paddingTop: 1,
        fontFamily: "var(--font-sans)",
      }}>
        {winnerLabel}
      </div>
      {reason && (
        <div style={{
          fontSize: 11, lineHeight: 1.5,
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
          fontFamily: "var(--font-sans)",
        }}>
          {reason}
        </div>
      )}
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const base = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const shimmer = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: '14px 16px',
      background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {[48, 32, 56, 24].map((w, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          style={{
            height: i === 0 ? 14 : 10, borderRadius: 4,
            width: `${w}%`, background: shimmer,
          }}
        />
      ))}
      <div style={{ height: 36, borderRadius: 8, background: base, marginTop: 4 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const INGREDIENT_ALIASES: Record<string, string[]> = {
  'salicylic acid (bha)':    ['salicylic acid', 'bha', 'beta hydroxy acid'],
  'niacinamide':             ['niacinamide', 'nicotinamide', 'vitamin b3'],
  'zinc pca':                ['zinc pca', 'zinc', 'zinc oxide'],
  'hyaluronic acid (multi-weight)': ['hyaluronic acid', 'sodium hyaluronate'],
  'hyaluronic acid':         ['hyaluronic acid', 'sodium hyaluronate'],
  'panthenol':               ['panthenol', 'dexpanthenol', 'provitamin b5', 'd-panthenol'],
  'ectoin':                  ['ectoin'],
  'tea tree oil':            ['tea tree', 'melaleuca'],
  'centella asiatica extract':['centella', 'cica', 'madecassoside', 'asiaticoside', 'centella asiatica'],
  'ceramide np':             ['ceramide', 'ceramide np', 'ceramide ap', 'ceramide eop'],
  'madecassoside':           ['madecassoside', 'cica', 'centella'],
  'allantoin':               ['allantoin'],
  'squalane':                ['squalane', 'squalene'],
  'tranexamic acid':         ['tranexamic acid', 'tranexamic'],
  'alpha-arbutin':           ['arbutin', 'alpha-arbutin', 'alpha arbutin'],
  'azelaic acid':            ['azelaic acid'],
  'l-ascorbic acid':         ['ascorbic acid', 'vitamin c', 'ethyl ascorbic acid', 'ascorbyl glucoside'],
  'aha (glycolic acid)':     ['glycolic acid', 'aha', 'lactic acid', 'alpha hydroxy acid'],
  'retinol':                 ['retinol', 'retinal', 'retinaldehyde', 'vitamin a'],
  'lactic acid':             ['lactic acid', 'aha'],
  'peptides':                ['peptide', 'palmitoyl', 'matrixyl', 'argireline', 'copper peptide'],
  'ferulic acid':            ['ferulic acid'],
  'adenosine':               ['adenosine'],
  'cholesterol':             ['cholesterol'],
  'fatty acids':             ['fatty acid', 'stearic acid', 'palmitic acid'],
  'green tea extract':       ['green tea', 'camellia sinensis', 'egcg', 'epigallocatechin'],
};

function filterProductsByIngredients(
  products: Product[],
  requiredIngredientIds: string[],
): Product[] {
  if (requiredIngredientIds.length === 0) return [];

  const searchTerms: string[] = [];
  for (const id of requiredIngredientIds) {
    const defaultAliases = INGREDIENT_ALIASES[id.toLowerCase()];
    if (defaultAliases) {
      searchTerms.push(...defaultAliases);
    } else {
      searchTerms.push(id.replace(/_/g, ' ').toLowerCase());
    }
  }

  const filtered = products.filter(product => {
    const names = product.ingredients.map(i => 
      (i.name_en || '').toLowerCase()
    );
    const inci = product.ingredients.map(i => 
      // @ts-ignore
      (i.name_inci || '').toLowerCase()
    );
    const roles = product.ingredients.map(i =>
      (i.role || '').toLowerCase()
    );
    const concerns = (product.skin_concerns ?? []).map(
      c => c.toLowerCase()
    );

    return searchTerms.some(term =>
      names.some(n => n.includes(term)) ||
      inci.some(n => n.includes(term)) ||
      roles.some(r => r.includes(term)) ||
      concerns.some(c => c.includes(term))
    );
  });



  return filtered;
}

export default function DuelCard(props: DuelCardProps) {
  const { zone, matchedProfile, requiredIngredients, onProductSelect } = props;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();
  const lang = (language as Lang) ?? 'en';

  const [selectedTier, setSelectedTier] = useState<PriceTier>('entry');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Remove `profiles` filter to let ingredient-matching handle it across generic products
  const { products: allProducts, isLoading, error, refetch } = useProducts({});

  // Client-side zone + tier filter
  const zoneProducts = useMemo(() => {
    const byZone = allProducts.filter((p) =>
      (p.application_zones as string[]).includes(zone) ||
      (p.application_zones as string[]).includes('whole_face')
    );
    
    const reqNames = requiredIngredients
      .filter(req => req.name_en !== 'HOLD_ALL_ACTIVES')
      .map(req => req.name_en);

    return filterProductsByIngredients(byZone, reqNames);
  }, [allProducts, zone, requiredIngredients]);

  const availableTiers = useMemo((): PriceTier[] =>
    (['entry', 'full', 'premium'] as PriceTier[]).filter((tier) =>
      zoneProducts.some((p) => p.price_tier === tier)
    ),
    [zoneProducts]
  );

  // Auto-select first available tier
  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      setSelectedTier(availableTiers[0]);
    }
  }, [availableTiers, selectedTier]);

  // Compliance score requirements (exclude HOLD_ALL_ACTIVES)
  const requirements = useMemo(() =>
    requiredIngredients
      .filter((i) => i.name_en !== 'HOLD_ALL_ACTIVES')
      .map((i) => ({ name_en: i.name_en, min_concentration: i.min_concentration })),
    [requiredIngredients]
  );

  // Score and split by country for current tier
  const { krScored, deScored } = useMemo(() => {
    const tierProducts = zoneProducts.filter((p) => p.price_tier === selectedTier);
    const score = (p: Product): ScoredProduct => ({
      product: p,
      compliance: calcComplianceScore(p, requirements),
    });
    const kr = tierProducts
      .filter((p) => p.country === 'KR')
      .map(score)
      .sort((a, b) => b.compliance.score - a.compliance.score);
    const de = tierProducts
      .filter((p) => p.country === 'DE')
      .map(score)
      .sort((a, b) => b.compliance.score - a.compliance.score);
    return { krScored: kr, deScored: de };
  }, [zoneProducts, selectedTier, requirements]);

  const topKr = krScored[0] ?? null;
  const topDe = deScored[0] ?? null;



  const krWins = (topKr?.compliance.score ?? 0) > (topDe?.compliance.score ?? 0);
  const deWins = (topDe?.compliance.score ?? 0) > (topKr?.compliance.score ?? 0);

  function handleSelect(product: Product) {
    setSelectedProductId(product.id);
    onProductSelect(zone, product, selectedTier);
  }

  // ── Render states ───────────────────────────────────────────────────────────

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{
        padding: '16px 20px 0',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: isDark ? 'rgba(200,169,81,0.6)' : 'hsl(var(--accent-gold) / 0.55)',
          fontFamily: "var(--font-sans)",
          marginBottom: 4,
        }}>
          {lang === 'ko' ? '제품 추천' : lang === 'de' ? 'Produktempfehlung' : 'Product Recommendation'}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 700,
          color: isDark ? '#f5f0e8' : '#1a1a2e',
          fontFamily: "var(--font-display)",
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          {t('title', lang)}
        </div>
        <div style={{
          fontSize: 12, lineHeight: 1.5,
          color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.45)',
          fontFamily: "var(--font-sans)",
        }}>
          {lang === 'ko'
            ? '같은 성분, 다른 철학 — 어느 쪽이 당신의 피부에 맞을까?'
            : lang === 'de'
              ? 'Gleiche Wirkstoffe, andere Philosophie — was passt zu Ihrer Haut?'
              : 'Same ingredients, different philosophy — which suits your skin?'}
        </div>
      </div>

      {/* Tier tabs */}
      {!isLoading && availableTiers.length > 0 && (
        <TierTabs
          available={availableTiers}
          selected={selectedTier}
          onChange={setSelectedTier}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* Main comparison area */}
      <div style={{ padding: '14px 16px 16px' }}>
        {isLoading ? (
          // Skeleton state
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <SkeletonCard isDark={isDark} />
            <VsDivider isDark={isDark} />
            <SkeletonCard isDark={isDark} />
          </div>
        ) : error ? (
          // Error state
          <div style={{
            textAlign: 'center', padding: '20px 0',
            fontSize: 12, color: '#F87171',
            fontFamily: "var(--font-sans)",
          }}>
            <div style={{ marginBottom: 8 }}>{error}</div>
            <button
              onClick={refetch}
              style={{
                background: 'none', border: '1px solid #F87171',
                color: '#F87171', borderRadius: 6, padding: '4px 12px',
                cursor: 'pointer', fontSize: 11,
              }}
            >
              {t('error_retry', lang)}
            </button>
          </div>
        ) : !topKr && !topDe ? (
          // No products
          <div style={{
            textAlign: 'center', padding: '20px 0',
            fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            fontFamily: "var(--font-sans)",
          }}>
            {t('no_products', lang)}
          </div>
        ) : (
          // Main duel view
          <div key={selectedTier} style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'stretch',
            }}>
                {/* KR side */}
                {topKr ? (
                  <ProductCard
                    scored={topKr}
                    isWinner={krWins}
                    isSelected={selectedProductId === topKr.product.id}
                    onSelect={() => handleSelect(topKr.product)}
                    lang={lang}
                    isDark={isDark}
                    zone={zone}
                    selectedTier={selectedTier}
                  />
                ) : (
                  <EmptySide message={t('no_kr', lang)} isDark={isDark} />
                )}

                <VsDivider isDark={isDark} />

                {/* DE side */}
                {topDe ? (
                  <ProductCard
                    scored={topDe}
                    isWinner={deWins}
                    isSelected={selectedProductId === topDe.product.id}
                    onSelect={() => handleSelect(topDe.product)}
                    lang={lang}
                    isDark={isDark}
                    zone={zone}
                    selectedTier={selectedTier}
                  />
                ) : (
                  <EmptySide message={t('no_de', lang)} isDark={isDark} />
                )}
              </div>

            {/* Verdict banner */}
            <VerdictBanner
              krScore={topKr?.compliance.score ?? 0}
              deScore={topDe?.compliance.score ?? 0}
              krProduct={topKr?.product ?? null}
              deProduct={topDe?.product ?? null}
              lang={lang}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}
