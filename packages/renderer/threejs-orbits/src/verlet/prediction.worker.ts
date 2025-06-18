import { predictTrajectory } from "@teskooano/core-physics";
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
  }>,
) => {
  const {
    objectId,
    physicsStatesBuffer,
    idMap,
    predictionDuration,
    predictionSteps,
  } = e.data;

  // Update the pool of objects from the flat buffer, avoiding new allocations.
  const hydratedStates = dataPool.updateFromBuffer(physicsStatesBuffer, idMap);

  try {
    const newPoints = predictTrajectory(
      objectId,
      hydratedStates,
      predictionDuration,
      predictionSteps,
      {},
    );

    // Post the results back to the main thread
    self.postMessage({
      success: true,
      objectId: objectId,
      points: newPoints.map((p) => [p.x, p.y, p.z]), // Serialize OSVector3
    });
  } catch (error) {
    console.error("Error during trajectory prediction in worker:", error);
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
