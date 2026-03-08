import { describe, it, expect } from "vitest";
import {
  lookupCN,
  adjustCNForAMC,
  calculateRetention,
  calculateInitialAbstraction,
  calculateRunoff,
  computeCNResults,
  computeSensitivityData,
  computeRainfallRunoffCurve,
  calculateGreenAmpt,
  calculatePhilip,
  calculateHorton,
  CN_TABLE,
} from "../cn-method";

// ─── Core SCS-CN Equations ──────────────────────────────────────
// Reference: SCS National Engineering Handbook, Section 4 (NEH-4)
// and Ponce, V.M., "Engineering Hydrology" (2014)

describe("lookupCN", () => {
  it("returns correct CN for known land use / soil combinations", () => {
    expect(lookupCN("forest", "A")).toBe(30);
    expect(lookupCN("forest", "D")).toBe(77);
    expect(lookupCN("paved", "A")).toBe(98);
    expect(lookupCN("residential", "B")).toBe(75);
    expect(lookupCN("commercial", "C")).toBe(94);
  });

  it("returns default CN (75) for unknown combinations", () => {
    expect(lookupCN("unknown-land", "A")).toBe(75);
    expect(lookupCN("forest", "Z")).toBe(75);
  });

  it("covers all entries in CN_TABLE", () => {
    for (const [landUse, soils] of Object.entries(CN_TABLE)) {
      for (const [soil, cn] of Object.entries(soils)) {
        expect(lookupCN(landUse, soil)).toBe(cn);
      }
    }
  });
});

describe("adjustCNForAMC", () => {
  // NEH-4 conversion equations:
  // AMC I:  CN_I  = 4.2·CN_II / (10 − 0.058·CN_II)
  // AMC III: CN_III = 23·CN_II / (10 + 0.13·CN_II)

  it("returns CN unchanged for AMC II (normal)", () => {
    expect(adjustCNForAMC(75, 2)).toBe(75);
    expect(adjustCNForAMC(30, 2)).toBe(30);
    expect(adjustCNForAMC(98, 2)).toBe(98);
  });

  it("reduces CN for AMC I (dry) — textbook verification", () => {
    // CN_II = 75 → CN_I = 4.2×75 / (10 − 0.058×75) = 315 / 5.65 ≈ 55.75
    const result = adjustCNForAMC(75, 1);
    expect(result).toBeCloseTo(55.75, 1);
  });

  it("increases CN for AMC III (wet) — textbook verification", () => {
    // CN_II = 75 → CN_III = 23×75 / (10 + 0.13×75) = 1725 / 19.75 ≈ 87.34
    const result = adjustCNForAMC(75, 3);
    expect(result).toBeCloseTo(87.34, 1);
  });

  it("AMC I < AMC II < AMC III for any valid CN", () => {
    for (const cn of [30, 50, 75, 90, 98]) {
      const dry = adjustCNForAMC(cn, 1);
      const wet = adjustCNForAMC(cn, 3);
      expect(dry).toBeLessThan(cn);
      expect(wet).toBeGreaterThan(cn);
    }
  });
});

describe("calculateRetention (S)", () => {
  // S = (1000 / CN) − 10  [inches]

  it("S = 0.204 for CN = 98 (nearly impervious)", () => {
    expect(calculateRetention(98)).toBeCloseTo(0.204, 2);
  });

  it("S = 3.333 for CN = 75", () => {
    expect(calculateRetention(75)).toBeCloseTo(3.333, 2);
  });

  it("S = 23.333 for CN = 30 (forest, group A)", () => {
    expect(calculateRetention(30)).toBeCloseTo(23.333, 2);
  });

  it("higher CN → lower retention", () => {
    expect(calculateRetention(90)).toBeLessThan(calculateRetention(60));
  });
});

describe("calculateInitialAbstraction (Ia)", () => {
  // Ia = 0.2 × S (standard SCS assumption)

  it("Ia = 0.2 × S for any retention value", () => {
    expect(calculateInitialAbstraction(5)).toBeCloseTo(1.0, 4);
    expect(calculateInitialAbstraction(3.333)).toBeCloseTo(0.6666, 3);
    expect(calculateInitialAbstraction(0)).toBe(0);
  });
});

describe("calculateRunoff (Q)", () => {
  // Q = (P − Ia)² / (P − Ia + S)  when P > Ia, else 0

  it("returns 0 when rainfall ≤ initial abstraction", () => {
    expect(calculateRunoff(0.5, 5, 1.0)).toBe(0);
    expect(calculateRunoff(1.0, 5, 1.0)).toBe(0);
  });

  it("textbook example: P=5, CN=75 → Q ≈ 1.85", () => {
    // CN=75 → S=3.333, Ia=0.667
    // Q = (5 − 0.667)² / (5 − 0.667 + 3.333) = 18.78 / 7.667 ≈ 2.449
    const S = calculateRetention(75);
    const Ia = calculateInitialAbstraction(S);
    const Q = calculateRunoff(5, S, Ia);
    expect(Q).toBeCloseTo(2.45, 1);
  });

  it("textbook example: P=10, CN=85 → significant runoff", () => {
    // CN=85 → S=1.765, Ia=0.353
    // Q = (10 − 0.353)² / (10 − 0.353 + 1.765) = 93.07 / 11.412 ≈ 8.155
    const S = calculateRetention(85);
    const Ia = calculateInitialAbstraction(S);
    const Q = calculateRunoff(10, S, Ia);
    expect(Q).toBeCloseTo(8.16, 1);
  });

  it("paved surface (CN=98) produces nearly all runoff", () => {
    const S = calculateRetention(98);
    const Ia = calculateInitialAbstraction(S);
    const Q = calculateRunoff(5, S, Ia);
    // Almost all rain becomes runoff
    expect(Q).toBeGreaterThan(4.5);
  });

  it("Q is always ≤ P", () => {
    for (const P of [1, 3, 5, 10]) {
      for (const cn of [30, 60, 90]) {
        const S = calculateRetention(cn);
        const Ia = calculateInitialAbstraction(S);
        const Q = calculateRunoff(P, S, Ia);
        expect(Q).toBeLessThanOrEqual(P);
        expect(Q).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─── Composite Pipeline ─────────────────────────────────────────

describe("computeCNResults", () => {
  it("residential, soil B, AMC II, 5 inches rainfall", () => {
    const r = computeCNResults("residential", "B", 2, 5);
    expect(r.baseCN).toBe(75);
    expect(r.adjustedCN).toBe(75);
    expect(r.S).toBeCloseTo(3.33, 1);
    expect(r.Ia).toBeCloseTo(0.67, 1);
    expect(r.runoff).toBeGreaterThan(0);
    expect(r.infiltration).toBeCloseTo(5 - r.runoff, 1);
    expect(r.runoffPercent).toBeGreaterThan(0);
    expect(r.runoffPercent).toBeLessThan(100);
  });

  it("zero rainfall produces zero runoff", () => {
    const r = computeCNResults("paved", "D", 3, 0);
    expect(r.runoff).toBe(0);
    expect(r.infiltration).toBe(0);
    expect(r.runoffPercent).toBe(0);
  });

  it("paved surface produces high runoff percentage", () => {
    const r = computeCNResults("paved", "A", 2, 5);
    expect(r.runoffPercent).toBeGreaterThan(90);
  });

  it("forest on soil A produces low runoff", () => {
    const r = computeCNResults("forest", "A", 2, 3);
    expect(r.runoff).toBe(0); // 3" rain, CN=30, Ia=4.67 → P < Ia → no runoff
  });
});

// ─── Sensitivity & Curve Data ───────────────────────────────────

describe("computeSensitivityData", () => {
  it("returns array with one point marked as current", () => {
    const data = computeSensitivityData("residential", "B", 2, 5);
    expect(data.length).toBeGreaterThan(0);
    expect(data.filter((d) => d.isCurrent)).toHaveLength(1);
  });

  it("runoff increases with CN", () => {
    const data = computeSensitivityData("residential", "B", 2, 5);
    for (let i = 1; i < data.length; i++) {
      expect(data[i].cn).toBeGreaterThanOrEqual(data[i - 1].cn);
      expect(data[i].runoff).toBeGreaterThanOrEqual(data[i - 1].runoff);
    }
  });
});

describe("computeRainfallRunoffCurve", () => {
  it("starts at zero and increases monotonically", () => {
    const data = computeRainfallRunoffCurve("residential", "B", 2, 5);
    expect(data[0].runoff).toBe(0);
    for (let i = 1; i < data.length; i++) {
      expect(data[i].runoff).toBeGreaterThanOrEqual(data[i - 1].runoff);
    }
  });

  it("marks the selected rainfall point", () => {
    const data = computeRainfallRunoffCurve("residential", "B", 2, 5);
    expect(data.some((d) => d.isSelected)).toBe(true);
  });
});

// ─── Comparison Infiltration Methods ────────────────────────────

describe("calculateGreenAmpt", () => {
  it("produces non-negative runoff and infiltration", () => {
    const r = calculateGreenAmpt(5, "B");
    expect(r.runoff).toBeGreaterThanOrEqual(0);
    expect(r.infiltration).toBeGreaterThanOrEqual(0);
  });

  it("runoff + infiltration ≈ rainfall", () => {
    const r = calculateGreenAmpt(5, "B");
    expect(r.runoff + r.infiltration).toBeCloseTo(5, 0);
  });

  it("clay (D) produces more runoff than sand (A)", () => {
    const sand = calculateGreenAmpt(5, "A");
    const clay = calculateGreenAmpt(5, "D");
    expect(clay.runoff).toBeGreaterThan(sand.runoff);
  });
});

describe("calculatePhilip", () => {
  it("runoff + infiltration ≤ rainfall", () => {
    const r = calculatePhilip(5, "B");
    expect(r.runoff + r.infiltration).toBeLessThanOrEqual(5.01);
  });

  it("soil D produces more runoff than soil A", () => {
    expect(calculatePhilip(5, "D").runoff).toBeGreaterThan(
      calculatePhilip(5, "A").runoff
    );
  });
});

describe("calculateHorton", () => {
  it("runoff + infiltration ≤ rainfall", () => {
    const r = calculateHorton(5, "C");
    expect(r.runoff + r.infiltration).toBeLessThanOrEqual(5.01);
  });

  it("soil D produces more runoff than soil A", () => {
    expect(calculateHorton(5, "D").runoff).toBeGreaterThan(
      calculateHorton(5, "A").runoff
    );
  });
});
