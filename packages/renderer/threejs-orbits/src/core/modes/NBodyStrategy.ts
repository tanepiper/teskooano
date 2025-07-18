import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { TrailManager } from "../../verlet/TrailManager";
import { PredictionManager } from "../../verlet/PredictionManager";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type * as THREE from "three";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { simulationState } from "@teskooano/core-state";
import { StateAccessor } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";

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
  /** Manager for historical orbit trails */
  public trailManager: TrailManager;
  /** Manager for future trajectory predictions */
  public predictionManager: PredictionManager;
  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;
  /** Counter for throttling trail updates */
  private trailUpdateCounter: number = 0;
  /** How often to update trail geometry (every N frames) */
  private readonly trailUpdateFrequency: number = 5;
  /** Counter for throttling prediction updates */
  private predictionUpdateCounter: number = 0;
  /** How often to update predictions (every N frames) */
  private readonly predictionUpdateFrequency: number = 90;
  /** Visibility state for all visualizations */
  private isVisible: boolean = true;

  /**
   * Creates a new NBodyStrategy instance.
   *
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param layer2DManager - Optional manager for 2D labels (used for prediction markers)
   */
  constructor(objectManager: ObjectManager, layer2DManager?: Layer2DManager) {
    this.trailManager = new TrailManager(objectManager);
    this.predictionManager = new PredictionManager(objectManager);

    if (layer2DManager) {
      this.predictionManager.setLayer2DManager(layer2DManager);
    }
  }

  /**
   * Updates all trail and prediction visualizations.
   *
   * This method:
   * 1. Updates the trail history for all objects
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
    const trailLength = 50000;

    this.predictionManager.update(deltaTime);

    if (this.predictionUpdateCounter === 0) {
      this.trailManager.limitHistoryMemory(trailLength);
    }

    this.trailUpdateCounter++;
    const shouldUpdateTrailGeometry =
      this.trailUpdateCounter >= this.trailUpdateFrequency;
    if (shouldUpdateTrailGeometry) {
      this.trailUpdateCounter = 0;
    }

    Object.values(objects).forEach((obj) => {
      this.trailManager.updateTrail(
        obj.celestialObjectId,
        obj,
        trailLength,
        shouldUpdateTrailGeometry,
      );
    });

    this.predictionUpdateCounter++;
    const shouldUpdatePredictions =
      this.predictionUpdateCounter >= this.predictionUpdateFrequency;
    if (shouldUpdatePredictions) {
      this.predictionUpdateCounter = 0;
    }

    if (this.highlightedObjectId) {
      this.predictionManager.updatePrediction(this.highlightedObjectId, {
        forceRecalculate: shouldUpdatePredictions,
        timeScale: visualSettings.timeScale,
        predictionSteps: visualSettings.predictionSteps,
      });
      this.predictionManager.highlightPrediction(this.highlightedObjectId);

      const line = this.predictionManager.predictionLines.get(
        this.highlightedObjectId,
      );
      const object = objects[this.highlightedObjectId];
      const labels = this.predictionManager.getPredictionLabels();

      // Check simulation mode to determine how to position prediction lines
      const simulationConfig =
        simulationState.getSimulationState().simulationConfig;
      const isIdealMode = simulationConfig.mode === "ideal";

      if (line) {
        if (isIdealMode) {
          // In ideal mode, predictions are calculated in absolute world coordinates
          // so the line should be positioned at the origin
          line.position.set(0, 0, 0);
          labels.forEach(({ label }) => {
            if (label.visible && label.userData.localPosition) {
              label.position.copy(label.userData.localPosition);
            }
          });
        } else {
          // In N-body mode, check if we have a valid parent for relative positioning
          if (object?.parentId) {
            const parent = objects[object.parentId];

            // Additional check: in multi-star systems, if parent is a moving star,
            // the prediction system uses absolute coordinates, so position at origin
            const allObjects = StateAccessor.getCurrentCelestialObjects();
            const stars = Object.values(allObjects).filter(
              (obj) => obj.type === CelestialType.STAR,
            );
            const isMultiStarSystem = stars.length > 1;
            const parentIsMovingStar =
              parent && parent.type === CelestialType.STAR && isMultiStarSystem;

            if (parent?.position && !parentIsMovingStar) {
              // Normal relative positioning for single-star systems or non-star parents
              line.position.copy(parent.position);
              labels.forEach(({ label }) => {
                if (label.visible && label.userData.localPosition) {
                  label.position
                    .copy(label.userData.localPosition)
                    .add(parent.position);
                }
              });
            } else {
              // Use absolute positioning (origin) for multi-star systems with star parents
              line.position.set(0, 0, 0);
              labels.forEach(({ label }) => {
                if (label.visible && label.userData.localPosition) {
                  label.position.copy(label.userData.localPosition);
                }
              });
            }
          } else {
            // No parent - use absolute positioning
            line.position.set(0, 0, 0);
            labels.forEach(({ label }) => {
              if (label.visible && label.userData.localPosition) {
                label.position.copy(label.userData.localPosition);
              }
            });
          }
        }
      }
    } else {
      this.predictionManager.highlightPrediction(null);
    }
  }

  /**
   * Highlights a specific object's trail and prediction visualizations.
   *
   * When an object is highlighted:
   * 1. Its trail is highlighted with the specified color
   * 2. A prediction trajectory is calculated and displayed
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param color - Color to use for highlighting
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    this.highlightedObjectId = objectId;
    this.trailManager.setHighlightedObject(objectId, color);

    if (objectId) {
      const visualSettings = {
        timeScale: 1,
        predictionSteps: 1000,
        predictionDuration: 31557600,
      };
      this.predictionManager.updatePrediction(objectId, {
        forceRecalculate: true,
        timeScale: visualSettings.timeScale,
        predictionSteps: visualSettings.predictionSteps,
      });
      this.predictionManager.highlightPrediction(objectId);
    } else {
      this.predictionManager.highlightPrediction(null);
    }
  }

  /**
   * Sets the visibility of all trail visualizations.
   *
   * @param visible - Whether trail visualizations should be visible
   */
  setVisibility(visible: boolean): void {
    this.trailManager.setVisibility(visible);
  }

  /**
   * Sets the visibility of prediction trajectory visualizations.
   *
   * @param visible - Whether prediction visualizations should be visible
   */
  setPredictionVisibility(visible: boolean): void {
    this.predictionManager.setVisibility(visible);
  }

  /**
   * Cleans up resources used by this strategy.
   * Disposes both trail and prediction managers.
   */
  dispose(): void {
    this.trailManager.dispose();
    this.predictionManager.dispose();
  }
}
