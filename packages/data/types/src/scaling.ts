/**
 * Unified scaling system for ensuring consistent physics and visualization
 *
 * This scaling system helps normalize calculations between the internal physics
 * (which needs realistic values) and the visualization (which needs visually appropriate scales).
 */

import { CelestialType } from "./celestial";

// Gravitational constant (G) in m^3 kg^-1 s^-2
export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

// Astronomical Unit (AU) in meters
export const AU_METERS = 149597870700;

/**
 * Scaling constants for the simulation.
 *
 * These values help maintain consistent scaling across the simulation:
 * - DISTANCE_SCALE: Factor for scaling distances between objects (orbital radii)
 * - SIZE_SCALE: Factor for scaling physical size of objects (radii)
 * - MASS_SCALE: Factor for adjusting mass values to prevent numerical precision issues
 * - TIME_SCALE: Factor for time adjustments if needed
 * - RENDER_SCALE_AU: Units in the ThreeJS scene per Astronomical Unit (AU)
 */
export const SCALE = {
  // Set SIZE/DISTANCE to 1.0 - Scaling is primarily handled by RENDER_SCALE_AU
  DISTANCE: 1.0,
  SIZE: 1.0,
  TIME: 1.0, // For now, we keep time at real scale
  MASS: 1.0e-20, // Scale down masses to prevent numerical explosion

  // Defines the visual scale in the renderer: scene units per AU
  RENDER_SCALE_AU: 1000,

  // Special scales for specific types of objects - Set to 1.0 unless specific visual tweaks needed
  GAS_GIANT_SIZE: 1.0,
  STAR_SIZE: 1.0,
  MOON_DISTANCE: 50.0, // Increase moon distances for better visibility
};

// Pre-calculate the scale factor from meters to ThreeJS scene units
export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

/**
 * Convert a physical distance to a visualization distance (in Scene Units)
 */
export function scaleDistance(realDistance: number, isMoon = false): number {
  const baseScaledDistance = realDistance * METERS_TO_SCENE_UNITS;
  // Apply moon visual multiplier if needed
  return isMoon ? baseScaledDistance * SCALE.MOON_DISTANCE : baseScaledDistance;
}

/**
 * Convert a visual distance back to a physical distance
 */
export function unscaleDistance(
  visualDistance: number,
  isMoon = false,
): number {
  // Reverse the scaling logic
  const baseVisualDistance = isMoon
    ? visualDistance / SCALE.MOON_DISTANCE
    : visualDistance;
  return baseVisualDistance / METERS_TO_SCENE_UNITS;
}

/**
 * Convert a physical size (radius, meters) to a visualization size (in Scene Units)
 */
export function scaleSize(realSize: number, type: CelestialType): number {
  const baseScaledSize = realSize * METERS_TO_SCENE_UNITS;
  // Apply type-specific visual multipliers if needed (currently 1.0)
  switch (type) {
    case CelestialType.GAS_GIANT:
      return baseScaledSize * SCALE.GAS_GIANT_SIZE;
    case CelestialType.STAR:
      return baseScaledSize * SCALE.STAR_SIZE;
    case CelestialType.MOON:
    case CelestialType.PLANET:
    default:
      return baseScaledSize * SCALE.SIZE; // SIZE is now 1.0
  }
}

/**
 * Convert a visual size back to a physical size (meters)
 */
export function unscaleSize(visualSize: number, type: CelestialType): number {
  let baseVisualSize = visualSize;
  // Reverse type-specific multipliers
  switch (type) {
    case CelestialType.GAS_GIANT:
      baseVisualSize = visualSize / SCALE.GAS_GIANT_SIZE;
      break;
    case CelestialType.STAR:
      baseVisualSize = visualSize / SCALE.STAR_SIZE;
      break;
    case CelestialType.MOON:
    case CelestialType.PLANET:
    default:
      baseVisualSize = visualSize / SCALE.SIZE; // SIZE is now 1.0
      break;
  }
  // Convert base visual size back to meters
  return baseVisualSize / METERS_TO_SCENE_UNITS;
}

/**
 * Convert a physical time to a visualization time
 */
export function scaleTime(realTime: number): number {
  return realTime * SCALE.TIME;
}

/**
 * Convert a visual time back to a physical time
 */
export function unscaleTime(visualTime: number): number {
  return visualTime / SCALE.TIME;
}

/**
 * Scale the gravitational constant to match the visualization
 *
 * This is crucial for ensuring orbital mechanics are consistent
 * with the scaling factors used for distances and masses.
 */
export function scaledGravitationalConstant(): number {
  // When distances and masses are scaled, we need to adjust G accordingly
  // G_scaled = G * (DISTANCE_SCALE^3 / (MASS_SCALE * TIME_SCALE^2))
  // This ensures F = G*m1*m2/r^2 remains dimensionally consistent

  // G_scaled = G_real * (DISTANCE_SCALE^3) / (MASS_SCALE * TIME_SCALE^2)
  // This ensures F_scaled = G_scaled * m1_scaled * m2_scaled / r_scaled^2
  // where F_scaled = F_real, m_scaled = m_real * MASS_SCALE, r_scaled = r_real * DISTANCE_SCALE

  // Note: Using SCALE.DISTANCE here, not RENDER_SCALE_AU, as this affects the physics consistency
  // based on how distances and masses are scaled internally for calculations.
  const distanceScaleCubed = Math.pow(SCALE.DISTANCE, 3);
  const massTimeScaleSquared = SCALE.MASS * Math.pow(SCALE.TIME, 2);

  if (massTimeScaleSquared === 0) {
    console.warn(
      "Cannot calculate scaled G: MASS_SCALE or TIME_SCALE is zero. Returning real G.",
    );
    return GRAVITATIONAL_CONSTANT;
  }

  return (GRAVITATIONAL_CONSTANT * distanceScaleCubed) / massTimeScaleSquared;
}

/**
 * Get a consistent scale factor for orbital velocities based on current scaling
 *
 * This ensures that velocity calculations match the scaled distances and times
 */
export function velocityScaleFactor(): number {
  // Velocity scaling factor v = √(G*m/r)
  // So v_scaled = √(G_scaled * m_scaled / r_scaled)
  return Math.sqrt(SCALE.DISTANCE / SCALE.TIME);
}

/**
 * Calculate orbit parameters ensuring they're consistent with the scaling system
 *
 * @param realSemiMajorAxis Distance in meters
 * @param realEccentricity Eccentricity (dimensionless)
 * @param realPeriod Period in seconds
 * @param parentMass Mass of parent in kg
 * @param isMoon Whether this is a moon (affects distance scaling)
 * @returns Scaled orbital parameters for visualization
 */
export function scaleOrbitalParameters(
  realSemiMajorAxis: number,
  realEccentricity: number,
  realPeriod: number,
  parentMass: number,
  isMoon = false,
): {
  semiMajorAxis: number;
  period: number;
} {
  // Scale semi-major axis
  const scaledSemiMajorAxis = scaleDistance(realSemiMajorAxis, isMoon);

  // Adjust period for the scaled system using Kepler's Third Law
  // T^2 ∝ a^3 relationship
  // When 'a' is scaled, 'T' needs to be adjusted to maintain orbital mechanics
  const scaleFactor = Math.sqrt((scaledSemiMajorAxis / realSemiMajorAxis) ** 3);
  const scaledPeriod = realPeriod * scaleFactor;

  return {
    semiMajorAxis: scaledSemiMajorAxis,
    period: scaledPeriod,
  };
}
