import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

/**
 * Service to manage the THREE.CSS2DRenderer instance.
 * It handles the initialization, styling, and rendering calls for the CSS2D overlay.
 */
export class CSS2DRendererService {
  private static instance: CSS2DRendererService;
  private renderer: CSS2DRenderer;
  private container: HTMLElement | null = null;

  private constructor() {
    this.renderer = new CSS2DRenderer();
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.zIndex = "1"; // Ensure it's above the main canvas
    this.renderer.domElement.style.pointerEvents = "none"; // Default to no pointer events

    // Add class for global styling and ensure children also don't intercept pointer events
    if (this.renderer.domElement instanceof HTMLElement) {
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .css2d-renderer,
        .css2d-renderer * {
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(styleElement);
      this.renderer.domElement.classList.add("css2d-renderer");
    }
  }

  /**
   * Get the singleton instance of the CSS2DRendererService.
   */
  public static getInstance(): CSS2DRendererService {
    if (!CSS2DRendererService.instance) {
      CSS2DRendererService.instance = new CSS2DRendererService();
    }
    return CSS2DRendererService.instance;
  }

  /**
   * Initializes the renderer service with the parent container and sets its size.
   * This must be called once before the service can be used.
   * @param container - The HTMLElement to append the renderer's DOM element to.
   */
  public initialize(container: HTMLElement): void {
    // If the renderer's DOM element is already parented and that parent is not the new container, remove it.
    if (
      this.renderer.domElement.parentNode &&
      this.renderer.domElement.parentNode !== container
    ) {
      (this.renderer.domElement.parentNode as HTMLElement).removeChild(
        this.renderer.domElement,
      );
    }

    this.container = container; // Update internal reference

    // Append to the new container if it's not already the parent.
    // This ensures it's added if it was never parented or was removed from a different parent.
    if (this.renderer.domElement.parentNode !== this.container) {
      this.container.appendChild(this.renderer.domElement);
    }

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
  }

  /**
   * Renders the CSS2D scene with the given camera.
   * Should be called in the main animation loop.
   * @param scene - The THREE.Scene to render.
   * @param camera - The THREE.Camera to render with.
   */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.container) {
      console.warn(
        "[CSS2DRendererService] Renderer not initialized. Call initialize() first.",
      );
      return;
    }
    try {
      this.renderer.render(scene, camera);
    } catch (e) {
      console.error(
        "[CSS2DRendererService] Error during internal CSS2DRenderer.render call:",
        e,
      );
    }
  }

  /**
   * Handles resize events for the renderer.
   * @param width - The new width.
   * @param height - The new height.
   */
  public onResize(width: number, height: number): void {
    if (!this.container) return;
    this.renderer.setSize(width, height);
  }

  /**
   * Cleans up resources used by the renderer.
   * Removes the renderer's DOM element from the container.
   */
  public dispose(): void {
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.container = null;
    // Potentially remove the singleton instance if re-initialization is needed
    // delete CSS2DRendererService.instance;
  }

  /**
   * Gets the DOM element of the CSS2D renderer.
   */
  public getDomElement(): HTMLElement {
    return this.renderer.domElement;
  }
}
