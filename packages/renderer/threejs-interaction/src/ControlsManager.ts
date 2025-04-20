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
  private transitionDistanceFactor: number = 2.0; // Controls how much distance affects duration (Increased from 0.5)
  private minTransitionDuration: number = 0.5; // Minimum transition time in seconds (Decreased from 1.0)
  private maxTransitionDuration: number = 8.0; // Maximum transition time in seconds (Increased from 4.0)
  private activeTimeline: gsap.core.Timeline | null = null; // Store active timeline
  private tempVector = new THREE.Vector3(); // For angle calculations
  private followingTargetObject: THREE.Object3D | null = null; // Object to follow
  private tempTargetPosition = new THREE.Vector3(); // Reusable vector for target position

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
      if (this.controls.enabled && !this.isTransitioning) {
        // Get the current camera position and target
        const position = camera.position;
        const target = this.controls.target;

        // Update the simulation state with current camera values
        // But don't clear focused object - just update camera position
        simulationState.set({
          ...simulationState.get(),
          camera: {
            ...simulationState.get().camera,
            position: new OSVector3(position.x, position.y, position.z),
            target: new OSVector3(target.x, target.y, target.z),
          },
        });

        // If user interacts, stop following
        if (this.followingTargetObject) {
          console.log(
            "[ControlsManager] User interaction detected, stopping follow.",
          );
          this.followingTargetObject = null;
          // Stop tracking the focused object in the global state as well
          const currentState = simulationState.get();
          // Assuming 'focusedObjectId' is the correct key in SimulationState
          if (currentState.focusedObjectId) {
            simulationState.set({ ...currentState, focusedObjectId: null });
            console.log(
              "[ControlsManager] Cleared focusedObjectId due to user interaction.",
            );
          }
        }
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

    return Math.min(duration, this.maxTransitionDuration) * 2;
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

    // --- Calculate Angle for Rotation Duration ---
    const cameraForward = this.camera.getWorldDirection(
      this.tempVector.clone(),
    );
    const targetDirection = endTarget.clone().sub(startPos).normalize();
    // Prevent issues if start and end points are the same
    const angle =
      targetDirection.lengthSq() > 0.0001
        ? cameraForward.angleTo(targetDirection)
        : 0;

    // Allocate duration percentages
    const rotationPercent = Math.min(0.5, Math.max(0.1, angle / Math.PI)); // 10% to 50% based on angle (PI radians = 180 deg)
    const rotationDuration = (totalDuration * rotationPercent) / 2;
    const positionDuration = (totalDuration * (1 - rotationPercent)) / 4;
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

      console.log(
        "[ControlsManager] Camera transition complete. Controls enabled.",
      );
    };

    // Create and configure the timeline
    this.activeTimeline = gsap.timeline({ onComplete: onTimelineComplete });

    // 1. Rotation Phase (Animate Target)
    if (rotationDuration > 0.01) {
      // Only add if duration is meaningful
      this.activeTimeline.to(this.controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: rotationDuration,
        ease: "circ.in",
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
          ease: "sine.inOut",
          // No onUpdate needed here, target is fixed during this phase
        },
        rotationDuration > 0.01 ? ">" : 0,
      ); // Start immediately after previous if it exists, otherwise at time 0
    }
  }

  /**
   * Update controls (called each frame)
   */
  update(): void {
    // If we are following an object and not transitioning, update the target
    if (this.followingTargetObject && !this.isTransitioning) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);
      this.controls.target.copy(this.tempTargetPosition);
    }

    // GSAP timeline handles updates during transition via onUpdate callbacks (REMOVED)
    // We need OrbitControls to update based on GSAP's changes during transition.
    // We also need it to update normally when user is controlling or following.
    // Always update controls if not disabled externally
    this.controls.update();
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
      // Optionally re-enable controls immediately if needed, though transitions usually handle this
      // this.setEnabled(true);
      return;
    }

    console.log(
      `[ControlsManager] Setting follow target: ${object.name || object.uuid}`,
    );
    this.followingTargetObject = object;

    // Calculate the target position (center of the object + offset)
    const targetPosition = new THREE.Vector3();
    object.getWorldPosition(targetPosition).add(offset);

    let finalCameraPosition: THREE.Vector3;

    if (keepCurrentDistance) {
      // Calculate the vector from the *current* target to the camera
      const currentTarget = this.controls.target.clone();
      const direction = this.camera.position.clone().sub(currentTarget);
      // Maintain the same distance and direction relative to the *new* target
      finalCameraPosition = targetPosition.clone().add(direction);
    } else {
      // Default behavior: Calculate a position based on object size or a fixed distance
      // For now, let's just use a default offset if not keeping distance
      // A more sophisticated approach would involve bounding box checks etc.
      const currentDistance = this.camera.position.distanceTo(
        this.controls.target,
      );
      const direction = this.camera.position
        .clone()
        .sub(this.controls.target)
        .normalize();
      finalCameraPosition = targetPosition
        .clone()
        .add(direction.multiplyScalar(Math.max(currentDistance, 1))); // Ensure minimum distance
    }

    // Start the transition to the new target and calculated position
    this.moveTo(finalCameraPosition, targetPosition, true);
  }
}
