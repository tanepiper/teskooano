import { StateAccessor, simulationState$ } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";
import { AnimationLoop } from "./AnimationLoop";
import { rendererEvents } from "./events";
import { CelestialType, DeviceTier } from "@teskooano/data-types";
import {
  SceneHelper,
  CameraHelper,
  CameraPreset,
} from "@teskooano/renderer-threejs-helpers";

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
    NEAR_PLANE: 0.0001, // Default near plane for space scenes
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
  userProfile: DeviceTier,
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

    // Use SceneHelper to create optimized scene components
    const sceneSetup = this._createSceneWithHelper(container);
    this.scene = sceneSetup.scene;
    this.camera = sceneSetup.camera;
    this.renderer = sceneSetup.renderer;

    // Initialize capability detection and performance optimization
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
  private _updatePerformanceOptimization(profile: DeviceTier): void {
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
   * Creates scene components using SceneHelper with optimized configuration.
   * @param container The HTML element that will contain the renderer's canvas.
   * @returns Object containing scene, camera, renderer, and THREE instance
   */
  private _createSceneWithHelper(container: HTMLElement): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    three: typeof THREE;
  } {
    // Determine power preference based on performance profile
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

    // Use CameraHelper to create optimized space camera
    const camera = CameraHelper.createCamera(CameraPreset.Space, {
      fov: this.fov,
      near: DefaultSceneManagerConfig.CAMERA.NEAR_PLANE,
      far: DefaultSceneManagerConfig.CAMERA.FAR_PLANE,
      position: [0, 20, 50], // Default camera position
      aspect: this.width / this.height,
    });

    // Use SceneHelper to create optimized space scene
    const sceneSetup = SceneHelper.createScene({
      backgroundColor: 0x000011, // Dark blue space background
      fov: this.fov,
      near: 0.0001, // Default near plane for space scenes
      far: DefaultSceneManagerConfig.CAMERA.FAR_PLANE,
      cameraPosition: [0, 20, 50], // Default camera position
      aspectRatio: this.width / this.height,
      enableShadows: this.options.shadows ?? true,
      shadowMapSize: 4096, // High resolution for space scenes
      antialias: this.options.antialias ?? true,
      alpha: true,
      powerPreference: powerPref,
    });

    // Replace the camera with our optimized one (ensure it's a PerspectiveCamera)
    if (camera instanceof THREE.PerspectiveCamera) {
      sceneSetup.camera = camera;
    } else {
      // Fallback to the original camera if CameraHelper returns OrthographicCamera
      console.warn(
        "CameraHelper returned OrthographicCamera, using default PerspectiveCamera",
      );
    }

    // Configure renderer size and append to container
    sceneSetup.renderer.setSize(this.width, this.height);
    sceneSetup.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(sceneSetup.renderer.domElement);

    // Apply HDR configuration if enabled
    if (this.options.hdr ?? true) {
      sceneSetup.renderer.outputColorSpace = THREE.SRGBColorSpace;
      sceneSetup.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      sceneSetup.renderer.toneMappingExposure =
        DefaultSceneManagerConfig.RENDERER.TONE_MAPPING_EXPOSURE;
    }

    return sceneSetup;
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

  /**
   * Updates camera settings based on the focused celestial object type
   * This prevents shader transparency issues while maintaining close viewing for satellites
   * @param celestialType The type of celestial object being focused
   */
  public updateCameraSettingsForObject(celestialType?: string): void {
    CameraHelper.updateCameraForCelestialType(this.camera, celestialType);
  }

  /**
   * Gets the minimum distance setting for orbit controls based on celestial object type
   * @param celestial object type
   * @returns The appropriate minimum distance value
   */
  public getMinDistanceForObject(celestialType?: string): number {
    return CameraHelper.getMinDistanceForCelestialType(celestialType);
  }
}
