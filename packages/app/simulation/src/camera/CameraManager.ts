import { getSimulationState, renderableStore } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import type { CameraManagerOptions, CameraManagerState } from "./types";
import { CustomEvents } from "@teskooano/data-types";
import {
  CAMERA_OFFSET,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  DEFAULT_FOV,
} from "./constants";

/**
 * Manages camera operations within a Teskooano engine view.
 *
 * This class handles:
 * - Setting initial camera state (position, target, FOV).
 * - Focusing the camera on specific objects with smooth transitions.
 * - Pointing the camera towards a target position.
 * - Resetting the camera view to defaults.
 * - Managing the camera's Field of View (FOV).
 * - Providing an observable state (`BehaviorSubject`) for camera updates.
 * - Interacting with the `ModularSpaceRenderer` for camera control and transitions.
 */
export class CameraManager {
  /**
   * Static identifier for the plugin system.
   */
  static pluginName = "CameraManager";

  private renderer: ModularSpaceRenderer | undefined;
  private onFocusChangeCallback?: (focusedObjectId: string | null) => void;
  private intendedFocusIdForTransition: string | null = null; // Store intended focus during transition

  /**
   * BehaviorSubject holding the current state of the camera.
   * Emits updates whenever the camera's position, target, FOV, or focused object changes.
   */
  private cameraStateSubject: BehaviorSubject<CameraManagerState>;

  /**
   * Constructs the CameraManager.
   * Initializes the camera state with default values.
   */
  constructor() {
    this.cameraStateSubject = new BehaviorSubject<CameraManagerState>({
      fov: DEFAULT_FOV,
      focusedObjectId: null,
      currentPosition: DEFAULT_CAMERA_POSITION.clone(),
      currentTarget: DEFAULT_CAMERA_TARGET.clone(),
    });
  }

  private _cleanupPriorRenderer(): void {
    if (this.renderer) {
      // Assuming controlsManager.dispose() handles OrbitControls cleanup and listener removal from its DOM element.
      this.renderer.controlsManager?.dispose();
    }
    // Remove document-level listeners, they will be re-added if setDependencies completes.
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.removeEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );
    this.renderer = undefined; // Clear the old renderer reference
  }

  /**
   * Sets dependencies required by the CameraManager and initializes its state based on provided options.
   * This method can be called multiple times if the renderer instance changes.
   *
   * @param {CameraManagerOptions} options - Configuration options including the renderer instance and initial settings.
   */
  public setDependencies(options: CameraManagerOptions): void {
    // Clean up any existing renderer and its associated resources first
    this._cleanupPriorRenderer();

    if (!options.renderer) {
      // Likely a first-time call to setDependencies before the renderer is available.
      return;
    }
    this.renderer = options.renderer;
    this.onFocusChangeCallback = options.onFocusChangeCallback;

    const initialFov = options.initialFov ?? DEFAULT_FOV;
    let initialTarget: THREE.Vector3;
    let initialPosition: THREE.Vector3;
    let initialFocusedObjectId = options.initialFocusedObjectId ?? null;

    if (initialFocusedObjectId) {
      const initialFocusObject =
        renderableStore.getRenderableObjects()[initialFocusedObjectId];
      if (initialFocusObject?.position) {
        initialTarget = initialFocusObject.position.clone();
      } else {
        console.warn(
          `[CameraManager Init] Initial focused object ${initialFocusedObjectId} not found or has no position. Using default target.`,
        );
        initialFocusedObjectId = null;
        initialTarget =
          options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone();
      }
    } else {
      initialTarget =
        options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone();
    }

    // If initialCameraPosition is not given for a subsequent call,
    // we might want to preserve the current camera position from cameraStateSubject
    // instead of resetting to DEFAULT_CAMERA_POSITION. For now, we'll use provided or default.
    initialPosition =
      options.initialCameraPosition ?? DEFAULT_CAMERA_POSITION.clone();

    this.cameraStateSubject.next({
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      currentPosition: initialPosition.clone(),
      currentTarget: initialTarget.clone(),
    });

    // Ensure the new renderer's camera and controls are updated
    this.renderer.sceneManager.setFov(initialFov);
    // It's crucial that ModularSpaceRenderer's controlsManager re-initializes
    // its controls (e.g. OrbitControls) here if they were disposed or need to be
    // attached to a new camera/DOM element. We assume `initializeCameraPosition` will handle this.

    // Re-add document event listeners
    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.addEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );

    // Call initializeCameraPosition to sync the new renderer's controls
    this.initializeCameraPosition();
  }

  /**
   * Sets the initial camera position and target in the renderer's controls.
   * This ensures the controls (e.g., OrbitControls) start synchronized with the manager's state.
   */
  public initializeCameraPosition(): void {
    if (!this.renderer) {
      // Guard against no renderer
      console.warn(
        "[CameraManager] Cannot initialize camera position: Renderer not set.",
      );
      return;
    }
    // This check for this.renderer.controlsManager.controls might be too early if controls are async
    // but for now, we assume it's available after renderer is set.
    if (!this.renderer.controlsManager?.controls) {
      console.warn(
        "[CameraManager] Cannot initialize camera position: controlsManager or controls not available on renderer.",
      );
      return;
    }
    const initialState = this.cameraStateSubject.getValue();
    this.renderer.camera.position.copy(initialState.currentPosition);
    this.renderer.controlsManager.controls.target.copy(
      initialState.currentTarget,
    );
    this.renderer.controlsManager.controls.update(); // Crucial for OrbitControls
  }

  /**
   * Provides observable access to the camera's state.
   * Subscribe to this BehaviorSubject to react to changes in camera position, target, FOV, or focus.
   *
   * @returns {BehaviorSubject<CameraManagerState>} The BehaviorSubject stream of camera state.
   */
  public getCameraState$(): BehaviorSubject<CameraManagerState> {
    return this.cameraStateSubject;
  }

  /**
   * Moves and points the camera to focus on a specific celestial object, or clears focus.
   * Initiates a smooth transition managed by the renderer.
   *
   * @param {string | null} objectId - The unique ID of the object to focus on. Pass `null` to clear focus and reset to default view.
   * @param {number} [distance] - Optional distance multiplier. If not provided, `DEFAULT_CAMERA_DISTANCE` is used to calculate the offset.
   */
  public followObject(objectId: string | null, distance?: number): void {
    if (!this.renderer?.controlsManager) {
      console.warn(
        "[CameraManager] Cannot focus on object: Manager or renderer components not initialized.",
      );
      return;
    }

    const currentState = this.cameraStateSubject.getValue();

    if (currentState.focusedObjectId !== objectId) {
      this.cameraStateSubject.next({
        ...currentState,
        focusedObjectId: objectId,
      });
      this.intendedFocusIdForTransition = objectId;
    } else if (objectId === null) {
      this.intendedFocusIdForTransition = null;
    }

    if (objectId === null) {
      this.renderer.controlsManager.stopFollowing();
      this.renderer.controlsManager.transitionTo(
        this.renderer.camera.position.clone(),
        this.renderer.controlsManager.controls.target.clone(),
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
        { focusedObjectId: null },
      );
    } else {
      const renderables = renderableStore.getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (!renderableObject?.position) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}. Object data not found or missing position.`,
        );
        this.cameraStateSubject.next({
          ...currentState,
          focusedObjectId: null,
        });
        this.intendedFocusIdForTransition = null;
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE;
      const cameraOffsetVector =
        CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance);
      const cameraPosition = targetPosition.clone().add(cameraOffsetVector);

      if (this.renderer.controlsManager) {
        // Set up follow BEFORE initiating transition for better continuity
        // Get the THREE.Object3D from the renderer that matches this objectId
        const objectToFollow = this.renderer.getObjectById(objectId);

        if (objectToFollow) {
          // Start following immediately with the calculated offset
          // This ensures we follow even during transition
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            cameraOffsetVector,
          );
        }

        this.renderer.controlsManager.transitionTo(
          this.renderer.camera.position.clone(),
          this.renderer.controlsManager.controls.target.clone(),
          cameraPosition,
          targetPosition,
          { focusedObjectId: objectId },
        );
      } else {
        console.warn(
          "[CameraManager] ControlsManager not available to focus on object.",
        );
        this.cameraStateSubject.next({
          ...this.cameraStateSubject.getValue(),
          focusedObjectId: null,
        });
        this.intendedFocusIdForTransition = null;
      }
    }
  }

  /**
   * Smoothly points the camera towards a specific target position without changing the camera's location.
   *
   * @param {THREE.Vector3} targetPosition - The world coordinates to point the camera towards.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (!this.renderer?.controlsManager) {
      console.warn(
        "[CameraManager] Cannot point camera: Manager or renderer components not initialized.",
      );
      return;
    }
    this.renderer.controlsManager.transitionTargetTo(
      targetPosition.clone(),
      true,
    );
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Uses a smooth transition.
   */
  public resetCameraView(): void {
    if (!this.renderer?.controlsManager) {
      console.warn(
        "[CameraManager] Cannot reset camera view: Manager or renderer components not initialized.",
      );
      return;
    }
    this.followObject(null);
  }

  /**
   * Clears the current focus, returning the camera to the default view.
   * Equivalent to `focusOnObject(null)`.
   */
  public clearFocus(): void {
    this.followObject(null);
  }

  /**
   * Sets the camera's vertical Field of View (FOV).
   *
   * @param {number} fov - The desired field of view in degrees.
   */
  public setFov(fov: number): void {
    if (!this.renderer?.sceneManager) {
      console.warn(
        "[CameraManager] Cannot set FOV: Manager or renderer components not initialized.",
      );
      return;
    }

    const currentState = this.cameraStateSubject.getValue();
    if (fov === currentState.fov) {
      return;
    }

    this.cameraStateSubject.next({ ...currentState, fov: fov });
    this.renderer.sceneManager.setFov(fov);
  }

  /**
   * Handles the `camera-transition-complete` event dispatched by the renderer.
   * Updates the internal camera state (position, target) and triggers the focus change callback
   * if the focus ID was set *before* the transition started.
   *
   * @param {Event} event - The custom event containing transition details.
   */
  private handleCameraTransitionComplete = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    const currentState = this.cameraStateSubject.getValue();

    // Update position and target from the transition's end state
    const newPosition = detail.position
      ? detail.position.clone()
      : currentState.currentPosition.clone();
    const newTarget = detail.target
      ? detail.target.clone()
      : currentState.currentTarget.clone();

    // The focusedObjectId for a programmatic transition is whatever we intended it to be
    // when we started the transition.
    const newFocusedId = this.intendedFocusIdForTransition;

    if (
      currentState.focusedObjectId !== newFocusedId ||
      !currentState.currentPosition.equals(newPosition) ||
      !currentState.currentTarget.equals(newTarget)
    ) {
      this.cameraStateSubject.next({
        ...currentState,
        focusedObjectId: newFocusedId,
        currentPosition: newPosition,
        currentTarget: newTarget,
      });

      if (
        this.onFocusChangeCallback &&
        currentState.focusedObjectId !== newFocusedId
      ) {
        this.onFocusChangeCallback(newFocusedId);
      }
    }

    // Reset the intent after the transition is complete.
    this.intendedFocusIdForTransition = null;
  };

  /**
   * Handles user-initiated camera manipulation (e.g., via OrbitControls).
   * Updates the internal state and clears any active semantic focus.
   */
  private handleUserCameraManipulation = (event: Event): void => {
    if (!this.renderer) return;

    const detail = (event as CustomEvent).detail;
    const newPosition = detail.position.clone();
    const newTarget = detail.target.clone();

    const currentState = this.cameraStateSubject.getValue();

    // If user manipulates camera, they are implicitly breaking any "follow"
    // The focusedObjectId might still be relevant if they are orbiting it,
    // but a "hard follow" (camera auto-moves with object) should be off.
    // For now, we'll set focusedObjectId to null to signify "free camera".
    // A more sophisticated approach might distinguish between orbit of a target vs. free pan/zoom.
    let newFocusedId = null;
    this.intendedFocusIdForTransition = null; // User took over

    // If the new target is very close to an existing object's known position,
    // we could infer they are still focused on it. This is more complex.
    // For now, any manual manipulation clears programmatic focus.

    if (
      !currentState.currentPosition.equals(newPosition) ||
      !currentState.currentTarget.equals(newTarget) ||
      currentState.focusedObjectId !== newFocusedId
    ) {
      this.cameraStateSubject.next({
        ...currentState,
        currentPosition: newPosition,
        currentTarget: newTarget,
        focusedObjectId: newFocusedId, // User interaction clears programmatic focus
      });
      if (
        this.onFocusChangeCallback &&
        currentState.focusedObjectId !== newFocusedId
      ) {
        this.onFocusChangeCallback(newFocusedId);
      }
    }
  };

  /**
   * Cleans up resources and listeners when the CameraManager is no longer needed.
   * Removes event listeners and completes the state BehaviorSubject.
   */
  public destroy(): void {
    this._cleanupPriorRenderer(); // Call the same cleanup
    // If CameraManager had its own direct subscriptions to external observables, unsubscribe here.
    // For now, it mainly manages renderer and document listeners.
    this.cameraStateSubject.complete(); // Complete the subject
  }
}
