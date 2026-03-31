/**
 * skinVectorEngineV5.ts
 *
 * Takes ScoringOutput from scoringEngineV5 and produces a full AnalysisResult
 * (backward-compatible shape) plus V5-only additive fields.
 *
 *   Backward-compat fields  — identical shape to AnalysisResult in types.ts
 *   New V5 fields           — axis_severity_grade, zone_heatmap, score_provenance
 */

import type {
  AxisKey, AxisSeverity,
  DetectedPattern, AnalysisResult, Product, RiskPattern, Urgency,
} from "@/engine/types";
import { AXIS_KEYS, AXIS_LABELS, RADAR_AXES } from "@/engine/types";
import type { ScoreProvenance, ZoneId } from "@/engine/scoringEngineV5";

// ─────────────────────────────────────────────────────────────────────────────
// Trilingual label type
// ─────────────────────────────────────────────────────────────────────────────

interface Tri { en: string; de: string; ko: string }

// ─────────────────────────────────────────────────────────────────────────────
// V5 extended types
// ─────────────────────────────────────────────────────────────────────────────

export interface AxisSeverityGrade {
  grade: "stable" | "watch" | "active" | "critical";
  label: Tri;
}

export interface ZoneHeatmapEntry {
  intensity: number;       // 0-1, normalized avg axis score
  dominantAxis: AxisKey;
  concernCount: number;
  summary: Tri;
}

/** SkinVectorResult = AnalysisResult + V5-only additive fields */
export type SkinVectorResult = AnalysisResult & {
  axis_severity_grade: Record<AxisKey, AxisSeverityGrade>;
  zone_heatmap: Partial<Record<ZoneId, ZoneHeatmapEntry>>;
  score_provenance: ScoreProvenance[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

export interface SkinVectorInput {
  scores: Record<AxisKey, number>;
  provenance: ScoreProvenance[];
  zoneData: Record<string, string[]>;
  implicitFlags: { atopyFlag: boolean;[key: string]: unknown };
  /** Flags already set by scoringEngineV5 (e.g. HORMONAL_ACNE, ATOPY) */
  activeFlags: string[];
  products: Product[];
}

// ─────────────────────────────────────────────────────────────────────────────
// V5 Risk Pattern definitions
//
// name_en values MUST match EMPATHY_MAP keys in SlideAnalysisSummary.tsx:
//   'Hormonal Acne Cascade'       'Barrier Stress Pattern'
//   'Dehydrated-Oily Complex'     'Melasma-Dominant Pattern'
//   'Texture-Congestion Overlap'  'Elasticity Loss — Early Stage'
// ─────────────────────────────────────────────────────────────────────────────

interface V5RiskPattern extends RiskPattern {
  name_ko: string;
  guidance_ko: string;
  /** All axis gates; ALL must pass (hard-fail on any miss) */
  v5Gates: Partial<Record<AxisKey, number>>;
  /** Anti-gate: if set, this axis must be BELOW the given value */
  v5AntiGate?: Partial<Record<AxisKey, number>>;
  /** A flag from scoring that must be present */
  requiresFlag?: string;
}

const V5_PATTERNS: V5RiskPattern[] = [
  // ── 1. Barrier Stress Pattern ─────────────────────────────────────────────
  {
    id: "V5_BARRIER_STRESS",
    name_en: "Barrier Stress Pattern",
    name_de: "Barriere-Stress-Muster",
    name_ko: "장벽 스트레스 패턴",
    required: [], optional: [], min_optional: 0,
    axis_gates: { bar: 60, sen: 55 },
    v5Gates: { bar: 60, sen: 55 },
    guidance_en:
      "Compromised barrier function driving reactive sensitivity. Skin is permeable, inflamed, and unable to retain moisture. Active ingredients should be paused.",
    guidance_de:
      "Beeinträchtigte Barrierefunktion mit reaktiver Empfindlichkeit. Haut ist durchlässig, entzündet und kann Feuchtigkeit nicht halten. Aktive Wirkstoffe sollten pausiert werden.",
    guidance_ko:
      "반응성 민감도를 유발하는 손상된 피부 장벽. 피부가 투과성이 높고 염증이 있으며 수분을 유지하지 못합니다. 활성 성분 사용을 중단해야 합니다.",
    flag: "BARRIER_EMERGENCY",
    urgency: "HIGH",
    threshold: 50,
  },

  // ── 2. Dehydrated-Oily Complex ────────────────────────────────────────────
  {
    id: "V5_DEHYDRATED_OILY",
    name_en: "Dehydrated-Oily Complex",
    name_de: "Ölig-Dehydrierter Komplex",
    name_ko: "탈수성 지성 복합 피부",
    required: [], optional: [], min_optional: 0,
    axis_gates: { seb: 55, hyd: 50 },
    v5Gates: { seb: 55, hyd: 50 },
    guidance_en:
      "Simultaneous excess skin oil and moisture deficit — a compensatory cycle where surface oil masks underlying dehydration. Hydration-first protocol required.",
    guidance_de:
      "Gleichzeitig überschüssiges Hautöl und Feuchtigkeitsmangel — ein kompensatorischer Kreislauf, bei dem Oberflächenöl die zugrunde liegende Dehydrierung maskiert.",
    guidance_ko:
      "과다한 피지와 수분 부족이 동시에 나타나는 보상적 사이클. 표면 유분이 내부 탈수를 가리고 있습니다. 수분 공급 우선 프로토콜이 필요합니다.",
    flag: "HYDRATION_FIRST",
    urgency: "MEDIUM",
    threshold: 50,
  },

  // ── 3. Hormonal Acne Cascade ──────────────────────────────────────────────
  {
    id: "V5_HORMONAL_ACNE",
    name_en: "Hormonal Acne Cascade",
    name_de: "Hormonelle Akne-Kaskade",
    name_ko: "호르몬성 여드름 케스케이드",
    required: [], optional: [], min_optional: 0,
    axis_gates: { acne: 60 },
    v5Gates: { acne: 60 },
    requiresFlag: "HORMONAL_ACNE",
    guidance_en:
      "Androgen-driven oil-gland hyperactivity concentrated in jaw, mouth, and lower cheek zones. Breakout cycle correlates with hormonal fluctuation.",
    guidance_de:
      "Androgen-getriebene Öl-Drüsen-Hyperaktivität in Kiefer-, Kinn- und Untergesichtsbereichen. Ausbruchszyklus korreliert mit hormonellen Schwankungen.",
    guidance_ko:
      "안드로겐이 유발하는 피지선 과활성 — 턱선, 턱, 하부 볼에 집중. 여드름 주기가 호르몬 변동과 상관관계가 있습니다.",
    flag: "HORMONAL_ACNE_PROTOCOL",
    urgency: "MEDIUM",
    threshold: 50,
  },

  // ── 4. Melasma-Dominant Pattern ───────────────────────────────────────────
  {
    id: "V5_MELASMA",
    name_en: "Melasma-Dominant Pattern",
    name_de: "Melasma-Dominantes Muster",
    name_ko: "기미 우세 패턴",
    required: [], optional: [], min_optional: 0,
    axis_gates: { pigment: 55, aging: 50 },
    v5Gates: { pigment: 55, aging: 50 },
    guidance_en:
      "UV-responsive deepening of pigmentation with concurrent aging stress. Melanocyte hyperactivity likely UV and hormonally co-triggered.",
    guidance_de:
      "UV-reaktive Vertiefung der Pigmentierung mit gleichzeitigem Alterungsstress. Melanozyten-Hyperaktivität wahrscheinlich UV- und hormonell ko-ausgelöst.",
    guidance_ko:
      "UV에 반응하는 색소 침착 심화와 동반 노화 스트레스. 멜라닌 세포 과활성은 자외선과 호르몬에 의해 복합적으로 유발될 가능성이 높습니다.",
    flag: "ANTIOXIDANT_PRIORITY",
    urgency: "MEDIUM",
    threshold: 50,
  },

  // ── 5. Texture-Congestion Overlap ─────────────────────────────────────────
  {
    id: "V5_TEXTURE_CONGESTION",
    name_en: "Texture-Congestion Overlap",
    name_de: "Textur-Verstopfungs-Überlappung",
    name_ko: "텍스처-모공 막힘 중복 패턴",
    required: [], optional: [], min_optional: 0,
    axis_gates: { texture: 55, seb: 45 },
    v5Gates: { texture: 55, seb: 45 },
    guidance_en:
      "Pore congestion and surface texture irregularity sharing the same root — excess skin oil driving follicular impaction and surface roughness.",
    guidance_de:
      "Porenblockierung und Texturunregelmäßigkeiten mit derselben Ursache — überschüssiges Hautöl treibt follikuläre Verstopfung und Oberflächenrauheit an.",
    guidance_ko:
      "모공 막힘과 표면 질감 불균일이 같은 원인을 공유 — 과다한 피지가 모낭 막힘과 피부 거칠기를 유발합니다.",
    flag: "HYDRATION_FIRST",
    urgency: "LOW",
    threshold: 50,
  },

  // ── 6. Elasticity Loss — Early Stage ─────────────────────────────────────
  {
    id: "V5_ELASTICITY_LOSS",
    name_en: "Elasticity Loss — Early Stage",
    name_de: "Elastizitätsverlust — Frühstadium",
    name_ko: "탄력 감소 — 초기 단계",
    required: [], optional: [], min_optional: 0,
    axis_gates: { aging: 60 },
    v5Gates: { aging: 60 },
    v5AntiGate: { bar: 40 },  // only when barrier is NOT the primary driver
    guidance_en:
      "Early-stage reduction in skin firmness and elasticity. Collagen cross-linking declining; pinch recoil delayed. Device-based collagen-stimulation recommended.",
    guidance_de:
      "Frühe Abnahme von Festigkeit und Elastizität der Haut. Kollagen-Quervernetzung nimmt ab; Hautrückbildung nach Kneifen verzögert. Gerätestimulation empfohlen.",
    guidance_ko:
      "피부 탄력과 탄성의 초기 감소. 콜라겐 교차결합 감소 및 꼬집기 후 회복 지연. 콜라겐 자극 디바이스 사용 권장.",
    flag: "DEVICE_RECOMMENDED",
    urgency: "LOW",
    threshold: 50,
  },
];

/** Fallback when no pattern gates are met */
const BALANCED_PATTERN: V5RiskPattern = {
  id: "V5_BALANCED",
  name_en: "Balanced Profile",
  name_de: "Ausgeglichenes Profil",
  name_ko: "균형 잡힌 피부 프로필",
  required: [], optional: [], min_optional: 0,
  axis_gates: {},
  v5Gates: {},
  guidance_en:
    "No dominant pattern detected. Skin axes are within moderate ranges. Maintenance protocol and daily UV protection are the primary recommendations.",
  guidance_de:
    "Kein dominantes Muster erkannt. Hautdimensionen liegen in moderaten Bereichen. Pflegeprotokoll und täglicher UV-Schutz sind die primären Empfehlungen.",
  guidance_ko:
    "지배적인 패턴이 감지되지 않았습니다. 피부 축이 적절한 범위 내에 있습니다. 유지 관리 프로토콜과 매일 자외선 차단이 주요 권장 사항입니다.",
  flag: "NONE",
  urgency: "LOW",
  threshold: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Concern → axis map  (for zone heatmap, mirrors scoringEngineV5 CONCERN_AXIS_MAP)
// ─────────────────────────────────────────────────────────────────────────────

const CONCERN_TO_AXIS: Record<string, AxisKey> = {
  oily_f: "seb", blackheads_f: "texture", whiteheads_f: "texture",
  lines_f: "aging", breakouts_f: "texture",
  fine_lines_e: "aging", dark_circles_e: "pigment",
  puffiness_e: "aging", dryness_e: "hyd",
  pores_n: "texture", blackheads_n: "texture", oily_n: "seb", redness_n: "sen",
  redness_c: "sen", acne_c: "texture", dryness_c: "hyd",
  pigment_c: "pigment", pores_c: "texture",
  dryness_m: "hyd", nasolabial: "aging", pigment_m: "pigment", perioral_m: "sen",
  hormonal_j: "acne", cystic_j: "acne", texture_j: "texture", sagging_j: "aging",
  neck_lines: "aging", sagging: "aging", neck_red: "sen", neck_dry: "hyd",
};

// ─────────────────────────────────────────────────────────────────────────────
// Zone concern display labels  (EN / DE / KO)
// ─────────────────────────────────────────────────────────────────────────────

const CONCERN_LABELS: Partial<Record<string, Tri>> = {
  oily_f: { en: "Excess oil", de: "Überschüssiges Öl", ko: "과잉 유분" },
  blackheads_f: { en: "Blackheads", de: "Mitesser", ko: "블랙헤드" },
  whiteheads_f: { en: "Whiteheads", de: "Weißköpfe", ko: "화이트헤드" },
  lines_f: { en: "Fine lines", de: "Feine Linien", ko: "잔주름" },
  breakouts_f: { en: "Breakouts", de: "Unreinheiten", ko: "트러블" },
  fine_lines_e: { en: "Fine lines", de: "Feine Linien", ko: "잔주름" },
  dark_circles_e: { en: "Dark circles", de: "Augenringe", ko: "다크서클" },
  puffiness_e: { en: "Puffiness", de: "Schwellungen", ko: "붓기" },
  dryness_e: { en: "Dryness", de: "Trockenheit", ko: "건조함" },
  pores_n: { en: "Enlarged pores", de: "Große Poren", ko: "확장된 모공" },
  blackheads_n: { en: "Blackheads", de: "Mitesser", ko: "블랙헤드" },
  oily_n: { en: "Excess oil", de: "Überschüssiges Öl", ko: "과잉 유분" },
  redness_n: { en: "Redness", de: "Rötung", ko: "홍조" },
  redness_c: { en: "Redness", de: "Rötung", ko: "홍조" },
  acne_c: { en: "Acne", de: "Akne", ko: "여드름" },
  dryness_c: { en: "Dryness", de: "Trockenheit", ko: "건조함" },
  pigment_c: { en: "Pigmentation", de: "Pigmentflecken", ko: "색소침착" },
  pores_c: { en: "Large pores", de: "Große Poren", ko: "큰 모공" },
  dryness_m: { en: "Dryness", de: "Trockenheit", ko: "건조함" },
  nasolabial: { en: "Nasolabial lines", de: "Nasolabialsfalten", ko: "팔자 주름" },
  pigment_m: { en: "Pigmentation", de: "Pigmentflecken", ko: "색소침착" },
  perioral_m: { en: "Perioral sensitivity", de: "Periorale Empf.", ko: "입 주변 민감" },
  hormonal_j: { en: "Hormonal breakouts", de: "Hormonelle Pickel", ko: "호르몬성 트러블" },
  cystic_j: { en: "Cystic acne", de: "Zystische Akne", ko: "낭포성 여드름" },
  texture_j: { en: "Rough texture", de: "Raue Textur", ko: "거친 피부결" },
  sagging_j: { en: "Sagging", de: "Erschlaffung", ko: "처짐" },
  neck_lines: { en: "Neck lines", de: "Halslinien", ko: "목 주름" },
  sagging: { en: "Sagging", de: "Erschlaffung", ko: "처짐" },
  neck_red: { en: "Redness", de: "Rötung", ko: "홍조" },
  neck_dry: { en: "Dryness", de: "Trockenheit", ko: "건조함" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Severity grade thresholds
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_LEVELS = [
  { max: 24, grade: "stable" as const, label: { en: "Stable", de: "Stabil", ko: "안정" } },
  { max: 49, grade: "watch" as const, label: { en: "Watch", de: "Beobachten", ko: "주의" } },
  { max: 74, grade: "active" as const, label: { en: "Active", de: "Aktiv", ko: "관리 필요" } },
  { max: 100, grade: "critical" as const, label: { en: "Critical", de: "Kritisch", ko: "긴급" } },
] as const;

function toSeverityGrade(score: number): AxisSeverityGrade {
  const found = GRADE_LEVELS.find(g => score <= g.max) ?? GRADE_LEVELS[3];
  return { grade: found.grade, label: found.label };
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity converter  (used for axis_severity)
// ─────────────────────────────────────────────────────────────────────────────

function toSeverity(score: number): 0 | 1 | 2 | 3 {
  if (score < 25) return 0;
  if (score < 50) return 1;
  if (score < 75) return 2;
  return 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern detection
// ─────────────────────────────────────────────────────────────────────────────

function computePatternScore(
  pattern: V5RiskPattern,
  scores: Record<AxisKey, number>,
  flags: string[],
): number {
  // Required flag check
  if (pattern.requiresFlag && !flags.includes(pattern.requiresFlag)) return 0;

  // Anti-gate: axis must be BELOW the given value
  if (pattern.v5AntiGate) {
    for (const [axis, maxAllowed] of Object.entries(pattern.v5AntiGate)) {
      if ((scores[axis as AxisKey] ?? 0) >= maxAllowed) return 0;
    }
  }

  // All axis gates must pass
  const gates = Object.entries(pattern.v5Gates);
  if (gates.length === 0) return 0;

  for (const [axis, minRequired] of gates) {
    if ((scores[axis as AxisKey] ?? 0) < minRequired) return 0;
  }

  // Score = 50 + avg(normalised excess above gate), capped at 100
  const avgExcess =
    gates.reduce((sum, [axis, minRequired]) => {
      const excess = ((scores[axis as AxisKey] ?? 0) - minRequired) / (100 - minRequired);
      return sum + Math.max(0, excess);
    }, 0) / gates.length;

  return Math.min(100, 50 + avgExcess * 50);
}

function toPatternSeverity(score: number): 0 | 1 | 2 | 3 {
  if (score < 50) return 0;
  if (score < 70) return 1;
  if (score < 85) return 2;
  return 3;
}

function detectPatterns(
  scores: Record<AxisKey, number>,
  flags: string[],
): DetectedPattern[] {
  const detected: DetectedPattern[] = [];

  for (const pattern of V5_PATTERNS) {
    const score = computePatternScore(pattern, scores, flags);
    if (score >= pattern.threshold) {
      detected.push({
        pattern: pattern as RiskPattern,
        score,
        severity: toPatternSeverity(score),
      });
    }
  }

  detected.sort((a, b) => b.score - a.score);

  // Fallback
  if (detected.length === 0) {
    detected.push({
      pattern: BALANCED_PATTERN as RiskPattern,
      score: 50,
      severity: 0,
    });
  }

  return detected;
}

// ─────────────────────────────────────────────────────────────────────────────
// Flag computation  (additive — extends flags from scoring engine)
// ─────────────────────────────────────────────────────────────────────────────

function computeFlags(
  scores: Record<AxisKey, number>,
  implicitFlags: SkinVectorInput["implicitFlags"],
  existingFlags: string[],
): string[] {
  const flags = [...existingFlags];
  const add = (f: string) => { if (!flags.includes(f)) flags.push(f); };

  if (scores.bar >= 70) add("BARRIER_EMERGENCY");
  if (scores.sen >= 75) add("ACTIVE_INGREDIENT_PAUSE");
  if (scores.acne >= 80) add("DERMATOLOGIST_REFERRAL");
  if (flags.includes("HORMONAL_ACNE") && scores.acne >= 60) add("HORMONAL_ACNE_PROTOCOL");
  if (scores.aging >= 65) add("DEVICE_RECOMMENDED");
  if (implicitFlags.atopyFlag) add("SKIN_RESCUE_OVERRIDE");

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Urgency   (maps to existing Urgency = "LOW"|"MEDIUM"|"HIGH"|"CRITICAL")
// ─────────────────────────────────────────────────────────────────────────────

function computeUrgency(
  flags: string[],
  scores: Record<AxisKey, number>,
): Urgency {
  if (flags.includes("BARRIER_EMERGENCY") || flags.includes("SKIN_RESCUE_OVERRIDE")) {
    return "CRITICAL";
  }
  if (Object.values(scores).some(s => s >= 75)) return "HIGH";
  if (Object.values(scores).some(s => s >= 50)) return "MEDIUM";
  return "LOW";
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone heatmap builder
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ZONES: ZoneId[] = ["forehead", "eyes", "nose", "cheeks", "mouth", "jawline", "neck"];

function buildZoneHeatmap(
  zoneData: Record<string, string[]>,
  scores: Record<AxisKey, number>,
): Partial<Record<ZoneId, ZoneHeatmapEntry>> {
  const heatmap: Partial<Record<ZoneId, ZoneHeatmapEntry>> = {};

  for (const zone of ALL_ZONES) {
    const concerns = (zoneData[zone] ?? []).filter(c => CONCERN_TO_AXIS[c]);
    if (concerns.length === 0) continue;

    const mapped = concerns.map(c => ({
      concern: c,
      axis: CONCERN_TO_AXIS[c],
      score: scores[CONCERN_TO_AXIS[c]] ?? 0,
    }));

    // intensity = avg axis score / 100
    const avgScore = mapped.reduce((s, e) => s + e.score, 0) / mapped.length;
    const intensity = Math.min(1, avgScore / 100);

    // dominantAxis = highest scoring axis among zone's concerns
    const dominant = mapped.reduce((best, e) => e.score > best.score ? e : best);

    // summary = top-3 concern labels joined
    const labels = concerns
      .slice(0, 3)
      .map(c => CONCERN_LABELS[c])
      .filter((l): l is Tri => l != null);

    const summary: Tri = labels.length > 0
      ? {
        en: labels.map(l => l.en).join(" + "),
        de: labels.map(l => l.de).join(" + "),
        ko: labels.map(l => l.ko).join(" + "),
      }
      : { en: "Concerns detected", de: "Beschwerden erkannt", ko: "증상 감지됨" };

    heatmap[zone] = {
      intensity,
      dominantAxis: dominant.axis,
      concernCount: concerns.length,
      summary,
    };
  }

  return heatmap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function buildSkinVector(input: SkinVectorInput): SkinVectorResult {
  const { scores, provenance, zoneData, implicitFlags, activeFlags: inFlags } = input;

  // 1. Resolve full flag set
  const allFlags = computeFlags(scores, implicitFlags, inFlags);

  // 2. Detect patterns
  const detected_patterns = detectPatterns(scores, allFlags);

  // 3. Urgency
  const urgency_level = computeUrgency(allFlags, scores);

  // 4. Axis severity map
  const axis_severity = Object.fromEntries(
    AXIS_KEYS.map(a => [a, toSeverity(scores[a] ?? 0)])
  ) as AxisSeverity;

  // 5. Primary / secondary concerns  (exclude makeup_stability — derived)
  const rankable = AXIS_KEYS.filter(a => a !== "makeup_stability");
  const sorted = [...rankable].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const primary_concerns = sorted.slice(0, 3) as AxisKey[];
  const secondary_concerns = sorted.slice(3, 6) as AxisKey[];

  // 6. Radar chart data
  const radar_chart_data = RADAR_AXES.map(axis => ({
    axis,
    score: scores[axis] ?? 0,
    label: AXIS_LABELS[axis],
  }));

  // 7. Severity grades  (new V5 field)
  const axis_severity_grade = Object.fromEntries(
    AXIS_KEYS.map(a => [a, toSeverityGrade(scores[a] ?? 0)])
  ) as Record<AxisKey, AxisSeverityGrade>;

  // 8. Zone heatmap  (new V5 field)
  const zone_heatmap = buildZoneHeatmap(zoneData, scores);

  return {
    engineVersion: "5.0",

    // ── Backward-compatible AnalysisResult fields ──
    axis_scores: scores,
    axis_severity,
    axis_scores_normalized: scores,   // identical to axis_scores in V5
    detected_patterns,
    urgency_level,
    active_flags: allFlags,
    radar_chart_data,
    primary_concerns,
    secondary_concerns,
    product_bundle: {},                 // populated downstream by routineEngineV5

    // ── V5 additive fields ──
    axis_severity_grade,
    zone_heatmap,
    score_provenance: provenance,
  };
}
