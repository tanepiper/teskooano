/**
 * Rendering and visualization constants
 *
 * Default values and limits for camera, rendering, and visualization settings.
 */

/**
 * Default field of view for cameras (degrees)
 *
 * The default field of view angle for cameras in the simulation.
 * This provides a good balance between showing enough of the scene
 * while maintaining reasonable perspective distortion.
 * Used for camera initialization and resetting camera settings.
 *
 * @example
 * ```typescript
 * // Initialize camera with default FOV
 * const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, aspectRatio, near, far);
 *
 * // Reset camera to default settings
 * camera.fov = DEFAULT_FOV;
 * camera.updateProjectionMatrix();
 *
 * // Create FOV slider with default value
 * const fovSlider = createSlider(MIN_FOV, MAX_FOV, DEFAULT_FOV);
 * ```
 */
export const DEFAULT_FOV = 75;

/**
 * Minimum field of view (degrees)
 *
 * The minimum allowed field of view angle for cameras in the simulation.
 * This prevents excessive zooming that could cause rendering issues
 * or make navigation difficult.
 * Used for validating FOV inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate FOV input
 * const isValidFOV = fov >= MIN_FOV && fov <= MAX_FOV;
 *
 * // Clamp FOV to valid range
 * const clampedFOV = Math.max(MIN_FOV, Math.min(fov, MAX_FOV));
 *
 * // Create FOV slider with bounds
 * const fovSlider = createSlider(MIN_FOV, MAX_FOV, DEFAULT_FOV);
 * ```
 */
export const MIN_FOV = 10;

/**
 * Maximum field of view (degrees)
 *
 * The maximum allowed field of view angle for cameras in the simulation.
 * This prevents excessive wide-angle views that could cause distortion
 * or make objects appear too small.
 * Used for validating FOV inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate FOV input
 * const isValidFOV = fov >= MIN_FOV && fov <= MAX_FOV;
 *
 * // Determine if FOV is wide-angle
 * const isWideAngle = fov > 90;
 *
 * // Calculate zoom level relative to default
 * const zoomLevel = DEFAULT_FOV / fov;
 * ```
 */
export const MAX_FOV = 120;

/**
 * Default near clipping plane
 *
 * The default near clipping plane distance for cameras in the simulation.
 * This determines the closest distance at which objects are rendered.
 * Used for camera initialization and preventing z-fighting issues.
 *
 * @example
 * ```typescript
 * // Initialize camera with default near plane
 * const camera = new THREE.PerspectiveCamera(fov, aspectRatio, DEFAULT_NEAR, DEFAULT_FAR);
 *
 * // Adjust near plane based on scene scale
 * const adaptiveNear = Math.max(DEFAULT_NEAR, sceneScale * 0.001);
 *
 * // Prevent z-fighting by setting appropriate near plane
 * camera.near = Math.max(DEFAULT_NEAR, objectDistance * 0.01);
 * ```
 */
export const DEFAULT_NEAR = 0.1;

/**
 * Default far clipping plane
 *
 * The default far clipping plane distance for cameras in the simulation.
 * This determines the farthest distance at which objects are rendered.
 * Used for camera initialization and ensuring distant objects are visible.
 *
 * @example
 * ```typescript
 * // Initialize camera with default far plane
 * const camera = new THREE.PerspectiveCamera(fov, aspectRatio, DEFAULT_NEAR, DEFAULT_FAR);
 *
 * // Adjust far plane based on scene scale
 * const adaptiveFar = Math.max(DEFAULT_FAR, sceneScale * 10);
 *
 * // Ensure stars are visible at great distances
 * camera.far = Math.max(DEFAULT_FAR, starDistance * 1.1);
 * ```
 */
export const DEFAULT_FAR = 10000;

/**
 * Default camera movement speed
 *
 * The default speed multiplier for camera movement in the simulation.
 * This provides a comfortable navigation speed for exploring the
 * celestial environment.
 * Used for camera controls and user preference settings.
 *
 * @example
 * ```typescript
 * // Apply camera movement speed
 * const movementVector = direction.multiplyScalar(DEFAULT_CAMERA_SPEED * deltaTime);
 * camera.position.add(movementVector);
 *
 * // Adjust speed based on distance from target
 * const adaptiveSpeed = DEFAULT_CAMERA_SPEED * (distance / 1000);
 *
 * // Create speed slider with default value
 * const speedSlider = createSlider(0.1, 10.0, DEFAULT_CAMERA_SPEED);
 * ```
 */
export const DEFAULT_CAMERA_SPEED = 1.0;

/**
 * Default camera rotation speed
 *
 * The default speed multiplier for camera rotation in the simulation.
 * This provides smooth and responsive camera turning for exploring
 * the celestial environment from different angles.
 * Used for camera controls and user preference settings.
 *
 * @example
 * ```typescript
 * // Apply camera rotation speed
 * const rotationAmount = mouseDelta * DEFAULT_CAMERA_ROTATION_SPEED * deltaTime;
 * camera.rotation.y += rotationAmount;
 *
 * // Adjust rotation speed based on zoom level
 * const adaptiveRotationSpeed = DEFAULT_CAMERA_ROTATION_SPEED * (1 / zoomLevel);
 *
 * // Create rotation speed slider
 * const rotationSlider = createSlider(0.1, 2.0, DEFAULT_CAMERA_ROTATION_SPEED);
 * ```
 */
export const DEFAULT_CAMERA_ROTATION_SPEED = 0.5;

/**
 * Default camera zoom speed
 *
 * The default speed multiplier for camera zooming in the simulation.
 * This provides smooth zoom transitions for focusing on objects
 * or getting a broader view of the scene.
 * Used for camera controls and user preference settings.
 *
 * @example
 * ```typescript
 * // Apply camera zoom speed
 * const zoomAmount = wheelDelta * DEFAULT_CAMERA_ZOOM_SPEED;
 * camera.position.lerp(targetPosition, zoomAmount);
 *
 * // Adjust zoom speed based on current distance
 * const adaptiveZoomSpeed = DEFAULT_CAMERA_ZOOM_SPEED * (distance / 1000);
 *
 * // Create zoom speed slider
 * const zoomSlider = createSlider(0.1, 3.0, DEFAULT_CAMERA_ZOOM_SPEED);
 * ```
 */
export const DEFAULT_CAMERA_ZOOM_SPEED = 1.0;

/**
 * Distance threshold for LOD transitions (scene units)
 *
 * The distance at which Level of Detail (LOD) transitions occur in the simulation.
 * Objects beyond this distance use simplified geometry and materials to maintain
 * performance while preserving visual quality.
 * Used for LOD system management and performance optimization.
 *
 * @example
 * ```typescript
 * // Determine LOD level based on distance
 * const lodLevel = distance > LOD_DISTANCE_THRESHOLD ? 'low' : 'high';
 *
 * // Apply LOD transition with hysteresis
 * const transitionDistance = LOD_DISTANCE_THRESHOLD * (isApproaching ? 0.8 : 1.2);
 *
 * // Optimize rendering based on LOD
 * if (distance > LOD_DISTANCE_THRESHOLD) {
 *   object.useSimplifiedGeometry();
 *   object.useLowQualityMaterial();
 * }
 * ```
 */
export const LOD_DISTANCE_THRESHOLD = 1000;
