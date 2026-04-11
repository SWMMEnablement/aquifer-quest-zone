import { describe, it, expect } from "vitest";
import { calculateEnergyBalance, LAND_COVERS } from "../energy-balance";

describe("Energy Balance", () => {
  const forest = LAND_COVERS.find(lc => lc.id === "forest")!;
  const urban = LAND_COVERS.find(lc => lc.id === "urban")!;

  it("forest absorbs more shortwave than snow", () => {
    const snow = LAND_COVERS.find(lc => lc.id === "snow")!;
    const fResult = calculateEnergyBalance(forest, 250, 25, 60, 3, 1200);
    const sResult = calculateEnergyBalance(snow, 250, 25, 60, 3, 1200);
    expect(fResult.netShortwave).toBeGreaterThan(sResult.netShortwave);
  });

  it("forest ET > urban ET", () => {
    const fResult = calculateEnergyBalance(forest, 250, 25, 60, 3, 1200);
    const uResult = calculateEnergyBalance(urban, 250, 25, 60, 3, 1200);
    expect(fResult.evapotranspiration).toBeGreaterThan(uResult.evapotranspiration);
  });

  it("energy balance: Rn = G + LE + H", () => {
    const r = calculateEnergyBalance(forest, 250, 25, 60, 3, 1200);
    expect(r.groundHeat + r.latentHeat + r.sensibleHeat).toBeCloseTo(r.netRadiation - r.groundHeat + r.groundHeat, 0);
  });
});
