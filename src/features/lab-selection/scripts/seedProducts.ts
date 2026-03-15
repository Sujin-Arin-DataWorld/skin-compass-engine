/**
 * src/features/lab-selection/scripts/seedProducts.ts
 *
 * Seeds the Supabase `products` table from src/data/product_db.json.
 *
 * Usage (from project root):
 *   npx ts-node --project tsconfig.json src/features/lab-selection/scripts/seedProducts.ts
 *
 * The script normalises sparse JSON records to the full DB schema,
 * filling in sensible defaults for missing optional fields.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { TEXTURE_ORDER } from '../data/textureRules';

// ── Supabase connection ───────────────────────────────────────────────────────
// Reads env vars directly so this script can run outside the Vite context.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??  // preferred: bypasses RLS
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) env vars.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Raw JSON type (sparse — many optional fields may be absent) ───────────────
interface RawIngredient {
  name_en: string;
  concentration_pct?: number | null;
  role?: string;
  name_kr?: string;
  name_inci?: string;
  concentration_unit?: string;
}

interface RawProduct {
  id: string;
  name_kr: string;
  name_en: string;
  name_de?: string;
  brand: string;
  brand_kr?: string;
  country: string;
  market_tier: string;
  price_tier: string;
  price_eur: number;
  price_krw?: number | null;
  volume_ml: number;
  price_per_ml_eur?: number;
  routine_slot: string;
  texture_type: string;
  texture_order?: number;
  ingredients?: RawIngredient[];
  target_profiles?: string[];
  target_age_range?: string;
  skin_concerns?: string[];
  application_zones?: string[];
  application_method?: string;
  application_instruction_kr?: string;
  application_instruction_en?: string;
  application_instruction_de?: string;
  application_frequency?: string;
  fragrance_free?: boolean;
  alcohol_free?: boolean;
  purchase_channels?: Record<string, string[]>;
  awards?: string[];
  one_liner_kr?: string;
  one_liner_en?: string;
  vs_comparison?: object | null;
  duel_verdict?: object | null;
}

interface ProductDb {
  _schema_version: string;
  products: RawProduct[];
}

// ── Normalise a raw product to the full DB row shape ─────────────────────────
function normalise(raw: RawProduct): Record<string, unknown> {
  const textureOrder =
    raw.texture_order ??
    TEXTURE_ORDER[raw.texture_type] ??
    5; // fallback mid-range

  const ingredients = (raw.ingredients ?? []).map((ing) => ({
    name_en: ing.name_en,
    name_kr: ing.name_kr ?? '',
    name_inci: ing.name_inci ?? '',
    concentration_pct: ing.concentration_pct ?? null,
    concentration_unit: (ing.concentration_unit ?? '%') as '%' | 'ppm' | 'IU',
    role: ing.role ?? '',
  }));

  return {
    id: raw.id,
    name_kr: raw.name_kr,
    name_en: raw.name_en,
    name_de: raw.name_de ?? raw.name_en,                   // fall back to EN
    brand: raw.brand,
    brand_kr: raw.brand_kr ?? raw.brand,                   // fall back to brand
    country: raw.country,
    market_tier: raw.market_tier,
    price_tier: raw.price_tier,
    price_eur: raw.price_eur,
    price_krw: raw.price_krw ?? null,
    volume_ml: raw.volume_ml,
    price_per_ml_eur:
      raw.price_per_ml_eur ??
      (raw.volume_ml > 0 ? +(raw.price_eur / raw.volume_ml).toFixed(4) : 0),
    routine_slot: raw.routine_slot,
    texture_type: raw.texture_type,
    texture_order: textureOrder,
    ingredients,
    target_profiles: raw.target_profiles ?? [],
    target_age_range: raw.target_age_range ?? '',
    skin_concerns: raw.skin_concerns ?? [],
    application_zones: raw.application_zones ?? ['whole_face'],
    application_method: raw.application_method ?? 'leave_on',
    application_instruction_kr: raw.application_instruction_kr ?? '',
    application_instruction_en: raw.application_instruction_en ?? '',
    application_instruction_de: raw.application_instruction_de ?? '',
    application_frequency: raw.application_frequency ?? 'daily_am_pm',
    fragrance_free: raw.fragrance_free ?? false,
    alcohol_free: raw.alcohol_free ?? false,
    purchase_channels: raw.purchase_channels ?? { KR: [], DE: [], global_online: [] },
    awards: raw.awards ?? [],
    one_liner_kr: raw.one_liner_kr ?? '',
    one_liner_en: raw.one_liner_en ?? '',
    vs_comparison: raw.vs_comparison ?? null,
    duel_verdict: raw.duel_verdict ?? null,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const dbPath = path.resolve(
    __dirname,
    '../../../../data/product_db.json'   // src/data/product_db.json from script dir
  );

  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: product_db.json not found at ${dbPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as ProductDb;
  const products = raw.products;
  console.log(`Found ${products.length} products in product_db.json`);

  let successCount = 0;
  let failCount = 0;

  for (const rawProduct of products) {
    const row = normalise(rawProduct);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`  FAIL  [${rawProduct.id}]: ${error.message}`);
      failCount++;
    } else {
      console.log(`  OK    [${rawProduct.id}]`);
      successCount++;
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed.`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
