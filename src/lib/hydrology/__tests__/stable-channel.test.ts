import { describe, it, expect } from "vitest";
import { designStableChannel, designTractiveForce, BED_MATERIALS_MAP, BANK_MATERIALS_MAP } from "../stable-channel";

describe("Stable Channel Design", () => {
  describe("designStableChannel", () => {
    it("returns stable status for low shear", () => {
      const r = designStableChannel(50, 0.0005, 25, 0.033, 2, "trapezoidal");
      expect(r.width).toBeGreaterThan(0);
      expect(r.depth).toBeGreaterThan(0);
      expect(r.velocity).toBeGreaterThan(0);
    });
    it("rectangular channel width ≈ 2 × depth", () => {
      const r = designStableChannel(50, 0.001, 2, 0.025, 0, "rectangular");
      expect(r.width / r.depth).toBeCloseTo(2, 0);
    });
  });

  describe("designTractiveForce", () => {
    it("computes valid design dimensions", () => {
      const bed = BED_MATERIALS_MAP["medium-sand"];
      const bank = BANK_MATERIALS_MAP["cohesive-clay"];
      const r = designTractiveForce(25, 0.001, 2, 0.5, bed, bank);
      expect(r.d).toBeGreaterThan(0);
      expect(r.b).toBeGreaterThan(0);
      expect(r.totalDepth).toBeGreaterThan(r.d);
    });
    it("bank FoS improves with higher permissible shear", () => {
      const bed = BED_MATERIALS_MAP["medium-sand"];
      const weak = designTractiveForce(25, 0.001, 2, 0.5, bed, BANK_MATERIALS_MAP["fine-sand"]);
      const strong = designTractiveForce(25, 0.001, 2, 0.5, bed, BANK_MATERIALS_MAP["stiff-clay"]);
      expect(strong.fsBank).toBeGreaterThan(weak.fsBank);
    });
  });
});
