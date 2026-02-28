import { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FaceMapInteractive from "./FaceMapInteractive";
import PhotoMatchSelector, { PhotoOption } from "./PhotoMatchSelector";
import TimelineSlider from "./TimelineSlider";
import ThermalGauge from "./ThermalGauge";
import HydrationEvaporation from "./HydrationEvaporation";
import ElasticitySimulation from "./ElasticitySimulation";
import SkinZoomSelector from "./SkinZoomSelector";
import AreaTapOverlay from "./AreaTapOverlay";
import RecoveryAnimation from "./RecoveryAnimation";
import SeveritySelector from "./SeveritySelector";
import LabCard from "./LabCard";
import { SYMPTOMS, CATEGORY_INFO } from "@/engine/weights";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ---------- Photo match presets per category ----------

const ACNE_PHOTOS: PhotoOption[] = [
  { id: "mild_scattered", label: "Mild Scattered", description: "A few small spots here and there", icon: "🔸", severityMap: { C1_01: 1, C1_09: 1 } },
  { id: "hormonal_jaw", label: "Hormonal Jawline", description: "Concentrated along jaw & chin", icon: "🔻", severityMap: { C1_02: 2, C1_03: 2 } },
  { id: "cystic", label: "Deep Cystic", description: "Hard, painful nodules under skin", icon: "🔴", severityMap: { C1_07: 3, C1_08: 2 } },
  { id: "comedonal", label: "Mostly Comedonal", description: "Blackheads and closed bumps", icon: "⚫", severityMap: { C1_09: 2, C1_11: 2 } },
];

const DRYNESS_PHOTOS: PhotoOption[] = [
  { id: "normal_dry", label: "Normal", description: "Comfortable, minimal tightness", icon: "💧", severityMap: {} },
  { id: "tight", label: "Tight", description: "Taut feeling after cleansing", icon: "🫧", severityMap: { C3_01: 2, C3_11: 1 } },
  { id: "flaky", label: "Flaky", description: "Visible dry patches and flaking", icon: "🧊", severityMap: { C3_03: 2, C3_04: 2 } },
  { id: "severely_dehydrated", label: "Severely Dehydrated", description: "Cracking, lines, chronic dryness", icon: "🏜️", severityMap: { C3_02: 3, C3_13: 3 } },
];

const PIGMENT_PHOTOS: PhotoOption[] = [
  { id: "pih", label: "PIH Spots", description: "Post-inflammatory dark marks", icon: "🟤", severityMap: { C5_03: 2, C5_01: 2 } },
  { id: "melasma", label: "Melasma", description: "Patches on cheeks/forehead", icon: "🌑", severityMap: { C5_02: 3, C5_14: 2 } },
  { id: "uneven_dull", label: "Uneven Dull", description: "Overall lack of radiance", icon: "🌫️", severityMap: { C5_04: 2, C5_05: 2 } },
  { id: "minimal_pigment", label: "Minimal", description: "Little to no pigmentation concern", icon: "✨", severityMap: {} },
];

// ---------- Zone presets ----------

const PIGMENT_ZONES = [
  { id: "forehead", label: "Forehead", cx: 100, cy: 55, rx: 22, ry: 12 },
  { id: "left_cheek", label: "L. Cheek", cx: 70, cy: 90, rx: 16, ry: 14 },
  { id: "right_cheek", label: "R. Cheek", cx: 130, cy: 90, rx: 16, ry: 14 },
  { id: "upper_lip", label: "Upper Lip", cx: 100, cy: 110, rx: 12, ry: 6 },
  { id: "chin", label: "Chin", cx: 100, cy: 130, rx: 14, ry: 10 },
];

const AGING_ZONES = [
  { id: "eye_area", label: "Eyes", cx: 100, cy: 76, rx: 30, ry: 8 },
  { id: "nasolabial", label: "Nasolabial", cx: 100, cy: 105, rx: 20, ry: 12 },
  { id: "jawline", label: "Jawline", cx: 100, cy: 135, rx: 30, ry: 10 },
  { id: "neck", label: "Neck", cx: 100, cy: 155, rx: 25, ry: 8 },
  { id: "forehead_lines", label: "Forehead", cx: 100, cy: 50, rx: 25, ry: 10 },
];

const PORE_ZONES = [
  { id: "nose", label: "Nose", cx: 100, cy: 95, rx: 10, ry: 14 },
  { id: "left_cheek", label: "L. Cheek", cx: 72, cy: 92, rx: 14, ry: 12 },
  { id: "right_cheek", label: "R. Cheek", cx: 128, cy: 92, rx: 14, ry: 12 },
  { id: "chin", label: "Chin", cx: 100, cy: 128, rx: 12, ry: 8 },
];

const OILINESS_ZONES = [
  { id: "t_zone", label: "T-Zone", cx: 100, cy: 70, rx: 14, ry: 30 },
  { id: "cheeks", label: "Cheeks", cx: 100, cy: 95, rx: 35, ry: 18 },
  { id: "full_face", label: "Full Face", cx: 100, cy: 90, rx: 42, ry: 50 },
];

// Context flags for interactive components
const CATEGORY_CONTEXT_FLAGS: Record<number, string> = {
  1: "ui_facemap",
  2: "ui_timeline",
  3: "ui_hydration",
  4: "ui_thermal",
  5: "ui_pigment_map",
  6: "ui_skinzoom",
  7: "ui_elasticity",
  8: "ui_recovery",
};

// Core symptom IDs (shown by default) — 3 per category
const CORE_SYMPTOMS: Record<number, string[]> = {
  1: ["C1_01", "C1_07", "C1_03"],
  2: ["C2_01", "C2_04", "C2_07"],
  3: ["C3_01", "C3_02", "C3_03"],
  4: ["C4_01", "C4_03", "C4_09"],
  5: ["C5_01", "C5_04", "C5_06"],
  6: ["C6_01", "C6_06", "C6_04"],
  7: ["C7_01", "C7_06", "C7_03"],
  8: ["C8_01", "C8_06", "C8_08"],
};

// ---------- Per-category interactive renderer ----------

interface CategoryInteractiveProps {
  category: number;
  severities: Record<string, number>;
  onSeverityChange: (symptomId: string, value: number) => void;
}

const CategoryInteractive = ({ category, severities, onSeverityChange }: CategoryInteractiveProps) => {
  const { addContext, setUiSignals } = useDiagnosisStore();
  const [faceZones, setFaceZones] = useState<Record<string, number>>({});
  const [acnePhoto, setAcnePhoto] = useState<string | null>(null);
  const [drynessPhoto, setDrynessPhoto] = useState<string | null>(null);
  const [pigmentPhoto, setPigmentPhoto] = useState<string | null>(null);
  const [timelineHour, setTimelineHour] = useState(12);
  const [oilZones, setOilZones] = useState<string[]>([]);
  const [pigmentZones, setPigmentZones] = useState<string[]>([]);
  const [textureSelected, setTextureSelected] = useState<string | null>(null);
  const [poreZones, setPoreZones] = useState<string[]>([]);
  const [agingZones, setAgingZones] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  const categorySymptoms = useMemo(() => {
    return Object.values(SYMPTOMS).filter((s) => s.category === category);
  }, [category]);

  const coreIds = CORE_SYMPTOMS[category] ?? [];
  const coreSymptoms = categorySymptoms.filter((s) => coreIds.includes(s.id));
  const extraSymptoms = categorySymptoms.filter((s) => !coreIds.includes(s.id));

  // Register interactive context flag on first interaction
  const markInteractive = useCallback(() => {
    const flag = CATEGORY_CONTEXT_FLAGS[category];
    if (flag) addContext(flag);
  }, [category, addContext]);

  // Apply photo match severity boosts
  const applyPhotoMatch = useCallback((photoId: string, photos: PhotoOption[]) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    Object.entries(photo.severityMap).forEach(([symptomId, sev]) => {
      const current = severities[symptomId] ?? 0;
      if (sev > current) onSeverityChange(symptomId, sev);
    });
  }, [severities, onSeverityChange]);

  // Convert face map to severity + uiSignals
  const handleFaceMapChange = useCallback((zones: Record<string, number>) => {
    setFaceZones(zones);
    markInteractive();
    const zoneCount = Object.keys(zones).length;
    const totalIntensity = Object.values(zones).reduce((a, b) => a + b, 0);
    if (zoneCount > 0) {
      const avgIntensity = Math.min(3, Math.round(totalIntensity / zoneCount));
      onSeverityChange("C1_02", avgIntensity);
    }
    if (zones["jawline_l"] || zones["jawline_r"] || zones["chin"]) {
      onSeverityChange("C1_03", Math.max(severities["C1_03"] ?? 0, 2));
    }
    // Write to uiSignals
    const zoneNames = Object.keys(zones);
    setUiSignals("acne", {
      zones: zoneNames,
      intensity: zoneCount > 0 ? Math.round((totalIntensity / zoneCount) * 33) : 0,
    });
  }, [onSeverityChange, severities, markInteractive, setUiSignals]);

  // Convert timeline to severity + uiSignals
  const handleTimelineChange = useCallback((hour: number) => {
    setTimelineHour(hour);
    markInteractive();
    let sev = 0;
    if (hour <= 6) sev = 3;
    else if (hour <= 12) sev = 2;
    else if (hour <= 18) sev = 1;
    onSeverityChange("C2_01", sev);
    onSeverityChange("C2_03", hour <= 8 ? 3 : hour <= 14 ? 2 : hour <= 20 ? 1 : 0);
    setUiSignals("oil", { shine_start_hour: hour });
  }, [onSeverityChange, markInteractive, setUiSignals]);

  const info = CATEGORY_INFO[category];

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <span className="text-xs font-medium uppercase tracking-widest text-primary">
          Category {category} of 8
        </span>
        <h2 className="mt-2 font-display text-3xl text-foreground">
          {info?.emoji} {info?.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{info?.clinical}</p>
      </div>

      {/* ===== CATEGORY 1: ACNE ===== */}
      {category === 1 && (
        <>
          <FaceMapInteractive
            selectedZones={faceZones}
            onChange={handleFaceMapChange}
          />
          <PhotoMatchSelector
            title="Which image looks closest to your skin?"
            options={ACNE_PHOTOS}
            selected={acnePhoto}
            onSelect={(id) => {
              setAcnePhoto(id);
              markInteractive();
              applyPhotoMatch(id, ACNE_PHOTOS);
              const idx = ACNE_PHOTOS.findIndex(p => p.id === id);
              setUiSignals("acne", { photo_match: idx as 0 | 1 | 2 | 3 });
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 2: OILINESS ===== */}
      {category === 2 && (
        <>
          <TimelineSlider
            label="When does shine appear?"
            value={timelineHour}
            onChange={handleTimelineChange}
            unit="hours after cleansing"
            markers={[
              { value: 0, label: "Immediately" },
              { value: 12, label: "Midday" },
              { value: 24, label: "Never" },
            ]}
          />
          <AreaTapOverlay
            title="Where does oil appear most?"
            subtitle="Tap affected areas"
            zones={OILINESS_ZONES}
            selected={oilZones}
            onToggle={(id) => {
              markInteractive();
              setOilZones(prev =>
                prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
              );
              if (id === "t_zone") {
                onSeverityChange("C2_02", 2);
                setUiSignals("oil", { distribution: "tzone" });
              }
              if (id === "full_face") {
                onSeverityChange("C2_01", 3);
                onSeverityChange("C2_09", 2);
                setUiSignals("oil", { distribution: "full" });
              }
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 3: DRYNESS ===== */}
      {category === 3 && (
        <>
          <HydrationEvaporation
            retentionLevel={severities["C3_02"] ?? 0}
            onChange={(v) => {
              markInteractive();
              onSeverityChange("C3_02", v);
              onSeverityChange("C3_13", Math.max(0, v - 1));
              setUiSignals("dry", { moisture_retention_hours: v === 3 ? 0 : v === 2 ? 2 : v === 1 ? 4 : 12 });
            }}
          />
          <PhotoMatchSelector
            title="Which best describes your dryness?"
            options={DRYNESS_PHOTOS}
            selected={drynessPhoto}
            onSelect={(id) => {
              setDrynessPhoto(id);
              markInteractive();
              applyPhotoMatch(id, DRYNESS_PHOTOS);
              const idx = DRYNESS_PHOTOS.findIndex(p => p.id === id);
              setUiSignals("dry", { photo_match: idx as 0 | 1 | 2 | 3 });
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 4: SENSITIVITY ===== */}
      {category === 4 && (
        <>
          <ThermalGauge
            value={severities["C4_01"] ?? 0}
            onChange={(v) => {
              markInteractive();
              onSeverityChange("C4_01", v);
              if (v >= 2) onSeverityChange("C4_07", Math.max(severities["C4_07"] ?? 0, v - 1));
              setUiSignals("sensitivity", { reactivity: v * 33 });
            }}
            label="Flush Reactivity"
          />
          <LabCard>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Which actives cause stinging?
            </p>
            <div className="flex gap-3 justify-center">
              {[
                { id: "aha", label: "AHA", symptom: "C4_05", signalKey: "react_aha" },
                { id: "retinol", label: "Retinol", symptom: "C4_06", signalKey: "react_retinol" },
                { id: "vitc", label: "Vitamin C", symptom: "C4_05", signalKey: "react_vitc" },
              ].map((active) => (
                <motion.button
                  key={active.id}
                  onClick={() => {
                    markInteractive();
                    const cur = severities[active.symptom] ?? 0;
                    const next = cur >= 3 ? 0 : cur + 1;
                    onSeverityChange(active.symptom, next);
                    setUiSignals("sensitivity", { [active.signalKey]: next > 0 });
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                    (severities[active.symptom] ?? 0) > 0
                      ? "border-severity-severe/50 bg-severity-severe/10 text-severity-severe"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                  whileTap={{ scale: 0.92 }}
                >
                  <motion.div
                    animate={
                      (severities[active.symptom] ?? 0) > 0
                        ? { scale: [1, 1.05, 1] }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                  >
                    {active.label}
                    {(severities[active.symptom] ?? 0) > 0 && (
                      <span className="ml-1 text-xs">×{severities[active.symptom]}</span>
                    )}
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </LabCard>
        </>
      )}

      {/* ===== CATEGORY 5: PIGMENTATION ===== */}
      {category === 5 && (
        <>
          <AreaTapOverlay
            title="Where is pigmentation visible?"
            subtitle="Tap to highlight affected zones"
            zones={PIGMENT_ZONES}
            selected={pigmentZones}
            onToggle={(id) => {
              markInteractive();
              setPigmentZones(prev =>
                prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
              );
              const count = pigmentZones.length + (pigmentZones.includes(id) ? -1 : 1);
              onSeverityChange("C5_04", Math.min(3, count));
              setUiSignals("pigment", { zones: pigmentZones.includes(id) ? pigmentZones.filter(z => z !== id) : [...pigmentZones, id] });
            }}
            darken
          />
          <PhotoMatchSelector
            title="Which pigmentation pattern matches yours?"
            options={PIGMENT_PHOTOS}
            selected={pigmentPhoto}
            onSelect={(id) => {
              setPigmentPhoto(id);
              markInteractive();
              applyPhotoMatch(id, PIGMENT_PHOTOS);
              const idx = PIGMENT_PHOTOS.findIndex(p => p.id === id);
              setUiSignals("pigment", { photo_match: idx as 0 | 1 | 2 | 3 });
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 6: TEXTURE ===== */}
      {category === 6 && (
        <>
          <SkinZoomSelector
            selected={textureSelected}
            onSelect={(id, sev) => {
              markInteractive();
              setTextureSelected(id);
              onSeverityChange("C6_06", sev);
              onSeverityChange("C6_07", Math.max(0, sev - 1));
              setUiSignals("texture", { zoom_choice: sev as 0 | 1 | 2 | 3 });
            }}
          />
          <AreaTapOverlay
            title="Where are pores most visible?"
            subtitle="Tap to mark"
            zones={PORE_ZONES}
            selected={poreZones}
            onToggle={(id) => {
              markInteractive();
              setPoreZones(prev =>
                prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
              );
              if (id === "nose") { onSeverityChange("C6_02", 2); setUiSignals("texture", { pore_location: "nose" }); }
              if (id === "left_cheek" || id === "right_cheek") { onSeverityChange("C6_03", 2); setUiSignals("texture", { pore_location: "cheeks" }); }
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 7: AGING ===== */}
      {category === 7 && (
        <>
          <ElasticitySimulation
            value={severities["C7_06"] ?? 0}
            onChange={(v) => {
              markInteractive();
              onSeverityChange("C7_06", v);
              onSeverityChange("C7_07", Math.max(0, v - 1));
              setUiSignals("aging", { rebound: v as 0 | 1 | 2 | 3 });
            }}
          />
          <AreaTapOverlay
            title="Where do you notice firmness loss?"
            subtitle="Tap affected areas"
            zones={AGING_ZONES}
            selected={agingZones}
            onToggle={(id) => {
              markInteractive();
              setAgingZones(prev =>
                prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
              );
              if (id === "eye_area") { onSeverityChange("C7_01", 2); setUiSignals("aging", { areas: [...agingZones, "eyes"] }); }
              if (id === "nasolabial") { onSeverityChange("C7_03", 2); setUiSignals("aging", { areas: [...agingZones, "nasolabial"] }); }
              if (id === "jawline") { onSeverityChange("C7_05", 2); setUiSignals("aging", { areas: [...agingZones, "jawline"] }); }
              if (id === "neck") { onSeverityChange("C7_04", 2); setUiSignals("aging", { areas: [...agingZones, "neck"] }); }
              if (id === "forehead_lines") { onSeverityChange("C7_15", 2); setUiSignals("aging", { areas: [...agingZones, "forehead"] }); }
            }}
          />
        </>
      )}

      {/* ===== CATEGORY 8: BARRIER ===== */}
      {category === 8 && (
        <>
          <RecoveryAnimation
            recoverySpeed={severities["C8_06"] ?? 0}
            onChange={(v) => {
              markInteractive();
              onSeverityChange("C8_06", v);
              onSeverityChange("C8_05", Math.max(0, v - 1));
              setUiSignals("barrier", { recovery_hours: v === 0 ? 0 : v === 1 ? 4 : v === 2 ? 18 : 48 });
            }}
          />
        </>
      )}

      {/* Core symptom questions (3 per category, always visible) */}
      <LabCard>
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Core Assessment
        </p>
        <div className="flex flex-col gap-5">
          {coreSymptoms.map((symptom) => (
            <div key={symptom.id} className="space-y-2">
              <p className="text-sm text-foreground">{symptom.text_en}</p>
              <SeveritySelector
                value={severities[symptom.id] ?? 0}
                onChange={(v) => onSeverityChange(symptom.id, v)}
              />
            </div>
          ))}
        </div>
      </LabCard>

      {/* Extra symptom questions (collapsible) */}
      {extraSymptoms.length > 0 && (
        <Collapsible open={expandedQuestions} onOpenChange={setExpandedQuestions}>
          <CollapsibleTrigger asChild>
            <motion.button
              className="flex w-full items-center justify-between rounded-lg border border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              whileTap={{ scale: 0.98 }}
            >
              <span>Improve accuracy ({extraSymptoms.length} more questions)</span>
              <motion.div
                animate={{ rotate: expandedQuestions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </motion.button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <LabCard className="mt-3">
              <div className="flex flex-col gap-5">
                {extraSymptoms.map((symptom) => (
                  <div key={symptom.id} className="space-y-2">
                    <p className="text-sm text-foreground">{symptom.text_en}</p>
                    <SeveritySelector
                      value={severities[symptom.id] ?? 0}
                      onChange={(v) => onSeverityChange(symptom.id, v)}
                    />
                  </div>
                ))}
              </div>
            </LabCard>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default CategoryInteractive;
