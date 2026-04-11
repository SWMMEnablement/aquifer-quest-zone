/**
 * Water Balance & Hydro-Ecology — Pure calculation functions
 *
 * Covers: Catchment water balance (P = ET + Qs + Qb + ΔS),
 * hydro-ecological impact assessment.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export interface CatchmentBalanceResult {
  PET: number;
  ET: number;
  Qs: number;
  Qb: number;
  deltaS: number;
}

export interface MonthlyBalance {
  month: string;
  P: number;
  ET: number;
  Qs: number;
  Qb: number;
}

export interface LandUseType {
  id: string;
  name: string;
  baseFlow: number;
  runoff: number;
  habitat: number;
  pollution: number;
}

export interface WatershedMetrics {
  totalPrecip: number;
  evapotranspiration: number;
  runoffVolume: number;
  baseflowVolume: number;
  totalStreamflow: number;
  availableFlow: number;
  flowHealth: number;
  waterQuality: number;
  habitatConnectivity: number;
  fishHealth: number;
  birdHealth: number;
  riparianHealth: number;
  overallEcosystemHealth: number;
  weightedRunoff: number;
}

// ─── Constants ──────────────────────────────────────────────

export const LAND_USE_TYPES: LandUseType[] = [
  { id: "forest", name: "Forest", baseFlow: 0.8, runoff: 0.1, habitat: 1.0, pollution: 0.05 },
  { id: "wetland", name: "Wetland", baseFlow: 0.9, runoff: 0.15, habitat: 0.95, pollution: 0.02 },
  { id: "agriculture", name: "Agriculture", baseFlow: 0.4, runoff: 0.35, habitat: 0.3, pollution: 0.5 },
  { id: "urban", name: "Urban", baseFlow: 0.1, runoff: 0.85, habitat: 0.1, pollution: 0.7 },
  { id: "industrial", name: "Industrial", baseFlow: 0.05, runoff: 0.9, habitat: 0.05, pollution: 0.9 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Catchment Water Balance ────────────────────────────────

/**
 * Compute Thornthwaite PET (simplified).
 */
export const computeThornthwaitePET = (temp: number): number => {
  if (temp <= 0) return 0;
  const I = Math.pow(temp / 5, 1.514) * 12;
  const a = 6.75e-7 * I ** 3 - 7.71e-5 * I ** 2 + 1.79e-2 * I + 0.49;
  return 16 * Math.pow(10 * temp / I, a) * 12;
};

/**
 * Compute annual catchment water balance.
 */
export const computeCatchmentBalance = (
  P: number,
  temp: number,
  forestPct: number,
  urbanPct: number
): CatchmentBalanceResult => {
  const agPct = 100 - forestPct - urbanPct;
  const PET = computeThornthwaitePET(temp);

  const cropCoeff = (forestPct * 1.1 + agPct * 0.9 + urbanPct * 0.3) / 100;
  const ET = Math.min(P * 0.95, PET * cropCoeff);

  const runoffCoeff = (forestPct * 0.1 + agPct * 0.3 + urbanPct * 0.8) / 100;
  const Qs = P * runoffCoeff;

  const Qb = Math.max(0, P - ET - Qs) * 0.6;
  const deltaS = P - ET - Qs - Qb;

  return { PET, ET, Qs, Qb, deltaS };
};

/**
 * Generate monthly water balance distribution (sinusoidal approximation).
 */
export const generateMonthlyBalance = (
  P: number, ET: number, Qs: number, Qb: number
): MonthlyBalance[] => {
  return MONTHS.map((m, i) => {
    const pFrac = 1 + 0.5 * Math.sin((i - 3) * Math.PI / 6);
    const etFrac = 1 + 0.7 * Math.sin((i - 2) * Math.PI / 6);
    return {
      month: m,
      P: +((P / 12) * pFrac).toFixed(0),
      ET: +((ET / 12) * etFrac).toFixed(0),
      Qs: +((Qs / 12) * pFrac * 1.2).toFixed(0),
      Qb: +((Qb / 12) * (1 + 0.3 * Math.sin((i - 4) * Math.PI / 6))).toFixed(0),
    };
  });
};

// ─── Hydro-Ecological Impact ────────────────────────────────

/**
 * Compute watershed ecosystem metrics from land use distribution.
 */
export const computeWatershedMetrics = (
  landUseDistribution: Record<string, number>,
  precipitation: number,
  waterDiversion: number
): WatershedMetrics => {
  let weightedBaseFlow = 0;
  let weightedRunoff = 0;
  let weightedHabitat = 0;
  let weightedPollution = 0;

  LAND_USE_TYPES.forEach(lu => {
    const fraction = (landUseDistribution[lu.id] || 0) / 100;
    weightedBaseFlow += lu.baseFlow * fraction;
    weightedRunoff += lu.runoff * fraction;
    weightedHabitat += lu.habitat * fraction;
    weightedPollution += lu.pollution * fraction;
  });

  const totalPrecip = precipitation;
  const evapotranspiration = totalPrecip * (0.4 + 0.3 * ((landUseDistribution.forest || 0) + (landUseDistribution.wetland || 0)) / 100);
  const effectivePrecip = totalPrecip - evapotranspiration;

  const runoffVolume = effectivePrecip * weightedRunoff;
  const baseflowVolume = effectivePrecip * (1 - weightedRunoff) * weightedBaseFlow;
  const totalStreamflow = runoffVolume + baseflowVolume;

  const availableFlow = totalStreamflow * (1 - waterDiversion / 100);

  const flowHealth = Math.min(1, availableFlow / (totalStreamflow * 0.7));
  const waterQuality = 1 - weightedPollution * 0.8;
  const habitatConnectivity = weightedHabitat * (1 - waterDiversion / 200);

  const fishHealth = flowHealth * waterQuality * 0.8 + habitatConnectivity * 0.2;
  const birdHealth = habitatConnectivity * 0.6 + waterQuality * 0.4;
  const riparianHealth = flowHealth * 0.5 + habitatConnectivity * 0.5;

  const overallEcosystemHealth = (fishHealth + birdHealth + riparianHealth + waterQuality) / 4;

  return {
    totalPrecip, evapotranspiration, runoffVolume, baseflowVolume,
    totalStreamflow, availableFlow, flowHealth, waterQuality,
    habitatConnectivity, fishHealth, birdHealth, riparianHealth,
    overallEcosystemHealth, weightedRunoff,
  };
};
