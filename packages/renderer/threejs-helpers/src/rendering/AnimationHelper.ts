import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Animation easing types that can be used with GSAP
 */
export enum AnimationEase {
  None = "none",
  Power1In = "power1.in",
  Power1Out = "power1.out",
  Power1InOut = "power1.inOut",
  Power2In = "power2.in",
  Power2Out = "power2.out",
  Power2InOut = "power2.inOut",
  Power3In = "power3.in",
  Power3Out = "power3.out",
  Power3InOut = "power3.inOut",
  Power4In = "power4.in",
  Power4Out = "power4.out",
  Power4InOut = "power4.inOut",
  BackIn = "back.in",
  BackOut = "back.out",
  BackInOut = "back.inOut",
  BounceIn = "bounce.in",
  BounceOut = "bounce.out",
  BounceInOut = "bounce.inOut",
  ElasticIn = "elastic.in",
  ElasticOut = "elastic.out",
  ElasticInOut = "elastic.inOut",
  SineIn = "sine.in",
  SineOut = "sine.out",
  SineInOut = "sine.inOut",
  ExpoIn = "expo.in",
  ExpoOut = "expo.out",
  ExpoInOut = "expo.inOut",
  CircIn = "circ.in",
  CircOut = "circ.out",
  CircInOut = "circ.inOut",
}

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  duration?: number;
  ease?: AnimationEase | string;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: () => void;
  onComplete?: () => void;
  onRepeat?: () => void;
  onReverseComplete?: () => void;
}

/**
 * Camera animation configuration
 */
export interface CameraAnimationConfig extends AnimationConfig {
  lookAt?: THREE.Vector3;
  maintainLookAt?: boolean;
  orbitControls?: any; // OrbitControls instance for target updates
}

/**
 * Material animation configuration
 */
export interface MaterialAnimationConfig extends AnimationConfig {
  property?: string;
  fromValue?: any;
  toValue?: any;
}

/**
 * Comprehensive utility class for creating smooth animations with GSAP.
 *
 * Provides static methods for animating Three.js objects, cameras, materials,
 * and scene elements with various easing functions and configurations.
 */
export class AnimationHelper {
  private static activeAnimations = new Map<
    string,
    gsap.core.Tween | gsap.core.Timeline
  >();

  /**
   * Animates an object's position to a target position.
   *
   * @param object - The object to animate
   * @param targetPosition - Target position
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static animatePosition(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `position_${object.uuid}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(object.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.Power2Out,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Animates an object's rotation to a target rotation.
   *
   * @param object - The object to animate
   * @param targetRotation - Target rotation (in radians)
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static animateRotation(
    object: THREE.Object3D,
    targetRotation: THREE.Euler,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `rotation_${object.uuid}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(object.rotation, {
      x: targetRotation.x,
      y: targetRotation.y,
      z: targetRotation.z,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.Power2Out,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Animates an object's scale to a target scale.
   *
   * @param object - The object to animate
   * @param targetScale - Target scale
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static animateScale(
    object: THREE.Object3D,
    targetScale: THREE.Vector3,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `scale_${object.uuid}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(object.scale, {
      x: targetScale.x,
      y: targetScale.y,
      z: targetScale.z,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.BackOut,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Animates a camera to a new position and optionally a new look-at target.
   *
   * @param camera - The camera to animate
   * @param targetPosition - Target position
   * @param config - Camera animation configuration
   * @returns GSAP tween instance
   */
  static animateCamera(
    camera: THREE.Camera,
    targetPosition: THREE.Vector3,
    config: CameraAnimationConfig = {},
  ): gsap.core.Timeline {
    const animationId = `camera_${camera.uuid}`;
    this.stopAnimation(animationId);

    const timeline = gsap.timeline({
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    // Animate position
    timeline.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: config.duration ?? 2,
      ease: config.ease ?? AnimationEase.Power2InOut,
      delay: config.delay ?? 0,
    });

    // Animate look-at if specified
    if (config.lookAt) {
      // Calculate current target by getting the direction the camera is facing
      const currentTarget = new THREE.Vector3();
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      currentTarget.copy(camera.position).add(direction);

      // Create a timeline for the lookAt animation
      const lookAtTimeline = gsap.timeline();

      // Animate the target position
      lookAtTimeline.to(currentTarget, {
        x: config.lookAt.x,
        y: config.lookAt.y,
        z: config.lookAt.z,
        duration: config.duration ?? 2,
        ease: config.ease ?? AnimationEase.Power2InOut,
        onUpdate: () => {
          if (config.orbitControls) {
            // Update OrbitControls target if available
            config.orbitControls.target.copy(currentTarget);
            config.orbitControls.update();
          } else {
            // Fallback to direct camera lookAt
            camera.lookAt(currentTarget);
          }
        },
      });

      // Add the lookAt timeline to the main timeline
      timeline.add(lookAtTimeline, 0); // Start at the same time as position animation
    }

    this.activeAnimations.set(animationId, timeline);
    return timeline;
  }

  /**
   * Animates a material property (color, opacity, etc.).
   *
   * @param material - The material to animate
   * @param property - Property to animate
   * @param toValue - Target value
   * @param config - Material animation configuration
   * @returns GSAP tween instance
   */
  static animateMaterial(
    material: THREE.Material,
    property: string,
    toValue: any,
    config: MaterialAnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `material_${material.uuid}_${property}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(material, {
      [property]: toValue,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.Power2Out,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Animates a material's color.
   *
   * @param material - The material to animate
   * @param targetColor - Target color (hex or THREE.Color)
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static animateColor(
    material: THREE.Material & { color?: THREE.Color },
    targetColor: number | THREE.Color,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    if (!material.color) {
      throw new Error("Material does not have a color property");
    }

    const animationId = `color_${material.uuid}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(material.color, {
      r:
        targetColor instanceof THREE.Color
          ? targetColor.r
          : (targetColor >> 16) / 255,
      g:
        targetColor instanceof THREE.Color
          ? targetColor.g
          : ((targetColor >> 8) & 255) / 255,
      b:
        targetColor instanceof THREE.Color
          ? targetColor.b
          : (targetColor & 255) / 255,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.Power2Out,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Animates a material's opacity.
   *
   * @param material - The material to animate
   * @param targetOpacity - Target opacity (0-1)
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static animateOpacity(
    material: THREE.Material,
    targetOpacity: number,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `opacity_${material.uuid}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(material, {
      opacity: targetOpacity,
      duration: config.duration ?? 1,
      ease: config.ease ?? AnimationEase.Power2Out,
      delay: config.delay ?? 0,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Creates a floating animation for an object.
   *
   * @param object - The object to animate
   * @param amplitude - Floating amplitude
   * @param duration - Animation duration
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static createFloatingAnimation(
    object: THREE.Object3D,
    amplitude: number = 0.5,
    duration: number = 2,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `floating_${object.uuid}`;
    this.stopAnimation(animationId);

    const originalY = object.position.y;
    const tween = gsap.to(object.position, {
      y: originalY + amplitude,
      duration: duration,
      ease: AnimationEase.SineInOut,
      repeat: -1,
      yoyo: true,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Creates a rotating animation for an object.
   *
   * @param object - The object to animate
   * @param axis - Rotation axis ('x', 'y', 'z')
   * @param duration - Animation duration
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static createRotationAnimation(
    object: THREE.Object3D,
    axis: "x" | "y" | "z" = "y",
    duration: number = 10,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `rotation_${object.uuid}_${axis}`;
    this.stopAnimation(animationId);

    const tween = gsap.to(object.rotation, {
      [axis]: Math.PI * 2,
      duration: duration,
      ease: AnimationEase.None,
      repeat: -1,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Creates a pulsing scale animation for an object.
   *
   * @param object - The object to animate
   * @param scaleFactor - Scale factor (1 = no change, 1.2 = 20% larger)
   * @param duration - Animation duration
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static createPulseAnimation(
    object: THREE.Object3D,
    scaleFactor: number = 1.2,
    duration: number = 1,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `pulse_${object.uuid}`;
    this.stopAnimation(animationId);

    const originalScale = object.scale.clone();
    const tween = gsap.to(object.scale, {
      x: originalScale.x * scaleFactor,
      y: originalScale.y * scaleFactor,
      z: originalScale.z * scaleFactor,
      duration: duration,
      ease: AnimationEase.Power2InOut,
      repeat: -1,
      yoyo: true,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }

  /**
   * Creates a timeline for complex multi-step animations.
   *
   * @param config - Timeline configuration
   * @returns GSAP timeline instance
   */
  static createTimeline(config: AnimationConfig = {}): gsap.core.Timeline {
    return gsap.timeline({
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });
  }

  /**
   * Animates multiple objects in sequence.
   *
   * @param objects - Array of objects to animate
   * @param animationFunction - Function that returns animation config for each object
   * @param stagger - Delay between each object's animation
   * @param config - Global animation configuration
   * @returns GSAP timeline instance
   */
  static animateSequence<T extends THREE.Object3D>(
    objects: T[],
    animationFunction: (object: T, index: number) => any,
    stagger: number = 0.1,
    config: AnimationConfig = {},
  ): gsap.core.Timeline {
    const timeline = this.createTimeline(config);

    objects.forEach((object, index) => {
      const animationConfig = animationFunction(object, index);
      timeline.add(animationConfig, index * stagger);
    });

    return timeline;
  }

  /**
   * Stops a specific animation by ID.
   *
   * @param animationId - The animation ID to stop
   */
  static stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.kill();
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * Stops all animations for a specific object.
   *
   * @param object - The object whose animations should be stopped
   */
  static stopObjectAnimations(object: THREE.Object3D): void {
    const objectId = object.uuid;
    for (const [animationId, animation] of this.activeAnimations.entries()) {
      if (animationId.includes(objectId)) {
        animation.kill();
        this.activeAnimations.delete(animationId);
      }
    }
  }

  /**
   * Stops all active animations.
   */
  static stopAllAnimations(): void {
    for (const animation of this.activeAnimations.values()) {
      animation.kill();
    }
    this.activeAnimations.clear();
  }

  /**
   * Pauses all active animations.
   */
  static pauseAllAnimations(): void {
    for (const animation of this.activeAnimations.values()) {
      animation.pause();
    }
  }

  /**
   * Resumes all paused animations.
   */
  static resumeAllAnimations(): void {
    for (const animation of this.activeAnimations.values()) {
      animation.resume();
    }
  }

  /**
   * Gets the number of active animations.
   *
   * @returns Number of active animations
   */
  static getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Gets all active animation IDs.
   *
   * @returns Array of active animation IDs
   */
  static getActiveAnimationIds(): string[] {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Checks if an object has active animations.
   *
   * @param object - The object to check
   * @returns True if the object has active animations
   */
  static hasActiveAnimations(object: THREE.Object3D): boolean {
    const objectId = object.uuid;
    return Array.from(this.activeAnimations.keys()).some((id) =>
      id.includes(objectId),
    );
  }

  /**
   * Creates a smooth camera orbit animation.
   *
   * @param camera - The camera to animate
   * @param target - The point to orbit around
   * @param radius - Orbit radius
   * @param startAngle - Starting angle in radians
   * @param endAngle - Ending angle in radians
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static createOrbitAnimation(
    camera: THREE.Camera,
    target: THREE.Vector3,
    radius: number,
    startAngle: number = 0,
    endAngle: number = Math.PI * 2,
    config: AnimationConfig = {},
  ): gsap.core.Timeline {
    const animationId = `orbit_${camera.uuid}`;
    this.stopAnimation(animationId);

    const timeline = gsap.timeline({
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    timeline.to(
      {},
      {
        duration: config.duration ?? 10,
        ease: config.ease ?? AnimationEase.Power1InOut,
        delay: config.delay ?? 0,
        repeat: config.repeat ?? 0,
        yoyo: config.yoyo ?? false,
        onUpdate: function () {
          const progress = this.progress();
          const currentAngle = startAngle + (endAngle - startAngle) * progress;

          camera.position.x = target.x + radius * Math.cos(currentAngle);
          camera.position.z = target.z + radius * Math.sin(currentAngle);
          camera.lookAt(target);
        },
      },
    );

    this.activeAnimations.set(animationId, timeline);
    return timeline;
  }

  /**
   * Creates a smooth camera dolly animation (zoom in/out).
   *
   * @param camera - The camera to animate
   * @param target - The point to dolly towards/away from
   * @param startDistance - Starting distance
   * @param endDistance - Ending distance
   * @param config - Animation configuration
   * @returns GSAP tween instance
   */
  static createDollyAnimation(
    camera: THREE.Camera,
    target: THREE.Vector3,
    startDistance: number,
    endDistance: number,
    config: AnimationConfig = {},
  ): gsap.core.Timeline {
    const animationId = `dolly_${camera.uuid}`;
    this.stopAnimation(animationId);

    const timeline = gsap.timeline({
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      onReverseComplete: config.onReverseComplete,
    });

    timeline.to(
      {},
      {
        duration: config.duration ?? 2,
        ease: config.ease ?? AnimationEase.Power2InOut,
        delay: config.delay ?? 0,
        repeat: config.repeat ?? 0,
        yoyo: config.yoyo ?? false,
        onUpdate: function () {
          const progress = this.progress();
          const currentDistance =
            startDistance + (endDistance - startDistance) * progress;

          const direction = camera.position.clone().sub(target).normalize();
          camera.position
            .copy(target)
            .add(direction.multiplyScalar(currentDistance));
          camera.lookAt(target);
        },
      },
    );

    this.activeAnimations.set(animationId, timeline);
    return timeline;
  }

  /**
   * Disposes of all animations and cleans up resources.
   */
  static dispose(): void {
    this.stopAllAnimations();
    this.activeAnimations.clear();
  }
}
