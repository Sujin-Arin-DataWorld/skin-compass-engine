/**
 * routineEngine.ts
 *
 * B-2 / B-2.1 / B-3: Base Type + Target Trouble + Advanced Tier + Skin Rescue Override
 *
 * Input:  SkinVector + ImplicitFlags + AxisResponses
 * Output: RoutineOutput — 3-step, 5-step, Advanced (Device), and SOS Rescue routines.
 *
 * ⚠️  MOCK CATALOG — final product DB is still being curated.
 * Fallback: missing steps inject the SkinStrategyLab hero product (serum role)
 * or are gracefully omitted without breaking the UI.
 *
 * Clinical Safety Gate (Advanced tier):
 *   IF barrier > 85 OR atopyFlag → advanced = null.
 *
 * Skin Rescue Hard Override (B-3):
 *   IF atopyFlag OR confirmed dx_atopic/dx_psoriasis OR (chronic itch + barrier > 75):
 *   → BYPASS all general K-Beauty routines.
 *   → Force 3-Step K-Derma SOS protocol (Dongkook Pharm / Aestura only).
 *   → Device lockout guaranteed (atopyFlag → safetyBlocked → advanced = null).
 */

import type { SkinVector } from "@/engine/types";
import type { AxisResponses, ImplicitFlags } from "@/store/diagnosisStore";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type BaseType =
  | "oily"
  | "combination-dehydrated-oily"
  | "dry"
  | "normal";

export type TargetTrouble =
  | "barrier-repair"        // Priority 1: SOS Rescue
  | "intense-hydration"     // Priority 2: Critical Dehydration
  | "blemish-sebum-control" // Priority 3: Active Clearance
  | "brightening"           // Priority 4a: Pigment > Aging
  | "well-aging";           // Priority 4b: Aging >= Pigment

export type StepRole =
  | "cleanser"
  | "toner"
  | "serum"
  | "treatment"   // slot 4 in 5-step: eye cream or targeted concentrate
  | "moisturizer"
  | "spf"
  | "device";     // slot 6 in advanced: professional device (Medicube Booster Pro)

export type Formulation =
  | "gel"
  | "water"
  | "lightweight-fluid"
  | "lotion"
  | "cream"
  | "balm"
  | null;         // null = not applicable (devices)

// ─── Mock Product Interface ───────────────────────────────────────────────────

export interface MockProduct {
  id: string;
  name: { en: string; de: string; ko: string };
  brand: string;
  role: StepRole;
  targetTrouble: TargetTrouble | "universal";
  /** Empty array = compatible with all base types */
  baseTypes: BaseType[];
  formulation: Formulation;
  keyIngredients: string[];
  /** "am" = morning only, "pm" = evening only, both = all-day */
  phaseTiming: Array<"am" | "pm">;
  isHero?: boolean;
}

export interface RoutineStep {
  role: StepRole;
  product: MockProduct | null; // null = gracefully omitted in UI
  timing: "am" | "pm";
  order: number;
}

export interface RoutineLevel {
  label: "3-step" | "5-step" | "advanced";
  am: RoutineStep[];
  pm: RoutineStep[];
}

/**
 * B-3: Skin Rescue Hard Override metadata.
 * When `isActive`, the UI must display the SOS protocol instead of
 * all general K-Beauty routines. Device is always locked out.
 */
export interface SkinRescueProtocol {
  isActive: true;
  /** Which trigger condition fired the override. */
  trigger: "atopyFlag" | "diagnosis" | "itch+barrier";
  /** Forced 3-Step routine using K-Derma clinical brands only. */
  routine: RoutineLevel;
  disclaimer: { en: string; de: string; ko: string };
}

export interface RoutineOutput {
  baseType: BaseType;
  targetTrouble: TargetTrouble;
  /**
   * Non-null when advanced is blocked by the Clinical Safety Gate.
   * The UI should show this message instead of the advanced routine.
   */
  advancedCaution: { en: string; de: string; ko: string } | null;
  /**
   * B-3: Non-null when the Skin Rescue Hard Override is active.
   * The UI MUST replace all standard routine display with the SOS rescue UI.
   */
  skinRescue: SkinRescueProtocol | null;
  routines: {
    minimalist: RoutineLevel;      // 3-step
    committed:  RoutineLevel;      // 5-step
    advanced:   RoutineLevel | null; // 5-step + Device (null = safety gate active)
  };
}

// ─── Device mode mapping (Medicube Age-R Booster Pro 6-in-1) ─────────────────

export const DEVICE_MODE_MAP: Record<TargetTrouble, { en: string; de: string; ko: string }> = {
  "well-aging": {
    en: "EMS Derma Shot + Microcurrent Mode",
    de: "EMS Derma Shot + Mikrostrom-Modus",
    ko: "EMS 더마샷 + 마이크로커런트 모드",
  },
  "intense-hydration": {
    en: "Booster Mode — Electroporation for deep absorption",
    de: "Booster-Modus — Elektroporation für Tiefenwirkung",
    ko: "부스터 모드 — 전기영동으로 깊은 흡수",
  },
  "blemish-sebum-control": {
    en: "Air Shot Mode — Needle-free aesthetic care",
    de: "Air Shot Modus — Nadelfreie Ästhetikpflege",
    ko: "에어샷 모드 — 니들프리 에스테틱 케어",
  },
  "brightening": {
    en: "Booster Mode — Active ingredient absorption (Vitamin C)",
    de: "Booster-Modus — Wirkstoff-Absorption (Vitamin C)",
    ko: "부스터 모드 — 유효성분 흡수 (비타민 C)",
  },
  "barrier-repair": {
    en: "LED Therapy Mode — Low-level light, safe for compromised barrier",
    de: "LED-Therapie-Modus — Niedrigenergie, sicher bei gestörter Barriere",
    ko: "저강도 LED 테라피 모드 — 손상된 장벽에 안전",
  },
};

// ─── Hero fallback ────────────────────────────────────────────────────────────

const HERO_PRODUCT: MockProduct = {
  id: "ssl-hero-essence",
  name: {
    en: "SkinStrategyLab Signature Essence",
    de: "SkinStrategyLab Signatur-Essenz",
    ko: "스킨스트래티지랩 시그니처 에센스",
  },
  brand: "SkinStrategyLab",
  role: "serum",
  targetTrouble: "universal",
  baseTypes: [],
  formulation: "lightweight-fluid",
  keyIngredients: ["Niacinamide 5%", "Panthenol", "Hyaluronic Acid"],
  phaseTiming: ["am", "pm"],
  isHero: true,
};

// ─── Mock product catalog ─────────────────────────────────────────────────────

const CATALOG: MockProduct[] = [

  // ──────────────────────────────────────────────────────── CLEANSERS ─────────

  {
    id: "ssl-clean-gel",
    name: { en: "Pore-Clear Gel Cleanser", de: "Porenklärendes Gel-Reinigungsmittel", ko: "포어클리어 젤 클렌저" },
    brand: "SkinStrategyLab",
    role: "cleanser", targetTrouble: "universal",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["BHA 0.5%", "Green Tea Extract", "Niacinamide"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-clean-cream",
    name: { en: "Comfort Cream Cleanser", de: "Komfort-Creme-Reiniger", ko: "컴포트 크림 클렌저" },
    brand: "SkinStrategyLab",
    role: "cleanser", targetTrouble: "universal",
    baseTypes: ["dry"],
    formulation: "cream",
    keyIngredients: ["Ceramide NP", "Glycerin", "Oat Kernel Extract"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-clean-foam",
    name: { en: "Balancing Foam Cleanser", de: "Ausgleichende Schaum-Reinigung", ko: "밸런싱 폼 클렌저" },
    brand: "SkinStrategyLab",
    role: "cleanser", targetTrouble: "universal",
    baseTypes: ["normal"],
    formulation: "gel",
    keyIngredients: ["Green Tea Extract", "Niacinamide", "Aloe Vera"],
    phaseTiming: ["am", "pm"],
  },

  // ──────────────────────────────────────────────────────────── TONERS ─────────

  {
    id: "ssl-toner-barrier",
    name: { en: "Ceramide Barrier Essence Toner", de: "Ceramid-Barriere-Essenz-Toner", ko: "세라마이드 배리어 에센스 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "barrier-repair",
    baseTypes: [],
    formulation: "water",
    keyIngredients: ["Ceramide AP", "Panthenol 3%", "Centella Asiatica"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-toner-hydra",
    name: { en: "Hyaluronic Hydra Mist Toner", de: "Hyaluronischer Hydra-Nebel-Toner", ko: "히알루론산 하이드라 미스트 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "intense-hydration",
    baseTypes: [],
    formulation: "water",
    keyIngredients: ["Hyaluronic Acid (3 molecular weights)", "Glycerin", "Tremella Mushroom"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-toner-bha",
    name: { en: "BHA Pore Refining Toner", de: "BHA Porenverfeinerungs-Toner", ko: "BHA 모공 정제 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "blemish-sebum-control",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "water",
    keyIngredients: ["Salicylic Acid 1%", "Niacinamide 5%", "Witch Hazel"],
    phaseTiming: ["pm"],
  },
  {
    id: "ssl-toner-niacin",
    name: { en: "Niacinamide Clarifying Toner", de: "Niacinamid-Klärungs-Toner", ko: "나이아신아마이드 클래리파잉 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "blemish-sebum-control",
    baseTypes: ["dry", "normal"],
    formulation: "water",
    keyIngredients: ["Niacinamide 5%", "Zinc PCA", "Azelaic Acid"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-toner-vc",
    name: { en: "Vitamin C Brightening Toner", de: "Vitamin C Aufhellungs-Toner", ko: "비타민C 브라이트닝 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "brightening",
    baseTypes: [],
    formulation: "water",
    keyIngredients: ["Ascorbyl Glucoside 2%", "Niacinamide 5%", "Tranexamic Acid"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-toner-peptide",
    name: { en: "Peptide Firming Preparation Toner", de: "Peptid-Straffungs-Vorbereitungs-Toner", ko: "펩타이드 퍼밍 토너" },
    brand: "SkinStrategyLab",
    role: "toner", targetTrouble: "well-aging",
    baseTypes: [],
    formulation: "water",
    keyIngredients: ["Copper Peptide GHK-Cu", "Adenosine", "EGF"],
    phaseTiming: ["am", "pm"],
  },

  // ──────────────────────────────────────────────────────────── SERUMS ─────────

  // Barrier Repair — AM+PM, formulation-matched by base type
  {
    id: "ssl-serum-barrier-oily",
    name: { en: "Centella SOS Calming Gel", de: "Centella SOS Beruhigungs-Gel", ko: "병풀 SOS 진정 젤" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "barrier-repair",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["Centella Asiatica 30%", "Ceramide NP", "Beta-Glucan"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-serum-barrier-dry",
    name: { en: "Ceramide Barrier Recovery Fluid", de: "Ceramid Barriere-Regenerations-Fluid", ko: "세라마이드 배리어 회복 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "barrier-repair",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Ceramide Complex", "Panthenol 5%", "Madecassoside"],
    phaseTiming: ["am", "pm"],
  },

  // Intense Hydration — AM+PM
  {
    id: "ssl-serum-hydra-oily",
    name: { en: "Aqua Plump Gel Serum", de: "Aqua Plump Gel-Serum", ko: "아쿠아 플럼프 젤 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "intense-hydration",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["Hyaluronic Acid (5 molecular weights)", "Sodium PCA", "Tremella Mushroom"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-serum-hydra-dry",
    name: { en: "Deep Moisture Infusion Serum", de: "Tiefenfeuchtigkeits-Infusionsserum", ko: "딥 모이스처 인퓨전 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "intense-hydration",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Hyaluronic Acid (5 molecular weights)", "Glycerin 10%", "Snow Mushroom"],
    phaseTiming: ["am", "pm"],
  },

  // Blemish / Sebum Control — AM-safe (niacinamide, no BHA)
  {
    id: "ssl-serum-blemish-am-oily",
    name: { en: "Niacinamide Pore Control Gel Serum", de: "Niacinamid Porenkontroll-Gel-Serum", ko: "나이아신아마이드 포어 컨트롤 젤 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "blemish-sebum-control",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["Niacinamide 10%", "Zinc PCA", "Azelaic Acid 5%"],
    phaseTiming: ["am"],
  },
  {
    id: "ssl-serum-blemish-am-dry",
    name: { en: "Clear Balance Daily Fluid", de: "Clear Balance Tages-Fluid", ko: "클리어 밸런스 데일리 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "blemish-sebum-control",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Niacinamide 5%", "Zinc PCA", "Willow Bark Extract"],
    phaseTiming: ["am"],
  },
  // Blemish — PM-only (BHA active clearance)
  {
    id: "ssl-serum-blemish-pm-oily",
    name: { en: "BHA Clear Skin Gel Serum", de: "BHA Klarhaut Gel-Serum", ko: "BHA 클리어 스킨 젤 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "blemish-sebum-control",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["Salicylic Acid 2%", "Niacinamide 10%", "Tea Tree Leaf Water"],
    phaseTiming: ["pm"],
  },
  {
    id: "ssl-serum-blemish-pm-dry",
    name: { en: "Pore Control Balancing Fluid", de: "Porenkontrolle Balancier-Fluid", ko: "포어 컨트롤 밸런싱 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "blemish-sebum-control",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Niacinamide 5%", "Zinc PCA", "Salicylic Acid 0.5%"],
    phaseTiming: ["pm"],
  },

  // Brightening — AM+PM
  {
    id: "ssl-serum-bright-oily",
    name: { en: "Vitamin C Glow Fluid", de: "Vitamin C Glow-Fluid", ko: "비타민C 글로우 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "brightening",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Ascorbic Acid 10%", "Alpha-Arbutin 2%", "Niacinamide"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-serum-bright-dry",
    name: { en: "Brightening Tone Perfector Serum", de: "Aufhellungs-Tonperfektions-Serum", ko: "브라이트닝 톤 퍼펙터 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "brightening",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Stabilized Vitamin C 15%", "Ferulic Acid", "Alpha-Arbutin"],
    phaseTiming: ["am", "pm"],
  },

  // Well-Aging — AM (antioxidant protection)
  {
    id: "ssl-serum-aging-am-oily",
    name: { en: "Youth Protect Antioxidant Fluid", de: "Youth Protect Antioxidans-Fluid", ko: "유스 프로텍트 항산화 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "well-aging",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Vitamin C Derivative", "Resveratrol", "Matrixyl 3000"],
    phaseTiming: ["am"],
  },
  {
    id: "ssl-serum-aging-am-dry",
    name: { en: "Glow & Firm Morning Fluid", de: "Glow & Firm Morgen-Fluid", ko: "글로우 & 펌 모닝 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "well-aging",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Stable Vitamin C 15%", "Adenosine", "Collagen Amino Acids"],
    phaseTiming: ["am"],
  },
  // Well-Aging — PM (retinol / peptide repair)
  {
    id: "ssl-serum-aging-pm-oily",
    name: { en: "Peptide Youth Activating Fluid", de: "Peptid-Jugend-Aktivierungs-Fluid", ko: "펩타이드 유스 액티베이팅 플루이드" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "well-aging",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Matrixyl 3000", "Retinyl Propionate 0.1%", "Coenzyme Q10"],
    phaseTiming: ["pm"],
  },
  {
    id: "ssl-serum-aging-pm-dry",
    name: { en: "Collagen Boost Firming Serum", de: "Kollagen-Boost-Straffungsserum", ko: "콜라겐 부스트 퍼밍 세럼" },
    brand: "SkinStrategyLab",
    role: "serum", targetTrouble: "well-aging",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Copper Peptide GHK-Cu", "Retinol 0.1%", "Adenosine"],
    phaseTiming: ["pm"],
  },

  // ─────────────────────────────────────────────── TREATMENTS (5-step slot 4) ──

  {
    id: "ssl-treat-barrier",
    name: { en: "Barrier Rescue Concentrate", de: "Barriere-Rettungs-Konzentrat", ko: "배리어 레스큐 컨센트레이트" },
    brand: "SkinStrategyLab",
    role: "treatment", targetTrouble: "barrier-repair",
    baseTypes: [],
    formulation: "cream",
    keyIngredients: ["Ceramide Complex", "Shea Butter", "Colloidal Oatmeal"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-treat-hydra",
    name: { en: "Water Reserve Eye & Lip Treatment", de: "Wasserreserve Augen- & Lippenpflege", ko: "워터 리저브 아이 & 립 트리트먼트" },
    brand: "SkinStrategyLab",
    role: "treatment", targetTrouble: "intense-hydration",
    baseTypes: [],
    formulation: "gel",
    keyIngredients: ["Hyaluronic Acid", "Caffeine", "Peptide"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-treat-blemish",
    name: { en: "Spot & Pore Refining Treatment", de: "Spot & Poren-Verfeinerungs-Treatment", ko: "스팟 & 포어 리파이닝 트리트먼트" },
    brand: "SkinStrategyLab",
    role: "treatment", targetTrouble: "blemish-sebum-control",
    baseTypes: [],
    formulation: "gel",
    keyIngredients: ["BHA 2%", "Zinc Oxide", "Tea Tree"],
    phaseTiming: ["pm"],
  },
  {
    id: "ssl-treat-bright",
    name: { en: "Dark Circle & Brightening Eye Serum", de: "Augenringe & Aufhellungs-Augenserum", ko: "다크서클 & 브라이트닝 아이 세럼" },
    brand: "SkinStrategyLab",
    role: "treatment", targetTrouble: "brightening",
    baseTypes: [],
    formulation: "lightweight-fluid",
    keyIngredients: ["Vitamin K2", "Caffeine", "Alpha-Arbutin"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-treat-aging",
    name: { en: "Retinol Eye & Expression Line Cream", de: "Retinol Augen- & Ausdrucksliniencreme", ko: "레티놀 아이 & 익스프레션 크림" },
    brand: "SkinStrategyLab",
    role: "treatment", targetTrouble: "well-aging",
    baseTypes: [],
    formulation: "cream",
    keyIngredients: ["Retinol 0.05%", "Caffeine", "Peptide Complex"],
    phaseTiming: ["pm"],
  },

  // ──────────────────────────────────────────────────── MOISTURIZERS ───────────

  {
    id: "ssl-moist-gel",
    name: { en: "Oil-Free Aqua Gel", de: "Ölfreies Aqua-Gel", ko: "오일프리 아쿠아 젤" },
    brand: "SkinStrategyLab",
    role: "moisturizer", targetTrouble: "universal",
    baseTypes: ["oily"],
    formulation: "gel",
    keyIngredients: ["Sodium Hyaluronate", "Niacinamide", "Aloe Vera"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-moist-emulsion",
    name: { en: "Hydra-Balance Emulsion", de: "Hydra-Balance Emulsion", ko: "하이드라밸런스 에멀젼" },
    brand: "SkinStrategyLab",
    role: "moisturizer", targetTrouble: "universal",
    baseTypes: ["combination-dehydrated-oily"],
    formulation: "lotion",
    keyIngredients: ["Ceramide", "Glycerin", "Squalane"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-moist-cream",
    name: { en: "Rich Barrier Cream", de: "Reichhaltige Barriere-Creme", ko: "리치 배리어 크림" },
    brand: "SkinStrategyLab",
    role: "moisturizer", targetTrouble: "universal",
    baseTypes: ["dry"],
    formulation: "cream",
    keyIngredients: ["Ceramide Complex", "Shea Butter", "Marula Oil"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "ssl-moist-lotion",
    name: { en: "Daily Comfort Lotion", de: "Tägliche Komfort-Lotion", ko: "데일리 컴포트 로션" },
    brand: "SkinStrategyLab",
    role: "moisturizer", targetTrouble: "universal",
    baseTypes: ["normal"],
    formulation: "lotion",
    keyIngredients: ["Hyaluronic Acid", "Niacinamide", "Green Tea Extract"],
    phaseTiming: ["am", "pm"],
  },

  // ─────────────────────────────────────────────────────────────── SPF ─────────

  {
    id: "ssl-spf-fluid",
    name: { en: "Invisible Shield SPF 50+ PA++++", de: "Unsichtbarer Schutz LSF 50+ PA++++", ko: "인비저블 쉴드 SPF 50+ PA++++" },
    brand: "SkinStrategyLab",
    role: "spf", targetTrouble: "universal",
    baseTypes: ["oily", "combination-dehydrated-oily", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Zinc Oxide", "Tinosorb S", "Niacinamide"],
    phaseTiming: ["am"],
  },
  {
    id: "ssl-spf-cream",
    name: { en: "Nourishing Sun Defense SPF 50+ PA++++", de: "Nährende Sonnenschutz LSF 50+ PA++++", ko: "너리싱 선 디펜스 SPF 50+ PA++++" },
    brand: "SkinStrategyLab",
    role: "spf", targetTrouble: "universal",
    baseTypes: ["dry"],
    formulation: "cream",
    keyIngredients: ["Zinc Oxide", "Ceramide", "Squalane"],
    phaseTiming: ["am"],
  },

  // ─────────────────────────────────────────────────────────── DEVICE ──────────

  {
    id: "medicube-booster-pro",
    name: {
      en: "Medicube Age-R Booster Pro",
      de: "Medicube Age-R Booster Pro",
      ko: "메디큐브 에이지알 부스터 프로",
    },
    brand: "Medicube",
    role: "device",
    targetTrouble: "universal",
    baseTypes: [],
    formulation: null,
    keyIngredients: ["Electroporation", "EMS", "Microcurrent", "Air Shot", "LED Therapy"],
    phaseTiming: ["pm"],
  },
];

// ─── SOS Rescue Catalog (K-Derma clinical brands only) ───────────────────────
// Products here are NEVER mixed with the general catalog.
// Two parallel brand lines cover all base types:
//   Oily / Combination-Dehydrated → Dongkook Pharm — Madeca MD (Centella)
//   Dry / Normal                  → Aestura — Atobarrier 365 (Ceramide)

const SOS_CATALOG: MockProduct[] = [

  // ──────────────────────────────────────── Dongkook Pharm — Madeca MD ────────

  {
    id: "madeca-cleanser",
    name: {
      en: "Madeca MD Calming Gel Cleanser",
      de: "Madeca MD Beruhigendes Gel-Reinigungsmittel",
      ko: "마데카MD 진정 젤 클렌저",
    },
    brand: "Dongkook Pharm",
    role: "cleanser", targetTrouble: "barrier-repair",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "gel",
    keyIngredients: ["Centella Asiatica 60%", "Madecassoside", "Panthenol 5%"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "madeca-serum",
    name: {
      en: "Madeca MD Centella SOS Ampoule",
      de: "Madeca MD Centella SOS Ampulle",
      ko: "마데카MD 센텔라 SOS 앰플",
    },
    brand: "Dongkook Pharm",
    role: "serum", targetTrouble: "barrier-repair",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Centella Asiatica Extract", "Asiaticoside", "Ceramide NP"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "madeca-cream",
    name: {
      en: "Madeca MD Recovery Barrier Cream",
      de: "Madeca MD Regenerierende Barriere-Creme",
      ko: "마데카MD 리커버리 배리어 크림",
    },
    brand: "Dongkook Pharm",
    role: "moisturizer", targetTrouble: "barrier-repair",
    baseTypes: ["oily", "combination-dehydrated-oily"],
    formulation: "cream",
    keyIngredients: ["Centella Asiatica 20%", "Ceramide Complex", "Beta-Glucan"],
    phaseTiming: ["am", "pm"],
  },

  // ─────────────────────────────────────────── Aestura — Atobarrier 365 ───────

  {
    id: "aestura-cleanser",
    name: {
      en: "Atobarrier 365 Gentle Cream Cleanser",
      de: "Atobarrier 365 Sanfter Creme-Reiniger",
      ko: "에스트라 아토베리어 365 순한 크림 클렌저",
    },
    brand: "Aestura",
    role: "cleanser", targetTrouble: "barrier-repair",
    baseTypes: ["dry", "normal"],
    formulation: "cream",
    keyIngredients: ["Ceramide NP", "Betaine", "Allantoin"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "aestura-serum",
    name: {
      en: "Atobarrier 365 Ceramide Repair Ampoule",
      de: "Atobarrier 365 Ceramid-Reparatur-Ampulle",
      ko: "에스트라 아토베리어 365 세라마이드 리페어 앰플",
    },
    brand: "Aestura",
    role: "serum", targetTrouble: "barrier-repair",
    baseTypes: ["dry", "normal"],
    formulation: "lightweight-fluid",
    keyIngredients: ["Ceramide Complex 5%", "Panthenol 3%", "Glycerin"],
    phaseTiming: ["am", "pm"],
  },
  {
    id: "aestura-cream",
    name: {
      en: "Atobarrier 365 Intensive Barrier Cream",
      de: "Atobarrier 365 Intensive Barriere-Creme",
      ko: "에스트라 아토베리어 365 인텐시브 크림",
    },
    brand: "Aestura",
    role: "moisturizer", targetTrouble: "barrier-repair",
    baseTypes: ["dry", "normal"],
    formulation: "cream",
    keyIngredients: ["Ceramide 3", "Ceramide 6-II", "Ceramide 1", "Niacinamide"],
    phaseTiming: ["am", "pm"],
  },
];

// ─── Derivation logic ─────────────────────────────────────────────────────────

/**
 * Determines skin's base type (cleansing, moisturizer, texture bias)
 * from sebum and hydration axis scores.
 */
export function deriveBaseType(sebum: number, hydration: number): BaseType {
  if (sebum > 60 && hydration < 40) return "combination-dehydrated-oily";
  if (sebum > 60 && hydration >= 40) return "oily";
  if (sebum < 40 && hydration < 40) return "dry";
  return "normal";
}

/**
 * Evaluates the SkinVector against a strict Clinical Hierarchy.
 * The first condition matched becomes the PRIMARY TargetTrouble —
 * it is NOT overridden by lower-priority concerns.
 */
export function deriveTargetTrouble(v: SkinVector): TargetTrouble {
  // ── Priority 1: SOS Rescue (Barrier & Sensitivity) ──────────────────────────
  // Severely compromised barrier or reactive skin CANNOT safely handle any
  // active ingredients — ceramide + soothing repair is the only safe protocol.
  if (v.barrier > 75 || v.sensitivity > 75) return "barrier-repair";

  // ── Priority 2: Critical Dehydration ────────────────────────────────────────
  // Hydration axis is INVERTED: score < 25 = severely dehydrated.
  // Skin cannot absorb or benefit from actives without adequate hydration.
  if (v.hydration < 25) return "intense-hydration";

  // ── Priority 3: Active Clearance (Acne & Pores) ─────────────────────────────
  // BHA / Niacinamide clearance protocol. Only safe if barrier is intact (< 75).
  if (v.texture > 60 || v.pores > 70) return "blemish-sebum-control";

  // ── Priority 4: Correction ───────────────────────────────────────────────────
  // Both Brightening and Well-Aging are safe here. Pigment > Aging → brightening.
  if (v.pigment > v.aging) return "brightening";
  return "well-aging";
}

// ─── B-3: Skin Rescue trigger evaluation ─────────────────────────────────────

/**
 * Determines whether the Skin Rescue Hard Override (B-3) should activate.
 *
 * Three independent trigger conditions — any ONE is sufficient:
 *   1. `atopyFlag`   — compound multi-signal flag derived from store
 *   2. `diagnosis`   — confirmed dx_atopic or dx_psoriasis answer
 *   3. `itch+barrier`— frequent/constant chronic itch AND barrier score > 75
 *                      (cross-validation prevents false positives from winter dryness)
 *
 * Exported so the frontend can optionally read the trigger for diagnostic display.
 */
export function isSkinRescueRequired(
  axisResponses: AxisResponses,
  implicitFlags: ImplicitFlags,
  vector: SkinVector
): { required: boolean; trigger: SkinRescueProtocol["trigger"] | null } {
  // Trigger 1: Compound atopy flag (multi-signal confirmation)
  if (implicitFlags.atopyFlag) {
    return { required: true, trigger: "atopyFlag" };
  }

  // Trigger 2: Confirmed clinical diagnosis via direct question answer
  const dx = axisResponses.neurodermatitis?.diagnosis;
  if (dx === "dx_atopic" || dx === "dx_psoriasis") {
    return { required: true, trigger: "diagnosis" };
  }

  // Trigger 3: Chronic itch + severely compromised barrier (cross-validated)
  const itch = axisResponses.neurodermatitis?.chronicItching;
  if ((itch === "frequently" || itch === "constantly") && vector.barrier > 75) {
    return { required: true, trigger: "itch+barrier" };
  }

  return { required: false, trigger: null };
}

/**
 * Builds the forced 3-Step SOS Rescue RoutineLevel from SOS_CATALOG.
 * Uses the same base-type matching logic as pickProduct but exclusively
 * against the K-Derma clinical catalog.
 */
function buildSkinRescueProtocol(
  base: BaseType,
  trigger: SkinRescueProtocol["trigger"]
): SkinRescueProtocol {
  const pickSos = (role: StepRole, timing: "am" | "pm", order: number): RoutineStep => {
    const product =
      SOS_CATALOG.find(
        (p) =>
          p.role === role &&
          p.phaseTiming.includes(timing) &&
          (p.baseTypes.length === 0 || p.baseTypes.includes(base))
      ) ??
      // Broadest fallback: any SOS product for this role + timing
      SOS_CATALOG.find((p) => p.role === role && p.phaseTiming.includes(timing)) ??
      null;
    return { role, product, timing, order };
  };

  const routine: RoutineLevel = {
    label: "3-step",
    am: [
      pickSos("cleanser",    "am", 1),
      pickSos("serum",       "am", 2),
      pickSos("moisturizer", "am", 3),
    ],
    pm: [
      pickSos("cleanser",    "pm", 1),
      pickSos("serum",       "pm", 2),
      pickSos("moisturizer", "pm", 3),
    ],
  };

  return {
    isActive: true,
    trigger,
    routine,
    disclaimer: {
      en: "Based on your responses, we recommend clinically-tested dermatological products. For chronic conditions, please also consult a dermatologist (Hautarzt).",
      de: "Basierend auf Ihren Angaben empfehlen wir klinisch getestete dermatologische Produkte. Bei chronischen Erkrankungen empfehlen wir zusätzlich die Konsultation eines Hautarztes.",
      ko: "귀하의 응답을 바탕으로 임상 테스트된 피부과 전문 제품을 추천드립니다. 만성 질환의 경우 피부과 전문의(Hautarzt) 상담도 병행하시기 바랍니다.",
    },
  };
}

// ─── Product selection ────────────────────────────────────────────────────────

/**
 * Picks the best-matching product from the catalog for a given
 * role, target trouble, base type, and timing slot.
 *
 * Selection priority:
 *   1. Exact targetTrouble + compatible baseType + timing
 *   2. Universal targetTrouble + compatible baseType + timing
 *   3. Exact targetTrouble (ignoring baseType) + timing
 *   4. Hero product (serum role only)
 *   5. null (UI gracefully omits the step)
 */
function pickProduct(
  role: StepRole,
  trouble: TargetTrouble,
  base: BaseType,
  timing: "am" | "pm"
): MockProduct | null {
  const pool = CATALOG.filter(
    (p) =>
      p.role === role &&
      p.phaseTiming.includes(timing)
  );

  // 1. Exact match with base-type filter
  const exact = pool.find(
    (p) =>
      p.targetTrouble === trouble &&
      (p.baseTypes.length === 0 || p.baseTypes.includes(base))
  );
  if (exact) return exact;

  // 2. Universal with base-type filter
  const universal = pool.find(
    (p) =>
      p.targetTrouble === "universal" &&
      (p.baseTypes.length === 0 || p.baseTypes.includes(base))
  );
  if (universal) return universal;

  // 3. Exact match ignoring base-type (broadest acceptable fallback)
  const anyBase = pool.find((p) => p.targetTrouble === trouble);
  if (anyBase) return anyBase;

  // 4. Hero product for serum only
  if (role === "serum") return HERO_PRODUCT;

  // 5. Gracefully omit
  return null;
}

// ─── Routine builder ──────────────────────────────────────────────────────────

function makeStep(
  role: StepRole,
  trouble: TargetTrouble,
  base: BaseType,
  timing: "am" | "pm",
  order: number
): RoutineStep {
  return { role, product: pickProduct(role, trouble, base, timing), timing, order };
}

function buildRoutineLevel(
  label: "3-step" | "5-step",
  base: BaseType,
  trouble: TargetTrouble
): RoutineLevel {
  const pick = (role: StepRole, timing: "am" | "pm", order: number): RoutineStep =>
    makeStep(role, trouble, base, timing, order);

  if (label === "3-step") {
    return {
      label,
      // AM: Cleanser → Serum → Moisturizer → SPF
      am: [
        pick("cleanser",    "am", 1),
        pick("serum",       "am", 2),
        pick("moisturizer", "am", 3),
        pick("spf",         "am", 4),
      ],
      // PM: Cleanser → Serum → Moisturizer
      pm: [
        pick("cleanser",    "pm", 1),
        pick("serum",       "pm", 2),
        pick("moisturizer", "pm", 3),
      ],
    };
  }

  // 5-step
  return {
    label,
    // AM: Cleanser → Toner → Serum → Treatment → Moisturizer → SPF
    am: [
      pick("cleanser",    "am", 1),
      pick("toner",       "am", 2),
      pick("serum",       "am", 3),
      pick("treatment",   "am", 4),
      pick("moisturizer", "am", 5),
      pick("spf",         "am", 6),
    ],
    // PM: Cleanser → Toner → Serum → Treatment → Moisturizer
    pm: [
      pick("cleanser",    "pm", 1),
      pick("toner",       "pm", 2),
      pick("serum",       "pm", 3),
      pick("treatment",   "pm", 4),
      pick("moisturizer", "pm", 5),
    ],
  };
}

/**
 * Advanced tier: AM is identical to the committed 5-step routine.
 * PM = 5-step committed PM + Step 6: Professional Device Care (Medicube Booster Pro).
 */
function buildAdvancedLevel(base: BaseType, trouble: TargetTrouble): RoutineLevel {
  const committed = buildRoutineLevel("5-step", base, trouble);
  const deviceProduct = CATALOG.find((p) => p.id === "medicube-booster-pro") ?? null;

  const deviceStep: RoutineStep = {
    role: "device",
    product: deviceProduct,
    timing: "pm",
    order: committed.pm.length + 1,
  };

  return {
    label: "advanced",
    am: committed.am,
    pm: [...committed.pm, deviceStep],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * buildRoutine
 *
 * Pure function — takes SkinVector + ImplicitFlags + AxisResponses and returns
 * a RoutineOutput with:
 *   - skinRescue: SkinRescueProtocol | null  (B-3 hard override — checked FIRST)
 *   - minimalist (3-step), committed (5-step), advanced (device) routines
 *   - advancedCaution when the Clinical Safety Gate blocks the advanced tier
 *
 * Evaluation order (STRICT):
 *   1. B-3 Skin Rescue — if active, skinRescue is non-null. Frontend MUST
 *      display the SOS UI and suppress the standard protocol display.
 *      Device is always locked out when rescue is active (atopyFlag → safetyBlocked).
 *   2. Clinical Safety Gate — barrier > 85 OR atopyFlag → advanced = null.
 *   3. Normal 3-tier routine assembly.
 *
 * All product slots use graceful fallback (hero product or null).
 * The frontend (Module C) should treat null steps as omitted.
 */
export function buildRoutine(
  vector: SkinVector,
  implicitFlags: ImplicitFlags,
  axisResponses: AxisResponses
): RoutineOutput {
  const baseType      = deriveBaseType(vector.sebum, vector.hydration);
  const targetTrouble = deriveTargetTrouble(vector);

  // ── B-3: Skin Rescue Hard Override (FIRST — no exceptions) ───────────────
  const rescueCheck = isSkinRescueRequired(axisResponses, implicitFlags, vector);
  const skinRescue  = rescueCheck.required
    ? buildSkinRescueProtocol(baseType, rescueCheck.trigger!)
    : null;

  // ── Clinical Safety Gate (Advanced tier) ──────────────────────────────────
  // EMS / Microcurrent / Electroporation are contraindicated when barrier is
  // severely compromised (score > 85) or atopyFlag is active.
  const safetyBlocked = vector.barrier > 85 || implicitFlags.atopyFlag;

  const advancedCaution: RoutineOutput["advancedCaution"] = safetyBlocked
    ? {
        en: "Advanced device therapy is currently paused. Your barrier score indicates skin that is not yet ready for EMS / Microcurrent stimulation. Focus on the 5-step repair protocol for 4–6 weeks before re-assessing.",
        de: "Die fortgeschrittene Gerätetherapie ist derzeit pausiert. Ihr Barriere-Score zeigt, dass Ihre Haut noch nicht für EMS / Mikrostrom-Stimulation bereit ist. Konzentrieren Sie sich 4–6 Wochen auf das 5-Schritt-Reparaturprotokoll.",
        ko: "현재 고급 기기 테라피가 일시 중단되었습니다. 배리어 점수가 EMS / 마이크로커런트 자극을 받기에 아직 적합하지 않은 상태입니다. 4–6주 동안 5단계 회복 루틴에 집중한 후 재평가하세요.",
      }
    : null;

  return {
    baseType,
    targetTrouble,
    advancedCaution,
    skinRescue,
    routines: {
      minimalist: buildRoutineLevel("3-step", baseType, targetTrouble),
      committed:  buildRoutineLevel("5-step", baseType, targetTrouble),
      advanced:   safetyBlocked ? null : buildAdvancedLevel(baseType, targetTrouble),
    },
  };
}
