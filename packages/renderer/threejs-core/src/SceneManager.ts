import { StateAccessor, simulationState$ } from "@teskooano/core-state";
import {
  DeviceTier,
  PerformanceOptimization,
  SceneManagerOptions,
} from "@teskooano/data-types";
import {
  CameraHelper,
  CameraPreset,
  SceneHelper,
} from "@teskooano/renderer-threejs-helpers";
import { AnimationLoop } from "./AnimationLoop";
import {
  LogarithmicDepthMaterial,
  CAMERA_DISTANCE_CONFIG,
} from "./LogarithmicDepthMaterial";
import { rendererEvents } from "./events";
import { getPerformanceOptimization } from "./helpers/performance";
import { Subscription } from "rxjs";
import {
  PerspectiveCamera,
  type Scene,
  type Camera,
  type WebGLRenderer,
  type WebGLCapabilities,
  Object3D,
  SRGBColorSpace,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
} from "three";

/**
 * The main scene manager for Teskooano which handles the main Three.js scene, camera, and renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method.
 *
 * It also handles listening for performance profile changes and updating the renderer accordingly.
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
   * The `THREE.WebGLRenderer` instance.
   */
  public renderer: WebGLRenderer;
  /**
   * Manages the `requestAnimationFrame` loop.
   */
  public animationLoop: AnimationLoop;

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
   * The WebGL capabilities of the renderer.
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
   * @param container The HTML element that will contain the renderer's canvas.
   * @param options Configuration options for the scene manager.
   */
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;

    // Get initial state for defaults
    const simState = StateAccessor.getSimulationState();
    // Camera state is now per-panel, so we use the provided FOV or default
    this.fov = options.fov ?? 75;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Use SceneHelper to create optimized scene components
    const sceneSetup = this._createSceneWithHelper(container);
    this.scene = sceneSetup.scene;
    this.camera = sceneSetup.camera;
    this.renderer = sceneSetup.renderer;

    // Enable logarithmic depth buffer for superior space-scale precision
    this.enableLogarithmicDepth();

    // Initialize capability detection and performance optimization
    this.webGLCapabilities = this.renderer.capabilities;

    // Get initial performance optimization based on current state
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
   * @param container The HTML element that will contain the renderer's canvas.
   * @returns Object containing scene, camera, renderer, and THREE instance
   */
  private _createSceneWithHelper(container: HTMLElement): {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
  } {
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
    const sceneSetup = SceneHelper.createScene({
      name: "Teskooano Space Engine",
      backgroundColor: 0x000011, // Dark blue space background
      fov: this.fov,
      near: CAMERA_DISTANCE_CONFIG.NEAR,
      far: CAMERA_DISTANCE_CONFIG.FAR,
      aspectRatio: this.width / this.height,
      enableShadows: this.options.shadows ?? true,
      antialias: this.options.antialias ?? true,
      alpha: true,
      powerPreference: powerPref,
      shadowMapType: PCFSoftShadowMap, // Use default shadow map type
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
