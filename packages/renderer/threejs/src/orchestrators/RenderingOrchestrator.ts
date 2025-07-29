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
 *
 * **Prediction Highlighting Delegation:**
 *
 * This orchestrator serves as a delegation point in the prediction highlighting system:
 *
 * - Receives highlighting requests from CameraManager (user interaction)
 * - Routes requests to the appropriate specialized manager (OrbitsManager)
 * - Provides a clean interface for camera controls to interact with orbit visualizations
 * - Maintains separation of concerns between camera logic and orbit rendering
 */
export class RenderingOrchestrator {
  private _sceneManager: SceneManager;
  private _objectManager!: ObjectManager;
  private _orbitManager!: OrbitsManager;
  private _backgroundManager: BackgroundManager;
  private _lightingManager: LightingManager;
  private _lodManager: LODManager;
  private _gridManager: GridManager;
  private _stateAdapter: RendererStateAdapter;
  private _renderPipeline!: RenderPipeline;

  constructor(container: HTMLElement) {
    // Initialize state adapter
    this._stateAdapter = new RendererStateAdapter();

    // Initialize core scene manager
    this._sceneManager = new SceneManager(container, {
      antialias: true,
    });

    // Initialize lighting manager
    this._lightingManager = new LightingManager(this._sceneManager.scene);

    // Initialize LOD manager
    this._lodManager = new LODManager(this._sceneManager.camera);

    // Initialize grid manager
    this._gridManager = new GridManager(this._sceneManager.scene);

    // Initialize background manager
    this._backgroundManager = new BackgroundManager(
      this._sceneManager.scene,
      this._sceneManager.camera,
    );
    this._backgroundManager.setCamera(this._sceneManager.camera);

    // Note: objectManager and orbitManager will be initialized after css2DManager is available
    // to avoid the temporary object issue
  }

  /**
   * Initializes the object and orbit managers after css2DManager is available.
   * This is needed because of circular dependency between orchestrators.
   */
  initializeManagersWithCss2D(css2DManager: any): void {
    // Initialize object manager
    this._objectManager = new ObjectManager(
      this._sceneManager.scene,
      this._sceneManager.camera,
      renderableStore.renderableObjects$,
      this._sceneManager.renderer,
      css2DManager,
      undefined, // acceleration$ - use default
      this._lightingManager, // Pass the shared lighting manager
    );

    // Initialize orbit manager
    this._orbitManager = new OrbitsManager(
      this._objectManager,
      this._stateAdapter,
      renderableStore.renderableObjects$,
      css2DManager,
      this._objectManager.getCelestialRenderers(),
    );

    // Initialize render pipeline (controlsManager will be set later)
    this._renderPipeline = new RenderPipeline({
      sceneManager: this._sceneManager,
      controlsManager: {} as any, // Temporary, will be set by setControlsManager
      orbitManager: this._orbitManager,
      objectManager: this._objectManager,
      backgroundManager: this._backgroundManager,
      lightingManager: this._lightingManager,
      lodManager: this._lodManager,
      gridManager: this._gridManager,
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
  get sceneManager(): SceneManager {
    return this._sceneManager;
  }

  /**
   * Gets the object manager for direct access when needed.
   */
  get objectManager(): ObjectManager {
    return this._objectManager;
  }

  /**
   * Gets the orbit manager for direct access when needed.
   */
  get orbitManager(): OrbitsManager {
    return this._orbitManager;
  }

  /**
   * Gets the render pipeline for direct access when needed.
   */
  get renderPipeline(): RenderPipeline {
    return this._renderPipeline;
  }

  /**
   * Gets the grid manager for direct access when needed.
   */
  get gridManager(): GridManager {
    return this._gridManager;
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
   *
   * This method is part of the prediction highlighting delegation chain:
   * CameraManager → RenderingOrchestrator → OrbitsManager → PredictionManager
   *
   * It's typically called when a user focuses on a celestial object via camera controls.
   * The highlighting will only have an effect when using N-Body simulation mode,
   * as ideal orbits don't support prediction highlighting.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
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
    this._sceneManager.dispose();
    this._objectManager.dispose();
    this._orbitManager.dispose();
    this._backgroundManager.dispose();
    this._lightingManager.dispose();
    this._lodManager.dispose();
    this._gridManager.dispose();
    this._stateAdapter.dispose();
  }
}
