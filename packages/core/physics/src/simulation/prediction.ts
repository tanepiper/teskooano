import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { Octree } from "../spatial/octree";
import { velocityVerletIntegrate } from "../integrators";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

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
    octreeSize?: number;
    barnesHutTheta?: number;
    scaleToSceneUnits?: boolean;
    collisionDetection?: boolean;
    bodyTypes?: Map<string | number, CelestialType>;
    radii?: Map<string | number, number>;
  } = {},
): OSVector3[] {
  const {
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

  const targetBodyIndex = allBodiesInitialStates.findIndex(
    (b) => b.id === targetBodyId,
  );
  if (targetBodyIndex === -1) {
    console.warn(`Target body ID ${targetBodyId} not found in initial states.`);
    return [];
  }

  const dt = duration_s / steps;

  // Pre-allocate arrays and objects to be reused in the loop
  const predictedPointsOS: OSVector3[] = [];
  const accelerations = new Map<string | number, OSVector3>();
  const octree = new Octree(octreeSize);
  const reusableAccVector = new OSVector3(0, 0, 0);

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

  // Add the initial position
  const initialTargetState = currentStates[targetBodyIndex];
  if (initialTargetState.position_m) {
    predictedPointsOS.push(initialTargetState.position_m.clone());
  } else {
    console.warn(`Initial target position missing for ${targetBodyId}`);
    return [];
  }

  // Simulation loop
  for (let i = 0; i < steps; i++) {
    // Calculate accelerations using Octree (same as in main simulation)
    octree.clear();
    for (const body of currentStates) {
      octree.insert(body);
    }

    accelerations.clear();
    for (const body of currentStates) {
      const netForce = octree.calculateForceOn(body, barnesHutTheta);
      reusableAccVector.set(0, 0, 0);
      if (body.mass_kg !== 0) {
        reusableAccVector.copy(netForce).multiplyScalar(1 / body.mass_kg);
      }
      accelerations.set(body.id, reusableAccVector.clone()); // Clone here as it's stored
    }

    // Integration
    let targetNextState: PhysicsStateReal | null = null;
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

      try {
        // Create acceleration calculator function for Verlet integration
        const calculateNewAcceleration = (
          stateGuess: PhysicsStateReal,
        ): OSVector3 => {
          const force = octree.calculateForceOn(stateGuess, barnesHutTheta);
          reusableAccVector.set(0, 0, 0); // Reuse the vector
          if (stateGuess.mass_kg !== 0) {
            reusableAccVector
              .copy(force)
              .multiplyScalar(1 / stateGuess.mass_kg);
          }
          return reusableAccVector;
        };

        // Use the same Verlet integrator as the main simulation
        // IMPORTANT: The result MUST be written to the `nextStates` array to avoid mutation bugs
        const resultState = velocityVerletIntegrate(
          body,
          acceleration,
          calculateNewAcceleration,
          dt,
        );

        // Copy result into the pre-allocated next state object
        nextStates[j].position_m.copy(resultState.position_m);
        nextStates[j].velocity_mps.copy(resultState.velocity_mps);

        // Validate state
        const posOk = Number.isFinite(nextStates[j].position_m.x);
        const velOk = Number.isFinite(nextStates[j].velocity_mps.x);

        if (!posOk || !velOk) {
          console.error(
            `Non-finite state detected for body ${body.id}. Aborting prediction.`,
          );
          integrationError = true;
          break;
        }

        if (body.id === targetBodyId) {
          targetNextState = nextStates[j];
        }
      } catch (error) {
        console.error(`Error during integration for body ${body.id}:`, error);
        integrationError = true;
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

    if (integrationError) break;

    // Add the new prediction point
    if (targetNextState !== null) {
      predictedPointsOS.push(targetNextState.position_m.clone());
    } else {
      console.warn(`Target state not found after step ${i}. Aborting.`);
      break;
    }

    // Swap state arrays for the next iteration to avoid reallocation
    const temp = currentStates;
    currentStates = nextStates;
    nextStates = temp;
  }

  // If scaling is requested, apply it.
  if (scaleToSceneUnits) {
    return predictedPointsOS.map((p) =>
      p.multiplyScalar(METERS_TO_SCENE_UNITS),
    );
  }

  return predictedPointsOS;
}

/**
 * Export the Verlet prediction function to maintain backwards compatibility
 */
export const predictVerletTrajectory = predictTrajectory;
