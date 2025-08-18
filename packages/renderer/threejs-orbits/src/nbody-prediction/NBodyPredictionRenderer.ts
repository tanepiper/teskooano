import * as THREE from "three";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import { type ObjectManager } from "@teskooano/renderer-threejs-objects";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { SharedMaterials } from "../shared/SharedMaterials";
import { TrailCurveInterpolator } from "../shared/TrailCurveInterpolator";
import {
  TrailCurveType,
  type TrailCurveConfig,
} from "../shared/TrailCurveConfig";
import { PredictionCalculator } from "./PredictionCalculator";
import { PredictionAnimation } from "./PredictionAnimation";
import { PredictionLabels } from "./PredictionLabels";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";

/**
 * Renders future trajectory predictions for celestial objects in N-body simulation mode.
 *
 * This renderer shows the calculated future path of objects based on physics simulation.
 * It uses Web Workers for performance and supports curved prediction interpolation.
 */
export class NBodyPredictionRenderer extends StateSubscriptionMixin {
  /** Map storing prediction lines, keyed by celestial object ID */
  private predictionLines: Map<string, THREE.Line> = new Map();

  /** Flag to prevent multiple simultaneous calculations */
  private isCalculating: boolean = false;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** The manager for 2D labels */
  private layer2DManager: Layer2DManager | null = null;

  /** Duration to predict into the future (in seconds), synced from global state */
  private predictionDuration: number = 0;

  /** Number of steps to use for prediction calculations */
  private predictionSteps: number = 60;

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Group for all prediction lines */
  private predictionLinesGroup: THREE.Group;

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineHelper;

  /** Curve configuration for prediction line interpolation */
  private curveConfig: TrailCurveConfig = {
    type: TrailCurveType.Orbital,
    tension: 0.5,
    segments: 6,
    smoothing: 0.4,
    adaptiveThreshold: 8,
  };

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  // --- Modular Components ---
  private calculator: PredictionCalculator;
  private animation: PredictionAnimation;
  private labels: PredictionLabels;

  /**
   * Creates a new NBodyPredictionRenderer instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   * @param curveConfig - Optional curve configuration for prediction interpolation
   * @param predictionLinesGroup - Optional shared group for all prediction-related lines
   */
  constructor(
    objectManager: ObjectManager,
    curveConfig?: TrailCurveConfig,
    predictionLinesGroup?: THREE.Group,
  ) {
    super();
    this.objectManager = objectManager;
    this.lineBuilder = new LineHelper();

    if (curveConfig) {
      this.curveConfig = { ...this.curveConfig, ...curveConfig };
    }

    // Use the shared prediction lines group if provided, otherwise create our own
    if (predictionLinesGroup) {
      this.predictionLinesGroup = predictionLinesGroup;
    } else {
      // Create a dedicated group for all prediction-related lines
      this.predictionLinesGroup = new THREE.Group();
      this.predictionLinesGroup.name = "GROUP_PREDICTION_LINES";
      this.objectManager.addRawObjectToScene(this.predictionLinesGroup);
    }

    // Initialize modular components
    this.calculator = new PredictionCalculator();
    this.animation = new PredictionAnimation();
    this.labels = new PredictionLabels(
      objectManager,
      this.predictionLinesGroup,
    );
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
   * Updates all prediction visualizations based on the current objects.
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
    // Update animation
    this.animation.update(deltaTime);

    // Update line during animation if needed
    const highlightedObjectId = this.animation.getHighlightedObjectId();
    if (highlightedObjectId && this.animation.isAnimationRunning()) {
      const line = this.getPredictionLine(highlightedObjectId);
      if (line) {
        this.animation.updateLineDuringAnimation(line);
      }
    }

    // Update prediction for highlighted object if needed
    if (this.highlightedObjectId && this.visualizationVisible) {
      this.updatePrediction(this.highlightedObjectId, {
        forceRecalculate: false,
        timeScale: visualSettings.timeScale,
        predictionSteps: visualSettings.predictionSteps,
      });
    }
  }

  /**
   * Updates or creates a prediction line for a specific object.
   */
  updatePrediction(
    objectId: string,
    options: {
      forceRecalculate: boolean;
      timeScale?: number;
      predictionSteps?: number;
    },
  ): boolean {
    if (!options.forceRecalculate) {
      return false;
    }

    if (this.isCalculating) {
      // Don't start a new calculation if one is already running
      return false;
    }

    this.isCalculating = true;

    // Calculate prediction trajectory using our modular calculator
    this.calculator
      .calculatePredictionTrajectory(objectId)
      .then((result: { points: any[]; timestamps: number[] }) => {
        this.isCalculating = false;
        if (result.points.length > 0) {
          // Convert OSVector3 points to THREE.Vector3 for rendering
          const threePoints = result.points.map((p) => p.toThreeJS());

          // Start animation
          this.startAnimation(objectId, threePoints);

          // Update labels
          this.labels.updatePredictionLabels(threePoints, result.timestamps);
        }
      })
      .catch((error: any) => {
        this.isCalculating = false;
        console.error("Error calculating prediction trajectory:", error);
      });

    return true;
  }

  /**
   * Starts animation for a prediction line.
   */
  private startAnimation(objectId: string, newPoints: THREE.Vector3[]): void {
    if (newPoints.length === 0) {
      this.removePrediction(objectId);
      return;
    }

    // Draw the prediction line
    this.drawPredictionLine(objectId, newPoints);

    // Get the line for animation
    const line = this.getPredictionLine(objectId);
    if (line) {
      this.animation.startAnimation(objectId, newPoints, line);
    }
  }

  /**
   * Draws or updates the prediction line for an object.
   */
  private drawPredictionLine(
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
      line.frustumCulled = true;

      // Add prediction lines to the dedicated prediction lines group
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
   * Highlights a specific object's prediction visualization.
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    this.highlightedObjectId = objectId;
    this.highlightColor = color;

    if (objectId) {
      // Configure prediction labels for the highlighted object
      this.labels.configurePredictionLabels(objectId);

      // Update prediction line visibility
      this.updatePredictionLineVisibility(objectId);
    } else {
      // Clear all predictions and labels when no object is highlighted
      this.clearAllPredictionHighlights();
    }
  }

  /**
   * Sets the visibility of all prediction visualizations.
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;
    this.predictionLines.forEach((line) => {
      line.visible = visible;
    });
    this.labels.setVisibility(visible);
  }

  /**
   * Sets the visibility of trajectory prediction visualizations.
   */
  setPredictionVisibility(visible: boolean): void {
    this.setVisibility(visible);
  }

  /**
   * Removes a specific prediction line from the scene.
   */
  removePrediction(objectId: string): void {
    const line = this.predictionLines.get(objectId);
    if (line) {
      // Remove from the prediction lines group
      this.predictionLinesGroup.remove(line);

      this.lineBuilder.disposeLine(line);
      this.predictionLines.delete(objectId);
    }
    this.labels.hideAllLabels();
  }

  /**
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.predictionLines.forEach((_, id) => this.removePrediction(id));
    this.labels.hideAllLabels();
  }

  /**
   * Updates the visibility of prediction lines based on highlighting.
   */
  private updatePredictionLineVisibility(highlightedObjectId: string): void {
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
  private clearAllPredictionHighlights(): void {
    // Hide all prediction lines
    this.predictionLines.forEach((line) => {
      line.visible = false;
    });
    this.labels.clearAllPredictionLabels();
  }

  /**
   * Sets the Layer2DManager instance for creating labels.
   */
  setLayer2DManager(manager: Layer2DManager): void {
    this.layer2DManager = manager;
    this.labels.setLayer2DManager(manager);
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
   * Changes the prediction duration.
   */
  setPredictionDuration(duration: number): void {
    if (this.predictionDuration !== duration) {
      this.predictionDuration = duration;
      this.calculator.setPredictionDuration(duration);
      this.clearAllPredictions();
    }
  }

  /**
   * Changes the number of prediction steps.
   */
  setPredictionSteps(steps: number): void {
    if (this.predictionSteps !== steps) {
      this.predictionSteps = steps;
      this.calculator.setPredictionSteps(steps);
      this.clearAllPredictions();
    }
  }

  /**
   * Gets performance statistics.
   */
  getPerformanceStats(): {
    predictionLinesCount: number;
  } {
    return {
      predictionLinesCount: this.predictionLines.size,
    };
  }

  /**
   * Cleans up resources used by this renderer.
   */
  dispose(): void {
    this.clearAllPredictions();
    this.lineBuilder.clear();
    this.labels.dispose();
    this.animation.dispose();
  }
}
