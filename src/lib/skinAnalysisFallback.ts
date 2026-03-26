/**
 * skinAnalysisFallback.ts
 *
 * Score-Aware Fallback Engine — "Zero-Downtime Insurance"
 *
 * When the Groq API fails or returns null reasons, this local rule engine
 * generates contextual reason text based on numeric scores alone.
 * The user never sees a blank screen or "server error" — they always get
 * professional, personalized analysis text.
 *
 * Architecture: 10 axes × 3 tiers (low/mid/high) × 3 languages = 90 rules
 */

type LangKey = 'ko' | 'en' | 'de';

interface TierText {
  ko: string;
  en: string;
  de: string;
}

interface AxisFallback {
  low: TierText;   // 0–35
  mid: TierText;   // 36–65
  high: TierText;  // 66–100
}

// ── CARE_TIPS: Local rule engine (10 axes × 3 tiers × 3 langs) ──────────────
const CARE_TIPS: Record<string, AxisFallback> = {
  seb: {
    low:  { ko: '피부가 건조한 편입니다. 유분 보충이 필요해요.', en: 'Skin is on the dry side. Oil supplementation recommended.', de: 'Die Haut ist eher trocken. Ölergänzung empfohlen.' },
    mid:  { ko: '유수분 밸런스가 양호합니다.', en: 'Oil-moisture balance is good.', de: 'Die Öl-Feuchtigkeits-Balance ist gut.' },
    high: { ko: 'T존 유분이 많습니다. 피지 조절 케어를 추천합니다.', en: 'T-zone is oily. Sebum control care recommended.', de: 'T-Zone ist ölig. Talgkontrolle empfohlen.' },
  },
  hyd: {
    low:  { ko: '수분이 부족합니다. 보습 집중 케어가 필요해요.', en: 'Hydration is low. Intensive moisturizing needed.', de: 'Die Feuchtigkeit ist niedrig. Intensive Pflege nötig.' },
    mid:  { ko: '수분 레벨이 적정합니다.', en: 'Hydration level is adequate.', de: 'Der Feuchtigkeitsgehalt ist ausreichend.' },
    high: { ko: '피부가 촉촉하고 탄력이 좋습니다.', en: 'Skin is well-hydrated and plump.', de: 'Die Haut ist gut durchfeuchtet und prall.' },
  },
  bar: {
    low:  { ko: '피부 장벽이 약해져 있습니다. 장벽 강화 제품을 권장합니다.', en: 'Skin barrier is compromised. Barrier-repair products recommended.', de: 'Die Hautbarriere ist geschwächt. Barriere-Reparatur empfohlen.' },
    mid:  { ko: '피부 장벽 상태가 보통입니다.', en: 'Skin barrier condition is moderate.', de: 'Der Hautzustand der Barriere ist mäßig.' },
    high: { ko: '건강한 피부 장벽을 유지하고 있습니다.', en: 'Healthy skin barrier maintained.', de: 'Gesunde Hautbarriere wird aufrechterhalten.' },
  },
  sen: {
    low:  { ko: '피부가 튼튼하고 자극에 강합니다.', en: 'Skin is resilient and resistant.', de: 'Die Haut ist widerstandsfähig und robust.' },
    mid:  { ko: '가벼운 민감성이 있습니다. 자극 방지 케어를 추천합니다.', en: 'Mild sensitivity detected. Gentle care recommended.', de: 'Leichte Empfindlichkeit. Sanfte Pflege empfohlen.' },
    high: { ko: '민감 피부입니다. 무향/저자극 제품을 사용하세요.', en: 'Sensitive skin. Use fragrance-free, gentle products.', de: 'Empfindliche Haut. Verwenden Sie parfümfreie Produkte.' },
  },
  acne: {
    low:  { ko: '피부가 맑고 깨끗합니다.', en: 'Skin is clear and blemish-free.', de: 'Die Haut ist klar und makellos.' },
    mid:  { ko: '약간의 트러블이 관찰됩니다. 진정 케어를 권장합니다.', en: 'Minor blemishes observed. Calming care recommended.', de: 'Leichte Unreinheiten. Beruhigende Pflege empfohlen.' },
    high: { ko: '트러블이 활발합니다. 항균/진정 집중 케어가 필요합니다.', en: 'Active breakouts detected. Anti-blemish care needed.', de: 'Aktive Unreinheiten. Anti-Unreinheiten-Pflege nötig.' },
  },
  pigment: {
    low:  { ko: '피부 톤이 균일합니다.', en: 'Skin tone is even and uniform.', de: 'Der Hautton ist gleichmäßig.' },
    mid:  { ko: '약간의 색소 불균형이 보입니다. 미백 케어를 고려하세요.', en: 'Slight pigmentation irregularity. Brightening care advised.', de: 'Leichte Pigmentunregelmäßigkeit. Aufhellende Pflege empfohlen.' },
    high: { ko: '색소 침착이 뚜렷합니다. 비타민C/나이아신아마이드를 추천합니다.', en: 'Noticeable pigmentation. Vitamin C/Niacinamide recommended.', de: 'Deutliche Pigmentierung. Vitamin C/Niacinamid empfohlen.' },
  },
  texture: {
    low:  { ko: '피부결이 매끄럽고 모공이 작습니다.', en: 'Smooth skin texture with small pores.', de: 'Glatte Hautstruktur mit kleinen Poren.' },
    mid:  { ko: '피부결이 보통입니다. 각질 관리가 도움이 됩니다.', en: 'Average texture. Exfoliation may help.', de: 'Durchschnittliche Textur. Peeling kann helfen.' },
    high: { ko: '모공이 넓고 피부결이 거칩니다. 리서페이싱 케어를 권장합니다.', en: 'Visible pores and rough texture. Resurfacing care recommended.', de: 'Sichtbare Poren und raue Textur. Resurfacing empfohlen.' },
  },
  aging: {
    low:  { ko: '눈에 띄는 노화 징후가 없습니다.', en: 'No visible signs of aging.', de: 'Keine sichtbaren Alterungszeichen.' },
    mid:  { ko: '초기 노화 징후가 보입니다. 예방 케어를 시작하세요.', en: 'Early aging signs visible. Start preventive care.', de: 'Frühe Alterungszeichen. Vorbeugende Pflege starten.' },
    high: { ko: '주름과 탄력 저하가 관찰됩니다. 안티에이징 케어를 권장합니다.', en: 'Wrinkles and loss of firmness. Anti-aging care recommended.', de: 'Falten und Elastizitätsverlust. Anti-Aging-Pflege empfohlen.' },
  },
  ox: {
    low:  { ko: '피부가 건강하게 빛나고 있습니다.', en: 'Skin has a healthy, radiant glow.', de: 'Die Haut hat einen gesunden Glanz.' },
    mid:  { ko: '약간의 칙칙함이 있습니다. 항산화 케어를 권장합니다.', en: 'Slight dullness detected. Antioxidant care recommended.', de: 'Leichte Mattheit. Antioxidative Pflege empfohlen.' },
    high: { ko: '피부가 칙칙하고 생기가 부족합니다. 비타민C 집중 케어가 필요합니다.', en: 'Skin is dull and lacking radiance. Vitamin C care needed.', de: 'Die Haut ist matt. Vitamin C-Pflege nötig.' },
  },
  makeup_stability: {
    low:  { ko: '메이크업 지속력이 낮습니다. 프라이머 사용을 권장합니다.', en: 'Low makeup hold. Primer use recommended.', de: 'Geringe Make-up-Haltbarkeit. Primer empfohlen.' },
    mid:  { ko: '메이크업 지속력이 보통입니다.', en: 'Average makeup hold throughout the day.', de: 'Durchschnittliche Make-up-Haltbarkeit.' },
    high: { ko: '메이크업 지속력이 우수합니다.', en: 'Excellent makeup hold expected.', de: 'Hervorragende Make-up-Haltbarkeit erwartet.' },
  },
};

// ── Score → Tier mapping ────────────────────────────────────────────────────
function getTier(score: number): 'low' | 'mid' | 'high' {
  if (score <= 35) return 'low';
  if (score <= 65) return 'mid';
  return 'high';
}

/**
 * Generate localized reason text for a single axis based on score.
 * Used as fallback when Groq API reasons are unavailable.
 */
export function generateLocalReason(
  axis: string,
  score: number,
  lang: LangKey,
): string {
  const axisTips = CARE_TIPS[axis];
  if (!axisTips) return '';
  const tier = getTier(score);
  return axisTips[tier][lang] ?? axisTips[tier].en;
}

/**
 * Generate all 10 axis reasons using the local rule engine.
 * Returns a complete Record<string, string> — guaranteed non-null.
 */
export function generateAllLocalReasons(
  scores: Record<string, number>,
  lang: LangKey,
): Record<string, string> {
  const reasons: Record<string, string> = {};
  for (const [axis, score] of Object.entries(scores)) {
    reasons[axis] = generateLocalReason(axis, score, lang);
  }
  return reasons;
}

/**
 * Merge API reasons with local fallback — "Zero-Downtime Insurance"
 *
 * Strategy:
 * - If API provided valid reasons, use them (AI-generated, contextual)
 * - For any missing axis, fill from local CARE_TIPS
 * - Result is ALWAYS a complete Record with all 10 axes
 */
export function mergeReasonsWithFallback(
  apiReasons: Record<string, string> | null | undefined,
  scores: Record<string, number>,
  lang: LangKey,
): Record<string, string> {
  const localReasons = generateAllLocalReasons(scores, lang);

  if (!apiReasons) return localReasons;

  // Merge: API reasons take priority, local fills gaps
  const merged: Record<string, string> = {};
  for (const axis of Object.keys(localReasons)) {
    merged[axis] = (apiReasons[axis] && apiReasons[axis].length > 0)
      ? apiReasons[axis]
      : localReasons[axis];
  }
  return merged;
}
