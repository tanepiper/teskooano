import { utils } from "@teskooano/core-math";
import { type CelestialObject, AU_METERS } from "@teskooano/data-types";
import type { CelestialZone, OrbitalArrangement } from "../zones";
import { OrbitalConfiguration } from "../zones";
import { getRandomItem } from "../utils";
import { SYSTEM_MAX_DISTANCE_AU } from "../constants";

/**
 * Represents a single body placement with its orbital configuration
 */
export interface BodyPlacement {
  distanceAU: number;
  parentStar: CelestialObject;
  distanceRelativeToParentAU: number;
  configuration: OrbitalConfiguration;
  arrangement?: OrbitalArrangement;
  zone: CelestialZone;
  slotIndex: number;
}

export interface PlacementGroup {
  baseDistance: number;
  configuration: OrbitalConfiguration;
  bodies: BodyPlacement[];
  arrangement?: OrbitalArrangement;
}

/**
 * Generates sophisticated body placements with support for special orbital configurations
 */
export function generateBodyDistances(
  random: () => number,
  zones: CelestialZone[],
  stars: CelestialObject[],
): BodyPlacement[] {
  const placementGroups: PlacementGroup[] = [];
  let globalSlotIndex = 0;
  const maxBodies = 50 + Math.floor(random() * 31); // 50-80 bodies

  // Track used distances to ensure proper spacing
  const usedDistances: number[] = [];
  const MIN_SPACING_AU = 0.2; // Minimum 0.2 AU between planets - allows closer but prevents extreme clustering

  // Generate placements for each zone
  for (const zone of zones) {
    if (globalSlotIndex >= maxBodies) {
      break; // Stop if we've hit the body limit
    }

    const zoneGroups = generatePlacementsForZone(
      random,
      zone,
      stars,
      globalSlotIndex,
      usedDistances,
      MIN_SPACING_AU,
    );
    placementGroups.push(...zoneGroups);
    globalSlotIndex += zoneGroups.reduce(
      (sum, group) => sum + group.bodies.length,
      0,
    );

    // Add distances from this zone to the used distances
    zoneGroups.forEach((group) => {
      group.bodies.forEach((body) => {
        usedDistances.push(body.distanceAU);
      });
    });
  }

  // Flatten all placements and sort by distance
  const allPlacements = placementGroups
    .flatMap((group) => group.bodies)
    .sort((a, b) => a.distanceAU - b.distanceAU);

  return filterValidPlacements(allPlacements, stars);
}

/**
 * Generates placement groups for a specific zone
 */
function generatePlacementsForZone(
  random: () => number,
  zone: CelestialZone,
  stars: CelestialObject[],
  startingSlotIndex: number,
  usedDistances: number[],
  minSpacing: number,
): PlacementGroup[] {
  const groups: PlacementGroup[] = [];
  // Use maxBodies from the new zone format
  const numPotentialSlots = Math.floor(random() * zone.maxBodies) + 1;

  let slotIndex = startingSlotIndex;
  let usedSlots = 0;
  let attempts = 0;
  const maxAttempts = numPotentialSlots * 3; // Prevent infinite loops

  while (usedSlots < numPotentialSlots && attempts < maxAttempts) {
    attempts++;

    const distance = generateDistanceInZoneWithSpacing(
      random,
      zone,
      usedDistances,
      minSpacing,
    );

    // If we couldn't find a valid distance, skip this slot
    if (distance === null) {
      continue;
    }

    const parentStar = findClosestStar(distance, stars);
    const relativeDistance = Math.abs(distance - getStarDistance(parentStar));

    // Determine if this should be a special configuration
    const shouldUseSpecialConfig =
      random() < getSpecialConfigurationChance(zone, distance);

    if (shouldUseSpecialConfig) {
      const specialGroup = generateSpecialConfigurationGroup(
        random,
        zone,
        distance,
        parentStar,
        relativeDistance,
        slotIndex,
      );

      if (specialGroup && specialGroup.bodies.length > 0) {
        groups.push(specialGroup);
        usedSlots += specialGroup.bodies.length;
        slotIndex += specialGroup.bodies.length;
        // Add this distance to used distances
        usedDistances.push(distance);
      }
    } else {
      // Standard single body placement
      const standardPlacement = createStandardPlacement(
        distance,
        parentStar,
        relativeDistance,
        zone,
        slotIndex,
      );
      groups.push({
        baseDistance: distance,
        configuration: OrbitalConfiguration.STANDARD,
        bodies: [standardPlacement],
      });
      usedSlots++;
      slotIndex++;
      // Add this distance to used distances
      usedDistances.push(distance);
    }
  }

  return groups;
}

/**
 * Generates a special orbital configuration group (binary, trojan, etc.)
 */
function generateSpecialConfigurationGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  slotIndex: number,
): PlacementGroup | null {
  const availableConfigs = getAvailableConfigurations(zone);
  if (availableConfigs.length === 0) return null;

  const chosenConfig = getRandomItem(availableConfigs, random);
  const arrangement = createArrangement(random, chosenConfig, baseDistance);

  switch (chosenConfig) {
    case OrbitalConfiguration.BINARY_PAIR:
      return generateBinaryPairGroup(
        random,
        zone,
        baseDistance,
        parentStar,
        relativeDistance,
        arrangement,
        slotIndex,
      );

    case OrbitalConfiguration.TROJAN:
      return generateTrojanGroup(
        random,
        zone,
        baseDistance,
        parentStar,
        relativeDistance,
        arrangement,
        slotIndex,
      );

    case OrbitalConfiguration.CO_ORBITAL:
      return generateCoOrbitalGroup(
        random,
        zone,
        baseDistance,
        parentStar,
        relativeDistance,
        arrangement,
        slotIndex,
      );

    case OrbitalConfiguration.ROGUE:
      return generateRogueGroup(
        random,
        zone,
        baseDistance,
        parentStar,
        relativeDistance,
        arrangement,
        slotIndex,
      );

    case OrbitalConfiguration.CIRCUMBINARY:
      return generateCircumbinaryGroup(
        random,
        zone,
        baseDistance,
        parentStar,
        relativeDistance,
        arrangement,
        slotIndex,
      );

    default:
      return null;
  }
}

/**
 * Generates a binary planet pair
 */
function generateBinaryPairGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  arrangement: OrbitalArrangement,
  slotIndex: number,
): PlacementGroup {
  // Binary planets orbit very close to each other
  const separationKm = 10000 + random() * 50000; // 10,000 - 60,000 km
  const separationAU = separationKm / (AU_METERS / 1000);

  const primaryPlacement: BodyPlacement = {
    distanceAU: baseDistance,
    parentStar,
    distanceRelativeToParentAU: relativeDistance,
    configuration: OrbitalConfiguration.BINARY_PAIR,
    arrangement,
    zone,
    slotIndex: slotIndex,
  };

  const secondaryPlacement: BodyPlacement = {
    distanceAU: baseDistance + separationAU * 0.5, // Slightly offset
    parentStar,
    distanceRelativeToParentAU: relativeDistance + separationAU * 0.5,
    configuration: OrbitalConfiguration.BINARY_PAIR,
    arrangement,
    zone,
    slotIndex: slotIndex + 1,
  };

  return {
    baseDistance,
    configuration: OrbitalConfiguration.BINARY_PAIR,
    arrangement,
    bodies: [primaryPlacement, secondaryPlacement],
  };
}

/**
 * Generates a trojan configuration (L4/L5 Lagrange points)
 */
function generateTrojanGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  arrangement: OrbitalArrangement,
  slotIndex: number,
): PlacementGroup {
  // Main body at the base distance
  const mainPlacement: BodyPlacement = {
    distanceAU: baseDistance,
    parentStar,
    distanceRelativeToParentAU: relativeDistance,
    configuration: OrbitalConfiguration.TROJAN,
    arrangement,
    zone,
    slotIndex: slotIndex,
  };

  const bodies = [mainPlacement];

  // Determine number of trojans (1-3)
  const numTrojans = 1 + Math.floor(random() * 3);

  for (let i = 0; i < numTrojans; i++) {
    // Trojans are at the same distance but 60° ahead or behind
    const isL4 = random() < 0.5; // L4 (ahead) or L5 (behind)
    const trojanPlacement: BodyPlacement = {
      distanceAU: baseDistance,
      parentStar,
      distanceRelativeToParentAU: relativeDistance,
      configuration: OrbitalConfiguration.TROJAN,
      arrangement: {
        ...arrangement,
        phaseOffsets: [
          ...(arrangement.phaseOffsets || []),
          isL4 ? Math.PI / 3 : -Math.PI / 3,
        ],
      },
      zone,
      slotIndex: slotIndex + i + 1,
    };
    bodies.push(trojanPlacement);
  }

  return {
    baseDistance,
    configuration: OrbitalConfiguration.TROJAN,
    arrangement,
    bodies,
  };
}

/**
 * Generates a co-orbital configuration (same orbit, different positions)
 */
function generateCoOrbitalGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  arrangement: OrbitalArrangement,
  slotIndex: number,
): PlacementGroup {
  // 2-4 bodies sharing the same orbit
  const numBodies = 2 + Math.floor(random() * 3);
  const bodies: BodyPlacement[] = [];

  for (let i = 0; i < numBodies; i++) {
    const phaseOffset = (i * 2 * Math.PI) / numBodies + (random() - 0.5) * 0.2; // Slight randomization

    const placement: BodyPlacement = {
      distanceAU: baseDistance,
      parentStar,
      distanceRelativeToParentAU: relativeDistance,
      configuration: OrbitalConfiguration.CO_ORBITAL,
      arrangement: {
        ...arrangement,
        phaseOffsets: [...(arrangement.phaseOffsets || []), phaseOffset],
      },
      zone,
      slotIndex: slotIndex + i,
    };
    bodies.push(placement);
  }

  return {
    baseDistance,
    configuration: OrbitalConfiguration.CO_ORBITAL,
    arrangement,
    bodies,
  };
}

/**
 * Generates rogue objects not bound to any star
 */
function generateRogueGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  arrangement: OrbitalArrangement,
  slotIndex: number,
): PlacementGroup {
  // Rogue objects can be anywhere in the zone, but capped at system boundary
  const rogueDistance = Math.min(
    utils.lerp(zone.minAU, zone.maxAU, random()),
    SYSTEM_MAX_DISTANCE_AU,
  );

  const roguePlacement: BodyPlacement = {
    distanceAU: rogueDistance,
    parentStar, // Still need a reference star for zone calculation
    distanceRelativeToParentAU: rogueDistance, // Not really relative to the star
    configuration: OrbitalConfiguration.ROGUE,
    arrangement,
    zone,
    slotIndex: slotIndex,
  };

  return {
    baseDistance: rogueDistance,
    configuration: OrbitalConfiguration.ROGUE,
    arrangement,
    bodies: [roguePlacement],
  };
}

/**
 * Generates circumbinary objects (orbiting both stars in a binary system)
 */
function generateCircumbinaryGroup(
  random: () => number,
  zone: CelestialZone,
  baseDistance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  arrangement: OrbitalArrangement,
  slotIndex: number,
): PlacementGroup {
  // Circumbinary objects must be far enough from both stars to be stable
  const minCircumbinaryDistance = 2.5; // Minimum stable distance in AU for most binaries
  const adjustedDistance = Math.max(baseDistance, minCircumbinaryDistance);

  const circumbinaryPlacement: BodyPlacement = {
    distanceAU: adjustedDistance,
    parentStar, // Will be handled specially in generation
    distanceRelativeToParentAU: adjustedDistance,
    configuration: OrbitalConfiguration.CIRCUMBINARY,
    arrangement,
    zone,
    slotIndex: slotIndex,
  };

  return {
    baseDistance: adjustedDistance,
    configuration: OrbitalConfiguration.CIRCUMBINARY,
    arrangement,
    bodies: [circumbinaryPlacement],
  };
}

/**
 * Helper functions
 */
function generateDistanceInZone(
  random: () => number,
  zone: CelestialZone,
): number {
  // Use a more natural distribution that allows for both clustering and spacing
  const roll = random();

  if (roll < 0.3) {
    // 30% chance for early part of zone (some clustering)
    const earlyPosition = random() * 0.4; // First 40% of zone
    return utils.lerp(zone.minAU, zone.maxAU, earlyPosition);
  } else if (roll < 0.7) {
    // 40% chance for middle part of zone (normal distribution)
    const middlePosition = 0.3 + random() * 0.4; // Middle 40% of zone
    return utils.lerp(zone.minAU, zone.maxAU, middlePosition);
  } else {
    // 30% chance for outer part of zone (scattered objects)
    const outerPosition = 0.6 + random() * 0.4; // Outer 40% of zone
    return utils.lerp(zone.minAU, zone.maxAU, outerPosition);
  }
}

/**
 * Generates a distance within a zone while ensuring proper spacing
 */
function generateDistanceInZoneWithSpacing(
  random: () => number,
  zone: CelestialZone,
  usedDistances: number[],
  minSpacing: number,
): number | null {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const distance = generateDistanceInZone(random, zone);

    // Check if this distance conflicts with existing distances
    const hasConflict = usedDistances.some(
      (usedDistance) => Math.abs(distance - usedDistance) < minSpacing,
    );

    if (!hasConflict) {
      return distance;
    }
  }

  // If we couldn't find a valid distance after many attempts, return null
  return null;
}

function findClosestStar(
  distance: number,
  stars: CelestialObject[],
): CelestialObject {
  let closestStar = stars[0];
  let minDistanceDiff = Infinity;

  for (const star of stars) {
    const starDistance = getStarDistance(star);
    const distanceDiff = Math.abs(distance - starDistance);
    if (distanceDiff < minDistanceDiff) {
      minDistanceDiff = distanceDiff;
      closestStar = star;
    }
  }

  return closestStar;
}

function getStarDistance(star: CelestialObject): number {
  return (star.orbit?.realSemiMajorAxis_m ?? 0) / AU_METERS;
}

function getSpecialConfigurationChance(
  zone: CelestialZone,
  distance: number,
): number {
  // Use formation probability as base chance for special configurations
  return Math.min(0.4, zone.formationProbability * 0.3); // 30% of formation probability, capped at 40%
}

function getAvailableConfigurations(
  zone: CelestialZone,
): OrbitalConfiguration[] {
  // Use the special configurations from the new zone format
  return [...zone.specialConfigurations];
}

function createArrangement(
  random: () => number,
  configuration: OrbitalConfiguration,
  baseDistance: number,
): OrbitalArrangement {
  switch (configuration) {
    case OrbitalConfiguration.BINARY_PAIR:
      return {
        configuration,
        bodyCount: 2,
        massRatios: [0.6 + random() * 0.3, 0.4 + random() * 0.3], // Mass ratios between 0.6-0.9
        phaseOffsets: [0, Math.PI], // 180° apart
      };

    case OrbitalConfiguration.TROJAN:
      return {
        configuration,
        bodyCount: 2 + Math.floor(random() * 3), // 2-4 bodies
        phaseOffsets: [], // Will be filled in during generation
      };

    case OrbitalConfiguration.CO_ORBITAL:
      const bodyCount = 2 + Math.floor(random() * 3);
      return {
        configuration,
        bodyCount,
        phaseOffsets: [], // Will be filled in during generation
      };

    default:
      return {
        configuration,
        bodyCount: 1,
      };
  }
}

function createStandardPlacement(
  distance: number,
  parentStar: CelestialObject,
  relativeDistance: number,
  zone: CelestialZone,
  slotIndex: number,
): BodyPlacement {
  return {
    distanceAU: distance,
    parentStar,
    distanceRelativeToParentAU: relativeDistance,
    configuration: OrbitalConfiguration.STANDARD,
    zone,
    slotIndex,
  };
}

function filterValidPlacements(
  placements: BodyPlacement[],
  stars: CelestialObject[],
): BodyPlacement[] {
  return placements.filter((placement) => {
    // Skip validation for rogue objects
    if (placement.configuration === OrbitalConfiguration.ROGUE) {
      return true;
    }

    // Check minimum distance from parent star
    const parentStar = placement.parentStar;
    const minDistance = (parentStar.realRadius_m * 2.0) / AU_METERS; // 2x stellar radius minimum

    return placement.distanceRelativeToParentAU > minDistance;
  });
}
