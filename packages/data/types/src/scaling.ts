/**
 * Unified scaling system for ensuring consistent physics and visualization
 *
 * This scaling system helps normalize calculations between the internal physics
 * (which needs realistic values) and the visualization (which needs visually appropriate scales).
 */

import { CelestialType } from "./celestials/common/celestial-types";
import { PlanetType } from "./celestials/common/planetary-classification";

export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

export const AU_METERS = 149597870700;

// Fundamental Physical Constants
export const EARTH_MASS_KG = 5.972e24; // kg
export const EARTH_RADIUS_M = 6.371e6; // meters
export const SOLAR_MASS_KG = 1.989e30; // kg
export const SOLAR_RADIUS_M = 696340e3; // meters
export const SOLAR_LUMINOSITY = 3.828e26; // Watts
export const STEFAN_BOLTZMANN = 5.670374e-8; // W m^-2 K^-4

/**
 * Interface to provide detailed classification for scaling purposes.
 */
export interface CelestialScalingClassification {
  celestialType: CelestialType;
  planetType?: PlanetType; // Relevant if celestialType is PLANET
  // stellarType?: StellarType; // Could be added if stars need sub-type scaling beyond CelestialType.STAR
}

/**
 * Scaling constants for the simulation.
 *
 * These values help maintain consistent scaling across the simulation:
 * - DISTANCE_SCALE: Factor for scaling distances between objects (orbital radii)
 * - SIZE_SCALE: Factor for scaling physical size of objects (radii) - general fallback
 * - MASS_SCALE: Factor for adjusting mass values to prevent numerical precision issues
 * - TIME_SCALE: Factor for time adjustments if needed
 * - RENDER_SCALE_AU: Units in the ThreeJS scene per Astronomical Unit (AU)
 * - GAS_GIANT_SIZE: Specific size multiplier for gas giants relative to base scaled size
 * - STAR_SIZE: Specific size multiplier for stars relative to base scaled size
 * - MOON_DISTANCE: Multiplier for visual distance of moons (not size)
 */
export const SCALE = {
  DISTANCE: 1.0,
  SIZE: 1.0, // Default size multiplier
  TIME: 1.0,
  MASS: 1.0e-20,

  RENDER_SCALE_AU: 1000,

  GAS_GIANT_SIZE: 1.0, // Example: 1.0 means no additional scaling beyond base
  STAR_SIZE: 1.0, // Example: 1.0 means no additional scaling beyond base
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
export function scaleSize(
  realSize: number,
  classification: CelestialScalingClassification,
): number {
  const baseScaledSize = realSize * METERS_TO_SCENE_UNITS;

  switch (classification.celestialType) {
    case CelestialType.STAR:
      // Future: Could use classification.stellarType if different StellarTypes (e.g., RED_GIANT vs MAIN_SEQUENCE)
      // under CelestialType.STAR need distinct scaling factors from SCALE.STAR_SIZE.
      return baseScaledSize * SCALE.STAR_SIZE;
    case CelestialType.PLANET:
      if (classification.planetType === PlanetType.GAS_GIANT) {
        return baseScaledSize * SCALE.GAS_GIANT_SIZE;
      }

      // Default for other planet types (TERRESTRIAL, SUPER_EARTH, ICE_WORLD, etc.)
      return baseScaledSize * SCALE.SIZE;
    case CelestialType.SMALL_BODY:
      // Add more specific scaling for subtypes of SMALL_BODY if needed (e.g., asteroids vs comets vs dwarf planets)
      return baseScaledSize * SCALE.SIZE;
    case CelestialType.STELLAR_REMNANT:
      // e.g. White Dwarf, Neutron Star, Black Hole might have specific scaling factors.
      // For now, using default SCALE.SIZE
      return baseScaledSize * SCALE.SIZE;
    case CelestialType.EXTENDED_STRUCTURE:
      // e.g. Nebulae, Accretion Disks might need very different scaling.
      return baseScaledSize * SCALE.SIZE; // Placeholder, likely needs its own logic
    default:
      return baseScaledSize * SCALE.SIZE;
  }
}

/**
 * Convert a visual size back to a physical size (meters)
 */
export function unscaleSize(
  visualSize: number,
  classification: CelestialScalingClassification,
): number {
  let baseVisualSize = visualSize; // This is the size after a potential type-specific multiplier has been applied

  // Determine the multiplier that was used during scaling
  let multiplier = SCALE.SIZE; // Default multiplier

  switch (classification.celestialType) {
    case CelestialType.STAR:
      multiplier = SCALE.STAR_SIZE;
      break;
    case CelestialType.PLANET:
      if (classification.planetType === PlanetType.GAS_GIANT) {
        multiplier = SCALE.GAS_GIANT_SIZE;
      } else {
        multiplier = SCALE.SIZE; // Default for other planet types
      }
      break;
    // Cases for SMALL_BODY, STELLAR_REMNANT, EXTENDED_STRUCTURE could be added if they use multipliers other than SCALE.SIZE
    default:
      multiplier = SCALE.SIZE;
      break;
  }

  // Remove the type-specific multiplier to get the base scaled size
  if (multiplier === 0) {
    // Avoid division by zero if a scale factor is incorrectly set to 0
    console.warn(
      "unscaleSize: Multiplier is zero, cannot reliably unscale. Visual size returned.",
    );
    return visualSize / METERS_TO_SCENE_UNITS; // Or handle error appropriately
  }
  baseVisualSize = visualSize / multiplier;

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
