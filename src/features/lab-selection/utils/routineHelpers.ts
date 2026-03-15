import { Product, FaceZone, TimeOfDay, RequiredIngredient, GateStatus } from '../types';
import { SLOT_TIME_MAP, ZONE_COLORS } from '../data/textureRules';

/** Determine AM/PM/both based on product's routine_slot */
export function inferTimeOfDay(product: Product): TimeOfDay {
  // Retinol products → always PM
  const hasRetinol = product.ingredients.some(
    i => i.name_en.toLowerCase().includes('retinol')
  );
  if (hasRetinol) return 'PM';

  // Vitamin C products → always AM
  const hasVitC = product.ingredients.some(
    i => i.name_inci === 'Ascorbic Acid' || i.name_en.includes('L-Ascorbic')
  );
  if (hasVitC) return 'AM';

  return SLOT_TIME_MAP[product.routine_slot] || 'both';
}

/** Generate zone-specific application warning text (i18n key) */
export function getZoneWarningKey(zone: FaceZone): string | null {
  if (zone === 'whole_face') return null;
  return 'lab.routine.zone_warning'; // interpolated with zone label
}

/** Build the face map overlay data from selected products */
export function buildZoneOverlay(
  selections: { product: Product; zone: FaceZone }[]
): { zone: FaceZone; color_code: string; product_ids: string[] }[] {
  const zoneMap = new Map<FaceZone, string[]>();

  for (const { product, zone } of selections) {
    if (!zoneMap.has(zone)) zoneMap.set(zone, []);
    zoneMap.get(zone)!.push(product.id);
  }

  return Array.from(zoneMap.entries()).map(([zone, ids]) => ({
    zone,
    color_code: ZONE_COLORS[zone]?.light || ZONE_COLORS.whole_face.light,
    product_ids: ids,
  }));
}

/** Calculate ingredient compliance score (how well a product matches requirements) */
export function calcComplianceScore(
  product: Product,
  required: { name_en: string; min_concentration: number | null }[]
): { score: number; matches: { name: string; status: 'full' | 'partial' | 'missing' }[] } {
  let totalWeight = 0;
  let earnedWeight = 0;
  const matches: { name: string; status: 'full' | 'partial' | 'missing' }[] = [];

  for (const req of required) {
    totalWeight += 1;
    const found = product.ingredients.find(
      i => i.name_en.toLowerCase().includes(req.name_en.toLowerCase())
    );

    if (!found) {
      matches.push({ name: req.name_en, status: 'missing' });
    } else if (
      req.min_concentration !== null &&
      found.concentration_pct !== null &&
      found.concentration_pct >= req.min_concentration
    ) {
      earnedWeight += 1;
      matches.push({ name: req.name_en, status: 'full' });
    } else {
      earnedWeight += 0.5;
      matches.push({ name: req.name_en, status: 'partial' });
    }
  }

  return {
    score: totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0,
    matches,
  };
}

// ── Caution Mode Concentration Caps ──────────────────────────────────────────

/**
 * Clinical concentration caps for 'caution' mode.
 * Based on dermatological evidence for compromised/sensitive skin:
 * - Niacinamide: Dr. Rogers MD recommends 2-4% for sensitive skin (Journal of Cosmetic Dermatology, 2004)
 * - Retinol: 0.1% max with frequency restriction (Board-certified derm consensus)
 * - BHA: 0.5% wash-off only; 2% leave-on is contraindicated for compromised barriers
 * - Vitamin C: 10% max, or switch to gentler derivatives (SAP, MAP)
 * - Azelaic Acid: 10% max (full 20% reserved for intact barriers only)
 * - AHA (Glycolic/Lactic): 5% max, once per week only
 */

export interface CautionWarning {
  ingredient_name: string;
  original_min: number | null;
  capped_to: number;
  forced_method: 'wash_off' | null;
  frequency_cap: string | null;
  alternative_key: string | null;
  warning_key: string;
}

interface CautionCap {
  ingredient_pattern: string;
  max_concentration: number;
  forced_method: 'wash_off' | null;
  frequency_cap: string | null;
  alternative_suggestion_key: string | null;
}

const CAUTION_CAPS: CautionCap[] = [
  {
    ingredient_pattern: 'Salicylic Acid',
    max_concentration: 0.5,
    forced_method: 'wash_off',
    frequency_cap: 'daily_am_pm',
    alternative_suggestion_key: null,
  },
  {
    ingredient_pattern: 'Niacinamide',
    max_concentration: 4.0,
    forced_method: null,
    frequency_cap: null,
    alternative_suggestion_key: null,
  },
  {
    ingredient_pattern: 'L-Ascorbic Acid',
    max_concentration: 10.0,
    forced_method: null,
    frequency_cap: null,
    alternative_suggestion_key: 'lab.caution.vitc_derivative',
  },
  {
    ingredient_pattern: 'Retinol',
    max_concentration: 0.1,
    forced_method: null,
    frequency_cap: '1_per_week',
    alternative_suggestion_key: 'lab.caution.retinol_frequency',
  },
  {
    ingredient_pattern: 'Azelaic Acid',
    max_concentration: 10.0,
    forced_method: null,
    frequency_cap: null,
    alternative_suggestion_key: null,
  },
  {
    ingredient_pattern: 'Glycolic Acid',
    max_concentration: 5.0,
    forced_method: null,
    frequency_cap: '1_per_week',
    alternative_suggestion_key: 'lab.caution.aha_frequency',
  },
  {
    ingredient_pattern: 'Lactic Acid',
    max_concentration: 5.0,
    forced_method: null,
    frequency_cap: '1_per_week',
    alternative_suggestion_key: null,
  },
];

export function applyCautionCaps(
  ingredients: RequiredIngredient[],
  gateStatus: GateStatus
): { capped: RequiredIngredient[]; warnings: CautionWarning[] } {
  if (gateStatus !== 'caution') {
    return { capped: ingredients, warnings: [] };
  }

  const warnings: CautionWarning[] = [];
  const capped = ingredients.map((ing) => {
    const cap = CAUTION_CAPS.find((c) =>
      ing.name_en.toLowerCase().includes(c.ingredient_pattern.toLowerCase())
    );

    if (!cap) return ing;

    const modified = { ...ing };
    let wasCapped = false;

    if (
      modified.min_concentration !== null &&
      modified.min_concentration > cap.max_concentration
    ) {
      modified.min_concentration = cap.max_concentration;
      modified.max_concentration = cap.max_concentration;
      wasCapped = true;
    }

    if (wasCapped) {
      warnings.push({
        ingredient_name: ing.name_en,
        original_min: ing.min_concentration,
        capped_to: cap.max_concentration,
        forced_method: cap.forced_method,
        frequency_cap: cap.frequency_cap,
        alternative_key: cap.alternative_suggestion_key,
        warning_key: 'lab.gate.caution_cap_applied',
      });
    }

    return modified;
  });

  return { capped, warnings };
}
