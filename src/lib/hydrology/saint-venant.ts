/**
 * Saint-Venant Equations — Wave propagation simulation
 *
 * Based on the work of Prof. Victor Miguel Ponce, SDSU
 * Reference: https://ponce.sdsu.edu/the_saint_venant_equations.html
 *
 * Simulates how toggling equation terms changes wave behavior:
 *   All terms       → Dynamic wave
 *   Drop local+conv → Diffusion wave
 *   Drop pressure   → Kinematic wave
 */

// ─── Types ──────────────────────────────────────────────────────

export interface EquationTerms {
  localAcceleration: boolean;   // ∂Q/∂t
  convectiveAcceleration: boolean; // ∂(Q²/A)/∂x
  pressureGradient: boolean;    // gA(∂y/∂x)
  gravity: boolean;             // gAS₀ (always on)
  friction: boolean;            // gASf (always on)
}

export type WaveType = "dynamic" | "diffusion" | "kinematic" | "gravity" | "custom";

export interface WavePoint {
  x: number;      // position along channel [m]
  elevation: number; // water surface elevation [m]
}

export interface ChannelParams {
  depth: number;       // base flow depth [m]
  slope: number;       // channel bed slope [m/m]
  manningsN: number;   // roughness coefficient
  length: number;      // channel length [m]
}

export interface WaveAnalysis {
  velocity: number;         // mean flow velocity [m/s]
  froudeNumber: number;     // Fr = V / √(gd)
  kinematicCelerity: number; // cₖ = βV
  dynamicCelerityDown: number; // V + √(gd)
  dynamicCelerityUp: number;   // V - √(gd)
  isSupercritical: boolean;
  waveType: WaveType;
}

// ─── Constants ──────────────────────────────────────────────────

const GRAVITY = 9.81;
/** β = 5/3 for wide rectangular channel with Manning's friction */
const BETA = 5 / 3;

// ─── Wave Type Classification ───────────────────────────────────

/**
 * Classify the wave type from active equation terms.
 */
export const classifyWaveType = (terms: EquationTerms): WaveType => {
  const { localAcceleration, convectiveAcceleration, pressureGradient } = terms;

  if (localAcceleration && convectiveAcceleration && pressureGradient) {
    return "dynamic";
  }
  if (!localAcceleration && !convectiveAcceleration && pressureGradient) {
    return "diffusion";
  }
  if (!localAcceleration && !convectiveAcceleration && !pressureGradient) {
    return "kinematic";
  }
  if (!localAcceleration && !convectiveAcceleration) {
    return "kinematic"; // same as above, redundant guard
  }
  return "custom";
};

/** Human-readable labels */
export const WAVE_TYPE_LABELS: Record<WaveType, string> = {
  dynamic: "Dynamic Wave",
  diffusion: "Diffusion Wave",
  kinematic: "Kinematic Wave",
  gravity: "Gravity Wave",
  custom: "Custom (non-standard)",
};

export const WAVE_TYPE_DESCRIPTIONS: Record<WaveType, string> = {
  dynamic:
    "All terms active. Captures backwater effects, wave attenuation, and both upstream and downstream propagation.",
  diffusion:
    "Inertia terms dropped. Wave attenuates (diffuses) as it translates downstream. Good for most flood routing.",
  kinematic:
    "Only gravity and friction balance. Wave translates downstream without attenuation at celerity βV.",
  gravity:
    "Gravity wave in still water. Celerity = √(gd).",
  custom:
    "Non-standard term combination. Results may not correspond to a classical wave type.",
};

// ─── Hydraulic Calculations ─────────────────────────────────────

/**
 * Manning velocity for a wide rectangular channel.
 * V = (1/n) × d^(2/3) × S^(1/2)
 * (hydraulic radius ≈ depth for wide channel)
 */
export const calculateVelocity = (
  depth: number,
  slope: number,
  n: number
): number => {
  return (1 / n) * Math.pow(depth, 2 / 3) * Math.pow(slope, 0.5);
};

/**
 * Froude number Fr = V / √(gd)
 */
export const calculateFroude = (velocity: number, depth: number): number => {
  return velocity / Math.sqrt(GRAVITY * depth);
};

/**
 * Full wave analysis for current channel conditions.
 */
export const analyzeWave = (
  params: ChannelParams,
  terms: EquationTerms
): WaveAnalysis => {
  const V = calculateVelocity(params.depth, params.slope, params.manningsN);
  const Fr = calculateFroude(V, params.depth);
  const sqrtGd = Math.sqrt(GRAVITY * params.depth);

  return {
    velocity: round3(V),
    froudeNumber: round3(Fr),
    kinematicCelerity: round3(BETA * V),
    dynamicCelerityDown: round3(V + sqrtGd),
    dynamicCelerityUp: round3(V - sqrtGd),
    isSupercritical: Fr >= 1,
    waveType: classifyWaveType(terms),
  };
};

// ─── Wave Surface Generation ────────────────────────────────────

/**
 * Generate the wave surface profile at a given time.
 *
 * The behavior changes based on wave type:
 * - Kinematic: pure translation, no attenuation
 * - Diffusion: translation + spreading/attenuation
 * - Dynamic: translation + attenuation + possible upstream component
 */
export const generateWaveSurface = (
  params: ChannelParams,
  terms: EquationTerms,
  time: number,
  pulsePosition: number
): WavePoint[] => {
  const V = calculateVelocity(params.depth, params.slope, params.manningsN);
  const Fr = calculateFroude(V, params.depth);
  const waveType = classifyWaveType(terms);

  const numPoints = 200;
  const dx = params.length / numPoints;
  const points: WavePoint[] = [];

  // Wave parameters
  const amplitude = params.depth * 0.3; // 30% of base depth
  const baseWidth = params.length * 0.08;

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    let elevation = params.depth;

    // Compute wave contribution based on type
    if (waveType === "kinematic") {
      // Pure translation at celerity βV, no shape change
      const celerity = BETA * V;
      const waveCenter = pulsePosition + celerity * time;
      const dist = x - waveCenter;
      elevation += amplitude * Math.exp(-(dist * dist) / (2 * baseWidth * baseWidth));
    } else if (waveType === "diffusion") {
      // Translation + spreading (Gaussian diffusion)
      const celerity = BETA * V;
      const waveCenter = pulsePosition + celerity * time;
      // Diffusion coefficient: ν = Q / (2·T·S₀) — simplified
      const diffCoeff = V * params.depth / (2 * params.slope);
      const effectiveWidth = Math.sqrt(baseWidth * baseWidth + 2 * diffCoeff * time);
      const dist = x - waveCenter;
      const attenuatedAmplitude = amplitude * (baseWidth / Math.max(effectiveWidth, baseWidth));
      elevation += attenuatedAmplitude * Math.exp(-(dist * dist) / (2 * effectiveWidth * effectiveWidth));
    } else if (waveType === "dynamic") {
      // Full dynamic: downstream + upstream propagating components
      const cDown = V + Math.sqrt(GRAVITY * params.depth);
      const cUp = V - Math.sqrt(GRAVITY * params.depth);
      const diffCoeff = V * params.depth / (2 * params.slope) * 0.5;
      const effectiveWidth = Math.sqrt(baseWidth * baseWidth + 2 * diffCoeff * time);

      // Downstream component (larger)
      const centerDown = pulsePosition + cDown * time;
      const distDown = x - centerDown;
      const ampDown = amplitude * 0.6 * (baseWidth / Math.max(effectiveWidth, baseWidth));
      const downstream = ampDown * Math.exp(-(distDown * distDown) / (2 * effectiveWidth * effectiveWidth));

      // Upstream component (smaller, only if subcritical)
      let upstream = 0;
      if (Fr < 1) {
        const centerUp = pulsePosition + cUp * time;
        const distUp = x - centerUp;
        const ampUp = amplitude * 0.3 * (baseWidth / Math.max(effectiveWidth, baseWidth));
        upstream = ampUp * Math.exp(-(distUp * distUp) / (2 * effectiveWidth * effectiveWidth));
      }

      elevation += downstream + upstream;
    } else {
      // Custom: simple translation at average celerity
      const celerity = V;
      const waveCenter = pulsePosition + celerity * time;
      const dist = x - waveCenter;
      elevation += amplitude * 0.8 * Math.exp(-(dist * dist) / (2 * baseWidth * baseWidth));
    }

    points.push({ x: round2(x), elevation: round3(elevation) });
  }

  return points;
};

// ─── Term Metadata ──────────────────────────────────────────────

export interface TermInfo {
  id: keyof EquationTerms;
  symbol: string;
  name: string;
  description: string;
  color: string;       // tailwind-compatible HSL token
  canToggle: boolean;
}

export const EQUATION_TERMS: TermInfo[] = [
  {
    id: "localAcceleration",
    symbol: "∂Q/∂t",
    name: "Local Acceleration",
    description: "Rate of change of momentum at a fixed point in the channel",
    color: "hsl(270 60% 55%)", // purple
    canToggle: true,
  },
  {
    id: "convectiveAcceleration",
    symbol: "∂(Q²/A)/∂x",
    name: "Convective Acceleration",
    description: "Spatial rate of change of momentum flux along the channel",
    color: "hsl(25 90% 55%)", // orange
    canToggle: true,
  },
  {
    id: "pressureGradient",
    symbol: "gA(∂y/∂x)",
    name: "Pressure Gradient",
    description: "Force due to the water surface slope (hydrostatic pressure variation)",
    color: "hsl(210 80% 55%)", // blue
    canToggle: true,
  },
  {
    id: "gravity",
    symbol: "gAS₀",
    name: "Gravity (Bed Slope)",
    description: "Driving force from the channel bed slope — always active",
    color: "hsl(145 60% 42%)", // green
    canToggle: false,
  },
  {
    id: "friction",
    symbol: "gASf",
    name: "Friction (Energy Slope)",
    description: "Resistance force from bed and wall friction — always active",
    color: "hsl(0 72% 55%)", // red
    canToggle: false,
  },
];

// ─── Manning's n presets ────────────────────────────────────────

export const MANNINGS_PRESETS: { label: string; value: number }[] = [
  { label: "Smooth concrete", value: 0.012 },
  { label: "Finished concrete", value: 0.015 },
  { label: "Earth, straight", value: 0.025 },
  { label: "Natural stream", value: 0.035 },
  { label: "Weedy channel", value: 0.050 },
  { label: "Rough natural", value: 0.070 },
];

// ─── Helpers ────────────────────────────────────────────────────

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
