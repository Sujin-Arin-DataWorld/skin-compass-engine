/**
 * BarrierRecoveryProducts.ts
 *
 * Static product + phase data for the BARRIER_EMERGENCY recovery journey.
 * These products map to IDs already present in MOCK_PRODUCT_PRICES (sharedResultsData.ts).
 * Product images are derived dynamically: `/productsimage/${product.id}.jpeg`
 * — no image_url field needed; onError shows emoji fallback.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type BarrierPhaseKey = 'empty' | 'fill' | 'lock';

export interface BarrierRecoveryProduct {
  id: string;
  name: { ko: string; en: string; de: string };
  /** Short ingredient descriptor shown below the product name */
  keyIngredients: string;
  /** Optional colored chip badge e.g. "약산성" */
  badge?: { ko: string; en: string; de: string };
  role: string;
  price: number;
  /** Emoji fallback icon shown when image file is missing */
  emoji: string;
}

export interface BarrierPhase {
  key: BarrierPhaseKey;
  label:       { ko: string; en: string; de: string };
  subtitle:    { ko: string; en: string; de: string };
  /** Large emoji shown in the hero card */
  icon:        string;
  /** Accent color for active state, borders, buttons */
  color:       string;
  /** Card background tint */
  bgColor:     string;
  /** Warning / instruction text shown inside the detail panel */
  instruction: { ko: string; en: string; de: string };
  products:    BarrierRecoveryProduct[];
}

// ── Phase Data ───────────────────────────────────────────────────────────────

export const BARRIER_RECOVERY_PHASES: BarrierPhase[] = [
  {
    key:      'empty',
    label:    { ko: '비우기',      en: 'Empty',          de: 'Leeren'       },
    subtitle: { ko: '자극 멈추기', en: 'Stop Irritants', de: 'Reize stoppen' },
    icon:     '🗑️',
    color:    '#E24B4A',
    bgColor:  'rgba(226,75,74,0.06)',
    instruction: {
      ko: '⚠️ 지금 당장 중단: 레티놀 · 비타민C · AHA/BHA · 향료\n약산성(pH 5.5 이하) 클렌저로 교체하세요',
      en: '⚠️ Stop immediately: Retinol · Vitamin C · AHA/BHA · Fragrance\nSwitch to a low-pH (≤5.5) cleanser',
      de: '⚠️ Jetzt stoppen: Retinol · Vitamin C · AHA/BHA · Duftstoffe\nZur pH 5.5-Reinigung wechseln',
    },
    products: [
      {
        id:             'madeca-cleanser',
        name:           { ko: '마데카MD 진정 젤 클렌저', en: 'Madeca MD Soothing Gel Cleanser', de: 'Madeca MD Gel-Reiniger' },
        keyIngredients: 'Centella Asiatica 60% · pH 5.2',
        badge:          { ko: '약산성', en: 'Low pH', de: 'Niedrig-pH' },
        role:           'cleanser',
        price:          14,
        emoji:          '🫧',
      },
    ],
  },
  {
    key:      'fill',
    label:    { ko: '채우기',    en: 'Fill',     de: 'Füllen'     },
    subtitle: { ko: '수분 공급', en: 'Hydrate', de: 'Befeuchten'  },
    icon:     '💧',
    color:    '#378ADD',
    bgColor:  'rgba(55,138,221,0.06)',
    instruction: {
      ko: '판테놀 · 알란토인 · 히알루론산으로 진정 및 수분을 공급하세요',
      en: 'Replenish with Panthenol · Allantoin · Hyaluronic Acid',
      de: 'Mit Panthenol · Allantoin · Hyaluronsäure auffüllen',
    },
    products: [
      {
        id:             'barrier-serum-recovery',
        name:           { ko: '배리어 리커버리 세럼', en: 'Barrier Recovery Serum', de: 'Barriere-Erholungsserum' },
        keyIngredients: 'Panthenol 5% · Allantoin · Centella',
        role:           'serum',
        price:          28,
        emoji:          '🔬',
      },
    ],
  },
  {
    key:      'lock',
    label:    { ko: '잠그기',     en: 'Lock',           de: 'Versiegeln'        },
    subtitle: { ko: '지질막 복구', en: 'Seal & Repair', de: 'Barriere reparieren' },
    icon:     '🔒',
    color:    '#4A9E68',
    bgColor:  'rgba(74,158,104,0.06)',
    instruction: {
      ko: '세라마이드 · 콜레스테롤 · 지방산으로 지질막을 복구하고\n미네랄 선크림으로 피부를 보호하세요',
      en: 'Repair lipid layer with Ceramides · Cholesterol · Fatty Acids\nProtect with mineral SPF',
      de: 'Lipidschicht mit Ceramiden · Cholesterin · Fettsäuren reparieren\nMit Mineral-LSF schützen',
    },
    products: [
      {
        id:             'barrier-moist-recovery',
        name:           { ko: '배리어 리커버리 크림', en: 'Barrier Recovery Cream', de: 'Barriere-Erholungscreme' },
        keyIngredients: 'Ceramide NP · Cholesterol · Fatty Acids',
        role:           'moisturizer',
        price:          26,
        emoji:          '🛡',
      },
      {
        id:             'barrier-spf-mineral',
        name:           { ko: '미네랄 선크림 SPF50+', en: 'Mineral Sunscreen SPF50+', de: 'Mineral-Sonnenschutz SPF50+' },
        keyIngredients: 'Zinc Oxide · Titanium Dioxide',
        badge:          { ko: '미네랄', en: 'Mineral', de: 'Mineralisch' },
        role:           'spf',
        price:          22,
        emoji:          '☀️',
      },
    ],
  },
];
