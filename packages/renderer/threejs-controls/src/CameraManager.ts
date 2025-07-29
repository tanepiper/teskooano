import { StateAccessor, renderableStore, actions } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { BehaviorSubject } from "rxjs";
import type { CameraManagerOptions, CameraManagerState } from "./types";
import { CustomEvents, CelestialType } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import {
  CAMERA_OFFSET,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  DEFAULT_FOV,
} from "./constants";
import * as THREE from "three";
import {
  CameraHelper,
  CameraPreset,
  AnimationHelper,
  AnimationEase,
} from "@teskooano/renderer-threejs-helpers";

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
  private originalTimeScale: number = 1; // Store original timeScale during transitions
  private isTransitioning: boolean = false; // Track if we're in a transition

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
    if (this.renderer?.interactionOrchestrator) {
      // Assuming controlsManager.dispose() handles OrbitControls cleanup and listener removal from its DOM element.
      this.renderer.interactionOrchestrator.getControlsManager()?.dispose();
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

    // If initialCameraPosition is not given for a subsequent call,
    // we might want to preserve the current camera position from cameraStateSubject
    // instead of resetting to DEFAULT_CAMERA_POSITION. For now, we'll use provided or default.
    initialPosition =
      options.initialCameraPosition ?? DEFAULT_CAMERA_POSITION.clone();

    // Update the state with OSVector3 values
    this.cameraStateSubject.next({
      fov: initialFov,
      focusedObjectId: initialFocusedObjectId,
      currentPosition: initialPosition,
      currentTarget: initialTarget,
    });

    // Ensure the new renderer's camera and controls are updated
    this.renderer?.renderingOrchestrator?.sceneManager?.setFov(initialFov);
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
    const controlsManager =
      this.renderer.interactionOrchestrator.getControlsManager();
    if (!controlsManager?.controls) {
      console.warn(
        "[CameraManager] Cannot initialize camera position: controlsManager or controls not available on renderer.",
      );
      return;
    }
    const initialState = this.cameraStateSubject.getValue();
    // Convert OSVector3 to THREE.Vector3 for the renderer
    this.renderer.camera.position.copy(
      initialState.currentPosition.toThreeJS(),
    );
    controlsManager.controls.target.copy(
      initialState.currentTarget.toThreeJS(),
    );
    controlsManager.controls.update(); // Crucial for OrbitControls
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
   * Calculates a reasonable viewing distance using logarithmic scaling.
   * This ensures appropriate camera distances for all object types, from satellites to stars.
   *
   * @param objectRadius The radius of the object in scene units
   * @param objectType The type of celestial object (optional)
   * @returns Reasonable viewing distance in scene units
   */
  private _calculateLogarithmicViewingDistance(
    objectRadius: number,
    objectType?: string,
  ): number {
    // Import scale constants - 1000 scene units = 1 AU
    const RENDER_SCALE_AU = 1000;

    // Different calculation strategies based on object size and type
    let reasonableDistance: number;

    // For very small objects (satellites, small asteroids/comets), use simple radius-based distances
    if (objectType === "SATELLITE" || objectRadius < 0.01) {
      // Satellites: reasonable viewing distance (e.g., JWST ~750m away)
      // Use small multiplier for very small objects to get proper close viewing distance
      reasonableDistance = objectRadius * 0.6; // 0.6x radius for satellites (~750m for 10m object)
    } else if (
      (objectType === "ASTEROID" || objectType === "COMET") &&
      objectRadius < 1.0
    ) {
      // Small asteroids/comets: close viewing
      reasonableDistance = objectRadius * 5.0; // 5x radius for small rocky objects
    } else {
      // For larger objects (planets, moons, large objects), use logarithmic scaling
      const typeMultipliers = {
        ASTEROID: 4.0, // Medium distance for larger asteroids
        COMET: 4.0, // Medium distance for larger comets
        MOON: 3.0, // Closer for moons
        PLANET: 4.0, // Standard planetary distance
        GAS_GIANT: 6.0, // Bit further for gas giants
        STAR: 8.0, // Further for stars
        default: 4.0, // Default multiplier
      };

      const multiplier =
        typeMultipliers[objectType as keyof typeof typeMultipliers] ||
        typeMultipliers.default;

      // Use logarithmic scaling for larger objects to prevent excessive distances
      const logBase = 10.0;
      const logFactor = Math.log(objectRadius + logBase) / Math.log(logBase);
      reasonableDistance = multiplier * objectRadius * Math.max(1.0, logFactor);
    }

    // Apply absolute constraints
    const minDistance = 0.0001; // Very close minimum (0.1mm in scene units)
    const maxDistance = RENDER_SCALE_AU * 10; // Maximum 10 AU distance

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
    const controlsManager =
      this.renderer?.interactionOrchestrator.getControlsManager();
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
    const controlsManager =
      this.renderer?.interactionOrchestrator.getControlsManager();
    if (!controlsManager) {
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

      // Highlight prediction lines for the focused object (or hide all if null)
      if (this.renderer) {
        this.renderer.renderingOrchestrator.highlightPrediction(objectId);
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
        this.cameraStateSubject.next({
          ...currentState,
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
    const controlsManager =
      this.renderer?.interactionOrchestrator.getControlsManager();
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
    const controlsManager =
      this.renderer?.interactionOrchestrator.getControlsManager();
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

    const currentState = this.cameraStateSubject.getValue();
    if (fov === currentState.fov) {
      return;
    }

    this.cameraStateSubject.next({ ...currentState, fov: fov });
    sceneManager.setFov(fov);
  }

  /**
   * Pauses the simulation during camera transitions to prevent fast-moving objects
   * from moving too far during the transition period.
   */
  private pauseSimulationForTransition(): void {
    if (this.isTransitioning) return; // Already in a transition

    const currentState = StateAccessor.getCurrentSimulationState();
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
    const detail = (event as CustomEvent).detail;
    const currentState = this.cameraStateSubject.getValue();

    // Resume simulation after transition completes
    this.resumeSimulationAfterTransition();

    // Update position and target from the transition's end state
    const newPosition = detail.position
      ? OSVector3.fromThreeJS(detail.position)
      : currentState.currentPosition.clone();
    const newTarget = detail.target
      ? OSVector3.fromThreeJS(detail.target)
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
    if (!this.renderer?.interactionOrchestrator) return;

    const detail = (event as CustomEvent).detail;
    const newPosition = OSVector3.fromThreeJS(detail.position);
    const newTarget = OSVector3.fromThreeJS(detail.target);

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
