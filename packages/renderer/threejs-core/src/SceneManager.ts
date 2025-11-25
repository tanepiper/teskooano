import {
  StateAccessor,
  simulationState$,
  simulationStore,
} from "@teskooano/core-state";
import {
  DeviceTier,
  PerformanceOptimization,
  SceneManagerOptions,
} from "@teskooano/data-types";
import {
  CameraHelper,
  CameraPreset,
} from "@teskooano/renderer-threejs-helpers";
import { AnimationLoop } from "./AnimationLoop";
import {
  LogarithmicDepthMaterial,
  CAMERA_DISTANCE_CONFIG,
} from "./LogarithmicDepthMaterial";
import { rendererEvents } from "./events";
import { getPerformanceOptimization } from "./helpers/performance";
import { Subscription } from "rxjs";
import * as THREE from "three";
import {
  PerspectiveCamera,
  Scene,
  type WebGLCapabilities,
  Object3D,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from "three";
import { WebGPURenderer } from "three/webgpu";

/**
 * The main scene manager for Teskooano which handles the main Three.js scene, camera, and WebGPU renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method.
 *
 * It also handles listening for performance profile changes and updating the renderer accordingly.
 *
 * **Important**: This application exclusively uses WebGPU with Three.js TSL (Three.js Shading Language).
 */
export class SceneManager {
  /**
   * The main ThreeJS scene object, this is the root object for all the objects in the scene.
   */
  public scene: Scene;
  /**
   * The primary camera for the scene.
   */
  public camera: PerspectiveCamera;
  /**
   * The WebGPURenderer instance.
   */
  public renderer: WebGPURenderer;
  /**
   * Manages the `requestAnimationFrame` loop.
   */
  public animationLoop: AnimationLoop;
  /**
   * Flag indicating whether the renderer is fully initialized and ready to render.
   * Becomes true after async init() completes.
   */
  private rendererReady: boolean = false;

  /**
   * The field of view of the camera.
   */
  public fov: number;
  /**
   * The options for the scene manager.
   */
  private options: SceneManagerOptions;
  /**
   * The width of the scene.
   */
  private width: number;
  /**
   * The height of the scene.
   */
  private height: number;
  /**
   * Legacy WebGL capabilities structure (kept for compatibility but unused in WebGPU).
   */
  private webGLCapabilities: WebGLCapabilities;
  /**
   * The performance optimization of the renderer.
   */
  private performanceOptimization: PerformanceOptimization;
  /**
   * The subscription to the performance profile changes.
   */
  private performanceSubscription?: Subscription;

  /**
   * Creates a new SceneManager instance.
   * Initializes scene, camera, and WebGPU renderer.
   *
   * @param container The HTML element that will contain the renderer's canvas.
   * @param options Configuration options for the scene manager.
   * @throws Error if WebGPU is not available
   */
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;

    // Check WebGPU availability
    const isWebGPUAvailable =
      typeof navigator !== "undefined" && navigator.gpu !== undefined;

    if (!isWebGPUAvailable) {
      throw new Error(
        "[SceneManager] WebGPU is not available. " +
          "This application requires a modern browser with WebGPU support. " +
          "Please update your browser or use Chrome/Edge 113+, Firefox 127+, or Safari 18+.",
      );
    }

    console.log("[SceneManager] WebGPU available, creating renderer");

    // Get initial state for defaults
    const simState = StateAccessor.getSimulationState();
    this.fov = options.fov ?? 75;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Initialize scene with WebGPU
    const sceneSetup = this._createScene(container);
    this.scene = sceneSetup.scene;
    this.camera = sceneSetup.camera;
    this.renderer = sceneSetup.renderer;

    // Initialize with default capabilities (WebGPU doesn't expose capabilities like WebGL)
    this.webGLCapabilities = {} as WebGLCapabilities;
    this.performanceOptimization = getPerformanceOptimization(
      this.webGLCapabilities,
      simState.performanceProfile,
    );

    // Subscribe to performance profile changes
    this._subscribeToPerformanceChanges();

    // Initialize animation loop
    this.animationLoop = new AnimationLoop();
    this.animationLoop.setRenderer(this.renderer);
    this.animationLoop.setCamera(this.camera);

    console.log("[SceneManager] WebGPU renderer created, initializing asynchronously");

    // Initialize WebGPU renderer asynchronously (required before first render)
    this._initializeWebGPURenderer();
  }

  /**
   * Creates scene with WebGPU renderer.
   *
   * @param container The HTML element that will contain the renderer's canvas.
   * @returns Object containing scene, camera, and WebGPU renderer
   * @private
   */
  private _createScene(container: HTMLElement): {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGPURenderer;
  } {
    // Create camera (ensure it's a PerspectiveCamera)
    const cameraResult = CameraHelper.createCamera(CameraPreset.Space, {
      fov: this.fov,
      near: CAMERA_DISTANCE_CONFIG.NEAR,
      far: CAMERA_DISTANCE_CONFIG.FAR,
      position: this.options.cameraPosition ?? [1500, 1500, 1500],
      aspect: this.width / this.height,
    });

    // Ensure we have a PerspectiveCamera
    if (!(cameraResult instanceof PerspectiveCamera)) {
      throw new Error(
        "CameraHelper must return a PerspectiveCamera for space scenes",
      );
    }

    const camera = cameraResult as PerspectiveCamera;

    // Configure camera for logarithmic depth buffer
    LogarithmicDepthMaterial.configureCameraForLogDepth(camera);

    // Create scene
    const scene = new Scene();
    scene.scale.set(1, 1, 1);
    scene.name = "Teskooano Space Engine";
    scene.background = new THREE.Color(0x000011);

    // Create WebGPU renderer
    const renderer = new WebGPURenderer({
      antialias: this.options.antialias ?? true,
      forceWebGL: false,
    });

    renderer.sortObjects = false;
    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Apply HDR configuration if enabled
    if (this.options.hdr ?? true) {
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    }

    console.log("[SceneManager] WebGPU renderer created (requires async initialization)");

    return { scene, camera, renderer };
  }

  /**
   * Asynchronously initializes the WebGPU renderer.
   * This must be called before the first render for WebGPU renderer to work.
   *
   * @private
   */
  private async _initializeWebGPURenderer(): Promise<void> {
    try {
      await this.renderer.init();
      console.log("[SceneManager] WebGPU renderer initialized successfully");

      // Ensure scene background is properly set
      if (!this.scene.background) {
        this.scene.background = new THREE.Color(0x000011);
      }

      // WebGPU specific configuration
      this.renderer.setClearColor(0x000011, 1.0);

      // Mark renderer as ready
      this.rendererReady = true;

      // Update state to reflect that WebGPU is active
      const currentState = StateAccessor.getSimulationState();
      simulationStore.updateSimulationState({
        renderer: {
          ...currentState.renderer,
          backend: {
            backend: "webgpu",
            webgpuAvailable: true,
            initialized: true,
          },
        },
      });
    } catch (error) {
      console.error(
        "[SceneManager] WebGPU renderer initialization failed:",
        error,
      );
      throw error;
    }
  }

  /**
   * Gets the detected WebGL capabilities
   */
  public getWebGLCapabilities(): WebGLCapabilities {
    return this.webGLCapabilities;
  }

  /**
   * Gets the renderer backend being used (always 'webgpu')
   *
   * @returns The current renderer backend
   */
  public getRendererBackend(): "webgpu" {
    return "webgpu";
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

    // Apply new settings to renderer (with null check)
    if (this.renderer) {
      this.renderer.setPixelRatio(this.performanceOptimization.pixelRatio);

      if (this.performanceOptimization.shadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type =
          this.performanceOptimization.shadowMapType;
      } else {
        this.renderer.shadowMap.enabled = false;
      }
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
    this.performanceSubscription = simulationState$.subscribe((state: any) => {
      if (state.performanceProfile) {
        this._updatePerformanceOptimization(state.performanceProfile);
      }
    });
  }

  /**
   * Creates scene components using SceneHelper with optimized configuration.
   * Supports both WebGL and WebGPU renderers with automatic detection.
   *
   * @param container The HTML element that will contain the renderer's canvas.
   * @returns Promise resolving to object containing scene, camera, renderer, and backend used
   * @private
   */
  private async _createSceneWithHelper(container: HTMLElement): Promise<{
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer | WebGPURenderer;
    backendUsed: RendererBackend;
  }> {
    // Determine power preference based on performance profile
    const simState = StateAccessor.getSimulationState();
    const profile = simState.performanceProfile;
    let powerPref: "default" | "high-performance" | "low-power" = "default"; // Default to "default"

    switch (profile) {
      case "low":
        powerPref = "low-power";
        break;
      case "high":
      case "cosmic":
        powerPref = "high-performance";
        break;
    }

    // Use CameraHelper to create optimized space camera with logarithmic depth
    const camera = CameraHelper.createCamera(CameraPreset.Space, {
      fov: this.fov,
      near: CAMERA_DISTANCE_CONFIG.NEAR, // Use single source of truth for camera distances
      far: CAMERA_DISTANCE_CONFIG.FAR, // Use single source of truth for camera distances
      position: this.options.cameraPosition ?? [1500, 1500, 1500], // Default camera position
      aspect: this.width / this.height,
    });

    // Configure camera for logarithmic depth buffer (only for perspective cameras)
    if (camera instanceof PerspectiveCamera) {
      LogarithmicDepthMaterial.configureCameraForLogDepth(
        camera as PerspectiveCamera,
      );
    }

    // Use SceneHelper to create optimized space scene with logarithmic depth
    const sceneSetup = await SceneHelper.createScene({
      name: "Teskooano Space Engine",
      backgroundColor: 0x000011, // Dark blue space background
      fov: this.fov,
      near: 0.00001, // Logarithmic depth allows aggressive near plane
      far: 1000000, // Logarithmic depth allows massive far plane
      aspectRatio: this.width / this.height,
      enableShadows: this.options.shadows ?? true,
      antialias: this.options.antialias ?? true,
      alpha: true,
      powerPreference: powerPref,
      shadowMapType: PCFSoftShadowMap, // Use default shadow map type
      rendererBackend: this.options.rendererBackend ?? "webgpu",
    });

    // Replace the camera with our optimized one (ensure it's a PerspectiveCamera)
    if (camera instanceof PerspectiveCamera) {
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
      sceneSetup.renderer.outputColorSpace = SRGBColorSpace;
      sceneSetup.renderer.toneMapping = ACESFilmicToneMapping;
      sceneSetup.renderer.toneMappingExposure = 1.0; // Default exposure
    }

    // Enable logarithmic depth buffer globally on the renderer
    const gl = sceneSetup.renderer.getContext();
    (sceneSetup.renderer as any).logarithmicDepthBuffer = true;

    return sceneSetup;
  }

  /**
   * Starts the render loop.
   */
  start(): void {
    if (this.animationLoop) {
      this.animationLoop.start();
    }
  }

  /**
   * Stops the render loop.
   */
  stop(): void {
    if (this.animationLoop) {
      this.animationLoop.stop();
    }
  }

  /**
   * Enables logarithmic depth buffer for superior precision across massive distance ranges.
   * This is essential for space scenes where objects range from meters to astronomical units.
   */
  private enableLogarithmicDepth(): void {
    // Log depth is enabled globally on the renderer, but we also need to
    // apply it to any existing materials and set up auto-application for new ones
    LogarithmicDepthMaterial.enableLogDepthForScene(this.scene);

    // Set up auto-application for future materials
    this.setupAutoLogDepthApplication();
  }

  /**
   * Sets up automatic application of logarithmic depth to newly created materials.
   */
  private setupAutoLogDepthApplication(): void {
    // Store reference to enable easier material patching
    const originalScene = this.scene;

    // We'll patch the scene's add method to auto-apply log depth to new objects
    const originalAdd = originalScene.add.bind(originalScene);
    originalScene.add = function (...objects: Object3D[]) {
      const result = originalAdd(...objects);

      // Apply log depth to any materials in the newly added objects
      objects.forEach((obj) => {
        LogarithmicDepthMaterial.enableLogDepthForScene(obj as any);
      });

      return result;
    };
  }

  /**
   * Sets the Field of View (FOV) of the camera.
   * @param newFov The new FOV value in degrees.
   */
  public setFov(newFov: number): void {
    if (this.fov === newFov) return;

    this.fov = newFov;
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.fov = newFov;
      this.camera.updateProjectionMatrix();
    }
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

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  /**
   * Renders a single frame of the scene.
   * This method performs the core rendering operation without any UI-specific
   * features like grids or backgrounds, which should be handled by specialized managers.
   */
  render(): void {
    if (!this.renderer || !this.scene || !this.camera) {
      return; // Cannot render if core components are null
    }

    // Skip rendering if the renderer is not ready (WebGPU async init may still be in progress)
    if (!this.rendererReady) {
      return;
    }

    this.renderer.setViewport(0, 0, this.width, this.height);

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("[SceneManager] Error during WebGPU scene rendering:", error);
      console.error("[SceneManager] All materials must use NodeMaterial with TSL for WebGPU compatibility");
    }
  }

  /**
   * Cleans up resources used by the SceneManager.
   * This should be called when the SceneManager is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    // Unsubscribe from performance changes first
    if (this.performanceSubscription) {
      this.performanceSubscription.unsubscribe();
      this.performanceSubscription = undefined;
    }

    // Stop the animation loop first (with null check)
    if (this.animationLoop) {
      this.animationLoop.stop();
    }

    // Remove the canvas from the DOM (with null check)
    if (this.renderer?.domElement?.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }

    // Dispose the renderer (this also disposes the canvas) (with null check)
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Clear the scene (with null check)
    if (this.scene) {
      this.scene.clear();
    }

    // Nullify references to allow garbage collection
    (this.scene as any) = null;
    (this.camera as any) = null;
    (this.renderer as any) = null;
    (this.animationLoop as any) = null;
    (this.performanceSubscription as any) = null;
  }
}
