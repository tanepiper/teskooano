import { OSVector3 } from "@teskooano/core-math";
import type { BackgroundManager } from "@teskooano/renderer-threejs-background";
import type { ControlsManager } from "@teskooano/renderer-threejs-controls";
import type {
  GridManager,
  SceneManager,
} from "@teskooano/renderer-threejs-core";
import type { Layer2DManager } from "@teskooano/renderer-threejs-labels";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import * as THREE from "three";
import type { RenderPipelineOptions } from "./types";
import { Subject } from "rxjs";

/**
 * Payload for render pipeline stage events.
 */
export interface RenderPipelineStagePayload {
  /** Time elapsed since the last frame, in seconds. */
  deltaTime: number;
  /** Total time elapsed since the loop started, in seconds. */
  elapsedTime: number;
  /** The current frame number. */
  frameCount: number;
}

/**
 * Event bus for render pipeline stages.
 * Allows other components to react to specific stages of the rendering pipeline.
 */
export const renderPipelineEvents = {
  /** Fires before any updates begin. */
  beforeUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after controls and camera are updated. */
  afterControlsUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after orbital paths are updated. */
  afterOrbitsUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after 3D objects are updated. */
  afterObjectsUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after background is updated. */
  afterBackgroundUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after grid is updated. */
  afterGridUpdate$: new Subject<RenderPipelineStagePayload>(),
  /** Fires before the main scene render. */
  beforeRender$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after the main scene render. */
  afterRender$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after 2D overlays are rendered. */
  afterOverlaysRender$: new Subject<RenderPipelineStagePayload>(),
  /** Fires after all updates and rendering are complete. */
  afterUpdate$: new Subject<RenderPipelineStagePayload>(),
};

/**
 * Orchestrates the sequence of updates for each frame in the rendering loop.
 *
 * This class encapsulates the logic for the order in which different parts
 * of the scene are updated, ensuring that dependencies are met (e.g., camera
 * is updated before LODs are calculated).
 *
 * The pipeline emits events at each stage, allowing other components to react
 * to specific phases of the rendering process.
 */
export class RenderPipeline {
  private sceneManager: SceneManager;
  private controlsManager: ControlsManager;
  private orbitManager: OrbitsManager;
  private objectManager: ObjectManager;
  private backgroundManager: BackgroundManager;
  private lightingManager: LightingManager;

  private gridManager: GridManager;
  private css2DManager: Layer2DManager;

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

  private origin: OSVector3 = new OSVector3(0, 0, 0);

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
    this.gridManager = managers.gridManager;
    this.css2DManager = managers.css2DManager;

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
   * 6. Perform the main scene render FIRST.
   * 7. Render 2D overlays (CSS2D) AFTER the main render to ensure proper depth isolation.
   * 8. Run custom callbacks.
   *
   * @param deltaTime The time elapsed since the last frame, in seconds.
   * @param elapsedTime The total time elapsed since the loop started, in seconds.
   */
  public update = (deltaTime: number, elapsedTime: number): void => {
    this.frameCount++;

    const payload: RenderPipelineStagePayload = {
      deltaTime,
      elapsedTime,
      frameCount: this.frameCount,
    };

    // Emit before update event
    renderPipelineEvents.beforeUpdate$.next(payload);

    // Attach renderer height to camera for dynamic calculations (e.g., point sizes)
    // Use cached height to avoid expensive DOM access every frame
    (this.camera as any).rendererHeight = this.getRendererHeight();

    // 1. Update controls and camera position first.
    this.controlsManager.update(deltaTime);
    renderPipelineEvents.afterControlsUpdate$.next(payload);

    // 2. Update orbital paths.
    this.orbitManager.updateAllVisualizations(deltaTime);
    renderPipelineEvents.afterOrbitsUpdate$.next(payload);

    // 3. Update 3D objects (position, rotation, materials).
    // Note: ObjectManager.update() already calls lodManager.update() internally
    this.objectManager.update(this.renderer, this.scene, this.camera);
    renderPipelineEvents.afterObjectsUpdate$.next(payload);

    // 4. Update the background, which may have a parallax effect based on camera position.
    // Throttle background updates for performance
    // if (this.frameCount % this.BACKGROUND_UPDATE_FREQUENCY === 0) {
    //   this.backgroundManager.update(deltaTime);
    // }
    renderPipelineEvents.afterBackgroundUpdate$.next(payload);

    // 5. Update grid helper based on camera position - throttled for performance.
    if (this.frameCount % this.GRID_UPDATE_FREQUENCY === 0) {
      this.gridManager.update(this.camera);
    }
    renderPipelineEvents.afterGridUpdate$.next(payload);

    // 6. Perform the main scene render FIRST to establish proper depth buffer.
    renderPipelineEvents.beforeRender$.next(payload);
    this.sceneManager.render();
    renderPipelineEvents.afterRender$.next(payload);

    // 7. Render the 2D overlay AFTER the main render to ensure proper depth isolation.
    // AU markers are positioned relative to origin (0,0,0), not a moving central body
    this.css2DManager.update(this.camera, this.objectManager);
    this.css2DManager.render(this.camera);
    renderPipelineEvents.afterOverlaysRender$.next(payload);

    // 8. Run any custom render callbacks injected into the loop.
    // Optimize callback execution by getting the array once
    const callbacks = this.sceneManager.animationLoop.getRenderCallbacks();
    if (callbacks.length > 0) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i]();
      }
    }

    // Emit after update event
    renderPipelineEvents.afterUpdate$.next(payload);
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
