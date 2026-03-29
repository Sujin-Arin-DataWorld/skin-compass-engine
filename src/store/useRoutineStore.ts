// src/store/useRoutineStore.ts
// Zustand store for routine tier selection & picker visibility

import { create } from 'zustand';
import type { RoutineTierId } from '@/types/routine';
import { DEFAULT_TIER } from '@/constants/routineTiers';

interface RoutineState {
  selectedTier: RoutineTierId;
  isPickerOpen: boolean;

  setSelectedTier: (tier: RoutineTierId) => void;
  openPicker: () => void;
  closePicker: () => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  selectedTier: DEFAULT_TIER,
  isPickerOpen: false,

  setSelectedTier: (tier) => set({ selectedTier: tier }),
  openPicker: () => set({ isPickerOpen: true }),
  closePicker: () => set({ isPickerOpen: false }),
}));
