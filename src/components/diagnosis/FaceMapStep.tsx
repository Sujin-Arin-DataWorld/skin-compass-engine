import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronRight } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";
import facemapImg from "@/assets/clean-facemap.png"; // New clean image
import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionDef, AxisDef, LocalizedText, QuestionAnswer } from "@/engine/questionRoutingV5";
import { useTheme } from "next-themes";

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoneId = "forehead" | "eyes" | "cheeks" | "chin_mouth" | "neck";
type Lang   = "en" | "de" | "ko";

interface Concern { id: string; label: Record<Lang, string>; axis: string; }

// ─── Phase 03 mappings ────────────────────────────────────────────────────────
const CONCERN_AXIS_ID: Record<string, number> = {
  seb: 1, hyd: 2, pores: 3, texture: 4,
  sen: 5, aging: 6, pigment: 7, hormonal: 8,
};

const AXIS_COLOR: Record<number, string> = {
  1: "rgba(201,169,110,0.8)",
  2: "rgba(100,180,220,0.8)",
  3: "rgba(160,140,120,0.8)",
  4: "rgba(220,120,120,0.8)",
  5: "rgba(220,160,160,0.8)",
  6: "rgba(180,160,200,0.8)",
  7: "rgba(180,140,100,0.8)",
  8: "rgba(200,130,170,0.8)",
};

const gt = (t: LocalizedText, lang: Lang): string => (t as Record<string, string>)[lang] ?? t.en;

function pillStyle(selected: boolean, isDark: boolean): React.CSSProperties {
  const GOLD = "#c9a96e";
  return {
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", minHeight: 44, lineHeight: "1.2",
    border: selected ? `1px solid ${GOLD}` : `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    background: selected ? "rgba(201,169,110,0.15)" : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    color: selected ? GOLD : isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
    transition: "all 0.3s ease",
  };
}

// ─── Concern data ─────────────────────────────────────────────────────────────
const ZONE_CONCERNS: Record<ZoneId, Concern[]> = {
  forehead: [
    { id: "oily_f",       label: { en: "Oily / Shiny",                   de: "Ölig / Glänzend",         ko: "유분 / 번들거림"   }, axis: "seb"     },
    { id: "bh_f",         label: { en: "Blackheads / Pores",             de: "Mitesser / Poren",        ko: "블랙헤드 / 모공"   }, axis: "pores" },
    { id: "lines_f",      label: { en: "Forehead Lines / Wrinkles",      de: "Stirnfalten / Runzeln",   ko: "이마 주름"       }, axis: "aging"   },
    { id: "breakouts_f",  label: { en: "Breakouts / Acne",               de: "Unreinheiten / Akne",     ko: "트러블 / 여드름"  }, axis: "texture" },
    { id: "dry_f",        label: { en: "Dryness / Tightness",            de: "Trockenheit / Spannung",  ko: "건조함 / 당김"   }, axis: "hyd"     },
  ],
  eyes: [
    { id: "finelines_e",  label: { en: "Fine Lines / Crow's Feet",       de: "Feine Linien / Krähenfüße", ko: "잔주름 / 눈가 주름" }, axis: "aging"   },
    { id: "dc_e",         label: { en: "Dark Circles",                   de: "Augenringe",              ko: "다크서클"         }, axis: "pigment" },
    { id: "puff_e",       label: { en: "Puffiness / Swelling",           de: "Schwellungen",            ko: "붓기 / 부종"      }, axis: "aging"   },
    { id: "dry_e",        label: { en: "Dryness / Flaking",              de: "Trockenheit / Schuppung", ko: "건조함 / 각질"    }, axis: "hyd"     },
  ],
  cheeks: [
    { id: "red_c",        label: { en: "Redness / Sensitivity",          de: "Rötungen / Empfindlichkeit",ko: "홍조 / 민감성"  }, axis: "sen"     },
    { id: "acne_c",       label: { en: "Breakouts / Acne",               de: "Unreinheiten",            ko: "볼 트러블"       }, axis: "texture" },
    { id: "dry_c",        label: { en: "Dryness / Tightness",            de: "Trockenheit / Spannung",  ko: "건조함 / 당김"   }, axis: "hyd"     },
    { id: "pigm_c",       label: { en: "Dark Spots / Hyperpigmentation", de: "Dunkle Flecken",          ko: "기미 / 색소침착"  }, axis: "pigment" },
    { id: "pores_c",      label: { en: "Visible Pores",                  de: "Sichtbare Poren",         ko: "가시적 모공"     }, axis: "pores"   },
  ],
  chin_mouth: [
    { id: "hormonal_j",   label: { en: "Recurring Breakouts (Jawline)",  de: "Wiederkehrende Unreinheiten", ko: "반복 트러블 (턱선)"  }, axis: "hormonal" },
    { id: "dry_m",        label: { en: "Dryness around Lips",            de: "Trockenheit um Lippen",   ko: "입술 주변 건조함"    }, axis: "hyd"     },
    { id: "nasolabial",   label: { en: "Nasolabial Folds / Smile Lines", de: "Nasolabialfalten",        ko: "팔자주름"           }, axis: "aging"   },
    { id: "pigm_m",       label: { en: "Dark Spots around Mouth",        de: "Dunkle Flecken (Mund)",   ko: "입 주변 색소침착"    }, axis: "pigment" },
    { id: "jaw_def",      label: { en: "Jawline Definition Loss",        de: "Verlust der Kinnlinie",   ko: "턱선 윤곽 감소"       }, axis: "aging"   },
  ],
  neck: [
    { id: "neck_lines",   label: { en: "Neck Lines / Tech Neck",        de: "Halsfalten / Tech-Neck",   ko: "목 주름 / 텍넥"  }, axis: "aging" },
    { id: "neck_sag",     label: { en: "Loss of Firmness",              de: "Verlust an Festigkeit",    ko: "탄력 감소"       }, axis: "aging" },
    { id: "neck_red",     label: { en: "Redness / Irritation",          de: "Rötungen / Reizungen",     ko: "홍조 / 자극"      }, axis: "sen"   },
    { id: "neck_dry",     label: { en: "Dryness / Rough Texture",       de: "Trockenheit / Raue Textur",ko: "건조함 / 거친 결" }, axis: "hyd"   },
  ],
};

const ZONE_LABELS: Record<ZoneId, Record<Lang, string>> = {
  forehead:   { en: "Forehead",    de: "Stirn",       ko: "이마"   },
  eyes:       { en: "Eye Area",    de: "Augenpartie", ko: "눈가"   },
  cheeks:     { en: "Cheeks",      de: "Wangen",      ko: "볼"     },
  chin_mouth: { en: "Jawline & Lips", de: "Kinn & Lippen", ko: "턱선 & 입술" },
  neck:       { en: "Neck",        de: "Hals",        ko: "목"     },
};

const COPY: Record<Lang, { title: string; subtitle: string; selected: (n: number) => string; close: string; continue: string; hint: string }> = {
  en: { title: "Where do you notice concerns?", subtitle: "Tap a clinical zone on the face map to deep-dive into your skin condition.", selected: (n) => n === 1 ? "1 concern selected" : `${n} concerns selected`, close: "Done", continue: "Continue", hint: "Tap a zone to begin analysis" },
  de: { title: "Wo bemerken Sie Hautprobleme?", subtitle: "Tippen Sie auf eine klinische Zone der Gesichtskarte für eine Tiefenanalyse.", selected: (n) => `${n} Anliegen ausgewählt`, close: "Fertig", continue: "Weiter", hint: "Tippen Sie auf eine Zone um zu beginnen" },
  ko: { title: "어느 부위가 신경 쓰이시나요?", subtitle: "얼굴 지도에서 구역을 탭하여 피부 상태를 깊이 있게 분석하세요.", selected: (n) => `${n}개 선택됨`, close: "완료", continue: "계속", hint: "구역을 탭하여 분석을 시작하세요" },
};

// ─── Inline Question Renderer ─────────────────────────────────────────────────
function InlineQuestionRenderer({
  q, value, onChange, lang, allAnswers, isDark,
}: {
  q: QuestionDef; value: QuestionAnswer; onChange: (id: string, val: QuestionAnswer) => void;
  lang: Lang; allAnswers: Record<string, QuestionAnswer>; isDark: boolean;
}) {
  const showConditional = q.conditional != null && (() => {
    const triggerVal = allAnswers[q.conditional!.ifQuestionId];
    if (triggerVal == null) return false;
    const vals = q.conditional!.ifValues;
    return Array.isArray(triggerVal) ? triggerVal.some(v => vals.includes(String(v))) : vals.includes(String(triggerVal));
  })();
  const GOLD = "#c9a96e";

  return (
    <>
      {(q.type === "single" || q.type === "image") && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map((opt) => (
            <div key={opt.id} onClick={() => onChange(q.id, opt.id)} style={pillStyle(value === opt.id, isDark)}>
              {opt.icon && <span style={{ marginRight: 6, opacity: 0.8 }}>{opt.icon}</span>}
              {gt(opt.label, lang)}
              {opt.description && value === opt.id && (
                <span style={{ display: "block", fontSize: 11, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontStyle: "italic", marginTop: 4 }}>
                  {gt(opt.description, lang)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {q.type === "multi" && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map((opt) => {
            const sel = (value as string[]) ?? [];
            const isOn = sel.includes(opt.id);
            return (
              <div key={opt.id} onClick={() => { onChange(q.id, isOn ? sel.filter(x => x !== opt.id) : [...sel, opt.id]); }} style={pillStyle(isOn, isDark)}>
                {gt(opt.label, lang)}
              </div>
            );
          })}
        </div>
      )}
      {q.type === "slider" && q.slider && (
        <div style={{ margin: "8px 0 16px" }}>
          <input type="range" min={q.slider.min} max={q.slider.max} step={q.slider.step}
            value={(value as number) ?? q.slider.defaultValue}
            onChange={(e) => onChange(q.id, Number(e.target.value))}
            style={{ width: "100%", accentColor: GOLD, cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
            <span>{gt(q.slider.labelMin, lang)}</span>
            <span style={{ color: GOLD, fontWeight: 600 }}>{(value as number) ?? q.slider.defaultValue}</span>
            <span>{gt(q.slider.labelMax, lang)}</span>
          </div>
        </div>
      )}
      {showConditional && q.conditional && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 16, paddingLeft: 16, borderLeft: `2px solid \${GOLD}33`, overflow: "hidden" }}>
          <div style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
            {gt(q.conditional.inject.text, lang)}
          </div>
          <InlineQuestionRenderer q={q.conditional.inject} value={allAnswers[q.conditional.inject.id]} isDark={isDark} onChange={onChange} lang={lang} allAnswers={allAnswers} />
        </motion.div>
      )}
    </>
  );
}

// ─── Geometry: Clean dots and lines ───────────────────────────────────────────
interface ZoneDef {
  zone: ZoneId;
  dots: { x: number; y: number }[];
  line?: { x1: number; y1: number; x2: number; y2: number };
  hitPath: string;
}

const ZONES_DEF: ZoneDef[] = [
  {
    zone: "forehead",
    dots: [{ x: 250, y: 140 }, { x: 170, y: 155 }, { x: 330, y: 155 }],
    hitPath: "M 130 90 L 370 90 L 370 190 L 130 190 Z",
    line: { x1: 250, y1: 140, x2: 250, y2: 120 }
  },
  {
    zone: "eyes",
    dots: [{ x: 190, y: 260 }, { x: 310, y: 260 }],
    hitPath: "M 130 230 L 370 230 L 370 290 L 130 290 Z",
    line: { x1: 310, y1: 260, x2: 380, y2: 260 }
  },
  {
    zone: "cheeks",
    dots: [{ x: 160, y: 350 }, { x: 340, y: 350 }],
    hitPath: "M 120 300 L 380 300 L 370 410 L 130 410 Z",
    line: { x1: 160, y1: 350, x2: 90, y2: 350 }
  },
  {
    zone: "chin_mouth",
    dots: [{ x: 250, y: 500 }, { x: 160, y: 440 }, { x: 340, y: 440 }],
    hitPath: "M 140 420 L 360 420 L 330 540 L 170 540 Z",
    line: { x1: 340, y1: 440, x2: 380, y2: 440 }
  },
  {
    zone: "neck",
    dots: [{ x: 250, y: 620 }],
    hitPath: "M 180 550 L 320 550 L 340 700 L 160 700 Z",
    line: { x1: 250, y1: 620, x2: 250, y2: 670 }
  },
];

const ANIM = `
  @keyframes pulseDot {
    0%, 100% { r: 5; opacity: 0.9; }
    50%       { r: 7; opacity: 1;    }
  }
  @keyframes haloSoft {
    0%, 100% { r: 16; opacity: 0.15; }
    50%       { r: 24; opacity: 0.3;  }
  }
  .dash-line { stroke-dasharray: 4 4; opacity: 0.6; }
`;

function FaceSVG({ activeZone, selectedZones, onZoneClick, isDark }: {
  activeZone: ZoneId | null; selectedZones: Set<ZoneId>; onZoneClick: (z: ZoneId) => void; isDark: boolean;
}) {
  const GOLD = "#D4AF37", GOLD_DIM = "rgba(201,168,76,0.35)", WH = isDark ? "#fff" : "#000";

  return (
    <svg viewBox="0 0 500 700" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <filter id="glow-md"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {ZONES_DEF.map(zd => {
        const { zone, dots, hitPath, line } = zd;
        const isActive = activeZone === zone;
        const isSelected = selectedZones.has(zone);
        const lit = isActive || isSelected;
        const dimmed = activeZone !== null && !lit;
        
        return (
          <g key={zone}>
            <path d={hitPath} fill="transparent" style={{ pointerEvents: "all", cursor: "pointer" }} onClick={() => onZoneClick(zone)} />
            
            {!dimmed && line && (
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={WH} strokeWidth="0.8" className="dash-line" style={{ pointerEvents: "none" }} />
            )}

            {dots.map((d, i) => (
              <g key={i} style={{ pointerEvents: "none" }}>
                {lit && <circle cx={d.x} cy={d.y} r={20} fill={GOLD} filter="url(#glow-md)" style={{ opacity: 0.25, animation: "haloSoft 3s infinite" }} />}
                <circle cx={d.x} cy={d.y} r={lit ? 6 : 4} fill={lit ? GOLD : isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"} style={{ animation: lit ? "pulseDot 2s infinite" : "none", transition: "all 0.3s ease" }} />
                {lit && <circle cx={d.x} cy={d.y} r={10} fill="none" stroke={WH} strokeWidth="1" style={{ opacity: 0.5 }} />}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────
function ConcernItem({ concern, selected, onToggle, lang, isDark }: { concern: Concern; selected: boolean; onToggle: () => void; lang: Lang; isDark: boolean; }) {
  const GOLD = "#c9a96e";
  return (
    <motion.button onClick={onToggle} whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderRadius: 14, textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
        background: selected ? "rgba(201,169,110,0.12)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: selected ? `1px solid \${GOLD}` : `1px solid \${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        color: selected ? GOLD : isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: selected ? 500 : 400
      }}>
      <span>{concern.label[lang]}</span>
      <motion.span animate={{ scale: selected ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.2 }}
        style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
          border: selected ? `2px solid \${GOLD}` : `2px solid \${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
          background: selected ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {selected && <Check style={{ width: 14, height: 14, color: isDark ? "#000" : "#fff" }} />}
      </motion.span>
    </motion.button>
  );
}

function PanelHeader({ zone, lang, onClose, isDark }: { zone: ZoneId; lang: Lang; onClose: () => void; isDark: boolean; }) {
  const GOLD = "#c9a96e";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ height: 1.5, background: `linear-gradient(90deg,transparent,\${GOLD},transparent)`, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Clinical Area</p>
          <h3 style={{ fontSize: 24, fontWeight: 300, color: isDark ? "#fff" : "#111", fontFamily: "'Cormorant Garamond',Georgia,serif", margin: 0, lineHeight: 1.2 }}>
            {ZONE_LABELS[zone][lang]}
          </h3>
        </div>
        <button onClick={onClose} style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isDark ? "#fff" : "#000", flexShrink: 0 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}

// ─── The Main Interactive Panel ───────────────────────────────────────────────
function ConcernAndQuestionPanel({ zone, selectedConcerns, onToggle, onClose, lang, isDark }: { zone: ZoneId; selectedConcerns: Set<string>; onToggle: (id: string) => void; onClose: () => void; lang: Lang; isDark: boolean; }) {
  const store = useDiagnosisStore();
  const axisAnswers = store.axisAnswers;
  const onAnswer = (id: string, val: QuestionAnswer) => store.setAxisAnswer(id, val);
  const [editingAxes, setEditingAxes] = useState<Set<number>>(new Set());

  // Derive triggered axes based on selected concerns
  const concerns = ZONE_CONCERNS[zone];
  const triggeredAxisIds = Array.from(new Set(
    Array.from(selectedConcerns)
      .map(cId => concerns.find(c => c.id === cId)?.axis)
      .filter((a): a is string => a !== undefined && CONCERN_AXIS_ID[a] !== undefined)
      .map(a => CONCERN_AXIS_ID[a])
  ));

  const GOLD = "#c9a96e";

  return (
    <div style={{ padding: "8px 0 16px" }}>
      <PanelHeader zone={zone} lang={lang} onClose={onClose} isDark={isDark} />
      
      {/* Concerns Section */}
      <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {lang === "ko" ? "피부 고민 선택" : lang === "de" ? "Beschwerden auswählen" : "Select Concerns"}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {concerns.map(c => (
          <ConcernItem key={c.id} concern={c} selected={selectedConcerns.has(c.id)} onToggle={() => onToggle(c.id)} lang={lang} isDark={isDark} />
        ))}
      </div>

      {/* Deep-Dive Questions Section */}
      {triggeredAxisIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            {lang === "ko" ? "정밀 분석" : lang === "de" ? "Tiefenanalyse" : "Deep-Dive Analysis"}
          </h4>
          
          {triggeredAxisIds.map(axisId => {
            const axisDef = AXIS_DEFINITIONS.find(a => a.id === axisId);
            if (!axisDef) return null;
            const requiredQs = axisDef.questions.filter(q => q.required);
            const isAnswered = requiredQs.length > 0 && requiredQs.every(q => axisAnswers[q.id] !== undefined);
            const isEditing = editingAxes.has(axisId);
            const showQuestions = !isAnswered || isEditing;

            const visibleQs: QuestionDef[] = [];
            for (const q of axisDef.questions) {
              if (q.hideIf) {
                const hAns = axisAnswers[q.hideIf.questionId];
                if (hAns !== undefined) {
                  const m = Array.isArray(hAns) ? hAns.some(v => q.hideIf!.values.includes(String(v))) : q.hideIf.values.includes(String(hAns));
                  if (m) continue;
                }
              }
              visibleQs.push(q);
            }

            return (
              <div key={axisId} style={{ marginBottom: 20, padding: 16, borderRadius: 16, background: isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.5)", border: `1px solid \${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isAnswered && !isEditing ? 0 : 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: AXIS_COLOR[axisId] }}>
                    {gt(axisDef.name, lang)} {isAnswered && !isEditing && " ✓"}
                  </span>
                  {isAnswered && (
                    <button onClick={() => setEditingAxes(p => { const n = new Set(p); n.has(axisId) ? n.delete(axisId) : n.add(axisId); return n; })}
                      style={{ background: "none", border: "none", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                      {isEditing ? (lang === "ko" ? "완료" : "Done") : (lang === "ko" ? "수정" : "Edit")}
                    </button>
                  )}
                </div>

                {isAnswered && !isEditing ? null : (
                  visibleQs.map(q => (
                    <div key={q.id} style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 16, color: isDark ? "#fff" : "#111", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
                        {gt(q.text, lang)}
                      </div>
                      <InlineQuestionRenderer isDark={isDark} q={q} value={axisAnswers[q.id]} onChange={onAnswer} lang={lang} allAnswers={axisAnswers} />
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

const PANEL_S = (isDark: boolean): React.CSSProperties => ({
  width: "min(400px, 90vw)", flexShrink: 0, borderRadius: 24,
  border: `1px solid \${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
  background: isDark ? "rgba(20,20,25,0.85)" : "rgba(255,255,255,0.92)",
  backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
  boxShadow: isDark ? "0 24px 68px rgba(0,0,0,0.65)" : "0 24px 68px rgba(0,0,0,0.15)",
  padding: "20px 24px", display: "flex", flexDirection: "column",
  maxHeight: "80vh", overflowY: "auto",
});

export function FaceMapStep({ onNext }: { onNext: () => void }) {
  const { language } = useI18nStore();
  const lang = language as Lang;
  const store = useDiagnosisStore();
  const copy = COPY[lang];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || resolvedTheme === "system";

  const [selectedConcerns, setSelectedConcerns] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { const fn = () => setIsMobile(window.innerWidth < 768); fn(); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const selectedZones = useMemo(() => {
    const out = new Set<ZoneId>();
    for (const [z, arr] of Object.entries(ZONE_CONCERNS)) if (arr.some(c => selectedConcerns.has(c.id))) out.add(z as ZoneId);
    return out;
  }, [selectedConcerns]);

  const toggleConcern = useCallback((id: string) => {
    setSelectedConcerns(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleNext = useCallback(() => {
    const axisMap: Record<string, number> = {};
    for (const cid of selectedConcerns) {
      for (const arr of Object.values(ZONE_CONCERNS)) {
        const f = arr.find(c => c.id === cid);
        if (f) axisMap[f.axis] = (axisMap[f.axis] ?? 0) + 1;
      }
    }
    const zoneMap: Record<string, { concerns: string[] }> = {};
    for (const [zid, arr] of Object.entries(ZONE_CONCERNS)) {
      const sel = arr.filter(c => selectedConcerns.has(c.id)).map(c => c.id);
      if (sel.length) zoneMap[zid] = { concerns: sel };
    }
    store.actions.setAllZones(zoneMap);
    store.setUiSignals("faceMap", axisMap as Record<string, unknown>);
    onNext();
  }, [selectedConcerns, store, onNext]);

  return (
    <div style={{ width: "100%" }}>
      <style>{ANIM}</style>

      {/* Header */}
      <h2 style={{ fontSize: isMobile ? 26 : 30, fontWeight: 300, fontFamily: "'Cormorant Garamond',Georgia,serif", color: isDark ? "#fff" : "#111", marginBottom: 8 }}>{copy.title}</h2>
      <p style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: 32, fontFamily: "'DM Sans',sans-serif" }}>{copy.subtitle}</p>

      {/* Main layout */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", gap: 28 }}>
        
        {/* Face Image Card */}
        <div style={{ position: "relative", width: isMobile ? "min(90vw,400px)" : "min(40vw,480px)", aspectRatio: "500/700", flexShrink: 0, borderRadius: 28, overflow: "hidden", boxShadow: isDark ? "0 32px 88px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.1)", border: `1px solid \${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}>
          <img src={facemapImg} alt="Face map" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: isDark ? "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.4) 100%)" : "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.1) 100%)", pointerEvents: "none" }} />
          <FaceSVG activeZone={activeZone} selectedZones={selectedZones} onZoneClick={(id) => setActiveZone(p => p === id ? null : id)} isDark={isDark} />
        </div>

        {/* Desktop Panel */}
        {!isMobile && (
          <AnimatePresence mode="wait">
            {activeZone ? (
              <motion.div key={activeZone} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={PANEL_S(isDark)}>
                <ConcernAndQuestionPanel zone={activeZone} selectedConcerns={selectedConcerns} onToggle={toggleConcern} onClose={() => setActiveZone(null)} lang={lang} isDark={isDark} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "min(380px, 40vw)", height: 300, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed \${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`, borderRadius: 24, padding: 32, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{copy.hint}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mobile Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMobile && activeZone && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveZone(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} drag="y" dragConstraints={{ top: 0 }} onDragEnd={(_, i) => { if (i.offset.y > 100) setActiveZone(null); }}
              style={{ position: "relative", background: isDark ? "#14141a" : "#ffffff", borderRadius: "28px 28px 0 0", padding: "12px 20px 40px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ width: 44, height: 4, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", margin: "0 auto 16px" }} />
              <ConcernAndQuestionPanel zone={activeZone} selectedConcerns={selectedConcerns} onToggle={toggleConcern} onClose={() => setActiveZone(null)} lang={lang} isDark={isDark} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleNext} disabled={selectedConcerns.size === 0}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 32, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", border: "none",
            background: selectedConcerns.size > 0 ? "linear-gradient(135deg, #c9a96e, #a38555)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            color: selectedConcerns.size > 0 ? "#fff" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            cursor: selectedConcerns.size > 0 ? "pointer" : "not-allowed", transition: "all 0.3s ease",
            boxShadow: selectedConcerns.size > 0 ? "0 8px 24px rgba(201,169,110,0.3)" : "none" }}>
          {copy.continue} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default FaceMapStep;
