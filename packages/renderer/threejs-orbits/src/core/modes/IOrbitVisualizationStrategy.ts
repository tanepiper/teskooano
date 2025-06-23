import type { RenderableCelestialObject } from "@teskooano/data-types";
import type * as THREE from "three";

export interface IOrbitVisualizationStrategy {
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: {
      timeScale: number;
      predictionSteps: number;
      predictionDuration: number;
    },
    deltaTime: number,
  ): void;

  highlight(objectId: string | null, color: THREE.Color): void;

  setVisibility(visible: boolean): void;

  setPredictionVisibility(visible: boolean): void;

  dispose(): void;
}
