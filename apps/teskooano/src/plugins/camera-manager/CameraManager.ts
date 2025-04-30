import { renderableObjectsStore } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { BehaviorSubject } from "rxjs";
import * as THREE from "three";

/**
 * Constants for Camera/Focus
 */
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(200, 200, 200);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_CAMERA_DISTANCE = 10; // Default distance multiplier for focus
const DEFAULT_FOV = 75; // Align with panel's default

/**
 * The current state of the CameraManager
 */
interface CameraManagerState {
  /**
   * The current position of the camera
   */
  currentPosition: THREE.Vector3;
  /**
   * The current target of the camera
   */
  currentTarget: THREE.Vector3;
  /**
   * Field of View (FOV)
   */
  fov: number;
  /**
   * Focused object ID
   */
  focusedObjectId: string | null;
}

/**
 * Options for the CameraManager (used by setDependencies)
 */
interface CameraManagerOptions {
  renderer: ModularSpaceRenderer;
  initialFov?: number;
  initialFocusedObjectId?: string | null;
  initialCameraPosition?: THREE.Vector3;
  initialCameraTarget?: THREE.Vector3;
  onFocusChangeCallback?: (focusedObjectId: string | null) => void;
}

/**
 * Manages camera operations within a Teskooano engine view.
 * Handles focusing on objects, resetting the view, setting Field of View (FOV),
 * and managing camera transitions independently.
 */
export class CameraManager {
  /**
   * Plugin identifier
   */
  static pluginName = "CameraManager";

  // Store dependencies as private properties
  private renderer: ModularSpaceRenderer | undefined;
  private onFocusChangeCallback?: (focusedObjectId: string | null) => void;
  private isInitialized = false; // Prevent re-initialization

  private cameraStateSubject: BehaviorSubject<CameraManagerState> = new BehaviorSubject<CameraManagerState>({
      fov: DEFAULT_FOV,
      focusedObjectId: null,
      currentPosition: DEFAULT_CAMERA_POSITION.clone(),
      currentTarget: DEFAULT_CAMERA_TARGET.clone(),
    });

  constructor() {
    console.log("[CameraManager] Instance created (waiting for dependencies).");
    // Constructor is now minimal
  }

  /**
   * Sets dependencies and initializes the manager state.
   * This should be called once after the manager instance is obtained.
   * @param options - The configuration options.
   */
  public setDependencies(options: CameraManagerOptions): void {
    if (this.isInitialized) {
      console.warn("[CameraManager] setDependencies called more than once. Ignoring subsequent calls.");
      return;
    }
    if (!options.renderer) {
      console.error("[CameraManager] setDependencies called without a valid renderer. Initialization failed.");
      return;
    }

    this.renderer = options.renderer;
    this.onFocusChangeCallback = options.onFocusChangeCallback;

    // --- Logic moved from old constructor --- //
    const initialFov = options.initialFov ?? DEFAULT_FOV;
    let initialTarget: THREE.Vector3;
    let initialPosition: THREE.Vector3;
    let initialFocusedObjectId = options.initialFocusedObjectId ?? null;

    if (initialFocusedObjectId) {
      const initialFocusObject =
        renderableObjectsStore.get()[initialFocusedObjectId];
      if (initialFocusObject?.position) {
        initialTarget = initialFocusObject.position.clone();
      } else {
        console.warn(
          `[CameraManager Init] Initial focused object ${initialFocusedObjectId} not found or has no position. Using default target.`,
        );
        initialFocusedObjectId = null; // Correct the focus ID if invalid
        initialTarget = options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone();
      }
    } else {
      initialTarget = options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone();
    }

    initialPosition =
      options.initialCameraPosition ?? DEFAULT_CAMERA_POSITION.clone();

    // Update the BehaviorSubject with the initial state
    this.cameraStateSubject.next({
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      currentPosition: initialPosition.clone(),
      currentTarget: initialTarget.clone(),
    });

    // Set initial FOV in the renderer
    this.renderer.sceneManager.setFov(initialFov);

    // Listen for camera transitions from the renderer (ensure handler is bound)
    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete, // Assumes arrow function or bound method
    );
    // --- End of moved logic --- //

    this.isInitialized = true;
    console.log("[CameraManager] Dependencies set and initialized.");

    // Initialize camera position in controls
    this.initializeCameraPosition();
  }

  /**
   * Sets the initial camera position and target in the renderer's controls.
   * Should be called once after the renderer and manager are initialized.
   */
  public initializeCameraPosition(): void {
    if (!this.isInitialized || !this.renderer) {
      console.warn("[CameraManager] Cannot initialize camera position: Dependencies not set.");
      return;
    }
    const initialState = this.cameraStateSubject.getValue();
    this.renderer.camera.position.copy(initialState.currentPosition);
    this.renderer.controlsManager.controls.target.copy(
      initialState.currentTarget,
    );
    this.renderer.controlsManager.controls.update(); // Sync controls
  }

  /**
   * Exposes the internal camera state atom for external listeners.
   * @returns The writable atom containing the camera manager's state.
   * @deprecated Use getCameraState$() instead.
   */
  public getCameraStateAtom(): BehaviorSubject<CameraManagerState> {
    console.warn("getCameraStateAtom() is deprecated. Use getCameraState$() instead.");
    return this.cameraStateSubject;
  }

  /**
   * Exposes the internal camera state BehaviorSubject for external listeners.
   * @returns The BehaviorSubject containing the camera manager's state.
   */
  public getCameraState$(): BehaviorSubject<CameraManagerState> {
    return this.cameraStateSubject;
  }

  /**
   * Moves the camera to focus on a specific celestial object or clears focus.
   * @param objectId - The unique ID of the object to focus on, or null to clear focus.
   * @param distance - Optional distance multiplier for the camera offset.
   */
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
      console.warn("[CameraManager] Cannot focus on object: Renderer or controls not initialized.");
      return;
    }

    // Update the internal intended focus *before* starting the transition
    const currentState = this.cameraStateSubject.getValue();
    if (currentState.focusedObjectId !== objectId) {
      this.cameraStateSubject.next({ ...currentState, focusedObjectId: objectId });
      // The callback will be triggered *after* transition completes
    }

    if (objectId === null) {
      // Clear focus: move to default position
      this.renderer.controlsManager.moveToPosition(
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
      );
      this.renderer.setFollowTarget(null);
    } else {
      // Focus on object
      const renderables = renderableObjectsStore.get();
      const renderableObject = renderables[objectId];

      if (!renderableObject?.position) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}, missing renderable or its position.`,
        );
        // Revert focus state if object is invalid
        this.cameraStateSubject.next({ ...currentState, focusedObjectId: null });
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE;
      const cameraPosition = targetPosition
        .clone()
        .add(CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance));

      // Initiate camera movement and follow state within the renderer
      // Pass objectId so the event detail reflects the *intended* target
      this.renderer.setFollowTarget(
        objectId,
        targetPosition,
        cameraPosition,
      );
    }
  }

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
        console.warn("[CameraManager] Cannot point camera: Renderer or controls not initialized.");
        return;
    }
    this.renderer.controlsManager.pointCameraAtTarget(targetPosition.clone(), true);
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   */
  public resetCameraView(): void {
    if (!this.isInitialized || !this.renderer?.controlsManager) {
        console.warn("[CameraManager] Cannot reset camera view: Renderer or controls not initialized.");
        return;
    }
    this.focusOnObject(null); // Call internal focus logic to reset
  }

  /**
   * Clears the current focus, equivalent to focusing on null.
   */
  public clearFocus(): void {
    this.focusOnObject(null);
  }

  /**
   * Sets the camera's Field of View (FOV).
   * @param fov - The desired field of view in degrees.
   */
  public setFov(fov: number): void {
    if (!this.isInitialized || !this.renderer?.sceneManager) {
      console.warn("[CameraManager] Cannot set FOV: Renderer or scene manager not initialized.");
      return;
    }

    const currentState = this.cameraStateSubject.getValue();
    if (fov === currentState.fov) return; // Avoid unnecessary updates

    this.cameraStateSubject.next({ ...currentState, fov: fov });
    this.renderer.sceneManager.setFov(fov);
  }

  // Bound event handler for camera transition completion
  private handleCameraTransitionComplete = (event: Event): void => {
    if (!this.isInitialized || !this.renderer) return; // Check initialization
    const detail = (event as CustomEvent).detail;
    const newPosition = detail.position as THREE.Vector3;
    const newTarget = detail.target as THREE.Vector3;

    // Update internal state without triggering focus change callback immediately
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

    // Only emit if position/target actually changed during transition
    if (stateChanged) {
       this.cameraStateSubject.next(nextState);
    }

    // Now call the focus change callback if focus ID is set
    if (currentState.focusedObjectId && this.onFocusChangeCallback) {
      this.onFocusChangeCallback(currentState.focusedObjectId);
    }
  };

  /**
   * Cleans up resources and listeners.
   */
  public destroy(): void {
    console.log("[CameraManager] Destroying...");
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    this.cameraStateSubject.complete();
    this.isInitialized = false;
    this.renderer = undefined; // Clear renderer ref
    this.onFocusChangeCallback = undefined;
  }
}
