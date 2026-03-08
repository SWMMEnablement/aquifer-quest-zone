/**
 * SCS Curve Number Method — Pure calculation functions
 *
 * Based on the work of Prof. Victor Miguel Ponce, SDSU
 * Reference: https://ponce.sdsu.edu/
 *
 * All units in inches unless otherwise noted.
 */

// ─── Lookup Tables ───────────────────────────────────────────────

/** Curve Number lookup table by land use and hydrologic soil group */
export const CN_TABLE: Record<string, Record<string, number>> = {
  "open-space-good": { A: 39, B: 61, C: 74, D: 80 },
  "open-space-fair": { A: 49, B: 69, C: 79, D: 84 },
  "open-space-poor": { A: 68, B: 79, C: 86, D: 89 },
  residential: { A: 61, B: 75, C: 83, D: 87 },
  commercial: { A: 89, B: 92, C: 94, D: 95 },
  industrial: { A: 81, B: 88, C: 91, D: 93 },
  agricultural: { A: 67, B: 78, C: 85, D: 89 },
  forest: { A: 30, B: 55, C: 70, D: 77 },
  meadow: { A: 30, B: 58, C: 71, D: 78 },
  paved: { A: 98, B: 98, C: 98, D: 98 },
};

/** Human-readable labels for land use types */
export const LAND_USE_LABELS: Record<string, string> = {
  "open-space-good": "Open Space (Good Condition)",
  "open-space-fair": "Open Space (Fair Condition)",
  "open-space-poor": "Open Space (Poor Condition)",
  residential: "Residential (1/4 acre lots)",
  commercial: "Commercial/Business",
  industrial: "Industrial",
  agricultural: "Agricultural (Row Crops)",
  forest: "Forest (Good Cover)",
  meadow: "Meadow",
  paved: "Paved/Impervious",
};

/** Descriptions for hydrologic soil groups */
export const SOIL_DESCRIPTIONS: Record<string, string> = {
  A: "Low runoff potential, high infiltration (sand, loamy sand)",
  B: "Moderate infiltration (silt loam, loam)",
  C: "Slow infiltration (sandy clay loam)",
  D: "High runoff potential, very slow infiltration (clay)",
};

/** AMC condition labels (1-indexed to match AMC I/II/III) */
export const AMC_LABELS = ["", "I (Dry)", "II (Normal)", "III (Wet)"];

// ─── Constants ───────────────────────────────────────────────────

/** Ratio of initial abstraction to potential maximum retention (Ia = λ × S) */
const INITIAL_ABSTRACTION_RATIO = 0.2;

/** Default CN used when lookup fails */
const DEFAULT_CN = 75;

// ─── Core Calculations ──────────────────────────────────────────

/**
 * Look up the base Curve Number from the CN table.
 * Returns DEFAULT_CN if the land use / soil combination is not found.
 */
export const lookupCN = (landUse: string, soilType: string): number => {
  return CN_TABLE[landUse]?.[soilType] ?? DEFAULT_CN;
};

/**
 * Adjust CN for Antecedent Moisture Condition (AMC).
 *
 * AMC I  (dry)    — Eq. from SCS NEH-4, Section 4
 * AMC II (normal) — no adjustment
 * AMC III (wet)   — Eq. from SCS NEH-4, Section 4
 *
 * @param cn  Base Curve Number (AMC II)
 * @param amc AMC class: 1 (dry), 2 (normal), or 3 (wet)
 */
export const adjustCNForAMC = (cn: number, amc: number): number => {
  if (amc === 1) {
    // Dry conditions — AMC I
    return (4.2 * cn) / (10 - 0.058 * cn);
  }
  if (amc === 3) {
    // Wet conditions — AMC III
    return (23 * cn) / (10 + 0.13 * cn);
  }
  return cn; // AMC II — normal
};

/**
 * Calculate potential maximum retention S from Curve Number.
 * S = (1000 / CN) − 10   [inches]
 */
export const calculateRetention = (cn: number): number => {
  return 1000 / cn - 10;
};

/**
 * Calculate initial abstraction Ia from retention S.
 * Ia = λ × S  where λ = 0.2 (standard SCS assumption)
 */
export const calculateInitialAbstraction = (S: number): number => {
  return INITIAL_ABSTRACTION_RATIO * S;
};

/**
 * SCS Runoff Equation.
 * Q = (P − Ia)² / (P − Ia + S)   when P > Ia, else 0
 *
 * @param P  Precipitation depth [inches]
 * @param S  Potential maximum retention [inches]
 * @param Ia Initial abstraction [inches]
 * @returns  Direct runoff depth [inches]
 */
export const calculateRunoff = (P: number, S: number, Ia: number): number => {
  if (P <= Ia) return 0;
  return Math.pow(P - Ia, 2) / (P - Ia + S);
};

// ─── Result Interfaces ──────────────────────────────────────────

export interface CNResults {
  /** Base CN from lookup table (AMC II) */
  baseCN: number;
  /** CN adjusted for selected AMC */
  adjustedCN: number;
  /** Potential maximum retention S [inches] */
  S: number;
  /** Initial abstraction Ia [inches] */
  Ia: number;
  /** Direct runoff depth Q [inches] */
  runoff: number;
  /** Infiltration depth (P − Q) [inches] */
  infiltration: number;
  /** Runoff as percentage of rainfall */
  runoffPercent: number;
}

export interface SensitivityPoint {
  cn: number;
  runoff: number;
  isCurrent: boolean;
}

export interface RainfallRunoffPoint {
  rainfall: number;
  runoff: number;
  isSelected: boolean;
}

// ─── Composite Calculations ─────────────────────────────────────

/**
 * Full CN method calculation pipeline.
 * Takes raw user inputs and returns all results.
 */
export const computeCNResults = (
  landUse: string,
  soilType: string,
  amc: number,
  rainfallDepth: number
): CNResults => {
  const baseCN = lookupCN(landUse, soilType);
  const adjustedCN = adjustCNForAMC(baseCN, amc);
  const S = calculateRetention(adjustedCN);
  const Ia = calculateInitialAbstraction(S);
  const runoff = calculateRunoff(rainfallDepth, S, Ia);
  const infiltration = rainfallDepth - runoff;
  const runoffPercent = rainfallDepth > 0 ? (runoff / rainfallDepth) * 100 : 0;

  return {
    baseCN: Math.round(baseCN),
    adjustedCN: Math.round(adjustedCN * 10) / 10,
    S: Math.round(S * 100) / 100,
    Ia: Math.round(Ia * 100) / 100,
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(infiltration * 100) / 100,
    runoffPercent: Math.round(runoffPercent),
  };
};

/**
 * Generate sensitivity analysis data — shows how runoff changes
 * as CN varies ±15 around the current value.
 */
export const computeSensitivityData = (
  landUse: string,
  soilType: string,
  amc: number,
  rainfallDepth: number
): SensitivityPoint[] => {
  const baseCN = lookupCN(landUse, soilType);
  const data: SensitivityPoint[] = [];

  for (let cnDelta = -15; cnDelta <= 15; cnDelta += 3) {
    const cn = Math.max(30, Math.min(98, baseCN + cnDelta));
    const adjustedCN = adjustCNForAMC(cn, amc);
    const S = calculateRetention(adjustedCN);
    const Ia = calculateInitialAbstraction(S);
    const runoff = calculateRunoff(rainfallDepth, S, Ia);

    data.push({
      cn: Math.round(adjustedCN),
      runoff: Math.round(runoff * 100) / 100,
      isCurrent: cnDelta === 0,
    });
  }

  return data;
};

/**
 * Generate rainfall-runoff curve data for the current CN,
 * sweeping rainfall from 0 to 10 inches.
 */
export const computeRainfallRunoffCurve = (
  landUse: string,
  soilType: string,
  amc: number,
  selectedRainfall: number
): RainfallRunoffPoint[] => {
  const baseCN = lookupCN(landUse, soilType);
  const adjustedCN = adjustCNForAMC(baseCN, amc);
  const S = calculateRetention(adjustedCN);
  const Ia = calculateInitialAbstraction(S);
  const data: RainfallRunoffPoint[] = [];

  for (let P = 0; P <= 10; P += 0.5) {
    const runoff = calculateRunoff(P, S, Ia);
    data.push({
      rainfall: P,
      runoff: Math.round(runoff * 100) / 100,
      isSelected: Math.abs(P - selectedRainfall) < 0.25,
    });
  }

  return data;
};

// ─── Comparison Methods ─────────────────────────────────────────

export interface InfiltrationResult {
  runoff: number;
  infiltration: number;
  description: string;
}

/** Green-Ampt infiltration parameters by hydrologic soil group */
const GREEN_AMPT_PARAMS: Record<string, { K: number; psi: number; theta: number }> = {
  A: { K: 11.78, psi: 4.95, theta: 0.417 },  // Sandy loam
  B: { K: 1.09, psi: 8.89, theta: 0.434 },   // Loam
  C: { K: 0.34, psi: 20.88, theta: 0.476 },  // Clay loam
  D: { K: 0.03, psi: 31.63, theta: 0.475 },  // Clay
};

/** Philip equation parameters by hydrologic soil group */
const PHILIP_PARAMS: Record<string, { S: number; A: number }> = {
  A: { S: 6.0, A: 3.0 },  // High sorptivity sandy soil
  B: { S: 4.0, A: 1.5 },  // Medium loam
  C: { S: 2.0, A: 0.5 },  // Low infiltration clay loam
  D: { S: 0.5, A: 0.1 },  // Very low infiltration clay
};

/** Horton equation parameters by hydrologic soil group */
const HORTON_PARAMS: Record<string, { f0: number; fc: number; k: number }> = {
  A: { f0: 5.0, fc: 1.5, k: 2.0 },  // High initial, high final
  B: { f0: 3.0, fc: 0.8, k: 2.5 },  // Medium
  C: { f0: 1.5, fc: 0.3, k: 3.0 },  // Low
  D: { f0: 0.5, fc: 0.05, k: 4.0 }, // Very low
};

/** Assumed storm duration for comparison methods [hours] */
const STORM_DURATION_HOURS = 2;

/**
 * Green-Ampt infiltration method.
 * Simplified iterative solution assuming uniform rainfall intensity.
 *
 * F = K·t + ψ·θ·ln(1 + F/(ψ·θ))
 */
export const calculateGreenAmpt = (rainfall: number, soilType: string): InfiltrationResult => {
  const p = GREEN_AMPT_PARAMS[soilType] || GREEN_AMPT_PARAMS.B;
  const rainIntensity = rainfall / STORM_DURATION_HOURS;

  let cumInfiltration = 0;
  const dt = 0.1; // 6-min intervals

  for (let t = 0; t < STORM_DURATION_HOURS; t += dt) {
    const potentialRate = p.K * (1 + (p.psi * p.theta) / (cumInfiltration + 0.001));
    const actualRate = Math.min(rainIntensity, potentialRate);
    cumInfiltration += actualRate * dt;
  }

  const runoff = Math.max(0, rainfall - cumInfiltration);

  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(cumInfiltration * 100) / 100,
    description: "Physics-based infiltration using soil hydraulic properties (K, ψ, θ)",
  };
};

/**
 * Philip two-term infiltration equation.
 *
 * Cumulative: F(t) = S·√t + A·t
 * where S = sorptivity, A = steady-state rate
 */
export const calculatePhilip = (rainfall: number, soilType: string): InfiltrationResult => {
  const p = PHILIP_PARAMS[soilType] || PHILIP_PARAMS.B;
  const t = STORM_DURATION_HOURS;

  const cumInfiltration = p.S * Math.sqrt(t) + p.A * t;
  const runoff = Math.max(0, rainfall - cumInfiltration);

  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(Math.min(rainfall, cumInfiltration) * 100) / 100,
    description: "Two-term algebraic equation (sorptivity + steady-state rate)",
  };
};

/**
 * Horton exponential decay infiltration equation.
 *
 * f(t) = fc + (f₀ − fc)·e^(−kt)
 * Cumulative: F(t) = fc·t + (f₀ − fc)/k · (1 − e^(−kt))
 */
export const calculateHorton = (rainfall: number, soilType: string): InfiltrationResult => {
  const p = HORTON_PARAMS[soilType] || HORTON_PARAMS.B;
  const t = STORM_DURATION_HOURS;

  const cumInfiltration = p.fc * t + (p.f0 - p.fc) / p.k * (1 - Math.exp(-p.k * t));
  const runoff = Math.max(0, rainfall - cumInfiltration);

  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(Math.min(rainfall, cumInfiltration) * 100) / 100,
    description: "Exponential decay from initial to final infiltration rate",
  };
};
