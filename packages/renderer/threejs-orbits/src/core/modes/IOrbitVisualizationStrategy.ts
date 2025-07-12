import type { RenderableCelestialObject } from "@teskooano/data-types";
import type * as THREE from "three";

/**
 * Interface defining the contract for orbit visualization strategies.
 *
 * This strategy pattern allows the OrbitsManager to switch between different
 * visualization approaches (Ideal vs. N-Body) without changing its implementation.
 * Each strategy handles the specific rendering techniques for its simulation mode.
 */
export interface IOrbitVisualizationStrategy {
  /**
   * Updates the visualization based on the current state of celestial objects.
   *
   * @param objects - Map of all renderable celestial objects by ID
   * @param visualSettings - Current visual settings including time scale and prediction parameters
   * @param deltaTime - Time elapsed since the last update in milliseconds
   */
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: {
      timeScale: number;
      predictionSteps: number;
      predictionDuration: number;
    },
    deltaTime: number,
  ): void;

  /**
   * Highlights a specific object's orbit visualization.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param color - Color to use for highlighting
   */
  highlight(objectId: string | null, color: THREE.Color): void;

  /**
   * Sets the visibility of orbit visualizations.
   *
   * @param visible - Whether orbit visualizations should be visible
   */
  setVisibility(visible: boolean): void;

  /**
   * Sets the visibility of trajectory prediction visualizations.
   *
   * @param visible - Whether prediction visualizations should be visible
   */
  setPredictionVisibility(visible: boolean): void;

  /**
   * Cleans up resources used by this strategy.
   * Called when switching to a different strategy or disposing the OrbitsManager.
   */
  dispose(): void;
}
