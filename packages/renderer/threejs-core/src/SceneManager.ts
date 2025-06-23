import { simulationStateService } from "@teskooano/core-state";
import * as THREE from "three";
import { AnimationLoop } from "./AnimationLoop";
import { rendererEvents } from "./events";
import { GridManager } from "./helpers/GridManager";

/**
 * @interface SceneManagerOptions
 * @description Defines the configuration options for creating a SceneManager instance.
 * This provides a strongly-typed contract for initializing the scene.
 */
export interface SceneManagerOptions {
  /** Enables or disables anti-aliasing. Defaults to true. */
  antialias?: boolean;
  /** Enables or disables shadow mapping. Defaults to true. */
  shadows?: boolean;
  /** Enables or disables the High Dynamic Range (HDR) rendering pipeline with ACES Filmic tone mapping. Defaults to true. */
  hdr?: boolean;
  /** The background for the scene. Can be a CSS color string or a THREE.Texture. Defaults to a dark blue (`0x000510`). */
  background?: string | THREE.Texture;
  /** Whether to display a grid helper in the scene. Defaults to true. */
  showGrid?: boolean;
  /** The camera's vertical Field of View (FOV) in degrees. Defaults to 75. */
  fov?: number;
}

/**
 * @const DefaultSceneManagerConfig
 * @description Contains the default values for various scene, camera, and renderer settings.
 * This centralizes "magic numbers" and default configurations for easier management and consistency.
 */
const DefaultSceneManagerConfig = {
  CAMERA: {
    FOV: 75,
    NEAR_PLANE: 0.0001,
    FAR_PLANE: 10000000,
    DEFAULT_POSITION: new THREE.Vector3(0, 20, 50),
    DEFAULT_TARGET: new THREE.Vector3(0, 0, 0),
  },
  RENDERER: {
    POWER_PREFERENCE: {
      LOW: "low-power" as const,
      HIGH: "high-performance" as const,
      DEFAULT: "default" as const,
    },
    TONE_MAPPING_EXPOSURE: 1.0,
  },
  HELPERS: {
    GRID: {
      SIZE: 10000000,
      DIVISIONS: 1000,
      COLOR_CENTER_LINE: 0xff0000,
      COLOR_GRID: 0x444444,
    },
    DEBUG_SPHERE: {
      RADIUS: 0.5,
      WIDTH_SEGMENTS: 16,
      HEIGHT_SEGMENTS: 16,
      COLOR: 0xff00ff,
    },
  },
  BACKGROUND_COLOR: 0x000510,
};

/**
 * Manages the core Three.js components: the scene, camera, and renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method. It encapsulates
 * the boilerplate of Three.js setup and provides a clean API for interacting
 * with the scene.
 */
export class SceneManager {
  /** The root `THREE.Scene` object. */
  public scene: THREE.Scene;
  /** The primary `THREE.PerspectiveCamera` for the scene. */
  public camera: THREE.PerspectiveCamera;
  /** The `THREE.WebGLRenderer` instance. */
  public renderer: THREE.WebGLRenderer;
  /** Manages the `requestAnimationFrame` loop. */
  public animationLoop: AnimationLoop;

  private fov: number;
  private options: SceneManagerOptions;
  private debugSphere: THREE.Mesh | null = null;
  private gridManager: GridManager | null = null;
  private backgroundColor: THREE.Color | THREE.Texture;
  private width: number;
  private height: number;

  /**
   * Creates a new SceneManager instance.
   *
   * @param container The HTML element where the renderer's canvas will be appended.
   * This element's dimensions will define the rendering area.
   * @param options A configuration object (`SceneManagerOptions`) for the scene,
   * camera, and renderer. Defaults will be used for any omitted properties.
   */
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.scene = new THREE.Scene();

    // Initialize core components
    this.animationLoop = new AnimationLoop();
    this.fov = this._initializeFov();
    this.camera = this._initializeCamera();
    this.renderer = this._initializeRenderer(container);

    // Pass renderer and camera to the loop for stats collection
    this.animationLoop.setRenderer(this.renderer);
    this.animationLoop.setCamera(this.camera);

    // Configure scene features
    this.backgroundColor = this._parseBackground(this.options.background);

    this.gridManager = new GridManager(
      this.scene,
      this.options.showGrid !== false,
    );
  }

  /**
   * Determines the initial Field of View, prioritizing constructor options,
   * then persisted state, and finally the default configuration.
   * @returns The resolved FOV value.
   */
  private _initializeFov(): number {
    const initialState = simulationStateService.getSimulationState();
    return (
      this.options.fov ??
      initialState.camera?.fov ??
      DefaultSceneManagerConfig.CAMERA.FOV
    );
  }

  /**
   * Sets up the main perspective camera. It will use position and target data
   * from the persisted state if available, otherwise it falls back to a
   * sensible default position and target.
   * @returns The configured `PerspectiveCamera`.
   */
  private _initializeCamera(): THREE.PerspectiveCamera {
    const initialState = simulationStateService.getSimulationState();
    const camera = new THREE.PerspectiveCamera(
      this.fov,
      this.width / this.height,
      DefaultSceneManagerConfig.CAMERA.NEAR_PLANE,
      DefaultSceneManagerConfig.CAMERA.FAR_PLANE,
    );

    if (initialState?.camera) {
      camera.position.set(
        initialState.camera.position.x,
        initialState.camera.position.y,
        initialState.camera.position.z,
      );
      camera.lookAt(
        initialState.camera.target.x,
        initialState.camera.target.y,
        initialState.camera.target.z,
      );
    } else {
      camera.position.copy(DefaultSceneManagerConfig.CAMERA.DEFAULT_POSITION);
      camera.lookAt(DefaultSceneManagerConfig.CAMERA.DEFAULT_TARGET);
    }
    return camera;
  }

  /**
   * Sets up the WebGL renderer, configures its features based on options
   * and performance profile, and appends its canvas to the container element.
   * @param container The host element for the renderer's canvas.
   * @returns The configured `WebGLRenderer`.
   */
  private _initializeRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const initialState = simulationStateService.getSimulationState();
    const profile = initialState.performanceProfile;
    let powerPref: "default" | "high-performance" | "low-power" =
      DefaultSceneManagerConfig.RENDERER.POWER_PREFERENCE.DEFAULT;

    switch (profile) {
      case "low":
        powerPref = DefaultSceneManagerConfig.RENDERER.POWER_PREFERENCE.LOW;
        break;
      case "high":
      case "cosmic":
        powerPref = DefaultSceneManagerConfig.RENDERER.POWER_PREFERENCE.HIGH;
        break;
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: this.options.antialias ?? true,
      stencil: false,
      logarithmicDepthBuffer: false,
      preserveDrawingBuffer: false,
      powerPreference: powerPref,
    });

    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    if (this.options.shadows ?? true) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    if (this.options.hdr ?? true) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure =
        DefaultSceneManagerConfig.RENDERER.TONE_MAPPING_EXPOSURE;
    }
    return renderer;
  }

  /**
   * Parses the background option into a usable Color or Texture.
   * @param background The background option from the constructor.
   * @returns A `THREE.Color` or `THREE.Texture` object.
   */
  private _parseBackground(
    background?: string | THREE.Texture,
  ): THREE.Color | THREE.Texture {
    if (background) {
      if (typeof background === "string") {
        return new THREE.Color(background);
      }
      return background;
    }
    return new THREE.Color(DefaultSceneManagerConfig.BACKGROUND_COLOR);
  }

  /**
   * Sets the Field of View (FOV) of the camera.
   * @param newFov The new FOV value in degrees.
   */
  public setFov(newFov: number): void {
    if (this.fov === newFov) return;

    this.fov = newFov;
    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Handles window resize events.
   * @param width The new width of the render container.
   * @param height The new height of the render container.
   */
  onResize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    rendererEvents.resize$.next({ width, height });
  }

  /**
   * Starts the rendering loop.
   */
  public startRenderLoop(): void {
    this.animationLoop.start();
  }

  /**
   * Stops the rendering loop.
   */
  public stopRenderLoop(): void {
    this.animationLoop.stop();
  }

  /**
   * Renders a single frame of the scene.
   */
  render(): void {
    if (this.backgroundColor instanceof THREE.Color) {
      this.renderer.setClearColor(this.backgroundColor);
      this.scene.background = null;
    } else if (this.backgroundColor instanceof THREE.Texture) {
      this.scene.background = this.backgroundColor;
    }

    this.renderer.setViewport(0, 0, this.width, this.height);
    this.gridManager?.update(this.camera);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("[SceneManager] Error during scene rendering:", error);
    }
  }

  /**
   * Sets the global debug mode for the scene manager.
   * This controls the visibility of the origin debug sphere.
   * @param enabled If true, shows the debug sphere; otherwise, hides it.
   */
  public setDebugMode(enabled: boolean): void {
    if (enabled) {
      if (!this.debugSphere) {
        this._createDebugSphere();
      }
      if (this.debugSphere) {
        this.debugSphere.visible = true;
      }
    } else if (this.debugSphere) {
      this.debugSphere.visible = false;
    }
  }

  /**
   * Toggles the visibility of the grid helper.
   */
  toggleGrid(): void {
    this.gridManager?.toggle();
  }

  /**
   * Sets the visibility of the grid helper.
   * @param visible True to show the grid, false to hide.
   */
  setGridVisible(visible: boolean): void {
    if (visible) {
      if (!this.gridManager) {
        this.gridManager = new GridManager(this.scene);
      }
      this.gridManager.setVisible(true);
    } else {
      this.gridManager?.setVisible(false);
    }
  }

  /**
   * Disposes of all resources used by the `SceneManager`.
   * This includes helpers, the renderer, and all objects in the scene.
   */
  dispose(): void {
    // Clear scene objects and helpers
    this._clearDebugSphere();
    this.gridManager?.dispose();
    this.scene.children.forEach((obj) => {
      // Basic cleanup. More complex objects need their own dispose logic.
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    // Stop the animation loop
    this.animationLoop.stop();

    // Dispose of the renderer and remove its canvas from the DOM
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(
      this.renderer.domElement,
    );

    rendererEvents.dispose$.next();
  }

  /** Creates the debug sphere at the origin using settings from the default config. */
  private _createDebugSphere(): void {
    if (this.debugSphere) return;
    const config = DefaultSceneManagerConfig.HELPERS.DEBUG_SPHERE;
    const geometry = new THREE.SphereGeometry(
      config.RADIUS,
      config.WIDTH_SEGMENTS,
      config.HEIGHT_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({ color: config.COLOR });
    this.debugSphere = new THREE.Mesh(geometry, material);
    this.debugSphere.position.set(0, 0, 0);
    this.scene.add(this.debugSphere);
  }

  /** Disposes of the debug sphere's resources. */
  private _clearDebugSphere(): void {
    if (this.debugSphere) {
      this.scene.remove(this.debugSphere);
      this.debugSphere.geometry.dispose();
      if (this.debugSphere.material instanceof Array) {
        this.debugSphere.material.forEach((m) => m.dispose());
      } else {
        this.debugSphere.material.dispose();
      }
      this.debugSphere = null;
    }
  }
}
