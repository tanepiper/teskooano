import type { CelestialObject } from "@teskooano/data-types";
import { EMPTY, Observable, catchError, from } from "rxjs";
import { generateBodyForSlot } from "./operators";
import { createSeededRandom } from "@teskooano/core-math";
import { generateSystemNameFromSeed } from "./generators";
import { generateStars } from "./operators/star-generator";
import { StellarSystemType } from "./zones/types";
import { take } from "rxjs/operators";

/**
 * Simplified, rich star system generator.
 *
 * This refactored system follows a clean, deterministic process:
 * 1. Generate stars positioned with proper parent-child relationships
 * 2. Create simple temperature-based zones
 * 3. Place 15-80 bodies based on stellar properties (including moons)
 * 4. Add moons to planets
 *
 * No complex zone management, no over-engineering, just populated systems.
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
        const bodyPlacements = generateSimpleBodyPlacements(
          random,
          zones,
          stars,
          bodyCount,
        );

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
 * Generates body count based on stellar properties.
 * 15-80 bodies total (including moons), creating rich, populated systems.
 */
function generateRealisticBodyCount(
  random: () => number,
  stars: CelestialObject[],
): number {
  const primaryStar = stars.reduce((max, star) =>
    star.realMass_kg > max.realMass_kg ? star : max,
  );

  const totalLuminosity = stars.reduce((sum, star) => {
    const starProps = star.properties as any;
    return sum + (starProps?.luminosity || 1);
  }, 0);

  // Base count: 5-15 for single stars, 10-30 for multiple stars
  const baseCount = stars.length === 1 ? 5 : 10;
  const maxCount = stars.length === 1 ? 15 : 30;

  // Adjust based on stellar mass and luminosity
  const massFactor = Math.min(primaryStar.realMass_kg / 1.989e30, 4.0); // Up to 4x solar mass
  const luminosityFactor = Math.min(totalLuminosity, 5.0); // Up to 5x solar luminosity

  // Calculate adjusted range
  const adjustedMax = Math.floor(
    baseCount + ((maxCount - baseCount) * (massFactor + luminosityFactor)) / 2,
  );

  // Add random variation for interesting systems (up to +5 more)
  const randomBonus = Math.floor(random() * 5);

  const finalCount = Math.min(
    45,
    baseCount +
      Math.floor(random() * (adjustedMax - baseCount + 1)) +
      randomBonus,
  );

  return Math.max(15, finalCount); // Ensure minimum of 15 bodies
}

/**
 * Creates simple temperature-based zones for rich system generation.
 * 5 zones with higher body counts to support 15-80 bodies per system.
 */
function createSimpleZones(stars: CelestialObject[]): any[] {
  const primaryStar = stars.reduce((max, star) =>
    star.realMass_kg > max.realMass_kg ? star : max,
  );

  // Get stellar temperature for zone scaling
  const starProps = primaryStar.properties as any;
  const temperature = starProps?.temperature || 5778; // Default to solar temperature

  // Simple temperature-based zone scaling
  const scalingFactor = Math.sqrt(temperature / 5778); // Square root of temperature ratio

  return [
    {
      name: "Hot Zone",
      minAU: 0.05 * scalingFactor,
      maxAU: 0.3 * scalingFactor,
      temperatureRange: { min: temperature * 0.8, max: temperature * 1.5 },
      allowedPlanetTypes: ["ROCKY", "DESERT", "LAVA"],
      formationProbability: 0.7,
      maxBodies: 2,
      minBodies: 1,
    },
    {
      name: "Inner Zone",
      minAU: 0.3 * scalingFactor,
      maxAU: 0.8 * scalingFactor,
      temperatureRange: { min: temperature * 0.5, max: temperature * 0.8 },
      allowedPlanetTypes: ["TERRESTRIAL", "ROCKY", "DESERT"],
      formationProbability: 0.8,
      maxBodies: 3,
      minBodies: 2,
    },
    {
      name: "Habitable Zone",
      minAU: 0.8 * scalingFactor,
      maxAU: 2.5 * scalingFactor,
      temperatureRange: { min: temperature * 0.3, max: temperature * 0.5 },
      allowedPlanetTypes: ["TERRESTRIAL", "OCEAN", "ROCKY"],
      formationProbability: 0.9,
      maxBodies: 3,
      minBodies: 2,
    },
    {
      name: "Outer Zone",
      minAU: 2.5 * scalingFactor,
      maxAU: 15.0 * scalingFactor,
      temperatureRange: { min: temperature * 0.1, max: temperature * 0.3 },
      allowedPlanetTypes: ["ICE", "ROCKY"],
      formationProbability: 0.6,
      maxBodies: 4,
      minBodies: 3,
    },
    {
      name: "Distant Zone",
      minAU: 15.0 * scalingFactor,
      maxAU: 50.0 * scalingFactor,
      temperatureRange: { min: temperature * 0.01, max: temperature * 0.1 },
      allowedPlanetTypes: ["ICE", "ROCKY"],
      formationProbability: 0.4,
      maxBodies: 3,
      minBodies: 1,
    },
  ];
}

/**
 * Generates simple body placements with proper distribution.
 * Uses power law distribution and ensures we reach the target body count.
 */
function generateSimpleBodyPlacements(
  random: () => number,
  zones: any[],
  stars: CelestialObject[],
  targetBodyCount: number,
): any[] {
  const placements: any[] = [];
  const usedDistances: number[] = [];
  const minSpacing = 0.05; // Reduced minimum spacing to allow more bodies

  // Calculate bodies per zone to reach target count
  const totalZones = zones.length;
  const bodiesPerZone = Math.ceil(targetBodyCount / totalZones);

  // Generate placements for each zone
  for (const zone of zones) {
    let attempts = 0;
    const maxAttempts = bodiesPerZone * 3; // Allow more attempts to fill zones

    // Generate more bodies per zone to reach target
    for (
      let i = 0;
      i < bodiesPerZone &&
      placements.length < targetBodyCount &&
      attempts < maxAttempts;
      attempts++
    ) {
      // Use power law distribution for realistic spacing
      const distance = generatePowerLawDistance(random, zone.minAU, zone.maxAU);

      // Check spacing (allow closer spacing for more bodies)
      const tooClose = usedDistances.some(
        (d) => Math.abs(distance - d) < minSpacing,
      );
      if (tooClose) continue;

      // Find parent star (simplified logic)
      const parentStar =
        stars.length === 1
          ? stars[0]
          : stars.reduce((max, star) =>
              star.realMass_kg > max.realMass_kg ? star : max,
            );

      placements.push({
        distanceAU: distance,
        parentStar,
        distanceRelativeToParentAU: distance,
        configuration: "STANDARD",
        zone,
        slotIndex: placements.length,
      });

      usedDistances.push(distance);
      i++;
    }
  }

  // If we still haven't reached target, add more bodies with relaxed constraints
  while (placements.length < targetBodyCount) {
    const randomZone = zones[Math.floor(random() * zones.length)];
    const distance = generatePowerLawDistance(
      random,
      randomZone.minAU,
      randomZone.maxAU,
    );

    // More relaxed spacing check
    const tooClose = usedDistances.some(
      (d) => Math.abs(distance - d) < minSpacing * 0.5,
    );
    if (tooClose) continue;

    const parentStar =
      stars.length === 1
        ? stars[0]
        : stars.reduce((max, star) =>
            star.realMass_kg > max.realMass_kg ? star : max,
          );

    placements.push({
      distanceAU: distance,
      parentStar,
      distanceRelativeToParentAU: distance,
      configuration: "STANDARD",
      zone: randomZone,
      slotIndex: placements.length,
    });

    usedDistances.push(distance);
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
    Math.pow(minAU, 1 - alpha) +
      u * (Math.pow(maxAU, 1 - alpha) - Math.pow(minAU, 1 - alpha)),
    1 / (1 - alpha),
  );

  return distance;
}
