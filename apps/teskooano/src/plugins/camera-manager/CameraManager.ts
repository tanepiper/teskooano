import {
  getSimulationState,
  renderableStore,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
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

    // Subscribe to simulation state changes
    this.simulationStateSubscription?.unsubscribe(); // Unsubscribe from previous if any
    this.simulationStateSubscription = simulationState$.subscribe(
      (state: SimulationState) => this.handleSimulationStateChange(state),
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
    console.log("[CameraManager] Main star found:", mainStar);

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
      console.log(
        `[CameraManager Init] Smart positioning enforced. Main star: '${mainStar.name}' (ID: ${mainStar.celestialObjectId}, Radius: ${starRadius}). Initial Pos:`,
        initialPosition,
        "Target:",
        initialTarget,
      );
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

    // If there's an initial focus, store its offset
    if (initialState.focusedObjectId && initialState.currentTarget) {
      this.lastKnownFollowOffset = initialState.currentPosition
        .clone()
        .sub(initialState.currentTarget);
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
   * Moves and points the camera to focus on a specific celestial object, or clears focus.
   * Initiates a smooth transition managed by the renderer.
   *
   * @param {string | null} objectId - The unique ID of the object to focus on. Pass `null` to clear focus and reset to default view.
   * @param {number} [distanceFactor] - Optional radius factor. If not provided, `FOLLOW_RADIUS_OFFSET_FACTOR` is used to calculate the offset.
   */
  public followObject(objectId: string | null, distanceFactor?: number): void {
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
        DEFAULT_CAMERA_POSITION.clone(), // Reset to absolute default position
        DEFAULT_CAMERA_TARGET.clone(), // Reset to absolute default target
        { focusedObjectId: null },
      );
    } else {
      const renderables = renderableStore.getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (
        !renderableObject?.position ||
        typeof renderableObject.radius !== "number"
      ) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}. Object data not found, or missing position/radius.`,
        );
        this.cameraStateSubject.next({
          ...currentState,
          focusedObjectId: null, // Clear focus if object is invalid
        });
        this.intendedFocusIdForTransition = null;
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const objectRadius = renderableObject.radius;

      // Use the provided distanceFactor, or a default. Ensure it's not too small.
      const FOLLOW_RADIUS_OFFSET_FACTOR = 3.0; // Default factor of radii to be away
      const MIN_RADIUS_OFFSET_FACTOR = 1.5; // Minimum factor to prevent being too close

      let effectiveFactor = distanceFactor ?? FOLLOW_RADIUS_OFFSET_FACTOR;
      if (effectiveFactor < MIN_RADIUS_OFFSET_FACTOR) {
        console.warn(
          `[CameraManager] followObject: Requested distanceFactor ${distanceFactor} is too small. Using minimum ${MIN_RADIUS_OFFSET_FACTOR}.`,
        );
        effectiveFactor = MIN_RADIUS_OFFSET_FACTOR;
      }

      const offsetMagnitude = objectRadius * effectiveFactor;

      // Use the existing CAMERA_OFFSET for direction, scaled by the new magnitude.
      // This maintains a consistent viewing angle relative to the target.
      const cameraOffsetVector = CAMERA_OFFSET.clone()
        .normalize()
        .multiplyScalar(offsetMagnitude);
      let cameraPosition = targetPosition.clone().add(cameraOffsetVector);

      // Sanity check similar to initial load: if still too close (e.g., inside a very large, non-spherical, or oddly shaped object)
      // This can happen if CAMERA_OFFSET is pointed directly at a flat part of a large object.
      // A simple distance check might not be enough. We rely on CAMERA_OFFSET being a good general direction.
      // However, ensuring we are at least `objectRadius * MIN_RADIUS_OFFSET_FACTOR` might be a good backup.
      if (
        cameraPosition.distanceTo(targetPosition) <
        objectRadius * MIN_RADIUS_OFFSET_FACTOR * 0.9
      ) {
        // 0.9 for a small tolerance
        console.warn(
          `[CameraManager] followObject: Calculated camera position for ${objectId} is too close. Adjusting further.`,
        );
        cameraPosition = targetPosition.clone().add(
          CAMERA_OFFSET.clone()
            .normalize()
            .multiplyScalar(objectRadius * MIN_RADIUS_OFFSET_FACTOR * 1.1),
        );
      }

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

    let newFocusedId = this.intendedFocusIdForTransition;

    // If the transition had a specific focusId, use it.
    // Otherwise, if the transition implies a default view (e.g. target is 0,0,0), clear focus.
    if (detail.metadata && detail.metadata.focusedObjectId !== undefined) {
      newFocusedId = detail.metadata.focusedObjectId;
    } else if (
      newTarget.equals(DEFAULT_CAMERA_TARGET) &&
      newPosition.equals(DEFAULT_CAMERA_POSITION)
    ) {
      // Heuristic: if transition ends at default position/target, assume focus is cleared
      // unless intendedFocusIdForTransition was explicitly set to something else during this transition start.
      if (this.intendedFocusIdForTransition === null) {
        // Only clear if it was meant to be cleared
        newFocusedId = null;
      }
    }

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

    // After transition and state update, handle following behavior based on simulation state
    if (newFocusedId && this.renderer?.controlsManager) {
      const simulationState = getSimulationState();
      const isPaused = simulationState.paused;

      const objectToFollow = this.renderer.getObjectById(newFocusedId);
      if (objectToFollow) {
        // Calculate the offset based on the new camera position and target post-transition.
        this.lastKnownFollowOffset = newPosition.clone().sub(newTarget);

        this.renderer.controlsManager.startFollowing(
          objectToFollow,
          this.lastKnownFollowOffset,
        );

        if (isPaused) {
          console.log(
            `[CameraManager] Transition complete, following ${newFocusedId} while paused. Offset stored.`,
          );
        }
        // The problematic dispatch of USER_CAMERA_MANIPULATION when paused is now removed.
      } else {
        console.warn(
          `[CameraManager] Object ${newFocusedId} not found for following post-transition. Stopping follow.`,
        );
        this.renderer.controlsManager.stopFollowing();
        this.lastKnownFollowOffset = null;
      }
    } else if (this.renderer?.controlsManager) {
      // newFocusedId is null or renderer/controlsManager is not fully available.
      this.renderer.controlsManager.stopFollowing();
      this.lastKnownFollowOffset = null;
    }

    this.intendedFocusIdForTransition = null; // Reset after transition completes or is superseded
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

  private handleSimulationStateChange(newState: SimulationState): void {
    if (!this.renderer || !this.renderer.controlsManager) return;

    const cameraState = this.cameraStateSubject.getValue();
    const currentlyFocusedId = cameraState.focusedObjectId;

    if (newState.paused) {
      // When pausing, if we are following, ensure the controlsManager has the latest offset
      // but it should ideally stop actively moving the camera.
      // OrbitControls will allow free orbit when not actively updated by follow.
      if (currentlyFocusedId) {
        const objectToFollow = this.renderer.getObjectById(currentlyFocusedId);
        if (objectToFollow?.position && this.renderer.camera?.position) {
          // Store the current visual offset, user might have orbited
          this.lastKnownFollowOffset = this.renderer.camera.position
            .clone()
            .sub(objectToFollow.position);
          // Re-affirm follow with potentially new offset, ControlsManager should handle pause
          // This call primarily updates the ControlsManager's internal target and offset.
          // The active movement should be handled by ControlsManager based on simulation state.
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            this.lastKnownFollowOffset,
          );
          console.log(
            `[CameraManager] Paused. Stored follow offset for ${currentlyFocusedId}.`,
          );
        }
      }
    } else {
      // Unpausing
      if (currentlyFocusedId) {
        const objectToFollow = this.renderer.getObjectById(currentlyFocusedId);
        if (objectToFollow && this.lastKnownFollowOffset) {
          // Re-initiate follow with the last known/calculated offset
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            this.lastKnownFollowOffset,
          );
          console.log(
            `[CameraManager] Resumed following ${currentlyFocusedId} on unpause with stored offset.`,
          );
        } else if (objectToFollow) {
          // If no lastKnownFollowOffset (e.g. focus set while paused, or app start paused), calculate a default one
          const renderable =
            renderableStore.getRenderableObjects()[currentlyFocusedId];
          const objectRadius = renderable?.radius ?? 50;
          const effectiveFactor = 3.0; // Default like in followObject
          const offsetMagnitude = objectRadius * effectiveFactor;
          const defaultOffset = CAMERA_OFFSET.clone()
            .normalize()
            .multiplyScalar(offsetMagnitude);
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            defaultOffset,
          );
          this.lastKnownFollowOffset = defaultOffset.clone();
          console.log(
            `[CameraManager] Re-initiated following ${currentlyFocusedId} on unpause with default offset.`,
          );
        }
      }
    }
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
