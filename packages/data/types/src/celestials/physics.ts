import type { OSVector3 } from "@teskooano/core-math";

/**
 * Defines the orbital elements required to describe the path of a celestial body around its parent.
 */
export interface OrbitalParameters {
  realSemiMajorAxis_m: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomaly: number;
  period_s: number;
}

/**
 * Holds the fundamental, intrinsic physical characteristics of a celestial object.
 */
export interface PhysicalProperties {
  realMass_kg: number;
  realRadius_m: number;
  temperature: number;
  albedo?: number;
  siderealRotationPeriod_s?: number;
  axialTilt?: OSVector3;
}

/**
 * Represents the real-time physical state of an object (position, velocity, etc.)
 * using real-world units (meters, kg, seconds).
 */
export interface PhysicsStateReal {
  id: string; // ID of the object this state belongs to
  mass_kg: number;
  position_m: OSVector3;
  velocity_mps: OSVector3;
  // Potentially add acceleration, angular velocity, etc., as needed
}
