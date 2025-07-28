import type {
  SceneManager,
  GridManager,
} from "@teskooano/renderer-threejs-core";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import type { BackgroundManager } from "@teskooano/renderer-threejs-background";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODManager } from "@teskooano/renderer-threejs-lod";
import type { RendererStateAdapter } from "../RendererStateAdapter";
import type { RenderPipeline } from "../RenderPipeline";
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
  private objectManager: ObjectManager;
  private orbitManager: OrbitsManager;
  private backgroundManager: BackgroundManager;
  private lightingManager: LightingManager;
  private lodManager: LODManager;
  private gridManager: GridManager;
  private stateAdapter: RendererStateAdapter;
  private renderPipeline: RenderPipeline;

  constructor(
    sceneManager: SceneManager,
    objectManager: ObjectManager,
    orbitManager: OrbitsManager,
    backgroundManager: BackgroundManager,
    lightingManager: LightingManager,
    lodManager: LODManager,
    gridManager: GridManager,
    stateAdapter: RendererStateAdapter,
    renderPipeline: RenderPipeline,
  ) {
    this.sceneManager = sceneManager;
    this.objectManager = objectManager;
    this.orbitManager = orbitManager;
    this.backgroundManager = backgroundManager;
    this.lightingManager = lightingManager;
    this.lodManager = lodManager;
    this.gridManager = gridManager;
    this.stateAdapter = stateAdapter;
    this.renderPipeline = renderPipeline;
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
