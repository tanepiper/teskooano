import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import {
  AnimationLoop,
  GridManager,
  SceneManager,
  SceneGraphManager,
  SceneQuery,
  HierarchicalLODManager,
  InstancedObjectManager,
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
import { CelestialType } from "@teskooano/data-types";

/**
 * The main orchestrator for the Three.js rendering engine with hierarchical scene management.
 *
 * This class acts as a facade, composing and managing a suite of specialized
 * managers to handle different aspects of the 3D scene, including hierarchical
 * organization, LOD management, instanced rendering, and spatial optimization.
 *
 * @example
 * const renderer = new ModularSpaceRenderer(containerElement, { antialias: true });
 * renderer.startRenderLoop();
 */
export class ModularSpaceRenderer {
  /** Manages the core THREE.Scene, camera, and renderer instances. */
  public sceneManager: SceneManager;

  /** NEW: Manages hierarchical scene graph organization */
  public sceneGraphManager: SceneGraphManager;
  /** NEW: Provides powerful query capabilities over the scene */
  public sceneQuery: SceneQuery;
  /** NEW: Enhanced LOD manager with hierarchical support */
  public hierarchicalLODManager: HierarchicalLODManager;
  /** NEW: Manages large numbers of similar objects using instancing */
  public instancedObjectManager: InstancedObjectManager;

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

  private container?: HTMLElement;
  private resizeHandler?: () => void;

  /**
   * Initializes the renderer and all its subordinate managers with hierarchical capabilities.
   *
   * @param container The HTML element that will host the renderer's canvas.
   */
  constructor(container: HTMLElement) {
    this.stateAdapter = new RendererStateAdapter();

    this.sceneManager = new SceneManager(container, {
      antialias: true,
    });

    // NEW: Initialize hierarchical scene management
    this.sceneGraphManager = new SceneGraphManager(this.sceneManager.scene);
    this.sceneQuery = new SceneQuery(this.sceneManager.scene);
    this.hierarchicalLODManager = new HierarchicalLODManager(
      this.sceneManager.camera,
      this.sceneGraphManager
    );

    // NEW: Initialize instanced object management for large-scale objects
    this.instancedObjectManager = new InstancedObjectManager(
      this.sceneManager.scene,
      this.sceneManager.camera
    );

    // Setup standard instanced object types
    this.setupInstancedObjectTypes();

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
      this.sceneGraphManager, // NEW: Pass scene graph manager
      this.hierarchicalLODManager, // NEW: Pass hierarchical LOD manager
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

    // IMPORTANT: Setup state subscriptions before animation callbacks
    // This ensures hierarchy is created before objects are processed
    this.setupStateSubscriptions();
    this.setupAnimationCallbacks();
  }

  /**
   * Sets up standard instanced object types for common use cases
   */
  private setupInstancedObjectTypes(): void {
    // Asteroid belt configuration
    const asteroidGeometry = new THREE.IcosahedronGeometry(0.5, 1);
    const asteroidMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x665544,
      roughness: 0.8,
      metalness: 0.1 
    });

    this.instancedObjectManager.registerInstanceType({
      geometry: asteroidGeometry,
      material: asteroidMaterial,
      maxInstances: 10000,
      celestialType: CelestialType.ASTEROID,
      enableCulling: true,
      lodDistance: 2000
    });

    // Debris field configuration
    const debrisGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const debrisMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x444444,
      transparent: true,
      opacity: 0.8 
    });

    this.instancedObjectManager.registerInstanceType({
      geometry: debrisGeometry,
      material: debrisMaterial,
      maxInstances: 5000,
      celestialType: CelestialType.COMET, // Using COMET for debris
      enableCulling: true,
      lodDistance: 500
    });
  }

  /**
   * Sets up subscriptions to state changes for hierarchical updates
   */
  private setupStateSubscriptions(): void {
    // Subscribe to renderable objects changes to update scene hierarchy
    renderableStore.renderableObjects$.subscribe(objects => {
      console.log(`[ModularSpaceRenderer] 🏗️ Building hierarchy for ${Object.keys(objects).length} objects`);
      
      // First, ensure the hierarchy is up to date
      this.sceneGraphManager.updateHierarchy(objects);
      
      // Then update orbital positions
      this.sceneGraphManager.updateOrbitalPositions(objects);
      
      console.log(`[ModularSpaceRenderer] ✅ Hierarchy updated for ${Object.keys(objects).length} objects`);
      
      // Debug: Print scene hierarchy
      if (Object.keys(objects).length > 0) {
        console.log("Scene hierarchy:", this.sceneQuery.getSceneHierarchyString(3));
      }
      
      // IMPORTANT: Trigger ObjectManager sync AFTER hierarchy is built
      console.log(`[ModularSpaceRenderer] 🔄 Now syncing objects to hierarchy...`);
      this.objectManager.syncToHierarchy(objects);
    });
  }

  /**
   * Defines the sequence of operations for each frame of the animation loop.
   * The order is critical for ensuring effects are based on the latest data.
   */
  private setupAnimationCallbacks(): void {
    // Register physics simulation callback first
    const physicsCallback = simulationManager.createPhysicsCallback();
    this.sceneManager.animationLoop.onPhysics(physicsCallback);

    // Register rendering callback with hierarchical updates
    this.sceneManager.animationLoop.onAnimate((elapsedTime, deltaTime) => {
      // Update hierarchical managers first
      this.hierarchicalLODManager.update();
      this.instancedObjectManager.update();
      this.instancedObjectManager.animateInstances(deltaTime);
      
      // Perform spatial culling
      this.hierarchicalLODManager.performGroupCulling();
      
      // Continue with standard render pipeline
      this.renderPipeline.update(deltaTime, elapsedTime);
    });
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

  // NEW: Hierarchical scene management methods

  /**
   * Creates an asteroid belt in the scene using instanced rendering
   */
  public createAsteroidBelt(
    centerPosition: THREE.Vector3,
    innerRadius: number,
    outerRadius: number,
    count: number,
    verticalSpread?: number
  ): void {
    this.instancedObjectManager.createAsteroidBelt(
      centerPosition,
      innerRadius,
      outerRadius,
      count,
      verticalSpread
    );
  }

  /**
   * Creates a debris field around a position
   */
  public createDebrisField(
    centerPosition: THREE.Vector3,
    radius: number,
    count: number,
    expansionVelocity?: number
  ): void {
    this.instancedObjectManager.createDebrisField(
      centerPosition,
      radius,
      count,
      expansionVelocity
    );
  }

  /**
   * Gets performance statistics for the hierarchical rendering system
   */
  public getHierarchicalStats(): {
    sceneHierarchy: string;
    lodStats: any;
    instancedStats: any;
  } {
    return {
      sceneHierarchy: this.sceneQuery.getSceneHierarchyString(),
      lodStats: this.hierarchicalLODManager.getPerformanceStats(),
      instancedStats: this.instancedObjectManager.getStats()
    };
  }

  /**
   * Finds celestial objects near a position using the scene query system
   */
  public findObjectsNear(
    position: THREE.Vector3,
    radius: number
  ): Array<{object: THREE.Object3D; distance: number; worldPosition: THREE.Vector3}> {
    return this.sceneQuery.findObjectsInRadius(position, radius);
  }

  /**
   * Gets all moons orbiting a specific planet
   */
  public getMoonsOfPlanet(planetId: string): THREE.Object3D[] {
    return this.sceneQuery.getMoonsOfPlanet(planetId);
  }

  /**
   * Sets custom LOD visibility threshold for children of an object
   */
  public setChildrenVisibilityThreshold(objectId: string, threshold: number): void {
    this.hierarchicalLODManager.setChildrenVisibilityThreshold(objectId, threshold);
  }

  /**
   * Forces refresh of all LOD distances (useful after performance setting changes)
   */
  public refreshLODSystem(): void {
    this.hierarchicalLODManager.refreshAllLODs();
  }

  /**
   * Cleans up resources used by the renderer and its managers.
   * Stops the animation loop and removes event listeners.
   */
  dispose(): void {
    console.log("[ModularSpaceRenderer] Disposing resources...");

    this.stateAdapter.dispose();

    // Dispose hierarchical managers
    this.sceneGraphManager.dispose();
    this.hierarchicalLODManager.dispose();
    this.instancedObjectManager.dispose();

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
    (this.sceneGraphManager as any) = null;
    (this.sceneQuery as any) = null;
    (this.hierarchicalLODManager as any) = null;
    (this.instancedObjectManager as any) = null;
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
      // Also count instanced meshes
      if (object instanceof THREE.InstancedMesh) {
        const position = object.geometry.attributes.position;
        if (position) {
          count += (position.count / 3) * object.count;
        }
      }
    });
    return count;
  }

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
}
