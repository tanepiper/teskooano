import { StateAccessor } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";
import { AnimationLoop } from "./AnimationLoop";
import { rendererEvents } from "./events";

/**
 * @interface SceneManagerOptions
 * @description Defines the configuration options for creating a SceneManager instance.
 * This provides a strongly-typed contract for initializing the core scene components.
 */
export interface SceneManagerOptions {
  /** Enables or disables anti-aliasing. Defaults to true. */
  antialias?: boolean;
  /** Enables or disables shadow mapping. Defaults to true. */
  shadows?: boolean;
  /** Enables or disables the High Dynamic Range (HDR) rendering pipeline with ACES Filmic tone mapping. Defaults to true. */
  hdr?: boolean;
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
    DEFAULT_POSITION: new OSVector3().setFromArray([0, 20, 50]),
    DEFAULT_TARGET: new OSVector3().setFromArray([0, 0, 0]),
  },
  RENDERER: {
    POWER_PREFERENCE: {
      LOW: "low-power" as const,
      HIGH: "high-performance" as const,
      DEFAULT: "default" as const,
    },
    TONE_MAPPING_EXPOSURE: 1.0,
  },
};

/**
 * Manages the core Three.js components: the scene, camera, and renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method. It encapsulates
 * the boilerplate of Three.js setup and provides a clean API for interacting
 * with the scene.
 *
 * Note: This class focuses solely on core scene management. UI-specific features
 * like grids, backgrounds, and debug helpers should be handled by specialized
 * managers in the rendering pipeline.
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
  }

  /**
   * Determines the initial Field of View, prioritizing constructor options,
   * then persisted state, and finally the default configuration.
   * @returns The resolved FOV value.
   */
  private _initializeFov(): number {
    const initialState = StateAccessor.getCurrentSimulationState();
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
    const initialState = StateAccessor.getCurrentSimulationState();
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
      // Convert OSVector3 to THREE.Vector3 for rendering
      camera.position.copy(
        DefaultSceneManagerConfig.CAMERA.DEFAULT_POSITION.toThreeJS(),
      );
      camera.lookAt(
        DefaultSceneManagerConfig.CAMERA.DEFAULT_TARGET.toThreeJS(),
      );
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
    const initialState = StateAccessor.getCurrentSimulationState();
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
   * This method performs the core rendering operation without any UI-specific
   * features like grids or backgrounds, which should be handled by specialized managers.
   */
  render(): void {
    this.renderer.setViewport(0, 0, this.width, this.height);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("[SceneManager] Error during scene rendering:", error);
    }
  }

  /**
   * Disposes of all resources used by the `SceneManager`.
   * This includes the renderer and all objects in the scene.
   */
  dispose(): void {
    // Clear scene objects
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
}
