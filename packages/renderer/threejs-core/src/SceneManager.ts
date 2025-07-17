import { StateAccessor, simulationState$ } from "@teskooano/core-state";
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
 * @interface WebGLCapabilities
 * @description Represents the detected WebGL capabilities of the device
 */
export interface WebGLCapabilities {
  isWebGL2: boolean;
  precision: string;
  maxTextures: number;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  maxVaryings: number;
  maxAttributes: number;
  vertexTextures: boolean;
  maxSamples: number;
  logarithmicDepthBuffer: boolean;
  reverseDepthBuffer: boolean;
}

/**
 * @interface PerformanceOptimization
 * @description Defines performance optimization settings based on device capabilities
 */
export interface PerformanceOptimization {
  antialias: boolean;
  shadows: boolean;
  hdr: boolean;
  pixelRatio: number;
  shadowMapType: THREE.ShadowMapType;
  maxLights: number;
  maxShadowCasters: number;
  lodDistanceMultiplier: number;
  trailQuality: "low" | "medium" | "high";
  particleCountMultiplier: number;
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
 * Detects WebGL capabilities and returns optimization settings
 */
function detectWebGLCapabilities(
  renderer: THREE.WebGLRenderer,
): WebGLCapabilities {
  const capabilities = renderer.capabilities;
  return {
    isWebGL2: capabilities.isWebGL2,
    precision: capabilities.precision,
    maxTextures: capabilities.maxTextures,
    maxTextureSize: capabilities.maxTextureSize,
    maxVertexUniforms: capabilities.maxVertexUniforms,
    maxFragmentUniforms: capabilities.maxFragmentUniforms,
    maxVaryings: capabilities.maxVaryings,
    maxAttributes: capabilities.maxAttributes,
    vertexTextures: capabilities.vertexTextures,
    maxSamples: capabilities.maxSamples,
    logarithmicDepthBuffer: capabilities.logarithmicDepthBuffer,
    reverseDepthBuffer: capabilities.reverseDepthBuffer,
  };
}

/**
 * Determines optimal performance settings based on WebGL capabilities and user profile
 */
function getPerformanceOptimization(
  capabilities: WebGLCapabilities,
  userProfile: "low" | "medium" | "high" | "cosmic",
): PerformanceOptimization {
  // Base optimization based on hardware capabilities
  const isHighEndGPU =
    capabilities.maxTextures >= 16 &&
    capabilities.maxTextureSize >= 8192 &&
    capabilities.maxFragmentUniforms >= 1024;

  const isMidRangeGPU =
    capabilities.maxTextures >= 8 &&
    capabilities.maxTextureSize >= 4096 &&
    capabilities.maxFragmentUniforms >= 512;

  const isLowEndGPU = !isHighEndGPU && !isMidRangeGPU;

  // User profile multipliers (0.5 = more aggressive optimization, 2.0 = less optimization)
  const profileMultipliers = {
    low: 0.5,
    medium: 0.8,
    high: 1.2,
    cosmic: 2.0,
  };

  const multiplier = profileMultipliers[userProfile];

  // Determine antialiasing based on capabilities and profile
  const antialias = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");

  // Determine shadows based on capabilities
  const shadows = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");
  const shadowMapType = isHighEndGPU
    ? THREE.PCFSoftShadowMap
    : THREE.BasicShadowMap;

  // Determine HDR based on capabilities
  const hdr =
    isHighEndGPU ||
    (isMidRangeGPU && userProfile === "high") ||
    userProfile === "cosmic";

  // Pixel ratio optimization
  const basePixelRatio = isHighEndGPU ? 2.0 : isMidRangeGPU ? 1.5 : 1.0;
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    basePixelRatio * multiplier,
  );

  // Light and shadow limits based on uniform capacity
  const maxLights = Math.min(
    Math.floor(capabilities.maxFragmentUniforms / 20), // Estimate uniforms per light
    isHighEndGPU ? 16 : isMidRangeGPU ? 8 : 4,
  );

  const maxShadowCasters = Math.min(
    Math.floor(capabilities.maxFragmentUniforms / 15), // Estimate uniforms per shadow caster
    isHighEndGPU ? 12 : isMidRangeGPU ? 6 : 3,
  );

  // LOD distance multiplier (higher = switch to lower detail sooner)
  const lodDistanceMultiplier = isLowEndGPU ? 1.5 : isMidRangeGPU ? 1.2 : 1.0;

  // Trail quality based on capabilities
  const trailQuality = isHighEndGPU ? "high" : isMidRangeGPU ? "medium" : "low";

  // Particle count multiplier
  const particleCountMultiplier = isHighEndGPU
    ? 1.0
    : isMidRangeGPU
      ? 0.7
      : 0.4;

  return {
    antialias,
    shadows,
    hdr,
    pixelRatio,
    shadowMapType,
    maxLights,
    maxShadowCasters,
    lodDistanceMultiplier,
    trailQuality,
    particleCountMultiplier,
  };
}

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
  private webGLCapabilities: WebGLCapabilities;
  private performanceOptimization: PerformanceOptimization;

  /**
   * Creates a new SceneManager instance.
   * @param container The HTML element that will contain the renderer's canvas.
   * @param options Configuration options for the scene manager.
   */
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;
    this.fov = options.fov ?? DefaultSceneManagerConfig.CAMERA.FOV;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Initialize core components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.width / this.height,
      DefaultSceneManagerConfig.CAMERA.NEAR_PLANE,
      DefaultSceneManagerConfig.CAMERA.FAR_PLANE,
    );

    // Initialize renderer with capability detection
    this.renderer = this._initializeRenderer(container);
    this.webGLCapabilities = detectWebGLCapabilities(this.renderer);

    // Get initial performance optimization based on current state
    const initialState = StateAccessor.getCurrentSimulationState();
    this.performanceOptimization = getPerformanceOptimization(
      this.webGLCapabilities,
      initialState.performanceProfile,
    );

    // Subscribe to performance profile changes
    this._subscribeToPerformanceChanges();

    // Initialize animation loop
    this.animationLoop = new AnimationLoop();
    this.animationLoop.setRenderer(this.renderer);
    this.animationLoop.setCamera(this.camera);

    // Set initial camera position
    this._setInitialCameraPosition();
  }

  /**
   * Gets the detected WebGL capabilities
   */
  public getWebGLCapabilities(): WebGLCapabilities {
    return this.webGLCapabilities;
  }

  /**
   * Gets the current performance optimization settings
   */
  public getPerformanceOptimization(): PerformanceOptimization {
    return this.performanceOptimization;
  }

  /**
   * Updates performance optimization settings based on new profile
   */
  private _updatePerformanceOptimization(
    profile: "low" | "medium" | "high" | "cosmic",
  ): void {
    this.performanceOptimization = getPerformanceOptimization(
      this.webGLCapabilities,
      profile,
    );

    // Apply new settings to renderer
    this.renderer.setPixelRatio(this.performanceOptimization.pixelRatio);

    if (this.performanceOptimization.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.performanceOptimization.shadowMapType;
    } else {
      this.renderer.shadowMap.enabled = false;
    }

    // Emit optimization change event
    rendererEvents.performanceOptimizationChanged$.next(
      this.performanceOptimization,
    );
  }

  /**
   * Subscribes to performance profile changes from the state
   */
  private _subscribeToPerformanceChanges(): void {
    simulationState$.subscribe((state: any) => {
      if (state.performanceProfile) {
        this._updatePerformanceOptimization(state.performanceProfile);
      }
    });
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
   * Sets the initial camera position based on the current simulation state.
   * This ensures the camera starts in a reasonable position relative to the
   * celestial objects in the scene.
   */
  private _setInitialCameraPosition(): void {
    const initialState = StateAccessor.getCurrentSimulationState();
    const cameraState = initialState.camera;

    this.camera.position.set(
      cameraState.position.x,
      cameraState.position.y,
      cameraState.position.z,
    );
    this.camera.lookAt(
      cameraState.target.x,
      cameraState.target.y,
      cameraState.target.z,
    );
    this.camera.fov = cameraState.fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Starts the render loop.
   */
  startRenderLoop(): void {
    this.animationLoop.start();
  }

  /**
   * Stops the render loop.
   */
  stopRenderLoop(): void {
    this.animationLoop.stop();
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
   * Handles window resize events by updating the renderer size and camera aspect ratio.
   * This method should be called whenever the container element is resized.
   * @param width The new width of the container.
   * @param height The new height of the container.
   */
  onResize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
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
   * Cleans up resources used by the SceneManager.
   * This should be called when the SceneManager is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    // Stop the animation loop first
    this.animationLoop.stop();

    // Remove the canvas from the DOM
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }

    // Dispose the renderer (this also disposes the canvas)
    this.renderer.dispose();

    // Clear the scene
    this.scene.clear();
  }
}
