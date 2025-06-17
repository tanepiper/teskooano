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
  const zones = CelestialZoneManager.generateZonesForStar(parentStar);
  const zoneManager = new CelestialZoneManager(zones);
  const zone = zoneManager.getZoneForDistance(bodyDistanceAU);
  if (!zone || zone.formationProbabilities.length === 0) {
    return undefined;
  }

  const typeRoll = random();
  let cumulativeChance = 0;
  let chosenFormation;

  for (const prob of zone.formationProbabilities) {
    cumulativeChance += prob.chance;
    if (typeRoll < cumulativeChance) {
      chosenFormation = prob;
      break;
    }
  }

  if (!chosenFormation) {
    chosenFormation =
      zone.formationProbabilities[zone.formationProbabilities.length - 1];
  }

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
    const classifiedGiant = UTIL.classifyGasGiantByTemperature(
      random,
      bodyDistanceAU,
      parentStar.temperature,
      parentStar.realRadius_m,
    );
    if (
      chosenFormation.subTypes?.length &&
      chosenFormation.subTypes.includes(classifiedGiant)
    ) {
      gasGiantClass = classifiedGiant;
    } else if (chosenFormation.subTypes?.length) {
      gasGiantClass = UTIL.getRandomItem(
        chosenFormation.subTypes as GasGiantClass[],
        random,
      );
    }
  } else if (
    (chosenFormation.type === CelestialType.PLANET ||
      chosenFormation.type === CelestialType.DWARF_PLANET) &&
    chosenFormation.subTypes?.length
  ) {
    rockyPlanetType = UTIL.getRandomItem(
      chosenFormation.subTypes as PlanetType[],
      random,
    );
  }

  return {
    celestialType: chosenFormation.type,
    planetType: rockyPlanetType as PlanetType,
    preliminaryDensity_kg_m3: targetDensity_kg_m3,
    targetDensity_kg_m3: targetDensity_kg_m3,
    massMultiplierFactor: massMultiplierFactor,
    ringChance: chosenFormation.ringChance,
    ringAllowedTypes: chosenFormation.allowedRingTypes,
  };
}
