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
} from "rxjs";
import {
  generateAsteroidBelt,
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
  const { parentStar, distanceRelativeToParentAU, zone } = placement;
  const bodyTypeRoll = random();

  // Check if an asteroid belt is a possibility for this slot
  const asteroidChance =
    zone.category === "COLD" || zone.category === "FROZEN" ? 0.25 : 0.1;
  const isAsteroidBeltCandidate = bodyTypeRoll < asteroidChance;

  if (
    isAsteroidBeltCandidate &&
    isValidAsteroidBeltDistance(
      distanceRelativeToParentAU,
      parentStar.realMass_kg,
    )
  ) {
    const beltData = generateAsteroidBelt(
      random,
      parentStar.id,
      parentStar.realMass_kg,
      placement.slotIndex,
      distanceRelativeToParentAU,
    );
    return beltData ? of(beltData) : EMPTY;
  }

  // If not an asteroid belt, generate a planet and its moons
  const planet$ = generatePlanet(
    random,
    parentStar,
    distanceRelativeToParentAU,
    seed,
  );

  return planet$.pipe(
    mergeMap((planetObject) => {
      // For special configurations, we might modify the generation
      // or add additional objects in the future
      const moon$ = generateMoonsObservable(
        random,
        planetObject,
        planetObject.realMass_kg,
        planetObject.realRadius_m,
        seed,
      );
      return concat(of(planetObject), moon$);
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
  return generateRoguePlanet(random, distanceAU, seed, placement.slotIndex);
}
