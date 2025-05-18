import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { Octree } from "../spatial/octree";
import { velocityVerletIntegrate } from "../integrators";
import * as THREE from "three";
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
 * @returns An array of THREE.Vector3 points representing the predicted trajectory, scaled for visualization.
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
): THREE.Vector3[] {
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
  const predictedPoints: THREE.Vector3[] = [];

  // Make a deep copy of the initial states to avoid modifying the original data
  let currentStates: PhysicsStateReal[] = allBodiesInitialStates.map(
    (body) => ({
      ...body,
      position_m: body.position_m.clone(),
      velocity_mps: body.velocity_mps.clone(),
    }),
  );

  // Add the initial position
  const initialTargetState = currentStates[targetBodyIndex];
  if (initialTargetState.position_m) {
    const initialPoint = scaleToSceneUnits
      ? initialTargetState.position_m
          .clone()
          .multiplyScalar(METERS_TO_SCENE_UNITS)
          .toThreeJS()
      : initialTargetState.position_m.clone().toThreeJS();
    predictedPoints.push(initialPoint);
  } else {
    console.warn(`Initial target position missing for ${targetBodyId}`);
    return [];
  }

  // Simulation loop
  for (let i = 0; i < steps; i++) {
    // Calculate accelerations using Octree (same as in main simulation)
    const octree = new Octree(octreeSize);
    currentStates.forEach((body) => octree.insert(body));

    const accelerations = new Map<string | number, OSVector3>();
    currentStates.forEach((body) => {
      const netForce = octree.calculateForceOn(body, barnesHutTheta);
      const acc = new OSVector3(0, 0, 0);
      if (body.mass_kg !== 0) {
        acc.copy(netForce).multiplyScalar(1 / body.mass_kg);
      }
      accelerations.set(body.id, acc);
    });

    // Integration
    const nextStates: PhysicsStateReal[] = [];
    let targetNextState: PhysicsStateReal | null = null;
    let integrationError = false;

    currentStates.forEach((body) => {
      if (integrationError) return;

      const acceleration = accelerations.get(body.id);
      if (!acceleration) {
        console.error(`Acceleration calculation failed for body ${body.id}`);
        integrationError = true;
        return;
      }

      try {
        // Create acceleration calculator function for Verlet integration
        const calculateNewAcceleration = (
          stateGuess: PhysicsStateReal,
        ): OSVector3 => {
          const force = octree.calculateForceOn(stateGuess, barnesHutTheta);
          const acc = new OSVector3(0, 0, 0);
          if (stateGuess.mass_kg !== 0) {
            acc.copy(force).multiplyScalar(1 / stateGuess.mass_kg);
          }
          return acc;
        };

        // Use the same Verlet integrator as the main simulation
        const nextState = velocityVerletIntegrate(
          body,
          acceleration,
          calculateNewAcceleration,
          dt,
        );

        // Validate state
        const posOk =
          Number.isFinite(nextState.position_m.x) &&
          Number.isFinite(nextState.position_m.y) &&
          Number.isFinite(nextState.position_m.z);
        const velOk =
          Number.isFinite(nextState.velocity_mps.x) &&
          Number.isFinite(nextState.velocity_mps.y) &&
          Number.isFinite(nextState.velocity_mps.z);

        if (!posOk || !velOk) {
          console.error(
            `Non-finite state detected for body ${body.id}. Aborting prediction.`,
          );
          integrationError = true;
          return;
        }

        nextStates.push(nextState);
        if (body.id === targetBodyId) {
          targetNextState = nextState;
        }
      } catch (error) {
        console.error(`Error during integration for body ${body.id}:`, error);
        integrationError = true;
      }
    });

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
      const position = targetNextState.position_m;
      const nextPoint = scaleToSceneUnits
        ? position.clone().multiplyScalar(METERS_TO_SCENE_UNITS).toThreeJS()
        : position.clone().toThreeJS();

      predictedPoints.push(nextPoint);
    } else {
      console.warn(`Target state not found after step ${i}. Aborting.`);
      break;
    }

    // Update current states for next step
    currentStates = nextStates;
  }

  return predictedPoints;
}

/**
 * Export the Verlet prediction function to maintain backwards compatibility
 */
export const predictVerletTrajectory = predictTrajectory;
