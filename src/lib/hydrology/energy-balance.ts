/**
 * Energy Balance & Albedo — Pure calculation functions
 *
 * Covers: Net radiation, latent/sensible heat flux,
 * evapotranspiration, simplified water balance.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export interface LandCover {
  id: string;
  name: string;
  albedo: number;
  emissivity: number;
  roughness: number;
  rootDepth: number;
  leafAreaIndex: number;
}

export interface EnergyBalanceResult {
  albedo: number;
  netShortwave: number;
  netLongwave: number;
  netRadiation: number;
  groundHeat: number;
  latentHeat: number;
  sensibleHeat: number;
  availableEnergy: number;
  evapotranspiration: number;
  runoff: number;
  infiltration: number;
  surfaceTempChange: number;
  dailyET: number;
}

// ─── Constants ──────────────────────────────────────────────

export const LAND_COVERS: LandCover[] = [
  { id: "forest", name: "Dense Forest", albedo: 0.12, emissivity: 0.98, roughness: 2.0, rootDepth: 3.0, leafAreaIndex: 6 },
  { id: "grassland", name: "Grassland", albedo: 0.20, emissivity: 0.96, roughness: 0.03, rootDepth: 0.5, leafAreaIndex: 2 },
  { id: "cropland", name: "Cropland", albedo: 0.18, emissivity: 0.95, roughness: 0.1, rootDepth: 1.0, leafAreaIndex: 3 },
  { id: "bare", name: "Bare Soil", albedo: 0.25, emissivity: 0.92, roughness: 0.005, rootDepth: 0, leafAreaIndex: 0 },
  { id: "urban", name: "Urban/Impervious", albedo: 0.15, emissivity: 0.90, roughness: 1.0, rootDepth: 0, leafAreaIndex: 0.5 },
  { id: "water", name: "Open Water", albedo: 0.08, emissivity: 0.97, roughness: 0.0001, rootDepth: 0, leafAreaIndex: 0 },
  { id: "snow", name: "Snow/Ice", albedo: 0.80, emissivity: 0.99, roughness: 0.001, rootDepth: 0, leafAreaIndex: 0 },
  { id: "desert", name: "Desert Sand", albedo: 0.35, emissivity: 0.90, roughness: 0.001, rootDepth: 0.1, leafAreaIndex: 0.1 },
];

/** Stefan-Boltzmann constant (W/m²/K⁴) */
const SIGMA = 5.67e-8;
/** Latent heat of vaporization (J/kg) */
const LAMBDA = 2.45e6;

// ─── Calculations ───────────────────────────────────────────

/**
 * Calculate the complete energy and water balance for a land cover type.
 */
export const calculateEnergyBalance = (
  cover: LandCover,
  solarRadiation: number,
  airTemperature: number,
  relativeHumidity: number,
  windSpeed: number,
  precipitation: number
): EnergyBalanceResult => {
  // Net shortwave radiation (absorbed solar)
  const Rns = solarRadiation * (1 - cover.albedo);

  // Surface temperature estimate (simplified)
  const Ts = airTemperature + 273.15 + (Rns * 0.02);
  const Ta = airTemperature + 273.15;

  // Net longwave radiation
  const Rnl = cover.emissivity * SIGMA * (Ta ** 4) - cover.emissivity * SIGMA * (Ts ** 4);

  // Net radiation
  const Rn = Rns + Rnl;

  // Ground heat flux (10% vegetated, 30% bare)
  const G = Rn * (cover.leafAreaIndex > 0 ? 0.1 : 0.3);

  // Available energy
  const availableEnergy = Rn - G;

  // Stomatal resistance based on LAI
  const rs = cover.leafAreaIndex > 0 ? 100 / cover.leafAreaIndex : 10000;
  const ra = Math.log((2 - 0.67 * cover.roughness) / (0.123 * cover.roughness)) ** 2 / (0.41 ** 2 * windSpeed);

  // Priestley-Taylor alpha modified by surface resistance
  const alpha = 1.26 * (1 / (1 + rs / (ra + 1)));

  // Latent heat (evapotranspiration energy)
  const LE = availableEnergy * alpha * (cover.leafAreaIndex > 0 ? 1 : 0.3);

  // Sensible heat
  const H = availableEnergy - LE;

  // Convert LE to ET rate (mm/day)
  const ET = (LE > 0 ? LE : 0) * 86400 / LAMBDA;
  const annualET = ET * 365;

  // Water balance
  const runoff = Math.max(0, precipitation * (1 - cover.rootDepth / 3) * (1 - cover.leafAreaIndex / 8));
  const infiltration = precipitation - runoff - Math.min(annualET, precipitation);

  // Surface temperature change
  const surfaceTempChange = (H > 0 ? H : 0) * 0.01;

  return {
    albedo: cover.albedo,
    netShortwave: Rns,
    netLongwave: Rnl,
    netRadiation: Rn,
    groundHeat: G,
    latentHeat: LE,
    sensibleHeat: H,
    availableEnergy,
    evapotranspiration: Math.min(annualET, precipitation),
    runoff,
    infiltration: Math.max(0, infiltration),
    surfaceTempChange,
    dailyET: ET,
  };
};
