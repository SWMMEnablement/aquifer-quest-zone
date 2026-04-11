/**
 * Groundwater Hydrology — Pure calculation functions
 *
 * Covers: Theis well function, drawdown, groundwater simulation,
 * groundwater recharge (catchment wetting method).
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export interface DrawdownResult {
  u: number;
  W: number;    // Well function W(u)
  s: number;    // Drawdown (m)
}

export interface SimulationStep {
  year: number;
  storage: number;
  waterTable: number;
  ecosystemHealth: number;
  cumulativePumping: number;
  cumulativeRecharge: number;
}

export interface RechargeResult {
  precipitation: number;
  interception: number;
  effectiveP: number;
  PET: number;
  AET: number;
  surfaceRunoff: number;
  wetting: number;
  recharge: number;
  rechargeCoeff: number;
  baseflow: number;
}

export interface LandCoverRecharge {
  name: string;
  interception: number;
  etFactor: number;
}

export interface SoilTypeRecharge {
  name: string;
  infiltCapacity: number;
  fieldCapacity: number;
}

// ─── Helpers ────────────────────────────────────────────────

const factorial = (n: number): number => {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
};

// ─── Theis Well Function ────────────────────────────────────

/**
 * Compute the Theis well function W(u) using series expansion.
 *
 * W(u) = -γ - ln(u) + Σ (-1)^n × u^n / (n × n!)
 */
export const wellFunction = (u: number): number => {
  if (u <= 0) return 20;
  if (u > 10) return 0;
  let W = -0.5772 - Math.log(u);
  let term = u;
  for (let n = 1; n <= 20; n++) {
    W += (n % 2 === 1 ? -1 : 1) * term / (n * factorial(n));
    term *= u;
  }
  return Math.max(0, W);
};

/**
 * Compute Theis drawdown at a given distance and time.
 *
 * s = Q/(4πT) × W(u), where u = r²S/(4Tt)
 */
export const computeDrawdown = (
  Q: number,   // Pumping rate (m³/day)
  T: number,   // Transmissivity (m²/day)
  S: number,   // Storativity
  r: number,   // Distance (m)
  t: number    // Time (days)
): DrawdownResult => {
  const u = (r * r * S) / (4 * T * t);
  const W = wellFunction(u);
  const s = (Q / (4 * Math.PI * T)) * W;
  return { u, W, s };
};

/**
 * Generate drawdown cross-section data for multiple distances.
 */
export const generateDrawdownProfile = (
  Q: number, T: number, S: number, t: number,
  maxR: number = 2000
): { r: number; s: number; negS: number }[] => {
  const data: { r: number; s: number; negS: number }[] = [];
  for (let r = 1; r <= maxR; r += (r < 100 ? 5 : r < 500 ? 20 : 50)) {
    const { s } = computeDrawdown(Q, T, S, r, t);
    data.push({ r, s: +s.toFixed(3), negS: +(-s).toFixed(3) });
  }
  return data;
};

/**
 * Generate W(u) type curve data.
 */
export const generateWellFunctionCurve = (): { u: string; W: number; logU: number }[] => {
  const data: { u: string; W: number; logU: number }[] = [];
  for (let logU = -6; logU <= 2; logU += 0.2) {
    const u = Math.pow(10, logU);
    const W = wellFunction(u);
    data.push({ u: u.toExponential(2), W: +W.toFixed(4), logU: +logU.toFixed(1) });
  }
  return data;
};

// ─── Groundwater Simulation ─────────────────────────────────

/**
 * Compute a single simulation step for the aquifer management game.
 */
export const simulateAquiferStep = (
  prev: SimulationStep,
  rechargeRate: number,
  pumpingRate: number,
  aquiferArea: number,
  specificYield: number,
  maxWaterTable: number
): SimulationStep => {
  const netChange = rechargeRate - pumpingRate;
  const newStorage = Math.max(0, prev.storage + netChange);
  const newWaterTable = newStorage / (aquiferArea * specificYield);

  const criticalDepth = maxWaterTable * 0.3;
  const optimalDepth = maxWaterTable * 0.7;

  let newHealth = prev.ecosystemHealth;
  if (newWaterTable < criticalDepth) {
    newHealth = Math.max(0, prev.ecosystemHealth - (criticalDepth - newWaterTable) / criticalDepth * 15);
  } else if (newWaterTable < optimalDepth) {
    newHealth = Math.max(0, prev.ecosystemHealth - 2);
  } else if (prev.ecosystemHealth < 100) {
    newHealth = Math.min(100, prev.ecosystemHealth + 1);
  }

  return {
    year: prev.year + 1,
    storage: Math.round(newStorage * 10) / 10,
    waterTable: Math.round(newWaterTable * 100) / 100,
    ecosystemHealth: Math.round(newHealth * 10) / 10,
    cumulativePumping: prev.cumulativePumping + pumpingRate,
    cumulativeRecharge: prev.cumulativeRecharge + rechargeRate,
  };
};

/**
 * Compute sustainable yield (recharge minus ecosystem baseflow needs).
 */
export const computeSustainableYield = (rechargeRate: number): number => {
  const baseflowNeed = rechargeRate * 0.3;
  return rechargeRate - baseflowNeed;
};

// ─── Groundwater Recharge (Catchment Wetting) ───────────────

/**
 * Compute Thornthwaite-style PET estimate.
 */
export const computeThornthwaitePET = (monthlyTemp: number): number => {
  if (monthlyTemp <= 0) return 0;
  const I = 12 * Math.pow(monthlyTemp / 5, 1.514);
  const a = 6.75e-7 * I ** 3 - 7.71e-5 * I ** 2 + 1.792e-2 * I + 0.49239;
  return 12 * 16 * Math.pow((10 * monthlyTemp) / I, a);
};

/**
 * Compute groundwater recharge using the catchment wetting method.
 */
export const computeRecharge = (
  precipitation: number,
  temperature: number,
  landCover: LandCoverRecharge,
  soil: SoilTypeRecharge
): RechargeResult => {
  const interception = precipitation * landCover.interception;
  const effectiveP = precipitation - interception;

  const PET = computeThornthwaitePET(temperature);
  const AET = Math.min(PET * landCover.etFactor, effectiveP * 0.9);

  const surfaceRunoff = effectiveP * (1 - soil.infiltCapacity) * 0.6;
  const wetting = effectiveP - surfaceRunoff;
  const recharge = Math.max(wetting - AET, 0);
  const rechargeCoeff = precipitation > 0 ? recharge / precipitation : 0;
  const baseflow = recharge * 0.7;

  return {
    precipitation, interception, effectiveP,
    PET: Math.round(PET), AET: Math.round(AET),
    surfaceRunoff: Math.round(surfaceRunoff),
    wetting: Math.round(wetting),
    recharge: Math.round(recharge),
    rechargeCoeff,
    baseflow: Math.round(baseflow),
  };
};

/**
 * Generate recharge sensitivity data (φ vs P).
 */
export const generateRechargeSensitivity = (
  temperature: number,
  landCover: LandCoverRecharge,
  soil: SoilTypeRecharge,
  maxP: number = 3000
): { P: number; phi: number; recharge: number }[] => {
  return Array.from({ length: 30 }, (_, i) => {
    const pp = 100 + i * 100;
    const result = computeRecharge(pp, temperature, landCover, soil);
    return { P: pp, phi: +(result.rechargeCoeff).toFixed(3), recharge: result.recharge };
  });
};
