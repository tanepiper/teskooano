import { SceneManager, GridManager } from "@teskooano/renderer-threejs-core";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager } from "@teskooano/renderer-threejs-celestial";
import { RendererStateAdapter } from "../RendererStateAdapter";
import { RenderPipeline } from "../RenderPipeline";
import { renderableStore } from "@teskooano/core-state";
import type { RendererServices } from "../services/RendererServiceContainer";
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
 *
 * **Constructor Injection:**
 *
 * This orchestrator now uses constructor injection to receive all its dependencies,
 * eliminating the circular dependency issues and setDependencies() anti-pattern.
 */
export class RenderingOrchestrator {
  /**
   * All renderer services are injected via constructor.
   * This eliminates circular dependencies and provides clear service boundaries.
   */
  private readonly services: RendererServices;

  constructor(services: RendererServices) {
    this.services = services;

    // @ts-ignore
    if (window.teskooano) {
      // @ts-ignore
      window.teskooano.renderingOrchestrator = this;
    }
  }

  /**
   * Gets the core scene manager for direct access when needed.
   */
  get sceneManager(): SceneManager {
    return this.services.sceneManager;
  }

  /**
   * Gets the object manager for direct access when needed.
   */
  get objectManager(): ObjectManager {
    return this.services.objectManager;
  }

  /**
   * Gets the orbit manager for direct access when needed.
   */
  get orbitManager(): OrbitsManager {
    return this.services.orbitManager;
  }

  /**
   * Gets the render pipeline for direct access when needed.
   */
  get renderPipeline(): RenderPipeline {
    return this.services.renderPipeline;
  }

  /**
   * Gets the grid manager for direct access when needed.
   */
  get gridManager(): GridManager {
    return this.services.gridManager;
  }

  /**
   * Gets the state adapter for direct access when needed.
   */
  get stateAdapter(): RendererStateAdapter {
    return this.services.stateAdapter;
  }

  /**
   * Gets the background manager for direct access when needed.
   */
  get backgroundManager(): BackgroundManager {
    return this.services.backgroundManager;
  }

  /**
   * Gets the lighting manager for direct access when needed.
   */
  get lightingManager(): LightingManager {
    return this.services.lightingManager;
  }

  /**
   * Gets the LOD manager for direct access when needed.
   */
  get lodManager(): LODManager {
    return this.services.lodManager;
  }

  /**
   * Sets debug mode for all rendering components.
   */
  setDebugMode(enabled: boolean): void {
    this.objectManager.setDebugMode(enabled);
    this.objectManager.recreateAllMeshes();
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
   * Note: This orchestrator no longer manages disposal directly.
   * Disposal is handled by the service container.
   */
  dispose(): void {
    // Disposal is now handled by the service container
    // This method is kept for backward compatibility
    console.log(
      "[RenderingOrchestrator] Disposal handled by service container",
    );
  }
}
