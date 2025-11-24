import * as THREE from "three";
// @ts-ignore - WebGPU renderer import path varies by Three.js version
import { WebGPURenderer } from "three/webgpu";
import type { RendererBackend } from "@teskooano/data-types";
import { WebGPUDetection } from "./WebGPUDetection";

/**
 * Helper class for creating and managing Three.js scenes with consistent configuration.
 * Provides methods for scene setup, camera configuration, and renderer initialization.
 * For lighting setup, use the separate LightingHelper class.
 */
export class SceneHelper {
  /**
   * Creates a complete Three.js scene setup with sensible defaults.
   * Supports both WebGPU and WebGL renderers with automatic fallback.
   *
   * @param options - Configuration options for the scene
   * @param options.backgroundColor - Scene background color (default: 0x000000)
   * @param options.fov - Camera field of view in degrees (default: 60)
   * @param options.near - Camera near plane distance (default: 1)
   * @param options.far - Camera far plane distance (default: 10000)
   * @param options.cameraPosition - Initial camera position [x, y, z] (default: [0, 0, 30])
   * @param options.aspectRatio - Camera aspect ratio (default: window.innerWidth / window.innerHeight)
   * @param options.enableShadows - Whether to enable shadow mapping (default: true)
   * @param options.shadowMapSize - Shadow map resolution (default: 2048)
   * @param options.antialias - Whether to enable antialiasing (default: true)
   * @param options.alpha - Whether to enable alpha channel (default: false)
   * @param options.powerPreference - WebGL power preference (default: 'high-performance')
   * @param options.rendererBackend - Preferred renderer backend (default: 'webgpu')
   * @returns Promise resolving to object containing scene, camera, renderer, THREE instance, and backend used
   */
  static async createScene(
    options: {
      name?: string;
      backgroundColor?: number;
      fov?: number;
      near?: number;
      far?: number;
      cameraPosition?: [number, number, number];
      aspectRatio?: number;
      enableShadows?: boolean;
      antialias?: boolean;
      alpha?: boolean;
      powerPreference?: "default" | "high-performance" | "low-power";
      shadowMapType?: THREE.ShadowMapType;
      rendererBackend?: RendererBackend;
    } = {},
  ): Promise<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer | WebGPURenderer;
    three: typeof THREE;
    backendUsed: RendererBackend;
  }> {
    const {
      name = "Scene",
      backgroundColor = 0x000000,
      fov = 60,
      near = 1,
      far = 10000,
      cameraPosition = [0, 0, 30],
      aspectRatio = window.innerWidth / window.innerHeight,
      enableShadows = true,
      antialias = true,
      alpha = false,
      powerPreference = "high-performance",
      shadowMapType = THREE.PCFSoftShadowMap,
    } = options;

    // Create scene
    const scene = new THREE.Scene();
    scene.scale.set(1, 1, 1);
    scene.name = name;
    scene.castShadow = false;
    scene.receiveShadow = false;
    scene.background = new THREE.Color(backgroundColor);

    // Create camera
    const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    camera.position.set(...cameraPosition);

    // Determine renderer backend
    const preferredBackend = options.rendererBackend ?? "webgpu";
    const backendConfig = await WebGPUDetection.detectBackend(preferredBackend);
    let backendUsed = backendConfig.actual;

    // Create renderer based on detected backend
    let renderer: THREE.WebGLRenderer | WebGPURenderer;

    if (backendUsed === "webgpu") {
      // Create WebGPU renderer
      renderer = new WebGPURenderer({
        antialias,
        alpha,
        // Note: WebGPU doesn't use logarithmicDepthBuffer or powerPreference
      });

      // Initialize WebGPU renderer asynchronously (required!)
      try {
        await renderer.init();
        console.log("[SceneHelper] Using WebGPU renderer (initialized)");
      } catch (error) {
        console.warn(
          "[SceneHelper] WebGPU initialization failed, falling back to WebGL:",
          error,
        );
        // Fall back to WebGL if WebGPU init fails
        renderer = new THREE.WebGLRenderer({
          precision:
            options.powerPreference === "high-performance"
              ? "highp"
              : "mediump",
          logarithmicDepthBuffer: true,
          antialias,
          alpha,
          powerPreference,
        });
        backendUsed = "webgl";
        console.log("[SceneHelper] Using WebGL renderer (fallback)");
      }
    } else {
      // Create WebGL renderer (existing code)
      renderer = new THREE.WebGLRenderer({
        precision:
          options.powerPreference === "high-performance" ? "highp" : "mediump",
        logarithmicDepthBuffer: true,
        antialias,
        alpha,
        powerPreference,
      });
      console.log("[SceneHelper] Using WebGL renderer");
    }

    renderer.sortObjects = false; // Disable automatic sorting to prevent interference with our custom render order
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Configure shadows (only for WebGL, WebGPU handles differently)
    if (enableShadows && backendUsed === "webgl") {
      (renderer as THREE.WebGLRenderer).shadowMap.enabled = true;
      (renderer as THREE.WebGLRenderer).shadowMap.autoUpdate = true;
      (renderer as THREE.WebGLRenderer).shadowMap.type = shadowMapType;
    }

    return { scene, camera, renderer, three: THREE, backendUsed };
  }

  /**
   * Creates a basic scene with minimal configuration for quick prototyping.
   *
   * @returns Promise resolving to basic scene setup with default configuration
   */
  static async createBasicScene(): Promise<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer | WebGPURenderer;
    three: typeof THREE;
    backendUsed: RendererBackend;
  }> {
    return this.createScene({
      backgroundColor: 0x000000,
      fov: 60,
      near: 1,
      far: 10000,
      cameraPosition: [0, 0, 30],
      enableShadows: false,
      antialias: true,
    });
  }

  /**
   * Creates a scene optimized for space/astronomical visualization.
   *
   * @returns Promise resolving to scene setup optimized for space rendering
   */
  static async createSpaceScene(): Promise<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer | WebGPURenderer;
    three: typeof THREE;
    backendUsed: RendererBackend;
  }> {
    return this.createScene({
      backgroundColor: 0x000011, // Dark blue space background
      fov: 75, // Wider field of view for space scenes
      near: 0.1, // Closer near plane for detailed close-ups
      far: 100000, // Much farther far plane for astronomical distances
      cameraPosition: [0, 0, 50],
      enableShadows: true, // Higher resolution for space scenes
      antialias: true,
    });
  }

  /**
   * Creates a scene optimized for debugging and development.
   *
   * @returns Promise resolving to scene setup with debugging-friendly configuration
   */
  static async createDebugScene(): Promise<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer | WebGPURenderer;
    three: typeof THREE;
    backendUsed: RendererBackend;
  }> {
    return this.createScene({
      backgroundColor: 0x222222, // Dark gray for better contrast
      fov: 60,
      near: 0.1,
      far: 1000,
      cameraPosition: [10, 10, 10], // Angled view for better debugging
      enableShadows: false, // Disable shadows for faster rendering
      antialias: false, // Disable antialiasing for faster rendering
      powerPreference: "default", // Use default power preference for debugging
    });
  }

  /**
   * Sets up automatic window resize handling for the renderer and camera.
   *
   * @param renderer - The WebGL or WebGPU renderer
   * @param camera - The perspective camera
   * @param container - Optional container element (defaults to document.body)
   * @returns Function to remove the resize listener
   */
  static setupResizeHandler(
    renderer: THREE.WebGLRenderer | WebGPURenderer,
    camera: THREE.PerspectiveCamera,
    container: HTMLElement = document.body,
  ): () => void {
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    // Set initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }

  /**
   * Creates a simple animation loop for the scene.
   *
   * @param scene - The scene to render
   * @param camera - The camera to use
   * @param renderer - The WebGL or WebGPU renderer to use
   * @param onUpdate - Optional callback function called each frame
   * @returns Function to stop the animation loop
   */
  static createAnimationLoop(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer | WebGPURenderer,
    onUpdate?: (deltaTime: number) => void,
  ): () => void {
    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (onUpdate) {
        onUpdate(deltaTime);
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }
}
