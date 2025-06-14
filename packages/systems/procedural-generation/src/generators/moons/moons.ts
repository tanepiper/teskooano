import type { CelestialObject } from "@teskooano/data-types";
import { Observable, Subscriber } from "rxjs";
import * as CONST_PROC_GEN from "../../constants"; // Aliasing to avoid conflict if CONST is used locally
import { generateMoon } from "./moon"; // Assuming generateMoon is in the same directory

/**
 * Creates an RxJS Observable that generates and emits moons for a given parent planet.
 *
 * It determines a random number of moons (0-4) and then calls `generateMoon`
 * for each one, emitting the resulting `CelestialObject` downstream.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param planetObject The parent `CelestialObject` (the planet).
 * @param planetMass_kg The mass of the parent planet in kilograms.
 * @param planetRadius_m The radius of the parent planet in meters.
 * @param seed The main system seed string.
 * @returns An `Observable<CelestialObject>` that emits each generated moon and
 *   then completes.
 */
export function generateMoonsObservable(
  random: () => number,
  planetObject: CelestialObject,
  planetMass_kg: number,
  planetRadius_m: number,
  seed: string,
): Observable<CelestialObject> {
  return new Observable((moonSubscriber: Subscriber<CelestialObject>) => {
    // Check if moon generation is appropriate (e.g., based on distance)
    const parentOrbit = planetObject.orbit;
    const parentDistanceAU =
      (parentOrbit?.realSemiMajorAxis_m ?? 0) / CONST_PROC_GEN.AU_TO_METERS;
    // Simple check: don't generate moons too close to the star
    if (parentDistanceAU < 0.3) {
      moonSubscriber.complete();
      return;
    }

    try {
      const numberOfMoons = Math.floor(random() * 5); // Max 4 moons
      let lastMoonDistance_radii = 2.5; // Initial distance multiplier from planet radius

      for (let m = 0; m < numberOfMoons; m++) {
        // Pass planet state if needed by generateMoon in the future
        const { moonData, nextLastMoonDistance_radii } = generateMoon(
          random,
          planetObject, // Parent object
          planetMass_kg,
          planetRadius_m,
          lastMoonDistance_radii,
          seed,
          // planetObject.physicsStateReal // Pass state if needed
        );

        if (moonData) {
          moonSubscriber.next(moonData); // Emit the generated moon
          lastMoonDistance_radii = nextLastMoonDistance_radii; // Update distance for next moon
        } else {
          // Stop trying if generateMoon returns null (e.g., distance constraints)
          break;
        }
      }
      moonSubscriber.complete(); // Finish moon stream for this planet
    } catch (error) {
      console.error(`Error generating moons for ${planetObject.name}:`, error);
      moonSubscriber.error(error); // Propagate error
    }
  });
}
