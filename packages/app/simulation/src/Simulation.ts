import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

/**
 * Manages the overall simulation setup, primarily by initializing the renderer
 * and handling global events like window resizing.
 * The core physics and animation loop is handled separately in `loop.ts`.
 */
export class Simulation {
  /** The ThreeJS renderer instance */
  private renderer: ModularSpaceRenderer;

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
    window.addEventListener("resize", () => {
      this.renderer.onResize(window.innerWidth, window.innerHeight);
    });
  }
}
