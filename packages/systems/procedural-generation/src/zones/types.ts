import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";

/**
 * Describes the likelihood and properties of a specific type of celestial object
 * that can form within a given orbital zone.
 */
export interface CelestialFormationProbability {
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
}

/**
 * Represents a single orbital zone around a star, defining its boundaries
 * and the types of celestial bodies likely to be found within it.
 */
export interface CelestialZone {
  /** A descriptive name for the zone (e.g., "Inner Zone", "Frost Line"). */
  name: string;
  /** The minimum distance from the star for this zone, in Astronomical Units (AU). */
  minAU: number;
  /** The maximum distance from the star for this zone, in Astronomical Units (AU). */
  maxAU: number;
  /** An array defining the probabilities and properties for celestial object formation. */
  formationProbabilities: CelestialFormationProbability[];
}
