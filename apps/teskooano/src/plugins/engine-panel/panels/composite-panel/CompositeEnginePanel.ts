import {
  type SimulationState,
  StateAccessor,
  StateSubscriptionMixin,
  simulationState$,
} from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { BehaviorSubject, Subscription } from "rxjs";
import { panelService } from "../../../../core/controllers/dockview/panel.service";
import { layoutOrientation$ } from "../state/layoutStore";

import { CustomEvents } from "@teskooano/data-types";
import { RendererStats } from "@teskooano/renderer-threejs-core";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import "../../../../core/interface/engine-toolbar/view/engine-toolbar.component";
import { EngineToolbar } from "../../../../core/interface/engine-toolbar";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import { CompositeEngineState, CompositePanelParams } from "../types";
import { template } from "./CompositeEnginePanel.template";
import {
  applyViewStateToRenderer,
  createDefaultViewState,
} from "./CompositeEnginePanel.utils";
import { PanelCameraCoordinator } from "./managers";

/**
 * A Dockview panel component that combines a 3D engine view (`ModularSpaceRenderer`)
 * with a dynamically generated UI controls section. This component manages its own
 * lifecycle and handles most responsibilities directly for simplicity.
 *
 * Responsibilities:
 * - Acts as the `IContentRenderer` for Dockview, managing the component's lifecycle.
 * - Owns the shadow DOM and the core HTML elements for the panel.
 * - Directly manages renderer lifecycle based on celestial objects state.
 * - Handles simulation state and layout orientation subscriptions.
 * - Orchestrates only the `PanelCameraCoordinator` for camera management.
 * - Manages its own independent view state via an RxJS BehaviorSubject.
 */
export class CompositeEnginePanel
  extends HTMLElement
  implements IContentRenderer
{
  // Core elements
  private _engineContainer: HTMLElement | null = null;
  private _homeComponent: HTMLElement | null = null;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  // State management
  private _subscriptionManager = new StateSubscriptionMixin();
  private _viewStateSubject: BehaviorSubject<CompositeEngineState>;
  private _clearTimeout: number | null = null;

  // Dockview integration
  private _api: DockviewPanelApi | undefined;
  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _isInitialized = false;

  // Managers
  private _cameraCoordinator!: PanelCameraCoordinator;
  private _engineToolbar: EngineToolbar | null = null;

  /**
   * The root HTML element for this panel (fulfills IContentRenderer for custom elements).
   */
  get element(): HTMLElement {
    return this;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Initialize state
    this._viewStateSubject = new BehaviorSubject<CompositeEngineState>(
      createDefaultViewState(),
    );

    // Get DOM references
    this._engineContainer = this.shadowRoot!.querySelector(".engine-container");
    this._homeComponent = this.shadowRoot!.querySelector(
      "#engine-placeholder-wrapper",
    );
  }

  connectedCallback(): void {
    if (this._isInitialized) {
      this.setupSubscriptions();
    }
  }

  disconnectedCallback(): void {
    this._subscriptionManager.dispose();
    this._subscriptionManager = new StateSubscriptionMixin();
  }

  // Public API - simplified
  public getViewState(): Readonly<CompositeEngineState> {
    return this._viewStateSubject.getValue();
  }

  public updateViewState(updates: Partial<CompositeEngineState>): void {
    const currentState = this._viewStateSubject.getValue();
    this._viewStateSubject.next({ ...currentState, ...updates });
    if (this._renderer) {
      applyViewStateToRenderer(this._renderer, updates);
    }
  }

  public subscribeToViewState(
    callback: (state: CompositeEngineState) => void,
  ): Subscription {
    return this._viewStateSubject.subscribe(callback);
  }

  public getRenderer(): ModularSpaceRenderer | undefined {
    return this._renderer;
  }

  public getRendererStats(): RendererStats | null {
    return (
      this._renderer?.renderingOrchestrator?.sceneManager?.animationLoop?.getCurrentStats() ||
      null
    );
  }

  public get cameraManager(): CameraManager {
    return this._cameraCoordinator.cameraManager;
  }

  public get viewState$(): BehaviorSubject<CompositeEngineState> {
    return this._viewStateSubject;
  }

  public get toolbar(): EngineToolbar | null {
    return this._engineToolbar;
  }

  public setGenerating(isGenerating: boolean): void {
    (this._homeComponent as any)?.setGenerating(isGenerating);
  }

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
    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };
    if (!this.id) this.id = `composite-engine-view-${this._api.id}`;

    this.setupSubscriptions();
    this._isInitialized = true;
  }

  dispose(): void {
    this.disposeRendererAndUI();
    this._subscriptionManager.dispose();

    if (this._clearTimeout) {
      clearTimeout(this._clearTimeout);
      this._clearTimeout = null;
    }

    panelService.unregisterPanelInstance(this._api?.id ?? "unknown");
  }

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

  private setupSubscriptions(): void {
    this._subscriptionManager.dispose();
    this._subscriptionManager = new StateSubscriptionMixin();

    // Manage renderer lifecycle based on celestial objects
    this._subscriptionManager.subscribeToStateComposition(
      StateAccessor.celestialObjects$(),
      (celestialObjects: Record<string, any>) => {
        if (!this.isConnected) return;

        const hasObjects = Object.keys(celestialObjects).length > 0;
        const rendererExists = !!this._renderer;

        if (hasObjects) {
          if (this._clearTimeout) {
            clearTimeout(this._clearTimeout);
            this._clearTimeout = null;
          }
          if (!rendererExists) {
            this.initializeRendererAndUI();
          }
          this._homeComponent?.setAttribute("hidden", "");
        } else {
          if (rendererExists) {
            if (this._clearTimeout) {
              clearTimeout(this._clearTimeout);
            }
            this._clearTimeout = window.setTimeout(() => {
              this.disposeRendererAndUI();
              this._clearTimeout = null;
            }, 50);
          }
          this._homeComponent?.removeAttribute("hidden");
        }
      },
    );

    // Subscribe to simulation state
    this._subscriptionManager.subscribeToStateComposition(
      simulationState$,
      (state: SimulationState) => {
        if (this.isConnected) {
          this.handleSimulationStateChange(state);
        }
      },
    );

    // Subscribe to layout changes
    this._subscriptionManager.subscribeToStateComposition(
      layoutOrientation$,
      () => {
        if (this.isConnected) {
          this.triggerResize();
        }
      },
    );
  }

  private initializeRendererAndUI(): void {
    if (this._renderer || !this._engineContainer) return;

    // Create renderer
    this._renderer = new ModularSpaceRenderer(this._engineContainer);
    // @ts-ignore
    if (window.teskooano) {
      // @ts-ignore
      window.teskooano.renderer = this._renderer;
    }

    // Initialize camera coordinator
    if (!this._api?.id) {
      console.error(
        `[CompositePanel] Cannot initialize camera systems without panel API ID.`,
      );
      this._renderer.dispose();
      this._renderer = undefined;
      return;
    }

    this._cameraCoordinator = new PanelCameraCoordinator(
      this,
      this._renderer,
      this._api.id,
    );
    if (!this._cameraCoordinator.initialize()) {
      console.error(
        `[CompositePanel ${this._api.id}] Failed to initialize camera systems.`,
      );
      this._renderer.dispose();
      this._renderer = undefined;
      return;
    }

    // Apply initial view state and finalize
    applyViewStateToRenderer(this._renderer, this.getViewState());
    this._finalizeRendererInitialization();
    this.createEngineToolbar();
  }

  private _finalizeRendererInitialization(): void {
    if (!this._renderer || !this._engineContainer) return;

    // Dispatch initialization event
    if (this.element.isConnected && this._api?.id) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.COMPOSITE_ENGINE_INITIALIZED, {
          bubbles: true,
          composed: true,
          detail: { panelId: this._api.id, parentInstance: this },
        }),
      );
    }

    // Start renderer and monitoring
    this._renderer.start();
    PerformanceMonitor.getInstance().startMonitoring();

    // Setup resize observer
    this._resizeObserver = new ResizeObserver(() => this.triggerResize());
    this._resizeObserver.observe(this._engineContainer);
  }

  private handleSimulationStateChange = (_: SimulationState): void => {
    if (!this._renderer?.renderingOrchestrator?.orbitManager) return;
  };

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

  private disposeRendererAndUI(): void {
    PerformanceMonitor.getInstance().stopMonitoring();

    this._renderer?.dispose?.();
    this._renderer = undefined;

    this._cameraCoordinator?.dispose();

    const toolbarManager = this._params?.params?.engineToolbarManager;
    if (toolbarManager && this._api?.id) {
      toolbarManager.disposeToolbarForPanel(this._api.id);
      this._engineToolbar = null;
    }

    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }
}
