import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";
import * as UTIL from "../../utils";

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

  // Zone 1: Inner System (bodyDistanceAU < 2.0 AU)
  if (bodyDistanceAU < 2.0) {
    preliminaryDensity_kg_m3 = 3000 + random() * 2500; // Dense rocky
    const hotJupiterChance = 0.05; // 5% chance of a Hot Jupiter

    if (typeRoll < hotJupiterChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = 500 + random() * 800; // Less dense than typical gas giants
      massMultiplierFactor = 10 + random() * 40; // Can still be massive
      ringChance = 0.02;
      ringAllowedTypes = [RockyType.DUST, RockyType.METALLIC];
      gasGiantClass = UTIL.classifyGasGiantByTemperature(
        random,
        bodyDistanceAU,
        starTemperature,
        starRadius,
      ); // Likely Class IV/V if hot enough
      rockyPlanetType = undefined;
    } else {
      planetType = CelestialType.PLANET; // 95% chance of rocky/terrestrial
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 0.1 + random() * 1.5; // Earth-like masses
      ringChance = 0.01;
      ringAllowedTypes = [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK];
      rockyPlanetType = PlanetType.ROCKY; // Default, can be refined by generatePlanetSpecificProperties
    }
  }
  // Zone 2: Frost Line Transition (2.0 <= bodyDistanceAU < 5.0 AU)
  else if (bodyDistanceAU < 5.0) {
    const gasOrIceGiantChance = 0.4; // 40% chance of gas/ice giant

    if (typeRoll < gasOrIceGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      preliminaryDensity_kg_m3 = 800 + random() * 1000; // Transitional densities
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 5 + random() * 50; // Smaller to medium gas giants
      ringChance = 0.15;
      ringAllowedTypes = [
        RockyType.DUST,
        RockyType.ICE_DUST,
        RockyType.LIGHT_ROCK,
      ];
      gasGiantClass = UTIL.classifyGasGiantByTemperature(
        random,
        bodyDistanceAU,
        starTemperature,
        starRadius,
      ); // Could be Class I, II, or III
      rockyPlanetType = undefined;
    } else {
      planetType = CelestialType.PLANET; // 60% chance of rocky or becoming icy
      preliminaryDensity_kg_m3 = 2000 + random() * 2000;
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 0.5 + random() * 5; // Larger rocky or small icy cores
      ringChance = 0.05;
      ringAllowedTypes = [
        RockyType.LIGHT_ROCK,
        RockyType.DARK_ROCK,
        RockyType.ICE,
      ];
      // rockyPlanetType will be determined by generatePlanetSpecificProperties based on temp/distance
      // Forcing it to PlanetType.ICE here might be too soon.
      if (bodyDistanceAU > 3.5 && random() > 0.5) {
        rockyPlanetType = PlanetType.ICE; // Higher chance of icy if further in this zone
      } else {
        rockyPlanetType = PlanetType.ROCKY;
      }
    }
  }
  // Zone 3: Gas Giant Region (5.0 <= bodyDistanceAU < 20.0 AU)
  else if (bodyDistanceAU < 20.0) {
    preliminaryDensity_kg_m3 = 600 + random() * 900; // Typical gas giant densities
    const gasGiantChance = 0.85; // 85% chance

    if (typeRoll < gasGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 20 + random() * 200; // Large gas giants
      ringChance = 0.25;
      ringAllowedTypes = [
        RockyType.ICE,
        RockyType.ICE_DUST,
        RockyType.METALLIC,
      ];
      gasGiantClass = UTIL.classifyGasGiantByTemperature(
        random,
        bodyDistanceAU,
        starTemperature,
        starRadius,
      ); // Likely Class I or II
      rockyPlanetType = undefined;
    } else {
      planetType = CelestialType.PLANET; // 15% chance of an icy body
      targetDensity_kg_m3 = 1000 + random() * 1000;
      massMultiplierFactor = 0.5 + random() * 10; // Could be a larger icy dwarf
      ringChance = 0.1;
      ringAllowedTypes = [RockyType.ICE, RockyType.ICE_DUST];
      rockyPlanetType = PlanetType.ICE;
    }
  }
  // Zone 4: Outer System / Ice Giant Region (bodyDistanceAU >= 20.0 AU)
  else {
    preliminaryDensity_kg_m3 = 1000 + random() * 1000; // Icy body/Ice Giant densities
    const iceGiantChance = 0.9; // 90% chance of Ice Giant

    if (typeRoll < iceGiantChance) {
      planetType = CelestialType.GAS_GIANT;
      targetDensity_kg_m3 = preliminaryDensity_kg_m3;
      massMultiplierFactor = 10 + random() * 80; // Uranus/Neptune sized
      ringChance = 0.35;
      ringAllowedTypes = [
        RockyType.ICE,
        RockyType.ICE_DUST,
        RockyType.DARK_ROCK,
      ];
      gasGiantClass = UTIL.getRandomItem(
        [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV], // Ice Giants
        random,
      );
      rockyPlanetType = undefined;
    } else {
      planetType = CelestialType.PLANET; // 10% chance of a smaller icy body
      targetDensity_kg_m3 = 1000 + random() * 800;
      massMultiplierFactor = 0.01 + random() * 2; // Dwarf planet sized
      ringChance = 0.05;
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
