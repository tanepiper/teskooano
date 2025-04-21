import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import { simulationState } from "@teskooano/core-state";
import { Vector3 } from "three";
import { OSVector3 } from "@teskooano/core-math";
import gsap from "gsap";

/**
 * Manages camera controls (specifically THREE.OrbitControls) and user interaction
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

  /**
   * Creates an instance of ControlsManager.
   * @param {THREE.PerspectiveCamera} camera The camera to control.
   * @param {HTMLElement} domElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
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
        simulationState.set({
          ...simulationState.get(),
          camera: {
            ...simulationState.get().camera,
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
  updateTarget(target: THREE.Vector3, withTransition: boolean = true): void {
    if (!withTransition) {
      // Immediate update without transition
      this.controls.target.set(target.x, target.y, target.z);
      this.controls.update(); // Ensure controls reflect the change immediately
      return;
    }

    // Use the current camera position and target as the start for the transition
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    // Begin transition: only the target moves
    this.startTransition(
      currentPosition, // Start camera position (doesn't change)
      currentTarget, // Start target position
      currentPosition, // End camera position (doesn't change)
      target, // End target position
    );
  }

  /**
   * Moves the camera to a new position and updates its target, optionally with a smooth transition.
   *
   * @param {THREE.Vector3} position The desired final camera position.
   * @param {THREE.Vector3} target The desired final target position.
   * @param {boolean} [withTransition=true] Whether to animate the transition smoothly.
   */
  moveTo(
    position: THREE.Vector3,
    target: THREE.Vector3,
    withTransition: boolean = true,
  ): void {
    if (!withTransition) {
      // Immediate update without transition
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update(); // Ensure controls reflect the change immediately
      return;
    }

    // Use the current camera position and target as the start for the transition
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    // Begin transition to the new position and target
    this.startTransition(currentPosition, currentTarget, position, target);
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
   * Initiates a smooth, sequenced camera transition using GSAP.
   * The transition typically involves animating the target first (rotation/pan)
   * followed by animating the camera's position.
   *
   * @private
   * @param {THREE.Vector3} startPos The starting camera position.
   * @param {THREE.Vector3} startTarget The starting target position.
   * @param {THREE.Vector3} endPos The desired final camera position.
   * @param {THREE.Vector3} endTarget The desired final target position.
   */
  private startTransition(
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

    // Calculate total transition duration based on camera travel distance
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    // --- Calculate Angle for Rotation Duration ---
    // Determines how much time to allocate to rotating towards the target vs. moving.
    const cameraForward = this.camera
      .getWorldDirection(this.tempVector.clone())
      .negate(); // OrbitControls looks down -Z by default
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection) // Angle between current view and target direction
        : 0;

    // Allocate duration percentages based on the angle. Larger angle = more rotation time.
    const rotationPercent = Math.min(0.5, Math.max(0.1, angle / Math.PI)); // Clamp between 10% and 50%
    const rotationDuration = totalDuration * rotationPercent * 2; // Multiplier can be tuned
    const positionDuration = totalDuration * (1 - rotationPercent);
    // --- End Angle Calculation ---

    // --- Define Transition Completion Logic ---
    const onTimelineComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true); // Re-enable user controls
      this.activeTimeline = null;

      // Ensure final state is precise after animation
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      this.controls.update(); // Apply final state to controls

      // Update the global simulation state with the final camera values
      simulationState.set({
        ...simulationState.get(),
        camera: {
          ...simulationState.get().camera,
          position: new OSVector3(endPos.x, endPos.y, endPos.z),
          target: new OSVector3(endTarget.x, endTarget.y, endTarget.z),
        },
      });

      // Dispatch a custom event indicating the transition is complete
      const transitionCompleteEvent = new CustomEvent(
        "camera-transition-complete",
        {
          detail: {
            position: endPos.clone(),
            target: endTarget.clone(),
          },
          bubbles: true,
          composed: true,
        },
      );
      document.dispatchEvent(transitionCompleteEvent);

      // If following an object, store its position now for the next frame's delta calculation
      if (this.followingTargetObject) {
        // Initialize previousFollowTargetPos with the target's position AT THE END of the transition
        this.previousFollowTargetPos.copy(endTarget);
        this.finalFollowOffset = endPos.clone().sub(endTarget); // Also store offset for reference
      } else {
        this.finalFollowOffset = null;
        this.previousFollowTargetPos.set(0, 0, 0); // Ensure reset if not following
      }
    };
    // --- End Completion Logic ---

    // --- Create and Configure GSAP Timeline ---
    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    // 1. Rotation Phase: Animate the OrbitControls target
    if (rotationDuration > 0.01) {
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power1.inOut", // Smooth easing for rotation
        onUpdate: () => {
          this.controls.update(); // Crucial: Update controls during target animation
        },
      });
    }

    // 2. Position Phase: Animate the camera's position (starts after rotation)
    if (positionDuration > 0.01) {
      this.activeTimeline.to(
        this.camera.position,
        {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: positionDuration,
          ease: "expo.out", // Often a good ease for positional movement
          onUpdate: () => {
            this.controls.update(); // Update controls during position animation for damping
          },
        },
        // Start immediately after the rotation tween completes (if it exists)
        rotationDuration > 0.01 ? ">" : 0,
      );
    } else if (rotationDuration <= 0.01) {
      // If rotation is negligible and position duration is also too short, skip animation
      console.warn(
        "[ControlsManager] Transition duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      onTimelineComplete(); // Manually trigger completion logic
    }
    // --- End GSAP Timeline ---
  }

  /**
   * Updates the controls state. This should be called every frame in the render loop.
   * Handles applying damping, processing user input, and updating camera/target
   * positions when following an object.
   */
  update(): void {
    // Only process if controls are enabled
    if (this.controls.enabled) {
      // --- Following Logic ---
      if (this.followingTargetObject && !this.isTransitioning) {
        // Get the target's current world position
        this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

        // Check if previous position is valid (not the first frame after transition/reset)
        if (!this.previousFollowTargetPos.equals(new THREE.Vector3(0, 0, 0))) {
          // Calculate how much the target moved since the last frame
          const deltaMovement = this.tempTargetPosition
            .clone()
            .sub(this.previousFollowTargetPos);

          // Apply this exact movement delta to the camera's position
          this.camera.position.add(deltaMovement);
        }

        // Update the OrbitControls target to the object's new position
        this.controls.target.copy(this.tempTargetPosition);

        // Store the current target position for the next frame's delta calculation
        this.previousFollowTargetPos.copy(this.tempTargetPosition);
      }
      // --- End Following Logic ---

      // Always call controls.update() if enabled.
      // This applies damping, processes user input (if not following/transitioning),
      // and finalizes the camera position/orientation based on current target and user input.
      this.controls.update();
    }
  }

  /**
   * Enables or disables the OrbitControls, preventing user interaction.
   *
   * @param {boolean} enabled Set to true to enable, false to disable.
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
    this.moveTo(
      finalCameraPosition, // End Pos
      finalTargetPosition, // End Target
      true, // Use transition
    );
  }
}
