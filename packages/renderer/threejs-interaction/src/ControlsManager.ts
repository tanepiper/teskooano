import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import { simulationState } from "@teskooano/core-state";
import { Vector3 } from "three";
import { OSVector3 } from "@teskooano/core-math";
import gsap from "gsap";

/**
 * Manages camera controls and user interaction
 */
export class ControlsManager {
  public controls: OrbitControls;
  private camera: THREE.PerspectiveCamera;
  private isTransitioning: boolean = false;
  private transitionDistanceFactor: number = 0.5; // Controls how much distance affects duration
  private minTransitionDuration: number = 1.0; // Minimum transition time in seconds
  private maxTransitionDuration: number = 4.0; // Maximum transition time in seconds
  private activeTimeline: gsap.core.Timeline | null = null; // Store active timeline
  private tempVector = new THREE.Vector3(); // For angle calculations
  private followingTargetObject: THREE.Object3D | null = null; // Object to follow
  private tempTargetPosition = new THREE.Vector3(); // Reusable vector for target position
  private previousFollowTargetPos = new THREE.Vector3(); // Re-add previousFollowTargetPos for delta calculation
  private finalFollowOffset: THREE.Vector3 | null = null; // Stored offset for following - Keep for potential future use or reference?

  /**
   * Create a new ControlsManager
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);

    // Configure orbit controls for space simulation
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.00001; // Allow much closer zoom
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.7;
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;

    // Listen for control changes
    this.controls.addEventListener("change", () => {
      // Only update the state if controls are enabled (user is controlling)
      // AND if the camera isn't currently doing an animated transition
      if (this.controls.enabled && !this.isTransitioning) {
        // Get the current camera position and target
        const position = camera.position;
        const target = this.controls.target;

        // Update the simulation state with current camera values
        // This primarily reflects user-driven changes when NOT following
        // or reflects the state AFTER the follow logic adjusts position/target.
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
   * Returns whether the camera is currently transitioning
   */
  get getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Update camera target with smooth transition
   */
  updateTarget(target: THREE.Vector3, withTransition: boolean = true): void {
    if (!withTransition) {
      // Immediate update without transition
      this.controls.target.set(target.x, target.y, target.z);
      return;
    }

    // Always use the current camera position as starting point
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    // Begin transition to new target (only target moves)
    this.startTransition(
      currentPosition,
      currentTarget,
      currentPosition,
      target,
    );
  }

  /**
   * Move camera to position and target with transition
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
      return;
    }

    // Always use the current camera position and target as starting points
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    // Begin transition to new position and target
    this.startTransition(currentPosition, currentTarget, position, target);
  }

  /**
   * Calculate transition duration based on distance
   * Longer distances get longer durations for a more natural feel
   */
  private calculateTransitionDuration(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
  ): number {
    // Calculate distance between start and end positions
    const distance = startPos.distanceTo(endPos);

    // Scale duration based on distance
    // Using a logarithmic scale to keep transitions reasonable for very distant objects
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
   * Start a sequenced camera transition (pan then move) using GSAP Timeline
   */
  private startTransition(
    startPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
  ): void {
    // Kill any previous timeline to avoid conflicts
    if (this.activeTimeline) {
      this.activeTimeline.kill();
    }

    // Disable controls during transition
    this.setEnabled(false);
    this.isTransitioning = true;

    // Calculate total transition duration based on distance
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    // --- Calculate Angle for Rotation Duration (Restored from main) ---
    const cameraForward = this.camera.getWorldDirection(
      this.tempVector.clone(),
    );
    // Use startPos and endTarget for the direction the camera needs to point eventually
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    // Prevent issues if start and end points are the same
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;

    // Allocate duration percentages (Restored from main)
    // Adjust multiplier if needed, 5 seemed high, maybe 1 or 2? Let's try 2.
    const rotationPercent = Math.min(0.5, Math.max(0.1, angle / Math.PI)); // 10% to 50% based on angle
    const rotationDuration = totalDuration * rotationPercent * 2; // Adjusted multiplier from 5
    const positionDuration = totalDuration * (1 - rotationPercent); // Remainder for position
    // --- End Angle Calculation ---

    // Define the completion logic
    const onTimelineComplete = () => {
      this.isTransitioning = false;
      this.setEnabled(true);
      this.activeTimeline = null;

      // Ensure final state is precise
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      this.controls.update(); // Final update

      // Update the simulation state with final camera values
      simulationState.set({
        ...simulationState.get(),
        camera: {
          ...simulationState.get().camera,
          position: new OSVector3(endPos.x, endPos.y, endPos.z),
          target: new OSVector3(endTarget.x, endTarget.y, endTarget.z),
        },
      });

      // Dispatch a custom event that the transition is complete
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

      // Calculate and store the final offset if we are following an object
      if (this.followingTargetObject) {
        this.finalFollowOffset = endPos.clone().sub(endTarget);
        // Initialize previousFollowTargetPos with the target's position AT THE END of the transition
        this.previousFollowTargetPos.copy(endTarget);
        console.log(
          "[ControlsManager] Follow offset calculated:",
          this.finalFollowOffset,
          "Initial previousFollowTargetPos:",
          this.previousFollowTargetPos,
        );
      } else {
        this.finalFollowOffset = null;
        this.previousFollowTargetPos.set(0, 0, 0); // Ensure reset if not following
      }

      console.log(
        "[ControlsManager] Camera transition (Rotation+Position) complete. Controls enabled.", // Updated log
      );
    };

    // Create and configure the timeline
    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    // 1. Rotation Phase (Animate Target - Restored from main)
    if (rotationDuration > 0.01) {
      // Only add if duration is meaningful
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "power1.inOut", // Restored ease
        onUpdate: () => {
          this.controls.update(); // Update controls during target animation
        },
      });
    }

    // 2. Position Phase (Animate Camera Position) - starts after rotation
    if (positionDuration > 0.01) {
      // Only add if duration is meaningful
      this.activeTimeline.to(
        this.camera.position,
        {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: positionDuration,
          ease: "expo.out", // Restored ease
          // No onUpdate needed here, target is fixed during this phase
          // but controls still need update for damping/other effects
          onUpdate: () => {
            this.controls.update();
          },
        },
        // Start immediately after previous if it exists, otherwise at time 0
        // Use ">" to chain animations sequentially
        rotationDuration > 0.01 ? ">" : 0,
      );
    } else if (rotationDuration <= 0.01) {
      // If only position moves (or neither, though unlikely)
      // and position duration is also negligible, just jump to end
      console.warn(
        "[ControlsManager] Rotation and Position duration too short, jumping to end state.",
      );
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      onTimelineComplete(); // Manually trigger completion
    }
  }

  /**
   * Update controls (called each frame)
   */
  update(): void {
    // Reintroduce delta logic for following
    if (this.controls.enabled) {
      if (this.followingTargetObject && !this.isTransitioning) {
        // Get the target's current world position
        this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

        // Check if previous position is valid (not 0,0,0 - indicating first frame or reset)
        if (!this.previousFollowTargetPos.equals(new THREE.Vector3(0, 0, 0))) {
          // Calculate the positional change (delta) of the target since last frame
          const deltaMovement = this.tempTargetPosition
            .clone()
            .sub(this.previousFollowTargetPos);

          // Apply this delta to the camera's current position
          this.camera.position.add(deltaMovement);
        } // If it IS the first frame, previousFollowTargetPos was set by onTimelineComplete, so delta is implicitly zero, camera doesn't jump.

        // Update the controls target to the object's new position
        this.controls.target.copy(this.tempTargetPosition);

        // Store the current target position as the previous one for the *next* frame
        this.previousFollowTargetPos.copy(this.tempTargetPosition);
      }

      // Always call controls.update() if enabled.
      // This applies damping, processes user input relative to the current state,
      // and finalizes the camera position/orientation for the frame.
      this.controls.update();
    }
  }

  /**
   * Enable or disable controls
   */
  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Kill any active GSAP animations/timelines
    if (this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
    }
    // Kill individual tweens just in case (belt and braces)
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    this.controls.dispose();
  }

  /**
   * Public method to cancel any ongoing camera transition
   */
  public cancelTransition(): void {
    if (this.isTransitioning && this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
      this.isTransitioning = false; // Ensure state is reset
      this.setEnabled(true); // Re-enable controls
      console.log("[ControlsManager] Transition cancelled externally.");
    }
  }

  /**
   * Set a target object to follow, initiating a camera transition.
   * Pass null to stop following.
   * @param object The THREE.Object3D to follow, or null to stop.
   * @param offset Optional offset from the target's center. Defaults to (0,0,0).
   * @param keepCurrentDistance If true, maintain current camera distance from the target.
   */
  public setFollowTarget(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(),
    keepCurrentDistance: boolean = false,
  ): void {
    this.cancelTransition(); // Cancel any existing transition

    if (!object) {
      console.log("[ControlsManager] Clearing follow target.");
      this.followingTargetObject = null;
      this.finalFollowOffset = null;
      return;
    }

    console.log(
      `[ControlsManager] Setting follow target: ${object.name || object.uuid}`,
    );

    // Calculate the target position (center of the object + offset)
    const targetPosition = new THREE.Vector3();
    object.getWorldPosition(targetPosition).add(offset);

    let finalCameraPosition: THREE.Vector3;
    // Preserve the current camera->target vector for distance/direction calculation
    const currentTarget = this.controls.target.clone(); // Capture current target BEFORE changing it
    const currentPosition = this.camera.position.clone(); // Capture current position
    const directionToTarget = currentPosition.clone().sub(currentTarget);

    // --- Calculate desired final camera position ---
    if (keepCurrentDistance) {
      // Maintain the same distance and direction relative to the *new* target
      finalCameraPosition = targetPosition.clone().add(directionToTarget);
    } else {
      // Default behavior: Calculate a position based on object size or a fixed distance
      // Let's ensure a minimum reasonable distance relative to the new target
      // Use the existing direction vector magnitude or a minimum distance
      const currentDistance = directionToTarget.length();
      // Use object's bounding sphere radius if available, otherwise default minimum
      let objectRadius = 1; // Default radius
      // Check if the object is a Mesh and has geometry with a bounding sphere
      if (
        object instanceof THREE.Mesh &&
        object.geometry &&
        object.geometry.boundingSphere
      ) {
        objectRadius =
          object.geometry.boundingSphere.radius *
          Math.max(object.scale.x, object.scale.y, object.scale.z);
      }
      const minSafeDistance = objectRadius * 3; // e.g., 3x radius away
      const desiredDistance = Math.max(currentDistance, minSafeDistance);

      // Normalize the direction vector ONLY if length > 0
      if (directionToTarget.lengthSq() > 0.0001) {
        directionToTarget.normalize();
      } else {
        // If camera is exactly at target, pick a default direction (e.g., up)
        directionToTarget.set(0, 1, 0); // Adjust as needed
      }

      finalCameraPosition = targetPosition
        .clone()
        .add(directionToTarget.multiplyScalar(desiredDistance));
    }
    // --- End Camera Position Calculation ---

    // --- Set FOLLOW state IMMEDIATELY ---
    // Don't set controls.target here; let the transition handle it.
    this.followingTargetObject = object; // Start tracking the object now
    // Reset previous position - it will be set correctly on transition end or first update
    this.finalFollowOffset = null; // Clear offset until transition completes
    // --- End Immediate State Set ---

    // --- Start transition for BOTH TARGET and CAMERA POSITION ---
    // Pass the CURRENT target as startTarget and the calculated targetPosition as endTarget.
    // Pass the CURRENT position as startPos and calculated finalCameraPosition as endPos.
    this.startTransition(
      currentPosition, // Start Pos = Current Camera Pos
      currentTarget, // Start Target = Current Controls Target
      finalCameraPosition, // End Pos = Calculated Final Camera Pos
      targetPosition, // End Target = Object's World Position (+ offset)
    );
  }
}
