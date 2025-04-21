import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjectsStore,
  panelRegistry,
  renderableObjectsStore,
} from "@teskooano/core-state";
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

// --- Constants for Resizer ---
const RESIZER_WIDTH = 4; // px
const MIN_UI_WIDTH_PX = 200;
const MIN_ENGINE_WIDTH_PX = 300;
const MIN_UI_HEIGHT_PX = 150;
const MIN_ENGINE_HEIGHT_PX = 200;
// --- End Constants ---

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

export interface PanelViewState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  focusedObjectId: string | null;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  showAuMarkers?: boolean;
  showDebrisEffects?: boolean;
  showDebugSphere?: boolean;
  fov?: number; // Added FOV to state
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
  private _resizerElement: HTMLElement | undefined; // <-- Add Resizer Element

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

  // --- Resizing State ---
  private _isResizing = false;
  private _initialMousePos = { x: 0, y: 0 };
  private _initialUiSize = { width: 0, height: 0 };
  // Bound event handlers for removal
  private _handleMouseMoveBound = this.handleMouseMove.bind(this);
  private _handleMouseUpBound = this.handleMouseUp.bind(this);
  // --- ADD Touch Handlers ---
  private _handleTouchMoveBound = this.handleTouchMove.bind(this);
  private _handleTouchEndBound = this.handleTouchEnd.bind(this);
  // --- END ADD ---
  // --- End Resizing State ---

  // --- Internal View State Store (Copied from old EnginePanel) ---
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
    // Initial flex values will be adjusted by orientation CSS and resizing
    // this._engineContainer.style.flex = "1 1 auto"; // Removed initial fixed flex
    this._engineContainer.style.position = "relative"; // Needed for renderer?
    this._engineContainer.style.overflow = "hidden";
    this._element.appendChild(this._engineContainer);

    // --- Create Resizer Element ---
    this._resizerElement = document.createElement("div");
    this._resizerElement.classList.add("internal-resizer");
    // Style will be added in CSS, but basic width/height needed
    this._resizerElement.style.flex = `0 0 ${RESIZER_WIDTH}px`; // Fixed width
    this._resizerElement.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
    );
    // --- ADD Touch Start Listener ---
    this._resizerElement.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }, // Need passive: false to prevent default scroll
    );
    // --- END ADD ---
    this._element.appendChild(this._resizerElement);
    // --- End Resizer Element ---

    this._uiContainer = document.createElement("div");
    this._uiContainer.classList.add("ui-container");
    // Initial flex values will be adjusted by orientation CSS and resizing
    // this._uiContainer.style.flex = "0 0 300px"; // Removed initial fixed flex
    this._uiContainer.style.overflowY = "auto"; // Allow UI scrolling
    this._uiContainer.style.overflowX = "hidden";
    this._uiContainer.style.boxSizing = "border-box";
    // Border will be added in CSS based on orientation
    // this._uiContainer.style.borderLeft = "1px solid var(--color-border)";
    this._element.appendChild(this._uiContainer);

    // --- Subscribe to layout orientation changes ---
    this._layoutUnsubscribe = layoutOrientationStore.subscribe(
      (orientation) => {
        if (this._currentOrientation !== orientation) {
          this._currentOrientation = orientation;
          this.updateLayoutClassesAndResizer(orientation); // Call new method
          // Force renderer resize after potential layout shifts
          this.triggerResize();
        }
      },
    );
    // Apply initial class and resizer style
    const initialOrientation = layoutOrientationStore.get();
    this._currentOrientation = initialOrientation;
    this.updateLayoutClassesAndResizer(initialOrientation); // Call new method
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
      fov: DEFAULT_PANEL_FOV, // Initialize FOV state
    });
  }

  // --- NEW: Update Layout Classes and Resizer Style ---
  private updateLayoutClassesAndResizer(orientation: Orientation): void {
    if (!this._element || !this._resizerElement) return;

    if (orientation === "portrait") {
      this._element.classList.remove("layout-internal-landscape");
      this._element.classList.add("layout-internal-portrait");
      // Resizer style for portrait (horizontal drag)
      this._resizerElement.style.height = `${RESIZER_WIDTH}px`;
      this._resizerElement.style.width = "100%";
      this._resizerElement.style.cursor = "row-resize";
      // Reset flex basis if needed (handled by CSS mostly now)
      if (this._uiContainer) this._uiContainer.style.flexBasis = "";
    } else {
      this._element.classList.remove("layout-internal-portrait");
      this._element.classList.add("layout-internal-landscape");
      // Resizer style for landscape (vertical drag)
      this._resizerElement.style.width = `${RESIZER_WIDTH}px`;
      this._resizerElement.style.height = "100%";
      this._resizerElement.style.cursor = "col-resize";
      // Reset flex basis if needed (handled by CSS mostly now)
      if (this._uiContainer) this._uiContainer.style.flexBasis = "";
    }
  }
  // --- END NEW ---

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

  /**
   * Public method to get the renderer instance (if initialized)
   */
  public getRenderer(): ModularSpaceRenderer | undefined {
    return this._renderer;
  }

  // --- Add getRendererStats method ---
  public getRendererStats(): RendererStats | null {
    if (this._renderer?.animationLoop) {
      // Call the new method on AnimationLoop
      return this._renderer.animationLoop.getCurrentStats();
    } else {
      // Return null or default stats if renderer/loop isn't ready
      return null;
    }
  }
  // --- End getRendererStats method ---

  // --- Add orbitManager getter ---
  public get orbitManager(): OrbitManager | undefined {
    // Return the orbitManager directly from the renderer instance
    return this._renderer?.orbitManager;
  }
  // --- End orbitManager getter ---

  // Apply specific state updates to the internal renderer
  private applyViewStateToRenderer(updates: Partial<PanelViewState>): void {
    if (!this._renderer) return;

    // Apply individual state changes to the renderer components
    if (updates.showGrid !== undefined) {
      this._renderer.sceneManager.setGridVisible(updates.showGrid);
    }
    if (updates.showCelestialLabels !== undefined) {
      this._renderer.css2DManager?.setLayerVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        updates.showCelestialLabels,
      );
    }
    if (updates.showAuMarkers !== undefined) {
      this._renderer.sceneManager.setAuMarkersVisible(updates.showAuMarkers);
    }
    if (updates.showDebrisEffects !== undefined) {
      // TODO: Implement debris effect toggle in renderer
      console.warn(
        "Debris effects toggle not yet implemented in renderer.",
        updates.showDebrisEffects,
      );
    }
    if (updates.fov !== undefined) {
      this._renderer.sceneManager.setFov(updates.fov);
    }

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

      if (!renderableObject?.position) {
        console.error(
          `[CompositePanel ${this._api?.id}] focusOnObject: Cannot focus on ${objectId}, missing renderable or its position. Renderables dump:`,
          renderables,
        );
        return;
      }
      const targetPosition = renderableObject.position.clone();
      const calculatedDistance = distance ?? DEFAULT_CAMERA_DISTANCE; // Ensure valid number
      const cameraPosition = targetPosition
        .clone()
        .add(CAMERA_OFFSET.clone().multiplyScalar(calculatedDistance));

      // Call the renderer's setFollowTarget with the calculated positions
      // This will initiate the moveTo transition within the renderer
      this._renderer.setFollowTarget(objectId, targetPosition, cameraPosition);

      this.updateViewState({ focusedObjectId: objectId }); // Update internal state
      // TODO: Consider emitting 'renderer-focus-changed' event?
      // Event emission is handled by camera transition completion now
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
    if (this._isInitialized) {
      console.warn(
        `[CompositePanel ${this._api?.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }
    this._isInitialized = true; // Mark as initialized

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

    // --- Set initial placeholder state ---
    if (this._engineContainer) {
      // this._engineContainer.textContent = "Waiting for celestial objects data...";
      this._engineContainer.innerHTML = ""; // Clear first
      this._engineContainer.appendChild(
        document.createElement("engine-placeholder"),
      );
    }
    if (this._uiContainer) {
      this._uiContainer.innerHTML = ""; // Clear any old UI
      // this._uiContainer.textContent = "Waiting for controls data..."; // Placeholder for UI
      this._uiContainer.appendChild(document.createElement("ui-placeholder"));
    }
    // --- End initial placeholder state ---

    // --- Subscribe to celestial objects data ---
    this._dataListenerUnsubscribe?.(); // Unsubscribe previous listener if any
    this._dataListenerUnsubscribe = celestialObjectsStore.subscribe(
      (celestialObjects) => {
        // Ensure panel hasn't been disposed prematurely
        if (!this._isInitialized) {
          return;
        }

        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0) {
          // Data is available, and renderer isn't initialized yet
          console.log(
            `[CompositePanel ${this._api?.id}] Data received, initializing renderer and UI...`,
          );
          // Clear placeholders before initializing
          if (this._engineContainer) this._engineContainer.textContent = "";
          if (this._uiContainer) this._uiContainer.textContent = "";

          this.initializeRenderer();
          this.initializeUiControls();

          // Start simulation loop globally only once
          if (!isSimulationLoopStarted) {
            console.log(
              `[CompositePanel ${this._api?.id}] Starting global simulation loop.`,
            );
            startSimulationLoop();
            isSimulationLoopStarted = true;
          }

          // Trigger initial resize after initialization
          this.triggerResize();
        } else if (this._renderer && objectCount === 0) {
          // Renderer exists, but data has disappeared
          console.log(
            `[CompositePanel ${this._api?.id}] Data removed, disposing renderer and UI.`,
          );
          this.disposeRendererAndUI(); // Dispose renderer and clear UI
          // Reset to placeholder state
          if (this._engineContainer) {
            // this._engineContainer.textContent =
            //   "Waiting for celestial objects data...";
            this._engineContainer.innerHTML = "";
            this._engineContainer.appendChild(
              document.createElement("engine-placeholder"),
            );
          }
          if (this._uiContainer) {
            this._uiContainer.innerHTML = "";
            // this._uiContainer.textContent = "Waiting for controls data...";
            this._uiContainer.appendChild(
              document.createElement("ui-placeholder"),
            );
          }
        }
      },
    );
    // --- End data subscription ---
  }

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
        showCelestialLabels: true,
        showAuMarkers: this._viewStateStore.get().showAuMarkers,
      });

      // Get initial state from this panel's store
      const initialState = this._viewStateStore.get();

      // --- Set Initial Camera State --- (Replaces updateCamera and setFollowTarget calls)
      let initialTargetPosition = initialState.cameraTarget.clone(); // Default target

      if (initialState.focusedObjectId) {
        // If initial focus is set, try to find the object and use its position as the target
        const initialFocusObject =
          renderableObjectsStore.get()[initialState.focusedObjectId];
        if (initialFocusObject?.position) {
          // Use the object's position as the initial target
          initialTargetPosition.copy(initialFocusObject.position);
        } else {
          console.warn(
            `[CompositePanel Init] Initial focused object ${initialState.focusedObjectId} not found or has no position. Using default target.`,
          );
          // Keep default target, but clear the invalid focus ID from state
          this.updateViewState({ focusedObjectId: null });
        }
      } else {
        console.warn(
          "[CompositePanel Init] No initial focus ID. Using default target.",
        );
      }

      // Set camera position directly from initial state
      this._renderer.camera.position.copy(initialState.cameraPosition);
      // Set controls target based on calculated initialTargetPosition
      this._renderer.controlsManager.controls.target.copy(
        initialTargetPosition,
      );
      // Perform an initial update on controls to sync
      this._renderer.controlsManager.controls.update();

      // --- End Set Initial Camera State ---

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

      // --- Apply Initial State Immediately ---
      this.applyViewStateToRenderer(this.getViewState());
      // --- End Apply Initial State ---
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
        } else if (config.componentTag === "renderer-info-display") {
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
          // Only warn if it's not a known component that doesn't need specific DI
          if (config.componentTag !== "celestial-info") {
            console.warn(
              `Unknown component type for DI: <${config.componentTag}>`,
            );
          }
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

  // --- NEW Resizer Event Handlers ---
  private handleMouseDown(event: MouseEvent): void {
    if (!this._uiContainer || !this._resizerElement) return;

    this._isResizing = true;
    this._resizerElement.classList.add("resizing"); // Add class for visual feedback
    this._initialMousePos = { x: event.clientX, y: event.clientY };

    // Get initial size based on orientation
    if (this._currentOrientation === "landscape") {
      this._initialUiSize = { width: this._uiContainer.offsetWidth, height: 0 };
    } else {
      this._initialUiSize = {
        width: 0,
        height: this._uiContainer.offsetHeight,
      };
    }

    // Attach move/up listeners to the window to capture events outside the resizer
    window.addEventListener("mousemove", this._handleMouseMoveBound);
    window.addEventListener("mouseup", this._handleMouseUpBound);
    window.addEventListener("mouseleave", this._handleMouseUpBound); // Stop if mouse leaves window

    // Prevent text selection during drag
    event.preventDefault();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (
      !this._isResizing ||
      !this._resizerElement ||
      !this._uiContainer ||
      !this._engineContainer
    )
      return;

    // --- REFACTOR: Call shared resize logic ---
    this._performResize(event.clientX, event.clientY);
    // --- END REFACTOR ---
  }

  private handleMouseUp(): void {
    if (!this._isResizing) return;

    this._isResizing = false;
    if (this._resizerElement) {
      this._resizerElement.classList.remove("resizing");
    }

    // Remove global listeners
    window.removeEventListener("mousemove", this._handleMouseMoveBound);
    window.removeEventListener("mouseup", this._handleMouseUpBound);
    window.removeEventListener("mouseleave", this._handleMouseUpBound);

    // Final resize call for the renderer
    this.triggerResize();
  }
  // --- END Resizer Event Handlers ---

  // --- ADD Touch Handlers ---
  private handleTouchStart(event: TouchEvent): void {
    if (!this._resizerElement || !this._uiContainer || !this._engineContainer)
      return;
    // Only handle single touch resize
    if (event.touches.length !== 1) {
      return;
    }

    event.preventDefault(); // Prevent scrolling while dragging

    this._isResizing = true;
    const touch = event.touches[0];
    this._initialMousePos = { x: touch.clientX, y: touch.clientY }; // Reuse same state variable

    if (this._currentOrientation === "landscape") {
      this._initialUiSize = { width: this._uiContainer.offsetWidth, height: 0 };
    } else {
      this._initialUiSize = {
        width: 0,
        height: this._uiContainer.offsetHeight,
      };
    }

    // Add listeners to the document to capture movement outside the resizer
    document.addEventListener("touchmove", this._handleTouchMoveBound, {
      passive: false,
    }); // Need passive: false here too
    document.addEventListener("touchend", this._handleTouchEndBound);
    document.addEventListener("touchcancel", this._handleTouchEndBound); // Handle cancellations too
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this._isResizing || event.touches.length !== 1) return;

    event.preventDefault(); // Prevent scrolling

    const touch = event.touches[0];
    // --- REFACTOR: Call shared resize logic ---
    this._performResize(touch.clientX, touch.clientY);
    // --- END REFACTOR ---
  }

  private handleTouchEnd(): void {
    if (!this._isResizing) return;

    this._isResizing = false;
    // Remove listeners from the document
    document.removeEventListener("touchmove", this._handleTouchMoveBound);
    document.removeEventListener("touchend", this._handleTouchEndBound);
    document.removeEventListener("touchcancel", this._handleTouchEndBound);
  }
  // --- END ADD Touch Handlers ---

  // --- ADD Shared Resize Logic ---
  private _performResize(currentX: number, currentY: number): void {
    if (
      !this._isResizing ||
      !this._resizerElement ||
      !this._uiContainer ||
      !this._engineContainer
    )
      return;

    if (this._currentOrientation === "landscape") {
      const deltaX = currentX - this._initialMousePos.x;
      let newUiWidth = this._initialUiSize.width - deltaX; // Dragging left decreases width

      // Enforce minimum widths
      const containerWidth = this._element.offsetWidth;
      const maxUiWidth = containerWidth - MIN_ENGINE_WIDTH_PX - RESIZER_WIDTH;
      newUiWidth = Math.max(MIN_UI_WIDTH_PX, Math.min(newUiWidth, maxUiWidth));

      if (this._uiContainer) {
        this._uiContainer.style.flexBasis = `${newUiWidth}px`;
        // Ensure other panels adjust correctly (might not be strictly necessary with flex)
        // this._engineContainer.style.flexBasis = `${containerWidth - newUiWidth - RESIZER_WIDTH}px`;
      }
    } else {
      // Portrait
      const deltaY = currentY - this._initialMousePos.y;
      let newUiHeight = this._initialUiSize.height - deltaY; // Dragging up decreases height

      // Enforce minimum heights
      const containerHeight = this._element.offsetHeight;
      const maxUiHeight =
        containerHeight - MIN_ENGINE_HEIGHT_PX - RESIZER_WIDTH;
      newUiHeight = Math.max(
        MIN_UI_HEIGHT_PX,
        Math.min(newUiHeight, maxUiHeight),
      );

      if (this._uiContainer) {
        this._uiContainer.style.flexBasis = `${newUiHeight}px`;
        // Ensure other panels adjust correctly
        // this._engineContainer.style.flexBasis = `${containerHeight - newUiHeight - RESIZER_WIDTH}px`;
      }
    }
    // Debounce or directly trigger resize? Direct for now.
    this.triggerResize(); // Ensure renderer resizes if needed
  }
  // --- END ADD Shared Resize Logic ---

  private disposeRendererAndUI(): void {
    console.log(
      `[CompositePanel ${this._api?.id}] Disposing renderer and UI...`,
    );
    this._renderer?.dispose();
    this._renderer = undefined;
    if (this._uiContainer) this._uiContainer.innerHTML = ""; // Clear UI controls
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }
    // Remove resizer listeners on dispose
    if (this._resizerElement) {
      this._resizerElement.removeEventListener(
        "mousedown",
        this.handleMouseDown,
      );
    }
    // Clean up window listeners if component is disposed mid-drag
    window.removeEventListener("mousemove", this._handleMouseMoveBound);
    window.removeEventListener("mouseup", this._handleMouseUpBound);
    window.removeEventListener("mouseleave", this._handleMouseUpBound);
  }

  dispose(): void {
    const panelIdForLog = this._api?.id ?? "unknown";
    console.log(`[CompositePanel ${panelIdForLog}] Disposing...`);
    this._isInitialized = false; // Mark as disposed

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

    // --- Unsubscribe from data listener ---
    if (this._dataListenerUnsubscribe) {
      this._dataListenerUnsubscribe();
      this._dataListenerUnsubscribe = null;
    }
    // --- End data unsubscribe ---

    // --- Dispose renderer and UI (already handles resizer listeners) ---
    this.disposeRendererAndUI();
    // --- End dispose ---

    // Unregister from Panel Registry
    panelRegistry.unregisterPanel(panelIdForLog);

    // Remove event listeners (if any were added directly)
  }

  // --- ADD setFov method ---
  public setFov(fov: number): void {
    this.updateViewState({ fov });
  }
  // --- End Add ---
}

// --- Add Constants Needed by Focus Methods ---
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 300);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_CAMERA_DISTANCE = 8;
