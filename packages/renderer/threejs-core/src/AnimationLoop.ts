import { getSimulationState, setSimulationState } from "@teskooano/core-state";
import * as THREE from "three";

export interface RendererStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  memory?: { usedJSHeapSize?: number };
  camera?: {
    position?: { x: number; y: number; z: number };
    fov?: number;
  };
}

/**
 * Manages the animation and render loop for the scene
 */
export class AnimationLoop {
  private renderLoop: number | null = null;
  private clock: THREE.Clock;
  private onAnimateCallbacks: ((time: number, delta: number) => void)[] = [];
  private onRenderCallbacks: (() => void)[] = [];

  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.Camera | null = null;

  private fpsFrameCount = 0;
  private lastFPSUpdateTime = 0;
  private currentFPS = 0;
  private readonly fpsUpdateInterval = 0.5;

  private lastStatsUpdateTime = 0;
  private readonly statsUpdateInterval = 0.5;

  private lastDetailedStatsUpdateTime = 0;
  private readonly detailedStatsUpdateInterval = 2.0;

  /**
   * Create a new AnimationLoop
   */
  constructor() {
    this.clock = new THREE.Clock();
  }

  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.renderLoop === null) {
      this.clock.start();
      this.lastFPSUpdateTime = this.clock.getElapsedTime();
      this.lastStatsUpdateTime = this.clock.getElapsedTime();

      const animate = () => {
        this.renderLoop = requestAnimationFrame(animate);
        this.tick();
      };

      animate();
    }
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.renderLoop !== null) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
      this.clock.stop();
    }
  }

  /**
   * Add a callback to be called during animation update
   */
  onAnimate(callback: (time: number, delta: number) => void): void {
    this.onAnimateCallbacks.push(callback);
  }

  /**
   * Add a callback to be called during render
   */
  onRender(callback: () => void): void {
    this.onRenderCallbacks.push(callback);
  }

  /**
   * Remove an animation callback
   */
  removeAnimateCallback(callback: (time: number, delta: number) => void): void {
    const index = this.onAnimateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onAnimateCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove a render callback
   */
  removeRenderCallback(callback: () => void): void {
    const index = this.onRenderCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onRenderCallbacks.splice(index, 1);
    }
  }

  /**
   * Get the render callbacks array
   */
  getRenderCallbacks(): (() => void)[] {
    return this.onRenderCallbacks;
  }

  /**
   * Process one animation frame
   */
  public tick(): void {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    this.fpsFrameCount++;

    for (const callback of this.onAnimateCallbacks) {
      callback(time, delta);
    }

    for (const callback of this.onRenderCallbacks) {
      callback();
    }

    this.updateFPS(time);
    this.updateOtherStats(time);
  }

  private updateFPS(currentTime: number): void {
    const elapsedTime = currentTime - this.lastFPSUpdateTime;

    if (elapsedTime >= this.fpsUpdateInterval) {
      this.currentFPS = Math.round(this.fpsFrameCount / elapsedTime);
      this.fpsFrameCount = 0;
      this.lastFPSUpdateTime = currentTime;

      if (currentTime - this.lastStatsUpdateTime >= this.statsUpdateInterval) {
        this.updateSimulationStateStats();
      }
    }
  }

  private updateOtherStats(currentTime: number): void {
    const elapsedTime = currentTime - this.lastStatsUpdateTime;
    if (elapsedTime >= this.statsUpdateInterval) {
      this.lastStatsUpdateTime = currentTime;
      this.updateSimulationStateStats();
    }
  }

  private updateSimulationStateStats(): void {
    if (!this.renderer) {
      console.warn("AnimationLoop: Update aborted, renderer not set.");
      return;
    }

    try {
      const drawCalls = this.renderer.info.render.calls;
      const triangles = this.renderer.info.render.triangles;
      const memoryInfo = (window.performance as any)?.memory;
      const usedMemory = memoryInfo?.usedJSHeapSize;

      const currentState = getSimulationState();

      if (
        currentState.renderer?.fps !== this.currentFPS ||
        currentState.renderer?.drawCalls !== drawCalls ||
        currentState.renderer?.triangles !== triangles ||
        currentState.renderer?.memory?.usedJSHeapSize !== usedMemory
      ) {
        setSimulationState({
          ...currentState,
          renderer: {
            ...currentState.renderer,
            fps: this.currentFPS,
            drawCalls: drawCalls,
            triangles: triangles,
            memory: { usedJSHeapSize: usedMemory },
          },
        });
      } else {
      }
    } catch (error) {
      console.error(
        "AnimationLoop: Error collecting/updating renderer stats:",
        error,
      );
    }
  }

  /**
   * Get the time elapsed since the last frame
   */
  getDelta(): number {
    return this.clock.getDelta();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.onAnimateCallbacks = [];
    this.onRenderCallbacks = [];
  }

  public getCurrentStats(): RendererStats | null {
    if (!this.renderer) {
      return null;
    }
    try {
      const rendererInfo = this.renderer.info;
      const memoryInfo = (window.performance as any)?.memory;

      let cameraStats: { position?: THREE.Vector3; fov?: number } | undefined;
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
      console.error("AnimationLoop: Error getting current stats:", error);
      return null;
    }
  }
}
