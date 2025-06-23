import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { TrailManager } from "../../verlet/TrailManager";
import { PredictionManager } from "../../verlet/PredictionManager";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type * as THREE from "three";

export class VerletStrategy implements IOrbitVisualizationStrategy {
  public trailManager: TrailManager;
  public predictionManager: PredictionManager;
  private highlightedObjectId: string | null = null;
  private trailUpdateCounter: number = 0;
  private readonly trailUpdateFrequency: number = 5;
  private predictionUpdateCounter: number = 0;
  private readonly predictionUpdateFrequency: number = 90;
  private isVisible: boolean = true;

  constructor(objectManager: ObjectManager) {
    this.trailManager = new TrailManager(objectManager);
    this.predictionManager = new PredictionManager(objectManager);
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
