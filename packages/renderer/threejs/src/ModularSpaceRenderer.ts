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
import {
  BackgroundManager,
  ObjectManager,
  OrbitManager,
} from "@teskooano/renderer-threejs-visualization";
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
      showDebugSphere?: boolean;
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
    if (options.showDebugSphere !== undefined) {
      this.sceneManager.toggleDebugSphere();
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
  get scene(): THREE.Scene {
    return this.sceneManager.scene;
  }
  get camera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
  get renderer(): THREE.WebGLRenderer {
    return this.sceneManager.renderer;
  }
  get controls() {
    return this.controlsManager.controls;
  }

  // Start/Stop Loop
  startRenderLoop(): void {
    this.animationLoop.start();
  }
  stopRenderLoop(): void {
    this.animationLoop.stop();
  }

  // Resize Handling
  onResize(width: number, height: number): void {
    this.sceneManager.onResize(width, height);
    // controlsManager doesn't seem to have onResize
    // this.controlsManager.onResize();
    // css2DManager handles its own resize
    this.css2DManager?.onResize(width, height);
    // REMOVED: ObjectManager no longer needs onResize for labels
    // this.objectManager.onResize(width, height);
  }

  render(): void {
    this.lodManager.update();
    // ObjectManager update now handles its internal state/objects
    this.objectManager.update(this.renderer, this.scene, this.camera);
    this.css2DManager?.render(this.camera);
    this.animationLoop.getRenderCallbacks().forEach((callback) => callback());
    this.controlsManager.update();
    this.sceneManager.render();
    if (this.canvasUIManager) {
      this.canvasUIManager.render();
    }
  }

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

  // --- VISIBILITY CONTROLS (DELEGATION) ---
  setCelestialLabelsVisible(visible: boolean): void {
    this.css2DManager?.setLayerVisibility(
      CSS2DLayerType.CELESTIAL_LABELS,
      visible,
    );
  }
  setGridVisible(visible: boolean): void {
    this.sceneManager.setGridVisible(visible);
  }
  setAuMarkersVisible(visible: boolean): void {
    this.sceneManager.setAuMarkersVisible(visible);
  }
  setOrbitsVisible(visible: boolean): void {
    // TODO: Add setVisibility(visible: boolean) method to OrbitManager
    this.orbitManager.setVisibility(visible);
  }
  // TODO: Decide if a generic toggleLabels is needed, or specific toggles per layer type?
  // toggleCelestialLabels(): void { this.css2DManager?.toggleLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS); }
  toggleGrid(): void {
    this.sceneManager.toggleGrid();
  }
  toggleOrbits(): void {
    this.orbitManager.toggleVisualization();
  }
  toggleDebugSphere(): void {
    this.sceneManager.toggleDebugSphere();
  }
  // --- END VISIBILITY CONTROLS ---

  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    // We should NOT directly modify the camera position here
    // Only use the controlsManager to handle camera positioning
    // This prevents double updates and allows the ControlsManager to handle transitions
    this.controlsManager.moveTo(position, target);
  }

  setCanvasUIManager(uiManager: { render(): void }): void {
    this.canvasUIManager = uiManager;
  }

  addRenderCallback(callback: () => void): void {
    this.animationLoop.onRender(callback);
  }

  removeRenderCallback(callback: () => void): void {
    this.animationLoop.removeRenderCallback(callback);
  }

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

  setFollowTarget(
    objectId: string | null,
    targetPosition?: THREE.Vector3,
    cameraPosition?: THREE.Vector3,
  ): void {
    // TODO: Refactor this method to use ControlsManager.setFollowTarget
    // For now, just log and clear internal state if needed
    console.warn(
      "[Renderer] setFollowTarget needs refactoring to use ControlsManager.",
    );
    if (!objectId) {
      this.controlsManager.setFollowTarget(null); // Pass null to ControlsManager
    } else {
      // We need the actual Object3D reference to pass to ControlsManager
      const targetMesh = this.objectManager.getObject(objectId);
      if (targetMesh) {
        // Decide if we still need keepCurrentDistance or pass calculated positions
        // For now, use the basic follow call (keeps current distance by default in ControlsManager impl)
        this.controlsManager.setFollowTarget(targetMesh, undefined, true); // Keep current distance
      } else {
        console.error(
          `[Renderer] Cannot follow object ${objectId}: Mesh not found.`,
        );
        // Ensure follow is stopped if mesh not found
        this.controlsManager.setFollowTarget(null);
      }
    }
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
}
