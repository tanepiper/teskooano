import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateSystemName } from "./generators";
import { generateBodyForSlot, generateStars } from "./operators";
import { createSeededRandom } from "./seeded-random";
import { generateBodyDistances } from "./utils/body-placement";
import { CelestialZoneManager } from "./zones";

/**
 * Generates the initial data for celestial objects and a name for a solar system
 * based on a seed string.
 *
 * This function orchestrates the entire procedural generation process. It begins
 * by creating stars, handling single and multi-star systems with internal
 * barycentric physics calculations. It then uses a reactive RxJS pipeline to
 * generate planets, moons, and asteroid belts in a deterministic sequence.
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
  const random = await createSeededRandom(seed);
  const systemName = generateSystemName(random);

  const stars = generateStars(random);

  // Create the main Observable stream
  const objects$ = new Observable<CelestialObject>((subscriber) => {
    stars.forEach((star) => subscriber.next(star));

    // Generate zones based on the primary star
    const zones = CelestialZoneManager.generateZonesForStar(stars[0]);

    // Generate all body placements based on zone rules
    const placements = generateBodyDistances(random, zones, stars);

    const bodyGenerationPipeline$ = from(placements).pipe(
      generateBodyForSlot(random, seed),
      catchError((err) => {
        console.error("Error in body generation pipeline:", err);
        subscriber.error(err);
        return EMPTY;
      }),
    );

    const subscription = bodyGenerationPipeline$.subscribe({
      next: (obj) => subscriber.next(obj),
      error: (err) => subscriber.error(err),
      complete: () => subscriber.complete(),
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  return { systemName, objects$ };
}
