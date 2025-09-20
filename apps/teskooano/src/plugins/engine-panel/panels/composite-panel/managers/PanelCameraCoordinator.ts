import { StateAccessor } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import { Subscription } from "rxjs";
import { EngineCameraManager } from "../../camera-manager";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";

/**
 * Coordinates the creation, configuration, and state synchronization of camera-related
 * managers (`CameraManager`, `EngineCameraManager`) for a single `CompositeEnginePanel`.
 *
 * Responsibilities:
 * - Create and initialize the renderer-level CameraManager and wrapper EngineCameraManager.
 * - Initialize camera state from the per-panel core-state CameraManager.
 * - Reflect renderer camera state changes back into core-state for this panel.
 */
export class PanelCameraCoordinator {
  private _panel: CompositeEnginePanel;
  private _renderer: ModularSpaceRenderer;
  private _panelApiId: string;

  private _cameraManagerInstance!: CameraManager;
  private _engineCameraManager!: EngineCameraManager;
  private _subscription = new Subscription();

  /**
   * Creates a new PanelCameraCoordinator.
   * @param panel - The panel instance that owns this coordinator.
   * @param renderer - The renderer instance used by the camera manager.
   * @param panelApiId - The ID of the panel instance.
   */
  constructor(
    panel: CompositeEnginePanel,
    renderer: ModularSpaceRenderer,
    panelApiId: string,
  ) {
    this._panel = panel;
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

  /**
   * Provides access to the EngineCameraManager instance.
   */
  public get engineCameraManager(): EngineCameraManager {
    return this._engineCameraManager;
  }

  /** Disposes of all resources and subscriptions held by the coordinator. */
  public dispose(): void {
    this._subscription.unsubscribe();
    this._cameraManagerInstance.dispose();
    this._engineCameraManager.dispose();
  }

  /** Initializes the main CameraManager and the panel-specific EngineCameraManager. */
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
        onFocusChangeCallback: (focusedId: string | null) => {
          // Update core-state camera focus when engine camera focus changes
          coreCameraManager.setFocusedObject(focusedId);
        },
      });

      // Create EngineCameraManager with the CameraManager instance
      this._engineCameraManager = new EngineCameraManager(
        this._panel,
        this._cameraManagerInstance,
        this._panelApiId,
      );

      return true;
    } catch (error) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to create camera managers:`,
        error,
      );
      return false;
    }
  }
}
