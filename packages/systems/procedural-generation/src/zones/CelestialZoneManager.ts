import { type CelestialObject } from "@teskooano/data-types";
import { CelestialZone, type StellarSystemConfiguration } from "./types";
import { enhancedCelestialZones } from "./zone-definitions";
import { ZoneScaler } from "./zone-scaler";
import { StellarSystemConfigurator } from "./stellar-system-configurator";
import { ZoneSelector } from "./zone-selector";
import { StarZoneFactory } from "./star-zone-factory";

/**
 * Enhanced Celestial Zone Manager that creates realistic, zone-based star systems
 * with sophisticated orbital configurations and multi-star support.
 */
export class CelestialZoneManager {
  private readonly zones: CelestialZone[];
  private readonly stellarConfigurator: StellarSystemConfigurator;
  private readonly zoneSelector: ZoneSelector;

  constructor(random: () => number, customZones?: CelestialZone[]) {
    this.zones = customZones || enhancedCelestialZones;
    this.stellarConfigurator = new StellarSystemConfigurator(random);
    this.zoneSelector = new ZoneSelector(random);
  }

  /**
   * Creates and initializes a `CelestialZoneManager` with zone boundaries
   * dynamically adjusted for the properties of a specific star.
   */
  static createForStar(
    star: CelestialObject,
    random: () => number,
  ): CelestialZoneManager {
    const scalingFactor = ZoneScaler.calculateScalingFactor(star);
    const adjustedZones = enhancedCelestialZones.map((zone) => ({
      ...zone,
      minAU: zone.baseMinAU * scalingFactor,
      maxAU: zone.baseMaxAU * scalingFactor,
    }));

    return new CelestialZoneManager(random, adjustedZones);
  }

  /**
   * Determines the stellar system configuration based on probability
   */
  determineStellarConfiguration(): StellarSystemConfiguration {
    return this.stellarConfigurator.determineStellarConfiguration();
  }

  /**
   * Gets zones adjusted for stellar luminosity and system configuration
   */
  getAdjustedZones(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    return ZoneScaler.scaleZones(this.zones, stars, config);
  }

  /**
   * Selects appropriate zones for body placement with improved distribution
   */
  selectZonesForPlacement(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    const adjustedZones = this.getAdjustedZones(stars, config);
    return this.zoneSelector.selectZonesForPlacement(adjustedZones, stars);
  }

  /**
   * Gets all available zones (for testing and analysis)
   */
  getAllZones(): CelestialZone[] {
    return [...this.zones];
  }

  /**
   * Gets zone for a specific distance (compatibility method)
   */
  getZoneForDistance(distanceAU: number): CelestialZone | undefined {
    return this.zoneSelector.getZoneForDistance(this.zones, distanceAU);
  }

  /**
   * Creates star-specific zones based on the star's unique characteristics.
   * This is more sophisticated than just scaling generic zones.
   */
  static createStarSpecificZones(star: CelestialObject): CelestialZone[] {
    return StarZoneFactory.createStarSpecificZones(star);
  }
}

/**
 * Generates zones for a star using the provided seeded random function.
 * This ensures deterministic zone generation.
 */
export function generateZonesForStar(
  random: () => number,
  star: CelestialObject,
): CelestialZone[] {
  const zoneManager = new CelestialZoneManager(random);
  const config = zoneManager.determineStellarConfiguration();
  return zoneManager.getAdjustedZones([star], config);
}
