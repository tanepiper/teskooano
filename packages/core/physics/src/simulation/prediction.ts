import { OSVector3 } from "@teskooano/core-math";
import { type PhysicsStateReal } from "@teskooano/data-types";
import { WasmSpatialPartitioning } from "../spatial/wasm-partitioning";
import { velocityVerletIntegrate } from "../integrators";
import { CelestialType } from "@teskooano/data-types";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-values";
import { calculateNewtonianGravitationalForce } from "../forces/gravity";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";

export type PredictedPoint = {
  point: OSVector3;
  timestamp: number;
};

/**
 * Predicts the future trajectory of a specific body using the same physics
 * calculation methods as the main simulation.
 *
 * @param targetBodyId - The ID of the body whose trajectory is being predicted.
 * @param allBodiesInitialStates - An array containing the initial PhysicsStateReal for all bodies.
 * @param duration_s - The total time duration (in seconds) for which to predict the trajectory.
 * @param steps - The number of discrete time steps to use for the integration.
 * @param options - Optional parameters for the prediction.
 * @returns An array of OSVector3 points representing the predicted trajectory in meters.
 */
export function predictTrajectory(
  targetBodyId: string | number,
  allBodiesInitialStates: PhysicsStateReal[],
  duration_s: number,
  steps: number,
  options: {
    relativeToBodyId?: string | number;
    octreeSize?: number;
    barnesHutTheta?: number;
    scaleToSceneUnits?: boolean;
    collisionDetection?: boolean;
    bodyTypes?: Map<string | number, CelestialType>;
    radii?: Map<string | number, number>;
  } = {},
): PredictedPoint[] {
  const {
    relativeToBodyId,
    octreeSize = 5e13,
    barnesHutTheta = 0.7,
    scaleToSceneUnits = true,
    collisionDetection = false,
    bodyTypes = new Map(),
    radii = new Map(),
  } = options;

  if (
    steps <= 0 ||
    !allBodiesInitialStates ||
    allBodiesInitialStates.length === 0
  ) {
    return [];
  }

  const dt = duration_s / steps;
  const predictedPoints: PredictedPoint[] = [];
  const relativeObjectPath: OSVector3[] = [];

  // Initialize WASM spatial partitioning
  const wasmSpatialPartitioning = new WasmSpatialPartitioning(1e12); // 1 trillion meters

  // Make a deep copy of the initial states to avoid modifying the original data
  let currentStates: PhysicsStateReal[] = allBodiesInitialStates.map(
    (body) => ({
      ...body,
      position_m: body.position_m.clone(),
      velocity_mps: body.velocity_mps.clone(),
    }),
  );
  // Second array for state swapping to avoid reallocation
  let nextStates: PhysicsStateReal[] = currentStates.map((body) => ({
    ...body,
    position_m: body.position_m.clone(),
    velocity_mps: body.velocity_mps.clone(),
  }));

  const targetBodyIndex = currentStates.findIndex((b) => b.id === targetBodyId);
  const relativeBodyIndex = relativeToBodyId
    ? currentStates.findIndex((b) => b.id === relativeToBodyId)
    : -1;

  if (targetBodyIndex === -1) {
    console.warn(`Target body ID ${targetBodyId} not found in initial states.`);
    return [];
  }

  // Add the initial position
  const initialTargetState = currentStates[targetBodyIndex];
  if (initialTargetState.position_m) {
    predictedPoints.push({
      point: initialTargetState.position_m.clone(),
      timestamp: 0,
    });
  } else {
    console.warn(`Initial target position missing for ${targetBodyId}`);
    return [];
  }

  if (relativeBodyIndex !== -1) {
    relativeObjectPath.push(
      currentStates[relativeBodyIndex].position_m.clone(),
    );
  }

  const accelerations = new Map<string | number, OSVector3>();
  const reusableAccVector = new OSVector3(0, 0, 0);

  // Simulation loop
  for (let i = 0; i < steps; i++) {
    // Update WASM spatial partitioning with current states
    wasmSpatialPartitioning.update(currentStates);

    // Calculate accelerations using WASM spatial partitioning
    accelerations.clear();
    for (const body of currentStates) {
      const neighborIds = wasmSpatialPartitioning.findNeighbors(body.id);
      const netForce = new OSVector3(0, 0, 0);

      // Create a map for fast body lookup
      const bodyMap = new Map<string | number, PhysicsStateReal>();
      for (const b of currentStates) {
        bodyMap.set(b.id, b);
      }

      // Calculate forces from all neighboring bodies
      for (const neighborId of neighborIds) {
        if (neighborId === body.id) continue; // Skip self-interaction

        const neighborBody = bodyMap.get(neighborId);
        if (!neighborBody) continue;

        const force = calculateNewtonianGravitationalForce(
          neighborBody,
          body,
          GRAVITATIONAL_CONSTANT,
        );
        netForce.add(force);
      }

      reusableAccVector.set(0, 0, 0);
      if (body.mass_kg !== 0) {
        reusableAccVector.copy(netForce).multiplyScalar(1 / body.mass_kg);
      }
      accelerations.set(body.id, reusableAccVector.clone());
    }

    // Integration
    let integrationError = false;

    for (let j = 0; j < currentStates.length; j++) {
      const body = currentStates[j];
      if (integrationError) break;

      const acceleration = accelerations.get(body.id);
      if (!acceleration) {
        console.error(`Acceleration calculation failed for body ${body.id}`);
        integrationError = true;
        break;
      }

      const calculateNewAcceleration = (
        stateGuess: PhysicsStateReal,
      ): OSVector3 => {
        const neighborIds = wasmSpatialPartitioning.findNeighbors(
          stateGuess.id,
        );
        const netForce = new OSVector3(0, 0, 0);

        // Create a map for fast body lookup
        const bodyMap = new Map<string | number, PhysicsStateReal>();
        for (const b of currentStates) {
          bodyMap.set(b.id, b);
        }

        // Calculate forces from all neighboring bodies
        for (const neighborId of neighborIds) {
          if (neighborId === stateGuess.id) continue; // Skip self-interaction

          const neighborBody = bodyMap.get(neighborId);
          if (!neighborBody) continue;

          const force = calculateNewtonianGravitationalForce(
            neighborBody,
            stateGuess,
            GRAVITATIONAL_CONSTANT,
          );
          netForce.add(force);
        }

        reusableAccVector.set(0, 0, 0);
        if (stateGuess.mass_kg !== 0) {
          reusableAccVector
            .copy(netForce)
            .multiplyScalar(1 / stateGuess.mass_kg);
        }
        return reusableAccVector;
      };

      const resultState = velocityVerletIntegrate(
        body,
        acceleration,
        calculateNewAcceleration,
        dt,
      );

      nextStates[j].position_m.copy(resultState.position_m);
      nextStates[j].velocity_mps.copy(resultState.velocity_mps);

      if (
        !nextStates[j].position_m.isFinite() ||
        !nextStates[j].velocity_mps.isFinite()
      ) {
        console.error(
          `Non-finite state detected for body ${body.id}. Aborting prediction.`,
        );
        integrationError = true;
        break;
      }
    }

    if (integrationError) {
      console.warn(`Prediction aborted at step ${i} due to integration error.`);
      break;
    }

    // Handle simple collision detection if enabled
    if (collisionDetection && radii.size > 0 && bodyTypes.size > 0) {
      for (let j = 0; j < nextStates.length; j++) {
        const bodyA = nextStates[j];
        const radiusA = radii.get(bodyA.id) || 0;

        for (let k = j + 1; k < nextStates.length; k++) {
          const bodyB = nextStates[k];
          const radiusB = radii.get(bodyB.id) || 0;

          const distance = bodyA.position_m.distanceTo(bodyB.position_m);
          const combinedRadii = radiusA + radiusB;

          if (distance < combinedRadii) {
            // Collision detected that would involve our target
            if (bodyA.id === targetBodyId || bodyB.id === targetBodyId) {
              console.warn(
                `Collision predicted at step ${i} for target body. Ending prediction.`,
              );
              integrationError = true;
              break;
            }
          }
        }
        if (integrationError) break;
      }
    }

    // Add the new prediction point for the target
    const targetNextState = nextStates[targetBodyIndex];
    if (targetNextState) {
      predictedPoints.push({
        point: targetNextState.position_m.clone(),
        timestamp: (i + 1) * dt,
      });
    } else {
      console.warn(`Target state not found after step ${i}. Aborting.`);
      break;
    }

    // Add the new position for the relative body
    if (relativeBodyIndex !== -1) {
      const relativeNextState = nextStates[relativeBodyIndex];
      if (relativeNextState) {
        relativeObjectPath.push(relativeNextState.position_m.clone());
      }
    }

    // Swap state arrays for the next iteration
    const temp = currentStates;
    currentStates = nextStates;
    nextStates = temp;
  }

  let finalPoints = predictedPoints;

  // If a relative body is specified, transform all points.
  if (
    relativeToBodyId &&
    relativeObjectPath.length === predictedPoints.length
  ) {
    finalPoints = predictedPoints.map((p, i) => {
      const relativePoint = relativeObjectPath[i];
      return {
        point: p.point.sub(relativePoint),
        timestamp: p.timestamp,
      };
    });
  }

  // If scaling is requested, apply it.
  if (scaleToSceneUnits) {
    return finalPoints.map(({ point, timestamp }) => ({
      point: point.multiplyScalar(METERS_TO_SCENE_UNITS),
      timestamp,
    }));
  }

  return finalPoints;
}

/**
 * Export the Verlet prediction function to maintain backwards compatibility
 */
export const predictVerletTrajectory = predictTrajectory;
