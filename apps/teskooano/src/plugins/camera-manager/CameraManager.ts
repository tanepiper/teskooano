import { getRenderableObjects } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import type { CameraManagerOptions, CameraManagerState } from "./types";

/**
 * Default camera position offset relative to the target, normalized.
 * Used when focusing on an object.
 */
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
/**
 * Default camera position if no specific initial position is provided.
 */
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(200, 200, 200);
/**
 * Default camera target point if no specific initial target is provided.
 */
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
/**
 * Default distance multiplier used when calculating camera position based on object size or a default offset.
 */
const DEFAULT_CAMERA_DISTANCE = 10;
/**
 * Default Field of View (FOV) in degrees.
 */
const DEFAULT_FOV = 75;

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
  private isInitialized = false;

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

  /**
   * Sets dependencies required by the CameraManager and initializes its state based on provided options.
   * This method **must** be called once after the manager instance is created and before any other methods are used.
   *
   * @param {CameraManagerOptions} options - Configuration options including the renderer instance and initial settings.
   */
  public setDependencies(options: CameraManagerOptions): void {
    if (this.isInitialized) {
      console.warn(
        "[CameraManager] setDependencies called more than once. Ignoring subsequent calls.",
      );
      return;
    }
    if (!options.renderer) {
      console.warn(
        "[CameraManager] No valid renderer for the CameraManager, waiting for renderer to be set.",
      );
      return;
    }

    this.renderer = options.renderer;
    this.onFocusChangeCallback = options.onFocusChangeCallback;

    const initialFov = options.initialFov ?? DEFAULT_FOV;
    let initialTarget: THREE.Vector3;
    let initialPosition: THREE.Vector3;
    let initialFocusedObjectId = options.initialFocusedObjectId ?? null;

    if (initialFocusedObjectId) {
      const initialFocusObject = getRenderableObjects()[initialFocusedObjectId];
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

    initialPosition =
      options.initialCameraPosition ?? DEFAULT_CAMERA_POSITION.clone();

    this.cameraStateSubject.next({
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      currentPosition: initialPosition.clone(),
      currentTarget: initialTarget.clone(),
    });

    this.renderer.sceneManager.setFov(initialFov);

    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );

    this.isInitialized = true;

    this.initializeCameraPosition();
  }

  /**
   * Sets the initial camera position and target in the renderer's controls.
   * This ensures the controls (e.g., OrbitControls) start synchronized with the manager's state.
   * Should be called once after the manager is initialized via `setDependencies`.
   */
  public initializeCameraPosition(): void {
    if (!this.isInitialized || !this.renderer) {
      console.warn(
        "[CameraManager] Cannot initialize camera position: Dependencies not set.",
      );
      return;
    }
    const initialState = this.cameraStateSubject.getValue();
    this.renderer.camera.position.copy(initialState.currentPosition);
    this.renderer.controlsManager.controls.target.copy(
      initialState.currentTarget,
    );
    this.renderer.controlsManager.controls.update();
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
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
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
    }

    if (objectId === null) {
      this.renderer.setFollowTarget(null);
      this.renderer.controlsManager.moveToPosition(
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
      );
    } else {
      const renderables = getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (!renderableObject?.position) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}. Object data not found or missing position.`,
        );
        this.cameraStateSubject.next({
          ...currentState,
          focusedObjectId: null,
        });
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE;
      const cameraPosition = targetPosition
        .clone()
        .add(CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance));

      this.renderer.setFollowTarget(objectId, targetPosition, cameraPosition);
    }
  }

  /**
   * Smoothly points the camera towards a specific target position without changing the camera's location.
   *
   * @param {THREE.Vector3} targetPosition - The world coordinates to point the camera towards.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
      console.warn(
        "[CameraManager] Cannot point camera: Manager or renderer components not initialized.",
      );
      return;
    }
    this.renderer.controlsManager.pointCameraAtTarget(
      targetPosition.clone(),
      true,
    );
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Uses a smooth transition.
   */
  public resetCameraView(): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
      console.warn(
        "[CameraManager] Cannot reset camera view: Manager or renderer components not initialized.",
      );
      return;
    }
    this.focusOnObject(null);
  }

  /**
   * Clears the current focus, returning the camera to the default view.
   * Equivalent to `focusOnObject(null)`.
   */
  public clearFocus(): void {
    this.focusOnObject(null);
  }

  /**
   * Sets the camera's vertical Field of View (FOV).
   *
   * @param {number} fov - The desired field of view in degrees.
   */
  public setFov(fov: number): void {
    if (!this.isInitialized || !this.renderer?.sceneManager) {
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
    if (!this.isInitialized || !this.renderer) return;

    const detail = (event as CustomEvent).detail;
    const newPosition = detail.position as THREE.Vector3;
    const newTarget = detail.target as THREE.Vector3;
    const intendedFocusId = detail.focusedObjectId as string | null;

    const currentState = this.cameraStateSubject.getValue();
    let stateChanged = false;
    const nextState: CameraManagerState = { ...currentState };

    if (!nextState.currentPosition.equals(newPosition)) {
      nextState.currentPosition.copy(newPosition);
      stateChanged = true;
    }
    if (!nextState.currentTarget.equals(newTarget)) {
      nextState.currentTarget.copy(newTarget);
      stateChanged = true;
    }
    if (nextState.focusedObjectId !== intendedFocusId) {
      nextState.focusedObjectId = intendedFocusId;
      stateChanged = true;
    }

    if (stateChanged) {
      this.cameraStateSubject.next(nextState);
    }

    if (this.onFocusChangeCallback) {
      this.onFocusChangeCallback(intendedFocusId);
    }
  };

  /**
   * Cleans up resources and listeners when the CameraManager is no longer needed.
   * Removes event listeners and completes the state BehaviorSubject.
   */
  public destroy(): void {
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    this.cameraStateSubject.complete();
    this.isInitialized = false;
    this.renderer = undefined;
    this.onFocusChangeCallback = undefined;
    console.log("[CameraManager] Destroyed.");
  }
}
