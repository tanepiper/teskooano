import { startSimulationLoop } from "@teskooano/app-simulation";
import {
  celestialObjectsStore,
  panelRegistry,
  type PanelViewState,
  renderableObjectsStore,
} from "@teskooano/core-state";
import {
  CelestialType,
  scaleSize,
  CelestialStatus,
  OortCloudProperties,
  SCALE,
} from "@teskooano/data-types"; // Need CelestialType & scaleSize
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { OrbitManager } from "@teskooano/renderer-threejs-visualization";
import {
  DockviewPanelApi,
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { atom, type WritableAtom } from "nanostores"; // Add nanostores import
import * as THREE from "three";

import { layoutOrientationStore, Orientation } from "../../stores/layoutStore"; // Import layout store

let isSimulationLoopStarted = false;

// --- Constants for Camera Focusing (Copied from FocusControl) ---
const CAMERA_DISTANCES: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 10,
  [CelestialType.GAS_GIANT]: 3,
  [CelestialType.PLANET]: 1,
  [CelestialType.DWARF_PLANET]: 1,
  [CelestialType.MOON]: 1,
};
const DEFAULT_CAMERA_DISTANCE = 5;
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 300);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
// --- End Constants ---

// --- Interface for Renderer Stats (Matching RendererInfoDisplay) ---
interface RendererStats {
  fps?: number;
  drawCalls?: number;
  triangles?: number;
  memory?: { usedJSHeapSize?: number };
}

/**
 * A Dockview panel specifically for rendering the Three.js engine view.
 */
export class EnginePanel implements IContentRenderer {
  private readonly _element: HTMLElement;
  // private _params: GroupPanelPartInitParameters | undefined;
  private _api: DockviewPanelApi | undefined;
  private _renderer: ModularSpaceRenderer | undefined;
  private _resizeObserver: ResizeObserver | undefined;
  private _dataListenerUnsubscribe: (() => void) | null = null;
  private _isInitialized = false;
  // --- View Orientation Handling ---
  private _layoutUnsubscribe: (() => void) | null = null;
  private _currentOrientation: Orientation | null = null;

  // --- Internal View State ---
  private _previousViewState: PanelViewState | null = null;
  private _viewStateStore: WritableAtom<PanelViewState>;
  // Store pending focus request from events as a queue
  private _pendingFocusQueue: Array<{
    objectId: string | null;
    distance?: number;
  }> = [];
  // Store unsubscribe for renderable objects listener
  private _renderableObjectsUnsubscribe: (() => void) | null = null;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this._element.id = `engine-view-${this._api?.id}`;
    this._element.classList.add("engine-view");
    // Style the container for the renderer
    this._element.style.height = "100%";
    this._element.style.width = "100%";
    this._element.style.overflow = "hidden"; // Prevent scrollbars from renderer canvas
    this._element.textContent = "Engine Initializing..."; // Placeholder

    // --- Subscribe to layout orientation changes ---
    this._layoutUnsubscribe = layoutOrientationStore.subscribe((orientation) => {
      if (this._currentOrientation !== orientation) {
        this._currentOrientation = orientation;
        console.log(`EnginePanel [${this._api?.id}] orientation: ${orientation}`); // Debug
        if (orientation === "portrait") {
          this._element.classList.remove("layout-internal-landscape");
          this._element.classList.add("layout-internal-portrait");
        } else {
          this._element.classList.remove("layout-internal-portrait");
          this._element.classList.add("layout-internal-landscape");
        }
        // Force renderer resize after potential layout shifts
        const { clientWidth, clientHeight } = this._element;
        if (clientWidth > 0 && clientHeight > 0) {
          this._renderer?.onResize(clientWidth, clientHeight);
        }
      }
    });
    // Apply initial class (important if store already has a value)
    const initialOrientation = layoutOrientationStore.get();
    this._currentOrientation = initialOrientation;
    if (initialOrientation === "portrait") {
      this._element.classList.add("layout-internal-portrait");
    } else {
      this._element.classList.add("layout-internal-landscape");
    }
    // --- End layout subscription ---

    // Initialize internal view state with defaults
    this._viewStateStore = atom<PanelViewState>({
      cameraPosition: new THREE.Vector3(200, 200, 200), // Default initial position
      cameraTarget: new THREE.Vector3(0, 0, 0), // Default look-at target
      focusedObjectId: null,
      showGrid: true, // Default to true
      showCelestialLabels: true, // Default to true
      showAuMarkers: true, // Added: Default to true
      showDebrisEffects: false, // Default to true
    });
    // Store initial state for comparison
    this._previousViewState = this._viewStateStore.get();
  }

  // Public method to get the current view state (read-only view)
  public getViewState(): Readonly<PanelViewState> {
    return this._viewStateStore.get();
  }

  // Public method to update parts of the view state
  public updateViewState(updates: Partial<PanelViewState>): void {
    this._viewStateStore.set({
      ...this._viewStateStore.get(),
      ...updates,
    });
    // Maybe trigger renderer update if needed immediately?
    // this.applyViewStateToRenderer();
  }

  // NEW private method to apply focus once object data is confirmed available
  private _applyFocus(objectId: string | null, customDistance?: number): void {
    const currentViewState = this.getViewState();
    // Avoid redundant updates if focus isn't actually changing
    if (objectId === currentViewState.focusedObjectId) return;

    let targetPosition: THREE.Vector3;
    let newCameraPosition: THREE.Vector3;

    if (objectId) {
      // We assume object existence is checked *before* calling this method
      const renderableObject = renderableObjectsStore.get()[objectId];
      const coreObject = celestialObjectsStore.get()[objectId];

      if (!renderableObject || !renderableObject.position || !coreObject) {
        // This shouldn't happen if checks are done before calling, but log just in case
        console.error(
          `[EnginePanel ${this._api?.id}] _applyFocus called for ${objectId}, but object data is missing!`,
        );
        // Reset to default state to be safe
        newCameraPosition = DEFAULT_CAMERA_POSITION.clone();
        targetPosition = DEFAULT_CAMERA_TARGET.clone();
      } else {
        const objectAbsPos = renderableObject.position.clone();
        const objectType = coreObject.type;
        const objectRealRadius = coreObject.realRadius_m;

        // Special case for Oort Cloud - position camera at inner radius boundary
        if (
          objectType === CelestialType.OORT_CLOUD &&
          coreObject.properties?.type === CelestialType.OORT_CLOUD
        ) {
          const oortCloudProps = coreObject.properties as OortCloudProperties;
          const innerRadiusAU = oortCloudProps.innerRadiusAU;

          if (innerRadiusAU && typeof innerRadiusAU === "number") {
            // Convert AU to scene units
            const scaledInnerRadius = innerRadiusAU * SCALE.RENDER_SCALE_AU;

            // Position camera toward upper right (+x, +y) at the inner radius boundary
            const direction = new THREE.Vector3(0.7, 0.7, 0).normalize();
            const boundaryPoint = direction.multiplyScalar(scaledInnerRadius);

            // Calculate camera position offset from this boundary point
            targetPosition = boundaryPoint.clone();

            // Position camera slightly offset from target (standard distance)
            const distance = customDistance ?? 50;
            const offset = CAMERA_OFFSET.clone().multiplyScalar(distance);
            newCameraPosition = targetPosition.clone().add(offset);

            // Only update the focused object ID in the state, not the camera position
            // This prevents the view state subscription from overriding our transition
            this.updateViewState({
              focusedObjectId: objectId,
            });

            // Update camera with smooth transition
            this._renderer?.controlsManager.moveTo(
              newCameraPosition,
              targetPosition,
            );

            // Don't follow the Oort Cloud - it doesn't work well with the following logic
            // Clear any existing follow target
            this._renderer?.setFollowTarget(null);

            // Just highlight it in the visualization
            this._renderer?.orbitManager?.highlightVisualization(objectId);

            return; // Exit early after handling Oort Cloud special case
          }
        }

        // Standard camera positioning for all other objects
        let distance = customDistance;

        // If no custom distance provided, calculate based on radius
        if (distance === undefined && objectRealRadius) {
          const scaledRadius = scaleSize(objectRealRadius, objectType);
          distance = scaledRadius * (1 + 0.1); // Use 10% margin (adjust constant if needed)
          distance = Math.max(distance, 1); // Ensure minimum distance
        } else if (distance === undefined) {
          // Fallback to type-based distance if no radius or custom distance
          distance = CAMERA_DISTANCES[objectType] ?? DEFAULT_CAMERA_DISTANCE;
        }

        const offset = CAMERA_OFFSET.clone().multiplyScalar(distance);
        newCameraPosition = objectAbsPos.clone().add(offset);
        targetPosition = objectAbsPos.clone();
      }

      // Only update the focused object ID in the state, not the camera position
      // This prevents the view state subscription from overriding our transition
      this.updateViewState({
        focusedObjectId: objectId,
      });

      // Update camera with smooth transition
      this._renderer?.controlsManager.moveTo(newCameraPosition, targetPosition);
      this._renderer?.setFollowTarget(objectId);

      // --- ADD HIGHLIGHT CALL ---
      this._renderer?.orbitManager?.highlightVisualization(objectId);
      // --- END HIGHLIGHT CALL ---
    } else {
      // Clear focus: Reset camera, clear follow target
      // Only update the focus, not the camera position
      this.updateViewState({
        focusedObjectId: null,
      });

      // Update camera with smooth transition
      this._renderer?.controlsManager.moveTo(
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
      );
      this._renderer?.setFollowTarget(null);

      // --- ADD HIGHLIGHT CALL (CLEAR) ---
      this._renderer?.orbitManager?.highlightVisualization(null);
      // --- END HIGHLIGHT CALL (CLEAR) ---
    }
  }

  // Method to control grid visibility
  public setShowGrid(visible: boolean): void {
    if (this._renderer) {
      this._renderer.setGridVisible(visible);
      this.updateViewState({ showGrid: visible });
    }
  }

  // Method to control celestial label visibility
  public setShowCelestialLabels(visible: boolean): void {
    if (this._renderer) {
      this._renderer.setCelestialLabelsVisible(visible);
      this.updateViewState({ showCelestialLabels: visible });
    }
  }

  // Added: Method to control AU marker visibility
  public setShowAuMarkers(visible: boolean): void {
    if (this._renderer) {
      this._renderer.setAuMarkersVisible(visible);
      this.updateViewState({ showAuMarkers: visible });
    }
  }

  /**
   * Enable or disable the debris effects visualization
   */
  public setDebrisEffectsEnabled(visible: boolean): void {
    if (this._renderer) {
      this._renderer.setDebrisEffectsEnabled(visible);
      this.updateViewState({ showDebrisEffects: visible });
    }
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

  // --- Add public method to subscribe to internal state ---
  public subscribeToViewState(
    callback: (state: PanelViewState) => void,
  ): () => void {
    return this._viewStateStore.subscribe(callback);
  }

  // --- CORRECTED GETTER for OrbitManager ---
  public get orbitManager(): OrbitManager | undefined {
    // Return the orbitManager directly from the renderer instance
    return this._renderer?.orbitManager;
  }
  // --- END GETTER ---

  init(parameters: GroupPanelPartInitParameters): void {
    if (this._isInitialized) {
      console.warn(
        `[EnginePanel ${this._api?.id}] Attempted to initialize already initialized panel.`,
      );
      return;
    }
    this._isInitialized = true;

    // this._params = parameters;
    this._api = parameters.api;
    this._element.textContent = "Waiting for celestial objects data...";

    // --- Register with Panel Registry ---
    if (this._api) {
      panelRegistry.registerPanel(this._api.id, this);
    } else {
      console.error(
        "[EnginePanel] Cannot register panel: API not available at init time.",
      );
    }

    // Listener for core celestial objects (used to trigger renderer init/dispose)
    this._dataListenerUnsubscribe = celestialObjectsStore.subscribe(
      (celestialObjects) => {
        const objectCount = Object.keys(celestialObjects).length;

        if (!this._renderer && objectCount > 0) {
          this.initializeRenderer(); // Initialize renderer when data arrives
        } else if (this._renderer && objectCount === 0) {
          this.disposeRenderer();
          this._element.textContent = "Waiting for celestial objects data...";
        }
      },
    );

    // ADD Event listener for focus requests targeted at this panel
    document.addEventListener("engine-focus-request", this._handleFocusRequest);

    this._isInitialized = true; // Move initialization flag here?
  }

  // Define the event handler as a bound method
  private _handleFocusRequest = (event: Event): void => {
    const customEvent = event as CustomEvent;
    if (
      !customEvent.detail ||
      customEvent.detail.targetPanelId !== this._api?.id
    ) {
      return; // Ignore if not for this panel
    }

    const { objectId, distance } = customEvent.detail;

    // Attempt immediate focus if possible
    if (objectId === null) {
      // Clearing focus can happen immediately
      this._applyFocus(null);
      // Clear the queue *only* if the explicit request was to clear focus
      this._pendingFocusQueue = [];
    } else {
      const renderableMap = renderableObjectsStore.get();
      const coreMap = celestialObjectsStore.get();
      if (
        renderableMap[objectId] &&
        renderableMap[objectId].position &&
        coreMap[objectId]
      ) {
        this._applyFocus(objectId, distance);
        // Clear queue *after* applying immediate focus, as this fulfills the latest intent
        this._pendingFocusQueue = [];
      } else {
        console.warn(
          `[EnginePanel ${this._api?.id}] Object ${objectId} not ready yet. Adding to focus queue.`,
        );
        // Add to the queue instead of overwriting a single variable
        this._pendingFocusQueue.push({ objectId, distance });
      }
    }
  };

  private initializeRenderer(): void {
    // Prevent double initialization
    if (this._renderer) {
      console.warn(
        `[EnginePanel ${this._api?.title}] Renderer already initialized.`,
      );
      return;
    }

    this._element.textContent = ""; // Clear waiting message

    try {
      this._renderer = new ModularSpaceRenderer(this._element, {
        antialias: true,
        shadows: true,
        hdr: true,
        background: "black",
        showDebugSphere: false,
        showGrid: true,
        enableUI: true, // Set to true to enable CSS2DManager for labels
        showAuMarkers: this._viewStateStore.get().showAuMarkers, // Added: Pass initial state
      });

      // Get initial state from this panel's store
      const initialState = this._viewStateStore.get();

      // --- SET INITIAL RENDERER STATE ---
      // Set initial camera position/target directly
      this._renderer.updateCamera(
        initialState.cameraPosition,
        initialState.cameraTarget,
      );
      // Set initial follow target directly
      this._renderer.setFollowTarget(initialState.focusedObjectId);

      // Listen for camera transition completion events
      document.addEventListener(
        "camera-transition-complete",
        (event: Event) => {
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
          }
        },
      );

      // --- SUBSCRIBE TO PANEL STATE FOR RENDERER UPDATES ---
      // Subscribe the panel TO its own state store to push updates TO the renderer
      this._viewStateStore.subscribe((newState) => {
        // Ensure we have a previous state to compare against
        if (!this._previousViewState) {
          this._previousViewState = newState; // Initialize on first run
          // Perform initial setup based on newState here if needed?
          // For now, let's assume initial state is set before subscription fires reliably
        }

        // REMOVED: Camera position/target updates driven by this subscription
        // The ControlsManager now handles its own state updates via simulationState
        // and the camera-transition-complete event updates this panel's state,
        // avoiding loops where state change triggers another move.

        // Update grid visibility based on state
        if (newState.showGrid !== this._previousViewState.showGrid) {
          this._renderer?.setGridVisible(newState.showGrid ?? true);
        }

        // Update celestial label visibility based on state
        if (
          newState.showCelestialLabels !==
          this._previousViewState.showCelestialLabels
        ) {
          this._renderer?.setCelestialLabelsVisible(
            newState.showCelestialLabels ?? true,
          );
        }
        // Added: Update AU marker visibility based on state
        if (newState.showAuMarkers !== this._previousViewState.showAuMarkers) {
          this._renderer?.setAuMarkersVisible(newState.showAuMarkers ?? true);
        }
        // Note: setFollowTarget is called directly in _applyFocus now
        // Update the previous state for the next comparison
        this._previousViewState = newState;
      });
      // --- END SUBSCRIPTION ---

      // --- ADD SUBSCRIPTION TO RENDERABLE OBJECTS FOR PENDING FOCUS ---
      this._renderableObjectsUnsubscribe?.();
      this._renderableObjectsUnsubscribe = renderableObjectsStore.subscribe(
        (renderableMap) => {
          // Process the queue
          if (this._pendingFocusQueue.length > 0) {
            const coreMap = celestialObjectsStore.get(); // Get core map once
            const processedIndices: number[] = []; // Keep track of processed requests

            this._pendingFocusQueue.forEach((request, index) => {
              if (!request || request.objectId === null) {
                // Should not happen based on _handleFocusRequest logic, but safety check
                processedIndices.push(index);
                return;
              }

              const pendingId = request.objectId;
              const distance = request.distance;
              const renderableEntry = renderableMap[pendingId];
              const coreEntry = coreMap[pendingId];

              // Check if the pending object is now available and has position data
              if (renderableEntry && renderableEntry.position && coreEntry) {
                this._applyFocus(pendingId, distance);
                processedIndices.push(index); // Mark for removal
              } else if (renderableEntry && coreEntry) {
                console.warn(
                  `[EnginePanel ${this._api?.id}] Queued focus ${pendingId} met renderable & core exists, but position is missing.`,
                );
              }
            });

            // Remove processed requests from the queue (iterate backwards to avoid index issues)
            for (let i = processedIndices.length - 1; i >= 0; i--) {
              this._pendingFocusQueue.splice(processedIndices[i], 1);
            }
          }
        },
      );
      // --- END RENDERABLE OBJECTS SUBSCRIPTION ---

      this._renderer.startRenderLoop();

      // Start simulation loop globally only once
      if (!isSimulationLoopStarted) {
        startSimulationLoop();
        isSimulationLoopStarted = true;
      }

      this._resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          this._renderer?.onResize(width, height);
        }
      });
      this._resizeObserver.observe(this._element);
    } catch (error) {
      console.error(
        `Failed to initialize EnginePanel [${this._api?.title}] renderer:`,
        error,
      );
      this._element.textContent = `Error initializing engine renderer: ${error}`;
      this._element.style.color = "red";
    }
  }

  // Separate method to dispose only the renderer part
  private disposeRenderer(): void {
    this._resizeObserver?.disconnect();
    // --- LOG BEFORE UNSUBSCRIBE ---
    if (this._renderableObjectsUnsubscribe) {
      this._renderableObjectsUnsubscribe();
    }
    this._renderableObjectsUnsubscribe = null;
    this._renderer?.dispose();
    this._renderer = undefined;
    this._resizeObserver = undefined;
    this._pendingFocusQueue = []; // Clear pending focus queue on dispose
  }

  dispose(): void {
    console.log(`Disposing EnginePanel ${this._api?.id}`);
    // Unsubscribe from layout changes
    if (this._layoutUnsubscribe) {
      this._layoutUnsubscribe();
      this._layoutUnsubscribe = null;
    }
    // Unsubscribe from data listeners
    const panelIdForLog = this._api?.id ?? "unknown"; // Capture ID before potentially nulling API
    if (this._dataListenerUnsubscribe) {
      this._dataListenerUnsubscribe();
      this._dataListenerUnsubscribe = null;
    }
    // --- Unregister from Panel Registry ---
    if (this._api) {
      panelRegistry.unregisterPanel(panelIdForLog);
    } else if (panelIdForLog !== "unknown") {
      // Attempt unregister even if API is gone, using the captured ID if available
      panelRegistry.unregisterPanel(panelIdForLog);
    }
    // --- End Unregistration ---

    // Remove event listeners
    document.removeEventListener(
      "engine-focus-request",
      this._handleFocusRequest,
    );

    // Remove the camera transition event listener
    document.removeEventListener("camera-transition-complete", () => {});

    this.disposeRenderer(); // Calls the queue clearing
    this._isInitialized = false;
  }
}
