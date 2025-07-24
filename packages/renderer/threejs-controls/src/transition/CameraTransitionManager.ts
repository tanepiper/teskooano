import {
  CustomEvents,
  AU_METERS,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";
import { notificationManager } from "@teskooano/notifications";
import {
  AnimationHelper,
  AnimationEase,
} from "@teskooano/renderer-threejs-helpers";
import { OrbitControlsHandler } from "../orbit/OrbitControlsHandler";
import { StateAccessor } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import { PerspectiveCamera, Vector3 } from "three";

/**
 * Manages smooth, animated camera transitions using GSAP.
 * Handles transitions for camera position, target, or both simultaneously.
 */
export class CameraTransitionManager {
  private camera: PerspectiveCamera;
  private orbitControlsHandler: OrbitControlsHandler;
  private objectFollower: any; // Reference to ObjectFollower

  /** Flag indicating if the camera is currently undergoing a programmatic GSAP animation. */
  private isAnimating: boolean = false;
  /** Stores the active animation during transitions to allow cancellation. */
  private activeAnimation: any = null;
  /** Reusable temporary vector for calculations to avoid allocations. */
  private tempVector = new Vector3();
  /** The ID of the currently active transition notification. */
  private activeTransitionNotificationId: string | null = null;
  /** The camera position on the last update frame, for calculating instantaneous speed. */
  private lastUpdatePosition = new OSVector3().setZero();
  /** The timeline time on the last update frame, for calculating instantaneous speed. */
  private lastUpdateTime: number = 0;

  // --- Transition Configuration ---
  // These properties are now handled by the multi-stage logic
  // in calculateTransitionDuration.

  // Store original damping settings during transition
  private _originalDampingEnabled: boolean = false;
  private _originalDampingFactor: number = 0.05;

  constructor(
    camera: PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
    objectFollower?: any,
  ) {
    this.camera = camera;
    this.orbitControlsHandler = orbitControlsHandler;
    this.objectFollower = objectFollower;
  }

  /**
   * Converts a value from the renderer's internal scene units into Astronomical Units (AU).
   * @param sceneUnits - The value in scene units.
   * @returns The equivalent value in AU.
   */
  private sceneUnitsToAu(sceneUnits: number): number {
    return sceneUnits / (AU_METERS * METERS_TO_SCENE_UNITS);
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

    // Set the following transition flag to prevent ObjectFollower from interfering
    if (this.objectFollower) {
      this.objectFollower.isFollowingTransitioning = true;
    }
  }

  /**
   * Helper to end a camera transition.
   * Restores controls and damping, updates final state, and dispatches completion event.
   */
  private endTransition(
    finalCameraPos: OSVector3,
    finalTargetPos: OSVector3,
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
    this.activeAnimation = null;

    this.camera.position.copy(finalCameraPos.toThreeJS());
    this.orbitControlsHandler.controls.target.copy(finalTargetPos.toThreeJS());

    this.orbitControlsHandler.controls.enableDamping =
      this._originalDampingEnabled;
    this.orbitControlsHandler.controls.dampingFactor =
      this._originalDampingFactor;
    this.orbitControlsHandler.setEnabled(true);
    this.orbitControlsHandler.controls.update();

    // Clear the following transition flag
    if (this.objectFollower) {
      this.objectFollower.isFollowingTransitioning = false;
    }

    const transitionCompleteEvent = new CustomEvent(
      CustomEvents.CAMERA_TRANSITION_COMPLETE,
      {
        detail: {
          position: finalCameraPos.toThreeJS(),
          target: finalTargetPos.toThreeJS(),
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

    if (this.isAnimating && this.activeAnimation) {
      AnimationHelper.stopAnimation(`camera_${this.camera.uuid}`);
      this.activeAnimation = null;
      this.isAnimating = false;
      this.orbitControlsHandler.setEnabled(true);
    }

    // Clear the following transition flag
    if (this.objectFollower) {
      this.objectFollower.isFollowingTransitioning = false;
    }
  }

  /**
   * Smoothly transitions only the camera's target point.
   */
  public transitionTargetTo(
    target: OSVector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this.beginTransition();

    const currentPosition = OSVector3.fromThreeJS(this.camera.position);

    // The "distance" for a target-only transition isn't a straight line,
    // but we can use the main calculator to get a sensible duration.
    // We'll calculate based on an arbitrary "move" to the new target
    // to get a representative distance.
    const duration = this.calculateTransitionDuration(currentPosition, target);

    const onComplete = () => {
      this.endTransition(
        OSVector3.fromThreeJS(this.camera.position),
        target,
        "target-only",
        options?.focusedObjectId,
      );
    };

    this.activeAnimation = AnimationHelper.animateCamera(
      this.camera,
      new Vector3(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ),
      {
        duration: duration,
        ease: AnimationEase.Power3InOut,
        lookAt: new Vector3(target.x, target.y, target.z),
        orbitControls: this.orbitControlsHandler.controls,
        onComplete: onComplete,
      },
    );
  }

  /**
   * Initiates a smooth, sequenced camera transition for both position and target.
   */
  public transitionTo(
    endPos: OSVector3,
    endTarget: OSVector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this.beginTransition();

    const startPos = OSVector3.fromThreeJS(this.camera.position);
    this.lastUpdatePosition.copy(startPos);
    this.lastUpdateTime = 0;
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

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
        ? cameraForward.angleTo(targetDirection.toThreeJS())
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

    // Use AnimationHelper for smooth camera transition
    this.activeAnimation = AnimationHelper.animateCamera(
      this.camera,
      new Vector3(endPos.x, endPos.y, endPos.z),
      {
        duration: totalDuration,
        ease: AnimationEase.Power3InOut,
        lookAt: new Vector3(endTarget.x, endTarget.y, endTarget.z),
        orbitControls: this.orbitControlsHandler.controls,
        onComplete: onTimelineComplete,
        onUpdate: () => {
          if (!this.activeTransitionNotificationId) return;

          const currentPosition = OSVector3.fromThreeJS(this.camera.position);
          const remainingDistance = currentPosition.distanceTo(endPos);
          const remainingDistanceAU = this.sceneUnitsToAu(remainingDistance);

          notificationManager.updateNotification(
            this.activeTransitionNotificationId,
            {
              message: `
              Target: <strong>${targetName}</strong><br/>
              Remaining: <strong>${remainingDistanceAU.toFixed(2)} AU</strong>
            `,
            },
          );
        },
      },
    );
  }

  /**
   * Initiates a two-stage camera transition: first turn to face the target, then move to position.
   */
  public transitionToWithLookAtFirst(
    endPos: OSVector3,
    endTarget: OSVector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this.beginTransition();

    const startPos = OSVector3.fromThreeJS(this.camera.position);
    this.lastUpdatePosition.copy(startPos);
    this.lastUpdateTime = 0;
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    let targetName = "Position";
    if (options?.focusedObjectId) {
      const targetObject = StateAccessor.getRenderableObject(
        options.focusedObjectId,
      );
      if (targetObject) {
        targetName = targetObject.name;
      }
    }

    // Create the notification
    const notification = notificationManager.addNotification({
      title: `Moving to ${targetName}`,
      message: `Calculating route to ${targetName}...`,
      level: "info",
      source: "CameraManager",
    });
    this.activeTransitionNotificationId = notification.id;

    // At the start of transitionToWithLookAtFirst:
    this.lastUpdatePosition.copy(OSVector3.fromThreeJS(this.camera.position));
    this.lastUpdateTime = 0;
    let activeTimeline: any = null;

    const timelineUpdateCallback = (title: string) => {
      if (!activeTimeline || !this.activeTransitionNotificationId) return;

      const currentPosition = OSVector3.fromThreeJS(this.camera.position);
      const currentTime = activeTimeline.time();

      const deltaTime = currentTime - this.lastUpdateTime;
      const deltaDistance = currentPosition.distanceTo(this.lastUpdatePosition);

      // Calculate instantaneous speed based on frame-to-frame changes
      const speed = deltaTime > 0 ? deltaDistance / deltaTime : 0;
      const speedInAU = this.sceneUnitsToAu(speed);

      // Update state for the next frame's calculation
      this.lastUpdatePosition.copy(currentPosition);
      this.lastUpdateTime = currentTime;

      const remainingDistance = currentPosition.distanceTo(endPos);
      const remainingDistanceAU = this.sceneUnitsToAu(remainingDistance);
      const remainingTime = activeTimeline.duration() - currentTime;

      notificationManager.updateNotification(
        this.activeTransitionNotificationId,
        {
          title,
          message: `
          Target: <strong>${targetName}</strong><br/>
          Speed: <strong>${speedInAU.toFixed(2)} AU/s</strong><br/>
          Remaining: <strong>${remainingDistanceAU.toFixed(2)} AU</strong><br/>
          ETA: <strong>${remainingTime.toFixed(1)}s</strong>
        `,
        },
      );
    };

    const onTimelineComplete = () => {
      this.endTransition(
        endPos,
        endTarget,
        "position-and-target",
        options?.focusedObjectId,
      );
    };

    // Stage 1: Turn to face the target (0.3 of total duration)
    const turnDuration = totalDuration * 0.3;
    const moveDuration = totalDuration * 0.7;

    // First, turn the camera to face the target
    this.activeAnimation = AnimationHelper.animateCamera(
      this.camera,
      new Vector3(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ), // Stay in same position
      {
        duration: turnDuration,
        ease: AnimationEase.Power2InOut,
        lookAt: new Vector3(endTarget.x, endTarget.y, endTarget.z),
        orbitControls: this.orbitControlsHandler.controls,
        onUpdate: () => {
          activeTimeline = this.activeAnimation;
          timelineUpdateCallback("Turning to");
        },
        onComplete: () => {
          // Stage 2: Move to the final position while maintaining the look-at
          this.activeAnimation = AnimationHelper.animateCamera(
            this.camera,
            new Vector3(endPos.x, endPos.y, endPos.z),
            {
              duration: moveDuration,
              ease: AnimationEase.Power3InOut,
              lookAt: new Vector3(endTarget.x, endTarget.y, endTarget.z),
              orbitControls: this.orbitControlsHandler.controls,
              onUpdate: () => {
                activeTimeline = this.activeAnimation;
                timelineUpdateCallback("Moving to");
              },
              onComplete: onTimelineComplete,
            },
          );
        },
      },
    );
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
    startPos: OSVector3,
    endPos: OSVector3,
  ): number {
    // --- Dynamic Transition Duration Calculation ---

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

    const distanceInAU = this.sceneUnitsToAu(distance);

    const calculatedDuration =
      BASE_DURATION_FACTOR * Math.pow(distanceInAU, DISTANCE_EXPONENT);

    // Clamp the duration between the defined min and max values.
    return Math.max(
      MIN_DURATION_S,
      Math.min(MAX_DURATION_S, calculatedDuration),
    );
  }

  /**
   * Cleans up any active animations.
   */
  public dispose(): void {
    this.cancelTransition();
    AnimationHelper.stopObjectAnimations(this.camera);
  }
}
