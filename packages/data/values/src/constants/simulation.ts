/**
 * Simulation limits and constraints
 *
 * Numerical limits and constraints used to maintain simulation stability
 * and prevent numerical overflow or instability issues.
 */

/**
 * Maximum force magnitude to prevent numerical instability (N)
 *
 * The maximum allowed gravitational force magnitude in the simulation.
 * This prevents numerical overflow and instability when objects get
 * extremely close to each other or have very large masses.
 * Used for force clamping and simulation stability.
 *
 * @example
 * ```typescript
 * // Clamp gravitational force to prevent instability
 * const clampedForce = Math.min(calculatedForce, MAX_FORCE);
 *
 * // Check if force calculation is stable
 * const isStable = calculatedForce <= MAX_FORCE;
 *
 * // Apply force with safety check
 * if (force.magnitude() > MAX_FORCE) {
 *   force.normalize().multiplyScalar(MAX_FORCE);
 * }
 * ```
 */
export const MAX_FORCE = 1e25;

/**
 * Maximum velocity magnitude to prevent numerical instability (m/s)
 *
 * The maximum allowed velocity magnitude in the simulation.
 * This prevents objects from moving at unrealistic speeds that could
 * cause numerical errors or visual artifacts.
 * Used for velocity clamping and simulation stability.
 *
 * @example
 * ```typescript
 * // Clamp velocity to prevent instability
 * const clampedVelocity = Math.min(calculatedVelocity, MAX_VELOCITY);
 *
 * // Check if velocity is relativistic
 * const isRelativistic = velocity > 0.1 * SPEED_OF_LIGHT;
 *
 * // Apply velocity with safety check
 * if (velocity.magnitude() > MAX_VELOCITY) {
 *   velocity.normalize().multiplyScalar(MAX_VELOCITY);
 * }
 * ```
 */
export const MAX_VELOCITY = 1e7;

/**
 * Minimum mass for stable physics calculations (kg)
 *
 * The minimum allowed mass for celestial objects in the simulation.
 * This prevents numerical instability from extremely small masses
 * that could cause division by zero or floating-point errors.
 * Used for mass validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate object mass
 * const isValidMass = mass >= MIN_MASS && mass <= MAX_MASS;
 *
 * // Clamp mass to valid range
 * const clampedMass = Math.max(MIN_MASS, Math.min(mass, MAX_MASS));
 *
 * // Check if object is too small for physics
 * const isTooSmall = mass < MIN_MASS;
 * ```
 */
export const MIN_MASS = 1e10;

/**
 * Maximum mass for stable physics calculations (kg)
 *
 * The maximum allowed mass for celestial objects in the simulation.
 * This prevents numerical overflow from extremely large masses
 * that could cause floating-point errors or infinite forces.
 * Used for mass validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate object mass
 * const isValidMass = mass >= MIN_MASS && mass <= MAX_MASS;
 *
 * // Check if object is a black hole candidate
 * const isBlackHoleCandidate = mass > 1e30; // 1 solar mass
 *
 * // Calculate gravitational parameter safely
 * const gravitationalParameter = Math.min(GRAVITATIONAL_CONSTANT * mass, MAX_FORCE);
 * ```
 */
export const MAX_MASS = 1e35;

/**
 * Minimum distance for collision detection (m)
 *
 * The minimum distance at which collision detection is performed.
 * This prevents objects from overlapping completely and ensures
 * realistic collision behavior in the simulation.
 * Used for collision detection and physics calculations.
 *
 * @example
 * ```typescript
 * // Check if objects are colliding
 * const distance = object1.position.distanceTo(object2.position);
 * const isColliding = distance < (object1.radius + object2.radius + MIN_COLLISION_DISTANCE);
 *
 * // Prevent objects from getting too close
 * if (distance < MIN_COLLISION_DISTANCE) {
 *   // Apply repulsion force or merge objects
 * }
 *
 * // Calculate collision response
 * const collisionResponse = distance < MIN_COLLISION_DISTANCE ? 'collision' : 'separation';
 * ```
 */
export const MIN_COLLISION_DISTANCE = 1e3;

/**
 * Maximum distance for physics calculations (m)
 *
 * The maximum distance at which physics calculations are performed.
 * This optimizes performance by ignoring gravitational effects from
 * objects that are too far away to have significant influence.
 * Used for physics optimization and performance management.
 *
 * @example
 * ```typescript
 * // Check if physics calculation is needed
 * const distance = object1.position.distanceTo(object2.position);
 * const shouldCalculatePhysics = distance < MAX_PHYSICS_DISTANCE;
 *
 * // Optimize force calculations
 * if (distance > MAX_PHYSICS_DISTANCE) {
 *   return; // Skip physics for distant objects
 * }
 *
 * // Calculate gravitational influence
 * const influence = distance < MAX_PHYSICS_DISTANCE ? 'significant' : 'negligible';
 * ```
 */
export const MAX_PHYSICS_DISTANCE = 1e20;

/**
 * Maximum number of celestial objects for stable performance
 *
 * The maximum number of celestial objects allowed in the simulation.
 * This ensures stable performance and prevents memory issues from
 * too many objects being processed simultaneously.
 * Used for performance management and system limits.
 *
 * @example
 * ```typescript
 * // Check if system is at capacity
 * const isAtCapacity = objectCount >= MAX_CELESTIAL_OBJECTS;
 *
 * // Validate object creation
 * if (objectCount >= MAX_CELESTIAL_OBJECTS) {
 *   throw new Error('Maximum number of celestial objects reached');
 * }
 *
 * // Calculate performance load
 * const performanceLoad = objectCount / MAX_CELESTIAL_OBJECTS;
 * ```
 */
export const MAX_CELESTIAL_OBJECTS = 80;

/**
 * Maximum number of particles for asteroid fields
 *
 * The maximum number of particles allowed in asteroid fields and
 * other particle systems in the simulation.
 * This ensures stable performance while maintaining visual quality
 * for particle effects.
 * Used for particle system management and performance optimization.
 *
 * @example
 * ```typescript
 * // Check if particle system is at capacity
 * const isAtCapacity = particleCount >= MAX_PARTICLES;
 *
 * // Limit particle creation
 * const actualParticleCount = Math.min(requestedParticles, MAX_PARTICLES);
 *
 * // Calculate particle density
 * const particleDensity = particleCount / MAX_PARTICLES;
 * ```
 */
export const MAX_PARTICLES = 10000;

/**
 * Maximum number of trail points per object
 *
 * The maximum number of trail points allowed per celestial object
 * for trajectory visualization in the simulation.
 * This ensures smooth trail rendering while preventing memory
 * issues from excessive trail data.
 * Used for trail system management and performance optimization.
 *
 * @example
 * ```typescript
 * // Check if trail is at capacity
 * const isAtCapacity = trailPoints.length >= MAX_TRAIL_POINTS;
 *
 * // Limit trail points
 * const actualTrailPoints = Math.min(requestedPoints, MAX_TRAIL_POINTS);
 *
 * // Remove old trail points when at capacity
 * if (trailPoints.length >= MAX_TRAIL_POINTS) {
 *   trailPoints.shift(); // Remove oldest point
 * }
 * ```
 */
export const MAX_TRAIL_POINTS = 1000;
