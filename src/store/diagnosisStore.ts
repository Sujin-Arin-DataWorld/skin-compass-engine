import { create } from "zustand";
import { SkinType, ContextKey, Tier, DiagnosisResult } from "@/engine/types";
import type { UiSignalsV4 } from "@/engine/uiMappingV4";

interface DiagnosisState {
  // Step tracking
  currentStep: number; // 0=context, 1=skinType, 2-9=categories, 10=loading
  currentCategory: number; // 1-8

  // Inputs
  contexts: ContextKey[];
  skinType: SkinType | null;
  severities: Record<string, number>; // symptom_id → 0-3
  metaAnswers: Record<string, number | boolean>;
  selectedTier: Tier;

  // Interactive UI signals
  uiSignals: UiSignalsV4;

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

  reset: () => set(initialState),
}));
