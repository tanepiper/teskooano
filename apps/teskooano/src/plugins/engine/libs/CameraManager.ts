import { renderableObjectsStore } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { type WritableAtom } from "nanostores";
import * as THREE from "three";
import type { CompositeEngineState } from "../panels/CompositeEnginePanel"; // Use type import

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
  currentPosition?: THREE.Vector3;
  /**
   * The current target of the camera
   */
  currentTarget?: THREE.Vector3;
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
 * Options for the CameraManager
 */
interface CameraManagerOptions {
  /**
   * The renderer instance
   */
  renderer: ModularSpaceRenderer;
  /**
   * The view state atom
   */
  viewStateAtom: WritableAtom<CompositeEngineState>;
  /**
   * Callback for when the focus changes
   */
  onFocusChangeCallback: (focusedObjectId: string | null) => void;
}

/**
 * Manages camera operations within a Teskooano engine view.
 * Handles focusing on objects, resetting the view, setting Field of View (FOV),
 * and managing camera transitions.
 */
export class CameraManager {
  /**
   * The renderer instance
   */
  private renderer: ModularSpaceRenderer;
  /**
   * The view state atom
   */
  private viewStateAtom: WritableAtom<CompositeEngineState>;
  /**
   * Callback for when the focus changes
   */
  private onFocusChangeCallback: (focusedObjectId: string | null) => void;
  /**
   * The current state of the CameraManager
   */
  private state: CameraManagerState;

  /**
   * Constructor for the CameraManager
   * @param options - The options for the CameraManager
   */
  constructor(options: CameraManagerOptions) {
    this.renderer = options.renderer;
    this.viewStateAtom = options.viewStateAtom;
    this.onFocusChangeCallback = options.onFocusChangeCallback;

    // Initialize internal state from the shared view state atom
    const initialViewState = this.viewStateAtom.get();
    this.state = {
      fov: initialViewState.fov ?? DEFAULT_FOV,
      focusedObjectId: initialViewState.focusedObjectId,
    };

    // Set initial FOV
    this.renderer.sceneManager.setFov(this.state.fov);

    // Listen for camera transitions
    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
  }

  /**
   * Sets the initial camera position and target based on the view state.
   * Should be called once after the renderer and manager are initialized.
   */
  public initializeCameraPosition(): void {
    const initialState = this.viewStateAtom.get();
    let initialTargetPosition = initialState.cameraTarget.clone();

    if (initialState.focusedObjectId) {
      const initialFocusObject =
        renderableObjectsStore.get()[initialState.focusedObjectId];
      if (initialFocusObject?.position) {
        initialTargetPosition.copy(initialFocusObject.position);
      } else {
        console.warn(
          `[CameraManager Init] Initial focused object ${initialState.focusedObjectId} not found or has no position. Using default target.`,
        );
        // Ensure panel state is consistent if focus object is invalid
        this.updatePanelViewState({ focusedObjectId: null });
        this.state.focusedObjectId = null; // Sync internal state
      }
    }

    this.renderer.camera.position.copy(initialState.cameraPosition);
    this.renderer.controlsManager.controls.target.copy(initialTargetPosition);
    this.renderer.controlsManager.controls.update(); // Sync controls
  }

  /**
   * Moves the camera to focus on a specific celestial object or clears focus.
   * @param objectId - The unique ID of the object to focus on, or null to clear focus.
   * @param distance - Optional distance multiplier for the camera offset.
   */
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (!this.renderer.controlsManager) return;

    if (objectId === null) {
      // Clear focus: move to default position
      this.renderer.controlsManager.moveToPosition(
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
      );
      this.renderer.setFollowTarget(null);
      this.state.focusedObjectId = null; // Update internal state first
      // Callback will update panel state after transition
    } else {
      // Focus on object
      const renderables = renderableObjectsStore.get();
      const renderableObject = renderables[objectId];

      if (!renderableObject?.position) {
        console.error(
          `[CameraManager] focusOnObject: Cannot focus on ${objectId}, missing renderable or its position.`,
        );
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE;
      const cameraPosition = targetPosition
        .clone()
        .add(CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance));

      // Initiate camera movement and follow state within the renderer
      this.renderer.setFollowTarget(objectId, targetPosition, cameraPosition);
      this.state.focusedObjectId = objectId; // Update internal state first
      // Callback will update panel state after transition
    }
  }

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (!this.renderer.controlsManager) return;

    // Use the controlsManager's updateTarget method to change focus without moving
    this.renderer.controlsManager.pointCameraAtTarget(
      targetPosition.clone(),
      true,
    );

    // Note: We might need to decide if this action should update the
    // 'focusedObjectId' state. Currently, it only changes the camera target.
    // If it *should* update the focus state, we might need the objectId here.
    // For now, assume only focusOnObject updates the canonical focus state.
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   */
  public resetCameraView(): void {
    if (!this.renderer.controlsManager) return;
    this.renderer.controlsManager.moveToPosition(
      DEFAULT_CAMERA_POSITION.clone(),
      DEFAULT_CAMERA_TARGET.clone(),
    );
    this.renderer.setFollowTarget(null);
    this.state.focusedObjectId = null; // Update internal state first
    // Callback will update panel state after transition
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
    if (fov === this.state.fov) return; // Avoid unnecessary updates

    this.state.fov = fov;
    this.renderer.sceneManager.setFov(fov);
    // Update the shared panel view state
    this.updatePanelViewState({ fov: fov });
  }

  // Bound event handler for camera transition completion
  private handleCameraTransitionComplete = (event: Event): void => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { position, target, focusedObjectId } = customEvent.detail;

      // Prepare state update for the panel, always including latest position/target
      const panelStateUpdate: Partial<CompositeEngineState> = {};
      if (position) panelStateUpdate.cameraPosition = position;
      if (target) panelStateUpdate.cameraTarget = target;

      // Use the focusedObjectId from the event *if provided*, otherwise use manager's current state
      // This ensures the panel state reflects the *intended* focus after the transition
      const finalFocusId =
        focusedObjectId !== undefined
          ? focusedObjectId
          : this.state.focusedObjectId;

      panelStateUpdate.focusedObjectId = finalFocusId;
      this.state.focusedObjectId = finalFocusId; // Sync internal state if needed

      // Update the main panel view state atom
      this.updatePanelViewState(panelStateUpdate);

      // Trigger the focus change callback to potentially update UI elements
      this.onFocusChangeCallback(finalFocusId);
    }
  };

  /** Helper to update the central PanelViewState atom */
  private updatePanelViewState(updates: Partial<CompositeEngineState>): void {
    this.viewStateAtom.set({
      ...this.viewStateAtom.get(),
      ...updates,
    });
  }

  /**
   * Cleans up event listeners associated with the CameraManager.
   */
  public destroy(): void {
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
  }
}
