import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import {
  concat,
  concatMap,
  EMPTY,
  mergeMap,
  of,
  type OperatorFunction,
} from "rxjs";
import {
  generateAsteroidBelt,
  generateMoonsObservable,
  generatePlanet,
} from "../generators";
import type { BodyPlacement } from "../utils/body-placement";

/**
 * Creates an RxJS `concatMap` operator that, for a given valid orbital slot,
 * generates the appropriate celestial object(s).
 *
 * Based on a random roll, it can generate:
 * - An asteroid belt.
 * - A planet, immediately followed by its generated moons.
 * - Nothing.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param seed The master seed for the system, to be passed down for deterministic generation.
 * @returns An RxJS operator that transforms a valid `BodyPlacement` into an
 *   `Observable` of one or more `CelestialObject`s.
 */
export function generateBodyForSlot(
  random: () => number,
  seed: string,
): OperatorFunction<BodyPlacement, CelestialObject> {
  return concatMap((placement) => {
    const { parentStar, distanceRelativeToParentAU, distanceAU } = placement;
    const parentStarId = parentStar.id;
    const parentStarMass_kg = parentStar.realMass_kg;

    const bodyTypeRoll = random();

    // Generate an Asteroid Belt
    if (bodyTypeRoll < 0.15) {
      if (
        distanceRelativeToParentAU < 2.0 ||
        distanceRelativeToParentAU > 10.0
      ) {
        return EMPTY; // Invalid distance for a belt in this slot.
      }
      const beltData = generateAsteroidBelt(
        random,
        parentStarId,
        parentStarMass_kg,
        distanceAU, // Using distance as a unique identifier for the belt
        distanceRelativeToParentAU,
      );
      return beltData ? of(beltData) : EMPTY;
    }
    // Generate a Planet and its Moons
    else {
      const planet$ = generatePlanet(
        random,
        parentStar,
        distanceRelativeToParentAU,
        seed,
      );

      return planet$.pipe(
        mergeMap((planetOrRingObject) => {
          // If the object is a planet, chain its moon generation.
          if (planetOrRingObject.type !== CelestialType.RING_SYSTEM) {
            const moon$ = generateMoonsObservable(
              random,
              planetOrRingObject,
              planetOrRingObject.realMass_kg,
              planetOrRingObject.realRadius_m,
              seed,
            );
            return concat(of(planetOrRingObject), moon$);
          }
          // Otherwise, it's a ring system; just emit it.
          else {
            return of(planetOrRingObject);
          }
        }),
      );
    }
  });
}
