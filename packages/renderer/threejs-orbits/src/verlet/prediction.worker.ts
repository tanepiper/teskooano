import {
  predictTrajectory,
  type SimulationParameters,
} from "@teskooano/core-physics";
import * as THREE from "three";
import { PredictionDataPool } from "./PredictionDataPool.worker";

const POOL_SIZE = 500; // Max number of physics bodies
const dataPool = new PredictionDataPool(POOL_SIZE);

self.onmessage = (
  e: MessageEvent<{
    objectId: string;
    physicsStatesBuffer: Float32Array;
    idMap: Map<string, number>;
    predictionDuration: number;
    predictionSteps: number;
    simulationParameters: SimulationParameters;
  }>,
) => {
  const {
    objectId,
    physicsStatesBuffer,
    idMap,
    predictionDuration,
    predictionSteps,
    simulationParameters,
  } = e.data;

  // Update the pool of objects from the flat buffer, avoiding new allocations.
  const hydratedStates = dataPool.updateFromBuffer(physicsStatesBuffer, idMap);

  try {
    const predictedResult = predictTrajectory(
      objectId,
      hydratedStates,
      predictionDuration,
      predictionSteps,
      simulationParameters,
    );

    if (predictedResult.length < 2) {
      self.postMessage({
        success: true,
        objectId: objectId,
        points: [],
        timestamps: [],
      });
      return;
    }

    // Convert to THREE.Vector3 for spline creation
    const threePoints = predictedResult.map(
      (p) => new THREE.Vector3(p.point.x, p.point.y, p.point.z),
    );
    const timestamps = predictedResult.map((p) => p.timestamp);

    // Create a smooth curve through the points
    const spline = new THREE.CatmullRomCurve3(threePoints);
    const smoothedPoints = spline.getPoints(predictionSteps * 2); // Oversample for smoothness

    // We need to interpolate timestamps as well.
    // This is a simple linear interpolation based on the segment index.
    const smoothedTimestamps: number[] = [];
    const segments = threePoints.length - 1;
    const pointsPerSegment = (predictionSteps * 2) / segments;

    for (let i = 0; i < smoothedPoints.length; i++) {
      const segmentIndex = Math.floor(i / pointsPerSegment);
      const t0 = timestamps[segmentIndex];
      const t1 = timestamps[segmentIndex + 1] || t0;
      const segmentT = (i % pointsPerSegment) / pointsPerSegment;
      smoothedTimestamps.push(t0 + (t1 - t0) * segmentT);
    }

    // Post the results back to the main thread
    self.postMessage({
      success: true,
      objectId: objectId,
      points: smoothedPoints.map((p) => [p.x, p.y, p.z]), // Serialize
      timestamps: smoothedTimestamps,
    });
  } catch (error) {
    console.error("Error during trajectory prediction in worker:", error);
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
