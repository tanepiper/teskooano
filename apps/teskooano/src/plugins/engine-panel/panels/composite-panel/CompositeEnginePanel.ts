import { type SimulationState } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { DockviewPanelApi, IContentRenderer } from "dockview-core";
import { BehaviorSubject, Subscription } from "rxjs";
import { panelService } from "../../../../core/controllers/dockview/panel.service";

import { CustomEvents } from "@teskooano/data-types";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";
import { RendererStats } from "@teskooano/renderer-threejs-core";
import { EngineToolbar } from "../../../../core/interface/engine-toolbar";
import "../../../../core/interface/engine-toolbar/view/engine-toolbar.component";
import { CompositeEngineState, CompositeEnginePanelInitParams } from "../types";
import { template } from "./CompositeEnginePanel.template";
import { createDefaultViewState } from "./CompositeEnginePanel.utils";
import {
  PanelCameraCoordinator,
  SubscriptionCoordinator,
  ToolbarCoordinator,
  ViewStateCoordinator,
} from "./managers";

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
  private _viewStateCoordinator: ViewStateCoordinator;
  private _subscriptionCoordinator: SubscriptionCoordinator;
  private _toolbarCoordinator: ToolbarCoordinator;

  // Dockview integration
  private _api: DockviewPanelApi | undefined;
  private _params: CompositeEnginePanelInitParams | undefined;
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

  /**
   * Gets the panel's API ID, which is used as the panel identifier for camera state and other panel-specific operations.
   * @returns The panel API ID, or undefined if not yet initialized.
   */
  get panelId(): string | undefined {
    return this._api?.id;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Initialize coordinators
    this._viewStateCoordinator = new ViewStateCoordinator(
      createDefaultViewState(),
    );
    this._toolbarCoordinator = new ToolbarCoordinator(this, this.shadowRoot!);
    this._subscriptionCoordinator = new SubscriptionCoordinator({
      onCelestialObjectsChange: this.handleCelestialObjectsChange.bind(this),
      onSimulationStateChange: this.handleSimulationStateChange.bind(this),
      onLayoutChange: this.triggerResize.bind(this),
      onRendererDisposal: this.disposeRendererAndUI.bind(this),
    });

    // Get DOM references
    this._engineContainer = this.shadowRoot!.querySelector(".engine-container");
    this._homeComponent = this.shadowRoot!.querySelector(
      "#engine-placeholder-wrapper",
    );
  }

  connectedCallback(): void {
    if (this._isInitialized) {
      this._subscriptionCoordinator.setupSubscriptions();
    }
  }

  disconnectedCallback(): void {
    this._subscriptionCoordinator.dispose();
  }

  // Public API - simplified
  public getViewState(): Readonly<CompositeEngineState> {
    return this._viewStateCoordinator.getViewState();
  }

  public updateViewState(updates: Partial<CompositeEngineState>): void {
    this._viewStateCoordinator.updateViewState(updates);
  }

  public subscribeToViewState(
    callback: (state: CompositeEngineState) => void,
  ): Subscription {
    return this._viewStateCoordinator.subscribeToViewState(callback);
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
    return this._viewStateCoordinator.viewStateSubject;
  }

  public get toolbar(): EngineToolbar | null {
    return this._engineToolbar;
  }

  public setGenerating(isGenerating: boolean): void {
    (this._homeComponent as any)?.setGenerating(isGenerating);
  }

  public init(parameters: CompositeEnginePanelInitParams): void {
    if (this._isInitialized) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to re-initialize panel.`,
      );
      return;
    }

    this._api = parameters.api;
    this._params = parameters;
    if (!this.id) this.id = `composite-engine-view-${this._api.id}`;

    this._subscriptionCoordinator.setupSubscriptions();
    this._isInitialized = true;
  }

  dispose(): void {
    this.disposeRendererAndUI();
    this._subscriptionCoordinator.dispose();
    this._viewStateCoordinator.dispose();
    this._toolbarCoordinator.dispose();

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

  private initializeRendererAndUI(): void {
    if (this._renderer || !this._engineContainer) return;

    // Create renderer
    this._renderer = new ModularSpaceRenderer(this._engineContainer);
    // @ts-ignore
    if (window.teskooano) {
      // @ts-ignore
      window.teskooano.renderer = this._renderer;
    }

    // Set renderer on view state coordinator
    this._viewStateCoordinator.setRenderer(this._renderer);

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
    this._viewStateCoordinator.updateViewState(this.getViewState());
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

  private handleCelestialObjectsChange = (
    celestialObjects: Record<string, any>,
  ): void => {
    if (!this.isConnected) return;

    const hasObjects = Object.keys(celestialObjects).length > 0;
    const rendererExists = !!this._renderer;

    if (hasObjects && !rendererExists) {
      this.initializeRendererAndUI();
    }

    // Handle home component visibility - it exists but might not be visible
    if (this._homeComponent) {
      if (hasObjects) {
        this._homeComponent.setAttribute("hidden", "");
      } else {
        this._homeComponent.removeAttribute("hidden");
      }
    }
  };

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

    this._toolbarCoordinator.initialize(this._api.id, toolbarManager);
    this._engineToolbar = this._toolbarCoordinator.createToolbar();
  }

  private disposeRendererAndUI(): void {
    PerformanceMonitor.getInstance().stopMonitoring();

    this._renderer?.dispose?.();
    this._renderer = undefined;

    this._cameraCoordinator?.dispose();
    this._toolbarCoordinator.dispose();
    this._engineToolbar = null;

    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;

    // Show home component when renderer is disposed
    if (this._homeComponent) {
      this._homeComponent.removeAttribute("hidden");
    }
  }
}
