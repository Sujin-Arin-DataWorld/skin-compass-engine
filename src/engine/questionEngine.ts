/**
 * QuestionEngine — Dynamic weighted-tagging question selector.
 *
 * Instead of fixed CORE_SYMPTOMS per category, this engine:
 * 1. Tags each question based on its axis weights
 * 2. Scores candidates against the user's accumulated tag profile
 * 3. Returns the top N highest-scoring questions
 */

import { SYMPTOMS } from "./weights";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A question enriched with tags and base priority for dynamic selection. */
export interface TaggedQuestion {
    id: string;
    text: string;
    category: number;
    tags: string[];
    priority: number;
    weights: Record<string, number>;
}

/** Accumulated from face maps, photo matches, severity answers, etc. */
export type UserTagProfile = Record<string, number>;

// ---------------------------------------------------------------------------
// Tag mapping — axis keys → human-readable tags
// ---------------------------------------------------------------------------

const AXIS_TO_TAG: Record<string, string> = {
    seb: "oily",
    hyd: "dry",
    bar: "barrier",
    sen: "sensitivity",
    acne: "acne",
    pigment: "pigment",
    texture: "texture",
    aging: "aging",
    ox: "oxidative",
    makeup_stability: "makeup",
};

/**
 * Expanded tag generation — maps axis weights to granular tags
 * from the 22-tag taxonomy. A single question can generate
 * multiple tags based on which axes it touches.
 */
const GRANULAR_TAGS: Record<string, { minWeight: number; tag: string }[]> = {
    seb: [
        { minWeight: 0.7, tag: "sebum_overproduction" },
        { minWeight: 0.3, tag: "oily" },
    ],
    hyd: [
        { minWeight: 0.7, tag: "dehydration" },
        { minWeight: 0.5, tag: "tewl" },
        { minWeight: 0.3, tag: "dry" },
    ],
    bar: [
        { minWeight: 0.9, tag: "barrier_emergency" },
        { minWeight: 0.7, tag: "barrier_damage" },
        { minWeight: 0.4, tag: "barrier" },
    ],
    sen: [
        { minWeight: 0.7, tag: "neurogenic_inflammation" },
        { minWeight: 0.6, tag: "active_reaction" },
        { minWeight: 0.5, tag: "vascular_reactivity" },
        { minWeight: 0.3, tag: "sensitivity" },
    ],
    acne: [
        { minWeight: 0.7, tag: "breakout_frequency" },
        { minWeight: 0.3, tag: "acne" },
    ],
    pigment: [
        { minWeight: 0.7, tag: "melanin_overproduction" },
        { minWeight: 0.3, tag: "pigment" },
    ],
    texture: [
        { minWeight: 0.7, tag: "keratinization" },
        { minWeight: 0.5, tag: "follicular_dilation" },
        { minWeight: 0.3, tag: "texture" },
    ],
    aging: [
        { minWeight: 0.8, tag: "collagen_loss" },
        { minWeight: 0.6, tag: "elastin_degradation" },
        { minWeight: 0.3, tag: "aging" },
    ],
    ox: [
        { minWeight: 0.6, tag: "photodamage" },
        { minWeight: 0.3, tag: "oxidative" },
    ],
    makeup_stability: [
        { minWeight: 0.3, tag: "makeup" },
    ],
};

/** Convert a symptom's axis weights to an array of tag strings using the expanded taxonomy. */
function buildTagsFromWeights(weights: Record<string, number>): string[] {
    const tags = new Set<string>();
    for (const [axis, weight] of Object.entries(weights)) {
        // Basic tag via AXIS_TO_TAG
        if (weight >= 0.3 && AXIS_TO_TAG[axis]) {
            tags.add(AXIS_TO_TAG[axis]);
        }
        // Granular tags
        const granularRules = GRANULAR_TAGS[axis];
        if (granularRules) {
            for (const rule of granularRules) {
                if (weight >= rule.minWeight) {
                    tags.add(rule.tag);
                }
            }
        }
    }

    // Cross-axis combinatory tags
    if ((weights.seb ?? 0) >= 0.5 && (weights.hyd ?? 0) >= 0.4) tags.add("dehydrated_oily");
    if ((weights.sen ?? 0) >= 0.5 && (weights.acne ?? 0) >= 0.3) tags.add("inflammaging");
    if ((weights.aging ?? 0) >= 0.5 && (weights.ox ?? 0) >= 0.3) tags.add("glycation");
    if ((weights.pigment ?? 0) >= 0.5 && (weights.acne ?? 0) >= 0.2) { tags.add("pih"); tags.add("post_inflammatory_marks"); }
    if ((weights.aging ?? 0) >= 0.7 && (weights.texture ?? 0) >= 0.3) tags.add("gravity_sag");
    if ((weights.aging ?? 0) >= 0.5 && (weights.hyd ?? 0) >= 0.4) tags.add("dry_wrinkles");

    return Array.from(tags);
}

// ---------------------------------------------------------------------------
// Base priorities — broadly diagnostic questions get higher fallback rank
// ---------------------------------------------------------------------------

/**
 * Priority 8-10: broad, clinically essential questions (appear as defaults).
 * Priority 5-7: moderately specific.
 * Priority 1-4: highly specific, only surface when matching tags are strong.
 */
const FALLBACK_PRIORITIES: Record<string, number> = {
    // Category 1
    C1_01: 9, C1_02: 7, C1_03: 6, C1_04: 4, C1_05: 5,
    C1_06: 5, C1_07: 8, C1_08: 8, C1_09: 6, C1_10: 7,
    C1_11: 4, C1_12: 5, C1_13: 6, C1_14: 4, C1_15: 5,
    // Category 2
    C2_01: 9, C2_02: 8, C2_03: 7, C2_04: 7, C2_05: 5,
    C2_06: 4, C2_07: 8, C2_08: 5, C2_09: 6, C2_10: 5,
    C2_11: 4, C2_12: 4, C2_13: 5, C2_14: 6, C2_15: 4,
    // Category 3
    C3_01: 9, C3_02: 8, C3_03: 7, C3_04: 5, C3_05: 7,
    C3_06: 6, C3_07: 5, C3_08: 4, C3_09: 6, C3_10: 5,
    C3_11: 6, C3_12: 5, C3_13: 7, C3_14: 8, C3_15: 4,
    // Category 4
    C4_01: 9, C4_02: 7, C4_03: 8, C4_04: 6, C4_05: 5,
    C4_06: 5, C4_07: 7, C4_08: 5, C4_09: 6, C4_10: 5,
    C4_11: 6, C4_12: 6, C4_13: 5, C4_14: 8, C4_15: 7,
    // Category 5
    C5_01: 8, C5_02: 7, C5_03: 8, C5_04: 9, C5_05: 7,
    C5_06: 6, C5_07: 5, C5_08: 5, C5_09: 6, C5_10: 5,
    C5_11: 5, C5_12: 5, C5_13: 7, C5_14: 6, C5_15: 4,
    // Category 6
    C6_01: 9, C6_02: 7, C6_03: 6, C6_04: 7, C6_05: 5,
    C6_06: 8, C6_07: 7, C6_08: 5, C6_09: 6, C6_10: 5,
    C6_11: 5, C6_12: 6, C6_13: 4, C6_14: 5, C6_15: 7,
    // Category 7
    C7_01: 8, C7_02: 7, C7_03: 8, C7_04: 5, C7_05: 7,
    C7_06: 9, C7_07: 7, C7_08: 6, C7_09: 5, C7_10: 5,
    C7_11: 8, C7_12: 6, C7_13: 7, C7_14: 5, C7_15: 6, C7_16: 6,
    // Category 8
    C8_01: 9, C8_02: 8, C8_03: 9, C8_04: 7, C8_05: 7,
    C8_06: 6, C8_07: 5, C8_08: 8, C8_09: 7, C8_10: 6,
    C8_11: 5, C8_12: 6, C8_13: 4, C8_14: 5, C8_15: 8,
};

// ---------------------------------------------------------------------------
// Build tagged questions from SYMPTOMS
// ---------------------------------------------------------------------------

export const TAGGED_QUESTIONS: TaggedQuestion[] = Object.values(SYMPTOMS).map(
    (sym) => ({
        id: sym.id,
        text: sym.text_en,
        category: sym.category,
        tags: buildTagsFromWeights(sym.weights),
        priority: FALLBACK_PRIORITIES[sym.id] ?? 5,
        weights: sym.weights,
    })
);

// ---------------------------------------------------------------------------
// Global Deterministic Boost Rules (Master Reasoning Map)
// ---------------------------------------------------------------------------

/**
 * GLOBAL_BOOST_RULES — the deterministic master map.
 * When a source tag exceeds the threshold in the user profile,
 * all questions in the target category matching the boost tag
 * receive a flat score bonus on top of the organic tag score.
 *
 * This guarantees high-impact personalization: users with strong
 * signals in early categories see the most critical related
 * questions in later categories.
 */
interface BoostRule {
    /** Human-readable name for debugging */
    name: string;
    /** Source tag that must exceed threshold */
    sourceTag: string;
    /** Minimum accumulated score in sourceTag to trigger */
    threshold: number;
    /** Target category to boost (1-8) */
    targetCategory: number;
    /** Only boost questions in target category that have this tag */
    targetTag: string;
    /** Flat bonus added to matching questions */
    bonus: number;
}

export const GLOBAL_BOOST_RULES: BoostRule[] = [
    // ══════════════════════════════════════════════════════
    // SEBUM CASCADE: C1/C2 → C2/C6
    // ══════════════════════════════════════════════════════
    {
        name: "Sebum → Pore Congestion",
        sourceTag: "sebum_overproduction",
        threshold: 3,
        targetCategory: 6,
        targetTag: "follicular_dilation",
        bonus: 4,
    },
    {
        name: "Sebum → Oxidized Pores",
        sourceTag: "oily",
        threshold: 4,
        targetCategory: 6,
        targetTag: "keratinization",
        bonus: 3,
    },
    {
        name: "Sebum → Makeup Instability",
        sourceTag: "sebum_overproduction",
        threshold: 3,
        targetCategory: 2,
        targetTag: "makeup",
        bonus: 3,
    },

    // ══════════════════════════════════════════════════════
    // BARRIER THREAD: C3/C4 → C8
    // ══════════════════════════════════════════════════════
    {
        name: "Dehydration → Barrier Collapse",
        sourceTag: "dehydration",
        threshold: 3,
        targetCategory: 8,
        targetTag: "barrier_damage",
        bonus: 4,
    },
    {
        name: "Sensitivity → Barrier Recovery",
        sourceTag: "neurogenic_inflammation",
        threshold: 3,
        targetCategory: 8,
        targetTag: "barrier",
        bonus: 3,
    },
    {
        name: "TEWL → Barrier Damage",
        sourceTag: "tewl",
        threshold: 3,
        targetCategory: 8,
        targetTag: "barrier_damage",
        bonus: 3,
    },
    {
        name: "Active Reaction → Barrier Emergency",
        sourceTag: "active_reaction",
        threshold: 2,
        targetCategory: 8,
        targetTag: "barrier_emergency",
        bonus: 5,
    },

    // ══════════════════════════════════════════════════════
    // CHRONO-AGING THREAD: C3/C5 → C7
    // ══════════════════════════════════════════════════════
    {
        name: "Photodamage → Collagen Loss",
        sourceTag: "photodamage",
        threshold: 3,
        targetCategory: 7,
        targetTag: "collagen_loss",
        bonus: 4,
    },
    {
        name: "Oxidative → Aging Acceleration",
        sourceTag: "glycation",
        threshold: 2,
        targetCategory: 7,
        targetTag: "elastin_degradation",
        bonus: 3,
    },
    {
        name: "Dryness → Fine Lines",
        sourceTag: "dehydration",
        threshold: 3,
        targetCategory: 7,
        targetTag: "dry_wrinkles",
        bonus: 4,
    },

    // ══════════════════════════════════════════════════════
    // INFLAMMATION LOOP: C1 ↔ C4 ↔ C5 ↔ C8
    // ══════════════════════════════════════════════════════
    {
        name: "Acne Inflammation → Sensitivity",
        sourceTag: "inflammaging",
        threshold: 2,
        targetCategory: 4,
        targetTag: "vascular_reactivity",
        bonus: 3,
    },
    {
        name: "Sensitivity → PIH Pigmentation",
        sourceTag: "vascular_reactivity",
        threshold: 3,
        targetCategory: 5,
        targetTag: "pih",
        bonus: 3,
    },
    {
        name: "Breakout Frequency → Post-Inflammatory Marks",
        sourceTag: "breakout_frequency",
        threshold: 3,
        targetCategory: 5,
        targetTag: "post_inflammatory_marks",
        bonus: 4,
    },
];

// ---------------------------------------------------------------------------
// Deterministic boost computation (extracted for clarity & testability)
// ---------------------------------------------------------------------------

/**
 * Compute the deterministic boost bonus for a single question
 * based on active global boost rules.
 *
 * @param question  - The candidate question
 * @param activeRules - Pre-filtered rules where sourceTag >= threshold
 * @returns Total boost score to add
 */
export function applyDeterministicBoosts(
    question: TaggedQuestion,
    activeRules: BoostRule[]
): number {
    let boost = 0;
    for (const rule of activeRules) {
        if (
            question.category === rule.targetCategory &&
            question.tags.includes(rule.targetTag)
        ) {
            boost += rule.bonus;
        }
    }
    return boost;
}

// ---------------------------------------------------------------------------
// Selection algorithm
// ---------------------------------------------------------------------------

/**
 * Score each candidate question against the user's tag profile,
 * PLUS apply deterministic global boost rules.
 *
 * TotalScore = basePriority + Σ(userTags[tag]) + deterministicBoost
 *
 * Returns top `count` questions, sorted by descending total score.
 * When scores tie, preserves original order (more clinically important first).
 */
export function selectTopQuestions(
    candidates: TaggedQuestion[],
    userTags: UserTagProfile,
    count: number = 3
): TaggedQuestion[] {
    // Pre-compute which boost rules are active based on current tag profile
    const activeRules = GLOBAL_BOOST_RULES.filter(
        (r) => (userTags[r.sourceTag] ?? 0) >= r.threshold
    );

    const scored = candidates.map((q, idx) => {
        // Organic tag score (implicit flow)
        const tagScore = q.tags.reduce(
            (sum, tag) => sum + (userTags[tag] ?? 0),
            0
        );

        // Deterministic boost (explicit rules)
        const boostScore = applyDeterministicBoosts(q, activeRules);

        return {
            question: q,
            totalScore: q.priority + tagScore + boostScore,
            originalIdx: idx,
        };
    });

    scored.sort((a, b) =>
        b.totalScore !== a.totalScore
            ? b.totalScore - a.totalScore
            : a.originalIdx - b.originalIdx
    );

    return scored.slice(0, count).map((s) => s.question);
}

// ---------------------------------------------------------------------------
// Tag accumulation helpers
// ---------------------------------------------------------------------------

/** Convert severity × question weights into tag deltas. */
export function computeTagDelta(
    symptomId: string,
    severity: number
): UserTagProfile {
    const sym = SYMPTOMS[symptomId];
    if (!sym || severity === 0) return {};

    const delta: UserTagProfile = {};
    for (const [axis, weight] of Object.entries(sym.weights)) {
        const tag = AXIS_TO_TAG[axis] ?? axis;
        if (weight >= 0.3) {
            delta[tag] = Math.round(severity * weight * 10) / 10; // e.g. sev=2, w=0.9 → 1.8
        }
    }
    return delta;
}

/** Merge tag deltas into existing profile (additive). */
export function mergeTags(
    current: UserTagProfile,
    delta: UserTagProfile
): UserTagProfile {
    const result = { ...current };
    for (const [tag, value] of Object.entries(delta)) {
        result[tag] = (result[tag] ?? 0) + value;
    }
    return result;
}
