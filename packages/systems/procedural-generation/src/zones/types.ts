import type {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";

/**
 * Defines special orbital configurations for bodies
 */
export enum OrbitalConfiguration {
  /** Standard single body orbit */
  STANDARD = "STANDARD",
  /** Binary pair orbiting each other */
  BINARY_PAIR = "BINARY_PAIR",
  /** Trojan configuration (L4/L5 Lagrange points) */
  TROJAN = "TROJAN",
  /** Co-orbital configuration (sharing same orbit at different positions) */
  CO_ORBITAL = "CO_ORBITAL",
  /** Rogue object not orbiting any specific body */
  ROGUE = "ROGUE",
  /** Object orbiting both stars in a binary system */
  CIRCUMBINARY = "CIRCUMBINARY",
}

/**
 * Defines the type of stellar system configuration
 */
export enum StellarSystemType {
  /** Single star */
  SINGLE_STAR = "SINGLE_STAR",
  /** Close binary (< 1 AU separation) */
  BINARY_CLOSE = "BINARY_CLOSE",
  /** Wide binary (1-100 AU separation) */
  BINARY_WIDE = "BINARY_WIDE",
  /** Hierarchical triple (binary + distant third) */
  TRIPLE_HIERARCHICAL = "TRIPLE_HIERARCHICAL",
  /** Multiple star complex system */
  MULTIPLE_COMPLEX = "MULTIPLE_COMPLEX",
}

/**
 * Zone categories for more nuanced generation
 */
export enum ZoneCategory {
  /** Very close to star, tidally locked likely */
  SCORCHED = "SCORCHED",
  /** Hot zone but not tidally locked */
  HOT = "HOT",
  /** Temperate zone suitable for liquid water */
  TEMPERATE = "TEMPERATE",
  /** Cool zone where water would be solid */
  COOL = "COOL",
  /** Cold zone beyond frost line */
  COLD = "COLD",
  /** Frozen zone beyond frost line */
  FROZEN = "FROZEN",
  /** Far outer system */
  OUTER = "OUTER",
  /** Very distant objects */
  DISTANT = "DISTANT",
  /** Rogue objects in interstellar space */
  INTERSTELLAR = "INTERSTELLAR",
}

export interface FormationProbability {
  type: CelestialType;
  /** A value between 0 and 1 representing the base chance of this type appearing. */
  chance: number;
  /** Further classification for this celestial type (e.g., specific planet types). */
  subTypes?: (GasGiantClass | PlanetType)[];
  /** The typical density range for this type of object in this zone. */
  densityRange_kg_m3: [number, number];
  /** The range for the mass multiplier for this type of object in this zone. */
  massMultiplierFactorRange: [number, number];
  /** The base probability (0-1) that this type of object will have a ring system. */
  ringChance: number;
  /** The types of material allowed in a ring system for this object type. */
  allowedRingTypes: RockyType[];
  /** Special orbital configurations allowed in this zone */
  allowedConfigurations?: OrbitalConfiguration[];
  /** Probability of special orbital configurations */
  specialConfigurationChance?: number;
}

/**
 * Enhanced zone definition for sophisticated generation
 */
export interface CelestialZone {
  name: string;
  category: ZoneCategory;
  minAU: number;
  maxAU: number;
  temperatureRange: { min: number; max: number };
  stellarTypes: CelestialType[];
  allowedTypes: (PlanetType | RockyType | GasGiantClass)[];
  disallowedTypes: (PlanetType | RockyType | GasGiantClass)[];
  formationProbability: number;
  specialConfigurations: OrbitalConfiguration[];
  maxBodies: number;
}

/**
 * Legacy zone interface for backward compatibility
 */
export interface LegacyCelestialZone {
  name: string;
  category: ZoneCategory;
  minAU: number;
  maxAU: number;
  formationProbabilities: FormationProbability[];
  allowedRingTypes?: RockyType[];
  minBodies: number;
  maxAdditionalBodies: number;
  /** Temperature range for this zone in Kelvin */
  temperatureRange?: [number, number];
  /** Whether this zone supports asteroid belts */
  supportsAsteroidBelts?: boolean;
  /** Whether this zone supports rogue objects */
  supportsRogueObjects?: boolean;
  /** Probability multiplier for binary systems in this zone */
  binarySystemProbabilityMultiplier?: number;
}

/**
 * Defines the structure of multi-star systems
 */
export interface StellarSystemConfiguration {
  type: StellarSystemType;
  /** Number of stars in the system */
  stars: number;
  /** Separation distances for binary/multiple systems */
  separationAU?: number[];
  /** Whether the system supports circumbinary planets */
  supportsCircumbinaryPlanets?: boolean;
}

/**
 * Configuration for special orbital arrangements
 */
export interface OrbitalArrangement {
  configuration: OrbitalConfiguration;
  /** Number of bodies in this arrangement */
  bodyCount: number;
  /** Relative positions or phase differences */
  phaseOffsets?: number[];
  /** Mass ratios for binary pairs */
  massRatios?: number[];
}
