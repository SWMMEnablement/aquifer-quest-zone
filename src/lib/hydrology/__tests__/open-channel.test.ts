import { describe, it, expect } from "vitest";
import { computeGeometry, computeManning, computeSpecificEnergy, computeWaveCelerity, classifyGVFProfile, computeCriticalDepth, computeNormalDepth } from "../open-channel";

describe("Open Channel Hydraulics", () => {
  describe("computeGeometry", () => {
    it("rectangular: A = b*y, P = b + 2y", () => {
      const g = computeGeometry("rectangular", 2, 10, 0, 0);
      expect(g.A).toBe(20);
      expect(g.P).toBe(14);
      expect(g.T).toBe(10);
    });
    it("trapezoidal: A = (b + zy)y", () => {
      const g = computeGeometry("trapezoidal", 2, 10, 2, 0);
      expect(g.A).toBe(28);
    });
    it("triangular: A = zy²", () => {
      const g = computeGeometry("triangular", 3, 0, 2, 0);
      expect(g.A).toBe(18);
    });
    it("circular: full pipe", () => {
      const g = computeGeometry("circular", 1, 0, 0, 2);
      expect(g.A).toBeGreaterThan(0);
    });
  });

  describe("computeManning", () => {
    it("returns positive Q for valid inputs", () => {
      const r = computeManning("rectangular", 2, 10, 0, 0, 0.03, 0.001);
      expect(r.Q).toBeGreaterThan(0);
      expect(r.V).toBeGreaterThan(0);
      expect(r.Fr).toBeGreaterThan(0);
    });
  });

  describe("computeSpecificEnergy", () => {
    it("conjugate depth y2 > y1 when supercritical", () => {
      const r = computeSpecificEnergy(5, 0.5);
      expect(r.Fr).toBeGreaterThan(1);
      expect(r.y2).toBeGreaterThan(0.5);
      expect(r.energyLoss).toBeGreaterThan(0);
    });
    it("classifies strong jump for high Froude", () => {
      const r = computeSpecificEnergy(10, 0.2);
      expect(r.jumpType).toBe("Strong");
    });
    it("Emin = 1.5 * yc", () => {
      const r = computeSpecificEnergy(5, 2);
      expect(r.Emin).toBeCloseTo(1.5 * r.yc, 3);
    });
  });

  describe("computeWaveCelerity", () => {
    it("kinematic celerity = β × V", () => {
      const r = computeWaveCelerity(2, 0.03, 0.005);
      expect(r.ck).toBeCloseTo((5/3) * r.V, 3);
    });
    it("dynamic downstream > kinematic", () => {
      const r = computeWaveCelerity(2, 0.03, 0.001);
      expect(r.cd_plus).toBeGreaterThan(r.ck);
    });
  });

  describe("classifyGVFProfile", () => {
    it("mild slope with dam → M1", () => {
      const r = classifyGVFProfile(50, 10, 0.03, 0.001, "dam");
      expect(r.activeProfile).toBe("M1");
      expect(r.slopeType).toBe("Mild");
    });
    it("steep slope with gate → S3", () => {
      const r = classifyGVFProfile(50, 10, 0.03, 0.05, "gate");
      expect(r.activeProfile).toBe("S3");
    });
  });

  describe("computeNormalDepth", () => {
    it("returns finite depth for positive slope", () => {
      const yn = computeNormalDepth(50, 10, 0.03, 0.001);
      expect(yn).toBeGreaterThan(0);
      expect(yn).toBeLessThan(20);
    });
    it("returns Infinity for zero slope", () => {
      expect(computeNormalDepth(50, 10, 0.03, 0)).toBe(Infinity);
    });
  });
});
