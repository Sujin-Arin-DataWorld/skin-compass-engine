// src/types/routine.ts
// Type definitions for the Routine Picker system

export type RoutineTierId = 'essential' | 'complete' | 'pro';

export interface RoutineStep {
  key: string;   // 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'eye_care'
  order: number;
}

export interface RoutineTier {
  id: RoutineTierId;
  timeMinutes: number;       // 3, 5, 10
  steps: RoutineStep[];
  includesSPF: true;         // Always true — SPF included in all tiers
  includesDevice: boolean;   // Only true for Pro tier
  isDefault: boolean;        // Only true for Essential
}
