import { GasGiantClass, PlanetType } from "@teskooano/data-types";
import { CelestialZone, ZoneCategory, OrbitalConfiguration } from "./types";

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
    allowedPlanetTypes: [PlanetType.LAVA, PlanetType.ROCKY],
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.1,
    formationProbability: 0.08,
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
    asteroidBeltChance: 0.2,
    formationProbability: 0.7,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
    ],
    maxBodies: 6,
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
    maxBodies: 5,
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
    cometChance: 0.02,
    asteroidBeltChance: 0.15,
    formationProbability: 0.6,
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
    ],
    maxBodies: 7,
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
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0.05,
    asteroidBeltChance: 0.2,
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
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.1,
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
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.BARREN],
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
    cometChance: 0.2,
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
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.25,
    asteroidBeltChance: 0.1,
    formationProbability: 0.1,
    specialConfigurations: [OrbitalConfiguration.ROGUE],
    maxBodies: 10,
  },
];

/**
 * Creates a default temperate zone for Earth-like planets
 */
export function createDefaultTemperateZone(): CelestialZone {
  return {
    name: "Temperate Zone",
    category: ZoneCategory.TEMPERATE,
    baseMinAU: 0.8,
    baseMaxAU: 2.0,
    minAU: 0.8,
    maxAU: 2.0,
    temperatureRange: { min: 200, max: 400 },
    allowedPlanetTypes: [
      PlanetType.TERRESTRIAL,
      PlanetType.OCEAN,
      PlanetType.ROCKY,
    ],
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0,
    asteroidBeltChance: 0.1,
    formationProbability: 0.85,
    specialConfigurations: [OrbitalConfiguration.STANDARD],
    maxBodies: 3,
    minBodies: 1,
  };
}

/**
 * Creates a default set of zones when no zones are available
 */
export function createDefaultZones(): CelestialZone[] {
  return [
    createDefaultTemperateZone(),
    {
      name: "Hot Inner Zone",
      category: ZoneCategory.HOT,
      baseMinAU: 0.4,
      baseMaxAU: 0.8,
      minAU: 0.4,
      maxAU: 0.8,
      temperatureRange: { min: 400, max: 800 },
      allowedPlanetTypes: [
        PlanetType.ROCKY,
        PlanetType.DESERT,
        PlanetType.LAVA,
      ],
      allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
      cometChance: 0,
      asteroidBeltChance: 0.2,
      formationProbability: 0.7,
      specialConfigurations: [OrbitalConfiguration.STANDARD],
      maxBodies: 3,
      minBodies: 1,
    },
    {
      name: "Cool Zone",
      category: ZoneCategory.COOL,
      baseMinAU: 2.0,
      baseMaxAU: 5.0,
      minAU: 2.0,
      maxAU: 5.0,
      temperatureRange: { min: 100, max: 200 },
      allowedPlanetTypes: [PlanetType.ICE, PlanetType.ROCKY],
      allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
      cometChance: 0.02,
      asteroidBeltChance: 0.15,
      formationProbability: 0.6,
      specialConfigurations: [OrbitalConfiguration.STANDARD],
      maxBodies: 3,
      minBodies: 1,
    },
  ];
}
