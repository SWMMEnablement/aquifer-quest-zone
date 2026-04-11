import { describe, it, expect } from "vitest";
import { computeCatchmentBalance, computeWatershedMetrics, generateMonthlyBalance } from "../water-balance";

describe("Water Balance", () => {
  describe("computeCatchmentBalance", () => {
    it("P = ET + Qs + Qb + deltaS", () => {
      const P = 1000;
      const r = computeCatchmentBalance(P, 15, 40, 20);
      expect(r.ET + r.Qs + r.Qb + r.deltaS).toBeCloseTo(P, 0);
    });
    it("more urban → more runoff", () => {
      const low = computeCatchmentBalance(1000, 15, 40, 10);
      const high = computeCatchmentBalance(1000, 15, 40, 60);
      expect(high.Qs).toBeGreaterThan(low.Qs);
    });
  });

  describe("computeWatershedMetrics", () => {
    it("high forest coverage → high ecosystem health", () => {
      const r = computeWatershedMetrics({ forest: 70, wetland: 10, agriculture: 10, urban: 5, industrial: 5 }, 1000, 10);
      expect(r.overallEcosystemHealth).toBeGreaterThan(0.5);
    });
    it("high industrial → low water quality", () => {
      const r = computeWatershedMetrics({ forest: 5, wetland: 5, agriculture: 10, urban: 30, industrial: 50 }, 1000, 10);
      expect(r.waterQuality).toBeLessThan(0.5);
    });
  });

  describe("generateMonthlyBalance", () => {
    it("returns 12 months", () => {
      expect(generateMonthlyBalance(1000, 500, 200, 100)).toHaveLength(12);
    });
  });
});
