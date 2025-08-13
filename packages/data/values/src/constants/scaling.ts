/**
 * Scaling and rendering constants
 *
 * Constants used for converting between physics units and rendering units,
 * and for managing the visual scaling of celestial objects.
 */

import { AU_METERS } from "./astronomical";

/**
 * Scaling factors for the simulation
 *
 * These values help maintain consistent scaling across the simulation:
 * - DISTANCE: Factor for scaling distances between objects (orbital radii)
 * - SIZE: Factor for scaling physical size of objects (radii)
 * - MASS: Factor for adjusting mass values to prevent numerical precision issues
 * - TIME: Factor for time adjustments if needed
 * - RENDER_SCALE_AU: Units in the ThreeJS scene per Astronomical Unit (AU)
 */
export const SCALE = {
  /** Factor for scaling distances between objects (orbital radii) */
  DISTANCE: 1.0,
  /** Factor for scaling physical size of objects (radii) */
  SIZE: 1.0,
  /** Factor for time adjustments if needed */
  TIME: 1.0,
  /** Factor for adjusting mass values to prevent numerical precision issues */
  MASS: 1.0e-20,
  /** Units in the ThreeJS scene per Astronomical Unit (AU) */
  RENDER_SCALE_AU: 1000,
  /** Size multiplier for gas giants */
  GAS_GIANT_SIZE: 1.0,
  /** Size multiplier for stars */
  STAR_SIZE: 1.0,
  /** Distance multiplier for moons */
  MOON_DISTANCE: 50.0,
} as const;

/**
 * Conversion factor from meters to scene units
 *
 * Converts real-world distances in meters to the scaled units used
 * in the Three.js rendering scene.
 *
 * @example
 * ```typescript
 * // Convert real distance to scene units
 * const sceneDistance = realDistance * METERS_TO_SCENE_UNITS;
 *
 * // Convert scene distance back to meters
 * const realDistance = sceneDistance / METERS_TO_SCENE_UNITS;
 * ```
 */
export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

/**
 * Default render scale for astronomical units
 *
 * The default number of scene units that represent one astronomical unit.
 * This provides a good balance between visual detail and performance.
 *
 * @example
 * ```typescript
 * // Set render scale for camera
 * camera.far = DEFAULT_RENDER_SCALE_AU * 10;
 *
 * // Calculate scene bounds
 * const sceneBounds = DEFAULT_RENDER_SCALE_AU * 100;
 * ```
 */
export const DEFAULT_RENDER_SCALE_AU = 1000;

/**
 * Minimum render scale for astronomical units
 *
 * The minimum scale that still provides meaningful visual detail.
 * Used for performance optimization in distant views.
 *
 * @example
 * ```typescript
 * // Apply minimum scale for distant objects
 * const adaptiveScale = Math.max(scale, MIN_RENDER_SCALE_AU);
 * ```
 */
export const MIN_RENDER_SCALE_AU = 100;

/**
 * Maximum render scale for astronomical units
 *
 * The maximum scale that maintains reasonable performance.
 * Used for close-up views of celestial objects.
 *
 * @example
 * ```typescript
 * // Apply maximum scale for close objects
 * const adaptiveScale = Math.min(scale, MAX_RENDER_SCALE_AU);
 * ```
 */
export const MAX_RENDER_SCALE_AU = 10000;
