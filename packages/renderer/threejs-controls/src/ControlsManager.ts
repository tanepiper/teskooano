import { CustomEvents } from "@teskooano/data-types";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObjectFollower } from "./following/ObjectFollower";
import {
  ControlsChangeEvent,
  OrbitControlsHandler,
} from "./orbit/OrbitControlsHandler";
import { CameraTransitionManager } from "./transition/CameraTransitionManager";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Orchestrates camera controls by composing functionality from specialized handlers.
 * This class acts as the public API for camera control, delegating tasks to:
 * - `OrbitControlsHandler`: For direct user manipulation via OrbitControls.
 * - `CameraTransitionManager`: For programmatic, animated transitions.
 * - `ObjectFollower`: For tracking moving objects.
 */
export class ControlsManager extends StateSubscriptionMixin {
  /** The camera being controlled. */
  private camera: THREE.PerspectiveCamera;
  private rendererElement: HTMLElement;

  // --- Child Managers ---
  private orbitControlsHandler: OrbitControlsHandler;
  private transitionManager: CameraTransitionManager;
  private objectFollower: ObjectFollower;

  /** Exposes the raw OrbitControls instance for advanced, direct manipulation if needed. */
  public readonly controls: OrbitControls;

  /** Tracks whether debug/fly controls are active. */
  private isDebugModeActive: boolean = false;

  /**
   * Creates an instance of ControlsManager.
   * @param camera The camera to control.
   * @param rendererElement The HTML element for event listeners (typically the canvas).
   */
  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement) {
    super();
    this.camera = camera;
    this.rendererElement = rendererElement;

    // 1. Initialize handlers
    this.orbitControlsHandler = new OrbitControlsHandler(
      camera,
      rendererElement,
    );
    this.transitionManager = new CameraTransitionManager(
      camera,
      this.orbitControlsHandler,
    );
    this.objectFollower = new ObjectFollower(camera, this.orbitControlsHandler);

    // Expose the raw controls instance
    this.controls = this.orbitControlsHandler.controls;

    // 2. Wire handlers together
    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(
      this.orbitControlsHandler.onControlsStart$,
      this.handleControlsStart,
    );
    this.subscribeToState(
      this.orbitControlsHandler.onControlsEnd$,
      this.handleControlsEnd,
    );
  }

  /**
   * When the user starts interacting, cancel any ongoing animations or following.
   */
  private handleControlsStart = (): void => {
    this.transitionManager.cancelTransition();
  };

  /**
   * When user interaction ends, dispatch an event to notify the rest of the application.
   */
  private handleControlsEnd = (detail: ControlsChangeEvent): void => {
    if (this.objectFollower.isFollowing()) {
      this.objectFollower.updateFollowOffset();
    }

    const event = new CustomEvent(CustomEvents.USER_CAMERA_MANIPULATION, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.rendererElement.dispatchEvent(event);
  };

  /**
   * Returns whether the camera is currently undergoing an animated transition.
   */
  get getIsTransitioning(): boolean {
    return this.transitionManager.getIsAnimating();
  }

  /**
   * Smoothly transitions only the camera's target point.
   * @param target The new target position.
   * @param withTransition Whether to animate the transition.
   * @param options Optional parameters for the transition.
   */
  public transitionTargetTo(
    target: OSVector3,
    withTransition: boolean = true,
    options?: { focusedObjectId?: string | null },
  ): void {
    if (!withTransition) {
      this.transitionManager.cancelTransition();
      this.controls.target.copy(target.toThreeJS());
      this.controls.update();
      return;
    }
    this.transitionManager.transitionTargetTo(target, options);
  }

  /**
   * Moves the camera to a new position and target, with an optional transition.
   * @param position The desired final camera position.
   * @param target The desired final target position.
   * @param withTransition Whether to animate the transition.
   * @param options Optional parameters for the transition.
   */
  public moveToPosition(
    position: OSVector3,
    target: OSVector3,
    withTransition: boolean = true,
    options?: { focusedObjectId?: string | null },
  ): void {
    if (!withTransition) {
      this.transitionManager.cancelTransition();
      this.camera.position.copy(position.toThreeJS());
      this.controls.target.copy(target.toThreeJS());

      // If following, ensure the follower is synced to the new manual position.
      if (this.objectFollower.isFollowing()) {
        this.objectFollower.syncPositionsAfterTransition();
      } else {
        this.controls.update();
      }
      return;
    }

    this.transitionManager.transitionTo(position, target, options);
  }

  /**
   * Immediately cancels any ongoing camera transition animation.
   */
  public cancelTransition(): void {
    this.transitionManager.cancelTransition();
  }

  /**
   * Sets a target object for the camera to follow.
   * @param object The object to follow, or null to stop.
   * @param offset The desired camera offset from the object's center.
   */
  public startFollowing(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(),
  ): void {
    this.objectFollower.startFollowing(object, offset);
  }

  /**
   * Stops the camera from following an object.
   */
  public stopFollowing(): void {
    this.objectFollower.stopFollowing();
  }

  /**
   * Updates all control-related handlers. This should be called every frame.
   * @param delta Time since the last frame.
   */
  update(delta: number): void {
    // The order is important here.
    // 1. The follower updates camera/target based on object movement.
    this.objectFollower.update();
    // 2. The controls handler applies damping and user input.
    this.orbitControlsHandler.update(delta);
    // GSAP animations update themselves, but the controls.update() call inside
    // their onUpdate callbacks keeps things smooth.
  }

  /**
   * Enables or disables user interaction with the controls.
   * @param enabled Whether to enable the controls.
   */
  setEnabled(enabled: boolean): void {
    this.orbitControlsHandler.setEnabled(enabled);
  }

  /**
   * Sets the debug mode. (Currently a placeholder).
   * @param enabled True to enable debug/fly controls.
   */
  public setDebugMode(enabled: boolean): void {
    if (this.isDebugModeActive === enabled) return;
    this.isDebugModeActive = enabled;
    // In a full implementation, this would swap the orbitControlsHandler
    // with a different handler (e.g., FlyControlsHandler).
  }

  /**
   * Cleans up all resources used by the manager and its handlers.
   */
  dispose(): void {
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();
    this.transitionManager.dispose();
    this.orbitControlsHandler.dispose();
    // ObjectFollower has no resources to dispose of.
  }

  /**
   * Calculates the expected duration of a camera transition between two points.
   * This is useful for planning and prediction logic.
   * @param startPos The starting position of the transition.
   * @param endPos The ending position of the transition.
   * @returns The calculated duration in seconds.
   */
  public calculateTransitionDuration(
    startPos: OSVector3,
    endPos: OSVector3,
  ): number {
    return this.transitionManager.calculateTransitionDuration(startPos, endPos);
  }
}
