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
    baseMinAU: 0.2,
    baseMaxAU: 0.4,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 800, max: 2000 },
    allowedPlanetTypes: [PlanetType.LAVA, PlanetType.ROCKY], // Replaced RockyType.METALLIC
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.1, // Some chance for inner belts
    formationProbability: 0.08, // Still reduced but allows some variety
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
    ],
    maxBodies: 2,
    minBodies: 0,
  },
  {
    name: "Hot Inner Zone",
    category: ZoneCategory.HOT,
    baseMinAU: 0.4,
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
    maxBodies: 6, // Increased for more variety
    minBodies: 1,
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
    maxBodies: 5, // Increased for more variety
    minBodies: 1,
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
    maxBodies: 7, // Increased for more variety
    minBodies: 2,
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
    minBodies: 1,
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
    // Use the pre-calculated luminosity from properties if it exists.
    // This is more accurate than the mass-based approximation.
    let luminosity = (star.properties as any)?.luminosity;

    if (!luminosity) {
      // Fallback to mass-based calculation if luminosity property is missing.
      const mass = star.realMass_kg || CONST.SOLAR_MASS_KG;
      const solarMasses = mass / CONST.SOLAR_MASS_KG;
      // Main sequence mass-luminosity relation: L ∝ M^3.5
      luminosity = Math.pow(solarMasses, 3.5);
    }

    // Get star properties for more sophisticated zone calculation
    const starProps = star.properties as any;
    const spectralClass = starProps?.spectralClass || "G";
    const stellarType = starProps?.stellarType || "MAIN_SEQUENCE";
    const temperature = star.temperature || 5778; // Default to solar temperature

    // Calculate zone scaling based on star characteristics
    let scalingFactor = Math.sqrt(luminosity);

    // Adjust scaling based on stellar type
    switch (stellarType) {
      case "WHITE_DWARF":
        // White dwarfs are very hot but small - zones should be very close
        scalingFactor *= 0.1; // 10% of normal scaling
        break;
      case "NEUTRON_STAR":
      case "BLACK_HOLE":
        // Compact objects have very close zones
        scalingFactor *= 0.05; // 5% of normal scaling
        break;
      case "RED_GIANT":
      case "SUPERGIANT":
        // Giant stars have much larger zones
        scalingFactor *= 2.0; // 200% of normal scaling
        break;
      case "MAIN_SEQUENCE":
      default:
        // Main sequence stars use standard scaling
        break;
    }

    // Additional adjustments based on spectral class
    if (spectralClass.startsWith("M")) {
      // Red dwarfs are cool and dim - zones should be closer
      scalingFactor *= 0.3;
    } else if (spectralClass.startsWith("O") || spectralClass.startsWith("B")) {
      // Hot, massive stars have much larger zones
      scalingFactor *= 3.0;
    } else if (spectralClass.startsWith("A")) {
      // A-type stars are hot but not as extreme as O/B
      scalingFactor *= 2.0;
    } else if (spectralClass.startsWith("F")) {
      // F-type stars are slightly hotter than G
      scalingFactor *= 1.5;
    } else if (spectralClass.startsWith("K")) {
      // K-type stars are cooler than G
      scalingFactor *= 0.7;
    }
    // G-type stars (like our Sun) use the base scaling factor

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
      // Use the pre-calculated luminosity from properties if it exists.
      // This is more accurate than the mass-based approximation.
      const starLuminosity = (star.properties as any)?.luminosity;
      if (starLuminosity) {
        return sum + starLuminosity;
      }

      // Fallback to mass-based calculation if luminosity property is missing.
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
        zone.baseMinAU * luminosityFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      maxAU: Math.min(
        zone.baseMaxAU * luminosityFactor,
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
   * Selects appropriate zones for body placement with improved distribution
   */
  selectZonesForPlacement(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    const adjustedZones = this.getAdjustedZones(stars, config);
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
      if (
        zone.category === ZoneCategory.COLD ||
        zone.category === ZoneCategory.FROZEN
      ) {
        inclusionChance *= 0.5; // 50% reduction
      } else if (
        zone.category === ZoneCategory.OUTER ||
        zone.category === ZoneCategory.DISTANT
      ) {
        inclusionChance *= 0.3; // 70% reduction
      } else if (zone.category === ZoneCategory.INTERSTELLAR) {
        inclusionChance *= 0.1; // 90% reduction
      }

      const shouldInclude = this.random() < inclusionChance;
      if (shouldInclude) {
        activeZones.push(zone);
      }
    }

    // Ensure at least some zones are active for non-empty systems
    if (activeZones.length === 0 && stars.length > 0) {
      // Add 2-3 random zones from different ranges, but be more conservative
      const innerZones = adjustedZones.slice(1, 4); // Hot, Temperate, Cool (skip Scorched)
      const middleZones = adjustedZones.slice(4, 6); // Cold, Frozen
      const outerZones = adjustedZones.slice(6); // Outer, Distant, Interstellar

      // Always include at least one inner zone
      activeZones.push(getRandomItem(innerZones, this.random));

      // 60% chance for a middle zone
      if (middleZones.length > 0 && this.random() < 0.6) {
        activeZones.push(getRandomItem(middleZones, this.random));
      }

      // Only 20% chance for outer zones
      if (outerZones.length > 0 && this.random() < 0.2) {
        activeZones.push(getRandomItem(outerZones, this.random));
      }
    }

    // Limit the total number of zones to prevent over-generation
    const maxZones = 4 + Math.floor(this.random() * 2); // 4-5 zones max (reduced from 5-7)
    if (activeZones.length > maxZones) {
      // Prioritize inner zones when trimming
      const sortedZones = activeZones.sort((a, b) => a.minAU - b.minAU);
      return sortedZones.slice(0, maxZones);
    }

    return activeZones.sort((a, b) => a.minAU - b.minAU); // Sort by distance
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

  /**
   * Creates star-specific zones based on the star's unique characteristics.
   * This is more sophisticated than just scaling generic zones.
   */
  static createStarSpecificZones(
    star: CelestialObject,
    random: () => number,
  ): CelestialZone[] {
    const starProps = star.properties as any;
    const spectralClass = starProps?.spectralClass || "G";
    const stellarType = starProps?.stellarType || "MAIN_SEQUENCE";
    const luminosity = starProps?.luminosity || 1.0;
    const temperature = star.temperature || 5778;

    // Base scaling from luminosity
    let baseScaling = Math.sqrt(luminosity);

    // Create zones that are truly specific to this star type
    const zones: CelestialZone[] = [];

    switch (stellarType) {
      case "WHITE_DWARF":
        // White dwarfs have very compact zones due to high temperature but small size
        zones.push(
          this.createZone(
            "Scorched Zone",
            ZoneCategory.SCORCHED,
            0.01,
            0.05,
            baseScaling * 0.1,
          ),
          this.createZone(
            "Hot Inner Zone",
            ZoneCategory.HOT,
            0.05,
            0.2,
            baseScaling * 0.1,
          ),
          this.createZone(
            "Temperate Zone",
            ZoneCategory.TEMPERATE,
            0.2,
            0.5,
            baseScaling * 0.1,
          ),
          this.createZone(
            "Cool Zone",
            ZoneCategory.COOL,
            0.5,
            1.0,
            baseScaling * 0.1,
          ),
        );
        break;

      case "NEUTRON_STAR":
      case "BLACK_HOLE":
        // Compact objects can have planets at various distances
        // Black holes especially can have planets at much greater distances
        // For black holes, we need to allow terrestrial planets in cooler zones
        if (stellarType === "BLACK_HOLE") {
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.001,
              0.01,
              baseScaling * 0.05,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.01,
              0.05,
              baseScaling * 0.05,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              0.05,
              0.5,
              baseScaling * 0.05,
            ),
            this.createBlackHoleZone(
              "Cool Zone",
              ZoneCategory.COOL,
              0.5,
              2.0,
              baseScaling * 0.05,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              2.0,
              10.0,
              baseScaling * 0.05,
            ),
          );
        } else {
          // Neutron stars have more restrictive zones
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.001,
              0.01,
              baseScaling * 0.05,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.01,
              0.05,
              baseScaling * 0.05,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              0.05,
              0.5,
              baseScaling * 0.05,
            ),
          );
        }
        break;

      case "RED_GIANT":
      case "SUPERGIANT":
        // Giant stars have much larger zones
        zones.push(
          this.createZone(
            "Scorched Zone",
            ZoneCategory.SCORCHED,
            1.0,
            5.0,
            baseScaling * 2.0,
          ),
          this.createZone(
            "Hot Inner Zone",
            ZoneCategory.HOT,
            5.0,
            20.0,
            baseScaling * 2.0,
          ),
          this.createZone(
            "Temperate Zone",
            ZoneCategory.TEMPERATE,
            20.0,
            100.0,
            baseScaling * 2.0,
          ),
          this.createZone(
            "Cool Zone",
            ZoneCategory.COOL,
            100.0,
            500.0,
            baseScaling * 2.0,
          ),
          this.createZone(
            "Outer Gas Zone",
            ZoneCategory.COLD,
            500.0,
            2000.0,
            baseScaling * 2.0,
          ),
        );
        break;

      case "MAIN_SEQUENCE":
      default:
        // Main sequence stars use spectral class-specific zones
        if (spectralClass.startsWith("M")) {
          // Red dwarfs: cool, dim, zones very close
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.05,
              0.1,
              baseScaling * 0.3,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.1,
              0.3,
              baseScaling * 0.3,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              0.3,
              0.8,
              baseScaling * 0.3,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              0.8,
              2.0,
              baseScaling * 0.3,
            ),
          );
        } else if (spectralClass.startsWith("K")) {
          // K-type stars: cooler than G, zones closer
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.1,
              0.3,
              baseScaling * 0.7,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.3,
              0.6,
              baseScaling * 0.7,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              0.6,
              1.4,
              baseScaling * 0.7,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              1.4,
              3.5,
              baseScaling * 0.7,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              3.5,
              21.0,
              baseScaling * 0.7,
            ),
          );
        } else if (spectralClass.startsWith("G")) {
          // G-type stars (like our Sun): standard zones
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.2,
              0.4,
              baseScaling,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.4,
              0.8,
              baseScaling,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              0.8,
              2.0,
              baseScaling,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              2.0,
              5.0,
              baseScaling,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              5.0,
              30.0,
              baseScaling,
            ),
          );
        } else if (spectralClass.startsWith("F")) {
          // F-type stars: hotter than G, zones further out
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.3,
              0.6,
              baseScaling * 1.5,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              0.6,
              1.2,
              baseScaling * 1.5,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              1.2,
              3.0,
              baseScaling * 1.5,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              3.0,
              7.5,
              baseScaling * 1.5,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              7.5,
              45.0,
              baseScaling * 1.5,
            ),
          );
        } else if (spectralClass.startsWith("A")) {
          // A-type stars: very hot, zones much further out
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              0.6,
              1.2,
              baseScaling * 2.0,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              1.2,
              2.4,
              baseScaling * 2.0,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              2.4,
              6.0,
              baseScaling * 2.0,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              6.0,
              15.0,
              baseScaling * 2.0,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              15.0,
              90.0,
              baseScaling * 2.0,
            ),
          );
        } else if (
          spectralClass.startsWith("B") ||
          spectralClass.startsWith("O")
        ) {
          // O/B-type stars: extremely hot and massive, zones very far out
          zones.push(
            this.createZone(
              "Scorched Zone",
              ZoneCategory.SCORCHED,
              2.0,
              10.0,
              baseScaling * 3.0,
            ),
            this.createZone(
              "Hot Inner Zone",
              ZoneCategory.HOT,
              10.0,
              30.0,
              baseScaling * 3.0,
            ),
            this.createZone(
              "Temperate Zone",
              ZoneCategory.TEMPERATE,
              30.0,
              100.0,
              baseScaling * 3.0,
            ),
            this.createZone(
              "Cool Zone",
              ZoneCategory.COOL,
              100.0,
              300.0,
              baseScaling * 3.0,
            ),
            this.createZone(
              "Outer Gas Zone",
              ZoneCategory.COLD,
              300.0,
              1000.0,
              baseScaling * 3.0,
            ),
          );
        }
        break;
    }

    return zones;
  }

  /**
   * Helper method to create a zone with proper scaling
   */
  private static createZone(
    name: string,
    category: ZoneCategory,
    baseMinAU: number,
    baseMaxAU: number,
    scalingFactor: number,
  ): CelestialZone {
    // Find the template zone to copy properties from
    const templateZone = enhancedCelestialZones.find((z) => z.name === name);
    if (!templateZone) {
      throw new Error(`Template zone not found: ${name}`);
    }

    return {
      ...templateZone,
      minAU: Math.min(baseMinAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      maxAU: Math.min(baseMaxAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
    };
  }

  /**
   * Helper method to create a black hole-specific zone that allows terrestrial planets
   */
  private static createBlackHoleZone(
    name: string,
    category: ZoneCategory,
    baseMinAU: number,
    baseMaxAU: number,
    scalingFactor: number,
  ): CelestialZone {
    // Find the template zone to copy properties from
    const templateZone = enhancedCelestialZones.find((z) => z.name === name);
    if (!templateZone) {
      throw new Error(`Template zone not found: ${name}`);
    }

    // For black holes, modify the Cool Zone to allow terrestrial planets
    let modifiedZone = { ...templateZone };
    if (name === "Cool Zone") {
      modifiedZone = {
        ...templateZone,
        allowedPlanetTypes: [
          PlanetType.TERRESTRIAL,
          PlanetType.OCEAN,
          PlanetType.ICE,
          PlanetType.ROCKY,
        ],
      };
    }

    return {
      ...modifiedZone,
      minAU: Math.min(baseMinAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      maxAU: Math.min(baseMaxAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
    };
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
