import * as THREE from "three";
import { PhysicsStateReal, predictTrajectory } from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";
import { getCelestialObjects } from "@teskooano/core-state";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";

/**
 * Manages the creation and updating of prediction lines showing an object's future trajectory.
 *
 * Prediction lines visualize the expected future path of a celestial object based on
 * the current physics state, simulated using the Verlet integration method.
 */
export class PredictionManager {
  /** Map storing prediction lines, keyed by celestial object ID */
  public predictionLines: Map<string, THREE.Line> = new Map();

  /** Cached prediction points for each object to avoid recalculation every frame */
  private predictedLinePoints: Map<string, OSVector3[]> = new Map();

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineBuilder;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Duration to predict into the future (in seconds) */
  private predictionDuration: number = 3600 * 12; // 12 hours

  /** Number of steps to use for the prediction calculation */
  private predictionSteps: number = 200;

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  /**
   * Creates a new PredictionManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineBuilder();
  }

  /**
   * Updates or creates a prediction line for a specific object.
   *
   * @param objectId - ID of the object to predict for
   * @param forceRecalculate - Whether to force recalculation even if cached
   * @returns True if prediction was successfully created/updated
   */
  updatePrediction(objectId: string, forceRecalculate: boolean): boolean {
    // Get all current physics states
    const fullObjectsMap = getCelestialObjects();
    const targetObject = fullObjectsMap[objectId];

    if (!targetObject?.physicsStateReal) {
      this.removePrediction(objectId);
      return false;
    }

    // Get other physics states for N-body calculations
    const allCurrentPhysicsStates = Object.values(fullObjectsMap)
      .map((co) => co.physicsStateReal)
      .filter((state): state is PhysicsStateReal => !!state);

    const otherPhysicsStates = allCurrentPhysicsStates.filter(
      (state) => state.id !== objectId,
    );

    // Calculate or retrieve prediction points
    let predictionPoints: OSVector3[];

    if (forceRecalculate || !this.predictedLinePoints.has(objectId)) {
      // Calculate new prediction
      const newPoints = predictTrajectory(
        objectId,
        [targetObject.physicsStateReal, ...otherPhysicsStates],
        this.predictionDuration,
        this.predictionSteps,
        {
          // Add options here if needed, e.g., collision detection
        },
      );

      this.predictedLinePoints.set(objectId, newPoints);
      predictionPoints = newPoints;
    } else {
      // Use cached prediction
      predictionPoints = this.predictedLinePoints.get(objectId)!;
    }

    // Convert to THREE.Vector3 for rendering
    const predictionPointsTHREE = predictionPoints.map((p) => p.toThreeJS());

    // If not enough points for a line, remove any existing prediction
    if (predictionPointsTHREE.length < 2) {
      this.removePrediction(objectId);
      return false;
    }

    // Update or create the prediction line
    let line = this.predictionLines.get(objectId);

    if (!line) {
      // Create new prediction line
      const material = SharedMaterials.clone("PREDICTION");
      line = this.lineBuilder.createLine(
        this.predictionSteps,
        material,
        `prediction-line-${objectId}`,
      );

      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.predictionLines.set(objectId, line);
    }

    // Update the line with current prediction points
    this.lineBuilder.updateLine(
      line,
      predictionPointsTHREE,
      this.predictionSteps,
    );

    // Store the default color for future reference
    if (
      line.material instanceof THREE.LineBasicMaterial &&
      !line.userData.defaultColor
    ) {
      line.userData.defaultColor = line.material.color.clone();
    }

    // Update visibility
    line.visible = this.visualizationVisible;

    return true;
  }

  /**
   * Removes a specific prediction line from the scene.
   *
   * @param objectId - ID of the object whose prediction should be removed
   */
  removePrediction(objectId: string): void {
    const line = this.predictionLines.get(objectId);
    if (line) {
      this.objectManager.removeRawObjectFromScene(line);
      this.lineBuilder.disposeLine(line);
      this.predictionLines.delete(objectId);
    }
    this.predictedLinePoints.delete(objectId);
  }

  /**
   * Sets the visibility state for all prediction lines.
   *
   * @param visible - Whether predictions should be visible
   */
  setVisibility(visible: boolean): void {
    if (this.visualizationVisible === visible) return;

    this.visualizationVisible = visible;
    this.predictionLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Changes the prediction duration.
   *
   * @param duration - New duration in seconds
   */
  setPredictionDuration(duration: number): void {
    if (this.predictionDuration !== duration) {
      this.predictionDuration = duration;
      this.clearAllPredictions();
    }
  }

  /**
   * Changes the number of prediction steps.
   *
   * @param steps - New number of steps
   */
  setPredictionSteps(steps: number): void {
    if (this.predictionSteps !== steps) {
      this.predictionSteps = steps;
      this.clearAllPredictions();
    }
  }

  /**
   * Clears all prediction lines and cached points.
   */
  clearAllPredictions(): void {
    this.predictionLines.forEach((_, id) => this.removePrediction(id));
    this.predictedLinePoints.clear();
  }

  /**
   * Hides prediction lines for all objects except the specified one.
   *
   * @param objectId - ID of the object to show prediction for, or null to hide all
   */
  highlightPrediction(objectId: string | null): void {
    if (objectId) {
      // Hide all predictions except for the highlighted object
      this.predictionLines.forEach((line, id) => {
        if (id !== objectId) {
          line.visible = false;
        }
      });

      // Show prediction for highlighted object
      const line = this.predictionLines.get(objectId);
      if (line) {
        line.visible = this.visualizationVisible;
      }
    } else {
      // Hide all predictions
      this.predictionLines.forEach((line) => {
        line.visible = false;
      });
    }
  }

  /**
   * Cleans up all prediction lines and releases resources.
   */
  dispose(): void {
    this.clearAllPredictions();
    this.lineBuilder.clear();
  }
}
