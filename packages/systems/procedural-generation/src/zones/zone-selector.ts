import { type CelestialObject } from "@teskooano/data-types";
import { CelestialZone, ZoneCategory } from "./types";
import { createDefaultZones } from "./zone-definitions";
import { getRandomItem } from "../utils-functions";

/**
 * Handles zone selection for body placement
 */
export class ZoneSelector {
  private readonly random: () => number;

  constructor(random: () => number) {
    this.random = random;
  }

  /**
   * Selects appropriate zones for body placement with improved distribution
   */
  selectZonesForPlacement(
    adjustedZones: CelestialZone[],
    stars: CelestialObject[],
  ): CelestialZone[] {
    // Ensure we have at least some zones to work with
    if (!adjustedZones || adjustedZones.length === 0) {
      return createDefaultZones();
    }

    const activeZones: CelestialZone[] = [];

    // First, guarantee the inner zones that have a minBodies property
    const guaranteedZones = adjustedZones.filter(
      (zone) => (zone.minBodies ?? 0) > 0,
    );
    activeZones.push(...guaranteedZones);

    // More conservative zone selection - prioritize inner zones
    for (const zone of adjustedZones) {
      // Avoid re-adding guaranteed zones
      if (activeZones.find((z) => z.name === zone.name)) {
        continue;
      }

      // Be more restrictive about outer zones
      let inclusionChance = zone.formationProbability;

      // Reduce chances for outer zones to prevent terrestrial planets in inappropriate distances
      inclusionChance *= this.getZoneInclusionMultiplier(zone.category);

      const shouldInclude = this.random() < inclusionChance;
      if (shouldInclude) {
        activeZones.push(zone);
      }
    }

    // Ensure at least some zones are active for non-empty systems
    if (activeZones.length === 0 && stars.length > 0) {
      this.addFallbackZones(adjustedZones, activeZones);
    }

    // Final safety check - if we still have no zones, create a default set
    if (activeZones.length === 0) {
      return createDefaultZones();
    }

    // Limit the total number of zones to prevent over-generation
    // Increased limit for more populated systems
    const maxZones = 5 + Math.floor(this.random() * 3); // 5-7 zones instead of 4-5
    if (activeZones.length > maxZones) {
      // Prioritize inner zones when trimming
      const sortedZones = activeZones.sort((a, b) => a.minAU - b.minAU);
      return sortedZones.slice(0, maxZones);
    }

    return activeZones.sort((a, b) => a.minAU - b.minAU); // Sort by distance
  }

  /**
   * Get zone inclusion multiplier based on zone category
   * Made less restrictive for more populated systems
   */
  private getZoneInclusionMultiplier(category: ZoneCategory): number {
    switch (category) {
      case ZoneCategory.COLD:
      case ZoneCategory.FROZEN:
        return 0.8; // Reduced penalty from 50% to 20%
      case ZoneCategory.OUTER:
      case ZoneCategory.DISTANT:
        return 0.7; // Reduced penalty from 70% to 30%
      case ZoneCategory.INTERSTELLAR:
        return 0.5; // Reduced penalty from 90% to 50%
      default:
        return 1.0; // No reduction
    }
  }

  /**
   * Add fallback zones when no zones are selected
   * Made more generous to ensure populated systems
   */
  private addFallbackZones(
    adjustedZones: CelestialZone[],
    activeZones: CelestialZone[],
  ): void {
    // Add 3-4 zones from different ranges for better distribution
    const innerZones = adjustedZones.slice(0, 3); // Scorched, Hot, Temperate
    const middleZones = adjustedZones.slice(3, 5); // Cool, Outer Gas
    const outerZones = adjustedZones.slice(5); // Frozen, Outer, Distant, Interstellar

    // Always include at least one inner zone
    if (innerZones.length > 0) {
      activeZones.push(getRandomItem(innerZones, this.random));
    }

    // 90% chance for a middle zone (increased from 60%)
    if (middleZones.length > 0 && this.random() < 0.9) {
      activeZones.push(getRandomItem(middleZones, this.random));
    }

    // 60% chance for outer zones (increased from 20%)
    if (outerZones.length > 0 && this.random() < 0.6) {
      activeZones.push(getRandomItem(outerZones, this.random));
    }

    // 30% chance for a second outer zone for more populated systems
    if (outerZones.length > 1 && this.random() < 0.3) {
      const remainingOuter = outerZones.filter(
        (z) => !activeZones.find((a) => a.name === z.name),
      );
      if (remainingOuter.length > 0) {
        activeZones.push(getRandomItem(remainingOuter, this.random));
      }
    }
  }

  /**
   * Gets zone for a specific distance (compatibility method)
   */
  getZoneForDistance(
    zones: CelestialZone[],
    distanceAU: number,
  ): CelestialZone | undefined {
    return zones.find(
      (zone) => distanceAU >= zone.minAU && distanceAU < zone.maxAU,
    );
  }
}
