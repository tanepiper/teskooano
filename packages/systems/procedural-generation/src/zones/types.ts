import type {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";

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
}

/**
 * Represents a defined region in a star system with specific properties
 * for celestial body formation.
 */
export interface CelestialZone {
  name: string;
  minAU: number;
  maxAU: number;
  formationProbabilities: FormationProbability[];
  allowedRingTypes?: RockyType[];
  minBodies: number;
  maxAdditionalBodies: number;
}
