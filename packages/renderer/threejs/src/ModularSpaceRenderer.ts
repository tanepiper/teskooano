import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import {
  AnimationLoop,
  DepthBufferDebugger,
  GridManager,
  SceneManager,
} from "@teskooano/renderer-threejs-core";
import {
  AuMarkerManager,
  CelestialLabelLayer,
  CSS2DLayerType,
  Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager } from "@teskooano/renderer-threejs-lod";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import * as THREE from "three";
import { RendererStateAdapter } from "./RendererStateAdapter";
import { RenderPipeline } from "./RenderPipeline";
import {
  RenderingOrchestrator,
  InteractionOrchestrator,
  DebugOrchestrator,
} from "./orchestrators";

import { simulationManager } from "@teskooano/app-simulation";
import { renderableStore } from "@teskooano/core-state";
import { LabelSystem } from "@teskooano/renderer-threejs-labels";

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

    // Initialize state adapter
    const stateAdapter = new RendererStateAdapter();

    // Initialize core scene manager
    const sceneManager = new SceneManager(container, {
      antialias: true,
    });

    // Initialize 2D layer manager
    const css2DManager = new Layer2DManager(sceneManager.scene, container);
    const celestialLayer = new CelestialLabelLayer(sceneManager.scene);
    css2DManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);

    // Initialize AU marker manager
    const auMarkerManager = new AuMarkerManager(
      sceneManager.scene,
      css2DManager,
    );
    auMarkerManager.createMarkers();

    // Initialize other managers
    const lightingManager = new LightingManager(sceneManager.scene);
    const lodManager = new LODManager(sceneManager.camera);
    const controlsManager = new ControlsManager(
      sceneManager.camera,
      sceneManager.renderer.domElement,
    );
    const gridManager = new GridManager(sceneManager.scene);

    // Initialize object manager
    const objectManager = new ObjectManager(
      sceneManager.scene,
      sceneManager.camera,
      renderableStore.renderableObjects$,
      sceneManager.renderer,
      css2DManager,
      undefined, // acceleration$ - use default
      lightingManager, // Pass the shared lighting manager
    );

    // Initialize orbit manager
    const orbitManager = new OrbitsManager(
      objectManager,
      stateAdapter,
      renderableStore.renderableObjects$,
      css2DManager,
      objectManager.getCelestialRenderers(),
    );

    // Initialize background manager
    const backgroundManager = new BackgroundManager(
      sceneManager.scene,
      sceneManager.camera,
    );
    backgroundManager.setCamera(sceneManager.camera);

    // Initialize render pipeline
    const renderPipeline = new RenderPipeline({
      sceneManager,
      controlsManager,
      orbitManager,
      objectManager,
      backgroundManager,
      lightingManager,
      lodManager,
      gridManager,
      css2DManager,
    });

    // Initialize debug tools
    const depthDebugger = new DepthBufferDebugger(sceneManager);

    // Make debugger accessible globally during development
    if (typeof window !== "undefined") {
      if ((window as any).teskooano) {
        (window as any).teskooano.debugger = depthDebugger;
      } else {
        (window as any).teskooano = {
          debugger: depthDebugger,
        };
      }
    }

    // Initialize orchestrators
    this.renderingOrchestrator = new RenderingOrchestrator(
      sceneManager,
      objectManager,
      orbitManager,
      backgroundManager,
      lightingManager,
      lodManager,
      gridManager,
      stateAdapter,
      renderPipeline,
    );

    this.interactionOrchestrator = new InteractionOrchestrator(
      controlsManager,
      css2DManager,
      auMarkerManager,
    );

    this.debugOrchestrator = new DebugOrchestrator(depthDebugger);

    this.setupAnimationCallbacks();
  }

  /**
   * Defines the sequence of operations for each frame of the animation loop.
   * The order is critical for ensuring effects are based on the latest data.
   */
  private setupAnimationCallbacks(): void {
    // Register physics simulation callback first
    const physicsCallback = simulationManager.createPhysicsCallback();
    this.renderingOrchestrator
      .getSceneManager()
      .animationLoop.onPhysics(physicsCallback);

    // Register rendering callback
    this.renderingOrchestrator
      .getSceneManager()
      .animationLoop.onAnimate(
        this.renderingOrchestrator.getRenderPipeline().update,
      );
  }

  /**
   * Gets the underlying Three.js scene instance.
   * @returns The scene object.
   */
  get scene(): THREE.Scene {
    return this.renderingOrchestrator.getSceneManager().scene;
  }

  /**
   * Gets the active Three.js perspective camera instance.
   * @returns The camera object.
   */
  get camera(): THREE.PerspectiveCamera {
    return this.renderingOrchestrator.getSceneManager().camera;
  }

  /**
   * Gets the underlying Three.js WebGL renderer instance.
   * @returns The renderer object.
   */
  get renderer(): THREE.WebGLRenderer {
    return this.renderingOrchestrator.getSceneManager().renderer;
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
    this.renderingOrchestrator.getSceneManager().start();
  }

  /**
   * Stops the rendering loop.
   */
  stop(): void {
    this.renderingOrchestrator.getSceneManager().stop();
  }

  /**
   * Handles window resize events, updating camera aspect ratio and renderer size.
   * @param width - The new width of the viewport.
   * @param height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.renderingOrchestrator.getSceneManager().onResize(width, height);
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

  /**
   * Highlights prediction lines for a specific object, hiding all others.
   * @param objectId - ID of the object to show prediction for, or null to hide all
   */
  public highlightPrediction(objectId: string | null): void {
    this.renderingOrchestrator.highlightPrediction(objectId);
  }

  /**
   * Runs a comprehensive depth buffer analysis and logs results to console.
   * Use this to debug occlusion and depth sorting issues.
   *
   * @example
   * ```javascript
   * // In browser console:
   * renderer.runDepthAnalysis();
   * ```
   */
  public runDepthAnalysis(): void {
    this.debugOrchestrator.runDepthAnalysis();
  }
}
