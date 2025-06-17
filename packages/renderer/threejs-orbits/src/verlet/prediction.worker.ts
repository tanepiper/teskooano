import { PhysicsStateReal, predictTrajectory } from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";

self.onmessage = (
  e: MessageEvent<{
    objectId: string;
    physicsStates: PhysicsStateReal[];
    predictionDuration: number;
    predictionSteps: number;
  }>,
) => {
  const { objectId, physicsStates, predictionDuration, predictionSteps } =
    e.data;

  // Re-hydrate plain objects into class instances
  const hydratedStates: PhysicsStateReal[] = physicsStates.map((state) => ({
    ...state,
    position_m: new OSVector3(
      state.position_m.x,
      state.position_m.y,
      state.position_m.z,
    ),
    velocity_mps: new OSVector3(
      state.velocity_mps.x,
      state.velocity_mps.y,
      state.velocity_mps.z,
    ),
  }));

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
