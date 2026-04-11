/**
 * Unit Hydrograph & Rational Method — Pure calculation functions
 *
 * Covers: SCS triangular/curvilinear UH, Snyder UH,
 * storm hydrograph superposition, Rational Method Q=CiA.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export type UHType = "scs-triangular" | "scs-curvilinear" | "snyder";

export interface UHParams {
  area: number;     // km²
  tc: number;       // Time of concentration (hours)
  duration: number;  // UH duration (hours)
}

export interface UHResult {
  tp: number;   // Time to peak (hours)
  tb: number;   // Base time (hours)
  Qp: number;   // Peak unit flow (m³/s/mm)
  ordinates: number[];
}

export interface CompositePoint {
  time: number;
  total: number;
  [key: string]: number;
}

export interface IdfParams {
  a: number;
  b: number;
}

export interface RationalMethodResult {
  intensity: number;  // mm/hr
  Q: number;          // m³/s
}

// ─── Constants ──────────────────────────────────────────────

export const IDF_PARAMS: Record<number, IdfParams> = {
  2: { a: 800, b: 10 },
  5: { a: 1200, b: 10 },
  10: { a: 1500, b: 10 },
  25: { a: 1900, b: 10 },
  50: { a: 2200, b: 10 },
  100: { a: 2500, b: 10 },
};

export const RUNOFF_COEFFICIENTS: Record<string, number> = {
  "Asphalt/Concrete": 0.90,
  "Commercial": 0.85,
  "Industrial": 0.75,
  "Residential (dense)": 0.65,
  "Residential (suburban)": 0.40,
  "Parkland": 0.25,
  "Forest": 0.15,
  "Agricultural": 0.30,
};

// ─── Unit Hydrograph ────────────────────────────────────────

/**
 * Generate unit hydrograph ordinates.
 */
export const generateUH = (
  type: UHType,
  area: number,
  tc: number,
  duration: number
): UHResult => {
  const tp = tc * 0.6 + duration / 2;
  const tb = 2.67 * tp;
  const Qp = 2.08 * area / tp;

  const ordinates: number[] = [];
  for (let t = 0; t <= tb * 1.5; t += duration) {
    let q = 0;
    const tRatio = t / tp;
    switch (type) {
      case "scs-triangular":
        if (t <= tp) q = Qp * tRatio;
        else if (t <= tb) q = Qp * (1 - (t - tp) / (tb - tp));
        break;
      case "scs-curvilinear":
        q = Qp * Math.pow(tRatio, 3) * Math.exp(-3 * (tRatio - 1));
        if (q < 0) q = 0;
        break;
      case "snyder": {
        const Cp = 0.6;
        q = Cp * Qp * Math.pow(tRatio, 2) * Math.exp(-2 * (tRatio - 1));
        break;
      }
    }
    ordinates.push(Math.max(0, +q.toFixed(2)));
  }

  return { tp, tb, Qp, ordinates };
};

/**
 * Build composite storm hydrograph via superposition.
 */
export const buildCompositeHydrograph = (
  uhOrdinates: number[],
  rainfallBars: number[],
  duration: number
): CompositePoint[] => {
  const totalSteps = uhOrdinates.length + rainfallBars.length;
  const composite: CompositePoint[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const entry: CompositePoint = { time: +(i * duration).toFixed(1), total: 0 };
    for (let j = 0; j < rainfallBars.length; j++) {
      const uhIdx = i - j;
      const q = uhIdx >= 0 && uhIdx < uhOrdinates.length
        ? uhOrdinates[uhIdx] * rainfallBars[j] / 1000 : 0;
      entry[`r${j}`] = +q.toFixed(1);
      entry.total += q;
    }
    entry.total = +entry.total.toFixed(1);
    composite.push(entry);
  }
  return composite;
};

// ─── Rational Method ────────────────────────────────────────

/**
 * Compute IDF intensity for given return period and duration.
 * i = a / (tc + b)
 */
export const computeIdfIntensity = (returnPeriod: number, tc: number): number => {
  const p = IDF_PARAMS[returnPeriod] || IDF_PARAMS[25];
  return p.a / (tc + p.b);
};

/**
 * Compute peak discharge using the Rational Method.
 * Q = CiA/360 (metric)
 */
export const computeRationalMethod = (
  C: number,
  returnPeriod: number,
  tc: number,
  area: number
): RationalMethodResult => {
  const intensity = computeIdfIntensity(returnPeriod, tc);
  const Q = C * intensity * area / 360;
  return { intensity, Q };
};

/**
 * Generate IDF curve data for all return periods.
 */
export const generateIdfCurves = (
  maxDuration: number = 180,
  step: number = 5
): { duration: number; [key: string]: number }[] => {
  const data: { duration: number; [key: string]: number }[] = [];
  for (let d = step; d <= maxDuration; d += step) {
    const entry: { duration: number; [key: string]: number } = { duration: d };
    Object.entries(IDF_PARAMS).forEach(([T, p]) => {
      entry[`T${T}`] = +(p.a / (d + p.b)).toFixed(1);
    });
    data.push(entry);
  }
  return data;
};
