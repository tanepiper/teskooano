import {
  predictTrajectory,
  type SimulationParameters,
  calculateKeplerianStateAtTime,
} from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import * as THREE from "three";
import { PredictionDataPool } from "./PredictionDataPool.worker";

const POOL_SIZE = 500; // Max number of physics bodies
const dataPool = new PredictionDataPool(POOL_SIZE);

/**
 * Predicts trajectory using ideal Keplerian orbits (matching main simulation in ideal mode)
 */
function predictIdealTrajectory(
  targetBodyId: string,
  allBodiesInitialStates: any[],
  duration_s: number,
  steps: number,
  simulationParameters: SimulationParameters,
  relativeToBodyId?: string,
  scaleToSceneUnits: boolean = true,
): { point: OSVector3; timestamp: number }[] {
  if (
    steps <= 0 ||
    !allBodiesInitialStates ||
    allBodiesInitialStates.length === 0
  ) {
    return [];
  }

  const dt = duration_s / steps;
  const predictedPoints: { point: OSVector3; timestamp: number }[] = [];

  // Get the target body's orbital parameters
  const targetOrbitalParams =
    simulationParameters.orbitalParameters?.get(targetBodyId);
  if (!targetOrbitalParams) {
    console.warn(`No orbital parameters found for target body ${targetBodyId}`);
    return [];
  }

  // Get the parent body id
  const parentId = simulationParameters.parentIds?.get(targetBodyId);
  if (!parentId) {
    console.warn(`No parent found for target body ${targetBodyId}`);
    return [];
  }

  // Find parent's initial state
  const parentInitialState = allBodiesInitialStates.find(
    (b) => b.id === parentId,
  );
  if (!parentInitialState) {
    console.warn(`Parent body ${parentId} not found in initial states`);
    return [];
  }

  // Calculate trajectory points using Keplerian orbits
  const baseTime = simulationParameters.currentTime_s || 0;

  for (let i = 0; i <= steps; i++) {
    const currentTime = baseTime + i * dt;

    // Calculate ideal Keplerian state at this time
    const { position, velocity } = calculateKeplerianStateAtTime(
      targetOrbitalParams,
      currentTime,
    );

    // Add parent's position to get world coordinates
    const worldPosition = position.add(parentInitialState.position_m);

    // Handle relative coordinates if specified
    let finalPoint = worldPosition;
    if (relativeToBodyId) {
      const relativeBodyState = allBodiesInitialStates.find(
        (b) => b.id === relativeToBodyId,
      );
      if (relativeBodyState) {
        // For relative coordinates, we need to calculate the parent's position at this time too
        const relativeParentId =
          simulationParameters.parentIds?.get(relativeToBodyId);
        if (relativeParentId) {
          const relativeParentOrbitalParams =
            simulationParameters.orbitalParameters?.get(relativeToBodyId);
          if (relativeParentOrbitalParams) {
            const relativeParentInitialState = allBodiesInitialStates.find(
              (b) => b.id === relativeParentId,
            );
            if (relativeParentInitialState) {
              const { position: relativePosition } =
                calculateKeplerianStateAtTime(
                  relativeParentOrbitalParams,
                  currentTime,
                );
              const relativeWorldPosition = relativePosition.add(
                relativeParentInitialState.position_m,
              );
              finalPoint = worldPosition.sub(relativeWorldPosition);
            }
          }
        } else {
          // If relative body has no parent, just subtract its initial position
          finalPoint = worldPosition.sub(relativeBodyState.position_m);
        }
      }
    }

    // Scale to scene units if requested
    if (scaleToSceneUnits) {
      finalPoint = finalPoint.multiplyScalar(METERS_TO_SCENE_UNITS);
    }

    predictedPoints.push({
      point: finalPoint,
      timestamp: i * dt,
    });
  }

  return predictedPoints;
}

self.onmessage = (
  e: MessageEvent<{
    objectId: string;
    relativeToBodyId?: string;
    physicsStatesBuffer: Float32Array;
    idMap: Map<string, number>;
    predictionDuration: number;
    predictionSteps: number;
    simulationParameters: SimulationParameters;
  }>,
) => {
  const {
    objectId,
    relativeToBodyId,
    physicsStatesBuffer,
    idMap,
    predictionDuration,
    predictionSteps,
    simulationParameters,
  } = e.data;

  // Update the pool of objects from the flat buffer, avoiding new allocations.
  const hydratedStates = dataPool.updateFromBuffer(physicsStatesBuffer, idMap);

  try {
    // Use the same physics mode as the main simulation
    let predictedResult: { point: OSVector3; timestamp: number }[];

    if (simulationParameters.simulationConfig.mode === "ideal") {
      // Use ideal Keplerian orbits (matching main simulation)
      predictedResult = predictIdealTrajectory(
        objectId,
        hydratedStates,
        predictionDuration,
        predictionSteps,
        simulationParameters,
        relativeToBodyId,
        true, // scaleToSceneUnits
      );
    } else {
      // Use N-body physics simulation
      predictedResult = predictTrajectory(
        objectId,
        hydratedStates,
        predictionDuration,
        predictionSteps,
        { ...simulationParameters, relativeToBodyId, scaleToSceneUnits: true },
      );
    }

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

    // Interpolate timestamps based on the physics simulation's time progression,
    // not arc length. This preserves the correct orbital mechanics timing.
    const smoothedTimestamps: number[] = [];
    const totalDuration = timestamps[timestamps.length - 1];

    for (let i = 0; i < smoothedPoints.length; i++) {
      // Linear interpolation of time based on position in the smoothed array
      const timeProgress = i / (smoothedPoints.length - 1);
      smoothedTimestamps.push(timeProgress * totalDuration);
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
