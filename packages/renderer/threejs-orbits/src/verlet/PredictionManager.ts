import * as THREE from "three";
import { PhysicsStateReal } from "@teskooano/core-physics";
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

  /** Web worker for handling expensive prediction calculations */
  private predictionWorker: Worker | null = null;

  /** Flag to prevent sending new requests while one is in flight */
  private isCalculating: boolean = false;

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineBuilder;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Duration to predict into the future (in seconds) */
  private predictionDuration: number = 3600 * 24; // 24 hours

  /** Number of steps to use for the prediction calculation */
  private predictionSteps: number = 60;

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

    this.initializeWorker();
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
        error?: string;
      }>,
    ) => {
      this.isCalculating = false;
      if (e.data.success && e.data.points && e.data.objectId) {
        const objectId = e.data.objectId;
        if (objectId) {
          const predictionPointsTHREE = e.data.points.map(
            (p) => new THREE.Vector3(p[0], p[1], p[2]),
          );
          this.drawPredictionLine(objectId, predictionPointsTHREE);
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
      predictionDuration?: number;
    },
  ): boolean {
    if (!options.forceRecalculate) {
      return false;
    }

    if (this.isCalculating) {
      // Don't start a new calculation if one is already running
      return false;
    }

    const fullObjectsMap = getCelestialObjects();
    const targetObject = fullObjectsMap[objectId];

    if (!targetObject?.physicsStateReal) {
      this.removePrediction(objectId);
      return false;
    }

    const allCurrentPhysicsStates = Object.values(fullObjectsMap)
      .map((co) => co.physicsStateReal)
      .filter((state): state is PhysicsStateReal => !!state);

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
        objectId,
        physicsStatesBuffer: buffer,
        idMap: idMap,
        predictionDuration:
          options.predictionDuration || this.predictionDuration,
        predictionSteps: options.predictionSteps || this.predictionSteps,
      },
      [buffer.buffer],
    ); // Zero-copy transfer of the buffer

    return true;
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

    if (
      line.material instanceof THREE.LineBasicMaterial &&
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
   * Clears all prediction lines.
   */
  clearAllPredictions(): void {
    this.predictionLines.forEach((_, id) => this.removePrediction(id));
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
    this.predictionWorker?.terminate();
    this.clearAllPredictions();
    this.lineBuilder.clear();
  }
}
