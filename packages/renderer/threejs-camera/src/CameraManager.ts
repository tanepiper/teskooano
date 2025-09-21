import { OSVector3 } from "@teskooano/core-math";
import {
  StateAccessor,
  actions,
  renderableStore,
  CameraStore,
} from "@teskooano/core-state";
import type { CameraState } from "@teskooano/core-state";
import { CelestialType, CameraManagerOptions } from "@teskooano/data-types";
import { CameraHelper } from "@teskooano/renderer-threejs-helpers";
import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
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
 * - Providing an observable state through core-state CameraStore integration.
 * - Interacting with ModularSpaceRenderer directly.
 */
export class CameraManager {
  /**
   * Static identifier for the plugin system.
   */
  static pluginName = "CameraManager";

  private readonly renderer: ModularSpaceRenderer;
  private readonly cameraStore: CameraStore;
  private readonly panelId: string;
  private readonly onFocusChangeCallback?: (
    focusedObjectId: string | null,
  ) => void;
  private intendedFocusIdForTransition: string | null = null; // Store intended focus during transition
  private originalTimeScale: number = 1; // Store original timeScale during transitions
  private isTransitioning: boolean = false; // Track if we're in a transition

  /**
   * Constructs the CameraManager with all required dependencies.
   * Camera state will be managed through core-state CameraStore.
   *
   * @param options - Configuration options including the renderer instance and initial settings
   */
  constructor(options: CameraManagerOptions) {
    // Validate required dependencies
    if (!options.renderer) {
      throw new Error("CameraManager: renderer is required");
    }
    if (!options.panelId) {
      throw new Error("CameraManager: panelId is required");
    }

    this.renderer = options.renderer;
    this.panelId = options.panelId;
    this.onFocusChangeCallback = options.onFocusChangeCallback;

    // Initialize camera store for this panel
    const initialFov = options.initialFov ?? DEFAULT_FOV;
    let initialTarget: OSVector3;
    let initialPosition: OSVector3;
    let initialFocusedObjectId = options.initialFocusedObjectId ?? null;

    if (initialFocusedObjectId) {
      const initialFocusObject =
        renderableStore.getRenderableObjects()[initialFocusedObjectId];
      if (initialFocusObject?.position) {
        // Convert THREE.Vector3 to OSVector3
        initialTarget = OSVector3.fromThreeJS(initialFocusObject.position);
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

    // Initialize camera store with consistent property names
    const initialState: Partial<CameraState> = {
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      position: initialPosition,
      target: initialTarget,
    };

    this.cameraStore = StateAccessor.getCameraStore(this.panelId, initialState);

    // Ensure the new renderer's camera and controls are updated
    this.renderer?.renderingOrchestrator?.sceneManager?.setFov(initialFov);

    // Set up event listeners
    this._setupEventListeners();

    // Initialize camera position
    this.initializeCameraPosition();
  }

  /**
   * Sets up event listeners for camera transitions and user manipulations.
   */
  private _setupEventListeners(): void {
    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.addEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );
  }

  /**
   * Disposes of the CameraManager and cleans up resources.
   */
  public dispose(): void {
    if (this.renderer?.controlsManager) {
      // Assuming controlsManager.dispose() handles OrbitControls cleanup and listener removal from its DOM element.
      this.renderer.controlsManager?.dispose();
    }
    // Remove document-level listeners
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.removeEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );
  }

  /**
   * Sets the initial camera position and target in the renderer's controls.
   * This ensures the controls (e.g., OrbitControls) start synchronized with the manager's state.
   */
  public initializeCameraPosition(): void {
    if (!this.renderer || !this.cameraStore) {
      // Guard against no renderer or camera store
      console.warn(
        "[CameraManager] Cannot initialize camera position: Renderer or camera store not set.",
      );
      return;
    }
    // This check for this.renderer.controlsManager.controls might be too early if controls are async
    // but for now, we assume it's available after renderer is set.
    const controlsManager = this.renderer.controlsManager;
    if (!controlsManager?.controls) {
      console.warn(
        "[CameraManager] Cannot initialize camera position: controlsManager or controls not available on renderer.",
      );
      return;
    }
    const currentState = this.cameraStore.getCameraState();
    // Convert OSVector3 to THREE.Vector3 for the renderer
    this.renderer.camera.position.copy(currentState.position.toThreeJS());
    controlsManager.controls.target.copy(currentState.target.toThreeJS());
    controlsManager.controls.update(); // Crucial for OrbitControls
  }

  /**
   * Provides observable access to the camera's state.
   * Now delegates to the core-state CameraStore for consistency.
   *
   * @returns {BehaviorSubject<CameraState>} The BehaviorSubject stream of camera state from core-state.
   */
  public getCameraState$(): BehaviorSubject<CameraState> {
    // Return the BehaviorSubject directly from the store
    return this.cameraStore["_cameraState"];
  }

  /**
   * Calculates the viewing distance for camera positioning.
   * Always uses 30% of the object's radius for consistent positioning.
   * @param objectRadius The radius of the celestial object in scene units
   * @param objectType The type of celestial object (unused in current implementation)
   * @returns The calculated viewing distance in scene units
   */
  private _calculateLogarithmicViewingDistance(
    objectRadius: number,
    objectType?: string,
  ): number {
    // Always use 30% of the object's radius for consistent positioning
    const reasonableDistance = objectRadius * 3.0;

    // Apply absolute constraints to prevent extreme values
    const minDistance = 0.0001; // Very close minimum (0.1mm in scene units)
    const maxDistance = 1000 * 10; // Maximum 10 AU distance (1000 scene units = 1 AU)

    // Clamp the result within reasonable bounds
    return Math.max(minDistance, Math.min(maxDistance, reasonableDistance));
  }

  /**
   * Updates dynamic camera settings based on the focused celestial object type
   * This prevents shader transparency issues while maintaining close viewing for satellites
   * @param objectId The ID of the focused object, or null if no focus
   */
  private _updateDynamicCameraSettings(objectId: string | null): void {
    const sceneManager = this.renderer?.renderingOrchestrator.sceneManager;
    if (!sceneManager) {
      return;
    }

    let celestialType: string | undefined;

    if (objectId) {
      // Get the celestial object type from the renderable store
      const renderables = renderableStore.getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (renderableObject) {
        // Try to get the celestial type from the object's type property
        celestialType = renderableObject.type;
      }
    }

    // Update camera settings in the scene manager
    CameraHelper.updateCameraForCelestialType(
      this.renderer?.renderingOrchestrator.sceneManager.camera ??
        new THREE.PerspectiveCamera(),
      celestialType as CelestialType,
    );

    // Update orbit controls min distance
    const controlsManager = this.renderer?.controlsManager;
    if (controlsManager) {
      const minDistance =
        CameraHelper.getMinDistanceForCelestialType(celestialType);
      controlsManager.updateMinDistance(minDistance);
    }
  }

  /**
   * Moves and points the camera to focus on a specific celestial object, or clears focus.
   * Initiates a smooth transition managed by the renderer.
   *
   * @param {string | null} objectId - The unique ID of the object to focus on. Pass `null` to clear focus and reset to default view.
   * @param {number} [distance] - Optional distance multiplier. If not provided, `DEFAULT_CAMERA_DISTANCE` is used to calculate the offset.
   */
  public followObject(objectId: string | null, distance?: number): void {
    const controlsManager = this.renderer?.controlsManager;
    if (!controlsManager) {
      console.warn(
        "[CameraManager] Cannot focus on object: Manager or renderer components not initialized.",
      );
      return;
    }

    if (!this.cameraStore) {
      console.warn("[CameraManager] Camera store not initialized.");
      return;
    }

    const currentState = this.cameraStore.getCameraState();

    if (currentState.focusedObjectId !== objectId) {
      this.cameraStore.updateCameraState({
        focusedObjectId: objectId,
      });
      this.intendedFocusIdForTransition = objectId;

      // Highlight prediction lines for the focused object (or hide all if null)
      if (this.renderer) {
        this.renderer.renderingOrchestrator.orbitManager.highlightPrediction(
          objectId,
        );
      }
    } else if (objectId === null) {
      this.intendedFocusIdForTransition = null;
    }

    // Update dynamic camera settings based on the focused object type
    this._updateDynamicCameraSettings(objectId);

    if (objectId === null) {
      controlsManager.stopFollowing();
      controlsManager.moveToPosition(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_CAMERA_TARGET,
        true,
        { focusedObjectId: null },
      );
    } else {
      const renderables = renderableStore.getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (!renderableObject?.position) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}. Object data not found or missing position.`,
        );
        this.cameraStore.updateCameraState({
          focusedObjectId: null,
        });
        this.intendedFocusIdForTransition = null;
        return;
      }

      // --- Logarithmic Distance Calculation ---
      const objectRadius = renderableObject.radius ?? DEFAULT_CAMERA_DISTANCE;
      const objectVelocity =
        renderableObject.velocity?.clone() ?? new THREE.Vector3();

      // Calculate reasonable viewing distance using logarithmic scale
      // This ensures good viewing distance for all object types (from satellites to stars)
      const reasonableDistance = this._calculateLogarithmicViewingDistance(
        objectRadius,
        renderableObject.type,
      );

      // Use the reasonable distance for initial calculation
      const initialTargetPos = renderableObject.position.clone();
      const initialOffset =
        CAMERA_OFFSET.clone().multiplyScalar(reasonableDistance);
      const initialCameraPos = initialTargetPos.clone().add(initialOffset);

      // Get transition duration for this reasonable distance
      const transitionDuration =
        controlsManager?.calculateTransitionDuration(
          OSVector3.fromThreeJS(
            this.renderer?.renderingOrchestrator.sceneManager.camera
              ?.position ?? new THREE.Vector3(),
          ),
          OSVector3.fromThreeJS(initialCameraPos),
        ) ?? 2.0; // Default duration if calculation fails

      // Predict object position after transition, accounting for velocity
      const velocityOffset = objectVelocity
        .clone()
        .multiplyScalar(transitionDuration);
      const predictedTargetPosition = renderableObject.position
        .clone()
        .add(velocityOffset);

      // Final camera position uses the reasonable distance from predicted position
      const cameraOffsetVector =
        CAMERA_OFFSET.clone().multiplyScalar(reasonableDistance);
      const cameraPosition = predictedTargetPosition
        .clone()
        .add(cameraOffsetVector);
      // --- End Logarithmic Distance & Prediction ---

      if (controlsManager) {
        // Pause simulation during transition to prevent fast-moving objects
        this.pauseSimulationForTransition();

        // Set up follow BEFORE initiating transition for better continuity
        // Get the THREE.Object3D from the renderer that matches this objectId
        const objectToFollow =
          this.renderer?.renderingOrchestrator.objectManager.getObject(
            objectId,
          );

        if (objectToFollow) {
          // Start following immediately with the calculated offset
          // This ensures we follow even during transition
          controlsManager.startFollowing(
            objectToFollow,
            cameraOffsetVector.toThreeJS(),
          );
        }

        // Use a two-stage transition: first turn to face the object, then move to it
        controlsManager.transitionToWithLookAtFirst(
          OSVector3.fromThreeJS(cameraPosition),
          OSVector3.fromThreeJS(predictedTargetPosition),
          { focusedObjectId: objectId },
        );
      } else {
        console.warn(
          "[CameraManager] ControlsManager not available to focus on object.",
        );
        if (this.cameraStore) {
          this.cameraStore.updateCameraState({
            focusedObjectId: null,
          });
        }
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
    const controlsManager = this.renderer?.controlsManager;
    if (!controlsManager) {
      console.warn(
        "[CameraManager] Cannot point camera: Manager or renderer components not initialized.",
      );
      return;
    }
    controlsManager.transitionTargetTo(
      OSVector3.fromThreeJS(targetPosition),
      true,
    );
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Uses a smooth transition.
   */
  public resetCameraView(): void {
    const controlsManager = this.renderer?.controlsManager;
    if (!controlsManager) {
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
    const sceneManager = this.renderer?.renderingOrchestrator.sceneManager;
    if (!sceneManager) {
      console.warn(
        "[CameraManager] Cannot set FOV: Manager or renderer components not initialized.",
      );
      return;
    }

    if (!this.cameraStore) {
      console.warn("[CameraManager] Camera store not initialized.");
      return;
    }

    const currentState = this.cameraStore.getCameraState();
    if (fov === currentState.fov) {
      return;
    }

    this.cameraStore.updateCameraState({ fov });
    sceneManager.setFov(fov);
  }

  /**
   * Pauses the simulation during camera transitions to prevent fast-moving objects
   * from moving too far during the transition period.
   */
  private pauseSimulationForTransition(): void {
    if (this.isTransitioning) return; // Already in a transition

    const currentState = StateAccessor.getSimulationState();
    this.originalTimeScale = currentState.timeScale;
    this.isTransitioning = true;

    // Only pause if the simulation is running (timeScale > 0)
    if (currentState.timeScale > 0) {
      // Set timeScale to 1 (normal speed) instead of fully pausing
      // This allows the camera to still follow the object but at a manageable speed
      actions.setTimeScale(1);
    }
  }

  /**
   * Resumes the simulation after camera transitions complete.
   */
  private resumeSimulationAfterTransition(): void {
    if (!this.isTransitioning) return;

    // Restore the original timeScale
    actions.setTimeScale(this.originalTimeScale);

    this.isTransitioning = false;
    this.originalTimeScale = 1;
  }

  /**
   * Handles the `camera-transition-complete` event dispatched by the renderer.
   * Updates the internal camera state (position, target) and triggers the focus change callback
   * if the focus ID was set *before* the transition started.
   *
   * @param {Event} event - The custom event containing transition details.
   */
  private handleCameraTransitionComplete = (event: Event): void => {
    if (!this.cameraStore) return;

    const detail = (event as CustomEvent).detail;
    const currentState = this.cameraStore.getCameraState();

    // Resume simulation after transition completes
    this.resumeSimulationAfterTransition();

    // Update position and target from the transition's end state
    const newPosition = detail.position
      ? OSVector3.fromThreeJS(detail.position)
      : currentState.position.clone();
    const newTarget = detail.target
      ? OSVector3.fromThreeJS(detail.target)
      : currentState.target.clone();

    // The focusedObjectId for a programmatic transition is whatever we intended it to be
    // when we started the transition.
    const newFocusedId = this.intendedFocusIdForTransition;

    if (
      currentState.focusedObjectId !== newFocusedId ||
      !currentState.position.equals(newPosition) ||
      !currentState.target.equals(newTarget)
    ) {
      this.cameraStore.updateCameraState({
        focusedObjectId: newFocusedId,
        position: newPosition,
        target: newTarget,
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
    if (!this.renderer?.controlsManager || !this.cameraStore) return;

    const detail = (event as CustomEvent).detail;
    const newPosition = OSVector3.fromThreeJS(detail.position);
    const newTarget = OSVector3.fromThreeJS(detail.target);

    const currentState = this.cameraStore.getCameraState();

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
      !currentState.position.equals(newPosition) ||
      !currentState.target.equals(newTarget) ||
      currentState.focusedObjectId !== newFocusedId
    ) {
      this.cameraStore.updateCameraState({
        position: newPosition,
        target: newTarget,
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
}
