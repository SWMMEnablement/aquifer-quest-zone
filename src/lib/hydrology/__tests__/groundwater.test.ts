import { describe, it, expect } from "vitest";
import { wellFunction, computeDrawdown, simulateAquiferStep, computeRecharge, computeSustainableYield } from "../groundwater";

describe("Groundwater", () => {
  describe("wellFunction", () => {
    it("W(u) → large for small u", () => {
      expect(wellFunction(0.001)).toBeGreaterThan(5);
    });
    it("W(u) → 0 for large u", () => {
      expect(wellFunction(15)).toBe(0);
    });
  });

  describe("computeDrawdown", () => {
    it("drawdown decreases with distance", () => {
      const near = computeDrawdown(500, 500, 0.001, 10, 1);
      const far = computeDrawdown(500, 500, 0.001, 500, 1);
      expect(near.s).toBeGreaterThan(far.s);
    });
  });

  describe("simulateAquiferStep", () => {
    it("storage increases when recharge > pumping", () => {
      const prev = { year: 0, storage: 1000, waterTable: 10, ecosystemHealth: 100, cumulativePumping: 0, cumulativeRecharge: 0 };
      const next = simulateAquiferStep(prev, 50, 20, 500, 0.15, 13.33);
      expect(next.storage).toBeGreaterThan(prev.storage);
    });
    it("ecosystem health declines when water table drops below critical", () => {
      const prev = { year: 0, storage: 100, waterTable: 1, ecosystemHealth: 80, cumulativePumping: 0, cumulativeRecharge: 0 };
      const next = simulateAquiferStep(prev, 10, 50, 500, 0.15, 13.33);
      expect(next.ecosystemHealth).toBeLessThan(prev.ecosystemHealth);
    });
  });

  describe("computeRecharge", () => {
    it("sandy soil has higher recharge than clay", () => {
      const lc = { name: "Grassland", interception: 0.10, etFactor: 0.85 };
      const sand = { name: "Sand", infiltCapacity: 0.85, fieldCapacity: 0.10 };
      const clay = { name: "Clay", infiltCapacity: 0.20, fieldCapacity: 0.40 };
      const rSand = computeRecharge(800, 18, lc, sand);
      const rClay = computeRecharge(800, 18, lc, clay);
      expect(rSand.recharge).toBeGreaterThan(rClay.recharge);
    });
  });

  describe("computeSustainableYield", () => {
    it("sustainable yield is 70% of recharge", () => {
      expect(computeSustainableYield(100)).toBe(70);
    });
  });
});
