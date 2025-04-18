import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { startSimulationLoop, stopSimulationLoop } from "./loop";
// Export simulation utilities
export * from "./loop";
export * from "./resetSystem";
export * from "./solarSystem";

/**
 * Manages the overall simulation setup, primarily by initializing the renderer
 * and handling global events like window resizing.
 * The core physics and animation loop is handled separately in `loop.ts`.
 */
export class Simulation {
  /** The ThreeJS renderer instance */
  private renderer: ModularSpaceRenderer;
  // Removed unused properties: lastTime, animationFrameId

  /**
   * Creates an instance of Simulation.
   * @param container The HTML element to host the renderer canvas.
   */
  constructor(container: HTMLElement) {
    this.renderer = new ModularSpaceRenderer(container);
    this.setupEventListeners();
  }

  /**
   * Sets up global event listeners, such as window resize.
   * @private
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener("resize", () => {
      this.renderer.onResize(window.innerWidth, window.innerHeight);
    });
  }
}

// Export the simulation class as default
export default Simulation;

// Cleaned up exports - toolbar component exported above
// export { SimulationControlsComponent, startSimulationLoop, stopSimulationLoop };
export { startSimulationLoop, stopSimulationLoop };
