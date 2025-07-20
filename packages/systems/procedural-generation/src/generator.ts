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
        console.log(systemConfig);

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
 * 15-45 bodies total (including moons), creating rich, populated systems.
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

  // More conservative base count to account for moons
  // Base count: 3-8 for single stars, 5-12 for multiple stars
  const baseCount = stars.length === 1 ? 3 : 5;
  const maxCount = stars.length === 1 ? 8 : 12;

  // Adjust based on stellar mass and luminosity
  const massFactor = Math.min(primaryStar.realMass_kg / 1.989e30, 4.0); // Up to 4x solar mass
  const luminosityFactor = Math.min(totalLuminosity, 5.0); // Up to 5x solar luminosity

  // Calculate adjusted range
  const adjustedMax = Math.floor(
    baseCount + ((maxCount - baseCount) * (massFactor + luminosityFactor)) / 2,
  );

  // Add random variation for interesting systems (up to +3 more)
  const randomBonus = Math.floor(random() * 3);

  const finalCount = Math.min(
    25, // Reduced from 45 to 25 to prevent exceeding 80-celestial limit
    baseCount +
      Math.floor(random() * (adjustedMax - baseCount + 1)) +
      randomBonus,
  );

  return Math.max(8, finalCount); // Reduced minimum from 15 to 8
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
  let scalingFactor = Math.sqrt(temperature / 5778); // Square root of temperature ratio

  // For multi-star systems, adjust scaling based on total stellar mass/luminosity
  if (stars.length > 1) {
    const totalMass = stars.reduce((sum, star) => sum + star.realMass_kg, 0);
    const solarMasses = totalMass / 1.9885e30; // Solar mass in kg
    const multiStarScaling = Math.sqrt(solarMasses); // L ∝ M^3.5, but we use √M for gameplay
    scalingFactor *= Math.min(multiStarScaling, 3.0); // Cap at 3x to prevent overly spread systems
  }

  // Base zones for the primary star
  const baseZones = [
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
      temperatureRange: { min: temperature * 0.05, max: temperature * 0.1 },
      allowedPlanetTypes: ["ICE"],
      formationProbability: 0.4,
      maxBodies: 3,
      minBodies: 1,
    },
  ];

  // For multi-star systems, add companion star zones
  if (stars.length > 1) {
    const companionStars = stars.filter((star) => star.id !== primaryStar.id);

    for (let i = 0; i < companionStars.length; i++) {
      const companion = companionStars[i];
      const companionProps = companion.properties as any;
      const companionTemp = companionProps?.temperature || temperature * 0.8; // Assume cooler companion
      const companionScaling = Math.sqrt(companionTemp / 5778);

      // Create zones for this companion star (scaled down)
      const companionZones = [
        {
          name: `Companion ${i + 1} Inner Zone`,
          minAU: 0.1 * companionScaling,
          maxAU: 0.5 * companionScaling,
          temperatureRange: {
            min: companionTemp * 0.5,
            max: companionTemp * 0.8,
          },
          allowedPlanetTypes: ["TERRESTRIAL", "ROCKY", "DESERT"],
          formationProbability: 0.7,
          maxBodies: 2,
          minBodies: 1,
        },
        {
          name: `Companion ${i + 1} Outer Zone`,
          minAU: 0.5 * companionScaling,
          maxAU: 3.0 * companionScaling,
          temperatureRange: {
            min: companionTemp * 0.2,
            max: companionTemp * 0.5,
          },
          allowedPlanetTypes: ["ICE", "ROCKY"],
          formationProbability: 0.6,
          maxBodies: 2,
          minBodies: 1,
        },
      ];

      baseZones.push(...companionZones);
    }
  }

  return baseZones;
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

      // Determine parent star based on zone name
      let parentStar: CelestialObject;
      if (zone.name.startsWith("Companion")) {
        // Extract companion index from zone name (e.g., "Companion 1 Inner Zone" -> index 0)
        const match = zone.name.match(/Companion (\d+)/);
        if (match) {
          const companionIndex = parseInt(match[1]) - 1;
          const companionStars = stars.filter(
            (star) =>
              star.id !==
              stars.reduce((max, s) =>
                s.realMass_kg > max.realMass_kg ? s : max,
              ).id,
          );
          parentStar = companionStars[companionIndex] || stars[0];
        } else {
          parentStar = selectParentStar(random, stars, distance);
        }
      } else {
        // Primary star zones - use the main star
        parentStar = stars.reduce((max, star) =>
          star.realMass_kg > max.realMass_kg ? star : max,
        );
      }

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

  return placements;
}

/**
 * Selects an appropriate parent star for a planet based on distance and star properties
 */
function selectParentStar(
  random: () => number,
  stars: CelestialObject[],
  distanceAU: number,
): CelestialObject {
  if (stars.length === 1) {
    return stars[0];
  }

  // For multi-star systems, create more balanced distribution
  const mainStar = stars.reduce((max, star) =>
    star.realMass_kg > max.realMass_kg ? star : max,
  );
  const companionStars = stars.filter((star) => star.id !== mainStar.id);

  // More balanced distribution strategy:
  // 1. For very close planets (0-2 AU): 60% main star, 40% companions
  // 2. For medium distance (2-10 AU): 40% main star, 60% companions
  // 3. For distant planets (10+ AU): 30% main star, 70% companions
  let mainStarWeight: number;

  if (distanceAU <= 2.0) {
    mainStarWeight = 0.6;
  } else if (distanceAU <= 10.0) {
    mainStarWeight = 0.4;
  } else {
    mainStarWeight = 0.3;
  }

  const companionWeight = (1.0 - mainStarWeight) / companionStars.length;

  // Add some randomness to prevent predictable patterns
  const randomFactor = 0.1; // ±10% variation
  const adjustedMainWeight = mainStarWeight + (random() - 0.5) * randomFactor;
  const adjustedCompanionWeight =
    (1.0 - adjustedMainWeight) / companionStars.length;

  const roll = random();

  if (roll < adjustedMainWeight) {
    return mainStar;
  } else {
    // Select a companion star with equal probability
    const companionIndex = Math.floor(
      (roll - adjustedMainWeight) / adjustedCompanionWeight,
    );
    return companionStars[companionIndex % companionStars.length];
  }
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
