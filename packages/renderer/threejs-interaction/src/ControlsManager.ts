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
  private transitionDuration: number = 1.5; // default total seconds
  private transitionDistanceFactor: number = 0.5; // Controls how much distance affects duration
  private minTransitionDuration: number = 1.0; // Minimum transition time in seconds
  private maxTransitionDuration: number = 4.0; // Maximum transition time in seconds
  private activeTimeline: gsap.core.Timeline | null = null; // Store active timeline
  private tempVector = new THREE.Vector3(); // For angle calculations

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
    const rotationDuration = totalDuration * rotationPercent * 5;
    const positionDuration = (totalDuration * (1 - rotationPercent)) / 5;
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
        ease: "power1.inOut",
        onUpdate: () => {
          this.controls.update();
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
          ease: "expo.out",
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
    // GSAP timeline handles updates during transition via onUpdate callbacks
    // We only need to call controls.update() when NOT transitioning OR
    // if damping is enabled and the user might still be influencing it subtly.
    if (!this.isTransitioning || this.controls.enableDamping) {
      if (this.controls.enabled) {
        this.controls.update();
      }
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
}
