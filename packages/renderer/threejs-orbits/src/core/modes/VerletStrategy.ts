import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { TrailManager } from "../../verlet/TrailManager";
import { PredictionManager } from "../../verlet/PredictionManager";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type * as THREE from "three";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { getSimulationState } from "@teskooano/core-state";

export class VerletStrategy implements IOrbitVisualizationStrategy {
  public trailManager: TrailManager;
  public predictionManager: PredictionManager;
  private highlightedObjectId: string | null = null;
  private trailUpdateCounter: number = 0;
  private readonly trailUpdateFrequency: number = 5;
  private predictionUpdateCounter: number = 0;
  private readonly predictionUpdateFrequency: number = 90;
  private isVisible: boolean = true;

  constructor(objectManager: ObjectManager, layer2DManager?: Layer2DManager) {
    this.trailManager = new TrailManager(objectManager);
    this.predictionManager = new PredictionManager(objectManager);

    if (layer2DManager) {
      this.predictionManager.setLayer2DManager(layer2DManager);
    }
  }

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
      const simulationConfig = getSimulationState().simulationConfig;
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
          // In N-body mode, predictions are relative to parent, so position at parent
          if (object?.parentId) {
            const parent = objects[object.parentId];
            if (parent?.position) {
              line.position.copy(parent.position);
              labels.forEach(({ label }) => {
                if (label.visible && label.userData.localPosition) {
                  label.position
                    .copy(label.userData.localPosition)
                    .add(parent.position);
                }
              });
            }
          } else {
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

  setVisibility(visible: boolean): void {
    this.trailManager.setVisibility(visible);
  }

  setPredictionVisibility(visible: boolean): void {
    this.predictionManager.setVisibility(visible);
  }

  dispose(): void {
    this.trailManager.dispose();
    this.predictionManager.dispose();
  }
}
