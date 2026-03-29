// src/constants/routineTiers.ts
// Static data for the 3 routine tiers

import type { RoutineTier, RoutineTierId } from '@/types/routine';

export const ROUTINE_TIERS: RoutineTier[] = [
  {
    id: 'essential',
    timeMinutes: 3,
    steps: [
      { key: 'cleanser',    order: 1 },
      { key: 'serum',       order: 2 },
      { key: 'moisturizer', order: 3 },
    ],
    includesSPF: true,
    includesDevice: false,
    isDefault: true,
  },
  {
    id: 'complete',
    timeMinutes: 5,
    steps: [
      { key: 'cleanser',    order: 1 },
      { key: 'toner',       order: 2 },
      { key: 'serum',       order: 3 },
      { key: 'moisturizer', order: 4 },
      { key: 'eye_care',    order: 5 },
    ],
    includesSPF: true,
    includesDevice: false,
    isDefault: false,
  },
  {
    id: 'pro',
    timeMinutes: 10,
    steps: [
      { key: 'cleanser',    order: 1 },
      { key: 'toner',       order: 2 },
      { key: 'serum',       order: 3 },
      { key: 'moisturizer', order: 4 },
      { key: 'eye_care',    order: 5 },
    ],
    includesSPF: true,
    includesDevice: true,
    isDefault: false,
  },
];

export const DEFAULT_TIER: RoutineTierId = 'essential';
