import { describe, it, expect } from "vitest";
import { designStillingBasin, classifyJump, selectBasinType } from "../hydraulic-structures";
import { classifyChannel } from "../channel-classification";

describe("Hydraulic Structures", () => {
  describe("designStillingBasin", () => {
    it("sequent depth y2 > y1", () => {
      const r = designStillingBasin(5, 0.3, 3.0);
      expect(r.y2).toBeGreaterThan(0.3);
      expect(r.dE).toBeGreaterThan(0);
    });
    it("tailwater adequate when TW ≥ y2", () => {
      const r = designStillingBasin(5, 0.3, 10);
      expect(r.twAdequate).toBe(true);
    });
  });

  describe("classifyJump", () => {
    it("Strong for Fr > 9", () => expect(classifyJump(10)).toBe("Strong"));
    it("Weak for Fr 1.7-2.5", () => expect(classifyJump(2)).toBe("Weak"));
  });

  describe("selectBasinType", () => {
    it("Type III for Fr 4.5-14", () => expect(selectBasinType(8)).toBe("III"));
    it("Type II for Fr > 14", () => expect(selectBasinType(15)).toBe("II"));
  });
});

describe("Channel Classification", () => {
  it("entrenched + narrow + moderate sinuosity + steep + boulder → Type A or B", () => {
    const matches = classifyChannel([0, 0, 1, 2, 0]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].type).toMatch(/^[AB]/);
  });

  it("slightly entrenched + wide + high sinuosity + low slope → Type C", () => {
    const matches = classifyChannel([2, 1, 2, 0, 1]);
    expect(matches.some(m => m.type === "C")).toBe(true);
  });

  it("returns all types when incomplete answers", () => {
    expect(classifyChannel([0, 1])).toHaveLength(7);
  });
});
