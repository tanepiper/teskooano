import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjects$,
  getSimulationState,
  panelRegistry,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { BehaviorSubject, Subscription } from "rxjs";
import * as THREE from "three";

import { OrbitManager } from "@teskooano/renderer-threejs-orbits";

import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import { layoutOrientation$, Orientation } from "./layoutStore";

import { CameraManager } from "../../camera-manager/CameraManager";

import type { DockviewController } from "../../../core/controllers/dockview/DockviewController";

import { CustomEvents } from "@teskooano/data-types";
import { RendererStats } from "@teskooano/renderer-threejs-core";
import { pluginManager } from "@teskooano/ui-plugin";
import {
  EngineToolbar,
  EngineToolbarManager,
} from "../../../core/interface/engine-toolbar";

/**
 * The parameters for the CompositeEnginePanel
 */
interface CompositePanelParams {
  /**
   * The title of the panel
   */
  title?: string;
  /**
   * The controller for the panel
   */
  dockviewController?: DockviewController;
}

/**
 * The default FOV for the panel state, aligning with SceneManager's default
 */
const DEFAULT_PANEL_FOV = 75;

/**
 * Represents the internal view state of an engine panel, including camera,
 * focus, and display options.
 */
export interface CompositeEngineState {
  /**
   * The position of the camera
   */
  cameraPosition: THREE.Vector3;
  /**
   * The target of the camera
   */
  cameraTarget: THREE.Vector3;
  /**
   * The focused object ID
   */
  focusedObjectId: string | null;
  /**
   * Whether to show the 5AU grid
   */
  showGrid?: boolean;
  /**
   * Whether to show the labels for celestial bodies
   */
  showCelestialLabels?: boolean;
  /**
   * Whether to show the AU markers (distance markers) at 1-100AU
   */
  showAuMarkers?: boolean;
  /**
   * Whether to show the debris effects
   * NOTE: currently this is buggy and kill performance, which is why it's behind a feature flag
   */
  showDebrisEffects?: boolean;
  /**
   * Whether to show the debug mode
   * NOTE: This is still a work in progress and the camera controls are not yet fully integrated
   */
  isDebugMode?: boolean;
  /**
   * The Field of View (FOV)
   */
  fov?: number;
}

let isSimulationLoopStarted = false;

/**
 * A Dockview panel component that combines a 3D engine view (`ModularSpaceRenderer`)
 * with a dynamically generated UI controls section.
 *
 * Responsibilities:
 * - Manages the lifecycle of the `ModularSpaceRenderer` instance.
 * - Provides an interface for controlling the renderer's view state (camera, visibility flags).
 * - Manages the layout and resizing between the engine view and the UI controls area.
 * - Listens to global data stores (`celestialObjectsStore`, `layoutOrientationStore`) to react to changes.
 * - Initializes UI control components based on configuration parameters.
 * - Acts as a central point for interaction between UI controls and the renderer.
 */
export class CompositeEnginePanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _engineContainer: HTMLElement | undefined;

  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  private _currentOrientation: Orientation | null = null;
  private _layoutOrientationSubscription: Subscription | null = null;
  private _celestialObjectsUnsubscribe: Subscription | null = null;
  private _simulationStateUnsubscribe: Subscription | null = null;
  private _isInitialized = false;

  private _cameraManager: CameraManager | undefined = undefined;

  private _viewStateSubject: BehaviorSubject<CompositeEngineState>;

  private _dockviewController: DockviewController | null = null;

  private _engineToolbar: EngineToolbar | null = null;

  private _trackedFloatingPanels: Map<string, DockviewPanelApi> = new Map();

  private _panelRemovedSubscription: Subscription | null = null;

  /**
   * The root HTML element for this panel.
   */
  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.classList.add("composite-engine-panel");
    this._element.style.height = "100%";
    this._element.style.width = "100%";
    this._element.style.overflow = "hidden";
    this._element.style.display = "flex";
    this._element.style.position = "relative";

    this._engineContainer = document.createElement("div");
    this._engineContainer.classList.add("engine-container");
    this._engineContainer.style.position = "relative";
    this._engineContainer.style.overflow = "hidden";
    this._element.appendChild(this._engineContainer);

    this._viewStateSubject = new BehaviorSubject<CompositeEngineState>({
      cameraPosition: new THREE.Vector3(200, 200, 200),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      focusedObjectId: null,
      showGrid: true,
      showCelestialLabels: true,
      showAuMarkers: true,
      showDebrisEffects: false,
      isDebugMode: false,
      fov: DEFAULT_PANEL_FOV,
    });
  }

  /**
   * Retrieves the current view state of the panel.
   * @returns A read-only copy of the current PanelViewState.
   */
  public getViewState(): Readonly<CompositeEngineState> {
    return this._viewStateSubject.getValue();
  }

  /**
   * Updates the panel's view state with the provided partial state.
   * Merges the updates with the existing state and applies relevant changes
   * to the underlying renderer instance.
   * @param updates - An object containing the state properties to update.
   */
  public updateViewState(updates: Partial<CompositeEngineState>): void {
    const currentState = this._viewStateSubject.getValue();
    this._viewStateSubject.next({
      ...currentState,
      ...updates,
    });
    this.applyViewStateToRenderer(updates);
  }

  /**
   * Subscribes a callback function to changes in the panel's view state.
   * @param callback - The function to call whenever the state changes.
   * @returns An unsubscribe function to stop listening to state updates.
   */
  public subscribeToViewState(
    callback: (state: CompositeEngineState) => void,
  ): Subscription {
    return this._viewStateSubject.subscribe(callback);
  }

  /**
   * Returns the internal ModularSpaceRenderer instance, if initialized.
   * @returns The renderer instance or undefined.
   */
  public getRenderer(): ModularSpaceRenderer | undefined {
    return this._renderer;
  }

  /**
   * Retrieves performance statistics from the renderer's animation loop.
   * @returns An object containing stats like FPS, draw calls, etc., or null if unavailable.
   */
  public getRendererStats(): RendererStats | null {
    if (this._renderer?.animationLoop) {
      return this._renderer.animationLoop.getCurrentStats();
    } else {
      return null;
    }
  }

  /**
   * Provides access to the OrbitManager instance within the renderer, if available.
   * Useful for direct manipulation or querying of orbit visualization data.
   */
  public get orbitManager(): OrbitManager | undefined {
    return this._renderer?.orbitManager;
  }

  /**
   * Provides access to the CameraManager instance.
   * @returns The CameraManager instance or undefined if not initialized.
   */
  public get cameraManager(): CameraManager | undefined {
    return this._cameraManager;
  }

  /**
   * Provides access to the view state subject.
   * @returns The view state BehaviorSubject.
   */
  public get viewState$(): BehaviorSubject<CompositeEngineState> {
    return this._viewStateSubject;
  }

  /**
   * Provides access to the DockviewController instance.
   * @returns The DockviewController instance or null if not initialized.
   */
  public get dockviewController(): DockviewController | null {
    return this._dockviewController;
  }

  /**
   * Provides access to the EngineToolbar instance.
   * @returns The EngineToolbar instance or null if not initialized.
   */
  public get engineToolbar(): EngineToolbar | null {
    return this._engineToolbar;
  }

  /**
   * Provides access to the tracked floating panels.
   * @returns The tracked floating panels.
   */
  public get trackedFloatingPanels(): Map<string, DockviewPanelApi> {
    return this._trackedFloatingPanels;
  }

  /**
   * Applies specific view state updates directly to the renderer's components.
   * This is called internally when the view state is updated.
   * @param updates - The partial view state containing changes to apply.
   */
  private applyViewStateToRenderer(
    updates: Partial<CompositeEngineState>,
  ): void {
    if (!this._renderer) return;

    if (updates.showGrid !== undefined) {
      this._renderer.sceneManager?.setGridVisible(updates.showGrid);
    }
    if (
      updates.showCelestialLabels !== undefined &&
      this._renderer.css2DManager
    ) {
      this._renderer.css2DManager.setLayerVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        updates.showCelestialLabels,
      );
    }
    if (updates.showAuMarkers !== undefined) {
      this._renderer.sceneManager.setAuMarkersVisible(updates.showAuMarkers);
    }
    if (updates.fov !== undefined) {
      this._renderer.sceneManager.setFov(updates.fov);
    }
    if (updates.isDebugMode !== undefined) {
      this._renderer.setDebugMode(updates.isDebugMode);
    }
  }

  /**
   * Toggles the visibility of the 5AU grid.
   * @param visible - Whether to show the grid.
   */
  public setShowGrid(visible: boolean): void {
    this.updateViewState({ showGrid: visible });
  }
  /**
   * Toggles the visibility of celestial body labels.
   * @param visible - Whether to show the labels.
   */
  public setShowCelestialLabels(visible: boolean): void {
    this.updateViewState({ showCelestialLabels: visible });
  }
  /**
   * Toggles the visibility of Astronomical Unit (AU) markers.
   * @param visible - Whether to show the markers.
   */
  public setShowAuMarkers(visible: boolean): void {
    this.updateViewState({ showAuMarkers: visible });
  }
  /**
   * Enables or disables debris effects (placeholder).
   * @param visible - Whether to show the debris effects.
   */
  public setDebrisEffectsEnabled(visible: boolean): void {
    this.updateViewState({ showDebrisEffects: visible });
  }
  /**
   * Sets the camera's Field of View (FOV).
   * @param fov - The new FOV value.
   */
  public setFov(fov: number): void {
    if (this._cameraManager) {
      this._cameraManager.setFov(fov);
    } else {
      console.warn(
        `[CompositePanel ${this._api?.id}] setFov called before CameraManager was initialized.`,
      );
    }
  }

  /**
   * Moves the camera to focus on a specific celestial object or clears focus.
   * Delegates the call to the CameraManager.
   * @param objectId - The unique ID of the object to focus on, or null to clear focus.
   * @param distance - Optional distance multiplier for the camera offset.
   */
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (this._cameraManager) {
      this._cameraManager.focusOnObject(objectId, distance);
    } else {
      console.warn(
        `[CompositePanel ${this._api?.id}] focusOnObject called before CameraManager was initialized.`,
      );
    }
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Delegates the call to the CameraManager.
   */
  public resetCameraView(): void {
    if (this._cameraManager) {
      this._cameraManager.resetCameraView();
    } else {
      console.warn(
        `[CompositePanel ${this._api?.id}] resetCameraView called before CameraManager was initialized.`,
      );
    }
  }

  /**
   * Clears the current focus, equivalent to focusing on null.
   * Delegates the call to the CameraManager.
   */
  public clearFocus(): void {
    if (this._cameraManager) {
      this._cameraManager.clearFocus();
    } else {
      console.warn(
        `[CompositePanel ${this._api?.id}] clearFocus called before CameraManager was initialized.`,
      );
    }
  }

  /**
   * Enables or disables the global renderer debug mode.
   * @param enabled - Whether to enable the debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    this.updateViewState({ isDebugMode: enabled });
  }

  /**
   * Requests the renderer to resize on the next animation frame.
   * Ensures rendering adapts to container size changes.
   */
  private triggerResize(): void {
    requestAnimationFrame(() => {
      if (this._engineContainer && this._renderer) {
        const { clientWidth, clientHeight } = this._engineContainer;

        if (clientWidth > 0 && clientHeight > 0) {
          this._renderer.onResize(clientWidth, clientHeight);
        }
      }
    });
  }

  /**
   * Creates placeholder content for the panel.
   * @returns The placeholder content.
   */
  private _createPlaceholderContent(): string {
    return `
      <div style='display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; width: 100%; text-align: center; padding: 1em; box-sizing: border-box;'>
        <img src='/assets/panel-icon.png' alt='Engine Placeholder Icon' style='max-width: 256px; max-height: 256px; margin-bottom: 1em; opacity: 0.5;' />
        <p style='color: #aaa; margin: 0;'>Load or Generate a System</p>
      </div>
    `;
  }
  /**
   * Dockview lifecycle method: Initializes the panel's content and renderer.
   * Sets up data listeners, placeholders, and the PanelResizer.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  init(parameters: GroupPanelPartInitParameters): void {
    if (this._isInitialized && this._dockviewController) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };

    this._dockviewController = this._params?.params?.dockviewController ?? null;

    if (!this._dockviewController) {
      console.error(
        `[CompositePanel ${this._api?.id}] DockviewController instance was not provided in params. Toolbar actions will fail.`,
      );
    }

    this._api = parameters.api;
    this._element.id = `composite-engine-view-${this._api?.id}`;

    if (this._engineContainer) {
      this._engineContainer.innerHTML = this._createPlaceholderContent();
    }

    this._celestialObjectsUnsubscribe?.unsubscribe();
    this._celestialObjectsUnsubscribe = celestialObjects$.subscribe(
      (celestialObjects) => {
        if (!this._element.isConnected) {
          return;
        }

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0) {
          if (this._engineContainer) this._engineContainer.innerHTML = "";

          this.initializeRenderer();
          this.initializeToolbar();

          if (!isSimulationLoopStarted) {
            startSimulationLoop();
            isSimulationLoopStarted = true;
          }

          this.triggerResize();
        } else if (this._renderer && objectCount === 0) {
          this.disposeRendererAndUI();

          if (this._engineContainer && !this._renderer) {
            this._engineContainer.innerHTML = this._createPlaceholderContent();
          }
        }
      },
    );

    this._isInitialized = true;

    this._simulationStateUnsubscribe?.unsubscribe();
    this._simulationStateUnsubscribe = simulationState$.subscribe(
      this.handleSimulationStateChange,
    );

    if (this._dockviewController) {
      this._panelRemovedSubscription =
        this._dockviewController.onPanelRemoved$.subscribe((panelId) => {
          this.handleExternalPanelRemoval(panelId);
        });
    } else {
      console.warn(
        "CompositeEnginePanel: DockviewController not provided, cannot subscribe to panel removals.",
      );
    }

    this._layoutOrientationSubscription = layoutOrientation$.subscribe(
      (orientation) => {
        this._currentOrientation = orientation;

        if (this._isInitialized) {
          this.triggerResize();
        }
      },
    );
  }

  /**
   * Initializes the `ModularSpaceRenderer` instance and sets up
   * its initial state and event listeners.
   */
  private initializeRenderer(): void {
    if (!this._engineContainer || this._renderer) return;

    try {
      this._renderer = new ModularSpaceRenderer(this._engineContainer, {
        antialias: true,
        shadows: true,
        hdr: true,
        background: "black",
        showGrid: this._viewStateSubject.getValue().showGrid,
        showCelestialLabels: true,
        showAuMarkers: this._viewStateSubject.getValue().showAuMarkers,
      });

      if (!this._simulationStateUnsubscribe) {
        this._simulationStateUnsubscribe = simulationState$.subscribe(
          this.handleSimulationStateChange,
        );
      }

      this.handleSimulationStateChange(getSimulationState());

      const cameraManagerInstance =
        pluginManager.getManagerInstance<CameraManager>("camera-manager");
      this._cameraManager = cameraManagerInstance;

      if (!this._cameraManager) {
        console.error(
          `[CompositePanel ${this._api?.id}] Failed to get CameraManager instance! Camera controls will be unavailable.`,
        );

        return;
      }

      const initialViewState = this._viewStateSubject.getValue();

      try {
        this._cameraManager.setDependencies({
          renderer: this._renderer,
          initialFov: initialViewState.fov,
          initialFocusedObjectId: initialViewState.focusedObjectId,
          initialCameraPosition: initialViewState.cameraPosition,
          initialCameraTarget: initialViewState.cameraTarget,
          onFocusChangeCallback: (focusedId: string | null) => {
            this.updateViewState({ focusedObjectId: focusedId });
          },
        });

        if (this._cameraManager) this._cameraManager.initializeCameraPosition();

        if (this._cameraManager) {
          this._cameraManager.getCameraState$().subscribe((cameraState) => {
            if (!this._isInitialized || !this.element.isConnected) return;

            const currentPanelState = this._viewStateSubject.getValue();
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
              this._viewStateSubject.next({
                ...currentPanelState,
                ...updates,
              });
            }
          });
        }

        if (this._renderer && this.element.isConnected && this._api?.id) {
          this.element.dispatchEvent(
            new CustomEvent(CustomEvents.RENDERER_READY, {
              bubbles: true,
              composed: true,
              detail: { panelId: this._api.id, renderer: this._renderer },
            }),
          );
        }

        this._renderer.startRenderLoop();

        this._resizeObserver = new ResizeObserver((entries) => {
          for (let _ of entries) {
            this.triggerResize();
          }
        });
        this._resizeObserver.observe(this._engineContainer);

        this.applyViewStateToRenderer(this.getViewState());
      } catch (error) {
        console.error(
          `[CompositePanel ${this._api?.id}] Failed to set CameraManager dependencies:`,
          error,
        );
        this._cameraManager = undefined;
      }
    } catch (error) {
      console.error(
        `Failed to initialize CompositePanel [${this._api?.id}] renderer:`,
        error,
      );
      if (this._engineContainer) {
        this._engineContainer.textContent = `Error initializing engine renderer: ${error}`;
        this._engineContainer.style.color = "red";
        this._engineContainer.style.padding = "1em";
      }
    }
  }

  /**
   * Handles changes in the global simulation state, updating the renderer as needed.
   * @param newState The latest simulation state.
   */
  private handleSimulationStateChange = (_: SimulationState): void => {
    if (!this._renderer?.orbitManager) return;
  };

  /**
   * Initializes the overlay toolbar using the EngineToolbar component.
   */
  private initializeToolbar(): void {
    if (!this._api?.id) {
      console.error(
        "CompositeEnginePanel: Cannot initialize toolbar without panel API ID.",
      );
      return;
    }

    const toolbarManager =
      pluginManager.getManagerInstance<EngineToolbarManager>(
        "engine-toolbar-manager",
      );

    if (!toolbarManager) {
      console.error(
        "[CompositeEnginePanel] EngineToolbarManager not found! Cannot create toolbar.",
      );
      return;
    }

    this._engineToolbar = toolbarManager.createToolbarForPanel(
      this._api.id,
      this._element,
      this._dockviewController!,
      this,
    );
  }

  /**
   * Cleans up the renderer instance, UI controls, and associated observers/listeners.
   * Called when data disappears or the panel is disposed.
   */
  private disposeRendererAndUI(): void {
    this._renderer?.dispose();
    this._renderer = undefined;

    const toolbarManager =
      pluginManager.getManagerInstance<EngineToolbarManager>(
        "engine-toolbar-manager",
      );

    if (toolbarManager && this._api?.id) {
      toolbarManager.disposeToolbarForPanel(this._api.id);
      this._engineToolbar = null;
    } else {
      console.error(
        "[CompositeEnginePanel] EngineToolbarManager not found or API ID missing during dispose!",
      );

      this._engineToolbar?.dispose();
      this._engineToolbar = null;
    }

    this._trackedFloatingPanels.forEach((panelApi) => {
      try {
        panelApi.close();
      } catch (e) {
        console.warn(
          `Error closing tracked panel ${panelApi.id} during dispose:`,
          e,
        );
      }
    });
    this._trackedFloatingPanels.clear();

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }

    this._cameraManager = undefined;
  }

  /**
   * Dockview lifecycle method: Cleans up all resources associated with the panel.
   * Stops listeners, disposes the renderer, and unregisters the panel.
   */
  dispose(): void {
    this.disposeRendererAndUI();

    this._panelRemovedSubscription?.unsubscribe();
    this._panelRemovedSubscription = null;

    this._celestialObjectsUnsubscribe?.unsubscribe();
    this._celestialObjectsUnsubscribe = null;
    this._simulationStateUnsubscribe?.unsubscribe();
    this._simulationStateUnsubscribe = null;
    this._layoutOrientationSubscription?.unsubscribe();
    this._layoutOrientationSubscription = null;
    this._currentOrientation = null;

    panelRegistry.unregisterPanel(this._api?.id ?? "unknown");
  }

  private handleExternalPanelRemoval(panelId: string): void {
    if (this._trackedFloatingPanels.has(panelId)) {
      this._trackedFloatingPanels.delete(panelId);
    } else {
    }
  }

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    this._cameraManager?.pointCameraAt(targetPosition);
  }

  /**
   * Called by the EngineToolbar when its toggle button is clicked.
   * This method requests the EngineToolbarManager to toggle the state.
   */
  public requestToolbarToggle(): void {
    if (!this._api?.id) {
      console.error(
        "[CompositeEnginePanel] Cannot toggle toolbar without API ID.",
      );
      return;
    }

    const managerInstance =
      pluginManager.getManagerInstance<EngineToolbarManager>(
        "engine-toolbar-manager",
      );

    if (!managerInstance) {
      console.error(
        "[CompositeEnginePanel] EngineToolbarManager instance not found! Cannot toggle toolbar.",
      );
      return;
    }

    managerInstance.toggleToolbarExpansion(this._api.id);
  }

  /**
   * Provides access to the singleton EngineToolbarManager instance.
   * Called by EngineToolbar to subscribe to state.
   */
  public getToolbarManagerInstance(): EngineToolbarManager | null {
    const managerInstance =
      pluginManager.getManagerInstance<EngineToolbarManager>(
        "engine-toolbar-manager",
      );
    if (!managerInstance) {
      console.error(
        "[CompositeEnginePanel] EngineToolbarManager instance not found!",
      );
      return null;
    }
    return managerInstance;
  }
}
