import { simulationStateService } from "@teskooano/core-state";
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

  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.Camera | null = null;

  // --- Stats-related properties ---
  private fpsFrameCount = 0;
  private lastFPSUpdateTime = 0;
  private currentFPS = 0;
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
  setCamera(camera: THREE.Camera): void {
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
   * Registers a callback to be executed on each frame, after all `onAnimate`
   * callbacks have completed.
   * These callbacks are intended for secondary logic that does not require
   * timing information (e.g., final rendering steps, UI updates).
   * @param callback The function to call.
   */
  onRender(callback: () => void): void {
    this.onRenderCallbacks.push(callback);
  }

  /**
   * Removes a previously registered `onAnimate` callback.
   * @param callback The exact callback function to remove.
   */
  removeAnimateCallback(callback: (time: number, delta: number) => void): void {
    const index = this.onAnimateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onAnimateCallbacks.splice(index, 1);
    }
  }

  /**
   * Removes a previously registered `onRender` callback.
   * @param callback The exact callback function to remove.
   */
  removeRenderCallback(callback: () => void): void {
    const index = this.onRenderCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onRenderCallbacks.splice(index, 1);
    }
  }

  /**
   * Gets the array of `onRender` callbacks.
   * @returns The array of render callbacks.
   * @internal Be cautious with this. Modifying the returned array directly
   * can lead to unexpected behavior. It is exposed for iteration purposes.
   */
  getRenderCallbacks(): (() => void)[] {
    return this.onRenderCallbacks;
  }

  /**
   * Collects statistics from the renderer and updates the global simulation state.
   */
  private updateSimulationStateStats(): void {
    if (!this.renderer) {
      return; // Can't collect stats without a renderer
    }

    try {
      const drawCalls = this.renderer.info.render.calls;
      const triangles = this.renderer.info.render.triangles;
      const memoryInfo = (performance as any)?.memory;
      const usedMemory = memoryInfo?.usedJSHeapSize;

      const currentState = simulationStateService.getCurrentState();
      const stats = this.getCurrentStats();

      // Avoid setting state if the values haven't changed
      if (
        stats &&
        currentState.renderer?.fps === stats.fps &&
        currentState.renderer?.drawCalls === stats.drawCalls &&
        currentState.renderer?.triangles === stats.triangles &&
        currentState.renderer?.memory?.usedJSHeapSize ===
          stats.memory?.usedJSHeapSize
      ) {
        return;
      }

      if (stats) {
        simulationStateService.setState({
          ...currentState,
          renderer: {
            ...currentState.renderer,
            ...stats,
          },
        });
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
      this.currentFPS = Math.round(
        (this.fpsFrameCount * 1000) / timeSinceLastFPSUpdate,
      );
      this.fpsFrameCount = 0;
      this.lastFPSUpdateTime = now;
    }

    if (now >= this.lastStatsUpdateTime + this.statsUpdateInterval * 1000) {
      this.lastStatsUpdateTime = now;
      this.updateSimulationStateStats();
    }
  }

  private animate = (): void => {
    this.renderLoopId = requestAnimationFrame(this.animate);
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    rendererEvents.beforeRender$.next({ deltaTime, elapsedTime });

    this._updateStats();

    for (const callback of this.onAnimateCallbacks) {
      callback(elapsedTime, deltaTime);
    }

    for (const callback of this.onRenderCallbacks) {
      callback();
    }

    rendererEvents.afterRender$.next({ deltaTime, elapsedTime });
  };
}
