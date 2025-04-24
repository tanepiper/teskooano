import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjectsStore,
  panelRegistry,
  simulationState, // Import global simulation state
  type SimulationState, // Import state type
} from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { atom, type WritableAtom } from "nanostores";
import { Subscription } from "rxjs"; // Import Subscription
import * as THREE from "three";

import { OrbitManager } from "@teskooano/renderer-threejs-visualization";

import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import { layoutOrientationStore, Orientation } from "../../stores/layoutStore";

import { CameraManager } from "./CameraManager";

import type { DockviewController } from "../../controllers/dockview/DockviewController"; // Import controller type

import { EngineToolbar } from "./EngineToolbar";
import { RendererStats } from "@teskooano/renderer-threejs-core";
import { CustomEvents } from "@teskooano/data-types";

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
  dockviewController?: DockviewController; // Expect controller to be passed in
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

  // --- View Orientation Handling ---
  private _currentOrientation: Orientation | null = null;
  private _celestialObjectsUnsubscribe: (() => void) | null = null; // Renamed for clarity
  private _simulationStateUnsubscribe: (() => void) | null = null; // For global state
  private _isInitialized = false;

  // --- Add CameraManager instance ---
  private _cameraManager: CameraManager | undefined;

  // --- Internal View State Store (Copied from old EnginePanel) ---
  private _viewStateStore: WritableAtom<CompositeEngineState>;

  // --- Dockview Controller Instance ---
  private _dockviewController: DockviewController | null = null;

  // --- Add EngineToolbar Instance ---
  private _engineToolbar: EngineToolbar | null = null;

  // --- Track Open Floating Panels ---
  private _trackedFloatingPanels: Map<string, DockviewPanelApi> = new Map();

  // --- RxJS Subscription for Panel Removal ---
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

    this._viewStateStore = atom<CompositeEngineState>({
      cameraPosition: new THREE.Vector3(200, 200, 200), // Default starting position
      cameraTarget: new THREE.Vector3(0, 0, 0), // Default starting target
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
    return this._viewStateStore.get();
  }

  /**
   * Updates the panel's view state with the provided partial state.
   * Merges the updates with the existing state and applies relevant changes
   * to the underlying renderer instance.
   * @param updates - An object containing the state properties to update.
   */
  public updateViewState(updates: Partial<CompositeEngineState>): void {
    this._viewStateStore.set({
      ...this._viewStateStore.get(),
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
  ): () => void {
    return this._viewStateStore.subscribe(callback);
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
   * Provides access to the view state store.
   * @returns The view state store.
   */
  public get viewStateStore(): WritableAtom<CompositeEngineState> {
    return this._viewStateStore;
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
      this._renderer.sceneManager.setGridVisible(updates.showGrid);
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
    if (updates.showDebrisEffects !== undefined) {
      this._renderer.setDebrisEffectsEnabled(updates.showDebrisEffects);
    }
    if (updates.fov !== undefined) {
      this._renderer.sceneManager.setFov(updates.fov);
    }
    if (updates.isDebugMode !== undefined) {
      this._renderer.setDebugMode(updates.isDebugMode);
    }
    // Add other state applications here as needed
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
    // Check if camera manager exists before calling
    if (this._cameraManager) {
      this._cameraManager.setFov(fov);
    } else {
      console.warn(
        `[CompositePanel ${this._api?.id}] setFov called before CameraManager was initialized.`,
      );
      // Optionally update the state directly as a fallback if needed before init
      this.updateViewState({ fov });
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
    // Debounce resize slightly using requestAnimationFrame
    requestAnimationFrame(() => {
      if (this._engineContainer && this._renderer) {
        const { clientWidth, clientHeight } = this._engineContainer;
        // Only resize if dimensions are valid
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
    // Check initialization flag AND if dockviewController is set
    if (this._isInitialized && this._dockviewController) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };
    // Store the DockviewController instance from params
    this._dockviewController = this._params?.params?.dockviewController ?? null;

    if (!this._dockviewController) {
      console.error(
        `[CompositePanel ${this._api?.id}] DockviewController instance was not provided in params. Toolbar actions will fail.`,
      );
      // Optionally display an error message in the panel
    }

    this._api = parameters.api;
    this._element.id = `composite-engine-view-${this._api?.id}`; // Ensure unique ID

    // --- Set initial placeholder content ---
    if (this._engineContainer) {
      this._engineContainer.innerHTML = this._createPlaceholderContent();
    }

    // Subscribe to celestial objects data to trigger renderer/UI setup
    this._celestialObjectsUnsubscribe?.(); // Clean up previous listener if any
    this._celestialObjectsUnsubscribe = celestialObjectsStore.subscribe(
      (celestialObjects) => {
        // Only proceed if the panel hasn't been disposed
        if (!this._element.isConnected) {
          return; // Don't initialize if element is detached
        }

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0) {
          // Data available, renderer not initialized: Initialize

          // Clear placeholder before initializing renderer
          if (this._engineContainer) this._engineContainer.innerHTML = "";

          this.initializeRenderer();
          this.initializeToolbar(); // Initialize the new toolbar

          // Start simulation loop globally (if not already started)
          if (!isSimulationLoopStarted) {
            startSimulationLoop();
            isSimulationLoopStarted = true;
          }

          this.triggerResize(); // Trigger initial resize
        } else if (this._renderer && objectCount === 0) {
          // Renderer exists, but data disappeared: Dispose renderer/UI

          this.disposeRendererAndUI(); // Clean up
          // Reset to placeholder state
          if (this._engineContainer && !this._renderer) {
            this._engineContainer.innerHTML = this._createPlaceholderContent();
          }
        }
      },
    );

    this._isInitialized = true; // Mark as initialized *after* setup

    // Subscribe to global simulation state *after* initialization
    this._simulationStateUnsubscribe?.(); // Clean up previous if any (unlikely here)
    this._simulationStateUnsubscribe = simulationState.subscribe(
      this.handleSimulationStateChange,
    );

    // --- Subscribe to Panel Removals from DockviewController ---
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
    // Set initial orientation and start listening for changes
    this._currentOrientation = layoutOrientationStore.get();

    layoutOrientationStore.subscribe((orientation) => {
      this._currentOrientation = orientation;
    });
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
        showGrid: this._viewStateStore.get().showGrid,
        showCelestialLabels: true, // Defaulting to true, controlled by state later
        showAuMarkers: this._viewStateStore.get().showAuMarkers,
      });

      // --- Subscribe to simulation state for visual settings ---
      // Note: We also subscribe in init(), but need to ensure we capture initial state
      //       if the renderer initializes *after* the first state emit.
      if (!this._simulationStateUnsubscribe) {
        // Avoid double subscription
        this._simulationStateUnsubscribe = simulationState.subscribe(
          this.handleSimulationStateChange,
        );
      }
      // Apply initial simulation state values that affect the renderer
      this.handleSimulationStateChange(simulationState.get());

      // --- Initialize Camera Manager ---
      this._cameraManager = new CameraManager({
        renderer: this._renderer,
        viewStateAtom: this._viewStateStore,
        // Provide a callback for the CameraManager to notify the panel of focus changes
        // This allows the panel (or other interested components) to react, e.g., update UI state
        onFocusChangeCallback: (focusedId) => {
          console.log(
            `[CompositePanel ${this._api?.id}] CameraManager focus changed to ${focusedId}.`,
          );
          // Example: Log the focus change, could also dispatch an event
          // We could dispatch the 'renderer-focus-changed' event here if needed externally
          // this.dispatchFocusChangeEvent(); // Assuming this method is re-added or handled differently
        },
      });
      // Set initial camera position using the manager
      this._cameraManager.initializeCameraPosition();
      // --- End Initialize Camera Manager ---

      // Dispatch event indicating the renderer is ready
      if (this._renderer && this.element.isConnected && this._api?.id) {
        this.element.dispatchEvent(
          new CustomEvent(CustomEvents.RENDERER_READY, {
            bubbles: true,
            composed: true,
            detail: { panelId: this._api.id, renderer: this._renderer },
          }),
        );
        console.log(
          `[CompositePanel ${this._api.id}] Dispatched CustomEvents.RENDERER_READY.`,
        );
      }

      this._renderer.startRenderLoop();

      // Setup resize observer for the engine container
      this._resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // Use triggerResize for debouncing
          this.triggerResize();
        }
      });
      this._resizeObserver.observe(this._engineContainer);

      // Apply Initial State Immediately after renderer creation
      this.applyViewStateToRenderer(this.getViewState());
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
  private handleSimulationStateChange = (newState: SimulationState): void => {
    if (!this._renderer?.orbitManager) return; // Need orbit manager
  };

  /**
   * Initializes the overlay toolbar using the EngineToolbar component.
   */
  private initializeToolbar(): void {
    // Ensure we have the API ID before creating the toolbar
    if (!this._api?.id) {
      console.error(
        "CompositeEnginePanel: Cannot initialize toolbar without panel API ID.",
      );
      return;
    }

    // Clean up any existing toolbar instance
    this._engineToolbar?.dispose();

    // Create and append the new toolbar - pass this instance as parentEngine
    this._engineToolbar = new EngineToolbar(
      this._api.id,
      this._dockviewController!,
      this,
    );
    this._element.appendChild(this._engineToolbar.element);
  }

  /**
   * Cleans up the renderer instance, UI controls, and associated observers/listeners.
   * Called when data disappears or the panel is disposed.
   */
  private disposeRendererAndUI(): void {
    this._renderer?.dispose();
    this._renderer = undefined;

    // --- Dispose EngineToolbar ---
    if (this._engineToolbar) {
      this._engineToolbar.dispose();
      this._engineToolbar = null;
    }
    // --- End Dispose EngineToolbar ---

    // Close any tracked floating panels when the engine panel is disposed
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

    // Destroy the CameraManager (handles its own listener cleanup)
    this._cameraManager?.destroy();
    this._cameraManager = undefined;
  }

  /**
   * Dockview lifecycle method: Cleans up all resources associated with the panel.
   * Stops listeners, disposes the renderer, and unregisters the panel.
   */
  dispose(): void {
    console.log(
      `CompositeEnginePanel (${this._api?.id ?? "unknown"}): Disposing.`,
    );
    this.disposeRendererAndUI();

    // --- Unsubscribe from Panel Removals ---
    this._panelRemovedSubscription?.unsubscribe();
    this._panelRemovedSubscription = null;
    // --- End Unsubscribe ---

    // Unsubscribe from nanostores
    this._celestialObjectsUnsubscribe?.();
    this._celestialObjectsUnsubscribe = null;
    this._simulationStateUnsubscribe?.();
    this._simulationStateUnsubscribe = null;

    // Unregister from Panel Registry
    panelRegistry.unregisterPanel(this._api?.id ?? "unknown");
  }

  // --- Method to handle external panel removal (NO CHANGE NEEDED HERE) ---
  private handleExternalPanelRemoval(panelId: string): void {
    if (this._trackedFloatingPanels.has(panelId)) {
      console.log(
        `CompositeEnginePanel: Detected external removal of tracked floating panel: ${panelId}. Updating internal state.`,
      );
      this._trackedFloatingPanels.delete(panelId);
      // Optionally, update toolbar button state if needed here
    } else {
      // Panel removed was not one we were tracking (e.g., a different floating panel, or a docked panel)
      // console.log(`CompositeEnginePanel: Ignoring external removal of untracked panel: ${panelId}`);
    }
  }
  // --- END ADDED ---

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    this._cameraManager?.pointCameraAt(targetPosition);
  }
}
