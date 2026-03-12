import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SkinType, ContextKey, Tier, DiagnosisResult } from "@/engine/types";
import type { UiSignalsV4 } from "@/engine/uiMappingV4";
import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import type { ClimateProfile } from "@/engine/climateEngine";

// ─── Typed axis response structures ──────────────────────────────────────────

export interface SebumResponses {
  shineTimeline?: string;
  oilyAreas?: string[];
  roughTexture?: string;
}

export interface HydrationResponses {
  dehydratedOily?: string;
  worstTiming?: string;
  flaking?: string;
}

export interface PoresResponses {
  shape?: string;
  visibility?: number;
  tzoneWorse?: string;
}

export interface TextureResponses {
  breakoutType?: string;
  frequency?: string;
  scarring?: string;
}

export interface SensitivityResponses {
  waterReaction?: string;
  rednessFrequency?: string;
  productTolerance?: string;
  shavingIrritation?: string;
}

export interface AgingResponses {
  wrinkleDepth?: number;
  saggingAreas?: string[];
  currentActives?: string[];
}

export interface PigmentResponses {
  type?: string;
  duration?: string;
  uvExposure?: string;
}

export interface HormonalResponses {
  cyclicalChanges?: string;
  worstPhase?: string;
  hormonalMedication?: string;
}

export interface NeurodermatitisResponses {
  chronicItching?: string;
  diagnosis?: string;
  extremeFlaking?: string;
}

export interface AxisResponses {
  sebum?: SebumResponses;
  hydration?: HydrationResponses;
  pores?: PoresResponses;
  texture?: TextureResponses;
  sensitivity?: SensitivityResponses;
  aging?: AgingResponses;
  pigment?: PigmentResponses;
  hormonal?: HormonalResponses;
  neurodermatitis?: NeurodermatitisResponses;
}

export interface Lifestyle {
  sleepHours?: number;
  waterIntake?: string;
  stressLevel?: string;
  climate?: string;
  climateProfile?: ClimateProfile;
  outdoorExercise?: string;
}

export type { ClimateProfile };

export interface ImplicitFlags {
  likelyHormonalCycleUser: boolean;
  likelyShaver: boolean;
  atopyFlag: boolean;
}

export interface SkinVector {
  seb?: number;
  hyd?: number;
  bar?: number;
  sen?: number;
  acne?: number;
  pigment?: number;
  texture?: number;
  aging?: number;
}

export interface SelectedZones {
  [zoneId: string]: { concerns: string[] };
}

// ─── Legacy interactive state (kept for UI component backward compat) ─────────

export interface InteractiveState {
  faceZones: Record<string, number>;
  acnePhoto: string | null;
  drynessPhoto: string | null;
  pigmentPhoto: string | null;
  timelineHour: number;
  oilZones: string[];
  oilFullFace: boolean;
  poreFullFace: boolean;
  pigmentZones: string[];
  pigmentMarkers: Array<{ zone: string; type: string }>;
  textureSelected: string | null;
  poreZones: string[];
  agingZones: string[];
  activeToggles: Record<string, boolean>;
  expandedQuestions: Record<number, boolean>;
  userTags: Record<string, number>;
}

const defaultInteractiveState: InteractiveState = {
  faceZones: {},
  acnePhoto: null,
  drynessPhoto: null,
  pigmentPhoto: null,
  timelineHour: 12,
  oilZones: [],
  oilFullFace: false,
  poreFullFace: false,
  pigmentZones: [],
  pigmentMarkers: [],
  textureSelected: null,
  poreZones: [],
  agingZones: [],
  activeToggles: {},
  expandedQuestions: {},
  userTags: {},
};

// ─── Flag derivation ──────────────────────────────────────────────────────────

function deriveImplicitFlags(
  axisResponses: AxisResponses,
  axisAnswers: Record<string, QuestionAnswer>
): ImplicitFlags {
  const atopyFlag =
    axisResponses.neurodermatitis?.chronicItching === "constantly" ||
    axisResponses.neurodermatitis?.diagnosis === "dx_atopic" ||
    axisResponses.neurodermatitis?.diagnosis === "dx_psoriasis" ||
    axisAnswers["AX9_Q1"] === "constantly" ||
    axisAnswers["AX9_Q2"] === "dx_atopic" ||
    axisAnswers["AX9_Q2"] === "dx_psoriasis";

  const likelyHormonalCycleUser =
    axisResponses.hormonal?.cyclicalChanges === "horm_severe" ||
    axisResponses.hormonal?.cyclicalChanges === "horm_moderate" ||
    axisAnswers["AX4_Q2_COND"] === "hormonal_yes" ||
    axisAnswers["AX8_Q1"] === "horm_severe";

  const likelyShaver =
    axisResponses.sensitivity?.shavingIrritation != null ||
    axisAnswers["AX5_Q4"] != null;

  return {
    atopyFlag: Boolean(atopyFlag),
    likelyHormonalCycleUser: Boolean(likelyHormonalCycleUser),
    likelyShaver: Boolean(likelyShaver),
  };
}

// ─── Dual-write: flat answer key → typed axisResponses / lifestyle ────────────

function applyAxisAnswerToTyped(
  id: string,
  value: QuestionAnswer,
  prev: AxisResponses,
  prevLifestyle: Lifestyle
): { axisResponses: AxisResponses; lifestyle: Lifestyle } {
  let ar = prev;
  let ls = prevLifestyle;

  switch (id) {
    // Sebum
    case "AX1_Q1": ar = { ...ar, sebum: { ...ar.sebum, shineTimeline: value as string } }; break;
    case "AX1_Q2": ar = { ...ar, sebum: { ...ar.sebum, oilyAreas: value as string[] } }; break;
    case "AX1_Q3": ar = { ...ar, sebum: { ...ar.sebum, roughTexture: value as string } }; break;

    // Hydration
    case "AX2_Q1": ar = { ...ar, hydration: { ...ar.hydration, dehydratedOily: value as string } }; break;
    case "AX2_Q2": ar = { ...ar, hydration: { ...ar.hydration, worstTiming: value as string } }; break;
    case "AX2_Q3": ar = { ...ar, hydration: { ...ar.hydration, flaking: value as string } }; break;

    // Pores
    case "AX3_Q1": ar = { ...ar, pores: { ...ar.pores, shape: value as string } }; break;
    case "AX3_Q2": ar = { ...ar, pores: { ...ar.pores, visibility: value as number } }; break;
    case "AX3_Q3": ar = { ...ar, pores: { ...ar.pores, tzoneWorse: value as string } }; break;

    // Texture / Breakouts
    case "AX4_Q1": ar = { ...ar, texture: { ...ar.texture, breakoutType: value as string } }; break;
    case "AX4_Q2": ar = { ...ar, texture: { ...ar.texture, frequency: value as string } }; break;
    case "AX4_Q3": ar = { ...ar, texture: { ...ar.texture, scarring: value as string } }; break;

    // Sensitivity
    case "AX5_Q1": ar = { ...ar, sensitivity: { ...ar.sensitivity, waterReaction: value as string } }; break;
    case "AX5_Q2": ar = { ...ar, sensitivity: { ...ar.sensitivity, rednessFrequency: value as string } }; break;
    case "AX5_Q3": ar = { ...ar, sensitivity: { ...ar.sensitivity, productTolerance: value as string } }; break;
    case "AX5_Q4": ar = { ...ar, sensitivity: { ...ar.sensitivity, shavingIrritation: value as string } }; break;

    // Aging
    case "AX6_Q1": ar = { ...ar, aging: { ...ar.aging, wrinkleDepth: value as number } }; break;
    case "AX6_Q2": ar = { ...ar, aging: { ...ar.aging, saggingAreas: value as string[] } }; break;
    case "AX6_Q3": ar = { ...ar, aging: { ...ar.aging, currentActives: value as string[] } }; break;

    // Pigment
    case "AX7_Q1": ar = { ...ar, pigment: { ...ar.pigment, type: value as string } }; break;
    case "AX7_Q2": ar = { ...ar, pigment: { ...ar.pigment, duration: value as string } }; break;
    case "AX7_Q3": ar = { ...ar, pigment: { ...ar.pigment, uvExposure: value as string } }; break;

    // Hormonal
    case "AX8_Q1": ar = { ...ar, hormonal: { ...ar.hormonal, cyclicalChanges: value as string } }; break;
    case "AX8_Q2": ar = { ...ar, hormonal: { ...ar.hormonal, worstPhase: value as string } }; break;
    case "AX8_Q3": ar = { ...ar, hormonal: { ...ar.hormonal, hormonalMedication: value as string } }; break;

    // Neurodermatitis
    case "AX9_Q1": ar = { ...ar, neurodermatitis: { ...ar.neurodermatitis, chronicItching: value as string } }; break;
    case "AX9_Q2": ar = { ...ar, neurodermatitis: { ...ar.neurodermatitis, diagnosis: value as string } }; break;
    case "AX9_Q3": ar = { ...ar, neurodermatitis: { ...ar.neurodermatitis, extremeFlaking: value as string } }; break;

    // Lifestyle (Exposome)
    case "EXP_SLEEP": ls = { ...ls, sleepHours: value as number }; break;
    case "EXP_WATER": ls = { ...ls, waterIntake: value as string }; break;
    case "EXP_STRESS": ls = { ...ls, stressLevel: value as string }; break;
    case "EXP_CLIMATE": ls = { ...ls, climate: value as string }; break;
    case "EXP_EXERCISE": ls = { ...ls, outdoorExercise: value as string }; break;
  }

  return { axisResponses: ar, lifestyle: ls };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface StoreActions {
  // New typed API
  setZoneConcern: (zoneId: string, concerns: string[]) => void;
  setAllZones: (zones: SelectedZones) => void;
  updateAxis: <K extends keyof AxisResponses>(axis: K, data: AxisResponses[K]) => void;
  updateLifestyle: (data: Partial<Lifestyle>) => void;
  calculateImplicitFlags: () => void;
  nextStep: () => void;
  prevStep: () => void;
  resetDiagnosis: () => void;
}

interface DiagnosisState {
  // Step tracking
  currentStep: number;
  currentCategory: number;

  // New typed structures
  selectedZones: SelectedZones;
  axisResponses: AxisResponses;
  lifestyle: Lifestyle;
  implicitFlags: ImplicitFlags;

  // Journey tracking
  completedAt?: string;
  previousResultId?: string;
  lastVector?: SkinVector;

  // Legacy inputs (kept for backward compat with UI components)
  contexts: ContextKey[];
  skinType: SkinType | null;
  severities: Record<string, number>;
  metaAnswers: Record<string, number | boolean>;
  selectedTier: Tier;

  // Interactive UI signals
  uiSignals: UiSignalsV4;

  // Interactive component state (persisted across category navigation)
  interactiveState: InteractiveState;

  // Axis-based answers (V5 engine — flat map, kept for backward compat)
  axisAnswers: Record<string, QuestionAnswer>;

  // Result (not persisted)
  result: DiagnosisResult | null;

  // ── Legacy flat actions (backward compat) ──
  setStep: (step: number) => void;
  setCategory: (cat: number) => void;
  toggleContext: (ctx: ContextKey) => void;
  addContext: (ctx: string) => void;
  setSkinType: (type: SkinType) => void;
  setSeverity: (symptomId: string, value: number) => void;
  setMetaAnswer: (id: string, value: number | boolean) => void;
  setTier: (tier: Tier) => void;
  setAxisAnswer: (id: string, value: QuestionAnswer) => void;
  clearAxisAnswers: () => void;
  setClimateProfile: (profile: ClimateProfile) => void;
  setResult: (result: DiagnosisResult) => void;
  setUiSignals: (category: string, data: Record<string, unknown>) => void;
  setInteractive: <K extends keyof InteractiveState>(key: K, value: InteractiveState[K]) => void;
  addUserTags: (delta: Record<string, number>) => void;
  reset: () => void;

  // ── New typed actions namespace ──
  actions: StoreActions;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const defaultImplicitFlags: ImplicitFlags = {
  likelyHormonalCycleUser: false,
  likelyShaver: false,
  atopyFlag: false,
};

const initialState = {
  currentStep: 0,
  currentCategory: 1,
  selectedZones: {} as SelectedZones,
  axisResponses: {} as AxisResponses,
  lifestyle: {} as Lifestyle,
  implicitFlags: { ...defaultImplicitFlags },
  completedAt: undefined as string | undefined,
  previousResultId: undefined as string | undefined,
  lastVector: undefined as SkinVector | undefined,
  contexts: [] as ContextKey[],
  skinType: null as SkinType | null,
  severities: {} as Record<string, number>,
  metaAnswers: {} as Record<string, number | boolean>,
  axisAnswers: {} as Record<string, QuestionAnswer>,
  selectedTier: "Full" as Tier,
  uiSignals: {} as UiSignalsV4,
  interactiveState: { ...defaultInteractiveState },
  result: null as DiagnosisResult | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Legacy flat actions ──────────────────────────────────────────────

      setStep: (step) => set({ currentStep: step }),
      setCategory: (cat) => set({ currentCategory: cat }),

      toggleContext: (ctx) =>
        set((state) => ({
          contexts: state.contexts.includes(ctx)
            ? state.contexts.filter((c) => c !== ctx)
            : [...state.contexts, ctx],
        })),

      addContext: (ctx) =>
        set((state) => ({
          contexts: state.contexts.includes(ctx as ContextKey)
            ? state.contexts
            : [...state.contexts, ctx as ContextKey],
        })),

      setSkinType: (type) => set({ skinType: type }),

      setSeverity: (symptomId, value) =>
        set((state) => ({
          severities: { ...state.severities, [symptomId]: value },
        })),

      setMetaAnswer: (id, value) =>
        set((state) => ({
          metaAnswers: { ...state.metaAnswers, [id]: value },
        })),

      // Dual-write: updates flat axisAnswers AND typed axisResponses/lifestyle
      setAxisAnswer: (id, value) =>
        set((state) => {
          const newAnswers = { ...state.axisAnswers, [id]: value };
          const { axisResponses, lifestyle } = applyAxisAnswerToTyped(
            id, value, state.axisResponses, state.lifestyle
          );
          const implicitFlags = deriveImplicitFlags(axisResponses, newAnswers);
          return { axisAnswers: newAnswers, axisResponses, lifestyle, implicitFlags };
        }),

      setTier: (tier) => set({ selectedTier: tier }),
      clearAxisAnswers: () => set({ axisAnswers: {} as Record<string, QuestionAnswer> }),
      setClimateProfile: (profile) =>
        set((state) => ({
          lifestyle: { ...state.lifestyle, climateProfile: profile, climate: profile.climateType },
        })),
      setResult: (result) => set({ result }),

      setUiSignals: (category, data) =>
        set((state) => ({
          uiSignals: {
            ...state.uiSignals,
            [category]: {
              ...((state.uiSignals as Record<string, unknown>)[category] as Record<string, unknown> ?? {}),
              ...data,
            },
          },
        })),

      setInteractive: (key, value) =>
        set((state) => ({
          interactiveState: { ...state.interactiveState, [key]: value },
        })),

      addUserTags: (delta) =>
        set((state) => {
          const current = state.interactiveState.userTags;
          const merged = { ...current };
          for (const [tag, value] of Object.entries(delta)) {
            merged[tag] = (merged[tag] ?? 0) + value;
          }
          return { interactiveState: { ...state.interactiveState, userTags: merged } };
        }),

      reset: () =>
        set({
          ...initialState,
          interactiveState: { ...defaultInteractiveState },
          implicitFlags: { ...defaultImplicitFlags },
          selectedZones: {},
          axisResponses: {},
          lifestyle: {},
        }),

      // ── New typed actions namespace ──────────────────────────────────────

      actions: {
        setZoneConcern: (zoneId, concerns) =>
          set((state) => ({
            selectedZones: {
              ...state.selectedZones,
              [zoneId]: { concerns },
            },
          })),

        setAllZones: (zones) =>
          set((state) => {
            // Sync legacy faceZones: concern IDs as keys (computeAxisQueue uses CONCERN_TO_AXES)
            const legacyFaceZones: Record<string, number> = {};
            for (const { concerns } of Object.values(zones)) {
              for (const concernId of concerns) {
                legacyFaceZones[concernId] = 1;
              }
            }
            return {
              selectedZones: zones,
              interactiveState: { ...state.interactiveState, faceZones: legacyFaceZones },
            };
          }),

        updateAxis: <K extends keyof AxisResponses>(axis: K, data: AxisResponses[K]) =>
          set((state) => {
            const axisResponses = {
              ...state.axisResponses,
              [axis]: { ...(state.axisResponses[axis] ?? {}), ...(data ?? {}) },
            };
            const implicitFlags = deriveImplicitFlags(axisResponses, state.axisAnswers);
            return { axisResponses, implicitFlags };
          }),

        updateLifestyle: (data) =>
          set((state) => ({
            lifestyle: { ...state.lifestyle, ...data },
          })),

        calculateImplicitFlags: () =>
          set((state) => ({
            implicitFlags: deriveImplicitFlags(state.axisResponses, state.axisAnswers),
          })),

        nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
        prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

        resetDiagnosis: () =>
          set({
            ...initialState,
            interactiveState: { ...defaultInteractiveState },
            implicitFlags: { ...defaultImplicitFlags },
            selectedZones: {},
            axisResponses: {},
            lifestyle: {},
          }),
      },
    }),
    {
      name: "skin-diagnosis-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        currentCategory: state.currentCategory,
        selectedZones: state.selectedZones,
        axisResponses: state.axisResponses,
        // climateProfile is session-only — excluded so city resets on each fresh visit
        lifestyle: { ...state.lifestyle, climateProfile: undefined, climate: undefined },
        implicitFlags: state.implicitFlags,
        completedAt: state.completedAt,
        previousResultId: state.previousResultId,
        lastVector: state.lastVector,
        contexts: state.contexts,
        skinType: state.skinType,
        severities: state.severities,
        metaAnswers: state.metaAnswers,
        axisAnswers: state.axisAnswers,
        selectedTier: state.selectedTier,
        interactiveState: state.interactiveState,
        // uiSignals and result are NOT persisted (derived/large)
      }),
    }
  )
);
