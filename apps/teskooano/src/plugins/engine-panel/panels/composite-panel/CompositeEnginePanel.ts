import {
  type SimulationState,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { BehaviorSubject, Subscription } from "rxjs";
import { panelService } from "../../../../core/controllers/dockview/panel.service";

import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";

import { CustomEvents } from "@teskooano/data-types";
import { RendererStats, SceneManager } from "@teskooano/renderer-threejs-core";
import {
  initializeLabelSystem,
  type LabelSystem,
} from "@teskooano/renderer-threejs-labels";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import "../../../../core/interface/engine-toolbar/view/engine-toolbar.component";
import { EngineToolbar } from "../../../../core/interface/engine-toolbar";
import { EngineCameraManager } from "../camera-manager";
import { PlaceholderManager } from "../placeholder-manager";
import { CompositeEngineState, CompositePanelParams } from "../types";
import { template } from "./CompositeEnginePanel.template";
import {
  applyViewStateToRenderer,
  createDefaultViewState,
} from "./CompositeEnginePanel.utils";
import {
  PanelCameraCoordinator,
  PanelEventManager,
  PanelLifecycleManager,
} from "./managers";

/**
 * A Dockview panel component that combines a 3D engine view (`ModularSpaceRenderer`)
 * with a dynamically generated UI controls section. This component acts as an
 * orchestrator for several manager classes that handle specific responsibilities.
 *
 * Responsibilities:
 * - Acts as the `IContentRenderer` for Dockview, managing the component's lifecycle.
 * - Owns the shadow DOM and the core HTML elements for the panel.
 * - Orchestrates the `PanelLifecycleManager`, `PanelCameraCoordinator`, and `PanelEventManager`.
 * - Manages its own independent view state via an RxJS BehaviorSubject.
 */
export class CompositeEnginePanel
  extends HTMLElement
  implements IContentRenderer
{
  private _engineContainer: HTMLElement | null = null;
  private _placeholderManager: PlaceholderManager | undefined = undefined;

  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  private _subscriptionManager = new StateSubscriptionMixin();
  private _isInitialized = false;

  private _sceneManager: SceneManager | undefined = undefined;
  private _labelSystem: LabelSystem | undefined = undefined;
  private _cameraCoordinator: PanelCameraCoordinator | undefined = undefined;
  private _lifecycleManager: PanelLifecycleManager;
  private _eventManager: PanelEventManager;

  private _viewStateSubject: BehaviorSubject<CompositeEngineState>;

  private _engineToolbar: EngineToolbar | null = null;
  private _context: PluginExecutionContext | null = null;

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

    this._viewStateSubject = new BehaviorSubject<CompositeEngineState>(
      createDefaultViewState(),
    );

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

    // Bind handlers once
    this.handleSimulationStateChange =
      this.handleSimulationStateChange.bind(this);

    // Instantiate managers
    this._lifecycleManager = new PanelLifecycleManager({
      getIsConnected: () => this.isConnected,
      getRenderer: () => this._renderer,
      placeholderManager: this._placeholderManager,
      initializeRendererAndUI: () => this.initializeRendererAndUI(),
      disposeRendererAndUI: () => this.disposeRendererAndUI(),
    });

    this._eventManager = new PanelEventManager({
      panelIsConnected: () => this.isConnected,
      triggerResize: () => this.triggerResize(),
      handleSimulationStateChange: this.handleSimulationStateChange,
    });
  }

  connectedCallback(): void {
    if (this._isInitialized) {
      // If re-connected after being initialized, ensure subscriptions are active.
      this.setupSubscriptions();
    }
  }

  disconnectedCallback(): void {
    // Unsubscribe from everything when removed from the DOM.
    // `dispose` will handle the final cleanup if the panel is permanently removed.
    this._subscriptionManager.dispose();
    // Re-create subscription manager for re-attachment
    this._subscriptionManager = new StateSubscriptionMixin();
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
    return this._renderer?.getOrbitsManager();
  }

  /**
   * Provides access to the LightSourceManager instance within the renderer, if available.
   * Useful for direct manipulation or querying of lighting data.
   */
  public get lightSourceManager(): LightingManager | undefined {
    return this._renderer?.getLightSourceManager();
  }

  /**
   * Provides access to the EngineCameraManager instance.
   * @returns The EngineCameraManager instance or undefined if not initialized.
   */
  public get engineCameraManager(): EngineCameraManager | undefined {
    return this._cameraCoordinator?.engineCameraManager;
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
  public get toolbar(): EngineToolbar | null {
    return this._engineToolbar;
  }

  /**
   * Provides access to the LabelSystem instance.
   * @returns The LabelSystem instance or undefined if not initialized.
   */
  public get labelSystem(): LabelSystem | undefined {
    return this._labelSystem;
  }

  /**
   * Provides access to the SceneManager instance.
   * @returns The SceneManager instance or undefined if not initialized.
   */
  public get sceneManager(): SceneManager | undefined {
    return this._sceneManager;
  }

  /**
   * Updates a single property of the panel's view state.
   * This provides a generic public interface for modifying view state.
   *
   * @param key The key of the view state property to update.
   * @param value The new value for the property.
   */
  public setProperty<K extends keyof CompositeEngineState>(
    key: K,
    value: CompositeEngineState[K],
  ): void {
    // The cast is necessary because of how TypeScript handles computed
    // property names in object literals.
    this.updateViewState({ [key]: value } as Partial<CompositeEngineState>);
  }

  /**
   * Dockview lifecycle method: Initializes the panel's content and renderer.
   * Sets up data listeners, placeholders, and the PanelResizer.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  public init(
    parameters: GroupPanelPartInitParameters & {
      context: PluginExecutionContext;
    },
  ): void {
    if (this._isInitialized) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to re-initialize panel.`,
      );
      return;
    }

    this._api = parameters.api;
    if (!this.id) this.id = `composite-engine-view-${this._api.id}`;

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };
    this._context = parameters.context;

    this.setupSubscriptions();

    this._isInitialized = true;
  }

  /**
   * Dockview lifecycle method: Cleans up all resources associated with the panel.
   * Stops listeners, disposes the renderer, and unregisters the panel.
   */
  dispose(): void {
    this.disposeRendererAndUI();

    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    this._subscriptionManager.dispose();
    this._lifecycleManager.dispose();
    this._eventManager.dispose();

    this._placeholderManager?.dispose();

    panelService.unregisterPanelInstance(this._api?.id ?? "unknown");
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
   * Sets up all RxJS subscriptions for the panel by delegating to managers.
   */
  private setupSubscriptions(): void {
    // Ensure existing subscriptions are cleaned up before creating new ones.
    this._subscriptionManager.dispose();
    this._subscriptionManager = new StateSubscriptionMixin();

    this._lifecycleManager.listen();
    this._eventManager.listen();
  }

  /**
   * Creates the renderer, camera, and toolbar. This is called by the
   * `PanelLifecycleManager` when celestial objects are available.
   */
  private initializeRendererAndUI(): void {
    if (this._renderer || !this._engineContainer) {
      return;
    }
    this.initializeRenderer();
    this.createEngineToolbar();
  }

  /**
   * Initializes the `ModularSpaceRenderer` instance and sets up
   * its initial state and event listeners.
   */
  private initializeRenderer(): void {
    if (this._renderer || !this._engineContainer) {
      return; // Already initialized or container not ready
    }
    const viewState = this.getViewState();

    // 1. Create the SceneManager first, as it owns the scene and camera.
    this._sceneManager = new SceneManager(this._engineContainer, {
      antialias: true,
    });

    // 2. Decide if the label system is needed and initialize it.
    this._labelSystem = initializeLabelSystem(
      this._sceneManager.scene,
      this._engineContainer,
      {
        showAuMarkers: viewState.showAuMarkers,
      },
    );

    // 3. Create the main renderer, injecting the dependencies.
    this._renderer = new ModularSpaceRenderer(
      this._engineContainer,
      this._sceneManager,
      {
        // Pass other non-scene/label options here if any
        showDebrisEffects: viewState.showDebrisEffects,
      },
      this._labelSystem,
    );

    // 4. Finalize setup.
    this._cameraCoordinator = new PanelCameraCoordinator(
      this,
      this._renderer,
      this._viewStateSubject,
      this._api?.id,
    );

    if (!this._cameraCoordinator.initialize()) {
      console.error(
        `[CompositePanel ${this._api?.id}] Failed to initialize camera systems.`,
      );
      this._renderer.dispose();
      this._renderer = undefined;
      return;
    }

    // Apply the complete initial view state to the newly created renderer.
    applyViewStateToRenderer(this._renderer, viewState);

    this._finalizeRendererInitialization();
  }

  /**
   * Finishes the renderer and panel setup by dispatching events,
   * starting the render loop, and setting up observers.
   * Assumes _renderer and _engineContainer are initialized.
   */
  private _finalizeRendererInitialization(): void {
    if (!this._renderer || !this._engineContainer) return;

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

    // Start performance monitoring after renderer is ready
    PerformanceMonitor.getInstance().startMonitoring();

    this._resizeObserver = new ResizeObserver(() => {
      this.triggerResize();
    });
    this._resizeObserver.observe(this._engineContainer);
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

    const toolbarContainer = this.shadowRoot!.querySelector(
      "teskooano-engine-toolbar",
    );

    if (!toolbarContainer) {
      console.error(
        "[CompositeEnginePanel] Could not find 'teskooano-engine-toolbar' element in shadow DOM.",
      );
      return;
    }

    this._engineToolbar = toolbarManager.createToolbarForPanel(
      this._api.id,
      toolbarContainer as HTMLElement,
      this,
    );
  }

  /**
   * Cleans up the renderer instance, UI controls, and associated observers/listeners.
   * Called when data disappears or the panel is disposed.
   */
  private disposeRendererAndUI(): void {
    // Stop performance monitoring first
    PerformanceMonitor.getInstance().stopMonitoring();

    // Dispose renderer (this should handle most cleanup)
    this._renderer?.dispose?.();
    this._renderer = undefined;

    // Dispose camera coordinator
    this._cameraCoordinator?.dispose();
    this._cameraCoordinator = undefined;

    // Dispose scene manager and label system
    this._sceneManager?.dispose();
    this._sceneManager = undefined;

    // LabelSystem doesn't have a dispose method, but its components do
    this._labelSystem?.css2DManager?.dispose();
    this._labelSystem?.auMarkerManager?.dispose();
    this._labelSystem = undefined;

    // Dispose toolbar
    const toolbarManager = this._params?.params?.engineToolbarManager;
    if (toolbarManager && this._api?.id) {
      toolbarManager.disposeToolbarForPanel(this._api.id);
      this._engineToolbar = null;
    }

    // Disconnect resize observer
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;

    // Nullify references to allow garbage collection
    (this._renderer as any) = null;
    (this._sceneManager as any) = null;
    (this._labelSystem as any) = null;
    (this._cameraCoordinator as any) = null;
    (this._engineToolbar as any) = null;
    (this._resizeObserver as any) = null;
  }
}
