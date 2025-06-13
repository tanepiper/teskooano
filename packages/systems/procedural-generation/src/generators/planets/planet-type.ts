import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";
import * as UTIL from "../../utils";

/**
 * @internal
 * The return type for the `determinePlanetTypeAndBaseProperties` function.
 * Defines the preliminary characteristics of a planet before detailed
 * properties are generated.
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
 * Determines the fundamental type of a planet (e.g., Rocky, Gas Giant) and its
 * initial physical properties based on its distance from a star.
 *
 * This is a key step in the planet generation pipeline. It uses the orbital
 * distance to decide whether a celestial body is more likely to be a dense,
 * rocky world or a less-dense gas or ice giant. It also sets the initial
 * probability for having a ring system.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param bodyDistanceAU The planet's distance from its star in AU.
 * @param starTemperature The temperature of the parent star in Kelvin.
 * @param starRadius The radius of the parent star in meters.
 * @returns A `PlanetBaseProperties` object containing the determined
 *   preliminary characteristics.
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
