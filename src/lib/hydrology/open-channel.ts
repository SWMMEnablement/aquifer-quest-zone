/**
 * Open-Channel Hydraulics — Pure calculation functions
 *
 * Covers: Manning's equation geometry, specific energy/momentum,
 * GVF profile classification, wave propagation celerity.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

const g = 9.81;

// ─── Types ──────────────────────────────────────────────────

export type CrossSection = "rectangular" | "trapezoidal" | "triangular" | "circular" | "parabolic";
export type SlopeCategory = "mild" | "steep" | "critical" | "horizontal" | "adverse";
export type BoundaryType = "dam" | "free-overfall" | "gate";

export interface ChannelGeometry {
  A: number;   // Flow area (m²)
  P: number;   // Wetted perimeter (m)
  R: number;   // Hydraulic radius (m)
  T: number;   // Top width (m)
  D: number;   // Hydraulic depth (m)
}

export interface ManningResult extends ChannelGeometry {
  V: number;   // Velocity (m/s)
  Q: number;   // Discharge (m³/s)
  Fr: number;  // Froude number
  E: number;   // Specific energy (m)
}

export interface RatingPoint extends ManningResult {
  y: number;
}

export interface SpecificEnergyResult {
  E: number;
  M: number;
  V: number;
  Fr: number;
  yc: number;
  Emin: number;
  y2: number;        // Conjugate depth
  V2: number;
  Fr2: number;
  E2: number;
  energyLoss: number;
  jumpType: string;
  efficiency: number;
}

export interface WaveCelerityResult {
  V: number;
  Fr: number;
  ck: number;       // Kinematic wave celerity
  cd_plus: number;  // Dynamic wave celerity (downstream)
  cd_minus: number; // Dynamic wave celerity (upstream)
  Ved: number;      // Vedernikov number
}

export interface GVFResult {
  yn: number;
  yc: number;
  slopeType: string;
  activeProfile: string;
  profiles: string[];
}

// ─── Channel Geometry ───────────────────────────────────────

/**
 * Compute cross-section geometry for any supported shape.
 */
export const computeGeometry = (
  shape: CrossSection,
  depth: number,
  width: number,
  sideSlope: number,
  diameter: number
): ChannelGeometry => {
  let A = 0, P = 0, T = 0;
  switch (shape) {
    case "rectangular":
      A = width * depth; P = width + 2 * depth; T = width; break;
    case "trapezoidal":
      A = (width + sideSlope * depth) * depth;
      P = width + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
      T = width + 2 * sideSlope * depth; break;
    case "triangular":
      A = sideSlope * depth * depth;
      P = 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
      T = 2 * sideSlope * depth; break;
    case "parabolic": {
      const Tf = width;
      A = (2 / 3) * Tf * depth;
      P = Tf + (8 * depth * depth) / (3 * Tf);
      T = Tf * Math.sqrt(depth / Math.max(depth, 0.01));
      if (T < 0.01) T = 0.01;
      break;
    }
    case "circular": {
      const r = diameter / 2;
      const y = Math.min(depth, diameter);
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, (r - y) / r)));
      A = r * r * (theta - Math.sin(theta)) / 2;
      P = r * theta;
      T = 2 * Math.sqrt(Math.max(0, 2 * r * y - y * y)); break;
    }
  }
  const R = P > 0 ? A / P : 0;
  const D = T > 0 ? A / T : 0;
  return { A, P, R, T, D };
};

/**
 * Compute Manning's equation result for given depth.
 */
export const computeManning = (
  shape: CrossSection,
  depth: number,
  width: number,
  sideSlope: number,
  diameter: number,
  manningN: number,
  slope: number
): ManningResult => {
  const geo = computeGeometry(shape, depth, width, sideSlope, diameter);
  const V = geo.A > 0 && geo.P > 0
    ? (1 / manningN) * Math.pow(geo.R, 2 / 3) * Math.pow(slope, 0.5)
    : 0;
  const Q = geo.A * V;
  const Fr = geo.D > 0 ? V / Math.sqrt(g * geo.D) : 0;
  const E = depth + V * V / (2 * g);
  return { ...geo, V, Q, Fr, E };
};

/**
 * Generate a rating curve (Q-y, V-y, Fr-y) for a channel.
 */
export const generateRatingCurve = (
  shape: CrossSection,
  width: number,
  sideSlope: number,
  diameter: number,
  manningN: number,
  slope: number,
  maxDepth?: number
): RatingPoint[] => {
  const data: RatingPoint[] = [];
  const maxD = maxDepth ?? (shape === "circular" ? diameter : 6);
  for (let y = 0.1; y <= maxD; y += 0.1) {
    const result = computeManning(shape, y, width, sideSlope, diameter, manningN, slope);
    if (result.A <= 0 || result.P <= 0) continue;
    data.push({
      y: +y.toFixed(2),
      A: +result.A.toFixed(2),
      P: +result.P.toFixed(2),
      R: +result.R.toFixed(3),
      T: +result.T.toFixed(2),
      D: +result.D.toFixed(3),
      V: +result.V.toFixed(3),
      Q: +result.Q.toFixed(2),
      Fr: +result.Fr.toFixed(3),
      E: +result.E.toFixed(3),
    });
  }
  return data;
};

/**
 * Compute critical depth for a given discharge (bisection method).
 */
export const computeCriticalDepth = (
  shape: CrossSection,
  Q: number,
  width: number,
  sideSlope: number,
  diameter: number
): number => {
  if (shape === "rectangular") {
    return Math.pow(Q * Q / (g * width * width), 1 / 3);
  }
  let lo = 0.01, hi = shape === "circular" ? diameter : 10;
  for (let iter = 0; iter < 50; iter++) {
    const mid = (lo + hi) / 2;
    const geo = computeGeometry(shape, mid, width, sideSlope, diameter);
    const Vc = geo.A > 0 ? Q / geo.A : 0;
    const Dc = geo.T > 0 ? geo.A / geo.T : 0;
    const FrC = Dc > 0 ? Vc / Math.sqrt(g * Dc) : 0;
    if (FrC > 1) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

// ─── Specific Energy & Momentum ─────────────────────────────

/**
 * Generate E-y and M-y diagram data.
 */
export const generateEnergyMomentumCurve = (
  q: number,
  maxY: number = 6,
  step: number = 0.05
): { y: number; E: number; M: number }[] => {
  const pts: { y: number; E: number; M: number }[] = [];
  for (let y = 0.1; y <= maxY; y += step) {
    const V = q / y;
    const E = y + V * V / (2 * g);
    const M = q * q / (g * y) + y * y / 2;
    pts.push({ y: +y.toFixed(2), E: +E.toFixed(3), M: +M.toFixed(3) });
  }
  return pts;
};

/**
 * Compute specific energy, momentum, conjugate depth, and hydraulic jump properties.
 */
export const computeSpecificEnergy = (q: number, y1: number): SpecificEnergyResult => {
  const yc = Math.pow(q * q / g, 1 / 3);
  const Emin = 1.5 * yc;
  const V1 = q / y1;
  const E1 = y1 + V1 * V1 / (2 * g);
  const M1 = q * q / (g * y1) + y1 * y1 / 2;
  const Fr1 = V1 / Math.sqrt(g * y1);

  // Conjugate (sequent) depth
  const y2 = (y1 / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
  const V2 = q / y2;
  const Fr2 = V2 / Math.sqrt(g * y2);
  const E2 = y2 + V2 * V2 / (2 * g);
  const energyLoss = E1 - E2;

  const jumpType = Fr1 < 1 ? "N/A (subcritical)"
    : Fr1 < 1.7 ? "Undular"
    : Fr1 < 2.5 ? "Weak"
    : Fr1 < 4.5 ? "Oscillating"
    : Fr1 < 9 ? "Steady"
    : "Strong";

  const efficiency = E1 > 0 ? ((E1 - Math.abs(energyLoss)) / E1 * 100) : 0;

  return { E: E1, M: M1, V: V1, Fr: Fr1, yc, Emin, y2, V2, Fr2, E2, energyLoss, jumpType, efficiency };
};

// ─── Wave Propagation ───────────────────────────────────────

/**
 * Compute kinematic and dynamic wave celerities.
 */
export const computeWaveCelerity = (
  depth: number,
  manningN: number,
  slope: number,
  beta: number = 5 / 3
): WaveCelerityResult => {
  const R = depth; // wide channel approximation
  const V = (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
  const Fr = V / Math.sqrt(g * depth);
  const ck = beta * V;
  const cd_plus = V + Math.sqrt(g * depth);
  const cd_minus = V - Math.sqrt(g * depth);
  const Ved = (beta - 1) * Fr;
  return { V, Fr, ck, cd_plus, cd_minus, Ved };
};

// ─── GVF Profile Classification ─────────────────────────────

/**
 * Compute normal depth by iteration (rectangular channel).
 */
export const computeNormalDepth = (
  Q: number,
  width: number,
  manningN: number,
  slope: number
): number => {
  if (slope <= 0) return Infinity;
  for (let y = 0.01; y < 20; y += 0.01) {
    const A = width * y;
    const P = width + 2 * y;
    const R = A / P;
    const Qn = (1 / manningN) * A * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
    if (Qn >= Q) return +y.toFixed(3);
  }
  return 20;
};

/**
 * Classify GVF profile based on channel properties and boundary condition.
 */
export const classifyGVFProfile = (
  Q: number,
  width: number,
  manningN: number,
  slope: number,
  boundary: BoundaryType,
  slopeCategory: SlopeCategory = "mild"
): GVFResult => {
  const yn = computeNormalDepth(Q, width, manningN, slope);
  const yc = Math.pow(Q * Q / (g * width * width), 1 / 3);

  let slopeType: string;
  if (slope <= 0) slopeType = slopeCategory === "adverse" ? "Adverse" : "Horizontal";
  else if (Math.abs(yn - yc) < 0.05) slopeType = "Critical";
  else slopeType = yn > yc ? "Mild" : "Steep";

  const profiles: string[] = [];
  switch (slopeType) {
    case "Mild": profiles.push("M1", "M2", "M3"); break;
    case "Steep": profiles.push("S1", "S2", "S3"); break;
    case "Critical": profiles.push("C1", "C3"); break;
    case "Horizontal": profiles.push("H2", "H3"); break;
    case "Adverse": profiles.push("A2", "A3"); break;
  }

  let activeProfile = profiles[0];
  if (slopeType === "Mild") {
    if (boundary === "dam") activeProfile = "M1";
    else if (boundary === "free-overfall") activeProfile = "M2";
    else if (boundary === "gate") activeProfile = "M3";
  } else if (slopeType === "Steep") {
    if (boundary === "dam") activeProfile = "S1";
    else if (boundary === "free-overfall") activeProfile = "S2";
    else if (boundary === "gate") activeProfile = "S3";
  }

  return { yn, yc, slopeType, activeProfile, profiles };
};
