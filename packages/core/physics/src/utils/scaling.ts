/**
 * Scaling utilities for converting between physics units and rendering units
 *
 * This module provides functions to transform between real-world physics units
 * (meters, kilograms, seconds) and the scaled units used for visualization.
 */

import { CelestialType } from "@teskooano/data-types";
import {
  GRAVITATIONAL_CONSTANT,
  AU_METERS,
  SCALE,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-values";

/**
 * Scaling constants for the simulation.
 *
 * These values help maintain consistent scaling across the simulation.
 * The SCALE object and METERS_TO_SCENE_UNITS are now imported from @teskooano/data-values.
 */

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
