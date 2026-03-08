import { describe, it, expect } from "vitest";
import {
  generateTriangularHydrograph,
  generateTrapezoidalHydrograph,
  generateSCSHydrograph,
  generateHydrograph,
  calculateManningVelocity,
  calculateRoutingK,
  computeRoutingCoefficients,
  routeHydrograph,
  computeRoutingStats,
} from "../muskingum";

// ─── Hydrograph Generation ──────────────────────────────────────

describe("generateTriangularHydrograph", () => {
  it("starts and ends at zero", () => {
    const h = generateTriangularHydrograph(100, 6, 0.5, 18);
    expect(h[0].inflow).toBe(0);
    expect(h[h.length - 1].inflow).toBe(0);
  });

  it("peaks at 40% of duration", () => {
    const h = generateTriangularHydrograph(100, 10, 0.5, 30);
    const peakPoint = h.reduce((a, b) => (b.inflow > a.inflow ? b : a));
    expect(peakPoint.time).toBeCloseTo(4, 0); // 40% of 10
    expect(peakPoint.inflow).toBeCloseTo(100, 0);
  });

  it("all flows are non-negative", () => {
    const h = generateTriangularHydrograph(200, 8, 0.25, 24);
    h.forEach((p) => expect(p.inflow).toBeGreaterThanOrEqual(0));
  });
});

describe("generateTrapezoidalHydrograph", () => {
  it("reaches and sustains peak flow", () => {
    const h = generateTrapezoidalHydrograph(100, 10, 0.1, 30);
    const peakPoints = h.filter((p) => Math.abs(p.inflow - 100) < 1);
    expect(peakPoints.length).toBeGreaterThan(1); // plateau exists
  });
});

describe("generateSCSHydrograph", () => {
  it("peak occurs near tp = 0.375 × duration", () => {
    const h = generateSCSHydrograph(100, 8, 0.25, 24);
    const peakPoint = h.reduce((a, b) => (b.inflow > a.inflow ? b : a));
    expect(peakPoint.time).toBeCloseTo(3, 0); // 0.375 × 8 = 3
  });

  it("recession decays exponentially (later values smaller)", () => {
    const h = generateSCSHydrograph(100, 6, 0.5, 18);
    const peakIdx = h.findIndex(
      (p) => p.inflow === Math.max(...h.map((x) => x.inflow))
    );
    // After peak, flow should generally decrease
    for (let i = peakIdx + 2; i < h.length; i++) {
      expect(h[i].inflow).toBeLessThanOrEqual(h[i - 1].inflow + 0.01);
    }
  });
});

describe("generateHydrograph", () => {
  it("dispatches to correct generator", () => {
    const tri = generateHydrograph("triangular", 50, 6, 0.5);
    const trap = generateHydrograph("trapezoidal", 50, 6, 0.5);
    const scs = generateHydrograph("scs", 50, 6, 0.5);
    // All should have same length (same totalTime and dt)
    expect(tri.length).toBe(trap.length);
    expect(tri.length).toBe(scs.length);
    // But different shapes
    expect(tri[3].inflow).not.toBe(scs[3].inflow);
  });
});

// ─── Hydraulic Calculations ─────────────────────────────────────

describe("calculateManningVelocity", () => {
  it("textbook: wide channel, n=0.035, S=0.001", () => {
    // width=20m, depth=2m → R = 40/24 = 1.667m
    // V = (1/0.035) × 1.667^(2/3) × 0.001^0.5
    // R^(2/3) ≈ 1.405, S^0.5 ≈ 0.03162
    // V ≈ 28.57 × 1.405 × 0.03162 ≈ 1.269 m/s
    const v = calculateManningVelocity(20, 0.035, 0.001);
    expect(v).toBeCloseTo(1.27, 1);
  });

  it("higher slope → higher velocity", () => {
    const v1 = calculateManningVelocity(20, 0.035, 0.001);
    const v2 = calculateManningVelocity(20, 0.035, 0.005);
    expect(v2).toBeGreaterThan(v1);
  });

  it("higher roughness → lower velocity", () => {
    const v1 = calculateManningVelocity(20, 0.02, 0.001);
    const v2 = calculateManningVelocity(20, 0.06, 0.001);
    expect(v1).toBeGreaterThan(v2);
  });
});

describe("calculateRoutingK", () => {
  it("K = L / (1.5·V) in hours", () => {
    // L=5000m, V=1.27 m/s → c=1.905 m/s → K = 5000/1.905/3600 ≈ 0.729 hrs
    const K = calculateRoutingK(5000, 1.27);
    expect(K).toBeCloseTo(0.73, 1);
  });

  it("longer reach → larger K", () => {
    expect(calculateRoutingK(10000, 1.0)).toBeGreaterThan(
      calculateRoutingK(5000, 1.0)
    );
  });
});

// ─── Routing Coefficients ───────────────────────────────────────

describe("computeRoutingCoefficients", () => {
  it("C0 + C1 + C2 = 1 (conservation of mass)", () => {
    const { C0, C1, C2 } = computeRoutingCoefficients(1.0, 0.2, 0.5);
    expect(C0 + C1 + C2).toBeCloseTo(1.0, 10);
  });

  it("C0 + C1 + C2 = 1 for various K, X, dt", () => {
    const cases = [
      { K: 0.5, X: 0, dt: 0.25 },
      { K: 2.0, X: 0.5, dt: 1.0 },
      { K: 1.0, X: 0.3, dt: 0.5 },
    ];
    cases.forEach(({ K, X, dt }) => {
      const { C0, C1, C2 } = computeRoutingCoefficients(K, X, dt);
      expect(C0 + C1 + C2).toBeCloseTo(1.0, 10);
    });
  });

  it("X=0 (reservoir) gives maximum attenuation coefficients", () => {
    const res = computeRoutingCoefficients(1.0, 0, 0.5);
    // C0 = C1 = dt/(2K+dt) = 0.5/2.5 = 0.2
    expect(res.C0).toBeCloseTo(0.2, 4);
    expect(res.C1).toBeCloseTo(0.2, 4);
    // C2 = (2K−dt)/(2K+dt) = 1.5/2.5 = 0.6
    expect(res.C2).toBeCloseTo(0.6, 4);
  });
});

// ─── Full Routing ───────────────────────────────────────────────

describe("routeHydrograph", () => {
  const inflow = generateHydrograph("triangular", 100, 6, 0.5);

  it("outflow peak ≤ inflow peak (attenuation)", () => {
    const routed = routeHydrograph(inflow, 1.0, 0.2, 0.5);
    const inflowPeak = Math.max(...routed.map((d) => d.inflow));
    const outflowPeak = Math.max(...routed.map((d) => d.muskingumOutflow));
    expect(outflowPeak).toBeLessThanOrEqual(inflowPeak);
  });

  it("outflow peak time ≥ inflow peak time (translation)", () => {
    const routed = routeHydrograph(inflow, 1.0, 0.2, 0.5);
    const inflowPeakTime = routed.reduce((a, b) =>
      b.inflow > a.inflow ? b : a
    ).time;
    const outflowPeakTime = routed.reduce((a, b) =>
      b.muskingumOutflow > a.muskingumOutflow ? b : a
    ).time;
    expect(outflowPeakTime).toBeGreaterThanOrEqual(inflowPeakTime);
  });

  it("X=0.5 gives minimal attenuation (near pure translation)", () => {
    const routed = routeHydrograph(inflow, 1.0, 0.5, 0.5);
    const inflowPeak = Math.max(...routed.map((d) => d.inflow));
    const outflowPeak = Math.max(...routed.map((d) => d.muskingumOutflow));
    // X=0.5 minimizes attenuation; peak should be close to inflow
    const attenuation = ((inflowPeak - outflowPeak) / inflowPeak) * 100;
    expect(attenuation).toBeLessThan(15);
  });

  it("all outflows are non-negative", () => {
    const routed = routeHydrograph(inflow, 1.0, 0.2, 0.5);
    routed.forEach((d) => {
      expect(d.muskingumOutflow).toBeGreaterThanOrEqual(0);
      expect(d.kinematicOutflow).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── Statistics ─────────────────────────────────────────────────

describe("computeRoutingStats", () => {
  it("reports correct attenuation and translation", () => {
    const inflow = generateHydrograph("triangular", 100, 6, 0.5);
    const routed = routeHydrograph(inflow, 1.0, 0.2, 0.5);
    const stats = computeRoutingStats(routed);

    expect(stats.inflowPeak).toBe(100);
    expect(stats.muskingumPeak).toBeLessThanOrEqual(100);
    expect(stats.attenuation).toBeGreaterThan(0);
    expect(stats.translation).toBeGreaterThanOrEqual(0);
  });
});
