import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot, generateStars } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateBodyDistances } from "./utils/body-placement";
import { CelestialZoneManager } from "./zones";
import { generateComet, generateSystemNameFromSeed } from "./generators";
import { mergeMap, take } from "rxjs/operators";
import { SYSTEM_MAX_DISTANCE_AU } from "./constants";

/**
 * Generates sophisticated star systems with enhanced realism and variety.
 *
 * This function orchestrates the entire procedural generation process with significant
 * improvements over the previous version:
 * - Enhanced multi-star system support with proper hierarchical structures
 * - Zone-based generation with realistic celestial body placement
 * - Support for special orbital configurations (binary planets, trojans, co-orbital)
 * - Rogue objects in the outer system and interstellar space
 * - Temperature-based planet type determination
 * - Sophisticated asteroid belt and ring system generation
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

        // Step 1: Generate the star(s) first
        const { stars, systemConfig } = generateStars(random);
        const primaryStar = stars[0];

        if (!primaryStar) {
          throw new Error(
            "System generation failed to produce a primary star.",
          );
        }

        // Emit all stars first
        let celestialCount = 0;
        stars.forEach((star) => {
          subscriber.next(star);
          celestialCount++;
        });

        // Step 2: Create zones specific to this star's properties
        const selectedZones = CelestialZoneManager.createStarSpecificZones(
          primaryStar,
          random,
        );

        // Step 3: Select appropriate zones for this specific star (filter and adjust)
        const zoneManager = new CelestialZoneManager(random, selectedZones);
        const finalZones = zoneManager.selectZonesForPlacement(
          stars,
          systemConfig,
        );

        // If no zones were selected, ensure we have at least the basic zones
        if (finalZones.length === 0) {
          finalZones.push(
            ...selectedZones.slice(1, 4), // Hot Inner, Temperate, Cool zones
          );
        }

        // Step 4: Generate celestial bodies within the star-specific zones
        const bodyPlacements = generateBodyDistances(random, finalZones, stars);

        const remainingSlots = 80 - celestialCount;

        from(bodyPlacements)
          .pipe(
            generateBodyForSlot(random, seed),
            take(remainingSlots > 0 ? remainingSlots : 0),
            catchError((err) => {
              console.error("Error in body generation pipeline:", err);
              // We must not let one failed body stop the entire stream.
              return EMPTY;
            }),
          )
          .subscribe({
            next: (obj) => subscriber.next(obj),
            error: (err) => subscriber.error(err), // Should not be reached due to catchError
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
