import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjects$,
  getSimulationState,
  panelRegistry,
  simulationState$,
  type SimulationState,
  getCelestialObjects,
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
import { template } from "./CompositeEnginePanel.template.js"; // Import the template
import { applyViewStateToRenderer } from "./CompositeEnginePanel.utils.js"; // Import the utility function

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
   * Whether to show orbit lines for celestial bodies.
   * Defaults to true.
   */
  showOrbitLines?: boolean;
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
export class CompositeEnginePanel
  extends HTMLElement
  implements IContentRenderer
{
  private _engineContainer: HTMLElement | null = null;
  private _placeholderWrapper: HTMLElement | null = null;
  private _placeholderMessage: HTMLParagraphElement | null = null;
  private _placeholderActionArea: HTMLDivElement | null = null;

  private _isGeneratingSystem = false;

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
   * The root HTML element for this panel (fulfills IContentRenderer for custom elements).
   */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super(); // Call super for HTMLElement
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get references to elements in the shadow DOM
    this._engineContainer = this.shadowRoot!.querySelector(".engine-container");
    this._placeholderWrapper = this.shadowRoot!.querySelector(
      "#engine-placeholder-wrapper",
    );
    this._placeholderMessage = this.shadowRoot!.querySelector(
      "#placeholder-message",
    );
    this._placeholderActionArea = this.shadowRoot!.querySelector(
      "#placeholder-action-area",
    );

    this._viewStateSubject = new BehaviorSubject<CompositeEngineState>({
      cameraPosition: new THREE.Vector3(200, 200, 200),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      focusedObjectId: null,
      showGrid: true,
      showCelestialLabels: true,
      showAuMarkers: true,
      showDebrisEffects: false,
      showOrbitLines: true,
      isDebugMode: false,
      fov: DEFAULT_PANEL_FOV,
    });

    this._handleSystemGenerationStart =
      this._handleSystemGenerationStart.bind(this);
    this._handleSystemGenerationComplete =
      this._handleSystemGenerationComplete.bind(this);
    this.handleSimulationStateChange =
      this.handleSimulationStateChange.bind(this);
  }

  connectedCallback(): void {
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] connectedCallback`,
    );
    // Add window-level event listeners here
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );

    // If init has already run and provided an API, re-evaluate subscriptions
    // This handles cases where the element is re-added to the DOM after init
    if (this._isInitialized && this._api) {
      // Re-establish subscriptions that might have been missed or need refresh
      // if their setup was conditional on isConnected previously.
      this._layoutOrientationSubscription?.unsubscribe();
      this._layoutOrientationSubscription = layoutOrientation$.subscribe(
        (orientation) => {
          this._currentOrientation = orientation;
          if (this.isConnected) {
            // Check isConnected before triggering resize
            this.triggerResize();
          }
        },
      );

      // The celestialObjects$ and simulationState$ subscriptions are typically set up in init
      // and their internal callbacks already check this.isConnected.
      // However, ensure they are active if init has run.
      if (!this._celestialObjectsUnsubscribe) {
        // Or some other flag indicating it needs re-subbing
        this._subscribeToCelestialObjects();
      }
      if (!this._simulationStateUnsubscribe) {
        this._subscribeToSimulationState();
      }
    }
  }

  disconnectedCallback(): void {
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] disconnectedCallback`,
    );
    // Remove window-level event listeners here
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );

    // Optionally, unsubscribe from RxJS subscriptions that don't clean up themselves
    // or that shouldn't run if the element is not in the DOM.
    // Dockview's dispose() is the primary cleanup for panel-specific resources.
    this._layoutOrientationSubscription?.unsubscribe();
    // Defer full cleanup of _celestialObjectsUnsubscribe & _simulationStateUnsubscribe to dispose(),
    // as they are tied to the panel's lifecycle via init/dispose from Dockview.
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
    applyViewStateToRenderer(this._renderer, updates);
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
      this._cameraManager.followObject(objectId, distance);
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
   * Updates the placeholder content based on the generation state.
   * @param isGenerating - True if the system is currently generating.
   */
  private _updatePlaceholderContent(isGenerating: boolean): void {
    if (
      !this._placeholderWrapper ||
      !this._placeholderMessage ||
      !this._placeholderActionArea
    ) {
      console.warn(
        "[CompositePanel] Placeholder elements not found in shadow DOM.",
      );
      return;
    }

    if (isGenerating) {
      this._placeholderMessage.textContent = "Generating System...";
      this._placeholderActionArea.innerHTML = `<progress style='width: 100%;'></progress>`;
      this._placeholderWrapper.classList.remove("hidden");
      if (this._engineContainer) this._engineContainer.style.display = "none";
    } else {
      this._placeholderMessage.textContent = "Load or Generate a System";
      this._placeholderActionArea.innerHTML = `<a href="https://teskooano.space/docs/getting-started" target="_blank" style="display: inline-block; padding: 8px 15px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">📚 Go To Documentation</a>`;
      this._placeholderWrapper.classList.remove("hidden");
      if (this._engineContainer) this._engineContainer.style.display = "none";
    }
  }

  private _hidePlaceholder(): void {
    if (this._placeholderWrapper) {
      this._placeholderWrapper.classList.add("hidden");
    }
    if (this._engineContainer) {
      this._engineContainer.style.display = "block"; // Or 'flex' or whatever its default is
    }
  }

  private _handleSystemGenerationStart(): void {
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] SYSTEM_GENERATION_START received.`,
    );
    this._isGeneratingSystem = true;
    if (!this._renderer) {
      // Only show if renderer isn't active
      this._updatePlaceholderContent(true);
    }
  }

  private _handleSystemGenerationComplete(): void {
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] SYSTEM_GENERATION_COMPLETE received.`,
    );
    this._isGeneratingSystem = false;
    const objectCount = Object.keys(getCelestialObjects()).length;

    if (!this._renderer) {
      // If renderer is not yet up
      if (objectCount > 0) {
        console.debug(
          `[CompositePanel ${this._api?.id || this.id}] Generation complete, objects present. Initializing renderer.`,
        );
        this._hidePlaceholder(); // Hide placeholder, show engine container

        this.initializeRenderer();
        this.initializeToolbar();

        if (!isSimulationLoopStarted) {
          startSimulationLoop();
          isSimulationLoopStarted = true;
        }
        this.triggerResize();
      } else {
        // No objects, generation complete, no renderer. Show default placeholder.
        this._updatePlaceholderContent(false);
      }
    }
  }

  // Helper method to encapsulate celestial object subscription logic
  private _subscribeToCelestialObjects(): void {
    this._celestialObjectsUnsubscribe?.unsubscribe();
    this._celestialObjectsUnsubscribe = celestialObjects$.subscribe(
      (celestialObjects) => {
        if (!this.isConnected) {
          return;
        }
        console.debug(
          `[CompositePanel ${this._api?.id || this.id}] celestialObjects updated`,
          Object.keys(celestialObjects).length,
        );

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0 && !this._isGeneratingSystem) {
          this._hidePlaceholder();

          this.initializeRenderer();
          this.initializeToolbar();

          if (!isSimulationLoopStarted) {
            startSimulationLoop();
            isSimulationLoopStarted = true;
          }
          this.triggerResize();
        } else if (this._renderer && objectCount === 0) {
          this.disposeRendererAndUI();
          this._updatePlaceholderContent(this._isGeneratingSystem); // Show appropriate placeholder
        }
      },
    );
  }

  // Helper method for simulation state subscription
  private _subscribeToSimulationState(): void {
    this._simulationStateUnsubscribe?.unsubscribe();
    this._simulationStateUnsubscribe = simulationState$.subscribe(
      this.handleSimulationStateChange,
    );
  }

  /**
   * Dockview lifecycle method: Initializes the panel's content and renderer.
   * Sets up data listeners, placeholders, and the PanelResizer.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  init(parameters: GroupPanelPartInitParameters): void {
    // Dockview provides an API object through parameters.api
    this._api = parameters.api;
    // this.id is the HTMLElement id, this._api.id is Dockview's panel id.
    // Ensure the element has an ID if needed for external styling or query, though shadow DOM encapsulates.
    if (!this.id) this.id = `composite-engine-view-${this._api.id}`;
    console.debug(`[CompositePanel ${this._api.id}] init called.`);

    if (this._isInitialized && this._dockviewController) {
      console.warn(
        `[CompositePanel ${this._api.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };

    this._dockviewController = this._params?.params?.dockviewController ?? null;

    if (!this._dockviewController) {
      console.error(
        `[CompositePanel ${this._api.id}] DockviewController instance was not provided in params. Toolbar actions will fail.`,
      );
    }

    // Initial content setup based on current generation state
    // Ensure _engineContainer is queried from shadowRoot if not done in constructor for some reason
    if (!this._engineContainer)
      this._engineContainer =
        this.shadowRoot!.querySelector(".engine-container");
    if (!this._placeholderWrapper)
      this._placeholderWrapper = this.shadowRoot!.querySelector(
        "#engine-placeholder-wrapper",
      );
    if (!this._placeholderMessage)
      this._placeholderMessage = this.shadowRoot!.querySelector(
        "#placeholder-message",
      );
    if (!this._placeholderActionArea)
      this._placeholderActionArea = this.shadowRoot!.querySelector(
        "#placeholder-action-area",
      );

    this._updatePlaceholderContent(this._isGeneratingSystem);

    // Subscriptions are now managed by connectedCallback or here if they depend on init params
    this._subscribeToCelestialObjects();
    this._subscribeToSimulationState();

    // layoutOrientation$ subscription is better in connectedCallback as it doesn't depend on init params.
    // Ensure it's active if already connected.
    if (this.isConnected && !this._layoutOrientationSubscription) {
      this._layoutOrientationSubscription = layoutOrientation$.subscribe(
        (orientation) => {
          this._currentOrientation = orientation;
          if (this.isConnected) {
            this.triggerResize();
          }
        },
      );
    }

    if (this._dockviewController) {
      this._panelRemovedSubscription?.unsubscribe(); // Ensure no duplicates if init is called again
      this._panelRemovedSubscription =
        this._dockviewController.onPanelRemoved$.subscribe((panelId) => {
          this.handleExternalPanelRemoval(panelId);
        });
    } else {
      console.warn(
        "CompositeEnginePanel: DockviewController not provided, cannot subscribe to panel removals.",
      );
    }

    this._isInitialized = true;
  }

  /**
   * Initializes the `ModularSpaceRenderer` instance and sets up
   * its initial state and event listeners.
   */
  private initializeRenderer(): void {
    if (!this._engineContainer || this._renderer) return;
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] initializeRenderer`,
    );

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

        // Dispatch an event indicating the composite panel and its managers are ready
        if (this.element.isConnected && this._api?.id) {
          console.debug(
            `[CompositePanel ${this._api.id}] Dispatching ${CustomEvents.COMPOSITE_ENGINE_INITIALIZED}`,
          );
          this.dispatchEvent(
            // Dispatch from the custom element itself
            new CustomEvent(CustomEvents.COMPOSITE_ENGINE_INITIALIZED, {
              bubbles: true,
              composed: true,
              detail: {
                panelId: this._api.id,
                parentInstance: this, // Pass the whole panel instance
              },
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

        // Call the utility function, passing this._renderer and current view state
        applyViewStateToRenderer(this._renderer, this.getViewState());
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
      this,
      this._dockviewController!,
      this,
    );
  }

  /**
   * Cleans up the renderer instance, UI controls, and associated observers/listeners.
   * Called when data disappears or the panel is disposed.
   */
  private disposeRendererAndUI(): void {
    this._renderer?.dispose?.();
    this._renderer = undefined;

    // Call destroy on the CameraManager instance this panel was using.
    // This will reset its 'isInitialized' flag and remove document listeners.
    if (this._cameraManager) {
      if (typeof (this._cameraManager as any).destroy === "function") {
        console.debug(
          `[CompositePanel ${this._api?.id}] Calling destroy() on CameraManager instance.`,
        );
        (this._cameraManager as any).destroy();
      } else {
        console.warn(
          `[CompositePanel ${this._api?.id}] CameraManager instance does not have a destroy method.`,
        );
      }
    }

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

      this._engineToolbar?.dispose?.();
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
    console.debug(
      `[CompositePanel ${this._api?.id || this.id}] dispose called`,
    );
    this.disposeRendererAndUI();

    // Remove event listeners for system generation (already in disconnectedCallback, but good for explicit dispose)
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );

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
