import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CameraManager } from "@teskooano/renderer-threejs-controls";
import type { CameraManagerState as CameraState } from "@teskooano/renderer-threejs-controls";
import { BehaviorSubject, Subscription } from "rxjs";
import { EngineCameraManager } from "../../camera-manager";
import type { CompositeEngineState } from "../../types";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";
import { engineRegistry } from "../../../../../core/controllers/engine/engine-registry.service";

/**
 * Coordinates the creation, configuration, and state synchronization of camera-related
 * managers (`CameraManager`, `EngineCameraManager`) for a single `CompositeEnginePanel`.
 *
 * This class is responsible for:
 * - Creating and initializing the CameraManager and EngineCameraManager instances.
 * - Configuring and linking the state of the CameraManager to the panel's view state.
 * - Updating the panel's view state based on changes from the CameraManager.
 * - Providing access to the CameraManager and EngineCameraManager instances.
 *
 * This class is used by the CompositeEnginePanel to manage the camera-related functionality.
 */
export class PanelCameraCoordinator {
  private _panel: CompositeEnginePanel;
  private _renderer: ModularSpaceRenderer;
  private _panelApiId: string | undefined;
  private _viewState$: BehaviorSubject<CompositeEngineState>;

  private _cameraManagerInstance: CameraManager | undefined;
  private _engineCameraManager: EngineCameraManager | undefined;
  private _subscription = new Subscription();

  /**
   * Creates a new PanelCameraCoordinator.
   * @param panel - The panel instance that owns this coordinator.
   * @param renderer - The renderer instance that will be used by the camera manager.
   * @param viewState$ - The BehaviorSubject that holds the panel's view state.
   * @param panelApiId - The ID of the panel instance.
   */
  constructor(
    panel: CompositeEnginePanel,
    renderer: ModularSpaceRenderer,
    viewState$: BehaviorSubject<CompositeEngineState>,
    panelApiId: string | undefined,
  ) {
    this._panel = panel;
    this._renderer = renderer;
    this._viewState$ = viewState$;
    this._panelApiId = panelApiId;
  }

  /**
   * Initializes the camera systems and links their state to the panel's view state.
   * @returns True if successful, false otherwise.
   */
  public initialize(): boolean {
    if (!this._initializeSystems()) return false;
    if (!this._configureAndLinkState()) return false;
    return true;
  }

  /**
   * Provides access to the CameraManager instance.
   * @returns The CameraManager instance or undefined if not initialized.
   */
  public get cameraManager(): CameraManager | undefined {
    return this._cameraManagerInstance;
  }

  /**
   * Provides access to the EngineCameraManager instance.
   * @returns The EngineCameraManager instance or undefined if not initialized.
   */
  public get engineCameraManager(): EngineCameraManager | undefined {
    return this._engineCameraManager;
  }

  /**
   * Disposes of all resources and subscriptions held by the coordinator.
   */
  public dispose(): void {
    this._subscription.unsubscribe();
    this._cameraManagerInstance?.destroy();
    this._engineCameraManager?.dispose();
  }

  /**
   * Initializes the main CameraManager and the panel-specific EngineCameraManager.
   */
  private _initializeSystems(): boolean {
    // Constructor-level dependency injection: renderer and initial view state
    const initialViewState = this._viewState$.getValue();
    this._cameraManagerInstance = new CameraManager({
      renderer: this._renderer,
      initialFov: initialViewState.fov,
      initialFocusedObjectId: initialViewState.focusedObjectId,
      initialCameraPosition: initialViewState.cameraPosition,
      initialCameraTarget: initialViewState.cameraTarget,
      onFocusChangeCallback: (focusedId: string | null) => {
        this._panel.updateViewState({ focusedObjectId: focusedId });
      },
    });
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

    // Register camera manager in engine registry for lookup by other components
    if (this._panelApiId && this._cameraManagerInstance) {
      engineRegistry.registerCameraManager(
        this._panelApiId,
        this._cameraManagerInstance,
      );
    }
    return true;
  }

  /**
   * Sets dependencies for the main CameraManager and subscribes to its state changes
   * to update the panel's view state.
   */
  private _configureAndLinkState(): boolean {
    if (!this._cameraManagerInstance) return false;

    try {
      this._cameraManagerInstance.initializeCameraPosition();

      this._subscription.add(
        this._cameraManagerInstance
          .getCameraState$()
          .subscribe(this._handleCameraStateChange),
      );
      return true;
    } catch (error) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to set CameraManager dependencies or subscribe to state:`,
        error,
      );
      return false;
    }
  }

  /**
   * Updates the panel's view state based on changes from the CameraManager.
   * This is a one-way sync from camera state -> panel UI state.
   * @param cameraState - The latest state from the camera manager.
   */
  private _handleCameraStateChange = (cameraState: CameraState): void => {
    if (!this._panel.isConnected) return;

    const currentPanelState = this._viewState$.getValue();
    const updates: Partial<CompositeEngineState> = {};

    if (!currentPanelState.cameraPosition.equals(cameraState.currentPosition)) {
      updates.cameraPosition = cameraState.currentPosition.clone();
    }
    if (!currentPanelState.cameraTarget.equals(cameraState.currentTarget)) {
      updates.cameraTarget = cameraState.currentTarget.clone();
    }
    if (currentPanelState.focusedObjectId !== cameraState.focusedObjectId) {
      updates.focusedObjectId = cameraState.focusedObjectId;
    }
    if (currentPanelState.fov !== cameraState.fov) {
      updates.fov = cameraState.fov;
    }

    if (Object.keys(updates).length > 0) {
      // Use a direct update to avoid re-triggering the renderer apply logic
      this._viewState$.next({
        ...currentPanelState,
        ...updates,
      });
    }
  };
}
