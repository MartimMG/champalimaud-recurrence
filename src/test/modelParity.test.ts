import { describe, expect, it } from "vitest";

import {
  DEFAULT_INPUT,
  FEATURES,
  REPORT_DAYS,
  THRESHOLD_AVERAGE,
  THRESHOLD_HIGH,
  THRESHOLD_LOW,
  computeRisk,
  getRiskCategory,
  type PatientInput,
} from "@/lib/coxModel";
import fixture from "./modelParity.fixture.json";

// Ground truth generated from coxnet_model_bundle.pkl itself (the X_ref hold-out rows,
// scored with the pickled Coxnet + Breslow baseline). This is what catches a generator
// that silently drops a predictor: the app would still compute a number, just the wrong
// one, and nothing else in the codebase would notice.
describe("computeRisk matches the pickled model", () => {
  it("uses the same report days as the fixture", () => {
    expect([...REPORT_DAYS]).toEqual(fixture.reportDays);
  });

  it.each(fixture.cases.map((c, i) => [i, c] as const))(
    "case %i reproduces the bundle's risk at every horizon",
    (_i, testCase) => {
      const { yearlyRisk } = computeRisk(testCase.input as unknown as PatientInput);
      const actual = yearlyRisk.map((y) => y.risk);
      expect(actual).toHaveLength(testCase.risks.length);
      actual.forEach((risk, k) => {
        expect(risk).toBeCloseTo(testCase.risks[k], 12);
      });
    }
  );

  it.each(fixture.cases.map((c, i) => [i, c] as const))(
    "case %i lands in the bundle's zone at every horizon",
    (_i, testCase) => {
      const { yearlyRisk } = computeRisk(testCase.input as unknown as PatientInput);
      expect(yearlyRisk.map((y) => y.category)).toEqual(testCase.zones);
    }
  );

  it("exercises all four zones, so the zone assertions above are not vacuous", () => {
    const zones = new Set(fixture.cases.map((c) => c.zones[c.zones.length - 1]));
    expect([...zones].sort()).toEqual(["average", "high", "intermediate", "low"]);
  });
});

describe("every live coefficient reaches the score", () => {
  // The failure this guards against is a feature present in FEATURES but unreachable from
  // any PatientInput key, which would contribute a constant 0 forever.
  it.each(FEATURES.filter((f) => f.coef !== 0).map((f) => [f.name, f] as const))(
    "%s moves the linear predictor",
    (_name, spec) => {
      const base = computeRisk(DEFAULT_INPUT).linearPredictor;
      const key = spec.inputKey as keyof PatientInput;
      const flipped: PatientInput = { ...DEFAULT_INPUT };
      // A grouped feature is switched on by selecting its option; a plain binary by 0/1.
      (flipped[key] as unknown) =
        spec.oheSuffix === undefined
          ? Number(DEFAULT_INPUT[key]) === 1
            ? 0
            : 1
          : spec.oheSuffix.replace(/\.0$/, "");

      expect(computeRisk(flipped).linearPredictor).not.toBeCloseTo(base, 10);
    }
  );
});

describe("zone boundaries follow the bundle rule", () => {
  const idx = 365; // BASELINE_TIMES[365] === 1825
  const low = THRESHOLD_LOW[idx];
  const intermediate = THRESHOLD_AVERAGE[idx];
  const high = THRESHOLD_HIGH[idx];

  it("carries the bundle's thresholds without precision loss", () => {
    expect(low).toBe(fixture.thresholdsAt1825.low);
    expect(intermediate).toBe(fixture.thresholdsAt1825.intermediate);
    expect(high).toBe(fixture.thresholdsAt1825.high);
  });

  it("is strict at every boundary", () => {
    // Exactly on a boundary belongs to the zone above it, not below.
    expect(getRiskCategory(low, idx)).toBe("intermediate");
    expect(getRiskCategory(intermediate, idx)).toBe("average");
    expect(getRiskCategory(high, idx)).toBe("high");
  });

  it("puts risk just under each boundary in the lower zone", () => {
    expect(getRiskCategory(low * 0.999999, idx)).toBe("low");
    expect(getRiskCategory(intermediate * 0.999999, idx)).toBe("intermediate");
    expect(getRiskCategory(high * 0.999999, idx)).toBe("average");
  });

  it("resolves the all-zero tie before the first event day to the lowest zone", () => {
    const early = 10; // BASELINE_TIMES[10] === 50, before the first observed event at day 75
    expect(getRiskCategory(0, early)).toBe("low");
  });
});

describe("the form's opening state", () => {
  // The reference patient (every binary 0) scores 4.0% at five years under this bundle,
  // which is above the high cutoff -- so the default deliberately sets ER positive rather
  // than opening the calculator on a red patient. Guard that it stays that way.
  it("does not open in the high zone", () => {
    const { yearlyRisk } = computeRisk(DEFAULT_INPUT);
    expect(yearlyRisk.map((y) => y.category)).not.toContain("high");
  });

  it("has a default for every field the form can render", () => {
    const keys = new Set(Object.keys(DEFAULT_INPUT));
    for (const spec of FEATURES) expect(keys).toContain(spec.inputKey);
  });
});
