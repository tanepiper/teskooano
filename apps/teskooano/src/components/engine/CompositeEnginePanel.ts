import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjectsStore,
  panelRegistry,
  renderableObjectsStore,
} from "@teskooano/core-state";
import {
  CelestialType,
  scaleSize,
  CelestialStatus,
  OortCloudProperties,
  SCALE,
} from "@teskooano/data-types";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { OrbitManager } from "@teskooano/renderer-threejs-visualization";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { atom, type WritableAtom } from "nanostores";
import * as THREE from "three";

import { layoutOrientationStore, Orientation } from "../../stores/layoutStore";
import "../shared/CollapsibleSection"; // Needed for UI sections

// Define the expected structure for panel parameters from ToolbarController
interface UiPanelSectionConfig {
  id: string;
  title: string;
  class: string;
  componentTag: string;
  startClosed?: boolean;
}

interface CompositePanelParams {
  title?: string;
  sections?: UiPanelSectionConfig[];
}

// --- Interface for View State (Copied from old EnginePanel) ---
export interface PanelViewState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  focusedObjectId: string | null;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  showAuMarkers?: boolean;
  showDebrisEffects?: boolean;
}

let isSimulationLoopStarted = false;

/**
 * A Dockview panel that combines the Three.js engine view and its associated UI controls.
 * Manages internal layout based on device orientation.
 */
export class CompositeEnginePanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  private _engineContainer: HTMLElement | undefined;
  private _uiContainer: HTMLElement | undefined;

  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  // --- View Orientation Handling ---
  private _layoutUnsubscribe: (() => void) | null = null;
  private _currentOrientation: Orientation | null = null;

  // --- Internal View State Store (Copied from old EnginePanel) ---
  private _previousViewState: PanelViewState | null = null;
  private _viewStateStore: WritableAtom<PanelViewState>;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.classList.add("composite-engine-panel");
    // Basic styling - flex layout handled by orientation classes
    this._element.style.height = "100%";
    this._element.style.width = "100%";
    this._element.style.overflow = "hidden"; // Prevent scrollbars on main panel
    this._element.style.display = "flex"; // Use flex for internal layout

    // Create internal containers
    this._engineContainer = document.createElement("div");
    this._engineContainer.classList.add("engine-container");
    this._engineContainer.style.flex = "1 1 auto"; // Engine takes up most space initially
    this._engineContainer.style.position = "relative"; // Needed for renderer?
    this._engineContainer.style.overflow = "hidden";
    this._element.appendChild(this._engineContainer);

    this._uiContainer = document.createElement("div");
    this._uiContainer.classList.add("ui-container");
    this._uiContainer.style.flex = "0 0 300px"; // Fixed width for UI initially
    this._uiContainer.style.overflowY = "auto"; // Allow UI scrolling
    this._uiContainer.style.overflowX = "hidden";
    this._uiContainer.style.padding = "10px";
    this._uiContainer.style.boxSizing = "border-box";
    this._uiContainer.style.borderLeft = "1px solid var(--color-border)"; // Separator for landscape
    this._element.appendChild(this._uiContainer);

    // --- Subscribe to layout orientation changes ---
    this._layoutUnsubscribe = layoutOrientationStore.subscribe(
      (orientation) => {
        if (this._currentOrientation !== orientation) {
          this._currentOrientation = orientation;
          console.log(
            `CompositePanel [${this._api?.id}] orientation: ${orientation}`,
          ); // Debug
          if (orientation === "portrait") {
            this._element.classList.remove("layout-internal-landscape");
            this._element.classList.add("layout-internal-portrait");
          } else {
            this._element.classList.remove("layout-internal-portrait");
            this._element.classList.add("layout-internal-landscape");
          }
          // Force renderer resize after potential layout shifts
          this.triggerResize();
        }
      },
    );
    // Apply initial class
    const initialOrientation = layoutOrientationStore.get();
    this._currentOrientation = initialOrientation;
    if (initialOrientation === "portrait") {
      this._element.classList.add("layout-internal-portrait");
    } else {
      this._element.classList.add("layout-internal-landscape");
    }
    // --- End layout subscription ---

    // Initialize internal view state store
    this._viewStateStore = atom<PanelViewState>({
      cameraPosition: new THREE.Vector3(200, 200, 200),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      focusedObjectId: null,
      showGrid: true,
      showCelestialLabels: true,
      showAuMarkers: true,
      showDebrisEffects: false,
    });
    this._previousViewState = this._viewStateStore.get();
  }

  // --- Public methods for state management (Copied/adapted from old EnginePanel) ---
  public getViewState(): Readonly<PanelViewState> {
    return this._viewStateStore.get();
  }

  public updateViewState(updates: Partial<PanelViewState>): void {
    // Update internal store
    this._viewStateStore.set({
      ...this._viewStateStore.get(),
      ...updates,
    });
    // Apply changes directly to the renderer if it exists
    this.applyViewStateToRenderer(updates);
  }

  public subscribeToViewState(
    callback: (state: PanelViewState) => void,
  ): () => void {
    return this._viewStateStore.subscribe(callback);
  }

  // Apply specific state updates to the internal renderer
  private applyViewStateToRenderer(updates: Partial<PanelViewState>): void {
    if (!this._renderer) return;

    if (updates.showGrid !== undefined) {
      this._renderer.setGridVisible(updates.showGrid);
    }
    if (updates.showCelestialLabels !== undefined) {
      this._renderer.setCelestialLabelsVisible(updates.showCelestialLabels);
    }
    if (updates.showAuMarkers !== undefined) {
      this._renderer.setAuMarkersVisible(updates.showAuMarkers);
    }
    if (updates.showDebrisEffects !== undefined) {
      this._renderer.setDebrisEffectsEnabled(updates.showDebrisEffects);
    }
    // Add other direct renderer updates here if needed (e.g., camera, focus)
    // Note: Focus is likely handled separately via controlsManager
  }

  // --- Public methods for UI controls to call (Calls updateViewState internally) ---
  public setShowGrid(visible: boolean): void {
    this.updateViewState({ showGrid: visible });
  }
  public setShowCelestialLabels(visible: boolean): void {
    this.updateViewState({ showCelestialLabels: visible });
  }
  public setShowAuMarkers(visible: boolean): void {
    this.updateViewState({ showAuMarkers: visible });
  }
  public setDebrisEffectsEnabled(visible: boolean): void {
    this.updateViewState({ showDebrisEffects: visible });
  }
  // --- End Public methods for UI controls ---

  // --- Methods for FocusControl interaction ---
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (!this._renderer?.controlsManager) return;

    if (objectId === null) {
      // Clear focus
      this._renderer.controlsManager.moveTo(
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
      );
      this._renderer.setFollowTarget(null);
      this.updateViewState({ focusedObjectId: null }); // Update internal state
      // TODO: Consider emitting 'renderer-focus-changed' event?
      this.dispatchFocusChangeEvent(); // Dispatch event on clear too
    } else {
      // Focus on object
      const renderables = renderableObjectsStore.get(); // Get full map
      const renderableObject = renderables[objectId];
      console.log(
        `[CompositePanel] focusOnObject: Found renderable:`,
        renderableObject,
      ); // LOG 3

      if (!renderableObject?.position) {
        console.error(
          `[CompositePanel] focusOnObject: Cannot focus on ${objectId}, missing renderable position. Renderables dump:`,
          renderables,
        ); // LOG 4 + dump
        return;
      }
      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE; // Ensure valid number
      const cameraPosition = targetPosition
        .clone()
        .add(CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance));
      console.log(
        `[CompositePanel] focusOnObject: targetPos=${targetPosition.toArray()}, camPos=${cameraPosition.toArray()}, dist=${calculatedDistance}`,
      ); // LOG 5

      this._renderer.controlsManager.moveTo(cameraPosition, targetPosition);
      console.log("[CompositePanel] focusOnObject: moveTo called."); // LOG 6
      this._renderer.setFollowTarget(objectId);
      this.updateViewState({ focusedObjectId: objectId }); // Update internal state
      // TODO: Consider emitting 'renderer-focus-changed' event?
    }
  }

  public resetCameraView(): void {
    if (!this._renderer?.controlsManager) return;
    this._renderer.controlsManager.moveTo(
      DEFAULT_CAMERA_POSITION.clone(),
      DEFAULT_CAMERA_TARGET.clone(),
    );
    this._renderer.setFollowTarget(null);
    this.updateViewState({ focusedObjectId: null });
    // TODO: Emit event?
    this.dispatchFocusChangeEvent(); // Dispatch event
  }

  public clearFocus(): void {
    // Equivalent to focusing on null
    this.focusOnObject(null);
  }
  // --- End FocusControl Methods ---

  // Helper to trigger resize on next frame
  private triggerResize(): void {
    requestAnimationFrame(() => {
      if (this._engineContainer) {
        const { clientWidth, clientHeight } = this._engineContainer;
        if (clientWidth > 0 && clientHeight > 0) {
          this._renderer?.onResize(clientWidth, clientHeight);
        }
      }
    });
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };
    this._api = parameters.api;
    this._element.id = `composite-engine-view-${this._api?.id}`;

    // Register with Panel Registry (using the composite ID)
    if (this._api) {
      panelRegistry.registerPanel(this._api.id, this);
    } else {
      console.error(
        "[CompositePanel] Cannot register panel: API not available at init time.",
      );
    }

    // Initialize Renderer
    this.initializeRenderer();

    // Initialize UI Controls
    this.initializeUiControls();

    // Start simulation loop globally only once
    if (!isSimulationLoopStarted) {
      startSimulationLoop();
      isSimulationLoopStarted = true;
    }

    // Initial resize
    this.triggerResize();
  }

  private initializeRenderer(): void {
    if (!this._engineContainer || this._renderer) return;

    try {
      this._renderer = new ModularSpaceRenderer(this._engineContainer, {
        antialias: true,
        shadows: true,
        hdr: true,
        background: "black",
        showDebugSphere: false,
        showGrid: this._viewStateStore.get().showGrid,
        enableUI: true,
        showAuMarkers: this._viewStateStore.get().showAuMarkers,
      });

      // Get initial state from this panel's store
      const initialState = this._viewStateStore.get();
      this._renderer.updateCamera(
        initialState.cameraPosition,
        initialState.cameraTarget,
      );
      this._renderer.setFollowTarget(initialState.focusedObjectId);
      // TODO: Add state subscriptions and focus handling logic from old EnginePanel if needed

      // Listen for camera transition completion events
      document.addEventListener(
        "camera-transition-complete",
        this.handleCameraTransitionComplete, // Use bound method
      );

      this._renderer.startRenderLoop();

      // Setup resize observer for the engine container
      this._resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          this._renderer?.onResize(width, height);
        }
      });
      this._resizeObserver.observe(this._engineContainer);
    } catch (error) {
      console.error(
        `Failed to initialize CompositePanel [${this._api?.id}] renderer:`,
        error,
      );
      if (this._engineContainer) {
        this._engineContainer.textContent = `Error initializing engine renderer: ${error}`;
        this._engineContainer.style.color = "red";
      }
    }
  }

  // Bound event handler for camera transition completion
  private handleCameraTransitionComplete = (event: Event): void => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { position, target } = customEvent.detail;
      // Update the panel's view state with the final camera position
      if (position && target) {
        this.updateViewState({
          cameraPosition: position,
          cameraTarget: target,
        });
      }
      // Now that state is updated, dispatch focus change event
      this.dispatchFocusChangeEvent();
    }
  };

  // Helper to dispatch the focus change event
  private dispatchFocusChangeEvent(): void {
    const currentFocus = this._viewStateStore.get().focusedObjectId;
    console.log(
      `[CompositePanel] Dispatching renderer-focus-changed: ${currentFocus}`,
    );
    const focusEvent = new CustomEvent("renderer-focus-changed", {
      detail: { focusedObjectId: currentFocus },
      bubbles: true,
      composed: true,
    });
    this.element.dispatchEvent(focusEvent); // Dispatch from the panel element
  }

  private initializeUiControls(): void {
    if (!this._uiContainer || !this._params?.params?.sections) return;

    this._uiContainer.innerHTML = ""; // Clear previous content
    const sections = this._params.params.sections;

    // --- Create Left/Right Containers for UI split ---
    const leftUiContainer = document.createElement("div");
    leftUiContainer.classList.add("left-ui-container");
    // Basic flex styling (can be overridden by CSS)
    leftUiContainer.style.display = "flex";
    leftUiContainer.style.flexDirection = "column";
    leftUiContainer.style.height = "100%"; // Allow fill

    const rightUiContainer = document.createElement("div");
    rightUiContainer.classList.add("right-ui-container");
    // Basic flex styling (can be overridden by CSS)
    rightUiContainer.style.display = "flex";
    rightUiContainer.style.flexDirection = "column";
    rightUiContainer.style.height = "100%"; // Allow fill

    this._uiContainer.appendChild(leftUiContainer);
    this._uiContainer.appendChild(rightUiContainer);
    // --- End Left/Right Containers ---

    sections.forEach((config: UiPanelSectionConfig) => {
      try {
        const sectionContainer = document.createElement("collapsible-section");
        sectionContainer.id = config.id;
        sectionContainer.classList.add(config.class);
        sectionContainer.setAttribute("title", config.title);
        if (config.startClosed) {
          sectionContainer.setAttribute("closed", "");
        }
        const isDefined = !!customElements.get(config.componentTag);
        if (!isDefined) {
          throw new Error(
            `Custom element <${config.componentTag}> is not defined.`,
          );
        }
        const contentComponent = document.createElement(
          config.componentTag,
        ) as any; // Use 'any' for now

        // *** CRITICAL STEP: Pass the PARENT PANEL or RENDERER instance ***
        if (
          config.componentTag === "engine-ui-settings-panel" ||
          config.componentTag === "focus-control"
        ) {
          // These components need to call methods on the parent panel
          if (typeof contentComponent.setParentPanel === "function") {
            contentComponent.setParentPanel(this);
          } else {
            console.warn(
              `Component <${config.componentTag}> does not have a setParentPanel method.`,
            );
          }
        } else if (
          config.componentTag === "celestial-info" ||
          config.componentTag === "renderer-info-display"
        ) {
          // These components primarily need read access to the renderer or its state
          if (
            this._renderer &&
            typeof contentComponent.setRenderer === "function"
          ) {
            contentComponent.setRenderer(this._renderer);
          } else if (!this._renderer) {
            console.warn(
              `Cannot set renderer for <${config.componentTag}>: Renderer not ready.`,
            );
          } else {
            console.warn(
              `Component <${config.componentTag}> does not have a setRenderer method.`,
            );
          }
        } else {
          console.warn(
            `Unknown component type for DI: <${config.componentTag}>`,
          );
        }

        // REMOVED: engine-view-id attribute setting

        sectionContainer.appendChild(contentComponent);

        // --- Append to correct container ---
        if (config.id.startsWith("focus-section-")) {
          leftUiContainer.appendChild(sectionContainer);
        } else {
          rightUiContainer.appendChild(sectionContainer);
        }
        // --- End Append ---
      } catch (error) {
        console.error(
          `Error creating section '${config.title}' with component <${config.componentTag}>:`,
          error,
        );
        const errorPlaceholder = document.createElement("div");
        errorPlaceholder.textContent = `Error loading section: ${config.title}`;
        errorPlaceholder.style.color = "red";
        this._uiContainer!.appendChild(errorPlaceholder);
      }
    });
  }

  dispose(): void {
    console.log(`Disposing CompositeEnginePanel ${this._api?.id}`);
    const panelIdForLog = this._api?.id ?? "unknown";

    // Remove camera transition listener
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );

    // Unsubscribe from layout changes
    if (this._layoutUnsubscribe) {
      this._layoutUnsubscribe();
      this._layoutUnsubscribe = null;
    }

    // Dispose renderer
    this._resizeObserver?.disconnect();
    this._renderer?.dispose();
    this._renderer = undefined;
    this._resizeObserver = undefined;

    // Unregister from Panel Registry
    panelRegistry.unregisterPanel(panelIdForLog);

    // Remove event listeners (if any were added directly)
  }
}

// --- Add Constants Needed by Focus Methods ---
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 300);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_CAMERA_DISTANCE = 8;
