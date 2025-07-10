import { utils } from "@teskooano/core-math";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import * as UTIL from "../../utils";
import { type CelestialZone } from "../../zones";

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
 * Determines the fundamental type of a planet (e.g., Rocky, Gas Giant) and its
 * initial physical properties based on its distance from a star, using a
 * data-driven zone-based approach.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param bodyDistanceAU The planet's distance from its star in AU.
 * @param parentStar The parent star `CelestialObject`.
 * @param zone The dynamically-scaled celestial zone for this location.
 * @returns A `PlanetBaseProperties` object or `undefined` if no suitable zone is found.
 */
export function determinePlanetTypeAndBaseProperties(
  random: () => number,
  parentStar: CelestialObject,
  zone: CelestialZone,
): PlanetBaseProperties | undefined {
  if (!zone) {
    return undefined;
  }

  // Determine if the zone allows for gas giant formation
  const canBeGasGiant =
    zone.allowedGasGiantClasses.length > 0 &&
    random() < zone.formationProbability;

  // With the new explicit zone definition, we can simplify this logic.
  const isGasGiant = canBeGasGiant;
  const targetDensity_kg_m3 = utils.lerp(
    isGasGiant ? 500 : 2000,
    isGasGiant ? 2000 : 5500,
    random(),
  );
  const massMultiplierFactor = utils.lerp(
    isGasGiant ? 0.2 : 0.02,
    isGasGiant ? 8 : 1,
    random(),
  );
  const ringChance = isGasGiant ? 0.75 : 0.1;

  let celestialClass: PlanetType | GasGiantClass | undefined;

  if (isGasGiant) {
    // The zone dictates which gas giants are allowed.
    // We should directly pick one from the allowed list.
    if (zone.allowedGasGiantClasses.length > 0) {
      celestialClass = UTIL.getRandomItem(zone.allowedGasGiantClasses, random);
    } else {
      // Fallback if a zone is misconfigured to allow gas giants but lists none.
      console.warn(
        `[planet-type] Zone "${zone.name}" is configured to allow Gas Giants but has no allowed classes. Falling back to Class I.`,
      );
      celestialClass = GasGiantClass.CLASS_I;
    }
  } else {
    // If it's a rocky planet, just pick one from the allowed list for the zone.
    if (zone.allowedPlanetTypes.length > 0) {
      celestialClass = UTIL.getRandomItem(zone.allowedPlanetTypes, random);
    }
  }

  // Fallback if no type could be determined (should not happen with good zone defs)
  if (!celestialClass) {
    console.warn(
      `[planet-type] Could not determine a valid celestial class for zone "${zone.name}". Falling back to ROCKY.`,
    );
    celestialClass = PlanetType.ROCKY;
  }

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
    ringAllowedTypes: [RockyType.ICE, RockyType.LIGHT_ROCK], // Rings are always rocky/icy
  };
}
