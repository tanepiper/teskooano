import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import {
  CelestialZone,
  ZoneCategory,
  OrbitalConfiguration,
  StellarSystemType,
  type StellarSystemConfiguration,
} from "./types";
import * as CONST from "../constants";
import { getRandomItem } from "../utils";

/**
 * Enhanced zone configurations that create more realistic and interesting systems
 */
export const enhancedCelestialZones: CelestialZone[] = [
  {
    name: "Scorched Zone",
    category: ZoneCategory.SCORCHED,
    baseMinAU: 0.01,
    baseMaxAU: 0.3,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 800, max: 2000 },
    allowedPlanetTypes: [PlanetType.LAVA, PlanetType.ROCKY], // Replaced RockyType.METALLIC
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.1, // Some chance for inner belts
    formationProbability: 0.15,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
    ],
    maxBodies: 3,
  },
  {
    name: "Hot Inner Zone",
    category: ZoneCategory.HOT,
    baseMinAU: 0.3,
    baseMaxAU: 0.8,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 400, max: 800 },
    allowedPlanetTypes: [PlanetType.ROCKY, PlanetType.DESERT, PlanetType.LAVA],
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.2, // Higher chance for the main asteroid belt
    formationProbability: 0.7,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
    ],
    maxBodies: 4,
  },
  {
    name: "Temperate Zone",
    category: ZoneCategory.TEMPERATE,
    baseMinAU: 0.8,
    baseMaxAU: 2.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 200, max: 400 },
    allowedPlanetTypes: [
      PlanetType.TERRESTRIAL,
      PlanetType.OCEAN,
      PlanetType.ROCKY,
      PlanetType.DESERT,
    ],
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0,
    asteroidBeltChance: 0.1,
    formationProbability: 0.85,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
      OrbitalConfiguration.CO_ORBITAL,
    ],
    maxBodies: 3,
  },
  {
    name: "Cool Zone",
    category: ZoneCategory.COOL,
    baseMinAU: 2.0,
    baseMaxAU: 5.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 100, max: 200 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.ROCKY],
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0.02, // Small chance for comets to start appearing
    asteroidBeltChance: 0.15,
    formationProbability: 0.6,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
    ],
    maxBodies: 5,
  },
  {
    name: "Outer Gas Zone",
    category: ZoneCategory.COLD,
    baseMinAU: 5.0,
    baseMaxAU: 30.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 50, max: 100 },
    allowedPlanetTypes: [PlanetType.ICE], // Replaced RockyType.ICE
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0.05,
    asteroidBeltChance: 0.2, // Kuiper-like belt
    formationProbability: 0.8,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
      OrbitalConfiguration.CO_ORBITAL,
    ],
    maxBodies: 4,
  },
  {
    name: "Frozen Outer Zone",
    category: ZoneCategory.FROZEN,
    baseMinAU: 30.0,
    baseMaxAU: 100.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 10, max: 50 },
    allowedPlanetTypes: [PlanetType.ICE], // Replaced RockyType.ICE
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.1, // Higher comet chance
    asteroidBeltChance: 0.25,
    formationProbability: 0.3,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
      OrbitalConfiguration.BINARY_PAIR,
    ],
    maxBodies: 6,
  },
  {
    name: "Outer Zone",
    category: ZoneCategory.OUTER,
    baseMinAU: 100.0,
    baseMaxAU: 1000.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 5, max: 10 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.BARREN], // Replaced RockyType.ICE
    allowedGasGiantClasses: [GasGiantClass.CLASS_II, GasGiantClass.CLASS_III],
    cometChance: 0.15,
    asteroidBeltChance: 0.15,
    formationProbability: 0.2,
    specialConfigurations: [
      OrbitalConfiguration.ROGUE,
      OrbitalConfiguration.BINARY_PAIR,
    ],
    maxBodies: 8,
  },
  {
    name: "Distant Zone",
    category: ZoneCategory.DISTANT,
    baseMinAU: 1000.0,
    baseMaxAU: 5000.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 2, max: 5 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.BARREN],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.2, // Very likely to be comets
    asteroidBeltChance: 0.1,
    formationProbability: 0.15,
    specialConfigurations: [OrbitalConfiguration.ROGUE],
    maxBodies: 10,
  },
  {
    name: "Interstellar Zone",
    category: ZoneCategory.INTERSTELLAR,
    baseMinAU: 5000.0,
    baseMaxAU: 10000.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 2, max: 10 },
    allowedPlanetTypes: [PlanetType.ICE], // Replaced RockyType.ICE
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.25, // Almost exclusively comets or rogue bodies
    asteroidBeltChance: 0.1,
    formationProbability: 0.1,
    specialConfigurations: [OrbitalConfiguration.ROGUE],
    maxBodies: 10,
  },
];

/**
 * Enhanced Celestial Zone Manager that creates realistic, zone-based star systems
 * with sophisticated orbital configurations and multi-star support.
 */
export class CelestialZoneManager {
  private readonly zones: CelestialZone[];
  private readonly random: () => number;

  constructor(random: () => number, customZones?: CelestialZone[]) {
    this.zones = customZones || enhancedCelestialZones;
    this.random = random;
  }

  /**
   * Creates and initializes a `CelestialZoneManager` with zone boundaries
   * dynamically adjusted for the properties of a specific star.
   *
   * @param star The star to base the zone calculations on.
   * @param random The seeded pseudo-random number generator function.
   * @returns A new `CelestialZoneManager` instance with scaled zones.
   */
  static createForStar(
    star: CelestialObject,
    random: () => number,
  ): CelestialZoneManager {
    // Luminosity is proportional to Mass^3.5
    const luminosity = Math.pow(star.realMass_kg / CONST.SOLAR_MASS_KG, 3.5);
    // Zone boundaries scale with the square root of luminosity
    const scalingFactor = Math.sqrt(luminosity);

    const adjustedZones = enhancedCelestialZones.map((zone) => ({
      ...zone,
      minAU: Math.min(
        zone.baseMinAU * scalingFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      maxAU: Math.min(
        zone.baseMaxAU * scalingFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
    }));

    return new CelestialZoneManager(random, adjustedZones);
  }

  /**
   * Determines the stellar system configuration based on probability
   */
  determineStellarConfiguration(): StellarSystemConfiguration {
    const roll = this.random();

    if (roll < 0.6) {
      return { type: StellarSystemType.SINGLE_STAR, stars: 1 };
    } else if (roll < 0.85) {
      return { type: StellarSystemType.BINARY_CLOSE, stars: 2 };
    } else if (roll < 0.95) {
      return { type: StellarSystemType.BINARY_WIDE, stars: 2 };
    } else if (roll < 0.98) {
      return { type: StellarSystemType.TRIPLE_HIERARCHICAL, stars: 3 };
    } else {
      return {
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: Math.floor(this.random() * 3) + 4,
      };
    }
  }

  /**
   * Gets zones adjusted for stellar luminosity and system configuration
   */
  getAdjustedZones(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    if (stars.length === 0) return this.zones;

    // Calculate combined luminosity for multi-star systems
    const totalLuminosity = stars.reduce((sum, star) => {
      const mass = star.realMass_kg || CONST.SOLAR_MASS_KG;
      const solarMasses = mass / CONST.SOLAR_MASS_KG;
      // Main sequence mass-luminosity relation: L ∝ M^3.5
      return sum + Math.pow(solarMasses, 3.5);
    }, 0);

    const complexity = this.getComplexityFactor(config);
    const scaledLuminosity = totalLuminosity * complexity;

    // Adjust zone boundaries based on luminosity
    const luminosityFactor = Math.sqrt(scaledLuminosity);

    return this.zones.map((zone) => ({
      ...zone,
      minAU: Math.min(
        zone.minAU * luminosityFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      maxAU: Math.min(
        zone.maxAU * luminosityFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      // Adjust formation probability based on system complexity
      formationProbability:
        zone.formationProbability * this.getComplexityFactor(config),
    }));
  }

  /**
   * Gets formation probability modifier based on system complexity
   */
  private getComplexityFactor(config: StellarSystemConfiguration): number {
    switch (config.type) {
      case StellarSystemType.SINGLE_STAR:
        return 1.0;
      case StellarSystemType.BINARY_CLOSE:
        return 0.8; // Slightly reduced formation in close binaries
      case StellarSystemType.BINARY_WIDE:
        return 1.1; // Enhanced formation in wide binaries
      case StellarSystemType.TRIPLE_HIERARCHICAL:
        return 0.9;
      case StellarSystemType.MULTIPLE_COMPLEX:
        return 0.7; // Reduced formation in complex systems
      default:
        return 1.0;
    }
  }

  /**
   * Selects appropriate zones for body placement
   */
  selectZonesForPlacement(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    const adjustedZones = this.getAdjustedZones(stars, config);
    const activeZones: CelestialZone[] = [];

    for (const zone of adjustedZones) {
      const shouldInclude = this.random() < zone.formationProbability;
      if (shouldInclude) {
        activeZones.push(zone);
      }
    }

    // Ensure at least one zone is active for non-empty systems
    if (activeZones.length === 0 && stars.length > 0) {
      const fallbackZone = getRandomItem(
        adjustedZones.slice(1, 4),
        this.random,
      ); // Pick from hot/temperate/cool
      activeZones.push(fallbackZone);
    }

    return activeZones;
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
    return this.zones.find(
      (zone) => distanceAU >= zone.minAU && distanceAU < zone.maxAU,
    );
  }
}

/**
 * Generates zones for a star using the provided seeded random function.
 * This ensures deterministic zone generation.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param star The star object to generate zones for.
 * @returns Array of CelestialZone objects adjusted for the star.
 */
export function generateZonesForStar(
  random: () => number,
  star: CelestialObject,
): CelestialZone[] {
  const zoneManager = new CelestialZoneManager(random);
  const config = zoneManager.determineStellarConfiguration();
  return zoneManager.getAdjustedZones([star], config);
}
