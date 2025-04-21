import { startSimulationLoop } from "@teskooano/app-simulation";
import { celestialObjectsStore, panelRegistry } from "@teskooano/core-state";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { atom, type WritableAtom } from "nanostores";
import * as THREE from "three";

// --- Import placeholder components ---
import "./EnginePlaceholder";
import "../ui-controls/UiPlaceholder";
// --- End Import ---

// --- ADD THREEJS OrbitManager ---
import { OrbitManager } from "@teskooano/renderer-threejs-visualization";
// --- END ADD ---

import { layoutOrientationStore, Orientation } from "../../stores/layoutStore";
import "../shared/CollapsibleSection"; // Needed for UI sections
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";

// --- Import the new PanelResizer ---
import { PanelResizer } from "./PanelResizer";
import { CameraManager } from "./CameraManager";

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
interface RendererStats {
  fps?: number;
  drawCalls?: number;
  triangles?: number;
  memory?: { usedJSHeapSize?: number };
}

// Default FOV for the panel state, aligning with SceneManager's default
const DEFAULT_PANEL_FOV = 75;

/**
 * Represents the internal view state of an engine panel, including camera,
 * focus, and display options.
 */
export interface PanelViewState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  focusedObjectId: string | null;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  showAuMarkers?: boolean;
  showDebrisEffects?: boolean;
  showDebugSphere?: boolean;
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
  private _uiContainer: HTMLElement | undefined;
  private _resizerElement: HTMLElement | undefined;
  private _panelResizer: PanelResizer | undefined; // <-- Add PanelResizer instance

  private _params:
    | (GroupPanelPartInitParameters & { params?: CompositePanelParams })
    | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;

  // --- View Orientation Handling ---
  private _layoutUnsubscribe: (() => void) | null = null;
  private _currentOrientation: Orientation | null = null;
  private _dataListenerUnsubscribe: (() => void) | null = null;
  private _isInitialized = false;

  // --- Add CameraManager instance ---
  private _cameraManager: CameraManager | undefined;

  // --- Internal View State Store (Copied from old EnginePanel) ---
  private _viewStateStore: WritableAtom<PanelViewState>;

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

    this._engineContainer = document.createElement("div");
    this._engineContainer.classList.add("engine-container");
    this._engineContainer.style.position = "relative";
    this._engineContainer.style.overflow = "hidden";
    this._element.appendChild(this._engineContainer);

    this._resizerElement = document.createElement("div");
    this._resizerElement.classList.add("internal-resizer");
    // Basic size is now handled by PanelResizer, listeners removed
    this._resizerElement.style.flex = `0 0 auto`; // Let PanelResizer control size
    this._element.appendChild(this._resizerElement);

    this._uiContainer = document.createElement("div");
    this._uiContainer.classList.add("ui-container");
    this._uiContainer.style.overflowY = "auto";
    this._uiContainer.style.overflowX = "hidden";
    this._uiContainer.style.boxSizing = "border-box";
    this._element.appendChild(this._uiContainer);

    // Subscribe to layout orientation changes
    this._layoutUnsubscribe = layoutOrientationStore.subscribe(
      (orientation) => {
        if (this._currentOrientation !== orientation) {
          this._currentOrientation = orientation;
          this.updateLayoutOrientation(orientation); // Call updated method
          this.triggerResize(); // Force renderer resize
        }
      },
    );

    // Apply initial layout based on current orientation
    const initialOrientation = layoutOrientationStore.get();
    this._currentOrientation = initialOrientation;
    this.updateLayoutOrientation(initialOrientation);

    // Initialize internal view state store
    this._viewStateStore = atom<PanelViewState>({
      cameraPosition: new THREE.Vector3(200, 200, 200), // Default starting position
      cameraTarget: new THREE.Vector3(0, 0, 0), // Default starting target
      focusedObjectId: null,
      showGrid: true,
      showCelestialLabels: true,
      showAuMarkers: true,
      showDebrisEffects: false,
      showDebugSphere: false,
      fov: DEFAULT_PANEL_FOV,
    });
  }

  /**
   * Updates the flex layout classes and resizer style based on orientation.
   * Delegates resizer styling to the PanelResizer instance.
   * @param orientation The new layout orientation ('portrait' or 'landscape').
   */
  private updateLayoutOrientation(orientation: Orientation): void {
    if (!this._element) return;

    // Update main element layout classes
    if (orientation === "portrait") {
      this._element.classList.remove("layout-internal-landscape");
      this._element.classList.add("layout-internal-portrait");
    } else {
      this._element.classList.remove("layout-internal-portrait");
      this._element.classList.add("layout-internal-landscape");
    }

    // Update resizer style via the PanelResizer instance
    this._panelResizer?.updateResizerStyle(orientation);

    // Reset UI container flex basis if needed (allowing CSS or PanelResizer to control)
    if (this._uiContainer) this._uiContainer.style.flexBasis = "";
  }

  /**
   * Retrieves the current view state of the panel.
   * @returns A read-only copy of the current PanelViewState.
   */
  public getViewState(): Readonly<PanelViewState> {
    return this._viewStateStore.get();
  }

  /**
   * Updates the panel's view state with the provided partial state.
   * Merges the updates with the existing state and applies relevant changes
   * to the underlying renderer instance.
   * @param updates - An object containing the state properties to update.
   */
  public updateViewState(updates: Partial<PanelViewState>): void {
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
    callback: (state: PanelViewState) => void,
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
   * Applies specific view state updates directly to the renderer's components.
   * This is called internally when the view state is updated.
   * @param updates - The partial view state containing changes to apply.
   */
  private applyViewStateToRenderer(updates: Partial<PanelViewState>): void {
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
      console.warn(
        "Debris effects toggle not yet implemented in renderer.",
        updates.showDebrisEffects,
      );
    }
    if (updates.fov !== undefined) {
      this._renderer.sceneManager.setFov(updates.fov);
    }
    // Add other state applications here as needed
  }

  // --- Public methods for UI controls to call (Calls updateViewState internally) ---
  /** Toggles the visibility of the grid helper in the renderer. */
  public setShowGrid(visible: boolean): void {
    this.updateViewState({ showGrid: visible });
  }
  /** Toggles the visibility of celestial body labels. */
  public setShowCelestialLabels(visible: boolean): void {
    this.updateViewState({ showCelestialLabels: visible });
  }
  /** Toggles the visibility of Astronomical Unit (AU) markers. */
  public setShowAuMarkers(visible: boolean): void {
    this.updateViewState({ showAuMarkers: visible });
  }
  /** Enables or disables debris effects (placeholder). */
  public setDebrisEffectsEnabled(visible: boolean): void {
    this.updateViewState({ showDebrisEffects: visible });
  }
  /** Sets the camera's Field of View (FOV). */
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
  // --- End FocusControl Methods ---

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
   * Dockview lifecycle method: Initializes the panel's content and renderer.
   * Sets up data listeners, placeholders, and the PanelResizer.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  init(parameters: GroupPanelPartInitParameters): void {
    if (this._isInitialized) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }

    this._params = parameters as GroupPanelPartInitParameters & {
      params?: CompositePanelParams;
    };
    this._api = parameters.api;
    this._element.id = `composite-engine-view-${this._api?.id}`; // Ensure unique ID

    // --- Instantiate PanelResizer ---
    if (this._resizerElement && this._uiContainer && this._engineContainer) {
      this._panelResizer = new PanelResizer({
        resizerElement: this._resizerElement,
        uiContainer: this._uiContainer,
        engineContainer: this._engineContainer,
        parentElement: this._element,
        initialOrientation:
          this._currentOrientation ?? layoutOrientationStore.get(), // Use current or initial
        onResizeCallback: this.triggerResize.bind(this), // Pass triggerResize
      });
    } else {
      console.error(
        "[CompositePanel] Failed to initialize PanelResizer: Required elements missing.",
      );
    }
    // --- End Instantiate PanelResizer ---

    // Register with Panel Registry
    if (this._api) {
      panelRegistry.registerPanel(this._api.id, this);
    } else {
      console.error(
        "[CompositePanel] Cannot register panel: API not available at init time.",
      );
    }

    // Set initial placeholder state
    if (this._engineContainer) {
      this._engineContainer.innerHTML = "";
      this._engineContainer.appendChild(
        document.createElement("engine-placeholder"),
      );
    }
    if (this._uiContainer) {
      this._uiContainer.innerHTML = "";
      this._uiContainer.appendChild(document.createElement("ui-placeholder"));
    }

    // Subscribe to celestial objects data to trigger renderer/UI setup
    this._dataListenerUnsubscribe?.(); // Clean up previous listener if any
    this._dataListenerUnsubscribe = celestialObjectsStore.subscribe(
      (celestialObjects) => {
        // Only proceed if the panel hasn't been disposed
        if (!this._element.isConnected) {
          console.log(
            `[CompositePanel ${this._api?.id}] Data update received, but panel element is disconnected. Ignoring.`,
          );
          return; // Don't initialize if element is detached
        }

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0) {
          // Data available, renderer not initialized: Initialize
          console.log(
            `[CompositePanel ${this._api?.id}] Data received, initializing renderer and UI...`,
          );
          if (this._engineContainer) this._engineContainer.innerHTML = ""; // Clear placeholder
          if (this._uiContainer) this._uiContainer.innerHTML = ""; // Clear placeholder

          this.initializeRenderer();
          this.initializeUiControls();

          // Start simulation loop globally (if not already started)
          if (!isSimulationLoopStarted) {
            console.log(
              `[CompositePanel ${this._api?.id}] Starting global simulation loop.`,
            );
            startSimulationLoop();
            isSimulationLoopStarted = true;
          }

          this.triggerResize(); // Trigger initial resize
        } else if (this._renderer && objectCount === 0) {
          // Renderer exists, but data disappeared: Dispose renderer/UI
          console.log(
            `[CompositePanel ${this._api?.id}] Data removed, disposing renderer and UI.`,
          );
          this.disposeRendererAndUI(); // Clean up
          // Reset to placeholder state
          if (this._engineContainer) {
            this._engineContainer.innerHTML = "";
            this._engineContainer.appendChild(
              document.createElement("engine-placeholder"),
            );
          }
          if (this._uiContainer) {
            this._uiContainer.innerHTML = "";
            this._uiContainer.appendChild(
              document.createElement("ui-placeholder"),
            );
          }
        }
      },
    );

    this._isInitialized = true; // Mark as initialized *after* setup
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
        showDebugSphere: this._viewStateStore.get().showDebugSphere ?? false,
        showGrid: this._viewStateStore.get().showGrid,
        showCelestialLabels: true, // Defaulting to true, controlled by state later
        showAuMarkers: this._viewStateStore.get().showAuMarkers,
      });

      // --- Initialize Camera Manager ---
      this._cameraManager = new CameraManager({
        renderer: this._renderer,
        viewStateAtom: this._viewStateStore,
        // Provide a callback for the CameraManager to notify the panel of focus changes
        // This allows the panel (or other interested components) to react, e.g., update UI state
        onFocusChangeCallback: (focusedId) => {
          // Example: Log the focus change, could also dispatch an event
          console.log(
            `[CompositePanel ${this._api?.id}] CameraManager reported focus change: ${focusedId}`,
          );
          // We could dispatch the 'renderer-focus-changed' event here if needed externally
          // this.dispatchFocusChangeEvent(); // Assuming this method is re-added or handled differently
        },
      });
      // Set initial camera position using the manager
      this._cameraManager.initializeCameraPosition();
      // --- End Initialize Camera Manager ---

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
   * Initializes the UI controls section based on the configuration
   * provided in the panel parameters. Creates collapsible sections
   * and injects the specified custom elements.
   */
  private initializeUiControls(): void {
    if (!this._uiContainer || !this._params?.params?.sections) return;

    this._uiContainer.innerHTML = ""; // Clear previous content
    const sections = this._params.params.sections;

    // --- Create Left/Right Containers for UI split ---
    const leftUiContainer = document.createElement("div");
    leftUiContainer.classList.add("left-ui-container");
    leftUiContainer.style.display = "flex";
    leftUiContainer.style.flexDirection = "column";
    leftUiContainer.style.height = "100%";

    const rightUiContainer = document.createElement("div");
    rightUiContainer.classList.add("right-ui-container");
    rightUiContainer.style.display = "flex";
    rightUiContainer.style.flexDirection = "column";
    rightUiContainer.style.height = "100%";

    this._uiContainer.appendChild(leftUiContainer);
    this._uiContainer.appendChild(rightUiContainer);
    // --- End Left/Right Containers ---

    sections.forEach((config: UiPanelSectionConfig) => {
      try {
        const sectionContainer = document.createElement("collapsible-section");
        sectionContainer.id = config.id;
        sectionContainer.classList.add(config.class);
        sectionContainer.setAttribute("section-title", config.title); // Use 'section-title' attribute
        if (config.startClosed) {
          sectionContainer.setAttribute("closed", "");
        }

        // Check if the custom element is defined before creating it
        const isDefined = !!customElements.get(config.componentTag);
        if (!isDefined) {
          throw new Error(
            `Custom element <${config.componentTag}> is not defined. Make sure it's imported and registered.`,
          );
        }
        const contentComponent = document.createElement(config.componentTag);

        // Dependency Injection: Pass panel or renderer instance to specific components
        if (typeof (contentComponent as any).setParentPanel === "function") {
          (contentComponent as any).setParentPanel(this);
        } else if (
          typeof (contentComponent as any).setRenderer === "function" &&
          this._renderer
        ) {
          (contentComponent as any).setRenderer(this._renderer);
        } else if (
          typeof (contentComponent as any).setRenderer === "function"
        ) {
          // Log warning if setRenderer exists but renderer isn't ready yet
          console.warn(
            `[CompositePanel] setRenderer exists on <${config.componentTag}>, but renderer is not yet initialized.`,
          );
        }

        sectionContainer.appendChild(contentComponent);

        // Append to the appropriate container based on ID prefix or other logic
        // Simple example: focus controls go left, others go right
        if (config.id.startsWith("focus-section-")) {
          leftUiContainer.appendChild(sectionContainer);
        } else {
          rightUiContainer.appendChild(sectionContainer);
        }
      } catch (error) {
        console.error(
          `Error creating UI section '${config.title}' with component <${config.componentTag}>:`,
          error,
        );
        const errorPlaceholder = document.createElement("div");
        errorPlaceholder.textContent = `Error loading section: ${config.title}`;
        errorPlaceholder.style.color = "var(--color-error, red)"; // Use CSS variable if available
        errorPlaceholder.style.padding = "0.5em";
        // Append error placeholder to the main UI container for visibility
        this._uiContainer!.appendChild(errorPlaceholder);
      }
    });
  }

  /**
   * Cleans up the renderer instance, UI controls, and associated observers/listeners.
   * Called when data disappears or the panel is disposed.
   */
  private disposeRendererAndUI(): void {
    console.log(
      `[CompositePanel ${this._api?.id ?? "unknown"}] Disposing renderer and UI...`,
    );
    this._renderer?.dispose();
    this._renderer = undefined;

    if (this._uiContainer) this._uiContainer.innerHTML = ""; // Clear UI

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }

    // Destroy the CameraManager (handles its own listener cleanup)
    this._cameraManager?.destroy();
    this._cameraManager = undefined;

    // Destroy the PanelResizer (handles its own listener cleanup)
    this._panelResizer?.destroy();
    this._panelResizer = undefined;
  }

  /**
   * Dockview lifecycle method: Cleans up all resources associated with the panel.
   * Stops listeners, disposes the renderer, and unregisters the panel.
   */
  dispose(): void {
    const panelIdForLog = this._api?.id ?? "unknown";
    console.log(`[CompositePanel ${panelIdForLog}] Disposing...`);
    this._isInitialized = false; // Mark as disposed early

    // Unsubscribe from layout changes
    this._layoutUnsubscribe?.();
    this._layoutUnsubscribe = null;

    // Unsubscribe from data listener
    this._dataListenerUnsubscribe?.();
    this._dataListenerUnsubscribe = null;

    // Dispose renderer and UI (handles renderer disposal, resize observer, UI clear)
    this.disposeRendererAndUI();

    // Unregister from Panel Registry
    panelRegistry.unregisterPanel(panelIdForLog);
  }
}
