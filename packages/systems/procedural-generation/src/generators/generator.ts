import type { CelestialObject } from "@teskooano/data-types";
import { Observable, catchError, concat, from, throwError } from "rxjs";
import { generatePlanetaryBodiesObservable } from "./planetary-generator";
import { createSeededRandom } from "../seeded-random";
import { generateStarsInSystem } from "./star-generator";
import { validateSystemObjects } from "./system-validator";

/**
 * Generates the initial data for celestial objects in a solar system based on a seed string.
 * @param seed The seed string to use for generation.
 * @returns A Promise resolving to an Observable stream of CelestialObjects.
 */
export async function generateSystem(
  seed: string,
  maxSystemModifier: number = 20,
): Promise<{ objects$: Observable<CelestialObject> }> {
  try {
    const random = await createSeededRandom(seed);
    const maxOrbitalSystemsToGenerate =
      Math.floor(random() * maxSystemModifier) + 5; // 5-25 primary orbital systems

    // 1. Generate Stars
    const stars = generateStarsInSystem(random);
    if (stars.length === 0) {
      console.error("[generateSystem] No stars were generated. Aborting.");
      return { objects$: throwError(() => new Error("No stars generated")) };
    }

    // Create an observable that emits stars first
    const stars$ = from(stars);

    // 2. Generate Planetary Bodies (planets, moons, asteroid belts)
    const planetaryBodies$ = generatePlanetaryBodiesObservable(
      random,
      stars,
      seed,
      maxOrbitalSystemsToGenerate,
    );

    // Concatenate stars and then planetary bodies
    const allGeneratedObjects$ = concat(stars$, planetaryBodies$).pipe(
      catchError((err) => {
        console.error(
          "[generateSystem] Error in object generation stream:",
          err,
        );
        return throwError(() => err); // Propagate the error
      }),
    );

    // 3. Validate System
    const validatedObjects$ = validateSystemObjects(allGeneratedObjects$);

    return { objects$: validatedObjects$ };
  } catch (error) {
    console.error("[generateSystem] Critical error during setup:", error);
    return {
      objects$: throwError(
        () =>
          new Error(
            `Critical error in generateSystem setup: ${error instanceof Error ? error.message : String(error)}`,
          ),
      ),
    };
  }
}
