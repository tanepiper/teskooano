import { OSVector3 } from "@teskooano/core-math";
import { CustomEvents } from "@teskooano/data-types";
import gsap from "gsap";
import { simulationStateService } from "@teskooano/core-state";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// New imports for the refactored classes
import { OrbitControlsHandler } from "./OrbitControlsHandler";
import { CameraTransitionManager } from "./CameraTransitionManager";
import { CameraFollowManager } from "./CameraFollowManager";

/**
 * Manages camera controls and interactions within a Three.js scene by coordinating
 * OrbitControls handling, programmatic camera transitions, and object following.
 *
 * @class ControlsManager
 */
export class ControlsManager {
  private camera: THREE.PerspectiveCamera;
  private rendererElement: HTMLElement;

  // Handlers for different responsibilities
  private orbitControlsHandler: OrbitControlsHandler;
  private transitionManager: CameraTransitionManager;
  private followManager: CameraFollowManager;

  // State that might still be managed by ControlsManager or passed to handlers
  private isDebugModeActive: boolean = false;
  // private clock = new THREE.Clock(); // Was for FlyControls, may not be needed if FlyControls are removed/separate

  // Properties related to simulation state updates, if not handled by OrbitControlsHandler's events
  // private lastCameraPosition = new THREE.Vector3();
  // private lastCameraTarget = new THREE.Vector3();
  // private changeThreshold = 0.001;

  /**
   * Creates an instance of ControlsManager.
   * @param {THREE.PerspectiveCamera} camera The camera to control.
   * @param {HTMLElement} rendererElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement) {
    this.camera = camera;
    this.rendererElement = rendererElement;

    // Initialize the handlers
    this.orbitControlsHandler = new OrbitControlsHandler(
      this.camera,
      this.rendererElement,
    );
    this.transitionManager = new CameraTransitionManager(
      this.camera,
      this.orbitControlsHandler,
    );
    this.followManager = new CameraFollowManager(
      this.camera,
      this.orbitControlsHandler,
      // Provide a way for FollowManager to know if a transition is active
      () => this.transitionManager.getIsTransitioning(),
    );

    // Initial state synchronization (already handled in OrbitControlsHandler constructor)
    // const initialState = simulationStateService.getCurrentState();
    // if (initialState && initialState.camera) {
    //   this.camera.position.set(
    //     initialState.camera.position.x,
    //     initialState.camera.position.y,
    //     initialState.camera.position.z,
    //   );
    //   this.orbitControlsHandler.controls.target.set(
    //     initialState.camera.target.x,
    //     initialState.camera.target.y,
    //     initialState.camera.target.z,
    //   );
    // this.lastCameraPosition.copy(this.camera.position);
    // this.lastCameraTarget.copy(this.orbitControlsHandler.controls.target);
    // }

    // Event listeners are now managed within OrbitControlsHandler
  }

  /**
   * Returns whether the camera is currently undergoing an animated programmatic transition.
   * @readonly
   * @type {boolean}
   */
  get getIsTransitioning(): boolean {
    return this.transitionManager.getIsTransitioning();
  }

  /**
   * Smoothly transitions only the camera's target point.
   */
  public transitionTargetTo(
    target: THREE.Vector3,
    withTransition: boolean = true,
    options?: {
      focusedObjectId?: string | null;
      followedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    this.transitionManager.transitionTargetTo(target, withTransition, options);
  }

  /**
   * Smoothly transitions only the camera's orientation to look at a specific point.
   */
  public transitionOrientationTo(
    lookAtPoint: THREE.Vector3,
    options?: {
      focusedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    this.transitionManager.transitionOrientationTo(lookAtPoint, options);
  }

  /**
   * Initiates a smooth, sequenced camera transition for both position and target.
   */
  public transitionTo(
    startPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endPos: THREE.Vector3,
    endTarget: THREE.Vector3,
    options?: {
      focusedObjectId?: string | null;
      followedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    this.transitionManager.transitionTo(
      startPos,
      startTarget,
      endPos,
      endTarget,
      options,
    );
  }

  /**
   * Public wrapper to move camera and target.
   * If not using a transition, it updates camera, target, and simulation state directly.
   * If using a transition, it delegates to CameraTransitionManager.
   */
  public moveToPosition(
    position: THREE.Vector3,
    target: THREE.Vector3,
    withTransition: boolean = true,
    options?: {
      focusedObjectId?: string | null;
      followedObjectId?: string | null;
      transitionType?: string | null;
    },
  ): void {
    if (!withTransition) {
      this.transitionManager.cancelTransition(); // Ensure any ongoing transition is stopped.
      this.camera.position.copy(position);
      this.orbitControlsHandler.controls.target.copy(target);
      this.orbitControlsHandler.controls.update();

      // Update simulation state
      simulationStateService.updateCamera(
        new OSVector3(position.x, position.y, position.z),
        new OSVector3(target.x, target.y, target.z),
      );

      // If following an object, and moving without transition, we need to ensure
      // the follow state (like offset) is consistent with this new direct position.
      // The CameraFollowManager's internal state (like followOffset) is set by startFollowing.
      // This direct move might override a smoothly calculated follow position.
      // For simplicity, if following, this direct move might be best handled
      // by re-evaluating the follow state or ensuring 'startFollowing' was called appropriately.
      // The current CameraFollowManager update loop will adjust to the new camera/target
      // if follow is active.
      // Consider if follow offset needs recalculation based on this direct move if it deviates from it.
      if (this.followManager.getFollowingTarget()) {
        // The followManager.update() will take care of adjusting to the new camera/target position
        // in the next frame if following is active.
        // Explicitly re-calculating here might conflict with the follow manager's own logic.
        // We can ensure the target of OrbitControls is the followed object's position.
        const followedObject = this.followManager.getFollowingTarget();
        if (followedObject) {
          const tempTargetPos = new THREE.Vector3();
          followedObject.getWorldPosition(tempTargetPos);
          this.orbitControlsHandler.controls.target.copy(tempTargetPos);

          // The camera position itself IS `position` from the arguments.
          // The offset would be position - tempTargetPos.
          // This might be a good place to update followManager's idea of the offset if desired,
          // or rely on a new `startFollowing` call to define the offset.
          const currentOffset = position.clone().sub(tempTargetPos);
          // Potentially: this.followManager.startFollowing(followedObject, currentOffset);
          // However, this might be too implicit. Usually moveToPosition in "no transition" mode
          // is a direct override.
        }
        this.orbitControlsHandler.controls.update();
      }
      return;
    }

    // With transition, delegate to TransitionManager
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.orbitControlsHandler.controls.target.clone();
    this.transitionManager.transitionTo(
      currentPosition,
      currentTarget,
      position,
      target,
      options,
    );
  }

  /**
   * Updates the controls state. This should be called every frame in the render loop.
   */
  update(delta: number): void {
    // delta is passed but not used by current children's update
    // Update follow manager first, as it might adjust camera/target
    this.followManager.update();

    // Then update orbit controls (handles damping, user input)
    this.orbitControlsHandler.update();

    // Debug mode update (if FlyControls were re-introduced)
    // if (this.isDebugModeActive && this.flyControls) {
    //   this.flyControls.update(this.clock.getDelta());
    // }
  }

  /**
   * Enables or disables the OrbitControls.
   */
  setEnabled(enabled: boolean): void {
    this.orbitControlsHandler.setEnabled(enabled);
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.transitionManager.dispose();
    this.orbitControlsHandler.dispose();
    // No specific dispose for FollowManager unless it holds resources like event listeners.
  }

  /**
   * Public method to immediately cancel any ongoing camera transition animation.
   */
  public cancelTransition(): void {
    this.transitionManager.cancelTransition();
  }

  /**
   * Sets a target THREE.Object3D for the camera to follow, and the relative offset.
   */
  public startFollowing(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(0, 10, 20), // Default consistent with FollowManager
  ): void {
    this.followManager.startFollowing(object, offset);
  }

  /**
   * Stops the camera from following an object.
   */
  public stopFollowing(): void {
    this.followManager.stopFollowing();
  }

  /**
   * Temporarily pauses the visual effect of the camera following its target.
   */
  public pauseFollowVisuals(): void {
    this.followManager.pauseFollowVisuals();
  }

  /**
   * Resumes the visual effect of the camera following its target.
   */
  public resumeFollowVisuals(): void {
    this.followManager.resumeFollowVisuals();
  }

  /**
   * Sets the debug mode. (Currently, this only toggles a flag; FlyControls integration would be needed here).
   * @param {boolean} enabled - True to enable debug/fly controls, false for orbit controls.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.isDebugModeActive === enabled) return;
    this.isDebugModeActive = enabled;

    // If FlyControls were implemented, logic to switch would go here:
    // this.orbitControlsHandler.setEnabled(!enabled);
    // if (this.flyControls) this.flyControls.enabled = enabled;
    // if (enabled) {
    //   this.lastOrbitTarget.copy(this.orbitControlsHandler.controls.target);
    //   // setup flyControls...
    // } else {
    //   // switch back to orbit, restore target...
    //   this.orbitControlsHandler.controls.target.copy(this.lastOrbitTarget);
    // }
    console.warn(
      "setDebugMode called, but FlyControls are not fully integrated in this refactor.",
    );
  }

  // Getter for the underlying OrbitControls for special cases (e.g., attaching external UI)
  public getOrbitControls(): OrbitControls {
    return this.orbitControlsHandler.controls;
  }
}
