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
import * as THREE from "three";
import { AnimationLoop } from "./AnimationLoop";
import { rendererEvents } from "./events";
import { getPerformanceOptimization } from "./helpers/performance";
import { Subscription } from "rxjs";

/**
 * The main scene manager for Teskooano which handles the main Three.js scene, camera, and renderer.
 *
 * This class is responsible for the initial setup of the 3D environment,
 * handling resizing, and providing the main `render` method.
 *
 * It also handles listening for performance profile changes and updating the renderer accordingly.
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
  private webGLCapabilities: THREE.WebGLCapabilities;
  private performanceOptimization: PerformanceOptimization;
  private performanceSubscription?: Subscription;

  /**
   * Creates a new SceneManager instance.
   * @param container The HTML element that will contain the renderer's canvas.
   * @param options Configuration options for the scene manager.
   */
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;

    // Get initial state for defaults
    const simState = StateAccessor.getCurrentSimulationState();
    this.fov = options.fov ?? simState.camera.fov ?? 75;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Use SceneHelper to create optimized scene components
    const sceneSetup = this._createSceneWithHelper(container);
    this.scene = sceneSetup.scene;
    this.camera = sceneSetup.camera;
    this.renderer = sceneSetup.renderer;

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
  public getWebGLCapabilities(): THREE.WebGLCapabilities {
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
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    three: typeof THREE;
  } {
    // Determine power preference based on performance profile
    const simState = StateAccessor.getCurrentSimulationState();
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

    // Use CameraHelper to create optimized space camera
    const camera = CameraHelper.createCamera(CameraPreset.Space, {
      fov: this.fov,
      near: 0.0001, // Default near plane for space scenes
      far: 10000000, // Default far plane for space scenes
      position: this.options.cameraPosition ?? [1500, 1500, 1500], // Default camera position
      aspect: this.width / this.height,
    });

    // Use SceneHelper to create optimized space scene
    const sceneSetup = SceneHelper.createScene({
      name: "Teskooano Space Engine",
      backgroundColor: 0x000011, // Dark blue space background
      fov: this.fov,
      near: 0.0001, // Default near plane for space scenes
      far: 10000000, // Default far plane for space scenes
      aspectRatio: this.width / this.height,
      enableShadows: this.options.shadows ?? true,
      antialias: this.options.antialias ?? true,
      alpha: true,
      powerPreference: powerPref,
      shadowMapType: THREE.PCFSoftShadowMap, // Use default shadow map type
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
      sceneSetup.renderer.toneMappingExposure = 1.0; // Default exposure
    }

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
   * Sets the Field of View (FOV) of the camera.
   * @param newFov The new FOV value in degrees.
   */
  public setFov(newFov: number): void {
    if (this.fov === newFov) return;

    this.fov = newFov;
    if (this.camera) {
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

    if (this.camera) {
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
