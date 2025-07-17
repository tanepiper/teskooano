import type { BackgroundManager } from "@teskooano/renderer-threejs-background";
import type { ControlsManager } from "@teskooano/renderer-threejs-controls";
import type {
  AnimationLoop,
  SceneManager,
  GridManager,
} from "@teskooano/renderer-threejs-core";
import type { Layer2DManager } from "@teskooano/renderer-threejs-labels";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODManager } from "@teskooano/renderer-threejs-lod";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";
import type { RenderPipelineOptions } from "./types";

/**
 * Orchestrates the sequence of updates for each frame in the rendering loop.
 *
 * This class encapsulates the logic for the order in which different parts
 * of the scene are updated, ensuring that dependencies are met (e.g., camera
 * is updated before LODs are calculated).
 */
export class RenderPipeline {
  private sceneManager: SceneManager;
  private controlsManager: ControlsManager;
  private orbitManager: OrbitsManager;
  private objectManager: ObjectManager;
  private backgroundManager: BackgroundManager;
  private lightingManager: LightingManager;
  private lodManager: LODManager;
  private gridManager: GridManager;
  private css2DManager: Layer2DManager;
  private animationLoop: AnimationLoop;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  // Performance optimization: cache expensive values
  private cachedRendererHeight: number = 0;
  private lastHeightCheck: number = 0;
  private readonly HEIGHT_CHECK_INTERVAL = 1000; // Check height every 1 second

  // Throttling for expensive operations
  private frameCount: number = 0;
  private readonly GRID_UPDATE_FREQUENCY = 10; // Update grid every 10 frames
  private readonly BACKGROUND_UPDATE_FREQUENCY = 5; // Update background every 5 frames

  private frameId: number | null = null;

  /**
   * Creates an instance of RenderPipeline.
   * @param managers An object containing all the manager instances required for the pipeline.
   */
  constructor(managers: RenderPipelineOptions) {
    this.sceneManager = managers.sceneManager;
    this.controlsManager = managers.controlsManager;
    this.orbitManager = managers.orbitManager;
    this.objectManager = managers.objectManager;
    this.backgroundManager = managers.backgroundManager;
    this.lightingManager = managers.lightingManager;
    this.lodManager = managers.lodManager;
    this.gridManager = managers.gridManager;
    this.css2DManager = managers.css2DManager;
    this.animationLoop = managers.animationLoop;

    // Cache core three.js objects
    this.camera = this.sceneManager.camera;
    this.renderer = this.sceneManager.renderer;
    this.scene = this.sceneManager.scene;

    // Initialize cached height
    this.cachedRendererHeight = this.renderer.domElement.clientHeight;
  }

  /**
   * Gets the renderer height with caching to avoid expensive DOM access.
   * @returns The cached renderer height.
   */
  private getRendererHeight(): number {
    const now = performance.now();
    if (now - this.lastHeightCheck > this.HEIGHT_CHECK_INTERVAL) {
      this.cachedRendererHeight = this.renderer.domElement.clientHeight;
      this.lastHeightCheck = now;
    }
    return this.cachedRendererHeight;
  }

  /**
   * Executes a single frame update of the rendering pipeline.
   *
   * The order of operations is critical:
   * 1. Update controls and camera position.
   * 2. Update orbital paths.
   * 3. Update 3D objects (position, rotation, materials).
   * 4. Update the background (parallax effect) - throttled.
   * 5. Update grid helper based on camera position - throttled.
   * 6. Render 2D overlays (CSS2D).
   * 7. Run custom callbacks.
   * 8. Perform the main scene render.
   *
   * @param deltaTime The time elapsed since the last frame, in seconds.
   * @param elapsedTime The total time elapsed since the loop started, in seconds.
   */
  public update = (deltaTime: number, elapsedTime: number): void => {
    this.frameCount++;

    // Attach renderer height to camera for dynamic calculations (e.g., point sizes)
    // Use cached height to avoid expensive DOM access every frame
    (this.camera as any).rendererHeight = this.getRendererHeight();

    // 1. Update controls and camera position first.
    this.controlsManager.update(deltaTime);

    // 2. Update orbital paths.
    this.orbitManager.updateAllVisualizations(deltaTime);

    // 3. Update 3D objects (position, rotation, materials).
    // Note: ObjectManager.update() already calls lodManager.update() internally
    this.objectManager.update(this.renderer, this.scene, this.camera);

    // 4. Update the background, which may have a parallax effect based on camera position.
    // Throttle background updates for performance
    if (this.frameCount % this.BACKGROUND_UPDATE_FREQUENCY === 0) {
      this.backgroundManager.update(deltaTime);
    }

    // 5. Update grid helper based on camera position - throttled for performance.
    if (this.frameCount % this.GRID_UPDATE_FREQUENCY === 0) {
      this.gridManager.update(this.camera);
    }

    // 6. Render the 2D overlay, which depends on final 3D positions.
    // AU markers are positioned relative to origin (0,0,0), not a moving central body
    const origin = new OSVector3(0, 0, 0);
    this.css2DManager.update(this.camera, origin, this.objectManager);
    this.css2DManager.render(this.camera);

    // 7. Run any custom render callbacks injected into the loop.
    // Optimize callback execution by getting the array once
    const callbacks = this.animationLoop.getRenderCallbacks();
    if (callbacks.length > 0) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i]();
      }
    }

    // 8. Perform the main scene render.
    this.sceneManager.render();
  };

  /**
   * Stops the render pipeline update loop.
   */
  public stop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
}
