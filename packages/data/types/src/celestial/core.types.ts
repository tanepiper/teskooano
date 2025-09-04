import type { CelestialStatus, CelestialType } from "./enums";
import { OrbitalParameters } from "./orbit.type";
import type {
  CelestialSpecificPropertiesUnion,
  PlanetAtmosphereProperties,
} from "./properties.types";

/**
 * Represents the complete state and definition of a celestial object within the simulation.
 *
 * @template T - The specific properties type for this celestial object (e.g., StarProperties, PlanetProperties)
 */
export interface CelestialObject<T = CelestialSpecificPropertiesUnion> {
  /** Unique identifier for the celestial object. */
  id: string;
  /** The fundamental type of the object (e.g., STAR, PLANET, MOON). Now defined in BaseCelestialProperties as 'type'. */
  type: CelestialType;
  /** The display name of the celestial object. */
  name: string;
  /** Current status of the object in the simulation */
  status: CelestialStatus;
  /** The REAL physical radius of the object (in METERS). */
  realRadius_m: number;
  /** The REAL physical mass of the object (in KILOGRAMS). */
  realMass_kg: number;
  /** Orbital parameters defining the object's path around its parent. */
  orbit: OrbitalParameters;
  /** Average surface or effective temperature in Kelvin. */
  temperature: number;
  /** Optional surface reflectivity (albedo) (0.0 = absorbs all light, 1.0 = reflects all light). */
  albedo?: number;

  /** Optional atmospheric properties common to many bodies */
  atmosphere?: PlanetAtmosphereProperties;

  /** Object containing properties specific to the `type` (or `class`) of celestial object. Optional for types like OTHER. */
  properties?: T;

  /** Optional: Reference to parent body ID */
  parentId?: string;
  /** Optional: If the object is meant to be at a Lagrange point, the ID of the second body in the system for that Lagrange point calculation. */
  lagrangePointTargetId?: string;

  /** Optional seed value used for procedural generation (textures, etc.). */
  seed?: string;

  /** When true, this object will be excluded from physics calculations (no gravity interactions, collisions, etc.) */
  ignorePhysics?: boolean;

  /** When true, this object will be excluded from collision detection. */
  ignoreCollisions?: boolean;

  /** When true, this object will be visible in the simulation. Defaults to true if not specified. */
  isVisible?: boolean;
}
