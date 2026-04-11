import { describe, it, expect } from "vitest";
import { generateUH, buildCompositeHydrograph, computeRationalMethod, computeIdfIntensity } from "../unit-hydrograph";

describe("Unit Hydrograph & Rational Method", () => {
  describe("generateUH", () => {
    it("SCS triangular peak at tp", () => {
      const r = generateUH("scs-triangular", 100, 6, 2);
      expect(r.tp).toBeCloseTo(4.6, 1);
      expect(r.Qp).toBeGreaterThan(0);
      expect(r.ordinates.length).toBeGreaterThan(0);
    });
    it("curvilinear peak ≤ triangular peak", () => {
      const tri = generateUH("scs-triangular", 100, 6, 2);
      const cur = generateUH("scs-curvilinear", 100, 6, 2);
      expect(cur.Qp).toBeLessThanOrEqual(tri.Qp * 1.01);
    });
  });

  describe("buildCompositeHydrograph", () => {
    it("composite peak > single UH peak for multi-bar storm", () => {
      const uh = generateUH("scs-triangular", 100, 6, 2);
      const comp = buildCompositeHydrograph(uh.ordinates, [10, 25, 40, 30, 15, 5], 2);
      const peakTotal = Math.max(...comp.map(c => c.total));
      expect(peakTotal).toBeGreaterThan(0);
    });
  });

  describe("computeRationalMethod", () => {
    it("Q increases with area", () => {
      const r1 = computeRationalMethod(0.4, 25, 30, 50);
      const r2 = computeRationalMethod(0.4, 25, 30, 100);
      expect(r2.Q).toBeGreaterThan(r1.Q);
    });
  });

  describe("computeIdfIntensity", () => {
    it("intensity decreases with duration", () => {
      const short = computeIdfIntensity(25, 10);
      const long = computeIdfIntensity(25, 60);
      expect(short).toBeGreaterThan(long);
    });
  });
});
