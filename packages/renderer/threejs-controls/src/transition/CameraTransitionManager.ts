import { CustomEvents } from "@teskooano/data-types";
import gsap from "gsap";
import * as THREE from "three";
import { OrbitControlsHandler } from "../orbit/OrbitControlsHandler";

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

  // --- Transition Configuration ---
  private transitionDistanceFactor: number = 0.5;
  private minTransitionDuration: number = 5.0;
  private maxTransitionDuration: number = 10.0;

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

    const currentTarget = this.orbitControlsHandler.controls.target.clone();
    const currentPosition = this.camera.position.clone();

    const oldTargetDirection = currentTarget
      .clone()
      .sub(currentPosition)
      .normalize();
    const newTargetDirection = target.clone().sub(currentPosition).normalize();
    const angularDistance = oldTargetDirection.angleTo(newTargetDirection);

    let duration =
      this.minTransitionDuration +
      (angularDistance / Math.PI) *
        (this.maxTransitionDuration - this.minTransitionDuration);
    duration = Math.min(
      Math.max(duration, this.minTransitionDuration),
      this.maxTransitionDuration,
    );

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
      ease: "power1.inOut",
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
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    const cameraForward = this.camera
      .getWorldDirection(this.tempVector.clone())
      .negate();
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;
    const rotationPercent = 0.4;

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

    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.orbitControlsHandler.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power2.inOut",
        onUpdate: () => {
          this.orbitControlsHandler.controls.update();
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
          ease: "expo.out",
          onUpdate: () => {
            this.orbitControlsHandler.controls.update();
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
   * Calculates transition duration based on distance.
   */
  private calculateTransitionDuration(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
  ): number {
    const distance = startPos.distanceTo(endPos);

    let duration = this.minTransitionDuration;
    if (distance > 0) {
      duration += Math.min(
        this.transitionDistanceFactor * Math.log10(1 + distance),
        this.maxTransitionDuration - this.minTransitionDuration,
      );
    }

    return Math.min(duration, this.maxTransitionDuration);
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
