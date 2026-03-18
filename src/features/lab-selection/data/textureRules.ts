import { RoutineSlot, TimeOfDay } from '../types';

// Products are applied thinnest → thickest.
// Lower number = applied first.
export const TEXTURE_ORDER: Record<string, number> = {
  liquid: 1,
  mist: 1,
  foam: 0,        // wash-off, before everything
  gel_cleanser: 0,
  toner: 2,
  essence: 3,
  serum_water: 4,
  serum_gel: 5,
  serum_milk: 6,
  ampoule: 5,
  oil: 7,
  lotion: 8,
  cream_light: 9,
  cream_rich: 10,
  ointment: 11,
  sleeping_mask: 12,
  spf: 13,          // SPF always last in AM
  sheet_mask: 99,   // special — used between toner and serum
};

// Map routine_slot → default time of day
export const SLOT_TIME_MAP: Record<RoutineSlot, TimeOfDay> = {
  cleanser: 'both',
  toner: 'both',
  toner_exfoliant: 'PM',       // exfoliant toners → PM preferred
  essence: 'both',
  serum_am: 'AM',
  serum_pm: 'PM',
  serum_spot: 'PM',
  moisturizer_light: 'AM',
  moisturizer_rich: 'PM',
  moisturizer_allinone: 'both',
  spf: 'AM',
  mask_sheet: 'PM',
  mask_modeling: 'PM',
  mask_sleeping: 'PM',
};

// pH conflict detection rules
export const PH_CONFLICTS = [
  {
    ingredient_a: 'Salicylic Acid',
    ingredient_b: 'Niacinamide',
    conflict_type: 'wait_10min' as const,
    warning_key: 'lab.conflict.bha_niacin_wait',
  },
  {
    ingredient_a: 'L-Ascorbic Acid',
    ingredient_b: 'Niacinamide',
    conflict_type: 'wait_10min' as const,
    warning_key: 'lab.conflict.vitc_niacin_wait',
  },
  {
    ingredient_a: 'L-Ascorbic Acid',
    ingredient_b: 'Retinol',
    conflict_type: 'split_am_pm' as const,
    warning_key: 'lab.conflict.vitc_retinol_split',
  },
  {
    ingredient_a: 'Retinol',
    ingredient_b: 'Salicylic Acid',
    conflict_type: 'avoid_combination' as const,
    warning_key: 'lab.conflict.retinol_bha_avoid',
  },
  {
    ingredient_a: 'Retinol',
    ingredient_b: 'Azelaic Acid',
    conflict_type: 'split_am_pm' as const,
    warning_key: 'lab.conflict.retinol_aza_split',
  },
];

// Zone color coding for face map overlay
export const ZONE_COLORS: Record<string, { light: string; dark: string }> = {
  t_zone:    { light: '#F0997B', dark: '#712B13' },  // coral
  forehead:  { light: '#F0997B', dark: '#712B13' },  // coral
  nose:      { light: '#F0997B', dark: '#712B13' },  // coral
  cheeks:    { light: '#85B7EB', dark: '#0C447C' },  // blue
  mouth:     { light: '#ED93B1', dark: '#72243E' },  // pink
  jawline:   { light: '#ED93B1', dark: '#72243E' },  // pink
  eye_area:  { light: '#AFA9EC', dark: '#3C3489' },  // purple
  whole_face:{ light: '#5DCAA5', dark: '#085041' },  // teal
};
