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
  gasGiantClass?: GasGiantClass; // Optional, only for Gas Giants
  rockyPlanetType?: PlanetType; // Optional, only for Rocky/Planet types
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
  starTemperature: number, // Added for Gas Giant classification
  starRadius: number, // Added for Gas Giant classification
): PlanetBaseProperties {
  let planetType: CelestialType;
  let preliminaryDensity_kg_m3: number;
  let targetDensity_kg_m3: number;
  let massMultiplierFactor: number = 1; // Default factor
  let ringChance: number = 0;
  let ringAllowedTypes: RockyType[] = [];
  let gasGiantClass: GasGiantClass | undefined = undefined;
  let rockyPlanetType: PlanetType | undefined = undefined;

  const typeRoll = random();

  if (bodyDistanceAU < 2.5) {
    // --- Inner Zone --- (Potential Hot Jupiter or Rocky)
    preliminaryDensity_kg_m3 = 3000 + random() * 3000; // Wide range
    const innerGasGiantChance = 0.25;

    if (typeRoll < innerGasGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = 600 + random() * 900; // Low density for Gas Giant
      massMultiplierFactor = 15 + random() * 50; // Higher mass multiplier for Hot Jupiter
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
      targetDensity_kg_m3 = 3500 + random() * 2500; // High density for Rocky
      // massMultiplierFactor remains 1
      ringChance = 0.01;
      ringAllowedTypes = [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK];
      // Determine specific rocky type later in properties generation
    }
  } else if (bodyDistanceAU < 8) {
    // --- Mid Zone --- (Likely Gas Giant)
    preliminaryDensity_kg_m3 = 600 + random() * 900; // Typical Gas Giant
    planetType = CelestialType.GAS_GIANT;
    targetDensity_kg_m3 = preliminaryDensity_kg_m3; // Density remains similar
    massMultiplierFactor = 20 + random() * 100; // High mass multiplier
    ringChance = 0.1;
    ringAllowedTypes = [RockyType.METALLIC, RockyType.DUST];
    gasGiantClass = UTIL.classifyGasGiantByTemperature(
      random,
      bodyDistanceAU,
      starTemperature,
      starRadius,
    );
  } else {
    // --- Outer Zone --- (Likely Ice Giant or Icy Rocky)
    preliminaryDensity_kg_m3 = 1200 + random() * 800; // Ice Giant/Icy Rocky range
    const outerIceGiantChance = 0.85;

    if (random() < outerIceGiantChance) {
      planetType = CelestialType.GAS_GIANT; // Still typed as GAS_GIANT for now
      targetDensity_kg_m3 = preliminaryDensity_kg_m3; // Keep preliminary density
      massMultiplierFactor = 5 + random() * 20; // Moderate mass multiplier
      ringChance = 0.2;
      ringAllowedTypes = [RockyType.ICE, RockyType.ICE_DUST];
      // Force Class III or IV for Ice Giants
      gasGiantClass = UTIL.getRandomItem(
        [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV],
        random,
      );
    } else {
      planetType = CelestialType.PLANET;
      targetDensity_kg_m3 = 2000 + random() * 2000; // Icy rocky density
      // massMultiplierFactor remains 1
      ringChance = 0.15;
      ringAllowedTypes = [RockyType.ICE, RockyType.ICE_DUST];
      // Force type to ICE later in properties generation
      rockyPlanetType = PlanetType.ICE; // Set the specific type here
    }
  }

  return {
    planetType,
    preliminaryDensity_kg_m3,
    targetDensity_kg_m3,
    massMultiplierFactor,
    ringChance,
    ringAllowedTypes,
    gasGiantClass, // Will be undefined if not Gas Giant
    rockyPlanetType, // Will be undefined if not Rocky/Planet (or set to ICE)
  };
}
