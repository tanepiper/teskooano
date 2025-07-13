import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateBodyDistances } from "./utils/body-placement";
import { CelestialZoneManager } from "./zones";
import { ZoneCategory, OrbitalConfiguration } from "./zones/types";
import { PlanetType, GasGiantClass } from "@teskooano/data-types";
import { generateComet, generateSystemNameFromSeed } from "./generators";
import { mergeMap, take } from "rxjs/operators";
import { SYSTEM_MAX_DISTANCE_AU } from "./constants";
import { generateStars } from "./operators/star-generator";
import { StellarSystemType } from "./zones/types";

/**
 * Generates sophisticated star systems with a clean, n-body focused architecture.
 *
 * This refactored system follows a clear, deterministic process:
 * 1. Generate all stars first, positioned around the system barycenter
 * 2. Create zones based on the barycenter and total stellar properties
 * 3. Place planets, asteroid belts, and comets around the stars
 * 4. Add moons to planets
 *
 * The system uses proper n-body physics with all stars orbiting the barycenter,
 * supporting single stars, binary systems, and hierarchical multiples.
 *
 * @param seed The seed string to use for generation. This ensures that the same
 *   seed always produces the same system.
 * @returns A Promise that resolves to an object containing:
 *   - `systemName`: A procedurally generated name for the star system.
 *   - `objects$`: An RxJS `Observable` that emits each generated
 *     `CelestialObject` one by one. The stream completes after all objects for
 *     the system have been emitted.
 */
export async function generateSystem(
  seed: string,
): Promise<{ systemName: string; objects$: Observable<CelestialObject> }> {
  const systemName = await generateSystemNameFromSeed(seed);

  const objects$ = new Observable<CelestialObject>((subscriber) => {
    const runGeneration = async () => {
      try {
        const random = await createSeededRandom(seed);

        // Step 1: Generate ALL stars first, positioned around the barycenter
        const { stars, systemConfig } = generateStars(random);
        
        if (stars.length === 0) {
          throw new Error("System generation failed to produce any stars.");
        }

        // Emit all stars first
        let celestialCount = 0;
        stars.forEach((star) => {
          subscriber.next(star);
          celestialCount++;
        });

        // Step 2: Create zones based on the barycenter and total stellar properties
        const barycenterZones = createBarycenterZones(stars, random);

        // Step 3: Generate celestial bodies (planets, belts, comets) around the stars
        const bodyPlacements = generateBodyDistances(random, barycenterZones, stars);

        const remainingSlots = 80 - celestialCount;

        from(bodyPlacements)
          .pipe(
            generateBodyForSlot(random, seed),
            take(remainingSlots > 0 ? remainingSlots : 0),
            catchError((err) => {
              console.error("Error in body generation pipeline:", err);
              return EMPTY;
            }),
          )
          .subscribe({
            next: (obj) => subscriber.next(obj),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
      } catch (error) {
        subscriber.error(error);
      }
    };

    runGeneration();
  });

  return { systemName, objects$ };
}

/**
 * Creates zones based on the barycenter and total stellar properties.
 * This approach ensures zones are appropriate for the entire system,
 * not just individual stars.
 */
function createBarycenterZones(
  stars: CelestialObject[],
  random: () => number,
): any[] {
  // Calculate total stellar properties for zone scaling
  const totalLuminosity = stars.reduce((sum, star) => {
    const starProps = star.properties as any;
    return sum + (starProps?.luminosity || 0);
  }, 0);
  const totalMass = stars.reduce((sum, star) => sum + star.realMass_kg, 0);
  
  // Use the most massive star for primary zone scaling
  const primaryStar = stars.reduce((max, star) => 
    star.realMass_kg > max.realMass_kg ? star : max
  );

  // Create zones scaled to the barycenter system
  const zoneManager = CelestialZoneManager.createForStar(primaryStar, random);
  
  // Get adjusted zones for the entire system
  const systemConfig = {
    type: stars.length === 1 ? StellarSystemType.SINGLE_STAR : 
          stars.length === 2 ? StellarSystemType.BINARY_WIDE : StellarSystemType.MULTIPLE_COMPLEX,
    stars: stars.length
  };
  
  return zoneManager.selectZonesForPlacement(stars, systemConfig);
}
