import * as THREE from "three";
import {
  RenderingOrchestrator,
  InteractionOrchestrator,
  DebugOrchestrator,
} from "./orchestrators";
import { RendererContainer } from "./services/RendererContainer";
import type { RendererServices } from "./services/RendererServiceContainer";
import { SystemEventBridge, CelestialEventBridge } from "@teskooano/core-state";
import { simulationOrchestrator } from "@teskooano/app-simulation";

/**
 * The main orchestrator for the Three.js rendering engine.
 *
 * This class acts as a facade, composing and managing orchestrators that group
 * related managers together. It provides a unified API for controlling the
 * entire rendering process while maintaining a clean, modular architecture.
 *
 * **Constructor Injection Architecture:**
 *
 * This renderer now uses constructor injection to eliminate circular dependencies
 * and provide clear service boundaries. All services are created through the
 * RendererServiceContainer which manages both shared and panel-specific services.
 *
 * @example
 * const renderer = new ModularSpaceRenderer(containerElement);
 * renderer.start();
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
  private diContainer: RendererContainer;
  private services: RendererServices; // Store services reference for proper disposal
  private panelId: string;

  /**
   * Initializes the renderer and all its subordinate orchestrators.
   * Uses constructor injection to eliminate circular dependencies.
   *
   * @param container The HTML element that will host the renderer's canvas.
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.diContainer = RendererContainer.getInstance();
    this.panelId = `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create all services through the DI container
    this.services = this.diContainer.createPanelServices(
      container,
      this.panelId,
    );

    // Initialize orchestrators with injected services
    // No more circular dependencies - all services are created upfront
    this.renderingOrchestrator = new RenderingOrchestrator(this.services);
    this.interactionOrchestrator = new InteractionOrchestrator(this.services);
    this.debugOrchestrator = new DebugOrchestrator(this.services.sceneManager);

    // Initialize event bridge to connect DOM events to RxJS events
    // Initialize event bridges
    SystemEventBridge.getInstance().initialize();
    CelestialEventBridge.getInstance().initialize();

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
   * Now uses the service container for proper resource management.
   */
  dispose(): void {
    console.log("[ModularSpaceRenderer] Disposing resources...");

    // Dispose orchestrators (they no longer manage their own disposal)
    this.renderingOrchestrator.dispose();
    this.interactionOrchestrator.dispose();
    this.debugOrchestrator.dispose();

    // Dispose panel-specific services through the DI container
    this.diContainer.disposeScope(this.panelId);

    // Dispose event bridge
    // Dispose event bridges
    SystemEventBridge.getInstance().dispose();
    CelestialEventBridge.getInstance().dispose();

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
