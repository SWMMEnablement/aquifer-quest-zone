import { describe, it, expect } from "vitest";
import {
  classifyWaveType,
  calculateVelocity,
  calculateFroude,
  analyzeWave,
  generateWaveSurface,
  type EquationTerms,
  type ChannelParams,
} from "../saint-venant";

const ALL_ON: EquationTerms = {
  localAcceleration: true,
  convectiveAcceleration: true,
  pressureGradient: true,
  gravity: true,
  friction: true,
};

const DIFFUSION: EquationTerms = {
  ...ALL_ON,
  localAcceleration: false,
  convectiveAcceleration: false,
};

const KINEMATIC: EquationTerms = {
  ...DIFFUSION,
  pressureGradient: false,
};

const BASE_CHANNEL: ChannelParams = {
  depth: 1.5,
  slope: 0.005,
  manningsN: 0.035,
  length: 500,
};

describe("classifyWaveType", () => {
  it("all toggleable terms on → dynamic", () => {
    expect(classifyWaveType(ALL_ON)).toBe("dynamic");
  });

  it("drop inertia terms → diffusion", () => {
    expect(classifyWaveType(DIFFUSION)).toBe("diffusion");
  });

  it("drop inertia + pressure → kinematic", () => {
    expect(classifyWaveType(KINEMATIC)).toBe("kinematic");
  });

  it("only local off → custom", () => {
    expect(
      classifyWaveType({ ...ALL_ON, localAcceleration: false })
    ).toBe("custom");
  });
});

describe("calculateVelocity", () => {
  it("Manning wide channel: d=1.5, S=0.005, n=0.035", () => {
    // V = (1/0.035) × 1.5^(2/3) × 0.005^0.5
    // 1.5^(2/3) ≈ 1.3104, 0.005^0.5 ≈ 0.07071
    // V ≈ 28.57 × 1.3104 × 0.07071 ≈ 2.648
    const v = calculateVelocity(1.5, 0.005, 0.035);
    expect(v).toBeCloseTo(2.65, 1);
  });

  it("deeper → faster", () => {
    expect(calculateVelocity(3, 0.005, 0.035)).toBeGreaterThan(
      calculateVelocity(1, 0.005, 0.035)
    );
  });
});

describe("calculateFroude", () => {
  it("Fr = V / √(gd)", () => {
    const Fr = calculateFroude(3.0, 1.5);
    // √(9.81 × 1.5) ≈ 3.836 → Fr ≈ 0.782
    expect(Fr).toBeCloseTo(0.782, 2);
  });

  it("supercritical when V > √(gd)", () => {
    expect(calculateFroude(5.0, 1.0)).toBeGreaterThan(1);
  });
});

describe("analyzeWave", () => {
  it("returns correct wave type for given terms", () => {
    expect(analyzeWave(BASE_CHANNEL, ALL_ON).waveType).toBe("dynamic");
    expect(analyzeWave(BASE_CHANNEL, KINEMATIC).waveType).toBe("kinematic");
  });

  it("kinematic celerity = βV = (5/3)V", () => {
    const a = analyzeWave(BASE_CHANNEL, ALL_ON);
    expect(a.kinematicCelerity).toBeCloseTo((5 / 3) * a.velocity, 2);
  });

  it("dynamic downstream celerity = V + √(gd)", () => {
    const a = analyzeWave(BASE_CHANNEL, ALL_ON);
    const expected = a.velocity + Math.sqrt(9.81 * BASE_CHANNEL.depth);
    expect(a.dynamicCelerityDown).toBeCloseTo(expected, 2);
  });
});

describe("generateWaveSurface", () => {
  it("returns 201 points for 200 segments", () => {
    const pts = generateWaveSurface(BASE_CHANNEL, ALL_ON, 0, 75);
    expect(pts.length).toBe(201);
  });

  it("has a wave pulse above base depth at t=0", () => {
    const pts = generateWaveSurface(BASE_CHANNEL, ALL_ON, 0, 75);
    const maxElev = Math.max(...pts.map((p) => p.elevation));
    expect(maxElev).toBeGreaterThan(BASE_CHANNEL.depth);
  });

  it("kinematic wave translates without attenuation", () => {
    const t0 = generateWaveSurface(BASE_CHANNEL, KINEMATIC, 0, 75);
    const t1 = generateWaveSurface(BASE_CHANNEL, KINEMATIC, 5, 75);
    const peak0 = Math.max(...t0.map((p) => p.elevation));
    const peak1 = Math.max(...t1.map((p) => p.elevation));
    // Peak amplitude should be preserved
    expect(peak1).toBeCloseTo(peak0, 2);
  });

  it("diffusion wave attenuates over time", () => {
    const t0 = generateWaveSurface(BASE_CHANNEL, DIFFUSION, 0, 75);
    const t5 = generateWaveSurface(BASE_CHANNEL, DIFFUSION, 10, 75);
    const peak0 = Math.max(...t0.map((p) => p.elevation));
    const peak5 = Math.max(...t5.map((p) => p.elevation));
    expect(peak5).toBeLessThan(peak0);
  });
});
