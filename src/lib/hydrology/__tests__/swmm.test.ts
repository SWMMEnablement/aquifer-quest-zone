import { describe, it, expect } from "vitest";
import { computeGutterFlow, computeGrateInlet, computeCurbInlet, computePipeFlow, computeWeirOrifice, computeWaterHammer, generatePumpCurve, applyAffinityLaws, computeSpecificSpeed } from "../swmm";

describe("SWMM Urban Hydraulics", () => {
  describe("computeGutterFlow", () => {
    it("spread increases with discharge", () => {
      const r1 = computeGutterFlow(0.05, 0.016, 0.02, 0.06, 0.02, 0.6);
      const r2 = computeGutterFlow(0.15, 0.016, 0.02, 0.06, 0.02, 0.6);
      expect(r2.spread).toBeGreaterThan(r1.spread);
    });
  });

  describe("computeGrateInlet", () => {
    it("efficiency between 0 and 1", () => {
      const r = computeGrateInlet(0.1, 0.02, 0.025, 0.9, 0.6, 0);
      expect(r.E).toBeGreaterThanOrEqual(0);
      expect(r.E).toBeLessThanOrEqual(1);
      expect(r.Qi + r.bypass).toBeCloseTo(0.1, 3);
    });
    it("clogging reduces efficiency", () => {
      const clean = computeGrateInlet(0.1, 0.02, 0.025, 0.9, 0.6, 0);
      const clogged = computeGrateInlet(0.1, 0.02, 0.025, 0.9, 0.6, 50);
      expect(clogged.E).toBeLessThan(clean.E);
    });
  });

  describe("computePipeFlow", () => {
    it("Q increases with depth", () => {
      const r1 = computePipeFlow("manning", 0.6, 0.005, 0.013, 0.2);
      const r2 = computePipeFlow("manning", 0.6, 0.005, 0.013, 0.4);
      expect(r2.Q).toBeGreaterThan(r1.Q);
    });
    it("Qfull > Q for partial flow", () => {
      const r = computePipeFlow("manning", 0.6, 0.005, 0.013, 0.3);
      expect(r.Qfull).toBeGreaterThan(r.Q);
    });
  });

  describe("computeWeirOrifice", () => {
    it("rectangular weir Q > 0 when H > 0", () => {
      const r = computeWeirOrifice("rect-weir", 2.0, 1.0, 0.5, 3.0, 1.84, 90, 0.5);
      expect(r.Q).toBeGreaterThan(0);
      expect(r.H).toBe(1.0);
    });
    it("submergence reduces flow", () => {
      const free = computeWeirOrifice("rect-weir", 2.0, 1.0, 0.0, 3.0, 1.84, 90, 0.5);
      const sub = computeWeirOrifice("rect-weir", 2.0, 1.0, 1.8, 3.0, 1.84, 90, 0.5);
      expect(sub.Q).toBeLessThan(free.Q);
    });
  });

  describe("computeWaterHammer", () => {
    it("rapid closure when tv < tc", () => {
      const r = computeWaterHammer(500, 0.5, 0.01, 2.0, 0.1, 2.2e9, 200e9);
      expect(r.isRapid).toBe(true);
      expect(r.dP).toBeGreaterThan(0);
    });
    it("slow closure pressure < rapid", () => {
      const rapid = computeWaterHammer(500, 0.5, 0.01, 2.0, 0.1, 2.2e9, 200e9);
      const slow = computeWaterHammer(500, 0.5, 0.01, 2.0, 30, 2.2e9, 200e9);
      expect(slow.dP).toBeLessThan(rapid.dP);
    });
  });

  describe("Pump curves", () => {
    it("shutoff head at Q=0", () => {
      const curve = generatePumpCurve(0.1, 30, 40);
      expect(curve[0].H).toBeCloseTo(40, 0);
    });
    it("affinity laws scale Q linearly with speed ratio", () => {
      const base = generatePumpCurve(0.1, 30, 40);
      const scaled = applyAffinityLaws(base, 1750, 875);
      expect(scaled[10].Q).toBeCloseTo(base[10].Q * 0.5, 3);
    });
  });
});
