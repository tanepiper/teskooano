import { Observable } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialZone } from "../../zones";
import { PlanetGenerator, RoguePlanetGenerator } from "./planet-generator";

/**
 * Creates an RxJS Observable that generates and emits data for a single planet
 * and its potential ring system.
 *
 * This function acts as an orchestrator, calling specialized helper functions to:
 * 1. Determine the planet's base type (Rocky, Gas Giant, etc.).
 * 2. Calculate its physical properties (mass, radius).
 * 3. Generate specific characteristics (atmosphere, surface type).
 * 4. Generate a ring system based on probability.
 * 5. Calculate its final orbit and initial physics state.
 *
 * It emits the main planet `CelestialObject` first, followed by a
 * `CelestialObject` for the ring system if one was generated.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentStar The parent star object.
 * @param bodyDistanceAU The orbital distance of the planet from the star in AU.
 * @param systemSeed The main system seed string.
 * @param zone The dynamically-scaled celestial zone for this location.
 * @returns An `Observable<CelestialObject>` that emits the planet and then its
 *   ring system (if any), then completes.
 */
export function generatePlanet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
  zone: CelestialZone,
): Observable<CelestialObject> {
  const generator = new PlanetGenerator({
    random,
    parentStar,
    bodyDistanceAU,
    systemSeed,
    zone,
  });
  return generator.generate();
}

/**
 * Creates an RxJS Observable that generates and emits data for a single rogue planet
 * that is not gravitationally bound to any star.
 *
 * Rogue planets are planetary objects that have been ejected from their original
 * stellar system and now drift freely through interstellar space.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param distanceAU The distance from the system center where the rogue planet is located.
 * @param systemSeed The main system seed string.
 * @param slotIndex The slot index for unique naming.
 * @param zone The dynamically-scaled celestial zone for this location.
 * @returns An `Observable<CelestialObject>` that emits the rogue planet and then completes.
 */
export function generateRoguePlanet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
  slotIndex: number,
  zone: CelestialZone,
): Observable<CelestialObject> {
  const generator = new RoguePlanetGenerator({
    random,
    parentStar,
    bodyDistanceAU,
    systemSeed,
    slotIndex,
    zone,
  });
  return generator.generate();
}
