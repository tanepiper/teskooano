import * as THREE from "three";
import {
  type PhysicsStateReal,
  AU_METERS,
  type RenderableCelestialObject,
  CelestialType,
  CelestialObject,
  CelestialStatus,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";
import { type SimulationParameters } from "@teskooano/core-physics";
import {
  StateAccessor,
  simulationStateService,
  physicsSystemAdapter,
  PhysicsStateProvider,
} from "@teskooano/core-state";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";
import { Subscription } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import {
  CSS2DLayerType,
  Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import { PredictionLabelLayer } from "@teskooano/renderer-threejs-labels";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const TIME_MARKERS = [
  3600, // 1h
  3600 * 6, // 6h
  3600 * 12, // 12h
  86400, // 1d
  86400 * 7, // 7d
  86400 * 30, // 30d
  86400 * 60, // 60d
  86400 * 90, // 90d
  86400 * 180, // 180d
  SECONDS_PER_YEAR, // 1y
];

function formatTimestamp(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)}d`;
  return `${(seconds / 31536000).toFixed(1)}y`;
}

/**
 * Manages the creation and updating of prediction lines showing an object's future trajectory.
 *
 * Prediction lines visualize the expected future path of a celestial object based on
 * the current physics state, simulated using the Verlet integration method.
 */
export class PredictionManager {
  /** Map storing prediction lines, keyed by celestial object ID */
  public predictionLines: Map<string, THREE.Line> = new Map();

  /** Web worker for handling expensive prediction calculations */
  private predictionWorker: Worker | null = null;

  /** Flag to prevent sending new requests while one is in flight */
  private isCalculating: boolean = false;

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineBuilder;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** The manager for 2D labels */
  private layer2DManager: Layer2DManager | null = null;

  /** A fixed pool of reusable label objects for time markers. */
  private predictionLabels: {
    label: CSS2DObject;
    element: HTMLElement;
  }[] = [];

  // --- Animation State ---
  /** The currently displayed points of the prediction line. */
  private currentPoints: THREE.Vector3[] = [];
  /** The target points for the animation. */
  private targetPoints: THREE.Vector3[] = [];
  /** Flag to indicate if the line is currently animating. */
  private isAnimating: boolean = false;
  /** Progress of the current animation (0 to 1). */
  private animationProgress: number = 0;
  /** Duration of the smoothing animation in seconds. */
  private readonly animationDuration: number = 0.5;
  /** ID of the currently highlighted object, to know which line to animate. */
  private highlightedObjectId: string | null = null;
  // -----------------------

  /** Duration to predict into the future (in seconds), synced from global state. */
  private predictionDuration: number = 0;

  /** Number of steps to use for the prediction calculation */
  private predictionSteps: number = 60;

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Subscription to the global simulation state */
  private stateSubscription: Subscription | undefined;

  /**
   * Creates a new PredictionManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineBuilder();

    this.initializeWorker();
    this.initializeStateSubscriptions();
  }

  private initializeWorker(): void {
    // Vite-specific worker instantiation
    this.predictionWorker = new Worker(
      new URL("./prediction.worker.ts", import.meta.url),
      { type: "module" },
    );

    this.predictionWorker.onmessage = (
      e: MessageEvent<{
        success: boolean;
        objectId?: string;
        points?: [number, number, number][];
        timestamps?: number[];
        error?: string;
      }>,
    ) => {
      this.isCalculating = false;
      if (
        e.data.success &&
        e.data.points &&
        e.data.timestamps &&
        e.data.objectId
      ) {
        const objectId = e.data.objectId;
        if (objectId) {
          const newPoints = e.data.points.map(
            (p) => new THREE.Vector3(p[0], p[1], p[2]),
          );
          // Instead of drawing directly, set the target for animation
          this.startAnimation(objectId, newPoints);
          this.updatePredictionLabels(newPoints, e.data.timestamps);
        }
      } else {
        console.error(
          "Prediction worker failed:",
          e.data.error || "Unknown error",
        );
      }
    };

    this.predictionWorker.onerror = (e) => {
      this.isCalculating = false;
      console.error("Error from prediction worker:", e);
    };
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

    const predictionSteps = this.calculatePredictionSteps(
      renderableTargetObject,
      renderableObjectsMap,
    );

    // In multi-star systems, stars move around their barycenter.
    // If we use a moving star as the relative reference, the prediction lines
    // won't match the actual celestial body movement because the reference frame itself is moving.
    // Solution: Use absolute coordinates (relative to origin) in multi-star systems.
    let relativeToBodyId = renderableTargetObject.parentId;

    // Check if this is a multi-star system by looking for multiple stars
    const stars = Object.values(fullObjectsMap).filter(
      (obj) => obj.type === CelestialType.STAR,
    );
    const isMultiStarSystem = stars.length > 1;

    // If we're in a multi-star system and the parent is a star, use absolute coordinates
    if (isMultiStarSystem && relativeToBodyId) {
      const parentObject = fullObjectsMap[relativeToBodyId];
      if (parentObject?.type === CelestialType.STAR) {
        // Use absolute coordinates (relative to origin/barycenter) instead of relative to moving star
        relativeToBodyId = undefined;
      }
    }

    const allCurrentPhysicsStates = Object.values(fullObjectsMap)
      .map((co) => PhysicsStateProvider.getPhysicsState(co))
      .filter((state): state is PhysicsStateReal => !!state);

    // --- Create SimulationParameters for the worker ---
    const radii = new Map<string | number, number>();
    const isStar = new Map<string | number, boolean>();
    const bodyTypes = new Map<string | number, CelestialType>();
    const parentIds = new Map<string | number, string | undefined>();

    Object.values(fullObjectsMap)
      .filter(
        (obj: CelestialObject) =>
          obj.status !== CelestialStatus.DESTROYED &&
          obj.status !== CelestialStatus.ANNIHILATED &&
          !obj.ignorePhysics,
      )
      .forEach((obj: CelestialObject) => {
        const physicsState = PhysicsStateProvider.getPhysicsState(obj);
        if (physicsState) {
          radii.set(obj.id, obj.realRadius_m);
          isStar.set(obj.id, obj.type === CelestialType.STAR);
          bodyTypes.set(obj.id, obj.type);
          parentIds.set(obj.id, obj.parentId);
        }
      });

    const simParams: SimulationParameters = {
      radii,
      isStar,
      bodyTypes,
      parentIds,
      simulationConfig:
        simulationStateService.getSimulationState().simulationConfig,
      orbitalParameters: physicsSystemAdapter.getOrbitalParametersSnapshot(),
      currentTime_s: simulationStateService.getSimulationState().time,
    };
    // ------------------------------------------------

    // Serialize data for the worker to avoid GC churn inside the worker.
    const floatsPerObject = 7; // mass, px, py, pz, vx, vy, vz
    const buffer = new Float32Array(
      allCurrentPhysicsStates.length * floatsPerObject,
    );
    const idMap = new Map<string, number>();

    allCurrentPhysicsStates.forEach((state, index) => {
      idMap.set(state.id, index);
      const offset = index * floatsPerObject;
      buffer[offset] = state.mass_kg;
      buffer[offset + 1] = state.position_m.x;
      buffer[offset + 2] = state.position_m.y;
      buffer[offset + 3] = state.position_m.z;
      buffer[offset + 4] = state.velocity_mps.x;
      buffer[offset + 5] = state.velocity_mps.y;
      buffer[offset + 6] = state.velocity_mps.z;
    });

    this.isCalculating = true;
    this.predictionWorker?.postMessage(
      {
        objectId: objectId,
        relativeToBodyId: relativeToBodyId,
        physicsStatesBuffer: buffer,
        idMap: idMap,
        predictionDuration: this.predictionDuration,
        predictionSteps: predictionSteps,
        simulationParameters: simParams,
      },
      [buffer.buffer],
    ); // Zero-copy transfer of the buffer

    return true;
  }

  /**
   * Calculates the optimal number of steps for a prediction line based on the
   * orbit's size, ensuring a consistent visual density.
   *
   * @param object - The celestial object whose orbit is being predicted.
   * @param allObjects - A map of all renderable objects in the scene.
   * @returns The calculated number of steps, clamped within a min/max range.
   */
  private calculatePredictionSteps(
    object: RenderableCelestialObject,
    allObjects: Record<string, RenderableCelestialObject>,
  ): number {
    const MIN_STEPS = 200;
    const MAX_STEPS = 3000;
    const POINTS_PER_AU_PLANETARY = 500;
    const POINTS_PER_AU_LUNAR = 50000; // High density for moons

    // For moons or any object orbiting another non-star body.
    if (object.parentId) {
      const parent = allObjects[object.parentId];
      if (parent && parent.type !== CelestialType.STAR && parent.position) {
        const distanceToParent_m =
          object.position.distanceTo(parent.position) / METERS_TO_SCENE_UNITS;
        const circumference_au = (2 * Math.PI * distanceToParent_m) / AU_METERS;
        const steps = Math.round(circumference_au * POINTS_PER_AU_LUNAR);
        return Math.max(MIN_STEPS, Math.min(steps, MAX_STEPS));
      }
    }

    // Fallback to original logic for planets orbiting a star.
    if (!object.orbit) {
      return MIN_STEPS;
    }

    const circumferenceAU =
      2 * Math.PI * (object.orbit.realSemiMajorAxis_m / AU_METERS);
    const steps = Math.round(circumferenceAU * POINTS_PER_AU_PLANETARY);

    return Math.max(MIN_STEPS, Math.min(steps, MAX_STEPS));
  }

  private drawPredictionLine(
    objectId: string,
    predictionPoints: THREE.Vector3[],
  ): void {
    if (predictionPoints.length < 2) {
      this.removePrediction(objectId);
      return;
    }

    let line = this.predictionLines.get(objectId);
    const predictionSteps = predictionPoints.length;

    if (!line) {
      const material = SharedMaterials.clone("PREDICTION");
      line = this.lineBuilder.createLine(
        predictionSteps,
        material,
        `prediction-line-${objectId}`,
      );
      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.predictionLines.set(objectId, line);
    }

    this.lineBuilder.updateLine(line, predictionPoints, predictionSteps);
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
    this.hideAllLabels();
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

    // Also toggle label visibility, but only if the main switch is on
    if (!visible) {
      this.hideAllLabels();
    }
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
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.predictionLines.forEach((_, id) => this.removePrediction(id));
    this.hideAllLabels();
  }

  /**
   * Hides prediction lines for all objects except the specified one.
   *
   * @param objectId - ID of the object to show prediction for, or null to hide all
   */
  highlightPrediction(objectId: string | null): void {
    this.highlightedObjectId = objectId;

    const labelLayer = this.layer2DManager?.getLayer(
      CSS2DLayerType.PREDICTION_LABELS,
    ) as PredictionLabelLayer | undefined;

    if (objectId && labelLayer) {
      const coreObject = StateAccessor.getCelestialObject(objectId);
      const renderableObject =
        StateAccessor.getCurrentRenderableObjects()[objectId];
      const threeJsObject = this.objectManager.getObject(objectId);
      const physicsState = coreObject
        ? PhysicsStateProvider.getPhysicsState(coreObject)
        : null;
      const velocity = physicsState?.velocity_mps.length() || 0;

      labelLayer.setActivePredictionObject(
        renderableObject,
        threeJsObject,
        velocity,
      );

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
      // If no object is highlighted, clear the active prediction object
      labelLayer?.setActivePredictionObject(null, null, null);
      // Hide all predictions and all labels
      this.predictionLines.forEach((line) => {
        line.visible = false;
      });
      this.hideAllLabels();
    }
  }

  /**
   * Sets the Layer2DManager instance for creating labels.
   * @param manager - The Layer2DManager instance.
   */
  public setLayer2DManager(manager: Layer2DManager): void {
    this.layer2DManager = manager;
    // Ensure the layer is registered and create the reusable labels
    this.initializeLabels();
  }

  private initializeLabels(): void {
    if (!this.layer2DManager) return;
    this.disposeLabels(); // Clear any existing labels first

    const labelLayer =
      this.layer2DManager.getLayer(CSS2DLayerType.PREDICTION_LABELS) ||
      new PredictionLabelLayer(this.objectManager.getScene());

    if (!this.layer2DManager.getLayer(CSS2DLayerType.PREDICTION_LABELS)) {
      this.layer2DManager.registerLayer(
        CSS2DLayerType.PREDICTION_LABELS,
        labelLayer,
      );
    }

    TIME_MARKERS.forEach((markerTime) => {
      const labelId = `prediction-label-${markerTime}`;
      const labelText = formatTimestamp(markerTime);
      const label = (labelLayer as PredictionLabelLayer).addLabel(
        labelId,
        new THREE.Vector3(), // Initial position
        labelText,
        markerTime,
      );
      label.visible = false; // Initially hidden
      this.predictionLabels.push({ label, element: label.element });
    });
  }

  public getPredictionLabels(): { label: CSS2DObject; element: HTMLElement }[] {
    return this.predictionLabels;
  }

  private updatePredictionLabels(
    points: THREE.Vector3[],
    timestamps: number[],
  ): void {
    if (
      !this.layer2DManager ||
      points.length < 2 ||
      this.predictionLabels.length === 0
    ) {
      return;
    }

    const totalDuration = timestamps[timestamps.length - 1];

    this.predictionLabels.forEach(({ label }, index) => {
      const markerTime = TIME_MARKERS[index];
      if (markerTime > totalDuration) {
        label.visible = false;
        return; // Don't create labels beyond the prediction duration
      }

      // Find the segment where our markerTime falls. Instead of a strict
      // bounding check that can fail with floating point issues, we find
      // the last timestamp that is less than or equal to our target time.
      let segmentIndex = -1;
      // We iterate up to the second-to-last item because we need a segment [j, j+1].
      for (let j = 0; j < timestamps.length - 1; j++) {
        if (timestamps[j] <= markerTime) {
          segmentIndex = j;
        } else {
          // Since timestamps are sorted, we can break as soon as we've passed the marker.
          break;
        }
      }

      if (segmentIndex !== -1) {
        // The segment is [segmentIndex, segmentIndex + 1]
        const t0 = timestamps[segmentIndex];
        const t1 = timestamps[segmentIndex + 1];
        const p0 = points[segmentIndex];
        const p1 = points[segmentIndex + 1];

        // Ensure we have valid points to work with
        if (!p0 || !p1) {
          label.visible = false;
          return;
        }

        // Avoid division by zero if timestamps are identical
        const segmentDuration = t1 - t0;
        if (segmentDuration === 0) {
          label.visible = false;
          return;
        }

        // Calculate interpolation factor, ensuring it's clamped between 0 and 1
        const t = Math.max(0, Math.min(1, (markerTime - t0) / segmentDuration));

        // Interpolate position
        const localPosition = p0.clone().lerp(p1, t);
        label.position.copy(localPosition);
        label.userData.localPosition = localPosition;
        label.visible = this.visualizationVisible;
      } else {
        // This case happens if markerTime is smaller than the very first timestamp.
        label.visible = false;
      }
    });
  }

  private hideAllLabels(): void {
    this.predictionLabels.forEach(({ label }) => {
      label.visible = false;
    });
  }

  private disposeLabels(): void {
    if (!this.layer2DManager) return;
    this.predictionLabels.forEach(({ label }) => {
      label.removeFromParent();
    });
    this.predictionLabels = [];
  }

  /**
   * Cleans up all prediction lines and releases resources.
   */
  dispose(): void {
    this.stateSubscription?.unsubscribe();
    this.predictionWorker?.terminate();
    this.clearAllPredictions();
    this.lineBuilder.clear();
    this.disposeLabels();
  }

  /**
   * Main update loop, called every frame to drive animation.
   * @param deltaTime - The time elapsed since the last frame.
   */
  public update(deltaTime: number): void {
    if (!this.isAnimating) return;

    this.animationProgress += deltaTime;
    const t = Math.min(this.animationProgress / this.animationDuration, 1);

    // Ensure we have a line to update
    const line = this.predictionLines.get(this.highlightedObjectId || "");
    if (!line) {
      this.isAnimating = false;
      return;
    }

    const interpolatedPoints = this.currentPoints.map((p, i) => {
      if (this.targetPoints[i]) {
        return p.clone().lerp(this.targetPoints[i], t);
      }
      return p; // Should not happen if arrays are same length
    });

    this.lineBuilder.updateLine(
      line,
      interpolatedPoints,
      interpolatedPoints.length,
    );

    if (t >= 1) {
      this.isAnimating = false;
      this.currentPoints = this.targetPoints;
    }
  }

  private startAnimation(objectId: string, newPoints: THREE.Vector3[]): void {
    if (newPoints.length === 0) {
      this.removePrediction(objectId);
      return;
    }

    // If there's no current line or points, draw it instantly.
    if (
      !this.predictionLines.has(objectId) ||
      this.currentPoints.length === 0
    ) {
      this.currentPoints = newPoints;
      this.targetPoints = newPoints;
      this.drawPredictionLine(objectId, newPoints);
      return;
    }

    // Ensure arrays are the same length for interpolation
    if (this.currentPoints.length !== newPoints.length) {
      // If lengths differ, we can't smoothly animate. Just snap to the new line.
      // A more advanced solution might resample the curves to match point counts.
      this.currentPoints = newPoints;
      this.drawPredictionLine(objectId, newPoints);
    }

    this.targetPoints = newPoints;
    this.animationProgress = 0;
    this.isAnimating = true;
  }
}
