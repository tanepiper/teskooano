import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";
import * as UTIL from "../utils";

/**
 * Return type for the determinePlanetTypeAndBaseProperties function.
 */
export interface PlanetBaseProperties {
  planetType: CelestialType;
  preliminaryDensity_kg_m3: number;
  targetDensity_kg_m3: number;
  massMultiplierFactor: number;
  ringChance: number;
  ringAllowedTypes: RockyType[];
  gasGiantClass?: GasGiantClass;
  rockyPlanetType?: PlanetType;
}

/**
 * Determines the base type (Rocky, Gas Giant, Ice Giant) and initial properties
 * of a planet based on its distance from the star.
 *
 * @param random The seeded random function.
 * @param bodyDistanceAU Distance from the star in AU.
 * @param starTemperature Temperature of the parent star (K).
 * @param starRadius Radius of the parent star (m).
 * @returns An object containing the determined base properties.
 */
export function determinePlanetTypeAndBaseProperties(
  random: () => number,
  bodyDistanceAU: number,
  starTemperature: number,
  starRadius: number,
): PlanetBaseProperties {
  let planetType: CelestialType;
  let preliminaryDensity_kg_m3: number;
  let targetDensity_kg_m3: number;
  let massMultiplierFactor: number = 1;
  let ringChance: number = 0;
  let ringAllowedTypes: RockyType[] = [];
  let gasGiantClass: GasGiantClass | undefined = undefined;
  let rockyPlanetType: PlanetType | undefined = undefined;

  const typeRoll = random();

  if (bodyDistanceAU < 2.5) {
    preliminaryDensity_kg_m3 = 3000 + random() * 3000;
    const innerGasGiantChance = 0.25;

    if (typeRoll < innerGasGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = 600 + random() * 900;
      massMultiplierFactor = 15 + random() * 50;
      ringChance = 0.05;
      ringAllowedTypes = [
        RockyType.METALLIC,
        RockyType.DARK_ROCK,
        RockyType.DUST,
      ];
      gasGiantClass = UTIL.classifyGasGiantByTemperature(
        random,
        bodyDistanceAU,
        starTemperature,
        starRadius,
      );
    } else {
      planetType = CelestialType.PLANET;
      targetDensity_kg_m3 = 3500 + random() * 2500;

      ringChance = 0.01;
      ringAllowedTypes = [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK];
    }
  } else if (bodyDistanceAU < 8) {
    preliminaryDensity_kg_m3 = 600 + random() * 900;
    planetType = CelestialType.GAS_GIANT;
    targetDensity_kg_m3 = preliminaryDensity_kg_m3;
    massMultiplierFactor = 20 + random() * 100;
    ringChance = 0.1;
    ringAllowedTypes = [RockyType.METALLIC, RockyType.DUST];
    gasGiantClass = UTIL.classifyGasGiantByTemperature(
      random,
      bodyDistanceAU,
      starTemperature,
      starRadius,
    );
  } else {
    preliminaryDensity_kg_m3 = 1200 + random() * 800;
    const outerIceGiantChance = 0.85;

    if (random() < outerIceGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 5 + random() * 20;
      ringChance = 0.2;
      ringAllowedTypes = [RockyType.ICE, RockyType.ICE_DUST];

      gasGiantClass = UTIL.getRandomItem(
        [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV],
        random,
      );
    } else {
      planetType = CelestialType.PLANET;
      targetDensity_kg_m3 = 2000 + random() * 2000;

      ringChance = 0.15;
      ringAllowedTypes = [RockyType.ICE, RockyType.ICE_DUST];

      rockyPlanetType = PlanetType.ICE;
    }
  }

  return {
    planetType,
    preliminaryDensity_kg_m3,
    targetDensity_kg_m3,
    massMultiplierFactor,
    ringChance,
    ringAllowedTypes,
    gasGiantClass,
    rockyPlanetType,
  };
}
