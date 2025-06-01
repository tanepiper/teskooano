import {
  getSimulationState,
  renderableStore,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import {
  ModularSpaceRenderer,
  RenderableCelestialObject,
} from "@teskooano/renderer-threejs";
import { BehaviorSubject, Subscription } from "rxjs";
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
import { CameraActions } from "./CameraActions";
import { CameraEventHandlers } from "./CameraEventHandlers";

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

  private simulationStateSubscription: Subscription | undefined; // For simulation state
  private lastKnownFollowOffset: THREE.Vector3 | null = null; // To store offset

  private cameraActions: CameraActions | undefined; // Added instance
  private cameraEventHandlers: CameraEventHandlers | undefined; // Added instance

  /**
   * Constructs the CameraManager.
   * Initializes the camera state with default values.
   */
  constructor() {
    this.cameraStateSubject = new BehaviorSubject<CameraManagerState>({
      fov: DEFAULT_FOV,
      focusedObjectId: null,
      followedObjectId: null,
      currentPosition: DEFAULT_CAMERA_POSITION.clone(),
      currentTarget: DEFAULT_CAMERA_TARGET.clone(),
    });
    // CameraActions will be initialized in setDependencies when renderer is available
  }

  // Implement CameraManagerInternalStateAccess for CameraActions
  private getInternalStateAccess() {
    return {
      getIntendedFocusIdForTransition: () => this.intendedFocusIdForTransition,
      setIntendedFocusIdForTransition: (id: string | null) => {
        this.intendedFocusIdForTransition = id;
      },
      getLastKnownFollowOffset: () => this.lastKnownFollowOffset,
      setLastKnownFollowOffset: (offset: THREE.Vector3 | null) => {
        this.lastKnownFollowOffset = offset;
      },
      getOnFocusChangeCallback: () => this.onFocusChangeCallback,
    };
  }

  private _cleanupPriorRenderer(): void {
    if (this.renderer) {
      // Assuming controlsManager.dispose() handles OrbitControls cleanup and listener removal from its DOM element.
      this.renderer.controlsManager?.dispose();
    }
    // Use instance of handlers if they exist
    if (this.cameraEventHandlers) {
      document.removeEventListener(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        this.cameraEventHandlers.handleCameraTransitionComplete, // Use instance
      );
      document.removeEventListener(
        CustomEvents.USER_CAMERA_MANIPULATION,
        this.cameraEventHandlers.handleUserCameraManipulation, // Use instance
      );
    }
    this.simulationStateSubscription?.unsubscribe(); // Unsubscribe here
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

    // Initialize CameraActions here as renderer is now available
    this.cameraActions = new CameraActions(
      this.renderer,
      this.cameraStateSubject,
      this.getInternalStateAccess(),
    );

    // Initialize CameraEventHandlers here
    this.cameraEventHandlers = new CameraEventHandlers(
      this.renderer,
      this.cameraStateSubject,
      this.getInternalStateAccess(),
      this.onFocusChangeCallback, // Pass callback directly
    );

    // Subscribe to simulation state changes
    this.simulationStateSubscription?.unsubscribe(); // Unsubscribe from previous if any
    this.simulationStateSubscription = simulationState$.subscribe(
      // Use instance of handler if it exists
      (state: SimulationState) =>
        this.cameraEventHandlers?.handleSimulationStateChange(state),
    );

    const initialFov = options.initialFov ?? DEFAULT_FOV;
    let initialTarget: THREE.Vector3;
    let initialPosition: THREE.Vector3;
    let initialFocusedObjectId: string | null = null; // Initialize to null

    // ALWAYS calculate from the main star.
    // options.initialFocusedObjectId and options.initialCameraTarget might be used as fallbacks
    // if main star calculation fails, or can be ignored if a strict default is preferred then.

    const allObjects = renderableStore.getRenderableObjects();
    let mainStar: RenderableCelestialObject | undefined = undefined;

    // Find main star: parentless, ideally type STAR.
    for (const id in allObjects) {
      const obj = allObjects[id];
      if (obj.parentId === null || obj.parentId === undefined) {
        if (obj.type && obj.type.toUpperCase() === "STAR") {
          mainStar = obj; // Prefer a parentless STAR
          break;
        }
        if (!mainStar) {
          // If no STAR found yet, take any parentless as candidate
          mainStar = obj;
        }
      }
    }

    // If the first candidate wasn't a star, check if there's a parentless STAR at origin
    if (mainStar && mainStar.type.toUpperCase() !== "STAR") {
      for (const id in allObjects) {
        const obj = allObjects[id];
        if (
          (obj.parentId === null || obj.parentId === undefined) &&
          obj.type &&
          obj.type.toUpperCase() === "STAR" &&
          obj.position &&
          obj.position.lengthSq() === 0
        ) {
          mainStar = obj; // Found a parentless STAR at origin
          break;
        }
      }
    }

    // Final check: if still no mainStar, or it's not at origin, try to find one at origin
    if (
      !mainStar ||
      (mainStar.position && mainStar.position.lengthSq() !== 0)
    ) {
      for (const id in allObjects) {
        const obj = allObjects[id];
        if (
          obj.position &&
          obj.position.lengthSq() === 0 &&
          obj.type &&
          obj.type.toUpperCase() === "STAR"
        ) {
          mainStar = obj; // Found a star at origin
          break;
        }
      }
    }

    if (mainStar?.position && typeof mainStar.radius === "number") {
      initialTarget = mainStar.position.clone(); // Should be (0,0,0) for the main star
      const starRadius = mainStar.radius;
      const offsetFactor = 3.0;
      const cameraDirection = new THREE.Vector3(1, 0.5, 1).normalize();

      initialPosition = initialTarget
        .clone()
        .add(cameraDirection.multiplyScalar(starRadius * offsetFactor));

      // Sanity check: if star is huge and position is still too close (e.g. inside), push further
      if (initialPosition.distanceTo(initialTarget) < starRadius * 1.1) {
        initialPosition = initialTarget
          .clone()
          .add(
            cameraDirection.multiplyScalar(starRadius * (offsetFactor + 1.5)),
          );
      }

      initialFocusedObjectId = mainStar.celestialObjectId;
    } else {
      // Fallback to absolute defaults if smart positioning fails
      // Consider if options.initialFocusedObjectId or options.initialCameraTarget should be used here as a secondary fallback.
      // For now, sticking to absolute default as per stricter interpretation.
      console.warn(
        "[CameraManager Init] Smart positioning failed to find suitable main star. Using absolute default position and target (200,200,200 -> 0,0,0).",
      );
      initialTarget =
        options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone(); // Use option target if available, else default
      initialPosition = DEFAULT_CAMERA_POSITION.clone(); // No smart position, use default
      initialFocusedObjectId = options.initialFocusedObjectId ?? null; // Use option focus if available, else null
      // If initialFocusedObjectId is set and target was default, try to target focused object
      if (
        initialFocusedObjectId &&
        initialTarget.equals(DEFAULT_CAMERA_TARGET)
      ) {
        const focusObjectFallback =
          renderableStore.getRenderableObjects()[initialFocusedObjectId];
        if (focusObjectFallback?.position) {
          initialTarget = focusObjectFallback.position.clone();
        }
      }
    }

    // Update the BehaviorSubject with the determined state
    this.cameraStateSubject.next({
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      followedObjectId: null,
      currentPosition: initialPosition.clone(),
      currentTarget: initialTarget.clone(),
    });

    // Ensure the new renderer's camera and controls are updated
    this.renderer.sceneManager.setFov(initialFov);
    // It's crucial that ModularSpaceRenderer's controlsManager re-initializes
    // its controls (e.g. OrbitControls) here if they were disposed or need to be
    // attached to a new camera/DOM element. We assume `initializeCameraPosition` will handle this.

    // Re-add document event listeners using handlers from the instance
    if (this.cameraEventHandlers) {
      document.addEventListener(
        CustomEvents.CAMERA_TRANSITION_COMPLETE,
        this.cameraEventHandlers.handleCameraTransitionComplete,
      );
      document.addEventListener(
        CustomEvents.USER_CAMERA_MANIPULATION,
        this.cameraEventHandlers.handleUserCameraManipulation,
      );
    }

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
    if (!this.renderer.controlsManager?.getOrbitControls()) {
      console.warn(
        "[CameraManager] Cannot initialize camera position: controlsManager or controls not available on renderer.",
      );
      return;
    }
    const initialState = this.cameraStateSubject.getValue();
    this.renderer.camera.position.copy(initialState.currentPosition);
    this.renderer.controlsManager
      .getOrbitControls()
      .target.copy(initialState.currentTarget);
    this.renderer.controlsManager.getOrbitControls().update(); // Crucial for OrbitControls

    // If there's an initial followed object, store its offset
    if (initialState.followedObjectId && initialState.currentTarget) {
      // Note: currentTarget should be the position of the followedObjectId if followedObjectId is set.
      // This assumes that if followedObjectId is set, currentTarget is already its position.
      const followedObject = this.renderer.getObjectById(
        initialState.followedObjectId,
      );
      if (followedObject?.position) {
        this.lastKnownFollowOffset = initialState.currentPosition
          .clone()
          .sub(followedObject.position);
      } else if (initialState.followedObjectId) {
        // followedObjectId was set, but object not found
        console.warn(
          `[CameraManager] Initial followed object ${initialState.followedObjectId} not found during offset calculation.`,
        );
        this.lastKnownFollowOffset = null;
      }
    } else {
      this.lastKnownFollowOffset = null; // Ensure it's null if not initially following
    }
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
   * Instantly moves the camera to a calculated viewing position around the specified celestial object.
   * The camera will orbit this object, but it is not a persistent follow.
   *
   * @param {string} objectId - The unique ID of the object to move to.
   * @param {number} [distanceFactor] - Optional radius factor for calculating camera distance.
   */
  public moveToCelestial(objectId: string, distanceFactor?: number): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.moveToCelestial(objectId, distanceFactor);
  }

  /**
   * Orients the camera to look at a specific celestial object from its current position.
   * This does not change the camera's position or initiate a persistent follow.
   * The camera's orbit pivot point also remains unchanged.
   *
   * @param {string} objectId - The unique ID of the object to look at.
   */
  public lookAtCelestial(objectId: string): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.lookAtCelestial(objectId);
  }

  /**
   * Moves and points the camera to follow a specific celestial object, or clears follow.
   * Initiates a smooth transition managed by the renderer and establishes persistent follow.
   *
   * @param {string | null} objectId - The unique ID of the object to follow. Pass `null` to clear follow.
   * @param {number} [distanceFactor] - Optional radius factor for camera offset.
   */
  public followCelestial(
    objectId: string | null,
    distanceFactor?: number,
  ): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.followCelestial(objectId, distanceFactor);
  }

  /**
   * Smoothly points the camera towards a specific target position without changing the camera's location.
   *
   * @param {THREE.Vector3} targetPosition - The world coordinates to point the camera towards.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.pointCameraAt(targetPosition);
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Uses a smooth transition.
   */
  public resetCameraView(): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.resetCameraView();
  }

  /**
   * Clears the current focus, returning the camera to the default view.
   * Equivalent to `followCelestial(null)`.
   */
  public clearFocus(): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.clearFocus();
  }

  /**
   * Sets the camera's vertical Field of View (FOV).
   *
   * @param {number} fov - The desired field of view in degrees.
   */
  public setFov(fov: number): void {
    if (!this.cameraActions) {
      console.warn(
        "[CameraManager] cameraActions not initialized. Call setDependencies first.",
      );
      return;
    }
    this.cameraActions.setFov(fov);
  }

  /**
   * Cleans up resources and listeners when the CameraManager is no longer needed.
   * Removes event listeners and completes the state BehaviorSubject.
   */
  public destroy(): void {
    this._cleanupPriorRenderer();
    this.simulationStateSubscription?.unsubscribe(); // Also here for completeness
    this.cameraStateSubject.complete(); // Complete the subject
  }
}
