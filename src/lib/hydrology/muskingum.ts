/**
 * Muskingum-Cunge Flood Routing — Pure calculation functions
 *
 * Based on the work of Prof. Victor Miguel Ponce, SDSU
 * Reference: https://ponce.sdsu.edu/muskingum_cunge_method_explained.html
 *
 * All units in SI (meters, seconds, m³/s) unless otherwise noted.
 * Time parameters are in hours for user-facing functions.
 */

// ─── Types ──────────────────────────────────────────────────────

export type HydrographType = "triangular" | "trapezoidal" | "scs";

export interface HydrographPoint {
  time: number;   // hours
  inflow: number; // m³/s
}

export interface RoutedPoint {
  time: number;
  inflow: number;
  muskingumOutflow: number;
  kinematicOutflow: number;
}

export interface RoutingCoefficients {
  C0: number;
  C1: number;
  C2: number;
}

export interface RoutingStats {
  inflowPeak: number;
  muskingumPeak: number;
  kinematicPeak: number;
  inflowPeakTime: number;
  muskingumPeakTime: number;
  kinematicPeakTime: number;
  /** Percentage reduction in peak flow */
  attenuation: number;
  /** Time shift of peak in hours */
  translation: number;
}

// ─── Constants ──────────────────────────────────────────────────

/** Assumed average flow depth for velocity estimation [m] */
const ASSUMED_AVG_DEPTH = 2;

/** Kinematic wave celerity factor: c ≈ β·V, β = 5/3 for wide channels */
const WAVE_CELERITY_FACTOR = 1.5;

// ─── Hydrograph Generation ──────────────────────────────────────

/**
 * Generate a triangular inflow hydrograph.
 * Time to peak = 40% of base duration (standard SCS assumption).
 */
export const generateTriangularHydrograph = (
  peak: number,
  duration: number,
  dt: number,
  totalTime: number
): HydrographPoint[] => {
  const data: HydrographPoint[] = [];
  const timeToPeak = duration * 0.4;

  for (let t = 0; t <= totalTime; t += dt) {
    let flow = 0;
    if (t <= timeToPeak) {
      flow = (peak * t) / timeToPeak;
    } else if (t <= duration) {
      flow = peak * (1 - (t - timeToPeak) / (duration - timeToPeak));
    }
    data.push({ time: t, inflow: Math.max(0, round2(flow)) });
  }
  return data;
};

/**
 * Generate a trapezoidal inflow hydrograph.
 * Rise = 30%, plateau = 20%, fall = 50% of base duration.
 */
export const generateTrapezoidalHydrograph = (
  peak: number,
  duration: number,
  dt: number,
  totalTime: number
): HydrographPoint[] => {
  const data: HydrographPoint[] = [];
  const riseTime = duration * 0.3;
  const peakDuration = duration * 0.2;
  const fallTime = duration * 0.5;

  for (let t = 0; t <= totalTime; t += dt) {
    let flow = 0;
    if (t <= riseTime) {
      flow = (peak * t) / riseTime;
    } else if (t <= riseTime + peakDuration) {
      flow = peak;
    } else if (t <= duration) {
      flow = peak * (1 - (t - riseTime - peakDuration) / fallTime);
    }
    data.push({ time: t, inflow: Math.max(0, round2(flow)) });
  }
  return data;
};

/**
 * Generate an SCS dimensionless unit hydrograph (gamma approximation).
 * tp = 0.375·duration, recession via exponential decay.
 */
export const generateSCSHydrograph = (
  peak: number,
  duration: number,
  dt: number,
  totalTime: number
): HydrographPoint[] => {
  const data: HydrographPoint[] = [];
  const tp = duration * 0.375;
  const tr = tp / 0.6;

  for (let t = 0; t <= totalTime; t += dt) {
    let flow = 0;
    if (t <= tp) {
      flow = peak * Math.pow(t / tp, 3);
    } else {
      flow = peak * Math.exp(-1.5 * ((t - tp) / tr));
    }
    data.push({ time: t, inflow: Math.max(0, round2(flow)) });
  }
  return data;
};

/**
 * Generate an inflow hydrograph of the specified type.
 */
export const generateHydrograph = (
  type: HydrographType,
  peak: number,
  duration: number,
  dt: number
): HydrographPoint[] => {
  const totalTime = duration * 3;
  switch (type) {
    case "triangular":
      return generateTriangularHydrograph(peak, duration, dt, totalTime);
    case "trapezoidal":
      return generateTrapezoidalHydrograph(peak, duration, dt, totalTime);
    case "scs":
      return generateSCSHydrograph(peak, duration, dt, totalTime);
  }
};

// ─── Hydraulic Calculations ─────────────────────────────────────

/**
 * Calculate average channel velocity using Manning's equation.
 *
 * V = (1/n) · R^(2/3) · S^(1/2)
 *
 * @param width   Channel width [m]
 * @param n       Manning's roughness coefficient
 * @param slope   Channel bed slope [m/m]
 * @param depth   Average flow depth [m] (default: 2)
 * @returns       Average velocity [m/s]
 */
export const calculateManningVelocity = (
  width: number,
  n: number,
  slope: number,
  depth: number = ASSUMED_AVG_DEPTH
): number => {
  const hydraulicRadius = (width * depth) / (width + 2 * depth);
  return (1 / n) * Math.pow(hydraulicRadius, 2 / 3) * Math.pow(slope, 0.5);
};

/**
 * Calculate Muskingum K parameter (wave travel time through reach).
 *
 * K = L / c,  where c = β·V (kinematic wave celerity)
 *
 * @param reachLength Channel reach length [m]
 * @param velocity    Average flow velocity [m/s]
 * @returns           Travel time K [hours]
 */
export const calculateRoutingK = (
  reachLength: number,
  velocity: number
): number => {
  const waveCelerity = WAVE_CELERITY_FACTOR * velocity;
  return round2(reachLength / waveCelerity / 3600);
};

// ─── Muskingum Routing ──────────────────────────────────────────

/**
 * Compute Muskingum routing coefficients C0, C1, C2.
 *
 * C0 = (Δt − 2KX) / (2K(1−X) + Δt)
 * C1 = (Δt + 2KX) / (2K(1−X) + Δt)
 * C2 = (2K(1−X) − Δt) / (2K(1−X) + Δt)
 *
 * Constraint: C0 + C1 + C2 = 1
 *
 * @param K  Travel time [hours]
 * @param X  Weighting factor [0–0.5]
 * @param dt Time step [hours]
 */
export const computeRoutingCoefficients = (
  K: number,
  X: number,
  dt: number
): RoutingCoefficients => {
  const denom = 2 * K * (1 - X) + dt;
  return {
    C0: (dt - 2 * K * X) / denom,
    C1: (dt + 2 * K * X) / denom,
    C2: (2 * K * (1 - X) - dt) / denom,
  };
};

/**
 * Route an inflow hydrograph through a channel reach
 * using the Muskingum-Cunge method.
 *
 * O(j+1) = C0·I(j+1) + C1·I(j) + C2·O(j)
 *
 * Also computes a kinematic wave (pure translation) for comparison.
 */
export const routeHydrograph = (
  inflow: HydrographPoint[],
  K: number,
  X: number,
  dt: number
): RoutedPoint[] => {
  const { C0, C1, C2 } = computeRoutingCoefficients(K, X, dt);
  const lagSteps = Math.floor(K / dt);

  const data: RoutedPoint[] = [];

  for (let i = 0; i < inflow.length; i++) {
    let muskingumOutflow: number;
    let kinematicOutflow: number;

    if (i === 0) {
      muskingumOutflow = inflow[i].inflow;
      kinematicOutflow = inflow[i].inflow;
    } else {
      const prevOutflow = data[i - 1].muskingumOutflow;
      muskingumOutflow = Math.max(
        0,
        C0 * inflow[i].inflow + C1 * inflow[i - 1].inflow + C2 * prevOutflow
      );

      const lagIndex = Math.max(0, i - lagSteps);
      kinematicOutflow = inflow[lagIndex].inflow;
    }

    data.push({
      time: inflow[i].time,
      inflow: inflow[i].inflow,
      muskingumOutflow: round2(muskingumOutflow),
      kinematicOutflow: round2(kinematicOutflow),
    });
  }

  return data;
};

// ─── Statistics ─────────────────────────────────────────────────

/**
 * Compute routing statistics from routed hydrograph data.
 */
export const computeRoutingStats = (data: RoutedPoint[]): RoutingStats => {
  const inflowPeak = Math.max(...data.map((d) => d.inflow));
  const muskingumPeak = Math.max(...data.map((d) => d.muskingumOutflow));
  const kinematicPeak = Math.max(...data.map((d) => d.kinematicOutflow));

  const inflowPeakTime = data.find((d) => d.inflow === inflowPeak)?.time || 0;
  const muskingumPeakTime =
    data.find((d) => d.muskingumOutflow === muskingumPeak)?.time || 0;
  const kinematicPeakTime =
    data.find((d) => d.kinematicOutflow === kinematicPeak)?.time || 0;

  const attenuation =
    inflowPeak > 0
      ? round1(((inflowPeak - muskingumPeak) / inflowPeak) * 100)
      : 0;
  const translation = round2(muskingumPeakTime - inflowPeakTime);

  return {
    inflowPeak,
    muskingumPeak,
    kinematicPeak,
    inflowPeakTime,
    muskingumPeakTime,
    kinematicPeakTime,
    attenuation,
    translation,
  };
};

// ─── Helpers ────────────────────────────────────────────────────

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
