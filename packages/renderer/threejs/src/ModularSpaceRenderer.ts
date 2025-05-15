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
import { OrbitManager } from "@teskooano/renderer-threejs-orbits";
import * as THREE from "three";
import { RendererStateAdapter } from "./RendererStateAdapter";

import { debugConfig, setVisualizationEnabled } from "@teskooano/core-debug";
import { renderableObjects$ } from "@teskooano/core-state";

export class ModularSpaceRenderer {
  public sceneManager: SceneManager;
  public animationLoop: AnimationLoop;
  public stateManager: StateManager;

  public objectManager: ObjectManager;
  public orbitManager: OrbitManager;
  public backgroundManager: BackgroundManager;

  public controlsManager: ControlsManager;
  public css2DManager?: CSS2DManager;

  public lightManager: LightManager;
  public lodManager: LODManager;

  private stateAdapter: RendererStateAdapter;

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

    this.sceneManager = new SceneManager(container, options);
    this.animationLoop = new AnimationLoop();
    this.stateManager = new StateManager();

    this.animationLoop.setRenderer(this.sceneManager.renderer);
    this.animationLoop.setCamera(this.sceneManager.camera);

    this.lightManager = new LightManager(this.sceneManager.scene);
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
      renderableObjects$,
      this.lightManager,
      this.sceneManager.renderer,
      this.css2DManager,
    );

    this.orbitManager = new OrbitManager(
      this.objectManager,
      this.stateAdapter,
      renderableObjects$,
    );
    this.backgroundManager = new BackgroundManager(this.sceneManager.scene);
    this.backgroundManager.setCamera(this.sceneManager.camera);

    this.setupEventListeners(container);

    this.setupAnimationCallbacks();

    window.addEventListener("resize", () => {
      this.onResize(container.clientWidth, container.clientHeight);
    });

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

    document.addEventListener("camera-transition-complete", (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
      }
    });
  }

  private setupAnimationCallbacks(): void {
    const mainUpdateCallback = (deltaTime: number, elapsedTime: number) => {
      // Update controls and camera position first
      this.controlsManager.update(deltaTime); // Assuming deltaTime from loop is same as controlsManager needs

      this.orbitManager.updateAllVisualizations();

      // objectManager.updateRenderers might be better after LOD and before CSS2D if it places objects
      this.objectManager.updateRenderers(
        elapsedTime,
        this.lightManager.getStarLightsData(),
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera,
      );

      this.backgroundManager.update(deltaTime); // Now uses updated camera

      this.lodManager.update(); // Update LODs based on new camera position

      if (this.css2DManager && typeof this.css2DManager.render === "function") {
        this.css2DManager.render(this.camera); // Render CSS2D with updated camera
      }

      // Run any custom render callbacks
      this.animationLoop.getRenderCallbacks().forEach((callback) => callback());

      // Perform the main scene render
      this.sceneManager.render();

      // Render any top-level canvas UI
      if (this.canvasUIManager) {
        this.canvasUIManager.render();
      }

      // Original position of this.render() call is removed as its logic is now inlined above.
      // this.render();
    };

    this.animationLoop.onAnimate(mainUpdateCallback);
  }

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
   * @param {number} width - The new width of the viewport.
   * @param {number} height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.sceneManager.onResize(width, height);

    this.css2DManager?.onResize(width, height);
  }

  /**
   * Executes a single render frame.
   * Updates LODs, objects, CSS2D elements, calls custom render callbacks,
   * updates controls, and renders the scene.
   */
  render(): void {
    // Most logic moved to mainUpdateCallback within animationLoop.onAnimate
    // If there's anything that absolutely must happen outside the animation loop's direct callback
    // but still be part of a "render" call, it would go here.
    // For now, this method can be simplified or even removed if mainUpdateCallback handles all.
    // If sceneManager.render() was the only substantive thing here and it's now in mainUpdateCallback,
    // this method might become redundant unless called from elsewhere for a specific reason (e.g., forced single refresh).
    // For safety, let's keep it for now but ensure it doesn't double-render.
    // However, the primary rendering path is now mainUpdateCallback.
    // If setupAnimationCallbacks correctly sets up the loop to call sceneManager.render(),
    // calling it again here would be a double render per frame.
    // Let's comment out the direct rendering here as it's handled by the animation loop.
    // this.sceneManager.render();
    // if (this.canvasUIManager) {
    //   this.canvasUIManager.render();
    // }
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
   * @deprecated Use ControlsManager methods (`transitionTo`, `transitionTargetTo`) and CameraManager for camera manipulation.
   * This method is no longer suitable for high-level camera control.
   */
  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    console.warn(
      "[ModularSpaceRenderer.updateCamera] This method is deprecated. Use CameraManager or ControlsManager directly.",
    );
    // Preserving a semblance of old behavior, but this is not a smooth transition.
    this.camera.position.copy(position);
    this.controlsManager.controls.target.copy(target);
    this.controlsManager.controls.update();
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
   * Directly tells the ControlsManager to start or stop following a THREE.Object3D.
   * This is a lower-level method. For semantic focus and transitions, use CameraManager.
   *
   * @param {THREE.Object3D | null} object The THREE.Object3D to follow, or null to stop.
   * @param {THREE.Vector3} [cameraOffset] The offset the camera should maintain from the object. Required if object is not null.
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
   * @deprecated Prefer using CameraManager for focus and follow behaviors.
   * This method now acts as a way to look up an object by ID and then call `setFollowTargetObject`.
   * It does NOT handle transitions; CameraManager does.
   */
  setFollowTarget(
    objectId: string | null,
    _targetPosition?: THREE.Vector3, // These are ignored as CameraManager handles positioning
    _cameraPosition?: THREE.Vector3, // These are ignored
  ): void {
    if (!this.controlsManager) {
      console.error(
        "[Renderer.setFollowTarget] ControlsManager not initialized.",
      );
      return;
    }
    console.warn(
      "[ModularSpaceRenderer.setFollowTarget] Deprecated. Use CameraManager for focus behaviors.",
    );

    if (objectId === null) {
      this.controlsManager.stopFollowing();
      return;
    }

    const objectToFollow = this.objectManager.getObject(objectId);

    if (!objectToFollow) {
      console.warn(
        `[Renderer.setFollowTarget] Could not find object with ID '${objectId}' to follow.`,
      );
      this.controlsManager.stopFollowing(); // Ensure we stop if previous target is now invalid
      return;
    }

    // This deprecated version won't have a specific offset. It will rely on ControlsManager's default or last offset if any.
    // Or, better, we simply state it cannot determine offset and a direct call to startFollowing on controlsManager is needed.
    // For now, it just sets the object, assuming CameraManager has ALREADY positioned the camera
    // and ControlsManager.startFollowing will be called by CameraManager with the correct offset.
    // Effectively, this method becomes a no-op if CameraManager is used correctly.
    // To make it *somewhat* useful as a direct call for *just starting to follow an already positioned camera*:
    const currentCameraPos = this.camera.position.clone();
    const targetObjPos = objectToFollow.getWorldPosition(new THREE.Vector3());
    const impliedOffset = currentCameraPos.sub(targetObjPos);
    this.controlsManager.startFollowing(objectToFollow, impliedOffset);
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
    this.setDebugVisualization(newState);
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
    this.sceneManager.setDebugMode(enabled);
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
    this.controlsManager.setDebugMode(enabled);
  }
}
