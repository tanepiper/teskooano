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

// Export all modules - except rendererEvents which is already exported by core
export {
  AnimationLoop,
  SceneManager,
  StateManager,
} from "@teskooano/renderer-threejs-core";
export { LightManager, LODManager } from "@teskooano/renderer-threejs-effects";
export {
  ControlsManager,
  CSS2DLayerType,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
export {
  BackgroundManager,
  ObjectManager,
  OrbitManager,
} from "@teskooano/renderer-threejs-visualization";

// Export event system
export * from "./events";

// Export utilities
export * from "./utils/coordinateUtils";

// Export the State Adapter and its types
export { RendererStateAdapter } from "./RendererStateAdapter";
export type {
  RenderableCelestialObject,
  VisualSettings as RendererVisualSettings,
} from "./RendererStateAdapter"; // Export types too

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

  // Helper Vectors for camera follow calculation
  private tempNewObjectPos = new THREE.Vector3();
  private previousFollowTargetPos = new THREE.Vector3();
  private _followTargetId: string | null = null; // ID of the object to follow
  private _lastTimeLog: number | null = null;
  private _missingFrameCount = 0;

  constructor(
    container: HTMLElement,
    options: {
      antialias?: boolean;
      shadows?: boolean;
      hdr?: boolean;
      background?: string | THREE.Texture;
      showDebugSphere?: boolean;
      showGrid?: boolean;
      enableUI?: boolean;
      showAuMarkers?: boolean;
    } = {},
  ) {
    this.stateAdapter = new RendererStateAdapter();

    // Initialize core components first
    this.sceneManager = new SceneManager(container, options); // Initialize SceneManager WITHOUT css2DManager initially
    this.animationLoop = new AnimationLoop();
    this.stateManager = new StateManager();

    this.animationLoop.setRenderer(this.sceneManager.renderer);

    // Initialize effects components (like LightManager needed by ObjectManager)
    this.lightManager = new LightManager(this.sceneManager.scene);
    this.lodManager = new LODManager(this.sceneManager.camera);

    // Initialize interaction components (ControlsManager needs DOM element)
    const enableUI = options.enableUI !== false; // Default to true
    this.controlsManager = new ControlsManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    );

    // Only initialize CSS2D manager if UI is enabled
    if (enableUI) {
      this.css2DManager = new CSS2DManager(this.sceneManager.scene, container);
      // Now pass the created CSS2DManager back to SceneManager
      this.sceneManager.setCSS2DManager(this.css2DManager);
    } else {
      this.css2DManager = undefined; // Ensure it's undefined if UI is disabled
    }

    // Initialize visualization components AFTER interaction components (ObjectManager needs CSS2DManager)
    // Pass css2DManager - ObjectManager constructor needs to handle undefined if UI is disabled
    // OR ensure ObjectManager is only passed a valid instance.
    if (!this.css2DManager && enableUI) {
      throw new Error("CSS2DManager failed to initialize but UI was enabled.");
    } else if (!enableUI && this.css2DManager) {
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
  }

  private setupEventListeners(container: HTMLElement): void {
    container.addEventListener("toggleGrid", () => {
      this.sceneManager.toggleGrid();
    });
    container.addEventListener("toggleBackgroundDebug", () => {
      this.backgroundManager.toggleDebug();
    });
  }

  private setupAnimationCallbacks(): void {
    const mainUpdateCallback = (deltaTime: number, elapsedTime: number) => {
      // Debug asteroid field rotation - log time every few seconds
      const now = Date.now();
      if (!this._lastTimeLog || now - this._lastTimeLog > 5000) {
        this._lastTimeLog = now;
      }

      // Update controls first
      this.controlsManager.update();

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

      // --- Camera Following Logic ---
      if (this._followTargetId) {
        // Get the target mesh from the ObjectManager
        const targetMesh = this.objectManager.getObject(this._followTargetId);

        // Check if the mesh exists and is visible (not destroyed)
        if (targetMesh && targetMesh.visible) {
          // Get the world position (already in scene units)
          targetMesh.getWorldPosition(this.tempNewObjectPos);

          // First-time setup for following
          if (
            this.previousFollowTargetPos.x === 0 &&
            this.previousFollowTargetPos.y === 0 &&
            this.previousFollowTargetPos.z === 0
          ) {
            this.previousFollowTargetPos.copy(this.tempNewObjectPos);
            this.controlsManager.controls.target.copy(this.tempNewObjectPos);
            return;
          }
          // Restore delta calculation
          const deltaMovement = this.tempNewObjectPos
            .clone()
            .sub(this.previousFollowTargetPos);

          // Restore direct camera position update
          this.sceneManager.camera.position.add(deltaMovement);

          // Update the target directly - this is the core of following
          this.controlsManager.controls.target.copy(this.tempNewObjectPos);
          // REMOVED: Immediate update call - let the main manager handle it
          // this.controlsManager.controls.update();
          this.previousFollowTargetPos.copy(this.tempNewObjectPos);
        } else {
          // Mesh not found or destroyed - log warning and clear follow target after multiple attempts
          console.warn(
            `[Renderer Anim] Follow target mesh ${this._followTargetId} not found this frame. Skipping camera update.`,
          );

          // Track missing frames to handle the case when an object is permanently destroyed
          if (!this._missingFrameCount) {
            this._missingFrameCount = 1;
          } else {
            this._missingFrameCount++;
          }

          // If object is missing for several consecutive frames, stop following it
          if (this._missingFrameCount > 5) {
            console.log(
              `[Renderer Anim] Follow target ${this._followTargetId} missing for ${this._missingFrameCount} frames. Clearing follow target.`,
            );
            this._followTargetId = null;
            this._missingFrameCount = 0;
            this.previousFollowTargetPos.set(0, 0, 0);
          }
        }
      } else if (!this._followTargetId) {
        // If no follow target, ensure previous position is cleared
        this.previousFollowTargetPos.set(0, 0, 0);
      }
      // --- End Camera Following Logic ---

      // Restore the main ControlsManager update call
      this.controlsManager.update();

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
    this.controlsManager.update();
    this.css2DManager?.render(this.camera);
    this.animationLoop.getRenderCallbacks().forEach((callback) => callback());
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

  setFollowTarget(objectId: string | null): void {
    if (this._followTargetId === objectId) return;

    this._followTargetId = objectId;

    this.previousFollowTargetPos.set(0, 0, 0);
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
