/**
 * Hydraulic Structures — Pure calculation functions
 *
 * Covers: Stilling basin design (USBR types), hydraulic jump analysis.
 *
 * Reference: USBR Engineering Monograph No. 25,
 * Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export interface BasinType {
  id: string;
  name: string;
  frRange: string;
  desc: string;
}

export interface StillingBasinResult {
  V1: number;
  V2: number;
  Fr1: number;
  Fr2: number;
  y2: number;       // Sequent depth (m)
  dE: number;       // Energy loss (m)
  E1: number;       // Upstream specific energy (m)
  efficiency: number;
  Lb: number;       // Basin length (m)
  basinType: string;
  twRatio: number;
  twAdequate: boolean;
  jumpContained: boolean;
  jumpClass: string;
}

// ─── Constants ──────────────────────────────────────────────

export const BASIN_TYPES: BasinType[] = [
  { id: "I", name: "USBR Type I", frRange: "Fr > 4.5, no appurtenances", desc: "High Froude, simple basin with end sill only." },
  { id: "II", name: "USBR Type II", frRange: "Fr > 4.5, chute blocks + dentated sill", desc: "Reduces basin length by ~33% vs Type I." },
  { id: "III", name: "USBR Type III", frRange: "4.5 < Fr < 14, baffle piers + end sill", desc: "Most common type, uses baffle piers for energy dissipation." },
  { id: "IV", name: "USBR Type IV", frRange: "2.5 < Fr < 4.5, oscillating jump", desc: "Difficult range — consider alternative designs." },
  { id: "SAF", name: "SAF Basin", frRange: "Fr 1.7–17", desc: "St. Anthony Falls basin, compact design." },
];

// ─── Calculations ───────────────────────────────────────────

/**
 * Classify hydraulic jump type by Froude number.
 */
export const classifyJump = (Fr: number): string => {
  if (Fr <= 1.7) return "Undular";
  if (Fr <= 2.5) return "Weak";
  if (Fr <= 4.5) return "Oscillating";
  if (Fr <= 9) return "Steady";
  return "Strong";
};

/**
 * Select appropriate USBR basin type.
 */
export const selectBasinType = (Fr: number): string => {
  if (Fr < 4.5) return "IV";
  if (Fr < 14) return "III";
  return "II";
};

/**
 * Design a stilling basin given unit discharge, upstream depth, and tailwater.
 */
export const designStillingBasin = (
  q: number,        // Unit discharge (m²/s)
  y1: number,       // Supercritical depth (m)
  tailwater: number  // Tailwater depth (m)
): StillingBasinResult => {
  const g = 9.81;
  const V1 = q / y1;
  const Fr1 = V1 / Math.sqrt(g * y1);
  const y2 = (y1 / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
  const V2 = q / y2;
  const Fr2 = V2 / Math.sqrt(g * y2);
  const dE = Math.pow(y2 - y1, 3) / (4 * y1 * y2);
  const E1 = y1 + V1 * V1 / (2 * g);
  const efficiency = ((E1 - dE) / E1) * 100;

  const Lb = 6 * y2;
  const basinType = selectBasinType(Fr1);

  const twRatio = tailwater / y2;
  const twAdequate = twRatio >= 0.95;
  const jumpContained = tailwater >= y2 * 0.85;
  const jumpClass = classifyJump(Fr1);

  return { V1, V2, Fr1, Fr2, y2, dE, E1, efficiency, Lb, basinType, twRatio, twAdequate, jumpContained, jumpClass };
};
