import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { TrailCurveInterpolator } from "./TrailCurveInterpolator";
import { TrailCurveType, type TrailCurveConfig } from "./TrailManager";

/**
 * Handles rendering and visualization of prediction lines.
 * Extracted from PredictionManager to improve modularity and testability.
 */
export class PredictionRenderer {
  /** Map storing prediction lines, keyed by celestial object ID */
  public predictionLines: Map<string, THREE.Line> = new Map();

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineHelper;

  /** Group for all prediction lines */
  private predictionLinesGroup: THREE.Group;

  /** Curve configuration for prediction line interpolation */
  private curveConfig: TrailCurveConfig = {
    type: TrailCurveType.Orbital,
    tension: 0.5,
    segments: 6,
    smoothing: 0.4,
    adaptiveThreshold: 8,
  };

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  constructor(
    objectManager: ObjectManager,
    curveConfig: TrailCurveConfig,
    predictionLinesGroup: THREE.Group,
  ) {
    this.lineBuilder = new LineHelper();
    this.curveConfig = curveConfig;
    this.predictionLinesGroup = predictionLinesGroup;
  }

  /**
   * Draws or updates the prediction line for an object.
   */
  drawPredictionLine(
    objectId: string,
    predictionPoints: THREE.Vector3[],
  ): void {
    if (predictionPoints.length < 2) {
      this.removePrediction(objectId);
      return;
    }

    // Apply curve interpolation to prediction points
    const interpolatedPoints = TrailCurveInterpolator.interpolate(
      predictionPoints,
      this.curveConfig,
    );

    let line = this.predictionLines.get(objectId);
    const predictionSteps = interpolatedPoints.length;

    if (!line) {
      const material = SharedMaterials.clone("PREDICTION");
      line = this.lineBuilder.createLine(
        predictionSteps,
        material,
        `prediction-line-${objectId}`,
      );
      line.frustumCulled = false; // Disable frustum culling to ensure prediction lines are always visible

      // Add prediction lines to the dedicated orbit lines group
      this.predictionLinesGroup.add(line);

      this.predictionLines.set(objectId, line);
    }

    this.lineBuilder.updateLine(line, interpolatedPoints, predictionSteps);
    line.computeLineDistances();

    if (
      (line.material instanceof THREE.LineBasicMaterial ||
        line.material instanceof THREE.LineDashedMaterial) &&
      !line.userData.defaultColor
    ) {
      line.userData.defaultColor = line.material.color.clone();
    }

    line.visible = this.visualizationVisible;
  }

  /**
   * Removes a specific prediction line from the scene.
   */
  removePrediction(objectId: string): void {
    const line = this.predictionLines.get(objectId);
    if (line) {
      // Remove from the orbit lines group
      this.predictionLinesGroup.remove(line);

      this.lineBuilder.disposeLine(line);
      this.predictionLines.delete(objectId);
    }
  }

  /**
   * Sets the visibility state for all prediction lines.
   */
  setVisibility(visible: boolean): void {
    if (this.visualizationVisible === visible) return;

    this.visualizationVisible = visible;
    this.predictionLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Sets the curve configuration for prediction interpolation.
   */
  setCurveConfig(config: TrailCurveConfig): void {
    this.curveConfig = { ...this.curveConfig, ...config };
  }

  /**
   * Gets the current curve configuration.
   */
  getCurveConfig(): TrailCurveConfig {
    return { ...this.curveConfig };
  }

  /**
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.predictionLines.forEach((_, id) => this.removePrediction(id));
  }

  /**
   * Updates the visibility of prediction lines based on highlighting.
   */
  updatePredictionLineVisibility(highlightedObjectId: string): void {
    // Hide all prediction lines except for the highlighted object
    this.predictionLines.forEach((line, id) => {
      if (id !== highlightedObjectId) {
        line.visible = false;
      }
    });

    // Show prediction for the highlighted object
    const line = this.predictionLines.get(highlightedObjectId);
    if (line) {
      line.visible = this.visualizationVisible;
    }
  }

  /**
   * Clears all prediction highlights.
   */
  clearAllPredictionHighlights(): void {
    // Hide all prediction lines
    this.predictionLines.forEach((line) => {
      line.visible = false;
    });
  }

  /**
   * Gets a prediction line by ID.
   */
  getPredictionLine(objectId: string): THREE.Line | undefined {
    return this.predictionLines.get(objectId);
  }

  /**
   * Checks if a prediction line exists for the given object.
   */
  hasPredictionLine(objectId: string): boolean {
    return this.predictionLines.has(objectId);
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.clearAllPredictions();
    this.lineBuilder.clear();
  }
}
