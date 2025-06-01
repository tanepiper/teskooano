import * as THREE from "three";
import gsap from "gsap";
import { CustomEvents } from "@teskooano/data-types";
import { OrbitControlsHandler } from "./OrbitControlsHandler";

export class CameraTransitionManager {
  private camera: THREE.PerspectiveCamera;
  private orbitControlsHandler: OrbitControlsHandler;
  private isProgrammaticTransitioning: boolean = false;
  private activeTimeline: gsap.core.Timeline | null = null;
  private timelineCancelledPrematurely: boolean = false;

  // Transition parameters (can be made configurable)
  private transitionDistanceFactor: number = 0.5;
  private minTransitionDuration: number = 5.0;
  private maxTransitionDuration: number = 10.0;

  constructor(
    camera: THREE.PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
  ) {
    this.camera = camera;
    this.orbitControlsHandler = orbitControlsHandler;
  }

  public getIsTransitioning(): boolean {
    return this.isProgrammaticTransitioning;
  }

  private _beginTransition(): void {
    this.cancelTransition(); // Ensure any existing transition is stopped
    // Damping is now managed by OrbitControlsHandler, but we still need to disable controls
    this.orbitControlsHandler.setEnabled(false);
    this.isProgrammaticTransitioning = true;
    this.timelineCancelledPrematurely = false; // Reset for the new transition
  }

  private _endTransition(
    finalCameraPos: THREE.Vector3,
    finalTargetPos: THREE.Vector3,
    type: "target-only" | "position-and-target" | "orientation-only",
    focusedObjectId?: string | null,
    followedObjectId?: string | null,
    transitionType?: string | null,
  ): void {
    const wasCancelled = this.timelineCancelledPrematurely;

    this.isProgrammaticTransitioning = false;
    this.activeTimeline = null; // Clear the active timeline

    // Ensure camera and target are at their final state
    this.camera.position.copy(finalCameraPos);
    this.orbitControlsHandler.controls.target.copy(finalTargetPos);

    // Re-enable controls and restore damping (OrbitControlsHandler will do this)
    this.orbitControlsHandler.setEnabled(true);
    // OrbitControlsHandler.controls.enableDamping = this.orbitControlsHandler.originalDampingEnabled;
    // OrbitControlsHandler.controls.dampingFactor = this.orbitControlsHandler.originalDampingFactor;
    this.orbitControlsHandler.controls.update(); // Crucial to apply target changes

    this.timelineCancelledPrematurely = false; // Reset flag for next operations

    if (wasCancelled) {
      console.log(
        "[CameraTransitionManager] Transition was cancelled, not dispatching COMPLETE event.",
      );
      return;
    }

    const transitionCompleteEvent = new CustomEvent(
      CustomEvents.CAMERA_TRANSITION_COMPLETE,
      {
        detail: {
          position: finalCameraPos.clone(),
          target: finalTargetPos.clone(),
          type: type,
          metadata: {
            focusedObjectId: focusedObjectId,
            followedObjectId: followedObjectId,
            transitionType: transitionType,
          },
        },
        bubbles: true,
        composed: true,
      },
    );
    // Dispatch on a global object or the renderer element
    this.orbitControlsHandler
      .getRendererElement()
      .dispatchEvent(transitionCompleteEvent);
  }

  public cancelTransition(): void {
    if (this.isProgrammaticTransitioning && this.activeTimeline) {
      this.timelineCancelledPrematurely = true;
      this.activeTimeline.kill();
      this.activeTimeline = null;
      this.isProgrammaticTransitioning = false;
      this.orbitControlsHandler.setEnabled(true); // Re-enable controls
      // Damping restoration handled by OrbitControlsHandler or main manager on setEnabled
      console.log(
        "[CameraTransitionManager] Transition cancelled, controls re-enabled.",
      );
    }
  }

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

  public transitionTargetTo(
    target: THREE.Vector3,
    withTransition: boolean = true,
    options?: {
      focusedObjectId?: string | null;
      followedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    if (!withTransition) {
      this.cancelTransition();
      this.orbitControlsHandler.controls.target.copy(target);
      this.orbitControlsHandler.controls.update();
      this._endTransition(
        this.camera.position.clone(),
        target,
        "target-only",
        options?.focusedObjectId,
        options?.followedObjectId,
        options?.transitionType,
      );
      return;
    }

    this._beginTransition();

    const currentTarget = this.orbitControlsHandler.controls.target.clone();
    const currentPosition = this.camera.position.clone();

    // Duration calculation based on angular distance
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
      this._endTransition(
        this.camera.position.clone(), // Position doesn't change
        target, // Final target position
        "target-only",
        options?.focusedObjectId,
        options?.followedObjectId,
        options?.transitionType,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete });
    this.activeTimeline.to(this.orbitControlsHandler.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: "power1.inOut",
      onUpdate: () => {
        // OrbitControls will look at its target, but camera.lookAt might be needed
        // if the controls target update isn't sufficient during the animation.
        // For target-only, this.camera.lookAt(this.orbitControlsHandler.controls.target) ensures it.
        this.camera.lookAt(this.orbitControlsHandler.controls.target);
      },
    });
  }

  public transitionOrientationTo(
    lookAtPoint: THREE.Vector3,
    options?: {
      focusedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    this._beginTransition();

    const currentPosition = this.camera.position.clone();
    const startQuaternion = this.camera.quaternion.clone();

    const tempCam = this.camera.clone();
    tempCam.lookAt(lookAtPoint);
    const endQuaternion = tempCam.quaternion.clone();

    const angularDistance = startQuaternion.angleTo(endQuaternion);
    let duration =
      this.minTransitionDuration * 0.5 +
      (angularDistance / Math.PI) *
        (this.maxTransitionDuration * 0.5 - this.minTransitionDuration * 0.5);
    duration = Math.max(duration, this.minTransitionDuration * 0.3);
    duration = Math.min(duration, this.maxTransitionDuration * 0.7);

    const onComplete = () => {
      this._endTransition(
        currentPosition, // Camera position unchanged
        lookAtPoint.clone(), // The effective target for the event
        "orientation-only",
        options?.focusedObjectId,
        null, // No followed object in orientation change
        options?.transitionType ?? "orientation",
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete });
    this.activeTimeline.to(this.camera.quaternion, {
      x: endQuaternion.x,
      y: endQuaternion.y,
      z: endQuaternion.z,
      w: endQuaternion.w,
      duration: duration,
      ease: "power1.inOut",
      // onUpdate: () => { this.orbitControlsHandler.controls.update(); } // May not be needed as target isn't changing
    });
  }

  public transitionTo(
    startPos: THREE.Vector3, // Current camera position
    startTarget: THREE.Vector3, // Current controls target
    endPos: THREE.Vector3, // Desired camera position
    endTarget: THREE.Vector3, // Desired controls target
    options?: {
      focusedObjectId?: string | null;
      followedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    this._beginTransition();

    const totalDuration = this.calculateTransitionDuration(startPos, endPos);
    const rotationPercent = 0.4; // Configurable: how much of duration for target change
    const rotationDuration = totalDuration * rotationPercent;
    const positionDuration = totalDuration * (1.0 - rotationPercent);

    const onTimelineComplete = () => {
      this._endTransition(
        endPos,
        endTarget,
        "position-and-target",
        options?.focusedObjectId,
        options?.followedObjectId,
        options?.transitionType,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    // Animate target first (or concurrently if desired)
    if (rotationDuration > 0.01 && !startTarget.equals(endTarget)) {
      this.activeTimeline.to(this.orbitControlsHandler.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power2.inOut",
        onUpdate: () => {
          // this.orbitControlsHandler.controls.update(); // OrbitControls updates its target
          // If camera needs to actively lookAt the interpolating target:
          this.camera.lookAt(this.orbitControlsHandler.controls.target);
        },
      });
    }

    // Animate position
    if (positionDuration > 0.01 && !startPos.equals(endPos)) {
      this.activeTimeline.to(
        this.camera.position,
        {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: positionDuration,
          ease: "expo.out",
          onUpdate: () => {
            // If target is also animating, camera should continue to look at it
            if (rotationDuration > 0.01 && !startTarget.equals(endTarget)) {
              this.camera.lookAt(this.orbitControlsHandler.controls.target);
            }
          },
        },
        rotationDuration > 0.01 && !startTarget.equals(endTarget) ? ">" : 0, // Start after target anim, or at start if no target anim
      );
    }

    // If durations are too short, jump to end and complete
    if (rotationDuration <= 0.01 && positionDuration <= 0.01) {
      console.warn(
        "[CameraTransitionManager] Transition duration too short for both target and position, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.orbitControlsHandler.controls.target.copy(endTarget);
      // Ensure onTimelineComplete is called to properly end the transition state
      if (this.activeTimeline) {
        this.activeTimeline.kill(); // Kill current timeline
        onTimelineComplete(); // Manually call complete if timeline was too short to run
      } else {
        // Fallback if timeline wasn't even created (should not happen with current logic)
        this._endTransition(
          endPos,
          endTarget,
          "position-and-target",
          options?.focusedObjectId,
          options?.followedObjectId,
          options?.transitionType,
        );
      }
    }
  }

  public dispose(): void {
    this.cancelTransition(); // Ensures any active GSAP tweens are killed
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.camera.quaternion); // Also kill quaternion tweens
    if (this.orbitControlsHandler && this.orbitControlsHandler.controls) {
      gsap.killTweensOf(this.orbitControlsHandler.controls.target);
    }
  }
}
