/**
 * Defines the orbital elements required to describe the path of a celestial body around its parent.
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
}
