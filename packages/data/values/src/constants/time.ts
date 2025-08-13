/**
 * Time and animation constants
 *
 * Default values and limits for time simulation, animation, and performance settings.
 */

/**
 * Default simulation time step (seconds)
 *
 * The default time step used for physics calculations in the simulation.
 * This provides a good balance between accuracy and performance for
 * most celestial mechanics calculations.
 * Used for simulation initialization and time step management.
 *
 * @example
 * ```typescript
 * // Initialize simulation with default time step
 * const simulation = new PhysicsSimulation(DEFAULT_TIME_STEP);
 *
 * // Reset time step to default
 * simulation.setTimeStep(DEFAULT_TIME_STEP);
 *
 * // Create time step slider with default value
 * const timeStepSlider = createSlider(MIN_TIME_STEP, MAX_TIME_STEP, DEFAULT_TIME_STEP);
 * ```
 */
export const DEFAULT_TIME_STEP = 1.0;

/**
 * Minimum time step (seconds)
 *
 * The minimum allowed time step for physics calculations in the simulation.
 * This ensures numerical stability and prevents excessive computational
 * overhead from extremely small time steps.
 * Used for time step validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate time step input
 * const isValidTimeStep = timeStep >= MIN_TIME_STEP && timeStep <= MAX_TIME_STEP;
 *
 * // Clamp time step to valid range
 * const clampedTimeStep = Math.max(MIN_TIME_STEP, Math.min(timeStep, MAX_TIME_STEP));
 *
 * // Check if time step is too small
 * const isTooSmall = timeStep < MIN_TIME_STEP;
 * ```
 */
export const MIN_TIME_STEP = 0.001;

/**
 * Maximum time step (seconds)
 *
 * The maximum allowed time step for physics calculations in the simulation.
 * This prevents numerical instability from extremely large time steps
 * that could cause objects to jump unrealistic distances.
 * Used for time step validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate time step input
 * const isValidTimeStep = timeStep >= MIN_TIME_STEP && timeStep <= MAX_TIME_STEP;
 *
 * // Check if time step is too large
 * const isTooLarge = timeStep > MAX_TIME_STEP;
 *
 * // Adjust time step for fast-forward mode
 * const fastForwardTimeStep = Math.min(timeStep * 10, MAX_TIME_STEP);
 * ```
 */
export const MAX_TIME_STEP = 86400; // 1 day

/**
 * Default time scale multiplier
 *
 * The default time scale multiplier for the simulation.
 * A value of 1.0 represents real-time simulation speed.
 * Used for simulation initialization and time scale management.
 *
 * @example
 * ```typescript
 * // Initialize simulation with default time scale
 * const simulation = new PhysicsSimulation();
 * simulation.setTimeScale(DEFAULT_TIME_SCALE);
 *
 * // Reset time scale to default
 * simulation.setTimeScale(DEFAULT_TIME_SCALE);
 *
 * // Create time scale slider with default value
 * const timeScaleSlider = createSlider(MIN_TIME_SCALE, MAX_TIME_SCALE, DEFAULT_TIME_SCALE);
 * ```
 */
export const DEFAULT_TIME_SCALE = 1.0;

/**
 * Minimum time scale
 *
 * The minimum allowed time scale multiplier for the simulation.
 * This allows for very slow motion observation of fast events
 * while preventing the simulation from becoming unresponsive.
 * Used for time scale validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate time scale input
 * const isValidTimeScale = timeScale >= MIN_TIME_SCALE && timeScale <= MAX_TIME_SCALE;
 *
 * // Clamp time scale to valid range
 * const clampedTimeScale = Math.max(MIN_TIME_SCALE, Math.min(timeScale, MAX_TIME_SCALE));
 *
 * // Check if simulation is in slow motion
 * const isSlowMotion = timeScale < 1.0;
 * ```
 */
export const MIN_TIME_SCALE = 0.001;

/**
 * Maximum time scale
 *
 * The maximum allowed time scale multiplier for the simulation.
 * This allows for fast-forward observation of slow events
 * while preventing numerical instability from excessive speeds.
 * Used for time scale validation and simulation stability.
 *
 * @example
 * ```typescript
 * // Validate time scale input
 * const isValidTimeScale = timeScale >= MIN_TIME_SCALE && timeScale <= MAX_TIME_SCALE;
 *
 * // Check if simulation is in fast forward
 * const isFastForward = timeScale > 1.0;
 *
 * // Calculate effective time elapsed
 * const effectiveTimeElapsed = realTimeElapsed * timeScale;
 * ```
 */
export const MAX_TIME_SCALE = 1000000;

/**
 * Target frame rate for performance calculations
 *
 * The target frame rate for the simulation's rendering loop.
 * This provides smooth visual updates while maintaining
 * reasonable performance requirements.
 * Used for performance monitoring and frame rate management.
 *
 * @example
 * ```typescript
 * // Calculate frame time target
 * const targetFrameTime = 1000 / TARGET_FPS; // milliseconds
 *
 * // Check if performance is acceptable
 * const isPerformanceGood = currentFPS >= TARGET_FPS;
 *
 * // Adjust quality settings based on performance
 * if (currentFPS < TARGET_FPS) {
 *   reduceRenderingQuality();
 * }
 * ```
 */
export const TARGET_FPS = 60;

/**
 * Minimum frame rate before performance degradation
 *
 * The minimum acceptable frame rate before the simulation
 * starts degrading visual quality to maintain performance.
 * This ensures the simulation remains responsive even under
 * heavy computational load.
 * Used for performance monitoring and adaptive quality management.
 *
 * @example
 * ```typescript
 * // Check if performance degradation is needed
 * const needsDegradation = currentFPS < MIN_FPS;
 *
 * // Apply performance optimizations
 * if (currentFPS < MIN_FPS) {
 *   enablePerformanceMode();
 *   reduceObjectCount();
 *   simplifyRendering();
 * }
 *
 * // Monitor performance health
 * const performanceHealth = currentFPS >= TARGET_FPS ? 'excellent' :
 *                           currentFPS >= MIN_FPS ? 'acceptable' : 'poor';
 * ```
 */
export const MIN_FPS = 30;
