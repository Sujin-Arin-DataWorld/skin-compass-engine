import { motion } from "framer-motion";
import { useI18nStore } from "@/store/i18nStore";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import type { DiagnosisResult, AxisKey, ZoneId, ZoneHeatmapEntry } from "@/engine/types";
import { computeSkinAge, AGE_MIDPOINTS } from "@/engine/diagnosisComparison";
import { SkinAgeCard } from "@/features/results/components/SkinAgeCard";

// ─────────────────────────────────────────────────────────────────────────────
// i18n maps
// ─────────────────────────────────────────────────────────────────────────────

const EMPATHY_MAP: Record<string, { en: string; de: string; ko: string }> = {
  "Hormonal Acne Cascade": {
    en: "Breakouts that follow a pattern, not a random one. Your skin is reacting to something deeper than surface oil.",
    de: "Ausbrüche, die einem Muster folgen, nicht zufällig sind. Ihre Haut reagiert auf tieferliegende hormonelle Signale.",
    ko: "패턴을 따르는 트러블 — 무작위가 아닙니다. 피부가 표면 유분보다 더 깊은 호르몬 신호에 반응하고 있습니다.",
  },
  "Barrier Stress Pattern": {
    en: "Your skin is working harder than it should have to. It's not sensitivity — it's a barrier under pressure.",
    de: "Ihre Haut arbeitet härter als sie müsste. Das ist keine Empfindlichkeit — das ist eine Barriere unter Stress.",
    ko: "피부가 필요 이상으로 힘들게 일하고 있습니다. 민감성이 아니라 — 압박받는 피부 장벽입니다.",
  },
  "Dehydrated-Oily Complex": {
    en: "Shine on the surface, tightness underneath. These two signals together tell us something specific about your skin.",
    de: "Glanz an der Oberfläche, Spannungsgefühl darunter. Diese widersprüchlichen Signale verraten uns etwas Spezifisches.",
    ko: "표면의 번들거림, 내부의 당김. 이 두 신호가 함께 피부에 대해 구체적인 무언가를 말해줍니다.",
  },
  "Melasma-Dominant Pattern": {
    en: "Your pigmentation has a logic to it. UV and hormones are both in the picture.",
    de: "Ihre Pigmentierung folgt einer Logik. UV-Strahlung und Hormone spielen hier eng zusammen.",
    ko: "색소침착에는 나름의 논리가 있습니다. 자외선과 호르몬이 모두 관여하고 있습니다.",
  },
  "Texture-Congestion Overlap": {
    en: "Rough texture and congested pores usually share the same root. Your skin is telling us where to focus.",
    de: "Raue Textur und verstopfte Poren haben meist dieselbe Wurzel. Ihre Haut sagt uns genau, wo wir ansetzen müssen.",
    ko: "거친 피부결과 막힌 모공은 보통 같은 원인을 공유합니다. 피부가 어디에 집중해야 할지 알려주고 있습니다.",
  },
  "Elasticity Loss — Early Stage": {
    en: "The changes you're noticing aren't sudden. They've been building, and that means they can be addressed systematically.",
    de: "Die Veränderungen, die Sie bemerken, kamen nicht plötzlich. Sie haben sich aufgebaut, und können nun systematisch adressiert werden.",
    ko: "느끼고 있는 변화는 갑자기 일어난 것이 아닙니다. 서서히 쌓여온 것이며, 체계적으로 해결할 수 있다는 의미입니다.",
  },
  "Balanced Profile": {
    en: "Your skin has a specific pattern. It's not random, and it's not unsolvable.",
    de: "Ihre Haut hat ein spezifisches Muster. Nichts ist zufällig, und nichts ist unlösbar.",
    ko: "피부에는 특정 패턴이 있습니다. 무작위가 아니며, 해결 불가능한 것도 아닙니다.",
  },
  default: {
    en: "Your skin has a specific pattern. It's not random, and it's not unsolvable.",
    de: "Ihre Haut hat ein spezifisches Muster. Nichts ist zufällig, und nichts ist unlösbar.",
    ko: "피부에는 특정 패턴이 있습니다. 무작위가 아니며, 해결 불가능한 것도 아닙니다.",
  },
};

const OBSERVATION_TEMPLATES: Partial<Record<AxisKey, {
  en: (s: number) => string;
  de: (s: number) => string;
  ko: (s: number) => string;
}>> = {
  acne: {
    en: (s) => `Breakout activity ${s > 60 ? "concentrated and cyclical" : "present with moderate frequency"}`,
    de: (s) => `Ausbruchsaktivität ${s > 60 ? "konzentriert und zyklisch" : "mit mäßiger Häufigkeit vorhanden"}`,
    ko: (s) => `트러블 활동 ${s > 60 ? "집중적이고 주기적" : "중간 빈도로 나타남"}`,
  },
  seb: {
    en: (s) => `Sebum overproduction${s > 60 ? " returning within 2–4h of cleansing" : " in the T-zone"}`,
    de: (s) => `Talgüberproduktion${s > 60 ? ", die 2–4h nach der Reinigung zurückkehrt" : " primär in der T-Zone"}`,
    ko: (s) => `피지 과다 분비${s > 60 ? " — 세안 후 2–4시간 내 재발생" : " — T존 중심"}`,
  },
  hyd: {
    en: (s) => `Moisture retention ${s > 60 ? "significantly compromised (fast TEWL pattern)" : "below optimal"}`,
    de: (s) => `Feuchtigkeitsspeicherung ${s > 60 ? "erheblich beeinträchtigt (schneller TEWL)" : "unter dem Optimum"}`,
    ko: (s) => `수분 유지력 ${s > 60 ? "심하게 손상됨 (빠른 TEWL 패턴)" : "최적 이하"}`,
  },
  sen: {
    en: (s) => `Reactive sensitivity${s > 60 ? " — multiple actives causing stinging" : " with thermal flush tendency"}`,
    de: (s) => `Reaktive Empfindlichkeit${s > 60 ? " — mehrere Wirkstoffe verursachen Stechen" : " mit Tendenz zum Hitzeflush"}`,
    ko: (s) => `반응성 민감도${s > 60 ? " — 복수의 성분이 따가움 유발" : " — 열성 홍조 경향"}`,
  },
  pigment: {
    en: (s) => `Pigmentation${s > 60 ? " showing UV-responsive deepening" : " with residual post-inflammatory marks"}`,
    de: (s) => `Pigmentierung${s > 60 ? " zeigt UV-reaktive Vertiefung" : " mit verbleibenden post-entzündlichen Spuren"}`,
    ko: (s) => `색소침착${s > 60 ? " — 자외선 반응성 심화 확인" : " — 염증 후 잔여 자국"}`,
  },
  texture: {
    en: (s) => `Pore and texture irregularity${s > 60 ? " across both nose and forehead zones" : " in T-zone"}`,
    de: (s) => `Poren- und Texturunregelmäßigkeiten${s > 60 ? " über Nasen- und Stirnpartien" : " leicht in der T-Zone"}`,
    ko: (s) => `모공 및 피부결 불균일${s > 60 ? " — 코와 이마 전반에 걸쳐" : " — T존 중심"}`,
  },
  aging: {
    en: (s) => `Firmness response${s > 60 ? " — pinch recoil significantly delayed" : " showing early-stage reduction"}`,
    de: (s) => `Festigkeitsreaktion${s > 60 ? " — Hautrückbildung nach Kneifen deutlich verzögert" : " zeigt Rückgang im Frühstadium"}`,
    ko: (s) => `탄력 반응${s > 60 ? " — 꼬집기 후 회복 현저히 지연" : " — 초기 감소 징후"}`,
  },
  bar: {
    en: (s) => `Barrier stress${s > 60 ? " — redness + tightness + stinging triad present" : " with recovery delay"}`,
    de: (s) => `Barriere-Stress${s > 60 ? " — Rötung + Spannungsgefühl + Stechen (Triade) vorhanden" : " mit Verzögerung der Erholungsphase"}`,
    ko: (s) => `피부 장벽 스트레스${s > 60 ? " — 홍조·당김·따가움 3징후 동반" : " — 회복 지연"}`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Face heatmap
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_LABELS: Record<string, { en: string; de: string; ko: string }> = {
  forehead: { en: "Forehead", de: "Stirn",   ko: "이마" },
  eyes:     { en: "Eyes",     de: "Augen",   ko: "눈 주변" },
  nose:     { en: "Nose",     de: "Nase",    ko: "코" },
  cheeks:   { en: "Cheeks",   de: "Wangen",  ko: "볼" },
  mouth:    { en: "Mouth",    de: "Mund",    ko: "입 주변" },
  jawline:  { en: "Jawline",  de: "Kiefer",  ko: "턱선" },
  neck:     { en: "Neck",     de: "Hals",    ko: "목" },
};

interface ZoneShape {
  shapes: { cx: number; cy: number; rx: number; ry: number }[];
  badgePos: { x: number; y: number };
}

const ZONE_SVG_CONFIG: Record<ZoneId, ZoneShape> = {
  forehead: { shapes: [{ cx: 50, cy: 23, rx: 22, ry: 11 }],                                           badgePos: { x: 70, y: 14 } },
  eyes:     { shapes: [{ cx: 33, cy: 44, rx: 9,  ry: 5  }, { cx: 67, cy: 44, rx: 9,  ry: 5  }],      badgePos: { x: 74, y: 38 } },
  nose:     { shapes: [{ cx: 50, cy: 61, rx: 6,  ry: 8  }],                                           badgePos: { x: 57, y: 54 } },
  cheeks:   { shapes: [{ cx: 24, cy: 66, rx: 11, ry: 9  }, { cx: 76, cy: 66, rx: 11, ry: 9  }],      badgePos: { x: 85, y: 58 } },
  mouth:    { shapes: [{ cx: 50, cy: 81, rx: 12, ry: 6  }],                                           badgePos: { x: 60, y: 75 } },
  jawline:  { shapes: [{ cx: 30, cy: 95, rx: 12, ry: 7  }, { cx: 70, cy: 95, rx: 12, ry: 7  }],      badgePos: { x: 80, y: 89 } },
  neck:     { shapes: [{ cx: 50, cy: 116, rx: 9, ry: 6  }],                                           badgePos: { x: 59, y: 112 } },
};

/** intensity 0–1 → hsla color string */
function zoneColor(intensity: number): string {
  if (intensity < 0.05) return "transparent";
  // 0.05–0.30 → pale gold
  if (intensity < 0.30) {
    const a = (0.18 + (intensity / 0.30) * 0.32).toFixed(2);
    return `hsla(43, 58%, 62%, ${a})`;
  }
  // 0.30–0.65 → amber
  if (intensity < 0.65) {
    const t = (intensity - 0.30) / 0.35;
    const h = Math.round(43 - t * 13);
    const s = Math.round(58 + t * 22);
    const l = Math.round(62 - t * 12);
    const a = (0.50 + t * 0.20).toFixed(2);
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }
  // 0.65–1.0 → coral
  const t = (intensity - 0.65) / 0.35;
  const h = Math.round(30 - t * 30);
  const a = (0.70 + t * 0.20).toFixed(2);
  return `hsla(${h}, 80%, 55%, ${a})`;
}

interface FaceHeatmapProps {
  heatmap: Partial<Record<ZoneId, ZoneHeatmapEntry>>;
}

const FACE_PATH = "M50,4 Q78,4 80,44 L80,76 Q80,110 50,113 Q20,110 20,76 L20,44 Q22,4 50,4 Z";
const NECK_PATH = "M43,113 Q43,122 50,124 Q57,122 57,113 Z";
const ALL_ZONES = Object.keys(ZONE_SVG_CONFIG) as ZoneId[];

function FaceHeatmap({ heatmap }: FaceHeatmapProps) {
  return (
    <svg
      viewBox="0 0 100 130"
      width={130}
      height={169}
      style={{ display: "block", margin: "0 auto" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="face-heatmap-clip">
          <path d={FACE_PATH} />
        </clipPath>
      </defs>

      {/* Base face fill */}
      <path d={FACE_PATH} fill="hsl(var(--muted))" opacity={0.22} />
      <path d={NECK_PATH} fill="hsl(var(--muted))" opacity={0.22} />

      {/* Zone overlays — clipped to face outline (all zones except neck) */}
      <g clipPath="url(#face-heatmap-clip)">
        {ALL_ZONES.filter(z => z !== "neck").map((zoneId) => {
          const entry = heatmap[zoneId];
          const cfg   = ZONE_SVG_CONFIG[zoneId];
          const color = entry ? zoneColor(entry.intensity) : "transparent";
          return cfg.shapes.map((s, i) => (
            <ellipse
              key={`${zoneId}-${i}`}
              cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
              fill={color}
            />
          ));
        })}
      </g>

      {/* Neck zone overlay — outside clip */}
      {(() => {
        const entry = heatmap["neck"];
        const cfg   = ZONE_SVG_CONFIG["neck"];
        const color = entry ? zoneColor(entry.intensity) : "transparent";
        return cfg.shapes.map((s, i) => (
          <ellipse
            key={`neck-${i}`}
            cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
            fill={color}
          />
        ));
      })()}

      {/* Face outline */}
      <path
        d={FACE_PATH}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={0.9}
        opacity={0.55}
      />
      <path
        d={NECK_PATH}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={0.9}
        opacity={0.45}
      />

      {/* Concern-count badges */}
      {ALL_ZONES.map((zoneId) => {
        const entry = heatmap[zoneId];
        if (!entry || entry.concernCount === 0) return null;
        const { badgePos } = ZONE_SVG_CONFIG[zoneId];
        return (
          <g key={`badge-${zoneId}`}>
            <circle
              cx={badgePos.x} cy={badgePos.y} r={5}
              fill="hsl(var(--primary))"
              opacity={0.9}
            />
            <text
              x={badgePos.x} y={badgePos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="hsl(var(--primary-foreground))"
              fontSize={4.5}
              fontWeight={700}
            >
              {entry.concernCount}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  result: DiagnosisResult;
}

const SlideDiagnosisSummary = ({ result }: Props) => {
  const { language } = useI18nStore();
  const store = useDiagnosisStore();
  const ageBracket  = (store.axisAnswers["EXP_AGE"]    as number | undefined) ?? 2;
  const menoStatus  = (store.axisAnswers["menopause_status"] as string | undefined) ?? null;
  const realAge     = AGE_MIDPOINTS[ageBracket] ?? 35;
  const skinAgeData = computeSkinAge(realAge, result.axis_scores, menoStatus);

  const patternNameEN = result.detected_patterns[0]?.pattern.name_en ?? "Balanced Profile";
  const p = result.detected_patterns[0]?.pattern as unknown as Record<string, string> | undefined;
  const patternName   = language === "de"
    ? (p?.name_de ?? "Ausgeglichenes Profil")
    : language === "ko"
    ? (p?.name_ko ?? patternNameEN)
    : patternNameEN;

  const empathyText  = (EMPATHY_MAP[patternNameEN] ?? EMPATHY_MAP.default)[language];
  const signalCount  = result.radar_chart_data.reduce((sum, d) => sum + (d.score > 0 ? 1 : 0), 0);
  const confidence   = Math.min(95, 65 + signalCount * 3);
  const activeCategories = result.primary_concerns.slice(0, 4);

  // V5 heatmap data — only show section when there is at least one zone entry
  const heatmap  = result.zone_heatmap;
  const hasHeatmap = heatmap && Object.keys(heatmap).length > 0;
  const activeZones = hasHeatmap
    ? (Object.keys(heatmap) as ZoneId[]).filter(z => heatmap[z] && heatmap[z]!.concernCount > 0)
    : [];

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">

        {/* ── Section A: Empathy hook ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <p className="slide-eyebrow mb-2.5">
            {language === "de" ? "Diagnose-Ergebnis" : language === "ko" ? "진단 결과" : "Diagnostic Result"}
          </p>
          <p
            className="font-display italic leading-snug"
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
              color: "hsl(var(--foreground))",
              lineHeight: 1.35,
            }}
          >
            "{empathyText}"
          </p>
        </motion.div>

        {/* ── Section B: Face Map (V5 only) ── */}
        {hasHeatmap && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mb-5"
          >
            <p className="slide-eyebrow mb-3" style={{ letterSpacing: "0.12em" }}>
              {language === "de" ? "Ihre Gesichtskarte" : language === "ko" ? "얼굴 맵" : "Your Face Map"}
            </p>

            <div className="flex gap-6 items-start">
              {/* Face SVG */}
              <div className="flex-shrink-0">
                <FaceHeatmap heatmap={heatmap!} />
              </div>

              {/* Zone chips */}
              {activeZones.length > 0 && (
                <div className="flex flex-col gap-2 flex-1 pt-1">
                  {activeZones.map((zoneId) => {
                    const entry   = heatmap![zoneId]!;
                    const label   = ZONE_LABELS[zoneId]?.[language] ?? zoneId;
                    const summary = entry.summary[language];
                    return (
                      <div
                        key={zoneId}
                        className="flex items-start gap-2"
                        style={{ fontSize: "0.75rem", lineHeight: 1.45 }}
                      >
                        {/* Intensity dot */}
                        <span
                          className="flex-shrink-0 mt-[3px] rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            background: zoneColor(entry.intensity),
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <span>
                          <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
                            {label}
                          </span>
                          <span style={{ color: "hsl(var(--foreground-hint))" }}>
                            {" · "}
                          </span>
                          <span style={{ color: "hsl(var(--foreground-hint))" }}>
                            {summary}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bridge text */}
            <p
              className="slide-body mt-3"
              style={{ lineHeight: 1.55, fontStyle: "italic", opacity: 0.75 }}
            >
              {language === "de"
                ? "Diese Kombination von Zonen verrät uns ein spezifisches klinisches Muster:"
                : language === "ko"
                ? "이 존들의 조합이 특정 임상 패턴을 보여줍니다:"
                : "This combination of zones tells us a specific clinical pattern:"}
            </p>
          </motion.div>
        )}

        {/* ── Section C: Pattern Identity Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: hasHeatmap ? 0.28 : 0.2, duration: 0.45 }}
          className="rounded-3xl border p-5 mb-5"
          style={{
            borderColor: "hsl(var(--primary) / 0.4)",
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)",
          }}
        >
          <p className="slide-eyebrow mb-1" style={{ letterSpacing: "0.14em" }}>
            {language === "de" ? "Identifiziertes Hautmuster" : language === "ko" ? "확인된 피부 패턴" : "Identified Skin Pattern"}
          </p>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              color: "hsl(var(--foreground))",
              marginBottom: "1rem",
            }}
          >
            {patternName}
          </h1>
          <div className="flex gap-5">
            <StatMini
              label={language === "de" ? "Signale erfasst" : language === "ko" ? "감지된 신호" : "Signals captured"}
              value={String(signalCount)}
            />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini
              label={language === "de" ? "Konfidenzniveau" : language === "ko" ? "진단 신뢰도" : "Diagnostic confidence"}
              value={`${confidence}%`}
            />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini
              label={language === "de" ? "Dermatologisch geprüft" : language === "ko" ? "피부과 검증" : "Dermatologist reviewed"}
              value="✓"
              accent
            />
          </div>
        </motion.div>

        {/* ── Section D: Pattern explainer ── */}
        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: hasHeatmap ? 0.38 : 0.3 }}
          style={{ lineHeight: 1.6 }}
        >
          {language === "de"
            ? "Dieses Muster wurde aus der Überschneidung Ihrer am höchsten bewerteten Achsen identifiziert. Es beschreibt, wie Ihre Hautprobleme interagieren — nicht nur, was sie einzeln bedeuten."
            : language === "ko"
            ? "이 패턴은 가장 높은 점수를 받은 축들의 교차점에서 확인되었습니다. 피부 문제들이 개별적으로 무엇을 의미하는지가 아닌, 어떻게 상호작용하는지를 설명합니다."
            : "This pattern was identified from the intersection of your highest-scoring axes. It describes how your skin's concerns interact — not just what they are individually."}
        </motion.p>

        {/* ── Section E: Observation bullets ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: hasHeatmap ? 0.45 : 0.4 }}
          className="space-y-2 mb-6"
        >
          <p className="slide-eyebrow mb-2" style={{ letterSpacing: "0.1em" }}>
            {language === "de" ? "Was wir beobachtet haben" : language === "ko" ? "관찰된 내용" : "What we observed"}
          </p>
          {activeCategories.map((axis) => {
            const score    = Math.round(result.axis_scores[axis]);
            const template = OBSERVATION_TEMPLATES[axis];
            if (!template) return null;
            const text = template[language]?.(score) ?? template.en(score);
            return (
              <div key={axis} className="flex gap-2.5 items-start">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "hsl(var(--primary))", fontSize: "0.875rem" }}
                >
                  ·
                </span>
                <p className="slide-body" style={{ lineHeight: 1.5 }}>
                  {text}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* ── Section E2: Dehydrated-Oily (수부지) special card ── */}
        {(result.active_flags.includes("Dehydrated-Oily") ||
          (result.axis_scores.seb >= 50 && result.axis_scores.hyd >= 50)) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasHeatmap ? 0.55 : 0.48, duration: 0.4 }}
            className="rounded-2xl border p-4 mb-5"
            style={{
              borderColor: "rgba(100,180,220,0.35)",
              background: "linear-gradient(135deg, rgba(100,180,220,0.08) 0%, rgba(201,169,110,0.06) 100%)",
            }}
          >
            <p className="slide-eyebrow mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", color: "hsl(var(--primary))" }}>
              {language === "de" ? "Besonderer Befund" : language === "ko" ? "특별 감지" : "Special Detection"}
            </p>
            <p
              className="font-display mb-2"
              style={{ fontSize: "1.05rem", fontWeight: 600, color: "hsl(var(--foreground))" }}
            >
              {language === "de"
                ? "Fettig-dehydrierte Haut erkannt"
                : language === "ko"
                ? "수부지(속건조 지성) 피부 감지"
                : "Dehydrated-Oily Skin Detected"}
            </p>
            <p className="slide-body mb-2.5" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
              {language === "de"
                ? "Ihre Haut sieht oberflächlich ölig aus, ist aber darunter durstig nach Feuchtigkeit. Das ist in europäischen Sommern sehr häufig. Leichte Hydration, die schnell einzieht ohne zu fetten, ist der Schlüssel."
                : language === "ko"
                ? "피부 표면은 번들거리는데 속은 사실 수분이 부족한 상태예요. 유럽 여름에 매우 흔한 현상이에요. 가벼우면서 빠르게 흡수되는 수분 제품이 핵심입니다."
                : "Your skin looks oily on the surface, but underneath it's actually thirsty for moisture. This is very common in European summers. You need lightweight hydration that absorbs fast without leaving grease."}
            </p>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.5 }}>
              {language === "de"
                ? "✓ Empfohlen: Hyaluronsäure-Gel, wasserbasierte Seren, ölfreie Pflege · ✗ Vermeiden: schwere Cremes, aggressive Reiniger"
                : language === "ko"
                ? "✓ 추천: 히알루론산 젤, 수분 세럼, 오일프리 보습제 · ✗ 피해야 할 것: 무거운 크림, 세정력 강한 클렌저"
                : "✓ Look for: Hyaluronic acid gel, water-based serums, oil-free moisturizers · ✗ Avoid: Heavy creams, stripping foam cleansers"}
            </p>
          </motion.div>
        )}

        {/* ── Section E3: Skin Age Card (Phase 6 Step 1) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: hasHeatmap ? 0.54 : 0.48, duration: 0.4 }}
        >
          <SkinAgeCard
            realAge={realAge}
            skinAge={skinAgeData.skinAge}
            comparison={skinAgeData.comparison}
            lang={language}
          />
        </motion.div>

        {/* ── Section E3: Clinical Trust Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasHeatmap ? 0.58 : 0.52, duration: 0.4 }}
          style={{
            padding: "14px 20px", borderRadius: 14, marginBottom: 24,
            background: "hsl(var(--primary) / 0.04)",
            border: "1px solid hsl(var(--primary) / 0.12)",
            fontSize: 12,
            color: "hsl(var(--foreground-hint))",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          🔬{" "}
          {language === "ko"
            ? "진단은 전 세계 피부과 의사가 사용하는 임상 방법론을 기반으로 합니다 — SOS 피지 척도, TEWL 장벽 평가, APIA 프레임워크. 카메라 없이도 정확한 분석이 가능합니다."
            : language === "de"
            ? "Ihre Diagnose basiert auf Methoden der klinischen Dermatologie weltweit — darunter die SOS-Skala, TEWL-Barrierebewertung und das APIA-Framework. Keine Kamera nötig."
            : "Your diagnosis uses methods from clinical dermatology worldwide — including the SOS scale, TEWL barrier assessment, and the APIA framework. No camera needed."}
        </motion.div>

        {/* ── Section F: Forward pull ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: hasHeatmap ? 0.62 : 0.6 }}
          style={{
            fontSize: "0.875rem",
            color: "hsl(var(--foreground-hint))",
            textAlign: "center",
          }}
        >
          {language === "de"
            ? "Ihre vollständige klinische Karte ansehen →"
            : language === "ko"
            ? "전체 임상 분석 보기 →"
            : "See your full clinical map →"}
        </motion.p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatMini({ label, value, accent = false }: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className="font-display"
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: accent ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "0.6875rem",
          color: "hsl(var(--foreground-hint))",
          marginTop: "0.2rem",
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default SlideDiagnosisSummary;
