/**
 * sharedResultsData.ts
 *
 * Shared data structures extracted from SlideAxisBreakdown.tsx, SlideProtocol.tsx,
 * and SlideWhyProducts.tsx for reuse across the redesigned results slides.
 */

import type { AxisKey } from '@/engine/types';

// ── Score-based color helper ────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 70) return '#E24B4A';
  if (score >= 30) return '#BA7517';
  return '#86868B';
}

export function scoreBorderColor(score: number, opacity = 0.12): string {
  if (score >= 70) return `rgba(226,75,74,${opacity})`;
  if (score >= 30) return `rgba(186,117,23,${opacity})`;
  return `rgba(134,134,139,${opacity})`;
}

export function scoreBgColor(score: number, opacity = 0.04): string {
  if (score >= 70) return `rgba(226,75,74,${opacity})`;
  if (score >= 30) return `rgba(186,117,23,${opacity})`;
  return `rgba(134,134,139,${opacity})`;
}

/** Category-tinted backgrounds for product image containers */
export function categoryTint(role: string): string {
  switch (role) {
    case 'cleanser':    return 'rgba(74,158,104,0.06)';
    case 'toner':       return 'rgba(55,138,221,0.06)';
    case 'serum':       return 'rgba(186,117,23,0.06)';
    case 'treatment':   return 'rgba(186,117,23,0.06)';
    case 'moisturizer': return 'rgba(226,75,74,0.06)';
    case 'spf':         return 'rgba(186,117,23,0.06)';
    case 'device':      return 'rgba(134,134,139,0.06)';
    default:            return 'rgba(134,134,139,0.06)';
  }
}

// ── Axis interpretation text (from SlideAxisBreakdown.tsx) ──────────────

export const AXIS_INTERPRETATIONS: Partial<Record<AxisKey, {
  en: (s: number) => string;
  de: (s: number) => string;
  ko: (s: number) => string;
}>> = {
  acne: {
    en: (s) => s >= 75 ? "Cyclical, likely hormonally driven" : s >= 50 ? "Moderate, inflammatory pattern" : "Occasional, surface-level",
    de: (s) => s >= 75 ? "Zyklisch, wahrscheinlich hormonell bedingt" : s >= 50 ? "Mäßiges, entzündliches Muster" : "Gelegentlich, oberflächlich",
    ko: (s) => s >= 75 ? "주기적, 호르몬성 가능성 높음" : s >= 50 ? "중간 수준의 염증 패턴" : "간헐적, 표면성",
  },
  seb: {
    en: (s) => s >= 75 ? "Rapid oil return, T-zone dominant" : s >= 50 ? "Balanced but reactive to humidity" : "Controlled",
    de: (s) => s >= 75 ? "Schnelle Hautöl-Produktion, T-Zonen-dominant" : s >= 50 ? "Ausgeglichen, reagiert auf Feuchtigkeit" : "Kontrolliert",
    ko: (s) => s >= 75 ? "빠른 피지 재분비, T존 집중" : s >= 50 ? "균형적이나 습도에 반응" : "조절됨",
  },
  hyd: {
    en: (s) => s >= 75 ? "Rapid moisture loss — barrier needs repair" : s >= 50 ? "Suboptimal moisture retention" : "Adequate",
    de: (s) => s >= 75 ? "Schneller Feuchtigkeitsverlust — Barriere braucht Reparatur" : s >= 50 ? "Suboptimale Feuchtigkeitsspeicherung" : "Ausreichend",
    ko: (s) => s >= 75 ? "빠른 수분 손실 — 장벽 회복 필요" : s >= 50 ? "수분 유지력 부족" : "적절함",
  },
  sen: {
    en: (s) => s >= 75 ? "High reactivity — multiple trigger exposure" : s >= 50 ? "Moderate — flush and thermal reactivity" : "Manageable",
    de: (s) => s >= 75 ? "Hohe Reaktivität — reagiert auf multiple Trigger" : s >= 50 ? "Mäßig — Flush und thermische Reaktivität" : "Handhabbar",
    ko: (s) => s >= 75 ? "높은 반응성 — 복수 자극 요인 노출" : s >= 50 ? "중간 — 홍조 및 열 반응성" : "관리 가능",
  },
  pigment: {
    en: (s) => s >= 75 ? "UV-responsive, melasma-type deepening" : s >= 50 ? "Post-inflammatory marks, localized" : "Mild",
    de: (s) => s >= 75 ? "UV-reaktiv, Melasma-artige Verdunkelung" : s >= 50 ? "Post-inflammatorische Spuren, lokalisiert" : "Mild",
    ko: (s) => s >= 75 ? "자외선 반응성, 기미형 심화" : s >= 50 ? "염증 후 색소침착, 국소적" : "경미함",
  },
  texture: {
    en: (s) => s >= 75 ? "Dual mechanism — pores + surface roughness" : s >= 50 ? "Congestion-dominant" : "Minor irregularity",
    de: (s) => s >= 75 ? "Dualer Mechanismus — Poren + Oberflächenrauheit" : s >= 50 ? "Von Verstopfung dominiert" : "Geringe Unregelmäßigkeit",
    ko: (s) => s >= 75 ? "이중 원인 — 모공 + 표면 거칠기" : s >= 50 ? "모공 막힘 주도" : "경미한 불균일",
  },
  aging: {
    en: (s) => s >= 75 ? "Recoil delay across multiple contour zones" : s >= 50 ? "Early-stage firmness reduction" : "Within normal range",
    de: (s) => s >= 75 ? "Rückstellverzögerung an mehreren Konturenzonen" : s >= 50 ? "Frühstadium der Festigkeitsminderung" : "Im Normalbereich",
    ko: (s) => s >= 75 ? "복수 윤곽 부위에서 탄력 회복 지연" : s >= 50 ? "초기 탄력 감소" : "정상 범위",
  },
  bar: {
    en: (s) => s >= 75 ? "Barrier compromise triad present" : s >= 50 ? "Stress pattern, recovery delayed" : "Mild disruption",
    de: (s) => s >= 75 ? "Trias einer Barrierebeeinträchtigung vorhanden" : s >= 50 ? "Stressmuster, Erholung verzögert" : "Leichte Störung",
    ko: (s) => s >= 75 ? "장벽 손상 3징후 확인" : s >= 50 ? "스트레스 패턴, 회복 지연" : "경미한 손상",
  },
  ox: {
    en: (s) => s >= 75 ? "High oxidative stress — antioxidant protocol essential" : s >= 50 ? "Moderate environmental damage" : "Low oxidative burden",
    de: (s) => s >= 75 ? "Hoher oxidativer Stress — Antioxidantien zwingend" : s >= 50 ? "Mäßige Umweltschäden" : "Geringe oxidative Belastung",
    ko: (s) => s >= 75 ? "높은 산화 스트레스 — 항산화 프로토콜 필수" : s >= 50 ? "중간 수준의 환경성 손상" : "낮은 산화 부담",
  },
};

// ── Critical messages per axis (from SlideAxisBreakdown.tsx) ──────────────

export const CRITICAL_MESSAGES: Partial<Record<AxisKey, { en: string; de: string; ko: string }>> = {
  acne: { en: "Inflammation control must come before any actives.", de: "Entzündungskontrolle muss vor anderen Wirkstoffen kommen.", ko: "모든 활성 성분 전에 염증 관리가 선행되어야 합니다." },
  seb: { en: "Oil regulation is the gateway to texture and pore improvement.", de: "Hautöl-Regulierung ist das Tor zur Verbesserung von Textur und Poren.", ko: "피지 조절이 피부결과 모공 개선의 시작점입니다." },
  hyd: { en: "Barrier hydration is Phase 1 before any targeted treatment.", de: "Barriere-Hydratation ist Phase 1 vor jeder gezielten Behandlung.", ko: "장벽 수분 공급이 모든 집중 케어 전 1단계입니다." },
  sen: { en: "Barrier calming must precede all active ingredients.", de: "Barriere-Beruhigung muss vor der starken Wirkstoffanwendung stehen.", ko: "모든 활성 성분 전에 장벽 진정이 선행되어야 합니다." },
  pigment: { en: "SPF protocol activation is the highest leverage action.", de: "Aktivierung des SPF-Protokolls ist die wirkungsvollste Maßnahme.", ko: "SPF 프로토콜 실천이 가장 효과적인 조치입니다." },
  texture: { en: "Gentle exfoliation cadence is the critical variable.", de: "Regelmäßiges, schonendes Peeling ist die entscheidende Variable.", ko: "부드러운 각질 제거 주기가 핵심 변수입니다." },
  aging: { en: "Collagen-supporting actives unlock in Phase 4.", de: "Kollagenunterstützende Wirkstoffe entfalten Phase 4.", ko: "콜라겐 지지 활성 성분은 4단계에서 효과가 나타납니다." },
  bar: { en: "Barrier repair must be established before adding any new actives.", de: "Die Barrierereparatur muss aufgebaut sein, bevor neue Wirkstoffe hinzugefügt werden.", ko: "새로운 활성 성분 추가 전 장벽 회복이 선행되어야 합니다." },
  ox: { en: "Antioxidant integration is the first line of defence.", de: "Antioxidantien-Integration ist die erste Verteidigungslinie.", ko: "항산화제 적용이 첫 번째 방어선입니다." },
};

// ── Clinical flag messages (from SlideProtocol.tsx) ──────────────────────

export const FLAG_MESSAGES: Record<string, {
  icon: string;
  title: Record<string, string>;
  body: Record<string, string>;
}> = {
  BARRIER_EMERGENCY: {
    icon: "⚠️",
    title: { en: "Barrier Emergency", de: "Barriere-Notfall", ko: "장벽 응급" },
    body: { en: "Pause all actives for 2 weeks. Focus on cleansing, barrier serum & moisturiser only.", de: "Alle Wirkstoffe für 2 Wochen pausieren. Nur Reinigung, Barriere-Serum & Feuchtigkeitspflege.", ko: "모든 액티브 성분을 2주간 중단하세요. 세안제, 배리어 세럼, 보습제만 사용하세요." },
  },
  ACTIVE_INGREDIENT_PAUSE: {
    icon: "⚠️",
    title: { en: "Exfoliation Pause", de: "Peeling-Pause", ko: "각질 제거 중단" },
    body: { en: "Remove all exfoliants for 4 weeks.", de: "Alle Peelings für 4 Wochen absetzen.", ko: "모든 각질 제거제를 4주간 중단하세요." },
  },
  HORMONAL_ACNE_PROTOCOL: {
    icon: "ℹ️",
    title: { en: "Hormonal Pattern Detected", de: "Hormonelles Muster erkannt", ko: "호르몬 패턴 감지" },
    body: { en: "Track skin alongside your menstrual cycle for best results.", de: "Beobachten Sie Ihre Haut parallel zu Ihrem Zyklus.", ko: "최상의 효과를 위해 월경 주기와 함께 피부 상태를 기록하세요." },
  },
  DERMATOLOGIST_REFERRAL: {
    icon: "⚕️",
    title: { en: "Consultation Advised", de: "Konsultation Empfohlen", ko: "전문의 상담 권장" },
    body: { en: "Acne severity may benefit from medical treatment.", de: "Die Schwere der Akne könnte von ärztlicher Behandlung profitieren.", ko: "여드름 심각도가 의학적 치료에서 도움을 받을 수 있습니다." },
  },
  DEVICE_RECOMMENDED: {
    icon: "💡",
    title: { en: "Device Recommended", de: "Gerät Empfohlen", ko: "기기 사용 권장" },
    body: { en: "EMS/LED device 3× weekly amplifies serum results.", de: "EMS/LED-Gerät 3× wöchentlich verstärkt Serum-Ergebnisse.", ko: "EMS/LED 기기를 주 3회 사용하면 세럼 효과가 증폭됩니다." },
  },
};

// ── Mock product prices (SSL catalog) ───────────────────────────────────
// The mock catalog IDs (ssl-*) are separate from product_db_merged.json.
// These realistic EUR prices allow the UI to display meaningful numbers.

export const MOCK_PRODUCT_PRICES: Record<string, number> = {
  // Cleansers
  'ssl-clean-gel': 18, 'ssl-clean-cream': 22, 'ssl-clean-foam': 16,
  // Toners
  'ssl-toner-barrier': 24, 'ssl-toner-hydra': 22, 'ssl-toner-bha': 20,
  'ssl-toner-niacin': 20, 'ssl-toner-vc': 26, 'ssl-toner-peptide': 28,
  // Serums
  'ssl-serum-barrier-oily': 32, 'ssl-serum-barrier-dry': 34,
  'ssl-serum-hydra-oily': 28, 'ssl-serum-hydra-dry': 30,
  'ssl-serum-blemish-am-oily': 30, 'ssl-serum-blemish-am-dry': 28,
  'ssl-serum-blemish-pm-oily': 32, 'ssl-serum-blemish-pm-dry': 30,
  'ssl-serum-bright-oily': 36, 'ssl-serum-bright-dry': 38,
  'ssl-serum-aging-am-oily': 34, 'ssl-serum-aging-am-dry': 36,
  'ssl-serum-aging-pm-oily': 38, 'ssl-serum-aging-pm-dry': 40,
  // Treatments
  'ssl-treat-barrier': 28, 'ssl-treat-hydra': 26, 'ssl-treat-blemish': 24,
  'ssl-treat-bright': 30, 'ssl-treat-aging': 36,
  // Moisturizers
  'ssl-moist-gel': 24, 'ssl-moist-emulsion': 26, 'ssl-moist-cream': 28, 'ssl-moist-lotion': 22,
  // SPF
  'ssl-spf-fluid': 22, 'ssl-spf-cream': 24,
  // Device
  'medicube-booster-pro': 189,
  // Hero
  'ssl-hero-essence': 32,
  // SOS
  'madeca-cleanser': 14, 'madeca-serum': 22, 'madeca-cream': 18,
  'aestura-cleanser': 16, 'aestura-serum': 24, 'aestura-cream': 20,
  // Barrier recovery overrides (routineEngineV5 BARRIER_EMERGENCY)
  'barrier-serum-recovery': 28, 'barrier-moist-recovery': 26, 'barrier-spf-mineral': 22,
};

export function getProductPrice(productId: string): number {
  return MOCK_PRODUCT_PRICES[productId] ?? 0;
}

// ── Skin cell turnover cycle mapping ──────────────────────────────────────

export const AGE_CYCLE_MAP: Record<number, { cycleDays: number; ageLabel: Record<string, string> }> = {
  0: { cycleDays: 21, ageLabel: { ko: '10대', de: 'Teenager', en: 'teens' } },
  1: { cycleDays: 25, ageLabel: { ko: '20대', de: '20er', en: '20s' } },
  2: { cycleDays: 35, ageLabel: { ko: '30대', de: '30er', en: '30s' } },
  3: { cycleDays: 40, ageLabel: { ko: '40대', de: '40er', en: '40s' } },
  4: { cycleDays: 60, ageLabel: { ko: '50대', de: '50er', en: '50s' } },
  5: { cycleDays: 75, ageLabel: { ko: '60대 이상', de: '60er+', en: '60s+' } },
};

// ── Role emoji map ───────────────────────────────────────────────────────

export const ROLE_EMOJI: Record<string, string> = {
  cleanser: '🫧', toner: '💧', serum: '🔬', treatment: '👁',
  moisturizer: '🛡', spf: '☀️', eye: '👁', device: '✨',
};
