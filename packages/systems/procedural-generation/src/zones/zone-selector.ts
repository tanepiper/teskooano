import { type CelestialObject } from "@teskooano/data-types";
import {
  CelestialZone,
  ZoneCategory,
  type StellarSystemConfiguration,
} from "./types";
import { createDefaultZones } from "./zone-definitions";
import { getRandomItem } from "../utils";

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
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    // Ensure we have at least some zones to work with
    if (!adjustedZones || adjustedZones.length === 0) {
      console.warn(
        "[ZoneSelector] No adjusted zones available, using default zones",
      );
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
    const maxZones = 4 + Math.floor(this.random() * 2); // 4-5 zones max
    if (activeZones.length > maxZones) {
      // Prioritize inner zones when trimming
      const sortedZones = activeZones.sort((a, b) => a.minAU - b.minAU);
      return sortedZones.slice(0, maxZones);
    }

    return activeZones.sort((a, b) => a.minAU - b.minAU); // Sort by distance
  }

  /**
   * Get zone inclusion multiplier based on zone category
   */
  private getZoneInclusionMultiplier(category: ZoneCategory): number {
    switch (category) {
      case ZoneCategory.COLD:
      case ZoneCategory.FROZEN:
        return 0.5; // 50% reduction
      case ZoneCategory.OUTER:
      case ZoneCategory.DISTANT:
        return 0.3; // 70% reduction
      case ZoneCategory.INTERSTELLAR:
        return 0.1; // 90% reduction
      default:
        return 1.0; // No reduction
    }
  }

  /**
   * Add fallback zones when no zones are selected
   */
  private addFallbackZones(
    adjustedZones: CelestialZone[],
    activeZones: CelestialZone[],
  ): void {
    // Add 2-3 random zones from different ranges, but be more conservative
    const innerZones = adjustedZones.slice(1, 4); // Hot, Temperate, Cool (skip Scorched)
    const middleZones = adjustedZones.slice(4, 6); // Cold, Frozen
    const outerZones = adjustedZones.slice(6); // Outer, Distant, Interstellar

    // Always include at least one inner zone
    if (innerZones.length > 0) {
      activeZones.push(getRandomItem(innerZones, this.random));
    } else if (adjustedZones.length > 0) {
      // If no inner zones, use any available zone
      activeZones.push(adjustedZones[0]);
    }

    // 60% chance for a middle zone
    if (middleZones.length > 0 && this.random() < 0.6) {
      activeZones.push(getRandomItem(middleZones, this.random));
    }

    // Only 20% chance for outer zones
    if (outerZones.length > 0 && this.random() < 0.2) {
      activeZones.push(getRandomItem(outerZones, this.random));
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
