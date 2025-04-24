import { renderableObjectsStore } from "@teskooano/core-state"; // Import the shared store
import {
  AnimationLoop,
  SceneManager,
  StateManager,
} from "@teskooano/renderer-threejs-core";
import { LightManager, LODManager } from "@teskooano/renderer-threejs-effects";
import {
  ControlsManager,
  CSS2DLayerType,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { OrbitManager } from "@teskooano/renderer-threejs-orbits";
import * as THREE from "three";
import { RendererStateAdapter } from "./RendererStateAdapter";
// Import debug utilities
import { debugConfig, setVisualizationEnabled } from "@teskooano/core-debug";

// Export our new SpaceRenderer facade that uses the new modular architecture
export class ModularSpaceRenderer {
  // Core components
  public sceneManager: SceneManager;
  public animationLoop: AnimationLoop;
  public stateManager: StateManager;

  // Visualization components
  public objectManager: ObjectManager;
  public orbitManager: OrbitManager;
  public backgroundManager: BackgroundManager;

  // Interaction components
  public controlsManager: ControlsManager;
  public css2DManager?: CSS2DManager;

  // Effects components
  public lightManager: LightManager;
  public lodManager: LODManager;

  // NEW: State Adapter
  private stateAdapter: RendererStateAdapter;

  // Optional canvas UI manager
  private canvasUIManager?: { render(): void };

  constructor(
    container: HTMLElement,
    options: {
      antialias?: boolean;
      shadows?: boolean;
      hdr?: boolean;
      background?: string | THREE.Texture;
      showGrid?: boolean;
      showCelestialLabels?: boolean;
      showAuMarkers?: boolean;
      showDebrisEffects?: boolean;
    } = {},
  ) {
    this.stateAdapter = new RendererStateAdapter();

    // Initialize core components first
    this.sceneManager = new SceneManager(container, options); // Initialize SceneManager WITHOUT css2DManager initially
    this.animationLoop = new AnimationLoop();
    this.stateManager = new StateManager();

    this.animationLoop.setRenderer(this.sceneManager.renderer);
    this.animationLoop.setCamera(this.sceneManager.camera);

    // Initialize effects components (like LightManager needed by ObjectManager)
    this.lightManager = new LightManager(this.sceneManager.scene);
    this.lodManager = new LODManager(this.sceneManager.camera);

    // Initialize interaction components (ControlsManager needs DOM element)
    const showCelestialLabels = options.showCelestialLabels !== false; // Default to true
    this.controlsManager = new ControlsManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    );

    // Only initialize CSS2D manager if UI is enabled
    if (showCelestialLabels) {
      this.css2DManager = new CSS2DManager(this.sceneManager.scene, container);
      // Now pass the created CSS2DManager back to SceneManager
      this.sceneManager.setCSS2DManager(this.css2DManager);
    } else {
      this.css2DManager = undefined; // Ensure it's undefined if UI is disabled
    }

    // Initialize visualization components AFTER interaction components (ObjectManager needs CSS2DManager)
    // Pass css2DManager - ObjectManager constructor needs to handle undefined if UI is disabled
    // OR ensure ObjectManager is only passed a valid instance.
    if (!this.css2DManager && showCelestialLabels) {
      throw new Error("CSS2DManager failed to initialize but UI was enabled.");
    } else if (!showCelestialLabels && this.css2DManager) {
      // This case shouldn't happen based on above logic, but good practice
      console.warn("CSS2DManager initialized but UI is disabled?");
      this.css2DManager = undefined; // Ensure consistency
    }

    // Pass the SHARED STORE to ObjectManager
    this.objectManager = new ObjectManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      renderableObjectsStore,
      this.lightManager,
      this.sceneManager.renderer,
      this.css2DManager,
    );
    // Pass BOTH the store AND the adapter to OrbitManager
    this.orbitManager = new OrbitManager(
      this.objectManager,
      this.stateAdapter, // For visual settings
      renderableObjectsStore, // For object data
    );
    this.backgroundManager = new BackgroundManager(this.sceneManager.scene);
    this.backgroundManager.setCamera(this.sceneManager.camera);

    // Setup event listeners
    this.setupEventListeners(container);

    // Setup animation callbacks
    this.setupAnimationCallbacks();

    // Add window resize handler
    window.addEventListener("resize", () => {
      this.onResize(container.clientWidth, container.clientHeight);
    });

    // Set initial grid state based on options
    if (options.showGrid !== undefined) {
      this.sceneManager.setGridVisible(options.showGrid);
    }
    // Initial label state is handled by ObjectManager/LabelManager now
    // Add initial AU marker state based on options
    if (options.showAuMarkers !== undefined) {
      this.sceneManager.setAuMarkersVisible(options.showAuMarkers);
    }
    if (options.showDebrisEffects !== undefined) {
      this.setDebrisEffectsEnabled(options.showDebrisEffects);
    }
  }

  private setupEventListeners(container: HTMLElement): void {
    container.addEventListener("toggleGrid", () => {
      this.sceneManager.toggleGrid();
    });
    container.addEventListener("toggleBackgroundDebug", () => {
      this.backgroundManager.toggleDebug();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.onResize(width, height);
      }
    });

    // Add event listener for camera transition completion
    document.addEventListener("camera-transition-complete", (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // Maybe log that the transition completed, but don't rely on internal state here
      }
    });
  }

  private setupAnimationCallbacks(): void {
    const mainUpdateCallback = (deltaTime: number, elapsedTime: number) => {
      // Update Orbit Manager visualizations (trails, predictions, Keplerian)
      this.orbitManager.updateAllVisualizations();

      // Update CSS2D renderer if it exists
      if (this.css2DManager && typeof this.css2DManager.render === "function") {
        this.css2DManager.render(this.camera);
      }

      // Call updateRenderers and pass the light map from LightManager
      this.objectManager.updateRenderers(
        elapsedTime,
        this.lightManager.getStarLightsData(),
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera,
      );

      // Update the background with the current time delta
      this.backgroundManager.update(deltaTime);

      // Final render for the frame
      this.render();
    };

    this.animationLoop.onAnimate(mainUpdateCallback);
  }

  // Public API (Getters)
  /**
   * Gets the underlying Three.js scene instance.
   * @returns {THREE.Scene} The scene object.
   */
  get scene(): THREE.Scene {
    return this.sceneManager.scene;
  }
  /**
   * Gets the active Three.js perspective camera instance.
   * @returns {THREE.PerspectiveCamera} The camera object.
   */
  get camera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
  /**
   * Gets the underlying Three.js WebGL renderer instance.
   * @returns {THREE.WebGLRenderer} The renderer object.
   */
  get renderer(): THREE.WebGLRenderer {
    return this.sceneManager.renderer;
  }
  /**
   * Gets the associated OrbitControls instance.
   * @returns {OrbitControls} The controls instance.
   */
  get controls() {
    return this.controlsManager.controls;
  }

  // Start/Stop Loop
  /**
   * Starts the rendering loop.
   */
  startRenderLoop(): void {
    this.animationLoop.start();
  }
  /**
   * Stops the rendering loop.
   */
  stopRenderLoop(): void {
    this.animationLoop.stop();
  }

  // Resize Handling
  /**
   * Handles window resize events, updating camera aspect ratio and renderer size.
   * @param {number} width - The new width of the viewport.
   * @param {number} height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.sceneManager.onResize(width, height);
    // controlsManager doesn't seem to have onResize
    // this.controlsManager.onResize();
    // css2DManager handles its own resize
    this.css2DManager?.onResize(width, height);
    // REMOVED: ObjectManager no longer needs onResize for labels
    // this.objectManager.onResize(width, height);
  }

  /**
   * Executes a single render frame.
   * Updates LODs, objects, CSS2D elements, calls custom render callbacks,
   * updates controls, and renders the scene.
   */
  render(): void {
    this.lodManager.update();
    // ObjectManager update now handles its internal state/objects
    this.objectManager.update(this.renderer, this.scene, this.camera);
    this.css2DManager?.render(this.camera);
    this.animationLoop.getRenderCallbacks().forEach((callback) => callback());
    // --- PASS DELTA TO CONTROLS --- //
    const delta = this.animationLoop.getDelta(); // Get delta from animation loop (Corrected method name)
    this.controlsManager.update(delta); // Pass delta to controls manager
    // --- END PASS DELTA ---
    this.sceneManager.render();
    if (this.canvasUIManager) {
      this.canvasUIManager.render();
    }
  }

  /**
   * Cleans up resources used by the renderer and its managers.
   * Stops the animation loop and removes event listeners.
   */
  dispose(): void {
    this.stateAdapter.dispose();

    this.sceneManager.dispose();
    this.objectManager.dispose();
    this.orbitManager.dispose();
    this.backgroundManager.dispose();
    this.controlsManager.dispose();
    this.css2DManager?.dispose();
    this.lightManager.dispose();
    if (typeof (this.lodManager as any).dispose === "function") {
      (this.lodManager as any).dispose();
    }
    this.stateManager.dispose();
    this.animationLoop.dispose();

    window.removeEventListener("resize", () => {
      this.onResize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Sets the visibility of celestial object labels (CSS2D layer).
   * @param {boolean} visible - True to show labels, false to hide.
   */
  setCelestialLabelsVisible(visible: boolean): void {
    this.css2DManager?.setLayerVisibility(
      CSS2DLayerType.CELESTIAL_LABELS,
      visible,
    );
  }
  /**
   * Sets the visibility of the background grid helper.
   * @param {boolean} visible - True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    this.sceneManager.setGridVisible(visible);
  }
  /**
   * Sets the visibility of the AU (Astronomical Unit) marker lines.
   * @param {boolean} visible - True to show AU markers, false to hide.
   */
  setAuMarkersVisible(visible: boolean): void {
    this.sceneManager.setAuMarkersVisible(visible);
  }
  /**
   * Sets the visibility of all orbital lines.
   * @param {boolean} visible - True to show orbits, false to hide.
   */
  setOrbitsVisible(visible: boolean): void {
    // TODO: Add setVisibility(visible: boolean) method to OrbitManager
    this.orbitManager.setVisibility(visible);
  }
  /**
   * Toggles the visibility of the background grid helper.
   */
  toggleGrid(): void {
    this.sceneManager.toggleGrid();
  }
  /**
   * Toggles the visibility of all orbital lines.
   */
  toggleOrbits(): void {
    this.orbitManager.toggleVisualization();
  }

  /**
   * @deprecated Use ControlsManager methods (`pointCameraAtTarget`, `moveCameraToTarget`, `setFollowTarget`) instead for camera manipulation.
   * Updates the camera's position and target look-at point.
   * @param {THREE.Vector3} position - The new camera position.
   * @param {THREE.Vector3} target - The new point for the camera to look at.
   */
  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    // Deprecated: Use ControlsManager for camera movement
    this.controlsManager.pointCameraAtTarget(target);
  }

  /**
   * Sets an optional Canvas UI manager to be rendered on top of the 3D scene.
   * @param {object} uiManager - An object with a `render()` method.
   * @param {function} uiManager.render - The function to call during the render loop.
   */
  setCanvasUIManager(uiManager: { render(): void }): void {
    this.canvasUIManager = uiManager;
  }

  /**
   * Adds a callback function to be executed during each render frame.
   * @param {function} callback - The function to execute.
   */
  addRenderCallback(callback: () => void): void {
    this.animationLoop.onRender(callback);
  }

  /**
   * Removes a previously added render callback function.
   * @param {function} callback - The callback function to remove.
   */
  removeRenderCallback(callback: () => void): void {
    this.animationLoop.removeRenderCallback(callback);
  }

  /**
   * Retrieves a specific 3D object from the scene by its ID.
   * @param {string} id - The unique identifier of the object.
   * @returns {THREE.Object3D | null} The found object, or null if not found.
   */
  public getObjectById(id: string): THREE.Object3D | null {
    return this.objectManager.getObject(id);
  }

  /**
   * Calculates the total number of triangles currently being rendered in the scene.
   * Traverses the scene graph and sums up triangles from Mesh geometries.
   * @returns {number} The total triangle count.
   */
  public getTriangleCount(): number {
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry instanceof THREE.BufferGeometry) {
          const position = object.geometry.attributes.position;
          if (position) {
            count += position.count / 3;
          }
        }
      }
    });
    return count;
  }

  /**
   * Sets the camera to follow a specific celestial object.
   * This method now delegates the core follow logic to the ControlsManager.
   *
   * @param {string | null} objectId The ID of the object to follow, or null to stop following.
   * @param {THREE.Vector3} [_targetPosition] Optional: Ignored. The final target position is calculated internally.
   * @param {THREE.Vector3} [_cameraPosition] Optional: Ignored. The final camera position is calculated internally.
   */
  setFollowTarget(
    objectId: string | null,
    _targetPosition?: THREE.Vector3, // Mark as unused
    _cameraPosition?: THREE.Vector3, // Mark as unused
  ): void {
    console.log(`[Renderer] setFollowTarget called with objectId: ${objectId}`);

    if (!this.controlsManager) {
      console.error("[Renderer] ControlsManager not initialized.");
      return;
    }

    if (objectId === null) {
      // Stop following
      this.controlsManager.setFollowTarget(null);
      console.log(`[Renderer] Cleared follow target.`);
      return;
    }

    // Find the Three.js object to follow
    const objectToFollow = this.objectManager.getObject(objectId);

    if (!objectToFollow) {
      console.warn(
        `[Renderer] Could not find object with ID '${objectId}' to follow.`,
      );
      // Optionally clear the follow target if the requested object doesn't exist
      this.controlsManager.setFollowTarget(null);
      return;
    }

    console.log(
      `[Renderer] Found object to follow:`,
      objectToFollow.name || objectId,
    );

    // Delegate to ControlsManager
    // We let ControlsManager calculate the position and target based on the object.
    // The `false` argument for `keepCurrentDistance` means it will calculate
    // a suitable distance instead of maintaining the current one.
    this.controlsManager.setFollowTarget(objectToFollow, undefined, false);
  }

  /**
   * Set whether debug visualization is enabled
   * @param enabled Whether debug visualizations should be shown
   */
  public setDebugVisualization(enabled: boolean): void {
    setVisualizationEnabled(enabled);
  }

  /**
   * Toggle debug visualization on/off
   * @returns The new state (true if enabled, false if disabled)
   */
  public toggleDebugVisualization(): boolean {
    const newState = !debugConfig.visualize;
    this.setDebugVisualization(newState); // This now just sets the global flag
    return newState;
  }

  /**
   * Set whether debris effects should be shown when objects are destroyed
   * @param enabled Whether debris effects should be shown
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this.objectManager.setDebrisEffectsEnabled(enabled);
  }

  /**
   * Toggle debris effects on/off
   * @returns The new state (true if enabled, false if disabled)
   */
  public toggleDebrisEffects(): boolean {
    return this.objectManager.toggleDebrisEffects();
  }

  /**
   * Sets the global debug mode for the renderer.
   * Toggles the origin debug sphere and forces fallback meshes.
   * Note: Forcing fallback meshes currently requires object recreation.
   * @param enabled - If true, enables debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    console.log(`[ModularSpaceRenderer] Setting debug mode: ${enabled}`);
    this.sceneManager.setDebugMode(enabled);
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
    this.controlsManager.setDebugMode(enabled);
  }
}
