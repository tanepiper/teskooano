import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateSystemNameFromSeed } from "./generators";
import { generateStars } from "./operators/star-generator";
import { take } from "rxjs/operators";
import { CelestialZoneManager } from "./zones";
import { generateBodyDistances } from "./utils/body-placement";
import {
  setSystemToCurrentEpoch,
  logSystemEpochInfo,
} from "./utils/epoch-utils";

/**
 * Enhanced star system generator using sophisticated zone management.
 *
 * This refactored system follows a clean, deterministic process:
 * 1. Generate stars positioned with proper parent-child relationships
 * 2. Create physics-based zones using CelestialZoneManager
 * 3. Place bodies using sophisticated orbital configurations
 * 4. Add moons to planets
 * 5. Apply current epoch to all celestial objects
 *
 * Uses the sophisticated CelestialZoneManager and advanced body placement for realistic generation.
 */
export async function generateSystem(
  seed: string,
): Promise<{ systemName: string; objects$: Observable<CelestialObject> }> {
  const systemName = await generateSystemNameFromSeed(seed);

  const objects$ = new Observable<CelestialObject>((subscriber) => {
    const runGeneration = async () => {
      try {
        const random = await createSeededRandom(seed);

        // Step 1: Generate ALL stars first, positioned around barycenter
        const { stars, systemConfig } = generateStars(random);
        console.log(systemConfig);

        if (stars.length === 0) {
          throw new Error("System generation failed to produce any stars.");
        }

        // Collect all generated objects
        const allObjects: CelestialObject[] = [];

        // Add stars to collection
        stars.forEach((star) => {
          allObjects.push(star);
        });

        // Step 2: Generate realistic body count (15-45 bodies total)
        const bodyCount = generateRealisticBodyCount(random, stars);

        // Step 3: Create sophisticated zones using CelestialZoneManager
        const zoneManager = new CelestialZoneManager(random);
        const config = zoneManager.determineStellarConfiguration();
        const zones = zoneManager.selectZonesForPlacement(stars, config);

        // Step 4: Generate sophisticated body placements with orbital configurations
        const bodyPlacements = generateBodyDistances(random, zones, stars);

        const remainingSlots = 80 - stars.length;

        // Generate all bodies and collect them
        const bodyObservable = from(bodyPlacements).pipe(
          generateBodyForSlot(random, seed),
          take(remainingSlots > 0 ? remainingSlots : 0),
          catchError((err) => {
            console.error("Error in body generation pipeline:", err);
            return EMPTY;
          }),
        );

        // Collect all bodies first
        await new Promise<void>((resolve) => {
          bodyObservable.subscribe({
            next: (obj) => {
              allObjects.push(obj);
            },
            error: (err) => {
              subscriber.error(err);
              resolve();
            },
            complete: () => {
              resolve();
            },
          });
        });

        // Step 5: Apply current epoch to all celestial objects
        const epochUpdatedObjects = setSystemToCurrentEpoch(allObjects);

        // Log epoch information for debugging
        logSystemEpochInfo(epochUpdatedObjects, systemName);

        // Emit all objects with updated epochs
        epochUpdatedObjects.forEach((obj) => {
          subscriber.next(obj);
        });

        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    };

    runGeneration();
  });

  return { systemName, objects$ };
}

/**
 * Generates body count based on stellar properties.
 * 15-45 bodies total (including moons), creating rich, populated systems.
 */
function generateRealisticBodyCount(
  random: () => number,
  stars: CelestialObject[],
): number {
  const primaryStar = stars.reduce((max, star) =>
    star.realMass_kg > max.realMass_kg ? star : max,
  );

  // Get stellar properties for body count calculation
  const starProps = primaryStar.properties as any;
  const stellarType = starProps?.stellarType || "MAIN_SEQUENCE";
  const spectralClass = starProps?.spectralClass || "G";
  const luminosity = starProps?.luminosity || 1.0;

  // Base body count based on stellar type
  let baseCount: number;
  switch (stellarType) {
    case "WHITE_DWARF":
    case "NEUTRON_STAR":
    case "BLACK_HOLE":
      baseCount = 5 + Math.floor(random() * 10); // 5-15 bodies for compact objects
      break;
    case "RED_GIANT":
    case "SUPERGIANT":
      baseCount = 10 + Math.floor(random() * 20); // 10-30 bodies for giants
      break;
    case "MAIN_SEQUENCE":
    default:
      // Main sequence stars: more bodies for more massive stars
      if (spectralClass === "O" || spectralClass === "B") {
        baseCount = 20 + Math.floor(random() * 25); // 20-45 bodies for massive stars
      } else if (spectralClass === "A" || spectralClass === "F") {
        baseCount = 15 + Math.floor(random() * 20); // 15-35 bodies for hot stars
      } else if (spectralClass === "G" || spectralClass === "K") {
        baseCount = 10 + Math.floor(random() * 15); // 10-25 bodies for Sun-like stars
      } else {
        baseCount = 5 + Math.floor(random() * 10); // 5-15 bodies for red dwarfs
      }
      break;
  }

  // Multi-star system bonus
  if (stars.length > 1) {
    const multiStarBonus = Math.floor(random() * 10); // 0-10 additional bodies
    baseCount += multiStarBonus;
  }

  // Luminosity-based adjustment (more luminous stars can support more bodies)
  const luminosityFactor = Math.min(Math.sqrt(luminosity), 2.0); // Cap at 2x
  const finalCount = Math.floor(baseCount * luminosityFactor);

  // Ensure reasonable bounds
  return Math.max(8, Math.min(45, finalCount));
}
