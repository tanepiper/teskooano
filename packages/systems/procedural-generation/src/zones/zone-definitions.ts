import { GasGiantClass, PlanetType } from "@teskooano/data-types";
import { CelestialZone, ZoneCategory, OrbitalConfiguration } from "./types";

/**
 * Gameplay-focused zone configurations that create populated and interesting systems
 * Less realistic but more fun - every star should have celestials in multiple zones
 */
export const enhancedCelestialZones: CelestialZone[] = [
  {
    name: "Scorched Zone",
    category: ZoneCategory.SCORCHED,
    baseMinAU: 0.1,
    baseMaxAU: 0.3,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 800, max: 2000 },
    allowedPlanetTypes: [PlanetType.LAVA, PlanetType.ROCKY],
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.1,
    formationProbability: 0.5, // Increased from 0.08 to 0.5
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
    ],
    maxBodies: 3,
    minBodies: 1, // Guarantee at least 1 body
  },
  {
    name: "Hot Inner Zone",
    category: ZoneCategory.HOT,
    baseMinAU: 0.3,
    baseMaxAU: 0.7,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 400, max: 800 },
    allowedPlanetTypes: [PlanetType.ROCKY, PlanetType.DESERT, PlanetType.LAVA],
    allowedGasGiantClasses: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V],
    cometChance: 0,
    asteroidBeltChance: 0.2,
    formationProbability: 0.85, // Increased from 0.7 to 0.85
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
    ],
    maxBodies: 8,
    minBodies: 2, // Guarantee at least 2 bodies
  },
  {
    name: "Temperate Zone",
    category: ZoneCategory.TEMPERATE,
    baseMinAU: 0.7,
    baseMaxAU: 1.5,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 200, max: 400 },
    allowedPlanetTypes: [
      PlanetType.TERRESTRIAL,
      PlanetType.OCEAN,
      PlanetType.ROCKY,
      PlanetType.DESERT,
    ],
    allowedGasGiantClasses: [
      GasGiantClass.CLASS_III,
      GasGiantClass.CLASS_IV,
      GasGiantClass.CLASS_V,
    ],
    cometChance: 0,
    asteroidBeltChance: 0.3,
    formationProbability: 0.9, // Increased from 0.8 to 0.9
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
      OrbitalConfiguration.CO_ORBITAL,
    ],
    maxBodies: 8,
    minBodies: 2, // Guarantee at least 2 bodies
  },
  {
    name: "Cool Zone",
    category: ZoneCategory.COOL,
    baseMinAU: 1.5,
    baseMaxAU: 3.0,
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 100, max: 200 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.ROCKY],
    allowedGasGiantClasses: [
      GasGiantClass.CLASS_I,
      GasGiantClass.CLASS_II,
      GasGiantClass.CLASS_III,
    ],
    cometChance: 0.05,
    asteroidBeltChance: 0.3,
    formationProbability: 0.8, // Increased from 0.6 to 0.8
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
      OrbitalConfiguration.CO_ORBITAL,
    ],
    maxBodies: 8,
    minBodies: 2, // Guarantee at least 2 bodies
  },
  {
    name: "Outer Gas Zone",
    category: ZoneCategory.COLD,
    baseMinAU: 3.0,
    baseMaxAU: 8.0, // Reduced from 30.0 to 8.0
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 50, max: 100 },
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
    cometChance: 0.05,
    asteroidBeltChance: 0.2,
    formationProbability: 0.8, // Kept high
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.BINARY_PAIR,
      OrbitalConfiguration.TROJAN,
      OrbitalConfiguration.CO_ORBITAL,
    ],
    maxBodies: 6,
    minBodies: 2, // Guarantee at least 2 bodies
  },
  {
    name: "Frozen Outer Zone",
    category: ZoneCategory.FROZEN,
    baseMinAU: 8.0,
    baseMaxAU: 20.0, // Reduced from 100.0 to 20.0
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 10, max: 50 },
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.1,
    asteroidBeltChance: 0.25,
    formationProbability: 0.7, // Increased from 0.3 to 0.7
    specialConfigurations: [
      OrbitalConfiguration.STANDARD,
      OrbitalConfiguration.ROGUE,
      OrbitalConfiguration.BINARY_PAIR,
    ],
    maxBodies: 6,
    minBodies: 1, // Guarantee at least 1 body
  },
  {
    name: "Outer Zone",
    category: ZoneCategory.OUTER,
    baseMinAU: 20.0,
    baseMaxAU: 50.0, // Reduced from 1000.0 to 50.0
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 5, max: 10 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.BARREN],
    allowedGasGiantClasses: [GasGiantClass.CLASS_II, GasGiantClass.CLASS_III],
    cometChance: 0.15,
    asteroidBeltChance: 0.15,
    formationProbability: 0.6, // Increased from 0.2 to 0.6
    specialConfigurations: [
      OrbitalConfiguration.ROGUE,
      OrbitalConfiguration.BINARY_PAIR,
    ],
    maxBodies: 4,
    minBodies: 1, // Guarantee at least 1 body
  },
  {
    name: "Distant Zone",
    category: ZoneCategory.DISTANT,
    baseMinAU: 50.0,
    baseMaxAU: 150.0, // Reduced from 5000.0 to 150.0
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 2, max: 5 },
    allowedPlanetTypes: [PlanetType.ICE, PlanetType.BARREN],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.2,
    asteroidBeltChance: 0.1,
    formationProbability: 0.5, // Increased from 0.15 to 0.5
    specialConfigurations: [OrbitalConfiguration.ROGUE],
    maxBodies: 3,
    minBodies: 1, // Guarantee at least 1 body
  },
  {
    name: "Interstellar Zone",
    category: ZoneCategory.INTERSTELLAR,
    baseMinAU: 150.0,
    baseMaxAU: 500.0, // Reduced from 10000.0 to 500.0
    minAU: 0, // Calculated at runtime
    maxAU: 0, // Calculated at runtime
    temperatureRange: { min: 2, max: 10 },
    allowedPlanetTypes: [PlanetType.ICE],
    allowedGasGiantClasses: [GasGiantClass.CLASS_III],
    cometChance: 0.25,
    asteroidBeltChance: 0.1,
    formationProbability: 0.4, // Increased from 0.1 to 0.4
    specialConfigurations: [OrbitalConfiguration.ROGUE],
    maxBodies: 2,
    minBodies: 0, // Optional zone
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
