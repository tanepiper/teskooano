import * as THREE from "three";
import {
  type RenderableCelestialObject,
  CelestialType,
} from "@teskooano/data-types";
import { StateAccessor, PhysicsStateProvider } from "@teskooano/core-state";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { TrailCurveType, type TrailCurveConfig } from "./TrailManager";
import { Subscription } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import {
  CSS2DLayerType,
  Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import { PredictionLabelLayer } from "@teskooano/renderer-threejs-labels";
import { SECONDS_PER_YEAR } from "@teskooano/data-values";
import { OSVector3 } from "@teskooano/core-math";
import { PredictionCalculator } from "./PredictionCalculator";
import { PredictionRenderer } from "./PredictionRenderer";
import { PredictionLabels } from "./PredictionLabels";
import { PredictionAnimation } from "./PredictionAnimation";

/**
 * Manages the creation and updating of prediction lines showing an object's future trajectory.
 *
 * This is the main orchestrator that delegates to specialized modules:
 * - PredictionCalculator: Core prediction calculation logic
 * - PredictionRenderer: Line rendering and visualization
 * - PredictionLabels: Label management
 * - PredictionAnimation: Animation state management
 *
 * **Prediction Highlighting System:**
 *
 * This manager is part of a multi-level delegation system for highlighting predictions:
 *
 * 1. **CameraManager** (User Interaction) - Called when user focuses on an object
 * 2. **RenderingOrchestrator** (Delegation) - Routes the request to the appropriate manager
 * 3. **OrbitsManager** (Strategy Selection) - Delegates to the active visualization strategy
 * 4. **PredictionManager** (Implementation) - Handles the actual highlighting logic
 *
 * **Highlighting Behavior:**
 * - When an object is highlighted: Shows only that object's prediction line and labels
 * - When no object is highlighted: Hides all prediction lines and labels
 * - Only works in N-Body simulation mode (not available for ideal orbits)
 *
 * **Animation Support:**
 * - Smooth transitions between prediction states using lerp interpolation
 * - Animation progress is tracked per-frame in the update() method
 * - Supports both instant and animated prediction line updates
 */
export class PredictionManager {
  /** Map storing prediction lines, keyed by celestial object ID */
  public predictionLines: Map<string, THREE.Line> = new Map();

  /** Flag to prevent multiple simultaneous calculations */
  private isCalculating: boolean = false;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** The manager for 2D labels */
  private layer2DManager: Layer2DManager | null = null;

  /** Duration to predict into the future (in seconds), synced from global state. */
  private predictionDuration: number = 0;

  /** Number of steps to use for prediction calculations */
  private predictionSteps: number = 60;

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Subscription to state changes */
  private stateSubscription: Subscription | undefined;

  /** Group for all orbit-related lines (prediction, trail, etc.) */
  /** Dedicated group for prediction lines within the orbit lines group */
  private predictionLinesGroup: THREE.Group;

  // --- Modular Components ---
  private calculator: PredictionCalculator;
  private renderer: PredictionRenderer;
  private labels: PredictionLabels;
  private animation: PredictionAnimation;

  /**
   * Creates a new PredictionManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   * @param curveConfig - Optional curve configuration for prediction interpolation
   * @param predictionLinesGroup - Optional shared group for all orbit-related lines
   */
  constructor(
    objectManager: ObjectManager,
    curveConfig: TrailCurveConfig,
    predictionLinesGroup: THREE.Group,
  ) {
    this.objectManager = objectManager;
    this.predictionLinesGroup = predictionLinesGroup;

    // Initialize modular components
    this.calculator = new PredictionCalculator();
    this.renderer = new PredictionRenderer(
      objectManager,
      curveConfig,
      predictionLinesGroup,
    );
    this.labels = new PredictionLabels(objectManager, predictionLinesGroup);
    this.animation = new PredictionAnimation();

    this.initializeStateSubscriptions();
  }

  /**
   * Subscribes to the global simulation state to keep prediction settings in sync.
   */
  private initializeStateSubscriptions(): void {
    this.stateSubscription = StateAccessor.getSimulationStateStream()
      .pipe(
        map((state) => state.visualSettings.predictionDuration),
        distinctUntilChanged(),
      )
      .subscribe((durationInYears: number) => {
        const newDurationInSeconds = durationInYears * SECONDS_PER_YEAR;
        if (this.predictionDuration !== newDurationInSeconds) {
          this.predictionDuration = newDurationInSeconds;
          this.calculator.setPredictionDuration(newDurationInSeconds);
          // When the duration changes, all existing lines are invalid.
          this.clearAllPredictions();
        }
      });
  }

  /**
   * Updates or creates a prediction line for a specific object.
   *
   * @param objectId - ID of the object to predict for
   * @param options - Options for the prediction calculation.
   * @returns True if prediction was successfully created/updated
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

    const fullObjectsMap = StateAccessor.getCurrentCelestialObjects();
    const targetObject = fullObjectsMap[objectId];

    // Check if the target object exists
    if (!targetObject) {
      this.removePrediction(objectId);
      return false;
    }

    const targetPhysicsState =
      PhysicsStateProvider.getPhysicsState(targetObject);
    if (!targetPhysicsState) {
      this.removePrediction(objectId);
      return false;
    }

    const renderableObjectsMap = StateAccessor.getCurrentRenderableObjects();
    const renderableTargetObject = renderableObjectsMap[objectId];

    if (!renderableTargetObject) {
      this.removePrediction(objectId);
      return false;
    }

    const predictionSteps = this.calculator.calculatePredictionSteps(
      renderableTargetObject,
      renderableObjectsMap,
    );

    // Determine the reference body for relative coordinates
    const relativeToBodyId = this.calculator.determineRelativeBodyId(objectId);

    this.isCalculating = true;

    // Calculate prediction trajectory using our modular calculator
    this.calculator
      .calculatePredictionTrajectory(objectId, relativeToBodyId)
      .then(({ points, timestamps }) => {
        this.isCalculating = false;
        if (points.length > 0) {
          // Convert OSVector3 points to THREE.Vector3 for rendering
          const threePoints = points.map((p) => p.toThreeJS());

          // Update current state for labels (position and velocity)
          const currentPosition = targetPhysicsState.position_m.toThreeJS();
          const currentVelocity = targetPhysicsState.velocity_mps.toThreeJS();
          const threeJsObject = this.objectManager.getObject(objectId);
          const currentSimulationTime =
            StateAccessor.getCurrentSimulationState().time;
          this.labels.updateCurrentState(
            currentPosition,
            currentVelocity,
            renderableTargetObject,
            threeJsObject || undefined,
            currentSimulationTime,
          );

          // Start animation
          this.startAnimation(objectId, threePoints);

          // Update labels
          this.labels.updatePredictionLabels(threePoints, timestamps);
        }
      })
      .catch((error) => {
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
    this.renderer.drawPredictionLine(objectId, newPoints);

    // Get the line for animation
    const line = this.renderer.getPredictionLine(objectId);
    if (line) {
      this.animation.startAnimation(objectId, newPoints, line);
    }
  }

  /**
   * Removes a specific prediction line from the scene.
   *
   * @param objectId - ID of the object whose prediction should be removed
   */
  removePrediction(objectId: string): void {
    this.renderer.removePrediction(objectId);
    this.labels.hideAllLabels();
  }

  /**
   * Sets the visibility state for all prediction lines.
   *
   * @param visible - Whether predictions should be visible
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;
    this.renderer.setVisibility(visible);
    this.labels.setVisibility(visible);
  }

  /**
   * Changes the prediction duration.
   *
   * @param duration - New duration in seconds
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
   *
   * @param steps - New number of steps
   */
  setPredictionSteps(steps: number): void {
    if (this.predictionSteps !== steps) {
      this.predictionSteps = steps;
      this.calculator.setPredictionSteps(steps);
      this.clearAllPredictions();
    }
  }

  /**
   * Sets the curve configuration for prediction interpolation.
   * @param config - The new curve configuration
   */
  setCurveConfig(config: TrailCurveConfig): void {
    this.renderer.setCurveConfig(config);
  }

  /**
   * Gets the current curve configuration.
   * @returns The current curve configuration
   */
  getCurveConfig(): TrailCurveConfig {
    return this.renderer.getCurveConfig();
  }

  /**
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.renderer.clearAllPredictions();
    this.labels.hideAllLabels();
  }

  /**
   * Highlights prediction lines for a specific object, hiding all others.
   *
   * This method is called when a user focuses on a celestial object (e.g., via camera focus).
   * It performs the following actions:
   * 1. Updates the internal highlighted object ID
   * 2. Configures prediction labels for the highlighted object
   * 3. Hides all prediction lines except for the highlighted object
   * 4. Shows the highlighted object's prediction line if it exists
   *
   * When objectId is null, all predictions and labels are hidden.
   *
   * @param objectId - ID of the object to show prediction for, or null to hide all predictions
   */
  highlightPrediction(objectId: string | null): void {
    // Store the highlighted object ID for animation tracking
    this.animation.setHighlightedObjectId(objectId);

    if (objectId) {
      // Configure prediction labels for the highlighted object
      this.labels.configurePredictionLabels(objectId);

      // Update prediction line visibility
      this.renderer.updatePredictionLineVisibility(objectId);
    } else {
      // Clear all predictions and labels when no object is highlighted
      this.clearAllPredictionHighlights();
    }
  }

  /**
   * Clears all prediction highlights and labels.
   */
  private clearAllPredictionHighlights(): void {
    this.renderer.clearAllPredictionHighlights();
    this.labels.clearAllPredictionLabels();
  }

  /**
   * Sets the Layer2DManager instance for creating labels.
   * @param manager - The Layer2DManager instance.
   */
  public setLayer2DManager(manager: Layer2DManager): void {
    this.layer2DManager = manager;
    this.labels.setLayer2DManager(manager);
  }

  /**
   * Gets the prediction labels.
   */
  public getPredictionLabels() {
    return this.labels.getPredictionLabels();
  }

  /**
   * Cleans up all prediction lines and releases resources.
   */
  dispose(): void {
    this.stateSubscription?.unsubscribe();
    this.clearAllPredictions();
    this.renderer.dispose();
    this.labels.dispose();
    this.animation.dispose();
  }

  /**
   * Main update loop, called every frame to drive animation.
   * @param deltaTime - The time elapsed since the last frame.
   */
  public update(deltaTime: number): void {
    this.animation.update(deltaTime);

    // Update line during animation if needed
    const highlightedObjectId = this.animation.getHighlightedObjectId();
    if (highlightedObjectId && this.animation.isAnimationRunning()) {
      const line = this.renderer.getPredictionLine(highlightedObjectId);
      if (line) {
        this.animation.updateLineDuringAnimation(line);
      }
    }
  }
}
