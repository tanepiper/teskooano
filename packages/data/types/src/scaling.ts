/**
 * Unified scaling system for ensuring consistent physics and visualization
 *
 * This scaling system helps normalize calculations between the internal physics
 * (which needs realistic values) and the visualization (which needs visually appropriate scales).
 */

import { CelestialType } from "./celestial";

export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

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
  DISTANCE: 1.0,
  SIZE: 1.0,
  TIME: 1.0,
  MASS: 1.0e-20,

  RENDER_SCALE_AU: 1000,

  GAS_GIANT_SIZE: 1.0,
  STAR_SIZE: 1.0,
  MOON_DISTANCE: 50.0,
};

export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

/**
 * Convert a physical distance to a visualization distance (in Scene Units)
 */
export function scaleDistance(realDistance: number, isMoon = false): number {
  const baseScaledDistance = realDistance * METERS_TO_SCENE_UNITS;

  return isMoon ? baseScaledDistance * SCALE.MOON_DISTANCE : baseScaledDistance;
}

/**
 * Convert a visual distance back to a physical distance
 */
export function unscaleDistance(
  visualDistance: number,
  isMoon = false,
): number {
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

  switch (type) {
    case CelestialType.GAS_GIANT:
      return baseScaledSize * SCALE.GAS_GIANT_SIZE;
    case CelestialType.STAR:
      return baseScaledSize * SCALE.STAR_SIZE;
    case CelestialType.MOON:
    case CelestialType.PLANET:
    default:
      return baseScaledSize * SCALE.SIZE;
  }
}

/**
 * Convert a visual size back to a physical size (meters)
 */
export function unscaleSize(visualSize: number, type: CelestialType): number {
  let baseVisualSize = visualSize;

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
      baseVisualSize = visualSize / SCALE.SIZE;
      break;
  }

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
  const scaledSemiMajorAxis = scaleDistance(realSemiMajorAxis, isMoon);

  const scaleFactor = Math.sqrt((scaledSemiMajorAxis / realSemiMajorAxis) ** 3);
  const scaledPeriod = realPeriod * scaleFactor;

  return {
    semiMajorAxis: scaledSemiMajorAxis,
    period: scaledPeriod,
  };
}
