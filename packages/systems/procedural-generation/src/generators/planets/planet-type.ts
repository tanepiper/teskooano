import { utils } from "@teskooano/core-math";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import * as UTIL from "../../utils";
import { CelestialZoneManager } from "../../zones";

/**
 * @internal
 * The return type for the `determinePlanetTypeAndBaseProperties` function.
 * Defines the preliminary characteristics of a planet before detailed
 * properties are generated.
 */
export interface PlanetBaseProperties {
  celestialType: CelestialType;
  planetType: PlanetType | GasGiantClass;
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
 * @returns A `PlanetBaseProperties` object or `undefined` if no suitable zone is found.
 */
export function determinePlanetTypeAndBaseProperties(
  random: () => number,
  bodyDistanceAU: number,
  parentStar: CelestialObject,
): PlanetBaseProperties | undefined {
  // Use the new zone manager with the provided random function
  const zoneManager = new CelestialZoneManager(random);
  const zone = zoneManager.getZoneForDistance(bodyDistanceAU);
  if (!zone) {
    return undefined;
  }

  // Determine if the zone allows for gas giant formation
  const gasGiantTypesInZone = zone.allowedTypes.filter((t) =>
    Object.values(GasGiantClass).includes(t as GasGiantClass),
  );
  const canBeGasGiant =
    gasGiantTypesInZone.length > 0 && random() < zone.formationProbability;

  // Create a simple formation probability for the new zone format
  const chosenFormation = {
    type: canBeGasGiant ? CelestialType.GAS_GIANT : CelestialType.PLANET,
    chance: zone.formationProbability,
    subTypes: zone.allowedTypes,
    densityRange_kg_m3: [2000, 5000] as [number, number], // Default rocky density range
    massMultiplierFactorRange: [0.1, 10] as [number, number], // Wide range for variety
    ringChance: 0.1,
    allowedRingTypes: [
      RockyType.LIGHT_ROCK,
      RockyType.DARK_ROCK,
      RockyType.ICE,
    ] as RockyType[],
  };

  const targetDensity_kg_m3 = utils.lerp(
    chosenFormation.densityRange_kg_m3[0],
    chosenFormation.densityRange_kg_m3[1],
    random(),
  );
  const massMultiplierFactor = utils.lerp(
    chosenFormation.massMultiplierFactorRange[0],
    chosenFormation.massMultiplierFactorRange[1],
    random(),
  );

  let gasGiantClass: GasGiantClass | undefined = undefined;
  let rockyPlanetType: PlanetType | undefined = undefined;

  if (chosenFormation.type === CelestialType.GAS_GIANT) {
    // First, determine the class based on physics (temperature)
    const classifiedGiant = UTIL.classifyGasGiantByTemperature(
      random,
      bodyDistanceAU,
      parentStar.temperature,
      parentStar.realRadius_m,
    );

    // Then, check if the physically-correct class is allowed by the zone's rules.
    // The zone's rules are the ultimate source of truth.
    if (
      chosenFormation.subTypes?.length &&
      chosenFormation.subTypes.includes(classifiedGiant)
    ) {
      // If it's allowed, use it.
      gasGiantClass = classifiedGiant;
    } else if (chosenFormation.subTypes?.length) {
      // If not, the physics and the zone rules contradict.
      // In this case, we respect the zone's explicit rules and pick a valid type.
      // This prevents edge cases with unusual stars creating lore-breaking planets.
      const validGasGiantSubtypes = chosenFormation.subTypes.filter((t) =>
        Object.values(GasGiantClass).includes(t as GasGiantClass),
      ) as GasGiantClass[];

      gasGiantClass = UTIL.getRandomItem(validGasGiantSubtypes, random);
    } else {
      // As a final fallback, if the zone has no subtypes defined, use the classified one.
      gasGiantClass = classifiedGiant;
    }
  } else if (
    (chosenFormation.type === CelestialType.PLANET ||
      chosenFormation.type === CelestialType.DWARF_PLANET) &&
    chosenFormation.subTypes?.length
  ) {
    const validPlanetSubtypes = chosenFormation.subTypes.filter((t) =>
      Object.values(PlanetType).includes(t as PlanetType),
    ) as PlanetType[];

    if (validPlanetSubtypes.length > 0) {
      rockyPlanetType = UTIL.getRandomItem(validPlanetSubtypes, random);
    }
  }

  const planetOrGiantType = gasGiantClass ?? rockyPlanetType;
  const finalCelestialType = gasGiantClass
    ? CelestialType.GAS_GIANT
    : chosenFormation.type;

  return {
    celestialType: finalCelestialType,
    planetType: planetOrGiantType as PlanetType | GasGiantClass,
    preliminaryDensity_kg_m3: targetDensity_kg_m3,
    targetDensity_kg_m3: targetDensity_kg_m3,
    massMultiplierFactor: massMultiplierFactor,
    ringChance: chosenFormation.ringChance,
    ringAllowedTypes: chosenFormation.allowedRingTypes,
  };
}
