import * as THREE from "three";

/**
 * Camera presets for different use cases
 */
export enum CameraPreset {
  Basic = "basic",
  Space = "space",
  Debug = "debug",
  Cinematic = "cinematic",
  Orthographic = "orthographic",
}

/**
 * Camera movement types for smooth transitions
 */
export enum CameraMovementType {
  Linear = "linear",
  EaseInOut = "easeInOut",
  EaseIn = "easeIn",
  EaseOut = "easeOut",
  Smooth = "smooth",
}

/**
 * Configuration options for camera creation
 */
export interface CameraConfig {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  up?: [number, number, number];
  enableDamping?: boolean;
  dampingFactor?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  maxDistance?: number;
  minDistance?: number;
  maxPolarAngle?: number;
  minPolarAngle?: number;
}

/**
 * Configuration for camera transitions
 */
export interface CameraTransitionConfig {
  duration: number;
  movementType?: CameraMovementType;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Camera animation state for smooth transitions
 */
interface CameraAnimationState {
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  startTime: number;
  duration: number;
  movementType: CameraMovementType;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Comprehensive utility class for creating and managing Three.js cameras.
 *
 * Provides static methods for camera creation, configuration, animation,
 * and common camera operations with various presets and smooth transitions.
 */
export class CameraHelper {
  private static animationStates = new Map<
    THREE.PerspectiveCamera,
    CameraAnimationState
  >();

  /**
   * Creates a camera with specified preset configuration.
   *
   * @param preset - The camera preset to use
   * @param config - Additional configuration options
   * @returns Configured camera instance
   */
  static createCamera(
    preset: CameraPreset = CameraPreset.Basic,
    config: CameraConfig = {},
  ): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    switch (preset) {
      case CameraPreset.Basic:
        return this.createBasicCamera(config);
      case CameraPreset.Space:
        return this.createSpaceCamera(config);
      case CameraPreset.Debug:
        return this.createDebugCamera(config);
      case CameraPreset.Cinematic:
        return this.createCinematicCamera(config);
      case CameraPreset.Orthographic:
        return this.createOrthographicCamera(config);
      default:
        return this.createBasicCamera(config);
    }
  }

  /**
   * Creates a basic perspective camera with sensible defaults.
   */
  static createBasicCamera(config: CameraConfig = {}): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      config.fov ?? 75,
      config.aspect ?? window.innerWidth / window.innerHeight,
      config.near ?? 0.1,
      config.far ?? 1000,
    );

    camera.position.set(
      config.position?.[0] ?? 0,
      config.position?.[1] ?? 5,
      config.position?.[2] ?? 10,
    );

    if (config.target) {
      camera.lookAt(new THREE.Vector3(...config.target));
    }

    return camera;
  }

  /**
   * Creates a camera optimized for space scenes with wide field of view.
   */
  static createSpaceCamera(config: CameraConfig = {}): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      config.fov ?? 90, // Wider FOV for space scenes
      config.aspect ?? window.innerWidth / window.innerHeight,
      config.near ?? 0.01, // Very close near plane for space
      config.far ?? 1000000, // Very far for space scenes
    );

    camera.position.set(
      config.position?.[0] ?? 0,
      config.position?.[1] ?? 0,
      config.position?.[2] ?? 50,
    );

    if (config.target) {
      camera.lookAt(new THREE.Vector3(...config.target));
    }

    return camera;
  }

  /**
   * Creates a debug camera with wide viewing angles and close near plane.
   */
  static createDebugCamera(config: CameraConfig = {}): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      config.fov ?? 120, // Very wide FOV for debugging
      config.aspect ?? window.innerWidth / window.innerHeight,
      config.near ?? 0.001, // Very close near plane
      config.far ?? 10000,
    );

    camera.position.set(
      config.position?.[0] ?? 10,
      config.position?.[1] ?? 10,
      config.position?.[2] ?? 10,
    );

    if (config.target) {
      camera.lookAt(new THREE.Vector3(...config.target));
    }

    return camera;
  }

  /**
   * Creates a cinematic camera with narrow field of view for dramatic shots.
   */
  static createCinematicCamera(
    config: CameraConfig = {},
  ): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      config.fov ?? 45, // Narrow FOV for cinematic look
      config.aspect ?? window.innerWidth / window.innerHeight,
      config.near ?? 0.1,
      config.far ?? 1000,
    );

    camera.position.set(
      config.position?.[0] ?? 0,
      config.position?.[1] ?? 2,
      config.position?.[2] ?? 15,
    );

    if (config.target) {
      camera.lookAt(new THREE.Vector3(...config.target));
    }

    return camera;
  }

  /**
   * Creates an orthographic camera for 2D-like rendering.
   */
  static createOrthographicCamera(
    config: CameraConfig = {},
  ): THREE.OrthographicCamera {
    const aspect = config.aspect ?? window.innerWidth / window.innerHeight;
    const frustumSize = 10;

    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      config.near ?? 0.1,
      config.far ?? 1000,
    );

    camera.position.set(
      config.position?.[0] ?? 0,
      config.position?.[1] ?? 0,
      config.position?.[2] ?? 10,
    );

    if (config.target) {
      camera.lookAt(new THREE.Vector3(...config.target));
    }

    return camera;
  }

  /**
   * Smoothly transitions a camera to a new position and target.
   *
   * @param camera - The camera to animate
   * @param targetPosition - New position for the camera
   * @param targetLookAt - New target to look at
   * @param config - Transition configuration
   */
  static transitionTo(
    camera: THREE.PerspectiveCamera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    config: CameraTransitionConfig,
  ): void {
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3();

    // Calculate current look-at target
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    startTarget.copy(camera.position).add(direction);

    const animationState: CameraAnimationState = {
      startPosition,
      endPosition: targetPosition.clone(),
      startTarget,
      endTarget: targetLookAt.clone(),
      startTime: Date.now(),
      duration: config.duration,
      movementType: config.movementType ?? CameraMovementType.Smooth,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
    };

    this.animationStates.set(camera, animationState);

    if (config.onStart) {
      config.onStart();
    }
  }

  /**
   * Updates camera animations. Call this in your render loop.
   *
   * @param deltaTime - Time since last frame in seconds
   */
  static updateAnimations(deltaTime: number): void {
    const currentTime = Date.now();

    for (const [camera, state] of this.animationStates.entries()) {
      const elapsed = currentTime - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);

      const easedProgress = this.applyEasing(progress, state.movementType);

      // Interpolate position
      camera.position.lerpVectors(
        state.startPosition,
        state.endPosition,
        easedProgress,
      );

      // Interpolate look-at target
      const currentTarget = new THREE.Vector3();
      currentTarget.lerpVectors(
        state.startTarget,
        state.endTarget,
        easedProgress,
      );
      camera.lookAt(currentTarget);

      if (state.onUpdate) {
        state.onUpdate(easedProgress);
      }

      if (progress >= 1) {
        // Animation complete
        if (state.onComplete) {
          state.onComplete();
        }
        this.animationStates.delete(camera);
      }
    }
  }

  /**
   * Applies easing function to animation progress.
   */
  private static applyEasing(
    progress: number,
    movementType: CameraMovementType,
  ): number {
    switch (movementType) {
      case CameraMovementType.Linear:
        return progress;
      case CameraMovementType.EaseIn:
        return progress * progress;
      case CameraMovementType.EaseOut:
        return 1 - (1 - progress) * (1 - progress);
      case CameraMovementType.EaseInOut:
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case CameraMovementType.Smooth:
        return progress * progress * (3 - 2 * progress); // Smoothstep
      default:
        return progress;
    }
  }

  /**
   * Stops any ongoing animation for a camera.
   *
   * @param camera - The camera to stop animating
   */
  static stopAnimation(camera: THREE.PerspectiveCamera): void {
    this.animationStates.delete(camera);
  }

  /**
   * Stops all camera animations.
   */
  static stopAllAnimations(): void {
    this.animationStates.clear();
  }

  /**
   * Creates a camera that follows an object with smooth damping.
   *
   * @param target - The object to follow
   * @param offset - Offset from the target
   * @param config - Camera configuration
   * @returns Camera configured to follow the target
   */
  static createFollowCamera(
    target: THREE.Object3D,
    offset: THREE.Vector3 = new THREE.Vector3(0, 5, 10),
    config: CameraConfig = {},
  ): THREE.PerspectiveCamera {
    const camera = this.createBasicCamera(config);

    // Update camera position to follow target
    const updateFollowCamera = () => {
      const targetWorldPosition = new THREE.Vector3();
      target.getWorldPosition(targetWorldPosition);
      camera.position.copy(targetWorldPosition).add(offset);
      camera.lookAt(targetWorldPosition);
    };

    // Store the update function on the camera for external use
    (camera as any).updateFollowCamera = updateFollowCamera;

    return camera;
  }

  /**
   * Creates a camera that orbits around a target point.
   *
   * @param target - The point to orbit around
   * @param radius - Orbit radius
   * @param height - Height offset from target
   * @param config - Camera configuration
   * @returns Camera configured to orbit the target
   */
  static createOrbitCamera(
    target: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    radius: number = 10,
    height: number = 5,
    config: CameraConfig = {},
  ): THREE.PerspectiveCamera {
    const camera = this.createBasicCamera(config);

    // Set initial position
    camera.position.set(radius, height, 0);
    camera.lookAt(target);

    // Store orbit parameters for external use
    (camera as any).orbitTarget = target.clone();
    (camera as any).orbitRadius = radius;
    (camera as any).orbitHeight = height;

    return camera;
  }

  /**
   * Updates an orbit camera's position based on angles.
   *
   * @param camera - The orbit camera to update
   * @param azimuthAngle - Horizontal angle in radians
   * @param polarAngle - Vertical angle in radians
   */
  static updateOrbitCamera(
    camera: THREE.PerspectiveCamera,
    azimuthAngle: number,
    polarAngle: number,
  ): void {
    const orbitData = camera as any;
    if (!orbitData.orbitTarget) return;

    const target = orbitData.orbitTarget;
    const radius = orbitData.orbitRadius;
    const height = orbitData.orbitHeight;

    // Calculate position
    const x = radius * Math.sin(polarAngle) * Math.cos(azimuthAngle);
    const y = height + radius * Math.cos(polarAngle);
    const z = radius * Math.sin(polarAngle) * Math.sin(azimuthAngle);

    camera.position.set(x, y, z);
    camera.lookAt(target);
  }

  /**
   * Creates a camera frustum helper for debugging.
   *
   * @param camera - The camera to create a helper for
   * @param color - Color of the frustum lines
   * @returns Frustum helper object
   */
  static createFrustumHelper(
    camera: THREE.PerspectiveCamera,
    color: number = 0xffff00,
  ): THREE.LineSegments {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color });

    // Create frustum vertices
    const near = camera.near;
    const far = camera.far;
    const fov = (camera.fov * Math.PI) / 180;
    const aspect = camera.aspect;

    const nearHeight = 2 * Math.tan(fov / 2) * near;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan(fov / 2) * far;
    const farWidth = farHeight * aspect;

    const vertices = new Float32Array([
      // Near plane
      -nearWidth / 2,
      -nearHeight / 2,
      -near,
      nearWidth / 2,
      -nearHeight / 2,
      -near,
      nearWidth / 2,
      nearHeight / 2,
      -near,
      -nearWidth / 2,
      nearHeight / 2,
      -near,
      -nearWidth / 2,
      -nearHeight / 2,
      -near,

      // Far plane
      -farWidth / 2,
      -farHeight / 2,
      -far,
      farWidth / 2,
      -farHeight / 2,
      -far,
      farWidth / 2,
      farHeight / 2,
      -far,
      -farWidth / 2,
      farHeight / 2,
      -far,
      -farWidth / 2,
      -farHeight / 2,
      -far,

      // Connecting lines
      -nearWidth / 2,
      -nearHeight / 2,
      -near,
      -farWidth / 2,
      -farHeight / 2,
      -far,

      nearWidth / 2,
      -nearHeight / 2,
      -near,
      farWidth / 2,
      -farHeight / 2,
      -far,

      nearWidth / 2,
      nearHeight / 2,
      -near,
      farWidth / 2,
      farHeight / 2,
      -far,

      -nearWidth / 2,
      nearHeight / 2,
      -near,
      -farWidth / 2,
      farHeight / 2,
      -far,
    ]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const frustumHelper = new THREE.LineSegments(geometry, material);
    frustumHelper.position.copy(camera.position);
    frustumHelper.quaternion.copy(camera.quaternion);

    return frustumHelper;
  }

  /**
   * Resizes a camera to match new dimensions.
   *
   * @param camera - The camera to resize
   * @param width - New width
   * @param height - New height
   */
  static resizeCamera(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    width: number,
    height: number,
  ): void {
    const aspect = width / height;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
    } else if (camera instanceof THREE.OrthographicCamera) {
      const frustumSize = 10;
      camera.left = (frustumSize * aspect) / -2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
    }

    camera.updateProjectionMatrix();
  }

  /**
   * Creates a camera that smoothly interpolates between multiple keyframes.
   *
   * @param keyframes - Array of camera positions and targets
   * @param config - Camera configuration
   * @returns Camera configured for keyframe animation
   */
  static createKeyframeCamera(
    keyframes: Array<{
      position: THREE.Vector3;
      target: THREE.Vector3;
      time: number;
    }>,
    config: CameraConfig = {},
  ): THREE.PerspectiveCamera {
    const camera = this.createBasicCamera(config);

    // Sort keyframes by time
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

    // Store keyframes for external use
    (camera as any).keyframes = sortedKeyframes;
    (camera as any).currentKeyframeIndex = 0;

    return camera;
  }

  /**
   * Updates a keyframe camera to a specific time.
   *
   * @param camera - The keyframe camera to update
   * @param time - Current time in the animation
   */
  static updateKeyframeCamera(
    camera: THREE.PerspectiveCamera,
    time: number,
  ): void {
    const keyframeData = camera as any;
    if (!keyframeData.keyframes || keyframeData.keyframes.length < 2) return;

    const keyframes = keyframeData.keyframes;

    // Find the appropriate keyframe segment
    let startKeyframe = keyframes[0];
    let endKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        startKeyframe = keyframes[i];
        endKeyframe = keyframes[i + 1];
        break;
      }
    }

    // Interpolate between keyframes
    const segmentDuration = endKeyframe.time - startKeyframe.time;
    const segmentProgress =
      segmentDuration > 0 ? (time - startKeyframe.time) / segmentDuration : 0;

    const easedProgress = this.applyEasing(
      segmentProgress,
      CameraMovementType.Smooth,
    );

    // Interpolate position and target
    camera.position.lerpVectors(
      startKeyframe.position,
      endKeyframe.position,
      easedProgress,
    );

    const currentTarget = new THREE.Vector3();
    currentTarget.lerpVectors(
      startKeyframe.target,
      endKeyframe.target,
      easedProgress,
    );
    camera.lookAt(currentTarget);
  }

  /**
   * Disposes of camera resources and stops animations.
   *
   * @param camera - The camera to dispose
   */
  static disposeCamera(camera: THREE.PerspectiveCamera): void {
    this.stopAnimation(camera);

    // Clear any stored data
    delete (camera as any).updateFollowCamera;
    delete (camera as any).orbitTarget;
    delete (camera as any).orbitRadius;
    delete (camera as any).orbitHeight;
    delete (camera as any).keyframes;
    delete (camera as any).currentKeyframeIndex;
  }

  /**
   * Updates camera settings based on celestial object type for optimal viewing.
   *
   * @param camera - The camera to update
   * @param celestialType - The type of celestial object being viewed
   */
  static updateCameraForCelestialType(
    camera: THREE.PerspectiveCamera,
    celestialType?: string,
  ): void {
    if (!celestialType) {
      // Default settings for general space viewing with logarithmic depth
      camera.near = 0.00001; // 0.00000001 AU ≈ 1.5 km (ultra-close general viewing with log depth)
      camera.updateProjectionMatrix();
      return;
    }

    // Dynamic camera settings optimized for logarithmic depth buffer
    // With log depth, we can use much more aggressive near planes for close viewing
    // while maintaining excellent precision across the entire distance range
    const nearPlanes: Record<string, number> = {
      star: 0.0001, // 0.001 AU ≈ 150k km (very close to stellar surfaces with log depth)
      planet: 0.0001, // 0.00001 AU ≈ 1.5k km (extremely close to planetary surfaces)
      gas_giant: 0.0001, // 0.0001 AU ≈ 15k km (close to gas giant cloud tops)
      dwarf_planet: 0.0001, // 0.000005 AU ≈ 750 km (ultra-close dwarf planet viewing)
      moon: 0.0001, // 0.000001 AU ≈ 150 km (ultra-close moon viewing)
      asteroid: 0.0000001, // 0.0000001 AU ≈ 15 km (very close individual asteroid inspection)
      comet: 0.0000001, // 0.000001 AU ≈ 150 km (ultra-close comet viewing)
      satellite: 0.0000001, // 0.0000001 AU ≈ 15 km (extremely close satellite inspection)
      oort_cloud: 0.1, // 0.0001 AU ≈ 15k km (close particle field viewing)
      asteroid_field: 0.01, // 0.00001 AU ≈ 1.5k km (very close asteroid viewing)
    };

    const nearPlane = nearPlanes[celestialType.toLowerCase()] ?? 0.00001;
    camera.near = nearPlane;
    camera.updateProjectionMatrix();
  }

  /**
   * Gets the minimum distance for camera controls based on celestial object type.
   *
   * @param celestialType - The type of celestial object
   * @returns Minimum distance in scene units
   */
  static getMinDistanceForCelestialType(celestialType?: string): number {
    if (!celestialType) {
      return 0.0001; // Default minimum distance
    }

    const minDistances: Record<string, number> = {
      star: 0.1,
      planet: 0.01,
      gas_giant: 0.01,
      dwarf_planet: 0.001,
      moon: 0.0001,
      asteroid: 0.0000001, // 150 m minimum - allows very close inspection of small asteroids
      comet: 0.0000001,
      satellite: 0.000001,
      oort_cloud: 0.0001,
      asteroid_field: 0.0001,
    };

    return minDistances[celestialType.toLowerCase()] ?? 0.0001;
  }
}
