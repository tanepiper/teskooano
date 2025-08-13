/**
 * Simulation limits and constraints
 *
 * Numerical limits and constraints used to maintain simulation stability
 * and prevent numerical overflow or instability issues.
 */

/** Maximum force magnitude to prevent numerical instability (N) */
export const MAX_FORCE = 1e25;

/** Maximum velocity magnitude to prevent numerical instability (m/s) */
export const MAX_VELOCITY = 1e7;

/** Minimum mass for stable physics calculations (kg) */
export const MIN_MASS = 1e10;

/** Maximum mass for stable physics calculations (kg) */
export const MAX_MASS = 1e35;

/** Minimum distance for collision detection (m) */
export const MIN_COLLISION_DISTANCE = 1e3;

/** Maximum distance for physics calculations (m) */
export const MAX_PHYSICS_DISTANCE = 1e20;

/** Maximum number of celestial objects for stable performance */
export const MAX_CELESTIAL_OBJECTS = 80;

/** Maximum number of particles for asteroid fields */
export const MAX_PARTICLES = 10000;

/** Maximum number of trail points per object */
export const MAX_TRAIL_POINTS = 1000;

/**
 * Gravitational softening parameter (m²)
 *
 * Prevents gravitational force from becoming infinite at very small distances.
 * A value around (parentRadius + moonRadius)² or similar can be physical.
 * Used for numerical stability in N-body simulations.
 *
 * @example
 * ```typescript
 * // Apply gravitational softening
 * const effectiveDistSq = distSq + GRAVITATIONAL_SOFTENING_SQUARED;
 * const forceMagnitude = (G * mass1 * mass2) / effectiveDistSq;
 *
 * // Adjust softening based on simulation scale
 * const adaptiveSoftening = Math.max(GRAVITATIONAL_SOFTENING_SQUARED, scale * 1e6);
 * ```
 */
export const GRAVITATIONAL_SOFTENING_SQUARED = 1e6;

/**
 * Mass difference threshold for collision physics
 *
 * Threshold for mass difference to trigger inelastic collision.
 * When one object is less than 10% the mass of another, it gets absorbed.
 * Used for collision resolution and destruction events.
 *
 * @example
 * ```typescript
 * // Check if collision should result in absorption
 * const massRatio = smallerMass / largerMass;
 * const shouldAbsorb = massRatio < MASS_DIFF_THRESHOLD;
 *
 * // Determine collision outcome
 * const collisionType = massRatio < MASS_DIFF_THRESHOLD ? 'absorption' : 'elastic';
 * ```
 */
export const MASS_DIFF_THRESHOLD = 0.1;

/**
 * Minimum distance for rogue objects (AU)
 *
 * The minimum distance from the system center for rogue objects
 * to ensure they don't interfere with the main system.
 * Used for placing rogue planets and interstellar objects.
 *
 * @example
 * ```typescript
 * // Place rogue object at safe distance
 * const safeDistanceAU = Math.max(baseDistance, MIN_ROGUE_DISTANCE_AU);
 * const position_m = safeDistanceAU * AU_METERS;
 *
 * // Check if object is far enough to be considered rogue
 * const isRogue = distanceAU >= MIN_ROGUE_DISTANCE_AU;
 * ```
 */
export const MIN_ROGUE_DISTANCE_AU = 50;

/**
 * Special identifier for mutual destruction events
 *
 * Used to identify collision events where both objects are destroyed
 * due to similar masses or high impact velocities.
 * Used in collision detection and event handling.
 *
 * @example
 * ```typescript
 * // Handle mutual destruction
 * if (eventId === MUTUAL_DESTRUCTION_ID) {
 *   destroyBothObjects(body1, body2);
 * }
 *
 * // Create mutual destruction event
 * const event = { type: MUTUAL_DESTRUCTION_ID, bodies: [body1, body2] };
 * ```
 */
export const MUTUAL_DESTRUCTION_ID = "MUTUAL_DESTRUCTION";
