/**
 * Orbital calculation constants
 *
 * Constants used for orbital mechanics calculations, Kepler equation solving,
 * and orbital parameter validation.
 */

/**
 * Base tolerance for Kepler equation solver
 *
 * The base tolerance value used in iterative solutions of Kepler's equation.
 * Used for determining convergence in orbital calculations.
 *
 * @example
 * ```typescript
 * // Use base tolerance for elliptical orbits
 * const tolerance = BASE_KEPLER_TOLERANCE;
 * const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity, tolerance);
 * ```
 */
export const BASE_KEPLER_TOLERANCE = 1e-4;

/**
 * Scaling factor for distance-based Kepler tolerance
 *
 * Multiplier for adjusting tolerance based on orbital distance.
 * Larger distances require looser tolerances for numerical stability.
 *
 * @example
 * ```typescript
 * // Calculate adaptive tolerance based on distance
 * const adaptiveTolerance = BASE_KEPLER_TOLERANCE + distanceAU * KEPLER_TOLERANCE_SCALING;
 * ```
 */
export const KEPLER_TOLERANCE_SCALING = 1e-3;

/**
 * Maximum tolerance for Kepler equation solver
 *
 * Upper limit for tolerance values to prevent excessive computational overhead.
 * Used as a safety cap for distance-based tolerance calculations.
 *
 * @example
 * ```typescript
 * // Clamp tolerance to maximum value
 * const clampedTolerance = Math.min(calculatedTolerance, MAX_KEPLER_TOLERANCE);
 * ```
 */
export const MAX_KEPLER_TOLERANCE = 1e-2;

/**
 * Minimum tolerance for Kepler equation solver
 *
 * Lower limit for tolerance values to ensure sufficient accuracy.
 * Used as a safety floor for distance-based tolerance calculations.
 *
 * @example
 * ```typescript
 * // Ensure minimum accuracy
 * const safeTolerance = Math.max(calculatedTolerance, MIN_KEPLER_TOLERANCE);
 * ```
 */
export const MIN_KEPLER_TOLERANCE = 1e-5;

/**
 * Default tolerance for Kepler equation solver
 *
 * Standard tolerance value used when no specific tolerance is provided.
 * Provides a good balance between accuracy and performance.
 *
 * @example
 * ```typescript
 * // Use default tolerance for most calculations
 * const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity, DEFAULT_KEPLER_TOLERANCE);
 * ```
 */
export const DEFAULT_KEPLER_TOLERANCE = 1e-8;

/**
 * Maximum iterations for Kepler equation solver
 *
 * Upper limit on iteration count to prevent infinite loops.
 * Used as a safety measure in iterative orbital calculations.
 *
 * @example
 * ```typescript
 * // Limit iterations for numerical stability
 * for (let i = 0; i < MAX_KEPLER_ITERATIONS; i++) {
 *   // Iterative calculation
 * }
 * ```
 */
export const MAX_KEPLER_ITERATIONS = 100;

/**
 * Restitution coefficient for collision physics
 *
 * Coefficient of restitution for elastic collisions between celestial bodies.
 * A value of 1.0 represents perfectly elastic collisions.
 *
 * @example
 * ```typescript
 * // Apply restitution to collision response
 * const finalVelocity = relativeVelocity * COLLISION_RESTITUTION;
 * ```
 */
export const COLLISION_RESTITUTION = 1.0;
