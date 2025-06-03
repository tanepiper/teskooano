import { OSVector3 } from "@teskooano/core-math";
import type { CelestialRenderer, BasicRendererOptions } from "./renderer.types";
import { Quaternion } from "three";

/**
 * Defines the physical properties of a celestial object relevant for rendering aspects like billboards and direct physical calculations.
 */
export interface CelestialPhysicalProperties {
  /** Radius of the celestial object in meters. */
  radius: number;
  /**
   * Albedo of the celestial object (ratio of reflected light to incident light).
   * Typically a value between 0 (absorbs all light) and 1 (reflects all light).
   */
  albedo: number;
  /** Surface temperature in Kelvin. */
  temperature_k: number;
  /** Sidereal rotation period in seconds. */
  siderealRotationPeriod_s: number;
  /** Axial tilt as a normalized vector or Euler angles (if preferred, OSVector3 used for consistency). */
  axialTilt: OSVector3;
  // Other properties like luminosity, temperature could be added if relevant for billboard appearance
}

/**
 * The type of celestial object, encompassing general categories and specific implemented types.
 */
export const CelestialType = {
  // General categories for broad classification and hierarchy logic
  /** A general star type. Specific star types (e.g., MAIN_SEQUENCE_STAR) provide detailed classifications. */
  STAR: "STAR",
  /** A general planet type, can be terrestrial or gas giant. Specific planet types provide details. */
  PLANET: "PLANET",
  /** A natural satellite orbiting a planet or other larger body. Use the Moon class for its implementation. */
  MOON: "MOON",
  /** A large planet composed mainly of hydrogen and helium. Use the GasGiant class for its implementation. */
  GAS_GIANT: "GAS_GIANT",
  /** A collection of asteroids. Use the AsteroidField class for its implementation. */
  ASTEROID_FIELD: "ASTEROID_FIELD",

  // Specific types with dedicated classes
  /** A star that is in the main sequence of the Hertzsprung-Russell diagram. Use the MainSequenceStar class for its implementation. */
  MAIN_SEQUENCE_STAR: "MAIN_SEQUENCE_STAR",
  /**
   * A star that is in the post-main sequence of the Hertzsprung-Russell diagram.
   * Use the PostMainSequenceStar class for its implementation.
   */
  POST_MAIN_SEQUENCE_STAR: "POST_MAIN_SEQUENCE_STAR",
  /**
   * A star that is in the pre-main sequence of the Hertzsprung-Russell diagram.
   * Use the PreMainSequenceStar class for its implementation.
   */
  PRE_MAIN_SEQUENCE_STAR: "PRE_MAIN_SEQUENCE_STAR",
  /**
   * A star that is evolved from a main sequence star.
   * Use the EvolvedStar class for its implementation.
   */
  EVOLVED_STAR: "EVOLVED_STAR",
  /**
   * A star that is a remnant of a star that has exhausted its fuel.
   * Use the RemnantStar class for its implementation.
   */
  REMNANT_STAR: "REMNANT_STAR",
  /**
   * A region of spacetime where gravity is so strong that nothing, including light, can escape. Often a stellar remnant.
   * Use the BlackHole class for its implementation.
   */
  BLACK_HOLE: "BLACK_HOLE",
  /**
   * A system of rings around any celestial object.
   * Use the RingSystem class for its implementation.
   */
  RING_SYSTEM: "RING_SYSTEM",
  /**
   * A ring of asteroids surrounding a star.
   * Use the AsteroidRing class for its implementation.
   */
  ASTEROID_RING: "ASTEROID_RING",
  /**
   * A dust cloud within a system.
   * Use the DustCloud class for its implementation.
   */
  DUST_CLOUD: "DUST_CLOUD",
  /**
   * A celestial body orbiting a star that is massive enough to be rounded by its own gravity,
   * but has not cleared its neighboring region of planetesimals and is not a satellite.
   * Use the DwarfPlanet class for its implementation.
   */
  DWARF_PLANET: "DWARF_PLANET",
  /**
   * A comet orbiting a star or planet.
   * Use the Comet class for its implementation.
   */
  COMET: "COMET",
  /**
   * An Oort cloud surrounding a solar system.
   * Use the OortCloud class for its implementation.
   */
  OORT_CLOUD: "OORT_CLOUD",
  /**
   * Other celestial objects that don't fit into the other categories.
   * Use the Other class for its implementation.
   */
  OTHER: "OTHER",
};

export type CelestialType = keyof typeof CelestialType;

/**
 * Defines the type of physics engine being used for simulation.
 */
export type PhysicsEngineType = "euler" | "symplectic" | "verlet" | "kepler";

/**
 * Core properties common to all celestial object representations, used for state updates and observations.
 */
export interface CelestialCoreProperties {
  /** The unique identifier of the celestial object. */
  id: string;
  /** The name of the celestial object. */
  name: string;
  /** The type of celestial object. */
  type: CelestialType;
  /** The status of the celestial object. */
  status: CelestialStatus;
  /** The orbital properties of the celestial object. */
  orbit: CelestialOrbitalProperties;
  /** The physics state of the celestial object (mass, position, velocity). */
  physicsState: CelestialPhysicsState;
  /** The intrinsic physical properties of the celestial object (radius, albedo, etc.). */
  physicalProperties: CelestialPhysicalProperties;
  /** The ID of the parent celestial object. Used for state observation and initial linking. */
  parentId?: string;
  /** IDs of the children of this celestial object. Used for state observation. */
  childIds?: string[];
  /** Flag indicating if this object is the main star of its system. */
  isMainStar?: boolean;
}

/**
 * Defines the parameters required for constructing a CelestialObject.
 * This interface lists all properties needed to initialize a new celestial body.
 */
export interface CelestialObjectConstructorParams {
  /** The unique identifier of the celestial object. */
  id: string;
  /** The name of the celestial object. */
  name: string;
  /** Flag indicating if this object should be ignored by the physics engine. */
  ignorePhysics?: boolean;
  /** The seed of the celestial object. */
  seed: string;
  /** The status of the celestial object. Defaults to ACTIVE if not provided. */
  status?: CelestialStatus;
  /** The type of celestial object. */
  type: CelestialType;
  /** The orbital properties of the celestial object. */
  orbit: CelestialOrbitalProperties;
  /** The physics state of the celestial object (mass, position, velocity). */
  physicsState: CelestialPhysicsState;
  /** The intrinsic physical properties of the celestial object (radius, albedo, etc.). */
  physicalProperties: CelestialPhysicalProperties;
  /** Flag indicating if this object is the main star of its system. Defaults to false. */
  isMainStar?: boolean;
  /**
   * The parent CelestialObject instance.
   * Typed as `any` here to prevent circular import issues with `CelestialObject.ts`.
   * At runtime, this is expected to be a fully initialized `CelestialObject` instance or undefined.
   * Parent-child relationships are typically managed by the system orchestrating object creation.
   */
  parent?: CelestialCoreProperties;
  /** Optional pre-instantiated renderer. If not provided, a BasicCelestialRenderer will be created. */
  rendererInstance?: CelestialRenderer;
  /** Options for the renderer, particularly if BasicCelestialRenderer is to be used or customized. */
  rendererOptions?: BasicRendererOptions;
}

/**
 * The status of a celestial object in the simulation.
 */
export enum CelestialStatus {
  /** Indicates the celestial object is currently active and functioning as expected. */
  ACTIVE = "active",
  /** Indicates the celestial object has been destroyed through conventional means. */
  DESTROYED = "destroyed",
}

/**
 * Defines the orbital elements required to describe the path of a celestial body around its parent.
 * All angles are in RADIANS. All distances are in REAL METERS. All times are in REAL SECONDS.
 */
export interface CelestialOrbitalProperties {
  /** The average distance from the parent body (METERS). Also known as semimajor axis. */
  semiMajorAxis_m: number;
  /** The shape of the orbit (0 = circular, <1 = elliptical, 1 = parabolic, >1 = hyperbolic). */
  eccentricity: number;
  /** The tilt of the orbital plane relative to a reference plane (e.g., the ecliptic or parent's equatorial plane) (RADIANS). */
  inclination: number;
  /** The angle, in the reference plane, from a reference direction to the point where the orbit crosses the reference plane from south to north (ascending node) (RADIANS). Also known as LAN or RAAN. */
  longitudeOfAscendingNode: number;
  /** The angle, in the orbital plane, from the ascending node to the point of closest approach (periapsis) (RADIANS). */
  argumentOfPeriapsis: number;
  /** The position of the body in its orbit at a specific reference time (epoch) (RADIANS). */
  meanAnomaly: number;
  /** The time taken to complete one orbit (SECONDS). */
  period_s: number;
}
/**
 * Represents the physics state of a body in REAL-WORLD units (dynamic state).
 */
export interface CelestialPhysicsState {
  /** Unique identifier matching the CelestialObject id. */
  id: string;
  /** Mass in kilograms (kg). */
  mass_kg: number;
  /** Position vector in meters (m), typically relative to the system's origin or parent. */
  position_m: OSVector3;
  /** Velocity vector in meters per second (m/s), typically relative to the system's origin or parent. */
  velocity_mps: OSVector3;
  /** Optional: Tracks simulation ticks since the last physics update for this object, useful for throttling or variable update rates. */
  ticksSinceLastPhysicsUpdate?: number;
  /** Orientation quaternion (x, y, z, w). */
  orientation: Quaternion;
  /** Angular velocity vector in radians per second (rad/s). */
  angularVelocity_radps: OSVector3;
}
