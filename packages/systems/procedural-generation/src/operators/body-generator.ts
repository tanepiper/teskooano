import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import {
  concat,
  concatMap,
  EMPTY,
  mergeMap,
  of,
  Observable,
  type OperatorFunction,
  from,
} from "rxjs";
import {
  generateAsteroidBelt,
  generateComet,
  generateMoonsObservable,
  generatePlanet,
  generateRoguePlanet,
} from "../generators";
import { isValidAsteroidBeltDistance } from "../generators/belts/utils";
import type { BodyPlacement } from "../utils/body-placement";
import { OrbitalConfiguration } from "../zones";

/**
 * Enhanced body generation operator that supports sophisticated orbital configurations.
 * This version handles the new placement structure while maintaining compatibility.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param seed The master seed for the system, to be passed down for deterministic generation.
 * @returns An RxJS operator that transforms a `BodyPlacement` into an Observable of CelestialObjects.
 */
export function generateBodyForSlot(
  random: () => number,
  seed: string,
): OperatorFunction<BodyPlacement, CelestialObject> {
  return concatMap((placement) => {
    // For now, route most configurations to standard generation
    // This provides a working foundation that can be enhanced incrementally
    switch (placement.configuration) {
      case OrbitalConfiguration.STANDARD:
      case OrbitalConfiguration.BINARY_PAIR:
      case OrbitalConfiguration.TROJAN:
      case OrbitalConfiguration.CO_ORBITAL:
      case OrbitalConfiguration.CIRCUMBINARY:
        return generateStandardBody(random, placement, seed);

      case OrbitalConfiguration.ROGUE:
        return generateRogueObject(random, placement, seed);

      default:
        return generateStandardBody(random, placement, seed);
    }
  });
}

/**
 * Generates a standard body (planet or asteroid belt) using the enhanced placement information
 */
function generateStandardBody(
  random: () => number,
  placement: BodyPlacement,
  seed: string,
): Observable<CelestialObject> {
  const { parentStar, distanceRelativeToParentAU, zone, slotIndex } = placement;
  const bodyTypeRoll = random();

  // With the new zone definition, we can use chances directly.
  const { cometChance, asteroidBeltChance } = zone;

  // First, check for comets.
  if (bodyTypeRoll < cometChance) {
    const comet = generateComet(
      random,
      parentStar,
      distanceRelativeToParentAU,
      slotIndex,
    );
    return comet ? of(comet) : EMPTY;
  }

  // Next, check for asteroid belts.
  if (
    bodyTypeRoll < cometChance + asteroidBeltChance &&
    isValidAsteroidBeltDistance(
      distanceRelativeToParentAU,
      parentStar.realMass_kg,
    )
  ) {
    const belt = generateAsteroidBelt(
      random,
      parentStar.id,
      parentStar.realMass_kg,
      slotIndex,
      distanceRelativeToParentAU,
    );
    return belt ? of(belt) : EMPTY;
  }

  // Otherwise, generate a planet.
  return generatePlanet(
    random,
    parentStar,
    distanceRelativeToParentAU,
    seed,
    zone,
  ).pipe(
    mergeMap((planet) => {
      if (!planet) return EMPTY;
      // After the planet is created, generate its moons.
      const moons$ = generateMoonsObservable(
        random,
        planet,
        planet.realMass_kg,
        planet.realRadius_m,
        seed,
      );
      // Return the planet first, then all its moons.
      return concat(of(planet), moons$);
    }),
  );
}

/**
 * Generates a rogue object not gravitationally bound to the star
 */
function generateRogueObject(
  random: () => number,
  placement: BodyPlacement,
  seed: string,
): Observable<CelestialObject> {
  const { distanceAU } = placement;

  // Generate a rogue planet (no moons for rogue objects typically)
  return generateRoguePlanet(
    random,
    distanceAU,
    seed,
    placement.slotIndex,
    placement.zone,
  );
}
