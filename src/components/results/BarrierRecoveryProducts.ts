/**
 * BarrierRecoveryProducts.ts
 *
 * Static product + phase data for the BARRIER_EMERGENCY recovery journey.
 * Product IDs match the image filenames in /public/productsImage/ (without extension).
 * Images are loaded as `/productsImage/${product.id}.jpg` in BarrierRecoveryMode.tsx.
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
        id:             'DE_balea_med_washgel',
        name:           { ko: '메드 울트라 센서티브 워시젤', en: 'Med Ultra Sensitive Washgel', de: 'Med Ultra Sensitive Washgel' },
        keyIngredients: 'Panthenol · Allantoin · pH 5.5',
        badge:          { ko: '민감성 전용', en: 'Sensitive', de: 'Sensitiv' },
        role:           'cleanser',
        price:          2.95,
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
      ko: '판테놀 · 히알루론산 · 스쿠알란으로 진정 및 수분을 공급하세요',
      en: 'Replenish with Panthenol · Triple Hyaluronic Acid · Squalane',
      de: 'Mit Panthenol · Hyaluronsäure · Squalan auffüllen',
    },
    products: [
      {
        id:             'KR_rawquest_barrier_toner_essence',
        name:           { ko: '베리어 인핸싱 토너 투 에센스', en: 'Barrier Enhancing Toner to Essence', de: 'Barrier Enhancing Toner to Essence' },
        keyIngredients: 'Panthenol · Squalane · Triple Hyaluronic Acid',
        role:           'toner_essence',
        price:          23.0,
        emoji:          '💧',
      },
      {
        id:             'DE_colibri_barrier_booster',
        name:           { ko: '배리어 부스터', en: 'Barrier Booster', de: 'Barrier Booster' },
        keyIngredients: 'Ceramides (5 Types) · Cholesterol · Fatty Acids',
        badge:          { ko: '5종 세라마이드', en: '5 Ceramides', de: '5 Ceramide' },
        role:           'serum',
        price:          29.95,
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
      ko: '세라마이드 · 판테놀 · 스쿠알란으로 지질막을 복구하고\nSPF50+ 선에센스로 2차 손상을 막으세요',
      en: 'Repair lipid layer with Ceramides · Panthenol · Squalane\nProtect with SPF50+ sun essence',
      de: 'Lipidschicht mit Ceramiden · Panthenol · Squalan reparieren\nMit SPF50+ Sonnenessenz schützen',
    },
    products: [
      {
        id:             'KR_rawquest_barrier_recovery_cream',
        name:           { ko: '베리어 리커버리 크림', en: 'Barrier Recovery Cream', de: 'Barrier Recovery Cream' },
        keyIngredients: 'Ceramide NP · Panthenol · Squalane · Triple HA',
        role:           'moisturizer',
        price:          25.0,
        emoji:          '🛡️',
      },
      {
        id:             'KR_rawquest_barrier_sunessence',
        name:           { ko: '베리어 리커버리 선에센스 SPF50+', en: 'Barrier Recovery Sun Essence SPF50+', de: 'Barrier Recovery Sun Essence SPF50+' },
        keyIngredients: 'Panthenol · Niacinamide · Triple HA · PA++++',
        badge:          { ko: '미네랄 SPF', en: 'SPF50+', de: 'LSF50+' },
        role:           'sunscreen',
        price:          16.0,
        emoji:          '☀️',
      },
    ],
  },
];
