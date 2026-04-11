/**
 * Stable Channel Design — Pure calculation functions
 *
 * Covers: Lacey regime equations, tractive force method,
 * shear stress analysis, channel stability assessment.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export type CrossSectionShape = "trapezoidal" | "rectangular" | "parabolic" | "triangular";

export interface BankMaterial {
  value: string;
  label: string;
  n: number;
  angle: number;
}

export interface BedMaterial {
  name: string;
  tau_c: number;  // Critical shear stress (Pa)
  n: number;      // Manning's n
}

export interface BankMaterialData {
  name: string;
  tau_c: number;
  angle: number;  // Angle of repose (degrees)
}

export interface StableChannelResult {
  width: number;
  depth: number;
  area: number;
  wettedPerimeter: number;
  hydraulicRadius: number;
  velocity: number;
  calculatedQ: number;
  froude: number;
  shearStress: number;
  criticalShearStress: number;
  stabilityRatio: number;
  stabilityStatus: "stable" | "marginal" | "unstable";
  beta: number;
  widthDepthRatio: number;
  siltFactor: number;
}

export interface TractiveForceResult {
  d: number;           // Design depth (m)
  b: number;           // Bottom width (m)
  A: number;           // Area (m²)
  P: number;           // Wetted perimeter (m)
  R: number;           // Hydraulic radius (m)
  V: number;           // Velocity (m/s)
  T: number;           // Top width (m)
  Fr: number;          // Froude number
  K: number;           // Bank shear reduction factor
  tauActualBed: number;
  tauActualBank: number;
  tauBed: number;      // Permissible bed shear (Pa)
  tauBankEffective: number;
  fsBed: number;       // Factor of safety - bed
  fsBank: number;      // Factor of safety - bank
  dMax: number;
  dMaxBed: number;
  totalDepth: number;
}

// ─── Constants ──────────────────────────────────────────────

export const BANK_MATERIALS: BankMaterial[] = [
  { value: "sand", label: "Sand (loose)", n: 0.025, angle: 26 },
  { value: "gravel", label: "Gravel", n: 0.028, angle: 32 },
  { value: "cobbles", label: "Cobbles", n: 0.035, angle: 38 },
  { value: "clay", label: "Clay (stiff)", n: 0.022, angle: 45 },
  { value: "vegetated", label: "Vegetated", n: 0.040, angle: 35 },
  { value: "riprap", label: "Riprap", n: 0.045, angle: 40 },
];

export const BED_MATERIALS_MAP: Record<string, BedMaterial> = {
  "fine-sand": { name: "Fine Sand (D50=0.4mm)", tau_c: 1.2, n: 0.020 },
  "medium-sand": { name: "Medium Sand (D50=1mm)", tau_c: 2.4, n: 0.025 },
  "coarse-sand": { name: "Coarse Sand (D50=2mm)", tau_c: 3.6, n: 0.028 },
  "fine-gravel": { name: "Fine Gravel (D50=8mm)", tau_c: 7.2, n: 0.030 },
  "medium-gravel": { name: "Medium Gravel (D50=25mm)", tau_c: 14.4, n: 0.033 },
  "coarse-gravel": { name: "Coarse Gravel (D50=75mm)", tau_c: 38.0, n: 0.040 },
};

export const BANK_MATERIALS_MAP: Record<string, BankMaterialData> = {
  "fine-sand": { name: "Fine Sand", tau_c: 1.2, angle: 28 },
  "medium-sand": { name: "Medium Sand", tau_c: 2.4, angle: 32 },
  "coarse-sand": { name: "Coarse Sand", tau_c: 3.6, angle: 34 },
  "fine-gravel": { name: "Fine Gravel", tau_c: 7.2, angle: 36 },
  "medium-gravel": { name: "Medium Gravel", tau_c: 14.4, angle: 38 },
  "cohesive-clay": { name: "Cohesive Clay", tau_c: 12.5, angle: 45 },
  "stiff-clay": { name: "Stiff Clay", tau_c: 25.0, angle: 50 },
};

// ─── Stable Channel (Regime Theory) ────────────────────────

/**
 * Design a stable channel using Lacey's regime equations.
 */
export const designStableChannel = (
  Q: number,
  S: number,
  sedimentSizeMm: number,
  n: number,
  z: number,
  shape: CrossSectionShape
): StableChannelResult => {
  const d50 = sedimentSizeMm / 1000;
  const f = 1.76 * Math.sqrt(d50 * 1000);
  const P = 4.75 * Math.sqrt(Q);
  const R = 0.47 * Math.pow(Q / f, 1 / 3);
  const A = P * R;

  let width: number, depth: number, area: number, wettedPerimeter: number;

  switch (shape) {
    case "rectangular":
      depth = Math.pow(A / 2, 1 / 3);
      width = 2 * depth;
      area = width * depth;
      wettedPerimeter = width + 2 * depth;
      break;
    case "triangular":
      depth = Math.pow(A / z, 0.5);
      width = 2 * z * depth;
      area = z * depth * depth;
      wettedPerimeter = 2 * depth * Math.sqrt(1 + z * z);
      break;
    case "parabolic":
      depth = Math.pow(3 * A / 4, 1 / 3);
      width = 1.5 * A / depth;
      area = (2 / 3) * width * depth;
      wettedPerimeter = width + (8 * depth * depth) / (3 * width);
      break;
    case "trapezoidal":
    default:
      depth = R * 1.1;
      width = A / depth - z * depth;
      if (width < 0) width = Math.sqrt(A);
      area = (width + z * depth) * depth;
      wettedPerimeter = width + 2 * depth * Math.sqrt(1 + z * z);
      break;
  }

  const hydraulicRadius = area / wettedPerimeter;
  const velocity = (1 / n) * Math.pow(hydraulicRadius, 2 / 3) * Math.pow(S, 0.5);
  const calculatedQ = velocity * area;
  const froude = velocity / Math.sqrt(9.81 * depth);
  const shearStress = 9810 * hydraulicRadius * S;
  const criticalShearStress = 0.047 * (2650 - 1000) * 9.81 * d50;
  const stabilityRatio = criticalShearStress / shearStress;

  let stabilityStatus: "stable" | "marginal" | "unstable";
  if (stabilityRatio > 1.3) stabilityStatus = "stable";
  else if (stabilityRatio > 0.9) stabilityStatus = "marginal";
  else stabilityStatus = "unstable";

  const beta = shape === "rectangular" ? 5 / 3
    : shape === "triangular" ? 8 / 3
    : shape === "parabolic" ? 7 / 3
    : 5 / 3 + 0.5;

  return {
    width: Math.max(0.5, width),
    depth: Math.max(0.1, depth),
    area: Math.max(0.1, area),
    wettedPerimeter: Math.max(0.5, wettedPerimeter),
    hydraulicRadius: Math.max(0.05, hydraulicRadius),
    velocity: Math.max(0.1, velocity),
    calculatedQ, froude, shearStress, criticalShearStress,
    stabilityRatio, stabilityStatus, beta,
    widthDepthRatio: Math.max(0.5, width) / Math.max(0.1, depth),
    siltFactor: f,
  };
};

// ─── Tractive Force Method ─────────────────────────────────

/**
 * Design a stable channel using the tractive force (permissible shear stress) method.
 */
export const designTractiveForce = (
  Q: number,
  slope: number,
  sideSlope: number,
  freeboard: number,
  bed: BedMaterial,
  bank: BankMaterialData
): TractiveForceResult => {
  const gamma = 9810;
  const g = 9.81;
  const z = sideSlope;
  const S = slope;
  const n = bed.n;
  const tauBed = bed.tau_c;
  const tauBank = bank.tau_c;
  const phi = bank.angle * (Math.PI / 180);
  const theta = Math.atan(1 / z);
  const K = Math.sqrt(1 - Math.sin(theta) ** 2 / Math.sin(phi) ** 2);
  const tauBankEffective = tauBank * K;

  const dMax = tauBankEffective / (0.75 * gamma * S);
  const dMaxBed = tauBed / (gamma * S);
  const d = Math.min(dMax, dMaxBed);

  // Iteratively solve for bottom width
  let b = 1;
  for (let i = 0; i < 100; i++) {
    const A = (b + z * d) * d;
    const P = b + 2 * d * Math.sqrt(1 + z * z);
    const R = A / P;
    const Qc = (1 / n) * A * Math.pow(R, 2 / 3) * Math.pow(S, 0.5);
    if (Math.abs(Qc - Q) < 0.01) break;
    b += (Q - Qc) * 0.1;
    if (b < 0.5) { b = 0.5; break; }
  }
  b = Math.max(b, 0.5);

  const A = (b + z * d) * d;
  const P = b + 2 * d * Math.sqrt(1 + z * z);
  const R = A / P;
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.pow(S, 0.5);
  const T = b + 2 * z * d;
  const D = A / T;
  const Fr = V / Math.sqrt(g * D);

  const tauActualBed = gamma * d * S;
  const tauActualBank = 0.75 * gamma * d * S;
  const fsBed = tauBed / tauActualBed;
  const fsBank = tauBankEffective / tauActualBank;

  return {
    d: Math.max(d, 0.1), b: Math.max(b, 0.5),
    A, P, R, V, T, Fr, K,
    tauActualBed, tauActualBank,
    tauBed, tauBankEffective,
    fsBed: isFinite(fsBed) ? fsBed : 0,
    fsBank: isFinite(fsBank) ? fsBank : 0,
    dMax, dMaxBed,
    totalDepth: Math.max(d, 0.1) + freeboard,
  };
};
