import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateSystemNameFromSeed } from "./generators";
import { generateStars } from "./operators/star-generator";
import { StellarSystemType } from "./zones/types";
import { take } from "rxjs/operators";

/**
 * Simplified, realistic star system generator.
 * 
 * This refactored system follows a clean, deterministic process:
 * 1. Generate stars positioned around barycenter
 * 2. Create simple temperature-based zones
 * 3. Place 3-12 realistic bodies based on stellar properties
 * 4. Add moons to planets
 * 
 * No complex zone management, no over-engineering, just realistic astrophysics.
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
        
        if (stars.length === 0) {
          throw new Error("System generation failed to produce any stars.");
        }

        // Emit all stars first
        let celestialCount = 0;
        stars.forEach((star) => {
          subscriber.next(star);
          celestialCount++;
        });

        // Step 2: Generate realistic body count (3-12, not 50-80)
        const bodyCount = generateRealisticBodyCount(random, stars);
        
        // Step 3: Create simple temperature-based zones
        const zones = createSimpleZones(stars);
        
        // Step 4: Generate body placements with proper distribution
        const bodyPlacements = generateSimpleBodyPlacements(random, zones, stars, bodyCount);

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
 * Generates realistic body count based on stellar properties.
 * 3-12 bodies total, not the unrealistic 50-80.
 */
function generateRealisticBodyCount(
  random: () => number,
  stars: CelestialObject[],
): number {
  const primaryStar = stars.reduce((max, star) => 
    star.realMass_kg > max.realMass_kg ? star : max
  );
  
  // Base count: 3-8 for single stars, 4-12 for multiple stars
  const baseCount = stars.length === 1 ? 3 : 4;
  const maxCount = stars.length === 1 ? 8 : 12;
  
  // Adjust based on stellar mass (more massive stars = more planets)
  const massFactor = Math.min(primaryStar.realMass_kg / 1.989e30, 3.0); // Cap at 3x solar mass
  const adjustedMax = Math.floor(baseCount + (maxCount - baseCount) * massFactor);
  
  return baseCount + Math.floor(random() * (adjustedMax - baseCount + 1));
}

/**
 * Creates simple temperature-based zones without over-engineering.
 */
function createSimpleZones(stars: CelestialObject[]): any[] {
  const primaryStar = stars.reduce((max, star) => 
    star.realMass_kg > max.realMass_kg ? star : max
  );
  
  // Get stellar temperature for zone scaling
  const starProps = primaryStar.properties as any;
  const temperature = starProps?.temperature || 5778; // Default to solar temperature
  
  // Simple temperature-based zone scaling
  const scalingFactor = Math.sqrt(temperature / 5778); // Square root of temperature ratio
  
  return [
    {
      name: "Inner Zone",
      minAU: 0.1 * scalingFactor,
      maxAU: 0.5 * scalingFactor,
      temperatureRange: { min: temperature * 0.8, max: temperature * 1.2 },
      allowedPlanetTypes: ["ROCKY", "DESERT", "LAVA"],
      formationProbability: 0.6,
      maxBodies: 2,
      minBodies: 0,
    },
    {
      name: "Habitable Zone", 
      minAU: 0.5 * scalingFactor,
      maxAU: 2.0 * scalingFactor,
      temperatureRange: { min: temperature * 0.3, max: temperature * 0.8 },
      allowedPlanetTypes: ["TERRESTRIAL", "OCEAN", "ROCKY"],
      formationProbability: 0.8,
      maxBodies: 3,
      minBodies: 1,
    },
    {
      name: "Outer Zone",
      minAU: 2.0 * scalingFactor, 
      maxAU: 10.0 * scalingFactor,
      temperatureRange: { min: temperature * 0.1, max: temperature * 0.3 },
      allowedPlanetTypes: ["ICE", "ROCKY"],
      formationProbability: 0.4,
      maxBodies: 2,
      minBodies: 0,
    }
  ];
}

/**
 * Generates simple body placements with proper distribution.
 * Uses power law distribution instead of complex placement logic.
 */
function generateSimpleBodyPlacements(
  random: () => number,
  zones: any[],
  stars: CelestialObject[],
  targetBodyCount: number,
): any[] {
  const placements: any[] = [];
  const usedDistances: number[] = [];
  const minSpacing = 0.1; // Minimum 0.1 AU between bodies
  
  // Generate placements for each zone
  for (const zone of zones) {
    const zoneBodyCount = Math.floor(
      zone.formationProbability * (zone.maxBodies - zone.minBodies) + zone.minBodies
    );
    
    for (let i = 0; i < zoneBodyCount && placements.length < targetBodyCount; i++) {
      // Use power law distribution for realistic spacing
      const distance = generatePowerLawDistance(random, zone.minAU, zone.maxAU);
      
      // Check spacing
      const tooClose = usedDistances.some(d => Math.abs(distance - d) < minSpacing);
      if (tooClose) continue;
      
      // Find parent star (simplified logic)
      const parentStar = stars.length === 1 ? stars[0] : 
        stars.reduce((max, star) => star.realMass_kg > max.realMass_kg ? star : max);
      
      placements.push({
        distanceAU: distance,
        parentStar,
        distanceRelativeToParentAU: distance,
        configuration: "STANDARD",
        zone,
        slotIndex: placements.length,
      });
      
      usedDistances.push(distance);
    }
  }
  
  return placements;
}

/**
 * Generates distance using power law distribution (more realistic than uniform).
 * P(r) ∝ r^(-1.5) for planetary systems.
 */
function generatePowerLawDistance(
  random: () => number,
  minAU: number,
  maxAU: number,
): number {
  // Power law with exponent -1.5 (realistic for planetary systems)
  const alpha = 1.5;
  const u = random();
  
  // Inverse transform sampling for power law
  const distance = Math.pow(
    Math.pow(minAU, 1 - alpha) + u * (Math.pow(maxAU, 1 - alpha) - Math.pow(minAU, 1 - alpha)),
    1 / (1 - alpha)
  );
  
  return distance;
}
