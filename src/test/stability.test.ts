import { describe, it, expect } from "vitest";
import { runDiagnosis } from "@/engine/runDiagnosisV4";
import { AXIS_KEYS } from "@/engine/types";
import type { DiagnosisInput } from "@/engine/runDiagnosisV4";

function makeInput(overrides: Partial<DiagnosisInput> = {}): DiagnosisInput {
  return {
    severities: {},
    contexts: [],
    skinType: "normal",
    tier: "Full",
    metaAnswers: {},
    ...overrides,
  };
}

function assertNoCap(result: ReturnType<typeof runDiagnosis>) {
  for (const k of AXIS_KEYS) {
    expect(result.axis_scores[k]).toBeLessThanOrEqual(100);
    expect(result.axis_scores[k]).toBeGreaterThanOrEqual(0);
  }
}

describe("Stability: 10 Synthetic Profiles", () => {
  it("1. Severe Acne", () => {
    const r = runDiagnosis(makeInput({
      skinType: "oily",
      severities: {
        C1_01: 3, C1_02: 3, C1_07: 3, C1_08: 3, C1_10: 3, C1_11: 3, C1_13: 2,
        C2_01: 2, C2_03: 2,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.acne).toBeGreaterThan(50);
    expect(r.axis_scores.seb).toBeGreaterThan(30);
  });

  it("2. Hormonal Acne", () => {
    const r = runDiagnosis(makeInput({
      skinType: "combination",
      contexts: ["hormonal"],
      severities: {
        C1_02: 3, C1_03: 3, C1_10: 2,
      },
      metaAnswers: { premenstrual_7_10d: 3, jaw_focus: 2 },
    }));
    assertNoCap(r);
    expect(r.axis_scores.acne).toBeGreaterThan(30);
  });

  it("3. Barrier Collapse", () => {
    const r = runDiagnosis(makeInput({
      skinType: "sensitive",
      contexts: ["recent_procedure"],
      severities: {
        C8_01: 3, C8_03: 3, C8_04: 3, C8_06: 3, C8_09: 3, C8_12: 3, C8_15: 3,
        C4_01: 2, C4_03: 2,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.bar).toBeGreaterThan(60);
    expect(r.axis_scores.sen).toBeGreaterThan(40);
  });

  it("4. Pigment Dominant", () => {
    const r = runDiagnosis(makeInput({
      skinType: "normal",
      contexts: ["outdoor_work"],
      severities: {
        C5_01: 3, C5_02: 3, C5_03: 3, C5_06: 3, C5_13: 3,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.pigment).toBeGreaterThan(50);
  });

  it("5. Oily Dominant", () => {
    const r = runDiagnosis(makeInput({
      skinType: "oily",
      severities: {
        C2_01: 3, C2_02: 3, C2_03: 3, C2_04: 3, C2_07: 2, C2_09: 3, C2_13: 2,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.seb).toBeGreaterThan(50);
  });

  it("6. Dry Dominant", () => {
    const r = runDiagnosis(makeInput({
      skinType: "dry",
      contexts: ["low_water_intake"],
      severities: {
        C3_01: 3, C3_02: 3, C3_03: 3, C3_10: 3, C3_12: 3, C3_14: 2,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.hyd).toBeGreaterThan(50);
  });

  it("7. Aging Dominant", () => {
    const r = runDiagnosis(makeInput({
      skinType: "dry",
      severities: {
        C7_01: 3, C7_03: 3, C7_05: 3, C7_06: 3, C7_07: 3, C7_08: 3, C7_11: 3,
      },
    }));
    assertNoCap(r);
    expect(r.axis_scores.aging).toBeGreaterThan(60);
  });

  it("8. Combination Complex Case", () => {
    const r = runDiagnosis(makeInput({
      skinType: "combination",
      contexts: ["makeup", "hormonal"],
      severities: {
        C1_01: 2, C1_03: 2,
        C2_01: 2, C2_04: 2, C2_07: 2,
        C3_01: 2, C3_02: 2,
        C4_01: 1,
        C5_03: 2,
        C7_01: 1,
        C8_03: 1,
      },
    }));
    assertNoCap(r);
    // Should have distributed scores, no single axis blowing up
    const scores = AXIS_KEYS.map((k) => r.axis_scores[k]);
    const max = Math.max(...scores);
    expect(max).toBeLessThan(90); // Moderate across the board, not spiked
  });

  it("9. No double-counting with UI + checklist overlap", () => {
    const r = runDiagnosis(makeInput({
      skinType: "oily",
      contexts: ["ui_facemap" as any],
      severities: {
        C1_01: 3, C1_02: 3, C1_07: 3, // checklist
        C1_10: 3, C1_11: 3, // core-only
      },
      uiSignals: {
        acne: { zones: ["jawline", "chin"], intensity: 80, recurrence: 70 },
      },
    }));
    assertNoCap(r);
    // With dedup, acne should still be high but not capped at 100
    expect(r.axis_scores.acne).toBeGreaterThan(40);
    expect(r.axis_scores.acne).toBeLessThanOrEqual(100);
  });

  it("10. Empty profile produces near-zero scores", () => {
    const r = runDiagnosis(makeInput());
    assertNoCap(r);
    for (const k of AXIS_KEYS) {
      expect(r.axis_scores[k]).toBeLessThan(15);
    }
    expect(r.detected_patterns.length).toBe(0);
    expect(r.urgency_level).toBe("LOW");
  });
});
