import { OSVector3 } from "@teskooano/core-math";
import { LagrangePointType } from "./enums";

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
  /** Optional: If the object is to be placed at a Lagrangian point (L1-L5). */
  lagrangePointType?: LagrangePointType;

  /** The farthest distance from the parent body (REAL METERS). */
  realAphelion_m: number;
  /** The closest distance from the parent body (REAL METERS). */
  realPerihelion_m: number;
  /** The average orbital speed (METERS PER SECOND). */
  averageOrbitalSpeed_mps: number;
  /** The epoch for these orbital elements (e.g., "J2000"). */
  epoch?: string;
  /** Optional: The time of perihelion passage as an ISO date string. */
  timeOfPerihelion?: string;
}
