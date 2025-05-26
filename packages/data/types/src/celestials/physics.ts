import type { OSVector3 } from "@teskooano/core-math";

/**
 * Defines the orbital elements required to describe the path of a celestial body around its parent.
 * All values use real-world units for accurate physics calculations.
 */
export interface OrbitalProperties {
  // Basic orbital elements (Keplerian elements)
  semiMajorAxis_m: number; // Semi-major axis in meters
  eccentricity: number; // Orbital eccentricity (0 = circle, <1 = ellipse)
  inclination_rad: number; // Inclination to reference plane (radians)
  longitudeOfAscendingNode_rad: number; // Longitude of ascending node (radians)
  argumentOfPeriapsis_rad: number; // Argument of periapsis (radians)
  meanAnomaly_rad: number; // Mean anomaly at epoch (radians)

  // Derived/calculated properties
  period_s: number; // Orbital period in seconds
  meanOrbitalSpeed_mps: number; // Average orbital velocity in m/s
}

/**
 * Fundamental physical characteristics that every celestial body possesses.
 * These properties are needed for both physics simulation and rendering.
 */
export interface PhysicalProperties {
  // Mass and size
  mass_kg: number; // Mass in kilograms
  radius_m: number; // Mean radius in meters
  density_kgm3?: number; // Density (can be calculated from mass/volume)

  // Thermal properties
  temperature_k: number; // Surface/effective temperature in Kelvin
  albedo: number; // Bond albedo (0-1, fraction of light reflected)

  // Rotational properties
  rotationPeriod_s: number; // Sidereal rotation period in seconds
  axialTilt_rad: number; // Obliquity - angle between rotation axis and orbital plane (radians)

  // Gravitational properties
  surfaceGravity_ms2?: number; // Surface gravity (can be calculated)
  escapeVelocity_ms?: number; // Escape velocity (can be calculated)

  // Magnetic properties
  magneticFieldStrength_t?: number; // Magnetic field strength in Tesla (0 if none)
}

/**
 * Represents the real-time physical state of an object (position, velocity, etc.)
 * using real-world units (meters, kg, seconds).
 */
export interface PhysicsStateReal {
  id: string; // ID of the object this state belongs to
  mass_kg: number; // Current mass (may change for comets, etc.)
  position_m: OSVector3; // Position in meters from system center
  velocity_mps: OSVector3; // Velocity in meters per second
  angularVelocity_rads?: OSVector3; // Angular velocity in radians per second
  // Could add: acceleration_mps2, angularAcceleration_rads2, etc.
}
