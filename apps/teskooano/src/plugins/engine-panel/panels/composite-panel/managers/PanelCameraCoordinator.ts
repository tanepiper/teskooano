import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";

/**
 * Coordinates the creation, configuration, and state synchronization of camera-related
 * managers for a single `CompositeEnginePanel`.
 *
 * Responsibilities:
 * - Create and initialize the renderer-level CameraManager.
 * - Initialize camera state from the per-panel core-state CameraManager.
 * - Reflect renderer camera state changes back into core-state for this panel.
 */
export class PanelCameraCoordinator extends StateSubscriptionMixin {
  private _renderer: ModularSpaceRenderer;
  private _panelApiId: string;

  private _cameraManagerInstance!: CameraManager;

  /**
   * Creates a new PanelCameraCoordinator.
   * @param panel - The panel instance that owns this coordinator.
   * @param renderer - The renderer instance used by the camera manager.
   * @param panelApiId - The ID of the panel instance.
   */
  constructor(
    _panel: CompositeEnginePanel,
    renderer: ModularSpaceRenderer,
    panelApiId: string,
  ) {
    super();
    this._renderer = renderer;
    this._panelApiId = panelApiId;
  }

  /**
   * Initializes the camera systems and wiring.
   * @returns True if successful, false otherwise.
   */
  public initialize(): boolean {
    return this._initializeSystems();
  }

  /**
   * Provides access to the CameraManager instance.
   */
  public get cameraManager(): CameraManager {
    return this._cameraManagerInstance;
  }

  /** Disposes of all resources and subscriptions held by the coordinator. */
  public dispose(): void {
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();
    this._cameraManagerInstance.dispose();
  }

  /** Initializes the main CameraManager. */
  private _initializeSystems(): boolean {
    try {
      // Get core camera state for initialization
      const coreCameraManager = StateAccessor.getCameraManager(
        this._panelApiId,
      );
      const coreCameraState = coreCameraManager.getCameraState();

      // Create CameraManager with all required dependencies
      this._cameraManagerInstance = new CameraManager({
        renderer: this._renderer,
        panelId: this._panelApiId,
        initialFov: coreCameraState.fov,
        initialFocusedObjectId: coreCameraState.focusedObjectId,
        initialCameraPosition: coreCameraState.position,
        initialCameraTarget: coreCameraState.target,
        onFocusChangeCallback: (_focusedId: string | null) => {
          // Update core-state camera focus when engine camera focus changes
          // coreCameraManager.setFocusedObject(focusedId);
        },
      });

      return true;
    } catch (error) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to create camera manager:`,
        error,
      );
      return false;
    }
  }
}
