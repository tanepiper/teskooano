import { BackgroundManager } from "@teskooano/renderer-threejs-background";
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
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import {
  OrbitsManager,
  VisualizationMode,
} from "@teskooano/renderer-threejs-orbits";
import * as THREE from "three";
import { RendererStateAdapter } from "./RendererStateAdapter";
import type { ModularSpaceRendererOptions } from "./types";
import { RenderPipeline } from "./RenderPipeline";

import { debugConfig, setVisualizationEnabled } from "@teskooano/core-debug";
import { renderableStore } from "@teskooano/core-state";

/**
 * The main orchestrator for the Three.js rendering engine.
 *
 * This class acts as a facade, composing and managing a suite of specialized
 * managers to handle different aspects of the 3D scene, such as objects,
 * lighting, controls, and background rendering. It provides a unified API
 * for controlling the entire rendering process.
 *
 * @example
 * const renderer = new ModularSpaceRenderer(containerElement, { antialias: true });
 * renderer.startRenderLoop();
 */
export class ModularSpaceRenderer {
  /** Manages the core THREE.Scene, camera, and renderer instances. */
  public sceneManager: SceneManager;
  /** Controls the `requestAnimationFrame` loop. */
  public animationLoop: AnimationLoop;
  /** Manages renderer-specific state. */
  public stateManager: StateManager;

  /** Manages the lifecycle of celestial `THREE.Object3D` instances. */
  public objectManager: ObjectManager;
  /** Manages the visualization of orbital paths. */
  public orbitManager: OrbitsManager;
  /** Manages the skybox and distant starfield. */
  public backgroundManager: BackgroundManager;

  /** Manages user interaction and camera controls (e.g., OrbitControls). */
  public controlsManager: ControlsManager;
  /** Manages the 2D HTML labels overlaid on the 3D scene. */
  public css2DManager?: CSS2DManager;

  /** Manages scene lighting, including star-based light sources. */
  public lightManager: LightManager;
  /** Manages Level of Detail for objects to optimize performance. */
  public lodManager: LODManager;

  /** Bridges core application state to the renderer-consumable `renderableStore`. */
  private stateAdapter: RendererStateAdapter;
  /** Orchestrates the per-frame update sequence. */
  private renderPipeline: RenderPipeline;

  /** An optional, injectable manager for rendering custom 2D canvas UI. */
  private canvasUIManager?: { render(): void };

  /**
   * Initializes the renderer and all its subordinate managers.
   *
   * @param container The HTML element that will host the renderer's canvas.
   * @param options Configuration options for the renderer.
   */
  constructor(
    container: HTMLElement,
    options: ModularSpaceRendererOptions = {},
  ) {
    this.stateAdapter = new RendererStateAdapter();

    this.sceneManager = new SceneManager(container, options);
    this.animationLoop = new AnimationLoop();
    this.stateManager = new StateManager();

    this.animationLoop.setRenderer(this.sceneManager.renderer);
    this.animationLoop.setCamera(this.sceneManager.camera);

    this.lightManager = new LightManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      options.hdr ?? false,
    );
    this.lodManager = new LODManager(this.sceneManager.camera);

    const showCelestialLabels = options.showCelestialLabels !== false;
    this.controlsManager = new ControlsManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    );

    if (showCelestialLabels) {
      this.css2DManager = new CSS2DManager(this.sceneManager.scene, container);

      this.sceneManager.setCSS2DManager(this.css2DManager);
    } else {
      this.css2DManager = undefined;
    }

    if (!this.css2DManager && showCelestialLabels) {
      throw new Error("CSS2DManager failed to initialize but UI was enabled.");
    } else if (!showCelestialLabels && this.css2DManager) {
      console.warn("CSS2DManager initialized but UI is disabled?");
      this.css2DManager = undefined;
    }

    this.objectManager = new ObjectManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      renderableStore.renderableObjects$,
      this.lightManager,
      this.sceneManager.renderer,
      this.css2DManager,
    );

    this.orbitManager = new OrbitsManager(
      this.objectManager,
      this.stateAdapter,
      renderableStore.renderableObjects$,
    );
    this.backgroundManager = new BackgroundManager(this.sceneManager.scene);
    this.backgroundManager.setCamera(this.sceneManager.camera);

    this.renderPipeline = new RenderPipeline({
      sceneManager: this.sceneManager,
      controlsManager: this.controlsManager,
      orbitManager: this.orbitManager,
      objectManager: this.objectManager,
      backgroundManager: this.backgroundManager,
      lightManager: this.lightManager,
      lodManager: this.lodManager,
      css2DManager: this.css2DManager,
      animationLoop: this.animationLoop,
      canvasUIManager: this.canvasUIManager,
    });

    this.setupEventListeners(container);

    this.setupAnimationCallbacks();

    this.onResize(container.clientWidth, container.clientHeight);

    if (options.showGrid !== undefined) {
      this.sceneManager.setGridVisible(options.showGrid);
    }

    if (options.showAuMarkers !== undefined) {
      this.sceneManager.setAuMarkersVisible(options.showAuMarkers);
    }
    if (options.showDebrisEffects !== undefined) {
      this.setDebrisEffectsEnabled(options.showDebrisEffects);
    }
  }

  /**
   * Sets up event listeners for the renderer.
   * @param container The main HTML container for the renderer.
   */
  private setupEventListeners(container: HTMLElement): void {
    container.addEventListener("toggleGrid", () => {
      this.sceneManager.toggleGrid();
    });
    container.addEventListener("toggleBackgroundDebug", () => {
      this.backgroundManager.toggleDebug();
    });

    window.addEventListener("resize", () => {
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.onResize(width, height);
      }
    });

    // This listener is a hook for responding to camera system events.
    document.addEventListener("camera-transition-complete", (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // Future logic can be placed here, e.g., for analytics or UI updates.
      }
    });
  }

  /**
   * Defines the sequence of operations for each frame of the animation loop.
   * The order is critical for ensuring effects are based on the latest data.
   */
  private setupAnimationCallbacks(): void {
    this.animationLoop.onAnimate(this.renderPipeline.update);
  }

  /**
   * Gets the underlying Three.js scene instance.
   * @returns The scene object.
   */
  get scene(): THREE.Scene {
    return this.sceneManager.scene;
  }
  /**
   * Gets the active Three.js perspective camera instance.
   * @returns The camera object.
   */
  get camera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
  /**
   * Gets the underlying Three.js WebGL renderer instance.
   * @returns The renderer object.
   */
  get renderer(): THREE.WebGLRenderer {
    return this.sceneManager.renderer;
  }
  /**
   * Gets the associated OrbitControls instance.
   * @returns The controls instance.
   */
  get controls() {
    return this.controlsManager.controls;
  }

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

  /**
   * Handles window resize events, updating camera aspect ratio and renderer size.
   * @param width - The new width of the viewport.
   * @param height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.sceneManager.onResize(width, height);

    this.css2DManager?.onResize(width, height);
  }

  /**
   * Executes a single render frame.
   *
   * @deprecated The rendering logic is now managed by the internal animation loop.
   * Calling this method is unnecessary and may have no effect.
   */
  render(): void {
    // Most logic moved to mainUpdateCallback within animationLoop.onAnimate
    // This method is kept for API compatibility but is effectively a no-op,
    // as the primary rendering path is the animation loop.
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
   * @param visible - True to show labels, false to hide.
   */
  setCelestialLabelsVisible(visible: boolean): void {
    this.css2DManager?.setLayerVisibility(
      CSS2DLayerType.CELESTIAL_LABELS,
      visible,
    );
  }
  /**
   * Sets the visibility of the background grid helper.
   * @param visible - True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    this.sceneManager.setGridVisible(visible);
  }
  /**
   * Sets the visibility of the AU (Astronomical Unit) marker lines.
   * @param visible - True to show AU markers, false to hide.
   */
  setAuMarkersVisible(visible: boolean): void {
    this.sceneManager.setAuMarkersVisible(visible);
  }
  /**
   * Sets the visibility of all orbital lines.
   * @param visible - True to show orbits, false to hide.
   */
  setOrbitsVisible(visible: boolean): void {
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
   * Sets an optional Canvas UI manager to be rendered on top of the 3D scene.
   * The provided object must have a `render()` method that will be called
   * at the end of each frame.
   *
   * @param uiManager - An object with a `render()` method.
   */
  setCanvasUIManager(uiManager: { render(): void }): void {
    this.canvasUIManager = uiManager;
    // We need to recreate the pipeline if the UI manager is set after initialization.
    // This is a simple way to handle it, though a more robust solution might
    // involve a setter on the pipeline itself.
    this.renderPipeline = new RenderPipeline({
      sceneManager: this.sceneManager,
      controlsManager: this.controlsManager,
      orbitManager: this.orbitManager,
      objectManager: this.objectManager,
      backgroundManager: this.backgroundManager,
      lightManager: this.lightManager,
      lodManager: this.lodManager,
      css2DManager: this.css2DManager,
      animationLoop: this.animationLoop,
      canvasUIManager: this.canvasUIManager,
    });
    this.setupAnimationCallbacks();
  }

  /**
   * Adds a callback function to be executed during each render frame.
   * @param callback - The function to execute.
   */
  addRenderCallback(callback: () => void): void {
    this.animationLoop.onRender(callback);
  }

  /**
   * Removes a previously added render callback function.
   * @param callback - The callback function to remove.
   */
  removeRenderCallback(callback: () => void): void {
    this.animationLoop.removeRenderCallback(callback);
  }

  /**
   * Retrieves a specific 3D object from the scene by its ID.
   * @param id - The unique identifier of the object.
   * @returns The found object, or null if not found.
   */
  public getObjectById(id: string): THREE.Object3D | null {
    return this.objectManager.getObject(id);
  }

  /**
   * Calculates the total number of triangles currently being rendered in the scene.
   * This is a costly operation and should only be used for debugging purposes.
   *
   * @returns The total triangle count.
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
   * Directly tells the ControlsManager to start or stop following a THREE.Object3D.
   * This is a low-level method. For semantic focus and smooth transitions,
   * use the application's `CameraManager`.
   *
   * @param object The THREE.Object3D to follow, or null to stop.
   * @param cameraOffset The offset the camera should maintain from the object. Required if `object` is not null.
   */
  setFollowTargetObject(
    object: THREE.Object3D | null,
    cameraOffset?: THREE.Vector3,
  ): void {
    if (!this.controlsManager) {
      console.error("[Renderer] ControlsManager not initialized.");
      return;
    }

    if (object) {
      if (!cameraOffset) {
        console.error(
          "[Renderer.setFollowTargetObject] cameraOffset is required when providing an object to follow.",
        );
        return;
      }
      this.controlsManager.startFollowing(object, cameraOffset);
    } else {
      this.controlsManager.stopFollowing();
    }
  }

  /**
   * Enables or disables debug visualizations for various renderer components.
   * @param enabled Whether debug visualizations should be shown.
   */
  public setDebugVisualization(enabled: boolean): void {
    setVisualizationEnabled(enabled);
  }

  /**
   * Toggles debug visualizations on or off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebugVisualization(): boolean {
    const newState = !debugConfig.visualize;
    this.setDebugVisualization(newState);
    return newState;
  }

  /**
   * Enables or disables the particle effects shown when objects are destroyed.
   * @param enabled Whether debris effects should be shown.
   */
  public setDebrisEffectsEnabled(enabled: boolean): void {
    this.objectManager.setDebrisEffectsEnabled(enabled);
  }

  /**
   * Toggles debris effects on or off.
   * @returns The new state (true if enabled, false if disabled).
   */
  public toggleDebrisEffects(): boolean {
    return this.objectManager.toggleDebrisEffects();
  }

  /**
   * Sets the global debug mode for the renderer.
   * This enables various visual helpers and may impact performance.
   * Note: Forcing fallback meshes currently requires object recreation.
   *
   * @param enabled - If true, enables debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    this.sceneManager.setDebugMode(enabled);
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
    this.controlsManager.setDebugMode(enabled);
  }

  /**
   * Returns the `OrbitsManager` instance to allow for advanced configuration
   * of orbit visualizations, such as changing the visualization mode.
   *
   * @returns The orbit manager instance.
   */
  getOrbitsManager(): OrbitsManager {
    return this.orbitManager;
  }
}
