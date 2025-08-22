import * as THREE from "three";
import {
  RenderingOrchestrator,
  InteractionOrchestrator,
  DebugOrchestrator,
} from "./orchestrators";

import { simulationOrchestrator } from "@teskooano/app-simulation";

/**
 * The main orchestrator for the Three.js rendering engine.
 *
 * This class acts as a facade, composing and managing orchestrators that group
 * related managers together. It provides a unified API for controlling the
 * entire rendering process while maintaining a clean, modular architecture.
 *
 * @example
 * const renderer = new ModularSpaceRenderer(containerElement, { antialias: true });
 * renderer.startRenderLoop();
 */
export class ModularSpaceRenderer {
  /** Orchestrates all rendering-related managers and operations. */
  public renderingOrchestrator: RenderingOrchestrator;
  /** Orchestrates all user interaction and interface-related managers. */
  public interactionOrchestrator: InteractionOrchestrator;
  /** Orchestrates debug and analysis tools. */
  public debugOrchestrator: DebugOrchestrator;

  private container?: HTMLElement;
  private resizeHandler?: () => void;

  /**
   * Initializes the renderer and all its subordinate orchestrators.
   *
   * @param container The HTML element that will host the renderer's canvas.
   */
  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize orchestrators in dependency order
    // 1. Initialize RenderingOrchestrator first (creates the main scene manager)
    this.renderingOrchestrator = new RenderingOrchestrator(container);

    // 2. Initialize InteractionOrchestrator (passes the entire RenderingOrchestrator)
    this.interactionOrchestrator = new InteractionOrchestrator(
      container,
      this.renderingOrchestrator,
    );

    // 3. Initialize DebugOrchestrator (needs scene manager from RenderingOrchestrator)
    this.debugOrchestrator = new DebugOrchestrator(
      this.renderingOrchestrator.sceneManager,
    );

    this.setupAnimationCallbacks();
  }

  /**
   * Defines the sequence of operations for each frame of the animation loop.
   * The order is critical for ensuring effects are based on the latest data.
   */
  private setupAnimationCallbacks(): void {
    // Register physics simulation callback first
    const physicsCallback = simulationOrchestrator.createPhysicsCallback();
    this.renderingOrchestrator.sceneManager.animationLoop.onPhysics(
      physicsCallback,
    );

    // Register rendering callback
    this.renderingOrchestrator.sceneManager.animationLoop.onAnimate(
      this.renderingOrchestrator.renderPipeline.update,
    );
  }

  /**
   * Gets the underlying Three.js scene instance.
   * @returns The scene object.
   */
  get scene(): THREE.Scene {
    return this.renderingOrchestrator.sceneManager.scene;
  }

  /**
   * Gets the active Three.js perspective camera instance.
   * @returns The camera object.
   */
  get camera(): THREE.PerspectiveCamera {
    return this.renderingOrchestrator.sceneManager.camera;
  }

  /**
   * Gets the underlying Three.js WebGL renderer instance.
   * @returns The renderer object.
   */
  get renderer(): THREE.WebGLRenderer {
    return this.renderingOrchestrator.sceneManager.renderer;
  }

  /**
   * Gets the associated OrbitControls instance.
   * @returns The controls instance.
   */
  get controls() {
    return this.interactionOrchestrator.getControlsManager().controls;
  }

  /**
   * Starts the rendering loop.
   */
  start(): void {
    this.renderingOrchestrator.sceneManager.start();
  }

  /**
   * Stops the rendering loop.
   */
  stop(): void {
    this.renderingOrchestrator.sceneManager.stop();
  }

  /**
   * Handles window resize events, updating camera aspect ratio and renderer size.
   * @param width - The new width of the viewport.
   * @param height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.renderingOrchestrator.sceneManager.onResize(width, height);
    this.interactionOrchestrator.onResize(width, height);
  }

  /**
   * Cleans up resources used by the renderer and its orchestrators.
   * Stops the animation loop and removes event listeners.
   */
  dispose(): void {
    console.log("[ModularSpaceRenderer] Disposing resources...");

    this.renderingOrchestrator.dispose();
    this.interactionOrchestrator.dispose();
    this.debugOrchestrator.dispose();

    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }

    // Nullify references to allow garbage collection
    (this.renderingOrchestrator as any) = null;
    (this.interactionOrchestrator as any) = null;
    (this.debugOrchestrator as any) = null;
    (this.container as any) = null;
    (this.resizeHandler as any) = null;

    console.log("[ModularSpaceRenderer] Disposal complete");
  }

  /**
   * Calculates the total number of triangles currently being rendered in the scene.
   * This is a costly operation and should only be used for debugging purposes.
   *
   * @returns The total triangle count.
   */
  public getTriangleCount(): number {
    return this.renderingOrchestrator.getTriangleCount();
  }

  /**
   * Sets the global debug mode for the renderer.
   * This enables various visual helpers and may impact performance.
   * Note: Forcing fallback meshes currently requires object recreation.
   *
   * @param enabled - If true, enables debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    this.renderingOrchestrator.setDebugMode(enabled);
    this.interactionOrchestrator.setDebugMode(enabled);
  }
}
