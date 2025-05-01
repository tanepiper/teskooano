import { OSVector3 } from "@teskooano/core-math";
import { CustomEvents } from "@teskooano/data-types";
import gsap from "gsap";
import { getSimulationState, setSimulationState } from "@teskooano/core-state";
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
  /** Flag indicating if the camera is currently undergoing a GSAP animation. */
  private isTransitioning: boolean = false;
  /** Factor controlling how much distance affects transition duration (logarithmic scaling). */
  private transitionDistanceFactor: number = 0.5; // Controls how much distance affects duration
  /** Minimum duration for camera transitions in seconds. */
  private minTransitionDuration: number = 1.0; // Minimum transition time in seconds
  /** Maximum duration for camera transitions in seconds. */
  private maxTransitionDuration: number = 4.0; // Maximum transition time in seconds
  /** Stores the active GSAP timeline during transitions to allow cancellation. */
  private activeTimeline: gsap.core.Timeline | null = null; // Store active timeline
  /** Reusable temporary vector for calculations to avoid allocations. */
  private tempVector = new THREE.Vector3(); // For angle calculations
  /** The THREE.Object3D instance the camera is currently following, or null. */
  private followingTargetObject: THREE.Object3D | null = null; // Object to follow
  /** Reusable vector to store the target object's world position. */
  private tempTargetPosition = new THREE.Vector3(); // Reusable vector for target position
  /** Stores the world position of the followed object from the previous frame for delta calculations. */
  private previousFollowTargetPos = new THREE.Vector3(); // Re-add previousFollowTargetPos for delta calculation
  /** Stores the calculated camera offset relative to the target at the end of a transition. (Currently unused in update loop but kept for reference). */
  private finalFollowOffset: THREE.Vector3 | null = null; // Stored offset for following - Keep for potential future use or reference?
  /** Tracks whether debug/fly controls are active. */
  private isDebugModeActive: boolean = false;
  /** Stores the last OrbitControls target before switching to debug mode. */
  private lastOrbitTarget: THREE.Vector3 = new THREE.Vector3();
  /** Clock for FlyControls delta calculation. */
  private clock = new THREE.Clock();

  /**
   * Creates an instance of ControlsManager.
   * @param {THREE.PerspectiveCamera} camera The camera to control.
   * @param {HTMLElement} domElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;

    // --- Initialize OrbitControls ---
    this.controls = new OrbitControls(camera, domElement);

    // Configure orbit controls for space simulation
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = false; // Usually false for space sims
    this.controls.minDistance = 0.00001; // Allow very close zoom
    this.controls.maxDistance = 5000; // Adjust as needed for scene scale
    this.controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.7;
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.5;
    this.controls.enablePan = true; // Usually true, might disable depending on desired control scheme
    this.controls.panSpeed = 1.0;

    // Listen for control changes (typically user interaction)
    this.controls.addEventListener("change", () => {
      // Only update the state if controls are enabled (user is controlling)
      // AND if the camera isn't currently doing an animated transition
      if (this.controls.enabled && !this.isTransitioning) {
        // Get the current camera position and target
        const position = camera.position;
        const target = this.controls.target;

        // Update the global simulation state with current camera values
        // This reflects user-driven changes or the state after follow logic.
        setSimulationState({
          ...getSimulationState(),
          camera: {
            ...getSimulationState().camera,
            position: new OSVector3(position.x, position.y, position.z),
            target: new OSVector3(target.x, target.y, target.z),
          },
        });
      }
    });
  }

  /**
   * Returns whether the camera is currently undergoing an animated transition.
   * @readonly
   * @type {boolean}
   */
  get getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Updates the camera's target (the point it looks at) with a smooth transition.
   * The camera's position remains unchanged.
   *
   * @param {THREE.Vector3} target The new target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   */
  pointCameraAtTarget(
    target: THREE.Vector3,
    withTransition: boolean = true,
  ): void {
    // Cancel any ongoing transition
    this.cancelTransition();

    if (!withTransition) {
      // Immediate update without transition
      this.controls.target.set(target.x, target.y, target.z);
      this.controls.update(); // Ensure controls reflect the change immediately
      // Update simulation state if needed (though target-only changes might not warrant it)
      return;
    }

    // --- Smooth Transition for Target Only ---
    this.setEnabled(false); // Disable user controls
    this.isTransitioning = true;

    // Store current damping state to restore later
    const wasDampingEnabled = this.controls.enableDamping;
    const originalDampingFactor = this.controls.dampingFactor;

    // Disable damping temporarily to prevent camera position adjustments
    this.controls.enableDamping = false;

    const currentTarget = this.controls.target.clone();
    const currentPosition = this.camera.position.clone(); // Needed for duration calc

    // Calculate duration based on angular change or fixed time?
    // Using positional distance for now, as it's readily available
    // but consider changing this if needed.
    const duration = this.calculateTransitionDuration(
      currentPosition,
      currentPosition
        .clone()
        .setFromSphericalCoords(
          currentPosition.length(),
          target.angleTo(new THREE.Vector3(0, 0, 0)),
          target.angleTo(new THREE.Vector3(0, 1, 0)),
        ),
    ); // Rough angular distance approx
    // const duration = 1.5; // Or just use a fixed duration for target changes

    const onComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true);
      this.activeTimeline = null;

      // Restore original damping state
      this.controls.enableDamping = wasDampingEnabled;
      this.controls.dampingFactor = originalDampingFactor;

      // Ensure final state is precise
      this.controls.target.copy(target);
      this.controls.update(); // Final update

      // Dispatch a custom event indicating the transition is complete
      const transitionCompleteEvent = new CustomEvent(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        {
          detail: {
            position: this.camera.position.clone(), // Current position
            target: target.clone(), // Final target
            type: "target-only", // Add type differentiator
          },
          bubbles: true,
          composed: true,
        },
      );
      document.dispatchEvent(transitionCompleteEvent);
    };

    this.activeTimeline = gsap.timeline({ onComplete: onComplete });

    this.activeTimeline.to(this.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: duration,
      ease: "power1.inOut",
      onUpdate: () => {
        // Manually update the camera's lookAt direction WITHOUT calling controls.update()
        // which would recalculate position.
        this.camera.lookAt(this.controls.target);
      },
    });
    // --- End Smooth Transition ---
  }

  /**
   * PRIVATE: Initiates a smooth, sequenced camera transition for both position and target using GSAP.
   *
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} startTarget The starting target position.
   * @param {THREE.Vector3} endPos The desired final camera position.
   * @param {THREE.Vector3} endTarget The desired final target position.
   */
  private _transitionPositionAndTarget(
    startPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
  ): void {
    // Cancel any ongoing transition to avoid conflicts
    this.cancelTransition();

    // Disable user controls during the transition
    this.setEnabled(false);
    this.isTransitioning = true;

    // Store current damping state to restore later
    const wasDampingEnabled = this.controls.enableDamping;
    const originalDampingFactor = this.controls.dampingFactor;

    // Disable damping temporarily to prevent interference
    // This might not be strictly necessary if GSAP overrides fully,
    // but it's safer to be explicit.
    // this.controls.enableDamping = false; // Optional: uncomment if needed

    // Calculate total transition duration based on camera travel distance
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    // --- Calculate Angle for Rotation Duration ---
    const cameraForward = this.camera
      .getWorldDirection(this.tempVector.clone())
      .negate();
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;
    const rotationPercent = Math.min(0.5, Math.max(0.1, angle / Math.PI));
    const rotationDuration = totalDuration * rotationPercent * 2;
    const positionDuration = totalDuration * (1 - rotationPercent);
    // --- End Angle Calculation ---

    // --- Define Transition Completion Logic ---
    const onTimelineComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true);
      this.activeTimeline = null;
      // Restore original damping state
      this.controls.enableDamping = wasDampingEnabled;
      this.controls.dampingFactor = originalDampingFactor;

      // Ensure final state is exactly as intended
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      this.controls.update(); // Final update

      // Set the offset if following after transition
      if (this.followingTargetObject) {
        this.previousFollowTargetPos.copy(
          this.followingTargetObject.getWorldPosition(this.tempTargetPosition),
        );
        // Calculate and store the final offset if needed (though not currently used in update)
        this.finalFollowOffset = this.camera.position
          .clone()
          .sub(this.previousFollowTargetPos);
        // console.log("Transition complete, setting follow offset:", this.finalFollowOffset);
      }

      // Dispatch completion event
      const transitionCompleteEvent = new CustomEvent(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        {
          detail: {
            position: endPos.clone(),
            target: endTarget.clone(),
            type: "position-and-target", // Add type differentiator
          },
          bubbles: true,
          composed: true,
        },
      );
      document.dispatchEvent(transitionCompleteEvent);
    };
    // --- End Completion Logic ---

    // --- Create and Configure GSAP Timeline ---
    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    // 1. Rotation Phase: Animate target
    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power1.inOut",
        onUpdate: () => {
          this.controls.update();
        }, // Update controls during target animation
      });
    }

    // 2. Position Phase: Animate camera position
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
          }, // Update controls during position animation
        },
        rotationDuration > 0.01 ? ">" : 0, // Start after rotation completes
      );
    } else if (rotationDuration <= 0.01) {
      // Skip animation if duration too short
      console.warn(
        "[ControlsManager] Transition duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      onTimelineComplete(); // Manually trigger completion
    }
    // --- End GSAP Timeline ---
  }

  /**
   * Moves the camera to a new position and updates its target, optionally with a smooth transition.
   *
   * @param {THREE.Vector3} position The desired final camera position.
   * @param {THREE.Vector3} target The desired final target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   */
  moveToPosition(
    position: THREE.Vector3,
    target: THREE.Vector3,
    withTransition: boolean = true,
  ): void {
    if (!withTransition) {
      // Immediate update without transition
      this.cancelTransition(); // Cancel any ongoing transition first
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update(); // Ensure controls reflect the change immediately
      // Update global state for immediate changes too
      setSimulationState({
        ...getSimulationState(),
        camera: {
          ...getSimulationState().camera,
          position: new OSVector3(position.x, position.y, position.z),
          target: new OSVector3(target.x, target.y, target.z),
        },
      });
      // If following, update previous position immediately
      if (this.followingTargetObject) {
        this.followingTargetObject.getWorldPosition(
          this.previousFollowTargetPos,
        );
      }
      return;
    }

    // Use the current camera position and target as the start for the transition
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    // Begin transition to the new position and target using the combined logic
    this._transitionPositionAndTarget(
      currentPosition,
      currentTarget,
      position,
      target,
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
    // Calculate distance between start and end positions
    const distance = startPos.distanceTo(endPos);

    // Scale duration based on distance using a logarithmic function
    let duration = this.minTransitionDuration;
    if (distance > 0) {
      duration += Math.min(
        this.transitionDistanceFactor * Math.log10(1 + distance),
        this.maxTransitionDuration - this.minTransitionDuration,
      );
    }

    // Clamp duration between min and max values
    return Math.min(duration, this.maxTransitionDuration);
  }

  /**
   * Updates the controls state. This should be called every frame in the render loop.
   * Handles applying damping, processing user input, and updating camera/target
   * positions when following an object.
   */
  update(delta: number): void {
    if (this.isTransitioning) {
      // GSAP handles updates during transitions
      return;
    }

    // Only update the active controls

    this.controls.update(); // OrbitControls update (handles damping etc.)

    // --- Following Logic (only for OrbitControls) ---
    if (this.followingTargetObject) {
      // Get current world position of the target
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

      // Calculate how much the target moved since the last frame
      const targetDelta = this.tempTargetPosition
        .clone()
        .sub(this.previousFollowTargetPos);

      // Add this delta to both the camera position and the control target
      this.camera.position.add(targetDelta);
      this.controls.target.add(targetDelta);

      // Update the previous position for the next frame
      this.previousFollowTargetPos.copy(this.tempTargetPosition);

      // No need to explicitly update controls here if damping is enabled,
      // as the 'change' event listener or the main controls.update() call will handle it.
      // However, calling update() might be necessary if damping is off or for immediate effect.
      // Let's rely on the main controls.update() call above for now.
    }
    // --- End Following Logic ---
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
    // Kill any active GSAP animations
    this.cancelTransition(); // Uses the cancellation logic
    gsap.killTweensOf(this.camera.position); // Belt and braces
    gsap.killTweensOf(this.controls.target);

    // Dispose of OrbitControls resources (removes event listeners)
    this.controls.dispose();
  }

  /**
   * Public method to immediately cancel any ongoing camera transition animation.
   * Re-enables user controls.
   */
  public cancelTransition(): void {
    if (this.isTransitioning && this.activeTimeline) {
      this.activeTimeline.kill(); // Stop the GSAP timeline
      this.activeTimeline = null;
      this.isTransitioning = false; // Reset state flag
      this.setEnabled(true); // Re-enable controls
    }
  }

  /**
   * Sets a target THREE.Object3D for the camera to follow.
   * Initiates a smooth transition (`moveTo`) to a calculated position
   * relative to the target.
   * Pass null to stop following.
   *
   * @param {THREE.Object3D | null} object The object to follow, or null to stop.
   * @param {THREE.Vector3} [offset=new THREE.Vector3()] An optional offset applied to the object's world position to determine the target point.
   * @param {boolean} [keepCurrentDistance=false] If true, tries to maintain the camera's current distance and orientation relative to the new target. If false, calculates a distance based on object size.
   */
  public setFollowTarget(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(),
    keepCurrentDistance: boolean = false,
  ): void {
    // Cancel any existing transition before starting a new one
    this.cancelTransition();

    if (!object) {
      this.followingTargetObject = null;
      this.finalFollowOffset = null;
      this.previousFollowTargetPos.set(0, 0, 0); // Reset previous pos tracking
      // Note: We don't automatically move the camera back to default here.
      // That should be handled by specific UI actions (e.g., Reset View button).
      return;
    }

    this.followingTargetObject = object; // Set the object to follow IMMEDIATELY

    // Calculate the desired final target position (object center + offset)
    const finalTargetPosition = new THREE.Vector3();
    object.getWorldPosition(finalTargetPosition).add(offset);

    // --- Calculate the desired final camera position ---
    let finalCameraPosition: THREE.Vector3;
    const currentCameraPosition = this.camera.position.clone();
    const currentTargetPosition = this.controls.target.clone();
    const directionToTarget = currentCameraPosition
      .clone()
      .sub(currentTargetPosition);

    if (keepCurrentDistance) {
      // Maintain the same vector (distance and direction) relative to the *new* target
      finalCameraPosition = finalTargetPosition.clone().add(directionToTarget);
    } else {
      // Calculate a suitable distance based on object size or defaults
      const currentDistance = directionToTarget.length();
      let objectRadius = 1; // Default radius
      if (
        object instanceof THREE.Mesh &&
        object.geometry &&
        object.geometry.boundingSphere
      ) {
        // Consider object scale when calculating radius
        objectRadius =
          object.geometry.boundingSphere.radius *
          Math.max(object.scale.x, object.scale.y, object.scale.z);
      }
      const minSafeDistance = objectRadius * 3; // Heuristic: 3x radius away
      const desiredDistance = Math.max(currentDistance, minSafeDistance); // Use larger of current or calculated min distance

      // Normalize the direction vector (if it has length)
      if (directionToTarget.lengthSq() > 0.0001) {
        directionToTarget.normalize();
      } else {
        // If camera is exactly at target, pick a default upward direction
        directionToTarget.set(0, 1, 0);
      }

      // Calculate final position along the direction vector
      finalCameraPosition = finalTargetPosition
        .clone()
        .add(directionToTarget.multiplyScalar(desiredDistance));
    }
    // --- End Camera Position Calculation ---

    // --- Reset intermediate state before transition ---
    this.previousFollowTargetPos.set(0, 0, 0); // Reset delta tracking until transition ends
    this.finalFollowOffset = null; // Clear old offset
    // --- End Reset ---

    // --- Start the transition ---
    // Move from current position/target to the calculated final positions
    this.moveToPosition(
      finalCameraPosition, // End Pos
      finalTargetPosition, // End Target
      true, // Use transition
    );
  }

  /**
   * Sets the debug mode, switching between OrbitControls and FlyControls.
   * @param {boolean} enabled - True to enable debug/fly controls, false for orbit controls.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.isDebugModeActive === enabled) return; // No change

    this.isDebugModeActive = enabled;
  }
}
