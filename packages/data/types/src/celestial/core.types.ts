import type * as THREE from "three";
import type { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "../physics";
import type { CelestialStatus, CelestialType } from "./enums";
import type {
  CelestialSpecificPropertiesUnion,
  PlanetAtmosphereProperties,
} from "./properties.types";

/**
 * Defines the orbital elements and rotational properties required to describe the path and orientation of a celestial body around its parent.
 */
export interface OrbitalParameters {
  /** The average distance from the parent body (REAL METERS). */
  realSemiMajorAxis_m: number;
  /** The shape of the orbit (0 = circular, <1 = elliptical, 1 = parabolic). */
  eccentricity: number;
  /** The tilt of the orbital plane relative to a reference plane (RADIANS). */
  inclination: number;
  /** The angle where the orbit crosses the reference plane heading north (RADIANS). */
  longitudeOfAscendingNode: number;
  /** The angle from the ascending node to the point of closest approach (periapsis) (RADIANS). */
  argumentOfPeriapsis: number;
  /** The position in the orbit at a specific epoch (time) (RADIANS). */
  meanAnomaly: number;
  /** The time taken to complete one orbit (REAL SECONDS). */
  period_s: number;
  /** Optional: The time it takes for the object to rotate 360 degrees around its own axis (in SECONDS). */
  siderealRotationPeriod_s?: number;
  /** Optional: The tilt of the object's rotational axis relative to its orbital plane, represented as a normalized vector. */
  axialTilt?: OSVector3;
}

/**
 * Represents the complete state and definition of a celestial object within the simulation.
 */
export interface CelestialObject {
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
  properties?: CelestialSpecificPropertiesUnion;

  /** Contains the object's state used by the physics engine (real units). */
  physicsStateReal: PhysicsStateReal;

  /** Optional: Reference to parent body ID */
  parentId?: string;

  /** Optional: Tracks the current dominant gravitational parent (can change in multi-star systems) */
  currentParentId?: string;

  /** Optional seed value used for procedural generation (textures, etc.). */
  seed?: string;

  /** When true, this object will be excluded from physics calculations (no gravity interactions, collisions, etc.) */
  ignorePhysics?: boolean;

  /** When true, this object will be excluded from collision detection. */
  ignoreCollisions?: boolean;

  /** Current visual rotation of the object in the scene. */
  rotation?: THREE.Quaternion;
}
