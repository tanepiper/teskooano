import { utils } from "@teskooano/core-math";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import * as UTIL from "../../utils";

/**
 * @internal
 * The return type for the `determinePlanetTypeAndBaseProperties` function.
 * Defines the preliminary characteristics of a planet before detailed
 * properties are generated.
 */
export interface PlanetBaseProperties {
  celestialType: CelestialType;
  celestialClass: PlanetType | GasGiantClass;
  preliminaryDensity_kg_m3: number;
  targetDensity_kg_m3: number;
  massMultiplierFactor: number;
  ringChance: number;
  ringAllowedTypes: RockyType[];
}

/**
 * Simplified planet type determination based on temperature and distance.
 * No complex zone logic, just realistic astrophysics.
 */
export function determinePlanetTypeAndBaseProperties(
  random: () => number,
  parentStar: CelestialObject,
  zone: any,
): PlanetBaseProperties | undefined {
  if (!zone) {
    return undefined;
  }

  // Get stellar properties
  const starProps = parentStar.properties as any;
  const stellarTemp = starProps?.temperature || 5778;
  const stellarLuminosity = starProps?.luminosity || 1.0;

  // Calculate distance within the zone
  const distanceAU = zone.minAU + (zone.maxAU - zone.minAU) * random();

  // Use proper equilibrium temperature calculation
  const effectiveTemp = UTIL.estimateTemperature(stellarLuminosity, distanceAU);

  // Simple temperature-based planet type selection
  let celestialClass: PlanetType | GasGiantClass;
  let isGasGiant = false;

  if (effectiveTemp > 1000) {
    // Hot zone: Rocky, Desert, Lava
    const hotTypes = [PlanetType.ROCKY, PlanetType.DESERT, PlanetType.LAVA];
    celestialClass = UTIL.getRandomItem(hotTypes, random);
  } else if (effectiveTemp > 300) {
    // Habitable zone: Terrestrial, Ocean, Rocky
    const habitableTypes = [
      PlanetType.TERRESTRIAL,
      PlanetType.OCEAN,
      PlanetType.ROCKY,
    ];
    celestialClass = UTIL.getRandomItem(habitableTypes, random);

    // 20% chance of gas giant in habitable zone
    if (random() < 0.2) {
      isGasGiant = true;
      celestialClass = GasGiantClass.CLASS_I;
    }
  } else {
    // Cold zone: Ice, Rocky, or Gas Giant
    const coldTypes = [PlanetType.ICE, PlanetType.ROCKY];
    celestialClass = UTIL.getRandomItem(coldTypes, random);

    // 40% chance of gas giant in cold zone
    if (random() < 0.4) {
      isGasGiant = true;
      celestialClass =
        random() < 0.5 ? GasGiantClass.CLASS_I : GasGiantClass.CLASS_II;
    }
  }

  // Set properties based on type
  const targetDensity_kg_m3 = isGasGiant
    ? utils.lerp(500, 2000, random())
    : utils.lerp(2000, 5500, random());

  const massMultiplierFactor = isGasGiant
    ? utils.lerp(0.2, 8, random())
    : utils.lerp(0.02, 1, random());

  const ringChance = isGasGiant ? 0.75 : 0.1;

  const finalCelestialType = isGasGiant
    ? CelestialType.GAS_GIANT
    : CelestialType.PLANET;

  return {
    celestialType: finalCelestialType,
    celestialClass: celestialClass,
    preliminaryDensity_kg_m3: targetDensity_kg_m3,
    targetDensity_kg_m3: targetDensity_kg_m3,
    massMultiplierFactor: massMultiplierFactor,
    ringChance: ringChance,
    ringAllowedTypes: [RockyType.ICE, RockyType.LIGHT_ROCK],
  };
}
