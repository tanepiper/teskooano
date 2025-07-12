import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot, generateStars } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateBodyDistances } from "./utils/body-placement";
import { CelestialZoneManager } from "./zones";
import { ZoneCategory, OrbitalConfiguration } from "./zones/types";
import { PlanetType, GasGiantClass } from "@teskooano/data-types";
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
        let finalZones = zoneManager.selectZonesForPlacement(
          stars,
          systemConfig,
        );

        // Enhanced fallback: If no zones were selected or the result is empty,
        // ensure we have at least some basic zones for a viable system
        if (!finalZones || finalZones.length === 0) {
          console.warn(
            "[SystemGenerator] No zones were selected, using fallback zones",
          );

          // First try to use the selected zones if they exist
          if (selectedZones && selectedZones.length > 0) {
            // Use at least the Hot Inner, Temperate, and Cool zones (indices 1-3)
            const basicZones = selectedZones.filter(
              (_, index) => index >= 1 && index <= 3,
            );
            if (basicZones.length > 0) {
              finalZones = basicZones;
            } else {
              // If we still don't have zones, use all available zones
              finalZones = selectedZones;
            }
          }

          // If we still have no zones, create default ones
          if (finalZones.length === 0) {
            // Create default zones based on a G-type star (solar-like)
            finalZones = [
              {
                name: "Hot Inner Zone",
                category: ZoneCategory.HOT,
                baseMinAU: 0.4,
                baseMaxAU: 0.8,
                minAU: 0.4,
                maxAU: 0.8,
                temperatureRange: { min: 400, max: 800 },
                allowedPlanetTypes: [
                  PlanetType.ROCKY,
                  PlanetType.DESERT,
                  PlanetType.LAVA,
                ],
                allowedGasGiantClasses: [
                  GasGiantClass.CLASS_IV,
                  GasGiantClass.CLASS_V,
                ],
                cometChance: 0,
                asteroidBeltChance: 0.2,
                formationProbability: 0.7,
                specialConfigurations: [OrbitalConfiguration.STANDARD],
                maxBodies: 3,
                minBodies: 1,
              },
              {
                name: "Temperate Zone",
                category: ZoneCategory.TEMPERATE,
                baseMinAU: 0.8,
                baseMaxAU: 2.0,
                minAU: 0.8,
                maxAU: 2.0,
                temperatureRange: { min: 200, max: 400 },
                allowedPlanetTypes: [
                  PlanetType.TERRESTRIAL,
                  PlanetType.OCEAN,
                  PlanetType.ROCKY,
                ],
                allowedGasGiantClasses: [
                  GasGiantClass.CLASS_I,
                  GasGiantClass.CLASS_II,
                ],
                cometChance: 0,
                asteroidBeltChance: 0.1,
                formationProbability: 0.85,
                specialConfigurations: [OrbitalConfiguration.STANDARD],
                maxBodies: 3,
                minBodies: 1,
              },
              {
                name: "Cool Zone",
                category: ZoneCategory.COOL,
                baseMinAU: 2.0,
                baseMaxAU: 5.0,
                minAU: 2.0,
                maxAU: 5.0,
                temperatureRange: { min: 100, max: 200 },
                allowedPlanetTypes: [PlanetType.ICE, PlanetType.ROCKY],
                allowedGasGiantClasses: [
                  GasGiantClass.CLASS_I,
                  GasGiantClass.CLASS_II,
                ],
                cometChance: 0.02,
                asteroidBeltChance: 0.15,
                formationProbability: 0.6,
                specialConfigurations: [OrbitalConfiguration.STANDARD],
                maxBodies: 3,
                minBodies: 1,
              },
            ];
          }
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
