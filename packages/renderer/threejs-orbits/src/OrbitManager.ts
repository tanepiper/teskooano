import { type PhysicsStateReal } from "@teskooano/core-physics";
import { getCelestialObjects } from "@teskooano/core-state";
import type {
  RenderableCelestialObject,
  RendererStateAdapter,
} from "@teskooano/renderer-threejs";
import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import {
  OrbitsManager,
  VisualizationMode as NewVisualizationMode,
} from "./core/OrbitsManager";

/**
 * Enum defining the available modes for orbit visualization.
 * @deprecated Use VisualizationMode from '@teskooano/renderer-threejs-orbits/core' instead.
 */
export enum VisualizationMode {
  Keplerian = "KEPLERIAN",
  Verlet = "VERLET",
}

const isMobileWidth = window.innerWidth < 1024;

// Shared materials to avoid unnecessary cloning and improve memory usage
const SHARED_MATERIALS = {
  // Trail material for showing object history
  TRAIL: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),

  // Prediction material for showing future path
  PREDICTION: new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),
};

/**
 * @deprecated Use OrbitsManager instead.
 * This class is kept for backward compatibility and delegates all operations to OrbitsManager.
 */
export class OrbitManager {
  /** The underlying OrbitsManager instance */
  private orbitsManager: OrbitsManager;

  /**
   * Creates a new OrbitManager instance that delegates to OrbitsManager.
   *
   * @param objectManager - The scene's ObjectManager instance.
   * @param stateAdapter - The RendererStateAdapter for accessing visual settings.
   * @param renderableObjects$ - An Observable emitting RenderableCelestialObject data.
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    console.warn(
      "OrbitManager is deprecated. Use OrbitsManager from '@teskooano/renderer-threejs-orbits/core' instead.",
    );

    this.orbitsManager = new OrbitsManager(
      objectManager,
      stateAdapter,
      renderableObjects$,
    );
  }

  /**
   * Sets the visualization mode (`Keplerian` or `Verlet`).
   *
   * @param mode - The VisualizationMode to switch to.
   */
  setVisualizationMode(mode: VisualizationMode): void {
    // Map the old enum to the new enum
    const newMode =
      mode === VisualizationMode.Keplerian
        ? NewVisualizationMode.Keplerian
        : NewVisualizationMode.Verlet;

    this.orbitsManager.setVisualizationMode(newMode);
  }

  /**
   * Updates all active visualizations based on the current mode and object states.
   */
  updateAllVisualizations(): void {
    this.orbitsManager.updateAllVisualizations();
  }

  /**
   * Sets the visibility of all visualizations.
   *
   * @param visible - Whether visualizations should be visible
   */
  setVisibility(visible: boolean): void {
    this.orbitsManager.setVisibility(visible);
  }

  /**
   * Gets the current visibility state.
   *
   * @returns Whether visualizations are currently visible
   */
  isVisualizationVisible(): boolean {
    return this.orbitsManager.isVisualizationVisible();
  }

  /**
   * Toggles the visibility of all visualizations.
   */
  toggleVisualization(): void {
    this.orbitsManager.toggleVisualization();
  }

  /**
   * Highlights a specific object's visualizations.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlight
   */
  highlightVisualization(objectId: string | null): void {
    this.orbitsManager.highlightVisualization(objectId);
  }

  /**
   * Cleans up resources used by the manager.
   */
  dispose(): void {
    this.orbitsManager.dispose();
  }

  /**
   * Compatibility with property access to public maps in the old OrbitManager.
   * These are not maintained anymore and will return empty maps.
   * @deprecated
   */
  public get trailLines(): Map<string, THREE.Line> {
    console.warn("Direct access to trailLines is deprecated");
    return new Map();
  }

  /**
   * @deprecated
   */
  public get predictionLines(): Map<string, THREE.Line> {
    console.warn("Direct access to predictionLines is deprecated");
    return new Map();
  }
}
