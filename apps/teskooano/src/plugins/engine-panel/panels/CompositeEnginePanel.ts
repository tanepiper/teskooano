import {
  celestialObjects$,
  getCelestialObjects,
  panelService,
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

import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";

import { layoutOrientation$ } from "./layoutStore";

import { CustomEvents } from "@teskooano/data-types";
import { RendererStats } from "@teskooano/renderer-threejs-core";
import { EngineToolbar } from "../../../core/interface/engine-toolbar";
import { ensureSimulationLoopStarted } from "../../../core/state/simulation-loop.state"; // Added import
import { CameraManager } from "../../camera-manager/CameraManager"; // Corrected import path
import { template } from "./CompositeEnginePanel.template.js"; // Import the template
import {
  applyViewStateToRenderer,
  viewStateSubject$,
} from "./CompositeEnginePanel.utils.js"; // Import the utility function
import { EngineCameraManager } from "./EngineCameraManager"; // Added import
import { PlaceholderManager } from "./PlaceholderManager"; // Added import
import { CompositeEngineState, CompositePanelParams } from "./types.js";

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
  private _placeholderManager: PlaceholderManager | undefined = undefined;

  private _isGeneratingSystem = false;

  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  private _layoutOrientationSubscription: Subscription | null = null;
  private _celestialObjectsUnsubscribe: Subscription | null = null;
  private _simulationStateUnsubscribe: Subscription | null = null;
  private _isInitialized = false;

  private _cameraManagerInstance: CameraManager | undefined = undefined;
  private _engineCameraManager: EngineCameraManager | undefined = undefined;

  private _viewStateSubject: BehaviorSubject<CompositeEngineState>;

  private _engineToolbar: EngineToolbar | null = null;

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

    // Query placeholder elements locally for manager initialization
    const placeholderWrapperEl = this.shadowRoot!.querySelector<HTMLElement>(
      "#engine-placeholder-wrapper",
    );
    const placeholderMessageEl =
      this.shadowRoot!.querySelector<HTMLParagraphElement>(
        "#placeholder-message",
      );
    const placeholderActionAreaEl =
      this.shadowRoot!.querySelector<HTMLDivElement>(
        "#placeholder-action-area",
      );

    if (
      this._engineContainer &&
      placeholderWrapperEl &&
      placeholderMessageEl &&
      placeholderActionAreaEl
    ) {
      this._placeholderManager = new PlaceholderManager(
        placeholderWrapperEl,
        placeholderMessageEl,
        placeholderActionAreaEl,
        this._engineContainer,
      );
    } else {
      console.error(
        `[CompositePanel ${this.id || "constructor"}] Critical elements for PlaceholderManager not found. Placeholder will not function.`,
      );
    }

    this._viewStateSubject = viewStateSubject$;

    this._handleSystemGenerationStart =
      this._handleSystemGenerationStart.bind(this);
    this._handleSystemGenerationComplete =
      this._handleSystemGenerationComplete.bind(this);
    this.handleSimulationStateChange =
      this.handleSimulationStateChange.bind(this);
  }

  connectedCallback(): void {
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
    // Remove window-level event listeners here
    this._removeGlobalEventListeners();

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
   * Provides access to the OrbitsManager instance within the renderer, if available.
   * Useful for direct manipulation or querying of orbit visualization data.
   */
  public get orbitManager(): OrbitsManager | undefined {
    return this._renderer?.orbitManager;
  }

  /**
   * Provides access to the EngineCameraManager instance.
   * @returns The EngineCameraManager instance or undefined if not initialized.
   */
  public get engineCameraManager(): EngineCameraManager | undefined {
    return this._engineCameraManager;
  }

  /**
   * Provides access to the view state subject.
   * @returns The view state BehaviorSubject.
   */
  public get viewState$(): BehaviorSubject<CompositeEngineState> {
    return this._viewStateSubject;
  }

  /**
   * Provides access to the EngineToolbar instance.
   * @returns The EngineToolbar instance or null if not initialized.
   */
  public get engineToolbar(): EngineToolbar | null {
    return this._engineToolbar;
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

  private _removeGlobalEventListeners(): void {
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.removeEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );
  }

  private _handleSystemGenerationStart = (): void => {
    this._isGeneratingSystem = true;
    // Show placeholder only if the main renderer isn't already visible
    if (!this._renderer) {
      this._placeholderManager?.showMessage(true);
    }
  };

  private _handleSystemGenerationComplete = (): void => {
    this._isGeneratingSystem = false;
    const objectCount = Object.keys(getCelestialObjects()).length;

    if (!this._renderer) {
      if (objectCount > 0) {
        // System is loaded, hide placeholder and initialize engine
        this._placeholderManager?.hide();
        this.initializeRenderer();
        this.createEngineToolbar();
        this.triggerResize();
      } else {
        // Generation finished but no objects, show initial placeholder
        this._placeholderManager?.showMessage(false);
      }
    } else {
      // If renderer already exists, just ensure placeholder is hidden
      this._placeholderManager?.hide();
    }
  };

  // Helper method to encapsulate celestial object subscription logic
  private _subscribeToCelestialObjects(): void {
    this._celestialObjectsUnsubscribe?.unsubscribe();
    this._celestialObjectsUnsubscribe = celestialObjects$.subscribe(
      (celestialObjects) => {
        if (!this.isConnected) {
          return;
        }

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0 && !this._isGeneratingSystem) {
          this._placeholderManager?.hide();

          this.initializeRenderer();
          this.createEngineToolbar();

          ensureSimulationLoopStarted();
          this.triggerResize();
        } else if (this._renderer && objectCount === 0) {
          this.disposeRendererAndUI();
          this._isGeneratingSystem = false;
          this._placeholderManager?.showMessage(false);
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

    if (this._isInitialized && this._api) {
      console.warn(
        `[CompositePanel ${this._api.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };

    this._placeholderManager?.showMessage(this._isGeneratingSystem);

    // Subscriptions are now managed by connectedCallback or here if they depend on init params
    this._subscribeToCelestialObjects();
    this._subscribeToSimulationState();

    // layoutOrientation$ subscription is better in connectedCallback as it doesn't depend on init params.
    // Ensure it's active if already connected.
    if (this.isConnected && !this._layoutOrientationSubscription) {
      this._layoutOrientationSubscription = layoutOrientation$.subscribe(
        (orientation) => {
          if (this.isConnected) {
            this.triggerResize();
          }
        },
      );
    }

    this._isInitialized = true;
  }

  /**
   * Initializes the `ModularSpaceRenderer` instance and sets up
   * its initial state and event listeners.
   */
  private initializeRenderer(): void {
    if (!this._engineContainer) {
      console.error(
        "[CompositeEnginePanel] Engine container not found, cannot initialize renderer.",
      );
      return;
    }
    if (this._renderer) {
      console.warn(
        "[CompositeEnginePanel] Renderer already appears initialized.",
      );
      return;
    }

    const initialViewState = this.getViewState();
    this._renderer = new ModularSpaceRenderer(this._engineContainer, {
      antialias: true,
      shadows: true,
      hdr: true,
      showGrid: initialViewState.showGrid,
      showCelestialLabels: initialViewState.showCelestialLabels,
      showAuMarkers: initialViewState.showAuMarkers,
      showDebrisEffects: initialViewState.showDebrisEffects,
    });

    if (!this._renderer) {
      console.error(
        "[CompositeEnginePanel] Failed to create ModularSpaceRenderer instance.",
      );
      // Display error in the panel container
      if (this._engineContainer) {
        this._engineContainer.textContent =
          "Error initializing engine: Failed to create renderer instance.";
        this._engineContainer.style.color = "red";
        this._engineContainer.style.padding = "1em";
      }
      return; // Stop further initialization if renderer isn't available
    }

    // The rest of the initialization depends on this._renderer being valid
    if (!this._initializeCameraSystems()) return;
    if (!this._configureAndLinkCamera()) return;

    this._finalizePanelInitialization();
  }

  /**
   * Initializes the main CameraManager and the panel-specific EngineCameraManager.
   * @returns True if successful, false otherwise.
   */
  private _initializeCameraSystems(): boolean {
    // Create the panel-specific CameraManager instance
    this._cameraManagerInstance = new CameraManager();

    // Pass the instance to EngineCameraManager
    this._engineCameraManager = new EngineCameraManager(
      this,
      this._cameraManagerInstance, // Pass the new instance
      this._api?.id,
    );

    if (!this._cameraManagerInstance) {
      console.error(
        `[CompositePanel ${this._api?.id}] Failed to create _cameraManagerInstance.`,
      );
      return false;
    }
    if (!this._engineCameraManager) {
      console.error(
        `[CompositePanel ${this._api?.id}] Failed to create _engineCameraManager with the new CameraManager instance.`,
      );
      return false;
    }

    return true;
  }

  /**
   * Sets dependencies for the main CameraManager, initializes its position,
   * and subscribes to its state changes to update the panel's view state.
   * Assumes _renderer, _cameraManagerInstance, and _viewStateSubject are initialized.
   * @returns True if successful, false otherwise.
   */
  private _configureAndLinkCamera(): boolean {
    if (
      !this._renderer ||
      !this._cameraManagerInstance ||
      !this._engineCameraManager
    )
      return false; // Check _cameraManagerInstance

    const initialViewState = this._viewStateSubject.getValue();
    try {
      // Set dependencies on the panel-specific CameraManager instance
      this._cameraManagerInstance.setDependencies({
        renderer: this._renderer,
        initialFov: initialViewState.fov,
        initialFocusedObjectId: initialViewState.focusedObjectId,
        initialCameraPosition: initialViewState.cameraPosition,
        initialCameraTarget: initialViewState.cameraTarget,
        onFocusChangeCallback: (focusedId: string | null) => {
          this.updateViewState({ focusedObjectId: focusedId });
        },
      });

      // Initialize position via the panel-specific CameraManager instance
      this._cameraManagerInstance.initializeCameraPosition();

      // Subscribe to state changes from the panel-specific CameraManager instance
      this._cameraManagerInstance.getCameraState$().subscribe((cameraState) => {
        if (!this._isInitialized || !this.element.isConnected) return;

        const currentPanelState = this._viewStateSubject.getValue();
        const updates: Partial<CompositeEngineState> = {};

        if (
          !currentPanelState.cameraPosition.equals(cameraState.currentPosition)
        ) {
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
          this._viewStateSubject.next({
            ...currentPanelState,
            ...updates,
          });
        }
      });
      return true;
    } catch (error) {
      console.error(
        `[CompositePanel ${this._api?.id}] Failed to set CameraManager dependencies or subscribe to state:`,
        error,
      );
      // Potentially clear _cameraManager or _engineCameraManager if this step is critical
      return false;
    }
  }

  /**
   * Finalizes the renderer and panel setup by dispatching events,
   * starting the render loop, and setting up observers.
   * Assumes _renderer and _engineContainer are initialized.
   */
  private _finalizePanelInitialization(): void {
    if (!this._renderer || !this._engineContainer) return;

    // Dispatch an event indicating the composite panel and its managers are ready
    if (this.element.isConnected && this._api?.id) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.COMPOSITE_ENGINE_INITIALIZED, {
          bubbles: true,
          composed: true,
          detail: {
            panelId: this._api.id,
            parentInstance: this,
          },
        }),
      );
    }

    this._renderer.startRenderLoop();

    this._resizeObserver = new ResizeObserver(() => {
      // Simplified ResizeObserver callback
      this.triggerResize();
    });
    this._resizeObserver.observe(this._engineContainer);

    applyViewStateToRenderer(this._renderer, this.getViewState());
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
  private createEngineToolbar(): void {
    if (!this._api?.id) {
      console.error(
        "CompositeEnginePanel: Cannot initialize toolbar without panel API ID.",
      );
      return;
    }

    const toolbarManager = this._params?.params?.engineToolbarManager;

    if (!toolbarManager) {
      console.error(
        "[CompositeEnginePanel] EngineToolbarManager not found! Cannot create toolbar.",
      );
      return;
    }

    this._engineToolbar = toolbarManager.createToolbarForPanel(
      this._api.id,
      this,
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

    // Dispose the panel-specific CameraManager instance first
    this._cameraManagerInstance?.destroy();
    this._cameraManagerInstance = undefined;

    // Dispose EngineCameraManager (which is now simpler)
    this._engineCameraManager?.dispose();
    this._engineCameraManager = undefined;

    const toolbarManager = this._params?.params?.engineToolbarManager;

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

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }
  }

  /**
   * Dockview lifecycle method: Cleans up all resources associated with the panel.
   * Stops listeners, disposes the renderer, and unregisters the panel.
   */
  dispose(): void {
    this.disposeRendererAndUI();

    // Remove event listeners for system generation (already in disconnectedCallback, but good for explicit dispose)
    this._removeGlobalEventListeners();

    this._panelRemovedSubscription?.unsubscribe();
    this._panelRemovedSubscription = null;

    this._celestialObjectsUnsubscribe?.unsubscribe();
    this._celestialObjectsUnsubscribe = null;
    this._simulationStateUnsubscribe?.unsubscribe();
    this._simulationStateUnsubscribe = null;
    this._layoutOrientationSubscription?.unsubscribe();
    this._layoutOrientationSubscription = null;

    this._placeholderManager?.dispose();

    panelService.unregisterPanelInstance(this._api?.id ?? "unknown");
  }
}
