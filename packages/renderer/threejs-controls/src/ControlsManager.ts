import { OSVector3 } from "@teskooano/core-math";
import { CustomEvents } from "@teskooano/data-types";
import gsap from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Manages camera controls (OrbitControls or FlyControls) and user interaction
 * within a Three.js scene. Handles smooth camera transitions between targets,
 * following moving objects, and synchronizing camera state with the global simulation state.
 *
 * @class ControlsManager
 * @param {THREE.PerspectiveCamera} camera - The camera instance to control.
 * @param {HTMLElement} domElement - The DOM element to attach event listeners to.
 */
export class ControlsManager {
  /** The underlying OrbitControls instance. */
  public controls: OrbitControls;
  /** The camera being controlled. */
  private camera: THREE.PerspectiveCamera;
  /** Flag indicating if the camera is currently undergoing a user- or programmatically-driven transition. */
  private isTransitioning: boolean = false;
  /** Flag indicating if the camera is currently undergoing a programmatic GSAP animation. */
  private isAnimating: boolean = false;
  /** Factor controlling how much distance affects transition duration (logarithmic scaling). */
  private transitionDistanceFactor: number = 0.5;
  /** Minimum duration for camera transitions in seconds. */
  private minTransitionDuration: number = 5.0;
  /** Maximum duration for camera transitions in seconds. */
  private maxTransitionDuration: number = 10.0;
  /** Stores the active GSAP timeline during transitions to allow cancellation. */
  private activeTimeline: gsap.core.Timeline | null = null;
  /** Reusable temporary vector for calculations to avoid allocations. */
  private tempVector = new THREE.Vector3();
  /** The THREE.Object3D instance the camera is currently following, or null. */
  private followingTargetObject: THREE.Object3D | null = null;
  /** The offset to maintain from the followed object's world position relative to the object itself. */
  private followOffset: THREE.Vector3 = new THREE.Vector3();
  /** Reusable vector to store the target object's world position. */
  private tempTargetPosition = new THREE.Vector3();
  /** Stores the world position of the followed object from the previous frame for delta calculations. */
  private previousFollowTargetPos = new THREE.Vector3();
  /** Stores the calculated camera offset relative to the target at the end of a transition. (Currently unused in update loop but kept for reference). */
  /** Tracks whether debug/fly controls are active. */
  private isDebugModeActive: boolean = false;
  /** Stores the last OrbitControls target before switching to debug mode. */
  private lastOrbitTarget: THREE.Vector3 = new THREE.Vector3();
  /** Clock for FlyControls delta calculation. */
  private clock = new THREE.Clock();

  // Store original damping settings during transition
  private _originalDampingEnabled: boolean = false;
  private _originalDampingFactor: number = 0.05;

  private lastCameraPosition = new THREE.Vector3();
  private lastCameraTarget = new THREE.Vector3();
  private changeThreshold = 0.001; // Minimum change to trigger state update
  private rendererElement: HTMLElement;

  /**
   * Creates an instance of ControlsManager.
   * @param {THREE.PerspectiveCamera} camera The camera to control.
   * @param {HTMLElement} domElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement) {
    this.camera = camera;
    this.rendererElement = rendererElement;
    this.controls = new OrbitControls(camera, rendererElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1e7; // Adjust as needed
    this.controls.maxPolarAngle = Math.PI; // Allow looking from underneath

    this.controls.addEventListener("start", this.onControlsStart);
    this.controls.addEventListener("end", this.onControlsEnd);
  }

  private onControlsStart = () => {
    this.isTransitioning = true; // User interaction is a type of transition
  };

  private onControlsEnd = () => {
    this.isTransitioning = false;
    const event = new CustomEvent(CustomEvents.USER_CAMERA_MANIPULATION, {
      detail: {
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
      },
      bubbles: true,
      composed: true,
    });
    this.rendererElement.dispatchEvent(event);
  };

  /**
   * Returns whether the camera is currently undergoing an animated transition.
   * @readonly
   * @type {boolean}
   */
  get getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Helper to begin a camera transition.
   * Cancels existing transitions, disables controls, and stores original damping.
   */
  private _beginTransition(): void {
    this.cancelTransition();
    this._originalDampingEnabled = this.controls.enableDamping;
    this._originalDampingFactor = this.controls.dampingFactor;
    this.controls.enableDamping = false;
    this.setEnabled(false);
    this.isTransitioning = true;
    this.isAnimating = true;
  }

  /**
   * Helper to end a camera transition.
   * Restores controls and damping, updates final state, and dispatches completion event.
   */
  private _endTransition(
    finalCameraPos: THREE.Vector3,
    finalTargetPos: THREE.Vector3,
    type: "target-only" | "position-and-target",
    focusedObjectId?: string | null,
  ): void {
    this.isTransitioning = false;
    this.isAnimating = false;
    this.activeTimeline = null;

    this.camera.position.copy(finalCameraPos);
    this.controls.target.copy(finalTargetPos);

    if (this.followingTargetObject) {
      this.followingTargetObject.getWorldPosition(this.previousFollowTargetPos);
    }

    this.controls.enableDamping = this._originalDampingEnabled;
    this.controls.dampingFactor = this._originalDampingFactor;
    this.setEnabled(true); // Re-enable controls AFTER setting final position/target
    this.controls.update(); // Ensure controls are internally consistent

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
   * Smoothly transitions only the camera's target point (what it's looking at).
   * The camera's position remains unchanged.
   *
   * @param {THREE.Vector3} target The new target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   * @param {object} [options] Optional parameters.
   * @param {string|null} [options.focusedObjectId] The ID of the object being focused on, to include in completion event.
   */
  public transitionTargetTo(
    target: THREE.Vector3,
    withTransition: boolean = true,
    options?: { focusedObjectId?: string | null },
  ): void {
    if (!withTransition) {
      this.cancelTransition(); // Still cancel if one was in progress
      this.controls.target.set(target.x, target.y, target.z);
      this.controls.update();
      // No event dispatch for non-transitioned set
      return;
    }

    this._beginTransition();

    const currentTarget = this.controls.target.clone(); // Current look-at point
    const currentPosition = this.camera.position.clone(); // Camera's current position

    // A simpler duration: based on angular distance the target moves from camera's POV
    const oldTargetDirection = currentTarget
      .clone()
      .sub(currentPosition)
      .normalize();
    const newTargetDirection = target.clone().sub(currentPosition).normalize();
    const angularDistance = oldTargetDirection.angleTo(newTargetDirection); // Radians

    // Let's use a simpler duration calculation based on angular distance
    // Map PI radians (180 degrees) to maxTransitionDuration/2 or similar
    let duration =
      this.minTransitionDuration +
      (angularDistance / Math.PI) *
        (this.maxTransitionDuration - this.minTransitionDuration);
    duration = Math.min(
      Math.max(duration, this.minTransitionDuration),
      this.maxTransitionDuration,
    );

    const onComplete = () => {
      // Final state is set by _endTransition
      this._endTransition(
        this.camera.position.clone(), // Camera position doesn't change
        target, // New target position
        "target-only",
        options?.focusedObjectId,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete: onComplete });

    this.activeTimeline.to(this.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: "power1.inOut",
      onUpdate: () => {
        this.camera.lookAt(this.controls.target);
        // this.controls.update(); // OrbitControls might fight with GSAP if target is updated directly
      },
    });
  }

  /**
   * Initiates a smooth, sequenced camera transition for both position and target using GSAP.
   *
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} startTarget The starting target position.
   * @param {THREE.Vector3} endPos The desired final camera position.
   * @param {THREE.Vector3} endTarget The desired final target position.
   * @param {object} [options] Optional parameters.
   * @param {string|null} [options.focusedObjectId] The ID of the object being focused on, to include in completion event.
   */
  public transitionTo(
    startPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
    options?: { focusedObjectId?: string | null },
  ): void {
    this._beginTransition();

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
      this._endTransition(
        endPos,
        endTarget,
        "position-and-target",
        options?.focusedObjectId,
      );
    };

    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power2.inOut",
        onUpdate: () => {
          this.controls.update();
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
            this.controls.update();
          },
        },
        rotationDuration > 0.01 ? ">" : 0,
      );
    } else if (rotationDuration <= 0.01) {
      console.warn(
        "[ControlsManager] Transition duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      onTimelineComplete();
    }
  }

  /**
   * Public wrapper to move camera and target, using transitionTo internally.
   * Kept for compatibility but `transitionTo` is preferred for new direct calls with start/end params.
   *
   * @param {THREE.Vector3} position The desired final camera position.
   * @param {THREE.Vector3} target The desired final target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   * @param {object} [options] Optional parameters.
   * @param {string|null} [options.focusedObjectId] The ID of the object being focused on, to include in completion event.
   */
  public moveToPosition(
    position: THREE.Vector3,
    target: THREE.Vector3,
    withTransition: boolean = true,
    options?: { focusedObjectId?: string | null },
  ): void {
    if (!withTransition) {
      this.cancelTransition();
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();

      if (this.followingTargetObject) {
        this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

        const desiredCameraPosition = this.tempTargetPosition
          .clone()
          .add(this.followOffset);
        this.camera.position.copy(desiredCameraPosition);
        this.controls.target.copy(this.tempTargetPosition);
        this.controls.update();
        this.previousFollowTargetPos.copy(this.tempTargetPosition);
      } else {
        this.controls.update();
      }
      return;
    }

    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    this.transitionTo(
      currentPosition,
      currentTarget,
      position,
      target,
      options,
    );
  }

  /**
   * Calculates the duration for a camera transition based on the distance between
   * the start and end camera positions. Uses a logarithmic scale to prevent
   * excessively long transitions for large distances.
   *
   * @private
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} endPos The ending camera position.
   * @returns {number} The calculated transition duration in seconds.
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
   * Updates the controls state. This should be called every frame in the render loop.
   * Handles applying damping, processing user input, and updating camera/target
   * positions when following an object.
   */
  update(delta: number): void {
    if (this.followingTargetObject && !this.isAnimating) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);
      const targetDelta = this.tempTargetPosition
        .clone()
        .sub(this.previousFollowTargetPos);

      this.camera.position.add(targetDelta);
      this.controls.target.add(targetDelta);

      this.previousFollowTargetPos.copy(this.tempTargetPosition);
    }

    if (this.controls.enabled) {
      this.controls.update(delta);
    }
  }

  /**
   * Enables or disables the currently active camera controls.
   * @param {boolean} enabled - Whether to enable the active controls.
   */
  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * Cleans up resources used by the ControlsManager, including OrbitControls
   * and any active GSAP animations.
   */
  dispose(): void {
    this.cancelTransition();
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    this.controls.dispose();
  }

  /**
   * Public method to immediately cancel any ongoing camera transition animation.
   * Re-enables user controls.
   */
  public cancelTransition(): void {
    if (this.isAnimating && this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
      this.isTransitioning = false;
      this.isAnimating = false;
      this.setEnabled(true);
    }
  }

  /**
   * Sets a target THREE.Object3D for the camera to follow, and the relative offset.
   * The actual transition to the initial follow position should be handled by `transitionTo`.
   *
   * @param {THREE.Object3D | null} object The object to follow, or null to stop.
   * @param {THREE.Vector3} [offset=new THREE.Vector3(0,0,0)] The desired camera offset FROM the object's center, in world space terms but relative to object.
   */
  public startFollowing(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(),
  ): void {
    this.followingTargetObject = object;
    if (object) {
      this.followOffset.copy(offset);
      object.getWorldPosition(this.previousFollowTargetPos);
    } else {
      this.followOffset.set(0, 0, 0);
      this.previousFollowTargetPos.set(0, 0, 0);
    }
  }

  /**
   * Stops the camera from following an object.
   */
  public stopFollowing(): void {
    this.startFollowing(null);
  }

  /**
   * Sets the debug mode, switching between OrbitControls and FlyControls.
   * @param {boolean} enabled - True to enable debug/fly controls, false for orbit controls.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.isDebugModeActive === enabled) return;

    this.isDebugModeActive = enabled;
  }
}
