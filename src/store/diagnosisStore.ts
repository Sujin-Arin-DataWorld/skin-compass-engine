import { create } from "zustand";
import { SkinType, ContextKey, Tier, DiagnosisResult } from "@/engine/types";
import type { UiSignalsV4 } from "@/engine/uiMappingV4";

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
  textureSelected: string | null;
  poreZones: string[];
  agingZones: string[];
  activeToggles: Record<string, boolean>;
  expandedQuestions: Record<number, boolean>;
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
  textureSelected: null,
  poreZones: [],
  agingZones: [],
  activeToggles: {},
  expandedQuestions: {},
};

interface DiagnosisState {
  // Step tracking
  currentStep: number;
  currentCategory: number;

  // Inputs
  contexts: ContextKey[];
  skinType: SkinType | null;
  severities: Record<string, number>;
  metaAnswers: Record<string, number | boolean>;
  selectedTier: Tier;

  // Interactive UI signals
  uiSignals: UiSignalsV4;

  // Interactive component state (persisted across category navigation)
  interactiveState: InteractiveState;

  // Result
  result: DiagnosisResult | null;

  // Actions
  setStep: (step: number) => void;
  setCategory: (cat: number) => void;
  toggleContext: (ctx: ContextKey) => void;
  addContext: (ctx: string) => void;
  setSkinType: (type: SkinType) => void;
  setSeverity: (symptomId: string, value: number) => void;
  setMetaAnswer: (id: string, value: number | boolean) => void;
  setTier: (tier: Tier) => void;
  setResult: (result: DiagnosisResult) => void;
  setUiSignals: (category: string, data: Record<string, unknown>) => void;
  setInteractive: <K extends keyof InteractiveState>(key: K, value: InteractiveState[K]) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  currentCategory: 1,
  contexts: [] as ContextKey[],
  skinType: null as SkinType | null,
  severities: {} as Record<string, number>,
  metaAnswers: {} as Record<string, number | boolean>,
  selectedTier: "Full" as Tier,
  uiSignals: {} as UiSignalsV4,
  interactiveState: { ...defaultInteractiveState },
  result: null as DiagnosisResult | null,
};

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  ...initialState,

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

  setTier: (tier) => set({ selectedTier: tier }),
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

  reset: () => set({ ...initialState, interactiveState: { ...defaultInteractiveState } }),
}));
