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

// Helper functions for zone calculations
function calculateStellarLuminosity(mass: number): number {
  // Main sequence mass-luminosity relation: L ∝ M^3.5
  return Math.pow(mass, 3.5);
}

function calculateHabitableZoneFromLuminosity(luminosity: number): {
  inner: number;
  outer: number;
} {
  // Habitable zone calculation based on stellar luminosity
  const sqrtL = Math.sqrt(luminosity);
  return {
    inner: 0.95 * sqrtL,
    outer: 1.37 * sqrtL,
  };
}

/**
 * Enhanced zone configurations that create more realistic and interesting systems
 */
export const enhancedCelestialZones: CelestialZone[] = [
  {
    name: "Scorched Zone",
    category: ZoneCategory.SCORCHED,
    minAU: 0.01,
    maxAU: 0.3,
    temperatureRange: { min: 800, max: 2000 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [PlanetType.LAVA, RockyType.METALLIC],
    disallowedTypes: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
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
    minAU: 0.3,
    maxAU: 0.8,
    temperatureRange: { min: 400, max: 800 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [PlanetType.ROCKY, PlanetType.DESERT, PlanetType.LAVA],
    disallowedTypes: [GasGiantClass.CLASS_III],
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
    minAU: 0.8,
    maxAU: 2.0,
    temperatureRange: { min: 200, max: 400 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [PlanetType.TERRESTRIAL, PlanetType.OCEAN, PlanetType.ROCKY],
    disallowedTypes: [],
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
    minAU: 2.0,
    maxAU: 5.0,
    temperatureRange: { min: 100, max: 200 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [PlanetType.ICE, PlanetType.ROCKY, GasGiantClass.CLASS_I],
    disallowedTypes: [PlanetType.LAVA, PlanetType.DESERT],
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
    minAU: 5.0,
    maxAU: 30.0,
    temperatureRange: { min: 50, max: 100 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [
      GasGiantClass.CLASS_I,
      GasGiantClass.CLASS_II,
      RockyType.ICE,
    ],
    disallowedTypes: [PlanetType.LAVA, PlanetType.DESERT, PlanetType.OCEAN],
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
    minAU: 30.0,
    maxAU: 100.0,
    temperatureRange: { min: 10, max: 50 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [GasGiantClass.CLASS_III, RockyType.ICE],
    disallowedTypes: [
      PlanetType.LAVA,
      PlanetType.DESERT,
      PlanetType.OCEAN,
      PlanetType.TERRESTRIAL,
    ],
    formationProbability: 0.3,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
      OrbitalConfiguration.BINARY_PAIR,
    ],
    maxBodies: 6,
  },
  {
    name: "Interstellar Zone",
    category: ZoneCategory.INTERSTELLAR,
    minAU: 100.0,
    maxAU: 10000.0,
    temperatureRange: { min: 2, max: 10 },
    stellarTypes: [CelestialType.STAR],
    allowedTypes: [RockyType.ICE, GasGiantClass.CLASS_III],
    disallowedTypes: [
      PlanetType.LAVA,
      PlanetType.DESERT,
      PlanetType.OCEAN,
      PlanetType.TERRESTRIAL,
    ],
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
      const mass = star.realMass_kg || 1.989e30; // Default to solar mass if not specified
      const solarMasses = mass / 1.989e30; // Convert to solar masses
      return sum + calculateStellarLuminosity(solarMasses);
    }, 0);

    // Adjust zone boundaries based on luminosity
    const luminosityFactor = Math.sqrt(totalLuminosity);

    return this.zones.map((zone) => ({
      ...zone,
      minAU: zone.minAU * luminosityFactor,
      maxAU: zone.maxAU * luminosityFactor,
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
 * Legacy compatibility function
 */
export function generateZonesForStar(star: CelestialObject): CelestialZone[] {
  const random = () => Math.random(); // Use non-seeded random for backwards compatibility
  const zoneManager = new CelestialZoneManager(random);
  const config = zoneManager.determineStellarConfiguration();
  return zoneManager.getAdjustedZones([star], config);
}
