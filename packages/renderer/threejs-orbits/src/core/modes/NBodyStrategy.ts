import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { SimpleOrbitalRenderer } from "../../renderers/SimpleOrbitalRenderer";
import { PredictionManager } from "../../renderers/PredictionManager";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type * as THREE from "three";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { simulationStateService } from "@teskooano/core-state";
import { StateAccessor } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";
import { TrailCurveType } from "../../renderers/TrailManager";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import { BaseCelestialRenderer } from "@teskooano/renderer-threejs-celestial";

/**
 * Implementation of the orbit visualization strategy for N-Body simulation modes.
 *
 * This strategy handles visualization for all N-Body physics modes, regardless of
 * the specific algorithm (direct, barnes-hut, fmm, etc.) or integrator (verlet, rk4, etc.)
 * being used. It renders two types of visualizations:
 *
 * 1. Historical trails showing the actual path an object has followed
 * 2. Predictive trajectories showing the calculated future path
 *
 * Both visualizations are dynamically updated based on the actual physics simulation
 * results rather than using static mathematical formulas.
 */
export class NBodyStrategy implements IOrbitVisualizationStrategy {
  /** Simple renderer for orbital lines using PositionHistoryManager data */
  public orbitalRenderer: SimpleOrbitalRenderer;
  /** Manager for future trajectory predictions */
  public predictionManager: PredictionManager;
  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;
  /** Counter for throttling orbital updates */
  private orbitalUpdateCounter: number = 0;
  /** How often to update orbital geometry (every N frames) */
  private readonly orbitalUpdateFrequency: number = 10;
  /** Counter for throttling prediction updates */
  private predictionUpdateCounter: number = 0;
  /** How often to update predictions (every N frames) */
  private readonly predictionUpdateFrequency: number = 90;
  /** Visibility state for all visualizations */
  private isVisible: boolean = true;

  private celestialRenderers: Map<string, CelestialRenderer>;

  /**
   * Creates a new NBodyStrategy instance.
   *
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param layer2DManager - Optional manager for 2D labels (used for prediction markers)
   * @param orbitLinesGroup - Shared group for all orbit-related lines
   * @param renderers - Maps of renderers for different celestial types
   */
  constructor(
    objectManager: ObjectManager,
    layer2DManager: Layer2DManager,
    orbitLinesGroup: THREE.Group,
    celestialRenderers: Map<string, CelestialRenderer>,
  ) {
    // Create simple orbital renderer that uses PositionHistoryManager directly
    this.orbitalRenderer = new SimpleOrbitalRenderer(
      objectManager,
      orbitLinesGroup,
    );

    this.predictionManager = new PredictionManager(
      objectManager,
      {
        type: TrailCurveType.Orbital,
        tension: 0.5,
        segments: 6,
        smoothing: 0.4,
        adaptiveThreshold: 8,
      },
      orbitLinesGroup,
    );

    // Store renderer maps for accessing PositionHistoryManager
    this.celestialRenderers = celestialRenderers;

    if (layer2DManager) {
      this.predictionManager.setLayer2DManager(layer2DManager);
    }
  }

  /**
   * Gets the renderer for a specific object ID.
   *
   * @param objectId - The ID of the object
   * @returns The renderer for the object, or undefined if not found
   */
  private getRenderer(objectId: string): BaseCelestialRenderer | undefined {
    const renderer = this.celestialRenderers.get(objectId);

    // Cast to BaseCelestialRenderer to access positionHistoryManager
    return renderer as BaseCelestialRenderer;
  }

  /**
   * Updates all orbital and prediction visualizations.
   *
   * This method:
   * 1. Updates the orbital lines for all objects using their PositionHistoryManager
   * 2. Updates the prediction trajectory for the highlighted object
   * 3. Positions prediction lines and labels correctly based on simulation mode
   *
   * Updates are throttled using counters to avoid excessive calculations.
   *
   * @param objects - Map of all renderable celestial objects by ID
   * @param visualSettings - Current visual settings including time scale and prediction parameters
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: {
      timeScale: number;
      predictionSteps: number;
      predictionDuration: number;
    },
    deltaTime: number,
  ): void {
    this.predictionManager.update(deltaTime);

    this.orbitalUpdateCounter++;
    const shouldUpdateOrbitalGeometry =
      this.orbitalUpdateCounter >= this.orbitalUpdateFrequency;
    if (shouldUpdateOrbitalGeometry) {
      this.orbitalUpdateCounter = 0;
    }

    // Update orbital lines for all objects using their PositionHistoryManager
    Object.values(objects).forEach((obj) => {
      const renderer = this.getRenderer(obj.celestialObjectId);
      if (renderer && renderer.positionHistoryManager) {
        // For now, use a simple distance calculation based on object position
        // In a real implementation, we'd need to pass the camera as a parameter
        const distance = obj.position.length(); // Simple distance from origin
        this.orbitalRenderer.updateOrbitalLine(
          obj.celestialObjectId,
          renderer.positionHistoryManager,
          distance,
        );
      }
    });

    this.predictionUpdateCounter++;
    const shouldUpdatePredictions =
      this.predictionUpdateCounter >= this.predictionUpdateFrequency;
    if (shouldUpdatePredictions) {
      this.predictionUpdateCounter = 0;

      // Update prediction for highlighted object
      if (this.highlightedObjectId) {
        this.predictionManager.updatePrediction(this.highlightedObjectId, {
          forceRecalculate: true,
          timeScale: visualSettings.timeScale,
          predictionSteps: visualSettings.predictionSteps,
        });
      }
    }
  }

  /**
   * Highlights a specific object's orbit visualization.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param color - Color to use for highlighting
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    this.highlightedObjectId = objectId;
    this.orbitalRenderer.setHighlightedObject(objectId, color);
    // Note: PredictionManager doesn't have setHighlightedObject, so we'll skip that for now
  }

  /**
   * Sets the visibility of all visualizations.
   *
   * @param visible - Whether visualizations should be visible
   */
  setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.orbitalRenderer.setVisibility(visible);
    this.predictionManager.setVisibility(visible);
  }

  /**
   * Sets the visibility of trajectory prediction visualizations.
   *
   * @param visible - Whether prediction visualizations should be visible
   */
  setPredictionVisibility(visible: boolean): void {
    this.predictionManager.setVisibility(visible);
  }

  /**
   * Clears all orbital trails.
   */
  clearAllTrails(): void {
    this.orbitalRenderer.clearAllOrbitalLines();
  }

  /**
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.predictionManager.clearAllPredictions();
  }

  /**
   * Disposes of resources used by this strategy.
   */
  dispose(): void {
    this.orbitalRenderer.dispose();
    this.predictionManager.dispose();
  }

  /**
   * Gets performance statistics for this strategy.
   *
   * @returns Performance statistics
   */
  getPerformanceStats(): {
    orbitalLinesCount: number;
    predictionLinesCount: number;
  } {
    const orbitalStats = this.orbitalRenderer.getPerformanceStats();
    // Note: PredictionManager doesn't have getPerformanceStats, so we'll return 0 for now
    return {
      orbitalLinesCount: orbitalStats.orbitalLinesCount,
      predictionLinesCount: 0, // Placeholder until PredictionManager has this method
    };
  }
}
