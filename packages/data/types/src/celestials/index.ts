// Re-export all common enums and types
export * from "./common";

// Re-export all physics-related interfaces
export * from "./physics";

// Re-export all details-related interfaces and unions
export * from "./details";

// Re-export all appearance-related interfaces and unions
export * from "./appearance/appearance";

// Import necessary base types for CelestialObject
import type { CelestialType, CelestialStatus } from "./common";
import type {
  PhysicalProperties,
  OrbitalParameters,
  PhysicsStateReal,
} from "./physics";
import type { CelestialDetailsBase, CelestialDetailsUnion } from "./details";
import type {
  CelestialAppearanceBase,
  CelestialAppearanceUnion,
} from "./appearance/appearance";

/**
 * Represents the complete state and definition of a celestial object within the simulation.
 * This is a generic interface, parameterized by the specific Details (D) and Appearance (A)
 * types relevant to the particular celestial object.
 */
export interface CelestialObject<
  D extends CelestialDetailsBase = CelestialDetailsUnion, // Default to the union if not specified
  A extends CelestialAppearanceBase = CelestialAppearanceUnion, // Default to the union if not specified
> {
  // --- Core Identification & Status ---
  id: string;
  name: string;
  type: CelestialType;
  status: CelestialStatus;

  // --- Physics Engine Relationships & Flags (Top Level) ---
  parentId?: string;
  currentParentId?: string;
  ignorePhysics?: boolean;

  // --- Fundamental Physical Characteristics ---
  physical: PhysicalProperties;

  // --- Orbital Mechanics ---
  orbit: OrbitalParameters;

  // --- Physics Engine State ---
  physicsState: {
    stateReal: PhysicsStateReal;
  };

  // --- Type-Specific Descriptive Properties (Generic) ---
  details: D;

  // --- Rendering & Appearance Properties (Generic) ---
  appearance: A;

  // --- Procedural Generation ---
  seed?: string;
}

// Example of how you might define a specific Star object type:
// import { StarDetails } from './details';
// import { StarAppearance } from './appearance';
// export type StarCelestialObject = CelestialObject<StarDetails, StarAppearance>;

// Example for a generic Planet object type (could be rocky, icy, etc.)
// import { PlanetDetails } from './details';
// import { StandardPlanetAppearance } from './appearance';
// export type PlanetCelestialObject = CelestialObject<PlanetDetails, StandardPlanetAppearance>;
