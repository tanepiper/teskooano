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
} from "../generators";
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

  // Check if asteroid belt is supported and likely
  if (zone.supportsAsteroidBelts && bodyTypeRoll < 0.15) {
    if (distanceRelativeToParentAU < 2.0 || distanceRelativeToParentAU > 10.0) {
      return EMPTY; // Invalid distance for a belt
    }
    
    const beltData = generateAsteroidBelt(
      random,
      parentStar.id,
      parentStar.realMass_kg,
      placement.slotIndex,
      distanceRelativeToParentAU,
    );
    return beltData ? of(beltData) : EMPTY;
  }

  // Generate a planet and its moons
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
  const rogueSeed = `${seed}-rogue-${placement.slotIndex}`;
  
  // Create a minimal "star" at the rogue location for generation purposes
  const dummyStar: CelestialObject = {
    id: 'rogue-center',
    name: 'Rogue Center',
    type: CelestialType.OTHER,
    status: 'active' as any,
    realRadius_m: 1000,
    realMass_kg: 1e20, // Very small mass
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    temperature: 2.7, // Background temperature
    physicsStateReal: {
      id: 'rogue-center',
      mass_kg: 1e20,
      position_m: { x: distanceAU * 1.496e11, y: 0, z: 0 } as any,
      velocity_mps: { x: 0, y: 0, z: 0 } as any,
    },
  };
  
  // Generate a rogue planet (no moons for rogue objects typically)
  return generatePlanet(random, dummyStar, 0.1, rogueSeed);
}
