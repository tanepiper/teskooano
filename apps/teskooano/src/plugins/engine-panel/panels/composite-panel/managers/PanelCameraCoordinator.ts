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
  private _panelApiId: string | undefined;

  private _cameraManagerInstance: CameraManager | undefined;
  private _engineCameraManager: EngineCameraManager | undefined;
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
    panelApiId: string | undefined,
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
    if (!this._initializeSystems()) return false;
    if (!this._configureAndLinkState()) return false;
    return true;
  }

  /**
   * Provides access to the CameraManager instance.
   */
  public get cameraManager(): CameraManager | undefined {
    return this._cameraManagerInstance;
  }

  /**
   * Provides access to the EngineCameraManager instance.
   */
  public get engineCameraManager(): EngineCameraManager | undefined {
    return this._engineCameraManager;
  }

  /** Disposes of all resources and subscriptions held by the coordinator. */
  public dispose(): void {
    this._subscription.unsubscribe();
    this._cameraManagerInstance?.destroy();
    this._engineCameraManager?.dispose();
  }

  /** Initializes the main CameraManager and the panel-specific EngineCameraManager. */
  private _initializeSystems(): boolean {
    this._cameraManagerInstance = new CameraManager();
    this._engineCameraManager = new EngineCameraManager(
      this._panel,
      this._cameraManagerInstance,
      this._panelApiId,
    );

    if (!this._cameraManagerInstance || !this._engineCameraManager) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to create camera management instances.`,
      );
      return false;
    }
    return true;
  }

  /**
   * Sets dependencies for the renderer CameraManager and subscribes to its state changes.
   * Uses the centralized per-panel camera state via core-state's CameraManager.
   */
  private _configureAndLinkState(): boolean {
    if (!this._cameraManagerInstance) return false;

    const panelId = this._panelApiId;
    try {
      if (panelId) {
        const coreCameraManager = StateAccessor.getCameraManager(panelId);
        const coreCameraState = coreCameraManager.getCameraState();

        this._cameraManagerInstance.setDependencies({
          renderer: this._renderer,
          panelId,
          initialFov: coreCameraState.fov,
          initialFocusedObjectId: coreCameraState.focusedObjectId,
          initialCameraPosition: coreCameraState.position,
          initialCameraTarget: coreCameraState.target,
          onFocusChangeCallback: (focusedId: string | null) => {
            // Update core-state camera focus when engine camera focus changes
            coreCameraManager.setFocusedObject(focusedId);
          },
        });
      } else {
        // Fallback if panelId is missing: still set renderer dependency with default panelId
        this._cameraManagerInstance.setDependencies({
          renderer: this._renderer,
          panelId: this._panelApiId || "default",
        });
      }

      this._cameraManagerInstance.initializeCameraPosition();

      // Note: No need to subscribe to renderer camera state and push back to core-state
      // since the renderer CameraManager now uses the same CameraStore as the core CameraManager.
      // This prevents circular feedback loops while maintaining state synchronization.
      return true;
    } catch (error) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to set CameraManager dependencies or subscribe to state:`,
        error,
      );
      return false;
    }
  }
}
