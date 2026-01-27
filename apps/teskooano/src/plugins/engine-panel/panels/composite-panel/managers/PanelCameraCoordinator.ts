import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import { distinctUntilChanged, map } from "rxjs/operators";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";

/**
 * Coordinates the creation, configuration, and state synchronization of camera-related
 * managers for a single `CompositeEnginePanel`.
 *
 * Responsibilities:
 * - Create and initialize the renderer-level CameraManager.
 * - Initialize camera state from the per-panel core-state CameraManager.
 * - Subscribe to core-state camera changes and sync FOV to renderer (core-state is single source of truth).
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

      // Subscribe to core-state FOV changes and sync to renderer
      // Core-state is the single source of truth for FOV
      this._setupFovSync(coreCameraManager);

      return true;
    } catch (error) {
      console.error(
        `[PanelCameraCoordinator for ${this._panelApiId}] Failed to create camera manager:`,
        error,
      );
      return false;
    }
  }

  /**
   * Sets up subscription to core-state camera FOV changes and syncs them to the renderer.
   * This ensures core-state is the single source of truth for FOV.
   * @param coreCameraManager The core-state camera manager for this panel.
   */
  private _setupFovSync(
    coreCameraManager: ReturnType<typeof StateAccessor.getCameraManager>,
  ): void {
    console.debug(
      `[PanelCameraCoordinator ${this._panelApiId}] Setting up FOV sync subscription`,
    );

    // Subscribe to FOV changes and sync to renderer
    // distinctUntilChanged() ensures we only process actual value changes
    this.subscribeToState(
      coreCameraManager.getCameraState$().pipe(
        map((state) => {
          console.debug(
            `[PanelCameraCoordinator ${this._panelApiId}] Store emitted FOV: ${state.fov}`,
          );
          return state.fov;
        }),
        distinctUntilChanged((prev, curr) => {
          const isEqual = prev === curr;
          if (!isEqual) {
            console.debug(
              `[PanelCameraCoordinator ${this._panelApiId}] FOV changed: ${prev} -> ${curr}`,
            );
          }
          return isEqual;
        }),
      ),
      (newFov) => {
        console.debug(
          `[PanelCameraCoordinator ${this._panelApiId}] Subscription callback fired with FOV: ${newFov}`,
        );
        // Get the scene manager to update the actual Three.js camera
        const sceneManager =
          this._renderer?.renderingOrchestrator?.sceneManager;
        if (!sceneManager) {
          console.warn(
            `[PanelCameraCoordinator ${this._panelApiId}] Cannot sync FOV: SceneManager not available`,
          );
          return;
        }

        // Check the actual Three.js camera FOV (not sceneManager.fov property)
        // We call sceneManager.setFov() directly to bypass CameraManager's store guard
        // (since both managers share the same store, it's already updated by core-state)
        const actualCameraFov = sceneManager.camera?.fov;
        if (actualCameraFov !== undefined && actualCameraFov !== newFov) {
          console.debug(
            `[PanelCameraCoordinator ${this._panelApiId}] Syncing FOV: ${actualCameraFov} -> ${newFov}`,
          );
          sceneManager.setFov(newFov);
        } else {
          console.debug(
            `[PanelCameraCoordinator ${this._panelApiId}] FOV sync: camera=${actualCameraFov}, new=${newFov}, match=${actualCameraFov === newFov}`,
          );
        }
      },
    );
  }
}
