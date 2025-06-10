import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { BehaviorSubject, Subscription } from "rxjs";
import { CameraManager } from "../../../../camera-manager/CameraManager";
import { EngineCameraManager } from "../../camera-manager";
import type { CompositeEngineState } from "../../types";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";

/**
 * Coordinates the creation, configuration, and state synchronization of camera-related
 * managers (`CameraManager`, `EngineCameraManager`) for a single `CompositeEnginePanel`.
 */
export class PanelCameraCoordinator {
  private _panel: CompositeEnginePanel;
  private _renderer: ModularSpaceRenderer;
  private _panelApiId: string | undefined;
  private _viewState$: BehaviorSubject<CompositeEngineState>;

  private _cameraManagerInstance: CameraManager | undefined;
  private _engineCameraManager: EngineCameraManager | undefined;
  private _subscription = new Subscription();

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

  public get cameraManager(): CameraManager | undefined {
    return this._cameraManagerInstance;
  }

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
   * Sets dependencies for the main CameraManager and subscribes to its state changes
   * to update the panel's view state.
   */
  private _configureAndLinkState(): boolean {
    if (!this._cameraManagerInstance) return false;

    const initialViewState = this._viewState$.getValue();
    try {
      this._cameraManagerInstance.setDependencies({
        renderer: this._renderer,
        initialFov: initialViewState.fov,
        initialFocusedObjectId: initialViewState.focusedObjectId,
        initialCameraPosition: initialViewState.cameraPosition,
        initialCameraTarget: initialViewState.cameraTarget,
        onFocusChangeCallback: (focusedId: string | null) => {
          this._panel.updateViewState({ focusedObjectId: focusedId });
        },
      });

      this._cameraManagerInstance.initializeCameraPosition();

      this._subscription.add(
        this._cameraManagerInstance
          .getCameraState$()
          .subscribe((cameraState) => {
            if (!this._panel.isConnected) return;

            const currentPanelState = this._viewState$.getValue();
            const updates: Partial<CompositeEngineState> = {};

            if (
              !currentPanelState.cameraPosition.equals(
                cameraState.currentPosition,
              )
            ) {
              updates.cameraPosition = cameraState.currentPosition.clone();
            }
            if (
              !currentPanelState.cameraTarget.equals(cameraState.currentTarget)
            ) {
              updates.cameraTarget = cameraState.currentTarget.clone();
            }
            if (
              currentPanelState.focusedObjectId !== cameraState.focusedObjectId
            ) {
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
          }),
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
}
