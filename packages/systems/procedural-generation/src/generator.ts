import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateSystemName } from "./generators";
import { generateBodyForSlot, generateStars } from "./operators";
import { createSeededRandom } from "./seeded-random";
import { generateBodyDistances } from "./utils/body-placement";
import { CelestialZoneManager } from "./zones";

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
  const random = await createSeededRandom(seed);
  const systemName = generateSystemName(random);

  // Generate the stellar system first using enhanced generation
  const stars = generateStars(random);
  
  // Create zone manager and determine system configuration
  const zoneManager = new CelestialZoneManager(random);
  const systemConfig = zoneManager.determineStellarConfiguration();

  // Generate zones optimized for this stellar system
  const zones = zoneManager.selectZonesForPlacement(stars, systemConfig);

  // Create the main Observable stream with enhanced generation
  const objects$ = new Observable<CelestialObject>((subscriber) => {
    try {
      // Emit all stars first
      stars.forEach((star) => {
        subscriber.next(star);
      });

      // Generate sophisticated body placements using the zone system
      const placements = generateBodyDistances(random, zones, stars);

      // Log system information for debugging
      console.log(`[GenerateSystem] ${systemName}: ${stars.length} star(s), ${placements.length} body placement(s)`);
      console.log(`[GenerateSystem] System type: ${systemConfig.type}`);
      
      // Special configurations summary
      const specialConfigs = placements.filter(p => p.configuration !== 'STANDARD');
      if (specialConfigs.length > 0) {
        console.log(`[GenerateSystem] Special configurations: ${specialConfigs.length}`);
        specialConfigs.forEach(p => {
          console.log(`  - ${p.configuration} at ${p.distanceAU.toFixed(2)} AU`);
        });
      }

      // Generate bodies using the enhanced placement system
      const bodyGenerationPipeline$ = from(placements).pipe(
        generateBodyForSlot(random, seed),
        catchError((err) => {
          console.error("Error in enhanced body generation pipeline:", err);
          subscriber.error(err);
          return EMPTY;
        }),
      );

      const subscription = bodyGenerationPipeline$.subscribe({
        next: (obj) => {
          // Add some metadata about the generation process
          if (obj.properties) {
            (obj.properties as any).generationInfo = {
              systemSeed: seed,
              systemType: systemConfig.type,
              starCount: stars.length,
            };
          }
          subscriber.next(obj);
        },
        error: (err) => subscriber.error(err),
        complete: () => {
          console.log(`[GenerateSystem] ${systemName}: Generation complete`);
          subscriber.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error(`[GenerateSystem] Error setting up system generation for ${systemName}:`, error);
      subscriber.error(error);
    }
  });

  return { systemName, objects$ };
}
