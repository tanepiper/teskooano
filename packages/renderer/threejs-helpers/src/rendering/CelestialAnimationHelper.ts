import * as THREE from "three";
import { AnimationHelper, AnimationEase } from "./AnimationHelper";

/**
 * Configuration for celestial object animations
 */
export interface CelestialAnimationConfig {
  duration?: number;
  ease?: AnimationEase;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: () => void;
  onComplete?: () => void;
  orbitControls?: any; // Optional OrbitControls instance for camera animations
}

/**
 * Specialized animation helper for celestial objects in the Teskooano app.
 * Provides common animations for stars, planets, moons, and other celestial bodies.
 */
export class CelestialAnimationHelper {
  /**
   * Creates a rotation animation for a planet or moon around its axis.
   *
   * @param object - The celestial object to animate
   * @param rotationPeriod - Rotation period in seconds (e.g., 24 hours = 86400 seconds)
   * @param config - Animation configuration
   * @returns Animation instance
   */
  static createPlanetRotation(
    object: THREE.Object3D,
    rotationPeriod: number,
    config: CelestialAnimationConfig = {},
  ) {
    return AnimationHelper.createRotationAnimation(
      object,
      "y", // Rotate around Y axis (up)
      rotationPeriod,
      {
        duration: rotationPeriod,
        ease: AnimationEase.None,
        repeat: -1, // Infinite rotation
        ...config,
      },
    );
  }

  /**
   * Creates a pulsing animation for stars to simulate stellar activity.
   *
   * @param object - The star object to animate
   * @param pulseIntensity - How much the star should pulse (1.0 = no change, 1.1 = 10% larger)
   * @param pulsePeriod - Time for one complete pulse cycle in seconds
   * @param config - Animation configuration
   * @returns Animation instance
   */
  static createStarPulse(
    object: THREE.Object3D,
    pulseIntensity: number = 1.05,
    pulsePeriod: number = 2.0,
    config: CelestialAnimationConfig = {},
  ) {
    return AnimationHelper.createPulseAnimation(
      object,
      pulseIntensity,
      pulsePeriod,
      {
        duration: pulsePeriod,
        ease: AnimationEase.SineInOut,
        repeat: -1,
        yoyo: true,
        ...config,
      },
    );
  }

  /**
   * Creates a floating animation for moons or satellites.
   *
   * @param object - The moon/satellite object to animate
   * @param amplitude - Floating amplitude in scene units
   * @param period - Time for one complete float cycle in seconds
   * @param config - Animation configuration
   * @returns Animation instance
   */
  static createMoonFloat(
    object: THREE.Object3D,
    amplitude: number = 0.1,
    period: number = 3.0,
    config: CelestialAnimationConfig = {},
  ) {
    return AnimationHelper.createFloatingAnimation(object, amplitude, period, {
      duration: period,
      ease: AnimationEase.SineInOut,
      repeat: -1,
      yoyo: true,
      ...config,
    });
  }

  /**
   * Creates a material glow animation for stars or other luminous objects.
   *
   * @param material - The material to animate
   * @param minIntensity - Minimum glow intensity
   * @param maxIntensity - Maximum glow intensity
   * @param period - Time for one complete glow cycle in seconds
   * @param config - Animation configuration
   * @returns Animation instance
   */
  static createGlowAnimation(
    material: THREE.Material & { uniforms?: any },
    minIntensity: number = 0.8,
    maxIntensity: number = 1.2,
    period: number = 1.5,
    config: CelestialAnimationConfig = {},
  ) {
    if (!material.uniforms?.glowIntensity) {
      console.warn("Material does not have glowIntensity uniform");
      return null;
    }

    const animationId = `glow_${material.uuid}`;
    AnimationHelper.stopAnimation(animationId);

    const tween = AnimationHelper.animateMaterial(
      material,
      "uniforms.glowIntensity.value",
      maxIntensity,
      {
        duration: period,
        ease: AnimationEase.SineInOut,
        repeat: -1,
        yoyo: true,
        ...config,
      },
    );

    return tween;
  }

  /**
   * Creates an entrance animation for celestial objects when they first appear.
   *
   * @param object - The object to animate
   * @param config - Animation configuration
   * @returns Timeline instance
   */
  static createEntranceAnimation(
    object: THREE.Object3D,
    config: CelestialAnimationConfig = {},
  ) {
    // Start with object invisible and scaled down
    object.scale.setScalar(0);

    // Handle material if object is a Mesh
    const mesh = object as THREE.Mesh;
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.opacity = 0;
          mat.transparent = true;
        });
      } else {
        mesh.material.opacity = 0;
        mesh.material.transparent = true;
      }
    }

    const timeline = AnimationHelper.createTimeline({
      onComplete: config.onComplete,
    });

    // Fade in and scale up
    timeline.to(object.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.BackOut,
      delay: config.delay ?? 0,
    });

    // Animate material opacity if available
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          timeline.to(
            mat,
            {
              opacity: 1,
              duration: (config.duration ?? 1) * 0.5,
              ease: AnimationEase.Power2Out,
            },
            0,
          );
        });
      } else {
        timeline.to(
          mesh.material,
          {
            opacity: 1,
            duration: (config.duration ?? 1) * 0.5,
            ease: AnimationEase.Power2Out,
          },
          0,
        );
      }
    }

    return timeline;
  }

  /**
   * Creates an exit animation for celestial objects when they're removed.
   *
   * @param object - The object to animate
   * @param config - Animation configuration
   * @returns Timeline instance
   */
  static createExitAnimation(
    object: THREE.Object3D,
    config: CelestialAnimationConfig = {},
  ) {
    const timeline = AnimationHelper.createTimeline({
      onComplete: config.onComplete,
    });

    // Handle material if object is a Mesh
    const mesh = object as THREE.Mesh;
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          timeline.to(
            mat,
            {
              opacity: 0,
              duration: (config.duration ?? 1) * 0.5,
              ease: AnimationEase.Power2In,
            },
            0,
          );
        });
      } else {
        timeline.to(
          mesh.material,
          {
            opacity: 0,
            duration: (config.duration ?? 1) * 0.5,
            ease: AnimationEase.Power2In,
          },
          0,
        );
      }
    }

    // Scale down
    timeline.to(
      object.scale,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: config.duration ?? 1,
        ease: config.ease ?? AnimationEase.BackIn,
      },
      0,
    ); // Start at the same time

    return timeline;
  }

  /**
   * Creates a camera focus animation that smoothly moves the camera to focus on a celestial object.
   *
   * @param camera - The camera to animate
   * @param targetObject - The object to focus on
   * @param distance - Distance from the object
   * @param config - Animation configuration
   * @returns Animation instance
   */
  static createFocusAnimation(
    camera: THREE.PerspectiveCamera,
    targetObject: THREE.Object3D,
    distance: number = 10,
    config: CelestialAnimationConfig = {},
  ) {
    const targetPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetPosition);

    // Calculate position offset from target
    const offset = new THREE.Vector3(0, distance * 0.3, distance);
    const cameraPosition = targetPosition.clone().add(offset);

    return AnimationHelper.animateCamera(camera, cameraPosition, {
      duration: config.duration ?? 2,
      ease: config.ease ?? AnimationEase.Power2InOut,
      lookAt: targetPosition,
      orbitControls: config.orbitControls,
      onComplete: config.onComplete,
      onUpdate: config.onUpdate,
    });
  }

  /**
   * Stops all animations for a celestial object.
   *
   * @param object - The object whose animations should be stopped
   */
  static stopCelestialAnimations(object: THREE.Object3D): void {
    AnimationHelper.stopObjectAnimations(object);
  }

  /**
   * Disposes of all celestial animations and cleans up resources.
   */
  static dispose(): void {
    AnimationHelper.dispose();
  }
}
