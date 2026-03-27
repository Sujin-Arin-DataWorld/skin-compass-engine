/**
 * PRODUCT RULES — EXPANSION NEEDED
 *
 * Current: 5 rules
 * Target: Cover all 8 skin profiles × key product categories
 * Product DB: ~135 products in product_db_merged.json
 *
 * Priority expansion areas:
 *   - Eye cream rules (missing entirely)
 *   - Premium tier rules (>€50 products)
 *   - Men's cleanser rules
 *   - Sensitive skin + device-compatibility rules
 *   - Acne/blemish-specific product rules
 *   - Combined condition rules (e.g., oily + sensitive)
 *
 * Rule schema reference:
 *   triggerCondition: (scores: SkinAxisScores) => boolean
 *   products: linked via productId (matches productDatabase IDs)
 *   priority: lower number = higher priority
 *   targetAxes: string[] (axes this product addresses)
 *
 * TODO: Expand rule set from product database audit.
 */
import type { ProductRule } from '@/types/skinAnalysis';

export const PRODUCT_RULES: ProductRule[] = [
  {
    productId: 'SSL-001',
    name: {
      ko: '세라마이드 장벽 리페어 앰플',
      en: 'Ceramide Barrier Repair Ampoule',
      de: 'Ceramid Barriere-Reparatur Ampulle',
    },
    image: '/images/products/ampoule.png',
    triggerCondition: (s) => s.bar < 40 && s.sen > 60,
    priority: 1,
    marketingCopy: {
      ko: '무너진 피부 장벽을 빠르게 회복시켜 줄 구원템',
      en: 'Your rescue for a damaged skin barrier',
      de: 'Ihre Rettung für eine geschädigte Hautbarriere',
    },
    targetAxes: ['bar', 'sen'],
  },
  {
    productId: 'SSL-002',
    name: {
      ko: '포어 타이트닝 BHA 토너',
      en: 'Pore Tightening BHA Toner',
      de: 'Porenverfeinerung BHA Toner',
    },
    image: '/images/products/toner.png',
    triggerCondition: (s) => s.seb > 70 && s.texture > 60,
    priority: 2,
    marketingCopy: {
      ko: '과잉 피지와 넓어진 모공을 쫀쫀하게 잡아주는 첫 단계',
      en: 'First step to control excess oil and tighten pores',
      de: 'Erster Schritt gegen überschüssigen Talg und große Poren',
    },
    targetAxes: ['seb', 'texture'],
  },
  {
    productId: 'SSL-003',
    name: {
      ko: '나이아신아마이드 브라이트닝 세럼',
      en: 'Niacinamide Brightening Serum',
      de: 'Niacinamid Aufhellungsserum',
    },
    image: '/images/products/serum.png',
    triggerCondition: (s) => s.pigment > 50 || s.ox > 60,
    priority: 3,
    marketingCopy: {
      ko: '칙칙한 피부에 생기를 되찾아주는 미백 세럼',
      en: 'Revive dull skin with brightening power',
      de: 'Beleben Sie fahle Haut mit Aufhellungskraft',
    },
    targetAxes: ['pigment', 'ox'],
  },
  {
    productId: 'SSL-004',
    name: {
      ko: '히알루론산 딥 하이드레이션 크림',
      en: 'Hyaluronic Acid Deep Hydration Cream',
      de: 'Hyaluronsäure Tiefenfeuchtigkeit Creme',
    },
    image: '/images/products/cream.png',
    triggerCondition: (s) => s.hyd < 40,
    priority: 2,
    marketingCopy: {
      ko: '극건조 피부에 72시간 수분을 채워주는 집중 크림',
      en: '72-hour moisture surge for severely dry skin',
      de: '72-Stunden-Feuchtigkeitsschub für sehr trockene Haut',
    },
    targetAxes: ['hyd', 'bar'],
  },
  {
    productId: 'SSL-005',
    name: {
      ko: '레티놀 안티에이징 나이트 세럼',
      en: 'Retinol Anti-Aging Night Serum',
      de: 'Retinol Anti-Aging Nachtserum',
    },
    image: '/images/products/night-serum.png',
    triggerCondition: (s) => s.aging > 55,
    priority: 3,
    marketingCopy: {
      ko: '밤새 탄력을 되찾는 레티놀 집중 케어',
      en: 'Overnight firming with clinical-grade retinol',
      de: 'Nächtliche Straffung mit professionellem Retinol',
    },
    targetAxes: ['aging'],
  },
];

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
