import { SceneManager, GridManager } from "@teskooano/renderer-threejs-core";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager } from "@teskooano/renderer-threejs-lod";
import { RendererStateAdapter } from "../RendererStateAdapter";
import { RenderPipeline } from "../RenderPipeline";
import { renderableStore } from "@teskooano/core-state";
import * as THREE from "three";

/**
 * Orchestrates all rendering-related managers and operations.
 *
 * This orchestrator groups managers responsible for the core 3D rendering pipeline:
 * - Scene management and core Three.js objects
 * - Object lifecycle and visual representation
 * - Orbital visualization
 * - Background and environment
 * - Lighting and LOD systems
 * - Grid and spatial reference
 */
export class RenderingOrchestrator {
  private sceneManager: SceneManager;
  private objectManager!: ObjectManager;
  private orbitManager!: OrbitsManager;
  private backgroundManager: BackgroundManager;
  private lightingManager: LightingManager;
  private lodManager: LODManager;
  private gridManager: GridManager;
  private stateAdapter: RendererStateAdapter;
  private renderPipeline!: RenderPipeline;

  constructor(container: HTMLElement) {
    // Initialize state adapter
    this.stateAdapter = new RendererStateAdapter();

    // Initialize core scene manager
    this.sceneManager = new SceneManager(container, {
      antialias: true,
    });

    // Initialize lighting manager
    this.lightingManager = new LightingManager(this.sceneManager.scene);

    // Initialize LOD manager
    this.lodManager = new LODManager(this.sceneManager.camera);

    // Initialize grid manager
    this.gridManager = new GridManager(this.sceneManager.scene);

    // Initialize background manager
    this.backgroundManager = new BackgroundManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
    );
    this.backgroundManager.setCamera(this.sceneManager.camera);

    // Note: objectManager and orbitManager will be initialized after css2DManager is available
    // to avoid the temporary object issue
  }

  /**
   * Initializes the object and orbit managers after css2DManager is available.
   * This is needed because of circular dependency between orchestrators.
   */
  initializeManagersWithCss2D(css2DManager: any): void {
    // Initialize object manager
    this.objectManager = new ObjectManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      renderableStore.renderableObjects$,
      this.sceneManager.renderer,
      css2DManager,
      undefined, // acceleration$ - use default
      this.lightingManager, // Pass the shared lighting manager
    );

    // Initialize orbit manager
    this.orbitManager = new OrbitsManager(
      this.objectManager,
      this.stateAdapter,
      renderableStore.renderableObjects$,
      css2DManager,
      this.objectManager.getCelestialRenderers(),
    );

    // Initialize render pipeline (controlsManager will be set later)
    this.renderPipeline = new RenderPipeline({
      sceneManager: this.sceneManager,
      controlsManager: {} as any, // Temporary, will be set by setControlsManager
      orbitManager: this.orbitManager,
      objectManager: this.objectManager,
      backgroundManager: this.backgroundManager,
      lightingManager: this.lightingManager,
      lodManager: this.lodManager,
      gridManager: this.gridManager,
      css2DManager,
    });
  }

  /**
   * Sets the controls manager after initialization.
   * This is needed because of circular dependency between orchestrators.
   */
  setControlsManager(controlsManager: any): void {
    (this.renderPipeline as any).controlsManager = controlsManager;
  }

  /**
   * Gets the core scene manager for direct access when needed.
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Gets the object manager for direct access when needed.
   */
  getObjectManager(): ObjectManager {
    return this.objectManager;
  }

  /**
   * Gets the orbit manager for direct access when needed.
   */
  getOrbitManager(): OrbitsManager {
    return this.orbitManager;
  }

  /**
   * Gets the render pipeline for direct access when needed.
   */
  getRenderPipeline(): RenderPipeline {
    return this.renderPipeline;
  }

  /**
   * Gets the grid manager for direct access when needed.
   */
  getGridManager(): GridManager {
    return this.gridManager;
  }

  /**
   * Sets debug mode for all rendering components.
   */
  setDebugMode(enabled: boolean): void {
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
  }

  /**
   * Highlights prediction lines for a specific object.
   */
  highlightPrediction(objectId: string | null): void {
    this.orbitManager.highlightPrediction(objectId);
  }

  /**
   * Gets the total triangle count for debugging.
   */
  getTriangleCount(): number {
    let count = 0;
    this.sceneManager.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          const position = geometry.attributes.position;
          if (position) {
            count += position.count / 3;
          }
        }
      }
    });
    return count;
  }

  /**
   * Disposes all rendering resources.
   */
  dispose(): void {
    this.sceneManager.dispose();
    this.objectManager.dispose();
    this.orbitManager.dispose();
    this.backgroundManager.dispose();
    this.lightingManager.dispose();
    this.lodManager.dispose();
    this.gridManager.dispose();
    this.stateAdapter.dispose();
  }
}
