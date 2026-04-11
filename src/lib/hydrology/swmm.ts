/**
 * SWMM Urban Hydraulics — Pure calculation functions
 *
 * Covers: Gutter flow (HEC-22), inlet interception,
 * pipe flow (Manning/Hazen-Williams), weir/orifice discharge,
 * water hammer (Joukowski), pump characteristic curves.
 *
 * Reference: FHWA HEC-22, Prof. Victor Miguel Ponce, SDSU
 */

// ─── Types ──────────────────────────────────────────────────

export interface GutterFlowResult {
  spread: number;        // T (m)
  depth: number;         // d (m)
  gutterDepth: number;   // depth at gutter (m)
  velocity: number;      // V (m/s)
  flowArea: number;      // A (m²)
}

export interface GrateInletResult {
  T: number;
  V: number;
  depth: number;
  E: number;      // Interception efficiency
  Qi: number;     // Intercepted flow (m³/s)
  bypass: number; // Bypass flow (m³/s)
  Eo: number;
  Rf: number;
  Rs: number;
  type: "Grate";
}

export interface CurbInletResult {
  T: number;
  V: number;
  depth: number;
  E: number;
  Qi: number;
  bypass: number;
  LT: number;
  Lc: number;
  type: "Curb";
}

export type InletResult = GrateInletResult | CurbInletResult;

export interface PipeFlowResult {
  A: number;
  P: number;
  R: number;
  V: number;
  Q: number;
  Tw: number;
  yc: number;
  Fr: number;
  Qfull: number;
  percentFull: number;
  theta: number;
}

export interface WeirOrificeResult {
  Q: number;
  H: number;
  Ht: number;
  subRatio: number;
  subFactor: number;
  V: number;
  A: number;
  formula: string;
}

export interface WaterHammerResult {
  a: number;       // Wave speed (m/s)
  tc: number;      // Critical time (s)
  isRapid: boolean;
  dP: number;      // Pressure rise (Pa)
  dH: number;      // Head rise (m)
  dPbar: number;   // Pressure rise (bar)
}

export interface PumpCurvePoint {
  Q: number;
  H: number;
  eff: number;
  P: number;
}

// ─── Gutter Flow (HEC-22) ──────────────────────────────────

/**
 * Compute gutter spread using Izzard's modified Manning equation.
 * Q = (0.376/n) × Sx^(5/3) × S^(1/2) × T^(8/3)
 */
export const computeGutterSpread = (Q: number, n: number, Sx: number, slope: number): number => {
  const T = Math.pow((Q * n) / (0.376 * Math.pow(Sx, 5 / 3) * Math.pow(slope, 0.5)), 3 / 8);
  return isFinite(T) ? T : 0;
};

/**
 * Full gutter flow analysis.
 */
export const computeGutterFlow = (
  Q: number, n: number, Sx: number, Sw: number, slope: number, gutterW: number
): GutterFlowResult => {
  const spread = computeGutterSpread(Q, n, Sx, slope);
  const depth = spread * Sx;
  const gutterDepth = depth + gutterW * (Sw - Sx);
  const flowArea = 0.5 * spread * depth;
  const velocity = spread > 0 ? Q / flowArea : 0;
  return { spread, depth, gutterDepth, velocity, flowArea };
};

// ─── Inlet Design ──────────────────────────────────────────

/**
 * Compute grate inlet interception efficiency.
 */
export const computeGrateInlet = (
  Q: number, slope: number, Sx: number,
  grateLength: number, grateWidth: number, clogging: number
): GrateInletResult => {
  const n = 0.016;
  const T = Math.pow((Q * n) / (0.376 * Math.pow(Sx, 5 / 3) * Math.pow(slope, 0.5)), 3 / 8);
  const V = T > 0 ? Q / (0.5 * T * T * Sx) : 0;
  const depth = T * Sx;

  const Eo = grateWidth > 0 ? 1 - Math.pow(1 - grateWidth / Math.max(T, 0.01), 2.67) : 0;
  const Vo = 0.9;
  const Rf = V > Vo ? 1 - 0.09 * (V - Vo) : 1;
  const Rs = 1 / (1 + 0.15 * Math.pow(V, 1.8) / (Sx * Math.pow(grateLength * (1 - clogging / 100), 2.3)));
  const E = Math.min(Math.max(Rf * Eo + Rs * (1 - Eo), 0), 1);
  const Qi = E * Q;

  return { T, V, depth, E, Qi, bypass: Q - Qi, Eo, Rf, Rs, type: "Grate" };
};

/**
 * Compute curb-opening inlet interception efficiency.
 */
export const computeCurbInlet = (
  Q: number, slope: number, Sx: number, curbLength: number
): CurbInletResult => {
  const n = 0.016;
  const T = Math.pow((Q * n) / (0.376 * Math.pow(Sx, 5 / 3) * Math.pow(slope, 0.5)), 3 / 8);
  const V = T > 0 ? Q / (0.5 * T * T * Sx) : 0;
  const depth = T * Sx;

  const LT = 0.6 * Math.pow(Q, 0.42) * Math.pow(slope, 0.3) * Math.pow(1 / (n * Sx), 0.6);
  const E = curbLength >= LT ? 1 : 1 - Math.pow(1 - curbLength / LT, 1.8);
  const Qi = E * Q;

  return { T, V, depth, E, Qi, bypass: Q - Qi, LT, Lc: curbLength, type: "Curb" };
};

// ─── Pipe Flow ─────────────────────────────────────────────

/**
 * Compute partially-full circular pipe flow.
 */
export const computePipeFlow = (
  method: "manning" | "hazen-williams",
  diameter: number,
  slope: number,
  roughness: number,
  depth: number
): PipeFlowResult => {
  const r = diameter / 2;
  const dRatio = Math.min(depth / diameter, 0.99);
  const theta = 2 * Math.acos(1 - 2 * dRatio);
  const A = (r * r / 2) * (theta - Math.sin(theta));
  const P = r * theta;
  const R = P > 0 ? A / P : 0;
  const Tw = diameter * Math.sin(theta / 2);

  let V = 0;
  if (method === "manning") {
    V = (1 / roughness) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
  } else {
    const C = (1 / roughness) * 10;
    V = 0.849 * C * Math.pow(R, 0.63) * Math.pow(slope, 0.54);
  }
  const Q = V * A;

  const yc = Math.pow(Q * Q / (9.81 * Tw * Tw * A), 1 / 3) || 0;
  const Fr = Tw > 0 ? V / Math.sqrt(9.81 * A / Tw) : 0;

  const Afull = Math.PI * r * r;
  const Rfull = r / 2;
  const Vfull = (1 / roughness) * Math.pow(Rfull, 2 / 3) * Math.pow(slope, 0.5);
  const Qfull = Vfull * Afull;

  return { A, P, R, V, Q, Tw, yc, Fr, Qfull, percentFull: dRatio * 100, theta };
};

// ─── Weir & Orifice ────────────────────────────────────────

export type StructureType = "rect-weir" | "v-notch" | "broad-crest" | "orifice";

/**
 * Compute weir or orifice discharge.
 */
export const computeWeirOrifice = (
  type: StructureType,
  headwater: number,
  crest: number,
  tailwater: number,
  length: number,
  Cd: number,
  angle: number,
  orificeDia: number
): WeirOrificeResult => {
  const H = Math.max(headwater - crest, 0);
  const Ht = Math.max(tailwater - crest, 0);
  const subRatio = Ht > 0 && H > 0 ? Ht / H : 0;
  const subFactor = subRatio > 0.67 ? Math.pow(1 - Math.pow(subRatio, 1.5), 0.385) : 1;

  let Q = 0, formula = "";
  if (type === "rect-weir") {
    Q = Cd * length * Math.pow(H, 1.5) * subFactor;
    formula = `Q = Cd × L × H^(3/2) = ${Cd} × ${length} × ${H.toFixed(2)}^1.5`;
  } else if (type === "v-notch") {
    const theta = angle * Math.PI / 180;
    Q = (8 / 15) * 0.58 * Math.sqrt(2 * 9.81) * Math.tan(theta / 2) * Math.pow(H, 2.5) * subFactor;
    formula = `Q = (8/15)Cd√(2g)tan(θ/2)H^(5/2)`;
  } else if (type === "broad-crest") {
    Q = Cd * length * Math.pow(H, 1.5) * subFactor;
    formula = `Q = Cd × L × H^(3/2)`;
  } else if (type === "orifice") {
    const Ao = Math.PI * orificeDia * orificeDia / 4;
    const Heff = headwater - (crest - orificeDia / 2);
    Q = 0.61 * Ao * Math.sqrt(2 * 9.81 * Math.max(Heff, 0));
    formula = `Q = Cd × A × √(2gH)`;
  }

  const A = type === "orifice" ? Math.PI * orificeDia * orificeDia / 4 : length * H;
  const V = A > 0 ? Q / A : 0;
  return { Q, H, Ht, subRatio, subFactor, V, A, formula };
};

// ─── Water Hammer (Joukowski) ──────────────────────────────

/**
 * Compute water hammer transient pressure rise.
 */
export const computeWaterHammer = (
  pipeLength: number,
  diameter: number,
  thickness: number,
  V0: number,
  closureTime: number,
  Kw: number,
  Ep: number
): WaterHammerResult => {
  const rho = 998;
  const a = Math.sqrt((Kw / rho) / (1 + (Kw * diameter) / (Ep * thickness)));
  const tc = 2 * pipeLength / a;
  const isRapid = closureTime < tc;
  const dP = isRapid ? rho * a * V0 : rho * a * V0 * (tc / closureTime);
  const dH = dP / (rho * 9.81);
  return { a, tc, isRapid, dP, dH, dPbar: dP / 1e5 };
};

// ─── Pump Curves ───────────────────────────────────────────

/**
 * Generate pump characteristic curve points.
 */
export const generatePumpCurve = (
  Qrated: number,
  Hrated: number,
  Hshutoff: number
): PumpCurvePoint[] => {
  const points: PumpCurvePoint[] = [];
  for (let i = 0; i <= 20; i++) {
    const q = (i / 20) * Qrated * 1.4;
    const qr = q / Qrated;
    const H = Hshutoff - (Hshutoff - Hrated) * qr * qr;
    const eff = qr > 0 ? Math.max(4 * qr * (1 - 0.5 * qr) * 0.82, 0) : 0;
    const P = q > 0 ? (998 * 9.81 * q * H) / (eff > 0 ? eff : 0.01) / 1000 : 0;
    points.push({ Q: q, H: Math.max(H, 0), eff, P });
  }
  return points;
};

/**
 * Apply affinity laws to pump curve at different speed.
 */
export const applyAffinityLaws = (
  baseCurve: PumpCurvePoint[],
  N1: number,
  N2: number
): PumpCurvePoint[] => {
  const ratio = N2 / N1;
  return baseCurve.map(p => ({
    Q: p.Q * ratio,
    H: p.H * ratio * ratio,
    eff: p.eff,
    P: p.P * ratio * ratio * ratio,
  }));
};

/**
 * Compute pump specific speed.
 */
export const computeSpecificSpeed = (N: number, Qrated: number, Hrated: number): number => {
  return N * Math.sqrt(Qrated * 1000) / Math.pow(Hrated, 0.75);
};

/**
 * Classify pump type by specific speed.
 */
export const classifyPumpType = (Ns: number): string => {
  if (Ns < 2000) return "Radial";
  if (Ns < 5000) return "Mixed";
  return "Axial";
};
