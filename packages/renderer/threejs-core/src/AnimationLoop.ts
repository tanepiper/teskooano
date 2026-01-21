import * as THREE from "three";
import { rendererEvents } from "./events";

/**
 * Defines the structure for the renderer statistics object.
 */
export interface RendererStats {
  /** The current frames per second. */
  fps: number;
  /** The number of draw calls in the last rendered frame. */
  drawCalls: number;
  /** The number of triangles in the last rendered frame. */
  triangles: number;
  /** Browser memory usage statistics. */
  memory?: { usedJSHeapSize?: number };
  /** Information about the camera state. */
  camera?: {
    position?: { x: number; y: number; z: number };
    fov?: number;
  };
}

/**
 * Manages the core `requestAnimationFrame` loop, tracks time, executes callbacks,
 * and reports performance statistics to the global state. This class is the
 * heartbeat of the rendering engine.
 *
 * @example
 * const animationLoop = new AnimationLoop();
 * animationLoop.setRenderer(renderer);
 * animationLoop.setCamera(camera);
 *
 * // Register a function to be called every frame
 * animationLoop.onAnimate((time, delta) => {
 *   console.log(`Time: ${time}, Delta: ${delta}`);
 * });
 *
 * animationLoop.start();
 */
export class AnimationLoop {
  private renderLoopId: number | null = null;
  private clock: THREE.Clock;
  private onAnimateCallbacks: ((time: number, delta: number) => void)[] = [];
  private onRenderCallbacks: (() => void)[] = [];
  private onPhysicsCallbacks: ((time: number, delta: number) => void)[] = [];

  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // --- Stats-related properties ---
  private fpsFrameCount = 0;
  private lastFPSUpdateTime = 0;
  private currentFPS = 60; // Initialize to expected FPS instead of 0
  private lastStatsUpdateTime = 0;
  private readonly statsUpdateInterval = 0.5; // Update stats every 500ms

  /**
   * Creates a new AnimationLoop instance.
   */
  constructor() {
    this.clock = new THREE.Clock();
  }

  /**
   * Sets the `WebGLRenderer` instance for the loop.
   * This is required for collecting performance statistics.
   * @param renderer The main Three.js renderer.
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Sets the `Camera` instance for the loop.
   * This is required for collecting camera statistics.
   * @param camera The main Three.js camera.
   */
  setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * Starts the animation loop if it is not already running.
   */
  start(): void {
    if (this.renderLoopId === null) {
      this.clock.start();
      this.lastFPSUpdateTime = performance.now();
      this.lastStatsUpdateTime = performance.now();
      this.animate();
    }
  }

  /**
   * Stops the animation loop if it is running.
   */
  stop(): void {
    if (this.renderLoopId !== null) {
      cancelAnimationFrame(this.renderLoopId);
      this.renderLoopId = null;
      this.clock.stop();
    }
  }

  /**
   * Registers a callback to be executed on each frame.
   * These callbacks are executed first and receive the elapsed time and delta.
   * They are intended for primary update logic (e.g., physics, controls).
   * @param callback The function to call, which receives `time` and `delta`.
   */
  onAnimate(callback: (time: number, delta: number) => void): void {
    this.onAnimateCallbacks.push(callback);
  }

  /**
   * Registers a callback to be executed for physics simulation.
   * These callbacks are executed before animation callbacks and are intended
   * for physics calculations that need to happen before rendering updates.
   * @param callback The function to call, which receives `time` and `delta`.
   */
  onPhysics(callback: (time: number, delta: number) => void): void {
    this.onPhysicsCallbacks.push(callback);
  }

  /**
   * Registers a callback to be executed after all other updates.
   * These callbacks are executed last and are intended for final rendering operations.
   * @param callback The function to call.
   */
  onRender(callback: () => void): void {
    this.onRenderCallbacks.push(callback);
  }

  /**
   * Removes a previously registered animation callback.
   * @param callback The callback to remove.
   */
  removeAnimateCallback(callback: (time: number, delta: number) => void): void {
    const index = this.onAnimateCallbacks.indexOf(callback);
    if (index > -1) {
      this.onAnimateCallbacks.splice(index, 1);
    }
  }

  /**
   * Removes a previously registered physics callback.
   * @param callback The callback to remove.
   */
  removePhysicsCallback(callback: (time: number, delta: number) => void): void {
    const index = this.onPhysicsCallbacks.indexOf(callback);
    if (index > -1) {
      this.onPhysicsCallbacks.splice(index, 1);
    }
  }

  /**
   * Removes a previously registered render callback.
   * @param callback The callback to remove.
   */
  removeRenderCallback(callback: () => void): void {
    const index = this.onRenderCallbacks.indexOf(callback);
    if (index > -1) {
      this.onRenderCallbacks.splice(index, 1);
    }
  }

  /**
   * Returns the current array of render callbacks.
   * @returns Array of render callbacks.
   */
  getRenderCallbacks(): (() => void)[] {
    return [...this.onRenderCallbacks];
  }

  /**
   * Returns the current array of physics callbacks.
   * @returns Array of physics callbacks.
   */
  getPhysicsCallbacks(): ((time: number, delta: number) => void)[] {
    return [...this.onPhysicsCallbacks];
  }

  /**
   * Gets performance statistics for the animation loop.
   * @returns Performance statistics object
   */
  getPerformanceStats(): {
    fps: number;
    physicsCallbacks: number;
    animationCallbacks: number;
    renderCallbacks: number;
    isRunning: boolean;
  } {
    return {
      fps: this.currentFPS,
      physicsCallbacks: this.onPhysicsCallbacks.length,
      animationCallbacks: this.onAnimateCallbacks.length,
      renderCallbacks: this.onRenderCallbacks.length,
      isRunning: this.renderLoopId !== null,
    };
  }

  /**
   * Collects statistics from the renderer and updates the global simulation state.
   */
  private updateSimulationStateStats(): void {
    if (!this.renderer) {
      return; // Can't collect stats without a renderer
    }

    try {
      const stats = this.getCurrentStats();

      if (stats) {
        rendererEvents.statsUpdated$.next(stats);
      }
    } catch (error) {
      console.error(
        "[AnimationLoop] Error collecting/updating renderer stats:",
        error,
      );
    }
  }

  /**
   * Retrieves an object containing the current performance statistics.
   * @returns A `RendererStats` object, or `null` if the renderer is not set.
   */
  public getCurrentStats(): RendererStats | null {
    if (!this.renderer) {
      return null;
    }
    try {
      const rendererInfo = this.renderer.info;
      const memoryInfo = (performance as any)?.memory;

      let cameraStats: RendererStats["camera"];
      if (this.camera) {
        cameraStats = {
          position: this.camera.position.clone(),
          fov:
            this.camera instanceof THREE.PerspectiveCamera
              ? this.camera.fov
              : undefined,
        };
      }

      return {
        fps: this.currentFPS,
        drawCalls: rendererInfo.render.calls,
        triangles: rendererInfo.render.triangles,
        memory: { usedJSHeapSize: memoryInfo?.usedJSHeapSize },
        camera: cameraStats,
      };
    } catch (error) {
      console.error("[AnimationLoop] Error getting current stats:", error);
      return null;
    }
  }

  private _updateStats(): void {
    this.fpsFrameCount++;
    const now = performance.now();

    const timeSinceLastFPSUpdate = now - this.lastFPSUpdateTime;
    if (timeSinceLastFPSUpdate >= this.statsUpdateInterval * 1000) {
      // Only calculate FPS if we have meaningful data (avoid division by very small numbers)
      if (this.fpsFrameCount > 0 && timeSinceLastFPSUpdate > 0) {
        const calculatedFPS = Math.round(
          (this.fpsFrameCount * 1000) / timeSinceLastFPSUpdate,
        );
        // Ensure FPS is never 0 (use last known value if calculation fails)
        if (calculatedFPS > 0) {
          this.currentFPS = calculatedFPS;
        }
      }
      this.fpsFrameCount = 0;
      this.lastFPSUpdateTime = now;

      // Update stats immediately after FPS calculation for responsive UI
      this.updateSimulationStateStats();
    }
  }

  private animate = (): void => {
    this.renderLoopId = requestAnimationFrame(this.animate);
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this._updateStats();

    // Execute physics callbacks first (simulation updates)
    for (const callback of this.onPhysicsCallbacks) {
      callback(elapsedTime, deltaTime);
    }

    // Execute animation callbacks (rendering updates)
    for (const callback of this.onAnimateCallbacks) {
      callback(elapsedTime, deltaTime);
    }

    // Execute render callbacks last (final rendering operations)
    for (const callback of this.onRenderCallbacks) {
      callback();
    }
  };
}
