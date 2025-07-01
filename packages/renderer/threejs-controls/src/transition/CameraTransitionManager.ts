import { CustomEvents } from "@teskooano/data-types";
import { notificationManager } from "@teskooano/notifications";
import gsap from "gsap";
import * as THREE from "three";
import { OrbitControlsHandler } from "../orbit/OrbitControlsHandler";
import { StateAccessor } from "@teskooano/core-state";

/**
 * Manages smooth, animated camera transitions using GSAP.
 * Handles transitions for camera position, target, or both simultaneously.
 */
export class CameraTransitionManager {
  private camera: THREE.PerspectiveCamera;
  private orbitControlsHandler: OrbitControlsHandler;

  /** Flag indicating if the camera is currently undergoing a programmatic GSAP animation. */
  private isAnimating: boolean = false;
  /** Stores the active GSAP timeline during transitions to allow cancellation. */
  private activeTimeline: gsap.core.Timeline | null = null;
  /** Reusable temporary vector for calculations to avoid allocations. */
  private tempVector = new THREE.Vector3();
  /** The ID of the currently active transition notification. */
  private activeTransitionNotificationId: string | null = null;
  /** The camera position on the last update frame, for calculating instantaneous speed. */
  private lastUpdatePosition = new THREE.Vector3();
  /** The timeline time on the last update frame, for calculating instantaneous speed. */
  private lastUpdateTime: number = 0;

  // --- Transition Configuration ---
  // These properties are now handled by the multi-stage logic
  // in calculateTransitionDuration.

  // Store original damping settings during transition
  private _originalDampingEnabled: boolean = false;
  private _originalDampingFactor: number = 0.05;

  constructor(
    camera: THREE.PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
  ) {
    this.camera = camera;
    this.orbitControlsHandler = orbitControlsHandler;
  }

  /**
   * Returns whether the camera is currently undergoing an animated transition.
   */
  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Helper to begin a camera transition.
   * Cancels existing transitions, disables controls, and stores original damping.
   */
  private beginTransition(): void {
    // Clear any previous transition notification immediately
    if (this.activeTransitionNotificationId) {
      notificationManager.removeNotification(
        this.activeTransitionNotificationId,
      );
      this.activeTransitionNotificationId = null;
    }

    this.cancelTransition();
    this._originalDampingEnabled =
      this.orbitControlsHandler.controls.enableDamping;
    this._originalDampingFactor =
      this.orbitControlsHandler.controls.dampingFactor;
    this.orbitControlsHandler.controls.enableDamping = false;
    this.orbitControlsHandler.setEnabled(false);
    this.isAnimating = true;
  }

  /**
   * Helper to end a camera transition.
   * Restores controls and damping, updates final state, and dispatches completion event.
   */
  private endTransition(
    finalCameraPos: THREE.Vector3,
    finalTargetPos: THREE.Vector3,
    type: "target-only" | "position-and-target",
    focusedObjectId?: string | null,
  ): void {
    // Clear the transition notification upon arrival
    if (this.activeTransitionNotificationId) {
      notificationManager.removeNotification(
        this.activeTransitionNotificationId,
      );
      this.activeTransitionNotificationId = null;
    }

    this.isAnimating = false;
    this.activeTimeline = null;

    this.camera.position.copy(finalCameraPos);
    this.orbitControlsHandler.controls.target.copy(finalTargetPos);

    this.orbitControlsHandler.controls.enableDamping =
      this._originalDampingEnabled;
    this.orbitControlsHandler.controls.dampingFactor =
      this._originalDampingFactor;
    this.orbitControlsHandler.setEnabled(true);
    this.orbitControlsHandler.controls.update();

    const transitionCompleteEvent = new CustomEvent(
      CustomEvents.CAMERA_TRANSITION_COMPLETE,
      {
        detail: {
          position: finalCameraPos.clone(),
          target: finalTargetPos.clone(),
          type: type,
          focusedObjectId: focusedObjectId,
        },
        bubbles: true,
        composed: true,
      },
    );
    document.dispatchEvent(transitionCompleteEvent);
  }

  /**
   * Immediately cancels any ongoing camera transition animation.
   * Re-enables user controls.
   */
  public cancelTransition(): void {
    // Clear the transition notification on cancellation
    if (this.activeTransitionNotificationId) {
      notificationManager.removeNotification(
        this.activeTransitionNotificationId,
      );
      this.activeTransitionNotificationId = null;
    }

    if (this.isAnimating && this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
      this.isAnimating = false;
      this.orbitControlsHandler.setEnabled(true);
    }
  }

  /**
   * Smoothly transitions only the camera's target point.
   */
  public transitionTargetTo(
    target: THREE.Vector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this.beginTransition();

    const currentPosition = this.camera.position.clone();

    // The "distance" for a target-only transition isn't a straight line,
    // but we can use the main calculator to get a sensible duration.
    // We'll calculate based on an arbitrary "move" to the new target
    // to get a representative distance.
    const duration = this.calculateTransitionDuration(currentPosition, target);

    const onComplete = () => {
      this.endTransition(
        this.camera.position.clone(),
        target,
        "target-only",
        options?.focusedObjectId,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete: onComplete });

    this.activeTimeline.to(this.orbitControlsHandler.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: "power3.inOut",
      onUpdate: () => {
        this.camera.lookAt(this.orbitControlsHandler.controls.target);
      },
    });
  }

  /**
   * Initiates a smooth, sequenced camera transition for both position and target.
   */
  public transitionTo(
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this.beginTransition();

    const startPos = this.camera.position.clone();
    this.lastUpdatePosition.copy(startPos);
    this.lastUpdateTime = 0;
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);
    const AU = 15; // Approximate scene units per AU (adjusted for new scale)

    let targetName = "Position";
    if (options?.focusedObjectId) {
      const targetObject = StateAccessor.getRenderableObject(
        options.focusedObjectId,
      );
      if (targetObject) {
        targetName = targetObject.name;
      }
    }

    // Create the notification but don't set a duration, as we'll manage it manually.
    const notification = notificationManager.addNotification({
      title: `Moving to ${targetName}`,
      message: `Calculating route to ${targetName}...`,
      level: "info",
      source: "CameraManager",
    });
    this.activeTransitionNotificationId = notification.id;

    const cameraForward = this.camera
      .getWorldDirection(this.tempVector.clone())
      .negate();
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;
    const rotationPercent = 0.2;

    const rotationDuration = totalDuration * rotationPercent;
    const positionDuration = totalDuration * (1.0 - rotationPercent);

    const onTimelineComplete = () => {
      this.endTransition(
        endPos,
        endTarget,
        "position-and-target",
        options?.focusedObjectId,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    const timelineUpdateCallback = () => {
      if (!this.activeTimeline || !this.activeTransitionNotificationId) return;

      const currentPosition = this.camera.position;
      const currentTime = this.activeTimeline.time();

      const deltaTime = currentTime - this.lastUpdateTime;
      const deltaDistance = currentPosition.distanceTo(this.lastUpdatePosition);

      // Calculate instantaneous speed based on frame-to-frame changes
      const speed = deltaTime > 0 ? deltaDistance / deltaTime : 0;
      const speedInAU = speed / AU / 10;

      // Update state for the next frame's calculation
      this.lastUpdatePosition.copy(currentPosition);
      this.lastUpdateTime = currentTime;

      const remainingDistance = currentPosition.distanceTo(endPos);
      const remainingDistanceAU = remainingDistance / AU / 10;
      const remainingTime = this.activeTimeline.duration() - currentTime;

      notificationManager.updateNotification(
        this.activeTransitionNotificationId,
        {
          message: `
          Target: <strong>${targetName}</strong><br/>
          Speed: <strong>${speedInAU.toFixed(2)} AU/s</strong><br/>
          Remaining: <strong>${remainingDistanceAU.toFixed(2)} AU</strong><br/>
          ETA: <strong>${remainingTime.toFixed(1)}s</strong>
        `,
        },
      );
    };

    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.orbitControlsHandler.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power3.inOut",
        onUpdate: () => {
          this.orbitControlsHandler.controls.update();
          timelineUpdateCallback(); // Update during rotation phase
        },
      });
    }

    if (positionDuration > 0.01) {
      this.activeTimeline.to(
        this.camera.position,
        {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: positionDuration,
          ease: "power4.inOut",
          onUpdate: () => {
            this.orbitControlsHandler.controls.update();
            timelineUpdateCallback(); // Update during position phase
          },
        },
        rotationDuration > 0.01 ? ">" : 0,
      );
    } else if (rotationDuration <= 0.01) {
      console.warn(
        "[CameraTransitionManager] Transition duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.orbitControlsHandler.controls.target.copy(endTarget);
      onTimelineComplete();
    }
  }

  /**
   * Calculates transition duration based on a power curve of the distance.
   * This provides a non-linear duration where travel time increases with
   * distance, but at a decreasing rate, making long journeys feasible.
   *
   * The formula is `duration = factor * (distanceInAU ^ exponent)`, clamped
   * between a minimum and maximum duration.
   *
   * @param startPos The starting position of the transition.
   * @param endPos The ending position of the transition.
   * @returns The calculated duration in seconds.
   */
  public calculateTransitionDuration(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
  ): number {
    // --- Dynamic Transition Duration Calculation ---
    const AU = 15; // Approximate scene units per Astronomical Unit (adjusted for new scale)

    // --- Tuning Parameters for the duration curve ---
    // The base duration for a 1 AU trip.
    const BASE_DURATION_FACTOR = 3.0;
    // The exponent controls the curve's shape. < 1 means diminishing returns.
    // 0.5 is a square root curve. 0.4 is a bit steeper.
    const DISTANCE_EXPONENT = 0.4;
    // The absolute minimum duration for any transition, in seconds.
    const MIN_DURATION_S = 1.5;
    // The absolute maximum duration for any transition, in seconds.
    const MAX_DURATION_S = 30.0;

    const distance = startPos.distanceTo(endPos);

    // Don't start a transition for a zero-distance move.
    if (distance < 0.001) {
      return 0;
    }

    const distanceInAU = distance / AU;

    const calculatedDuration =
      BASE_DURATION_FACTOR * Math.pow(distanceInAU, DISTANCE_EXPONENT);

    // Clamp the duration between the defined min and max values.
    return Math.max(
      MIN_DURATION_S,
      Math.min(MAX_DURATION_S, calculatedDuration),
    );
  }

  /**
   * Cleans up any active GSAP animations.
   */
  public dispose(): void {
    this.cancelTransition();
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.orbitControlsHandler.controls.target);
  }
}
