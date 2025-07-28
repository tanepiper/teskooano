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
import type { ModularSpaceRendererOptions } from "./types";

import { simulationManager } from "@teskooano/app-simulation";
import { renderableStore } from "@teskooano/core-state";
import { LabelSystem } from "@teskooano/renderer-threejs-labels";

/**
 * The main orchestrator for the Three.js rendering engine.
 *
 * This class acts as a facade, composing and managing a suite of specialized
 * managers to handle different aspects of the 3D scene, such as objects,
 * lighting, controls, and background rendering. It provides a unified API
 * for controlling the entire rendering process.
 *
 * @example
 * const renderer = new ModularSpaceRenderer(containerElement, { antialias: true });
 * renderer.startRenderLoop();
 */
export class ModularSpaceRenderer {
  /** Manages the core THREE.Scene, camera, and renderer instances. */
  public sceneManager: SceneManager;

  /** Manages the lifecycle of celestial `THREE.Object3D` instances. */
  public objectManager: ObjectManager;
  /** Manages the visualization of orbital paths. */
  public orbitManager: OrbitsManager;
  /** Manages the skybox and distant starfield. */
  public backgroundManager: BackgroundManager;

  /** Manages user interaction and camera controls (e.g., OrbitControls). */
  public controlsManager: ControlsManager;
  /** Manages the 2D HTML labels overlaid on the 3D scene. */
  public css2DManager: Layer2DManager;

  /** Manages scene lighting, including star-based light sources. */
  public lightingManager: LightingManager;
  /** Manages Level of Detail for objects to optimize performance. */
  public lodManager: LODManager;
  /** Manages the AU distance markers (rings and labels). */
  public auMarkerManager?: AuMarkerManager;
  /** Manages the grid helper for spatial reference. */
  public gridManager: GridManager;

  /** Bridges core application state to the renderer-consumable `renderableStore`. */
  public stateAdapter: RendererStateAdapter;
  /** Orchestrates the per-frame update sequence. */
  public renderPipeline: RenderPipeline;

  /** Debug tool for analyzing depth buffer and material issues. */
  public depthDebugger: DepthBufferDebugger;

  private container?: HTMLElement;
  private resizeHandler?: () => void;

  /**
   * Initializes the renderer and all its subordinate managers.
   *
   * @param container The HTML element that will host the renderer's canvas.
   * @param sceneManager The pre-initialized SceneManager.
   * @param options Configuration options for the renderer.
   * @param labelSystem The optional LabelSystem.
   */
  constructor(container: HTMLElement) {
    this.stateAdapter = new RendererStateAdapter();

    this.sceneManager = new SceneManager(container, {
      antialias: true,
    });

    const css2DManager = new Layer2DManager(this.sceneManager.scene, container);

    const celestialLayer = new CelestialLabelLayer(this.sceneManager.scene);
    css2DManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);

    const auMarkerManager = new AuMarkerManager(
      this.sceneManager.scene,
      css2DManager,
    );
    auMarkerManager.createMarkers();

    this.css2DManager = css2DManager;
    this.auMarkerManager = auMarkerManager;

    this.lightingManager = new LightingManager(this.sceneManager.scene);
    this.lodManager = new LODManager(this.sceneManager.camera);

    this.controlsManager = new ControlsManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    );

    this.objectManager = new ObjectManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      renderableStore.renderableObjects$,
      this.sceneManager.renderer,
      this.css2DManager,
      undefined, // acceleration$ - use default
      this.lightingManager, // Pass the shared lighting manager
    );

    this.orbitManager = new OrbitsManager(
      this.objectManager,
      this.stateAdapter,
      renderableStore.renderableObjects$,
      this.css2DManager,
      this.objectManager.getCelestialRenderers(),
    );

    this.backgroundManager = new BackgroundManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
    );
    this.backgroundManager.setCamera(this.sceneManager.camera);

    // Initialize grid manager with visibility from options
    this.gridManager = new GridManager(this.sceneManager.scene);

    this.renderPipeline = new RenderPipeline({
      sceneManager: this.sceneManager,
      controlsManager: this.controlsManager,
      orbitManager: this.orbitManager,
      objectManager: this.objectManager,
      backgroundManager: this.backgroundManager,
      lightingManager: this.lightingManager,
      lodManager: this.lodManager,
      gridManager: this.gridManager,
      css2DManager: this.css2DManager,
    });

    // Initialize depth buffer debugger
    this.depthDebugger = new DepthBufferDebugger(this.sceneManager);

    // Make debugger accessible globally during development
    if (typeof window !== "undefined") {
      if ((window as any).teskooano) {
        (window as any).teskooano.debugger = this.depthDebugger;
      } else {
        (window as any).teskooano = {
          debugger: this.depthDebugger,
        };
      }
    }

    this.setupAnimationCallbacks();
  }

  /**
   * Defines the sequence of operations for each frame of the animation loop.
   * The order is critical for ensuring effects are based on the latest data.
   */
  private setupAnimationCallbacks(): void {
    // Register physics simulation callback first
    const physicsCallback = simulationManager.createPhysicsCallback();
    this.sceneManager.animationLoop.onPhysics(physicsCallback);

    // Register rendering callback
    this.sceneManager.animationLoop.onAnimate(this.renderPipeline.update);
  }

  /**
   * Gets the underlying Three.js scene instance.
   * @returns The scene object.
   */
  get scene(): THREE.Scene {
    return this.sceneManager.scene;
  }
  /**
   * Gets the active Three.js perspective camera instance.
   * @returns The camera object.
   */
  get camera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
  /**
   * Gets the underlying Three.js WebGL renderer instance.
   * @returns The renderer object.
   */
  get renderer(): THREE.WebGLRenderer {
    return this.sceneManager.renderer;
  }
  /**
   * Gets the associated OrbitControls instance.
   * @returns The controls instance.
   */
  get controls() {
    return this.controlsManager.controls;
  }

  /**
   * Starts the rendering loop.
   */
  start(): void {
    this.sceneManager.start();
  }
  /**
   * Stops the rendering loop.
   */
  stop(): void {
    this.sceneManager.stop();
  }

  /**
   * Handles window resize events, updating camera aspect ratio and renderer size.
   * @param width - The new width of the viewport.
   * @param height - The new height of the viewport.
   */
  onResize(width: number, height: number): void {
    this.sceneManager.onResize(width, height);
    this.css2DManager?.onResize(width, height);
  }

  /**
   * Cleans up resources used by the renderer and its managers.
   * Stops the animation loop and removes event listeners.
   */
  dispose(): void {
    console.log("[ModularSpaceRenderer] Disposing resources...");

    this.stateAdapter.dispose();

    this.sceneManager.dispose();
    this.objectManager.dispose();
    this.orbitManager.dispose();
    this.backgroundManager.dispose();
    this.controlsManager.dispose();
    this.css2DManager?.dispose();
    this.auMarkerManager?.dispose();
    this.lightingManager.dispose();
    this.lodManager.dispose();
    this.gridManager.dispose();

    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }

    // Nullify references to allow garbage collection
    (this.sceneManager as any) = null;
    (this.objectManager as any) = null;
    (this.orbitManager as any) = null;
    (this.backgroundManager as any) = null;
    (this.controlsManager as any) = null;
    (this.css2DManager as any) = null;
    (this.auMarkerManager as any) = null;
    (this.lightingManager as any) = null;
    (this.lodManager as any) = null;
    (this.gridManager as any) = null;
    (this.stateAdapter as any) = null;
    (this.renderPipeline as any) = null;
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
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry instanceof THREE.BufferGeometry) {
          const position = object.geometry.attributes.position;
          if (position) {
            count += position.count / 3;
          }
        }
      }
    });
    return count;
  }

  /**
   * Toggles debris effects on or off.
   * @returns The new state (true if enabled, false if disabled).
   */

  /**
   * Sets the global debug mode for the renderer.
   * This enables various visual helpers and may impact performance.
   * Note: Forcing fallback meshes currently requires object recreation.
   *
   * @param enabled - If true, enables debug mode.
   */
  public setDebugMode(enabled: boolean): void {
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
    this.controlsManager.setDebugMode(enabled);
  }

  /**
   * Highlights prediction lines for a specific object, hiding all others.
   * @param objectId - ID of the object to show prediction for, or null to hide all
   */
  public highlightPrediction(objectId: string | null): void {
    this.orbitManager.highlightPrediction(objectId);
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
    this.depthDebugger.runFullAnalysis();
  }
}
