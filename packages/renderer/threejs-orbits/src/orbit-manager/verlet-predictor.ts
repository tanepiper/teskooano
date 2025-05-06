import { OSVector3 } from "@teskooano/core-math";
import { Octree, verlet } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, PhysicsStateReal } from "@teskooano/data-types";
import * as THREE from "three";

/**
 * @internal
 * Calculates the acceleration for each body in the current prediction state using an Octree.
 *
 * @param currentPredictionStates - Array of current physics states for all bodies.
 * @param octreeSize - Size parameter for the Octree.
 * @param barnesHutTheta - Barnes-Hut approximation parameter.
 * @returns A tuple containing the calculated accelerations map and the constructed Octree for the step.
 */
function _calculateAccelerationsForStep(
  currentPredictionStates: PhysicsStateReal[],
  octreeSize: number,
  barnesHutTheta: number,
): [Map<string, OSVector3>, Octree] {
  const stepOctree = new Octree(octreeSize);
  currentPredictionStates.forEach((body) => stepOctree.insert(body));

  const accelerations = new Map<string, OSVector3>();
  currentPredictionStates.forEach((body) => {
    const force = stepOctree.calculateForceOn(body, barnesHutTheta);
    const acc = new OSVector3(0, 0, 0);
    if (body.mass_kg !== 0) {
      acc.copy(force).multiplyScalar(1 / body.mass_kg);
    } else {
      acc.set(0, 0, 0);
    }
    accelerations.set(body.id, acc);
  });

  return [accelerations, stepOctree];
}

/**
 * @internal
 * Integrates one time step for all bodies using the Verlet method.
 *
 * @param currentPredictionStates - Array of current physics states for all bodies.
 * @param accelerations - Map of current accelerations for each body.
 * @param stepOctree - The Octree constructed for this time step.
 * @param barnesHutTheta - Barnes-Hut approximation parameter (for the acceleration helper).
 * @param dt - The time step duration (in seconds).
 * @param targetBodyId - The ID of the body whose trajectory is being predicted.
 * @param stepIndex - The current step index (for logging purposes).
 * @returns An object containing the next states, the next predicted point (scaled), and an error flag.
 */
function _integrateOneStep(
  currentPredictionStates: PhysicsStateReal[],
  accelerations: Map<string, OSVector3>,
  stepOctree: Octree,
  barnesHutTheta: number,
  dt: number,
  targetBodyId: string,
  stepIndex: number,
): {
  nextPredictionStates: PhysicsStateReal[];
  nextTargetPoint: THREE.Vector3 | null;
  error: boolean;
} {
  const nextPredictionStates: PhysicsStateReal[] = [];
  let targetBodyNextState: PhysicsStateReal | null = null;
  let integrationErrorOccurred = false;

  const calculateAccelerationForState = (
    stateGuess: PhysicsStateReal,
  ): OSVector3 => {
    const force = stepOctree.calculateForceOn(stateGuess, barnesHutTheta);
    const acc = new OSVector3(0, 0, 0);
    if (stateGuess.mass_kg !== 0) {
      acc.copy(force).multiplyScalar(1 / stateGuess.mass_kg);
    }
    return acc;
  };

  currentPredictionStates.forEach((body) => {
    if (integrationErrorOccurred) return;

    const acceleration = accelerations.get(body.id);
    if (!acceleration) {
      console.error(
        `[predictVerletTrajectory] Acceleration calculation failed for body ${body.id}`,
      );
      integrationErrorOccurred = true;
      return;
    }

    try {
      const nextState: PhysicsStateReal = verlet(
        body,
        acceleration,
        calculateAccelerationForState,
        dt,
      );

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
          `[predictVerletTrajectory] Non-finite state detected for body ${body.id} after integration step ${stepIndex}. Pos OK: ${posOk}, Vel OK: ${velOk}. Aborting prediction.`,
        );
        integrationErrorOccurred = true;
        return;
      }

      nextPredictionStates.push(nextState);
      if (body.id === targetBodyId) {
        targetBodyNextState = nextState;
      }
    } catch (error) {
      console.error(
        `[predictVerletTrajectory] Error during Verlet integration for body ${body.id} at step ${stepIndex}:`,
        error,
      );
      integrationErrorOccurred = true;
    }
  });

  let nextTargetPoint: THREE.Vector3 | null = null;
  if (!integrationErrorOccurred) {
    const finalState = targetBodyNextState as unknown as PhysicsStateReal;
    if (finalState?.position_m) {
      nextTargetPoint = finalState.position_m
        .clone()
        .multiplyScalar(METERS_TO_SCENE_UNITS)
        .toThreeJS();
    } else {
      console.warn(
        `[predictVerletTrajectory] Target body state not found after integration step ${stepIndex}`,
      );
      integrationErrorOccurred = true;
    }
  }

  return {
    nextPredictionStates,
    nextTargetPoint,
    error: integrationErrorOccurred,
  };
}

/**
 * Predicts the future trajectory of the first body in the input array (`allBodiesInitialStates[0]`)
 * using Verlet integration. It simulates the gravitational interactions between all provided bodies
 * over a specified duration, utilizing an Octree with the Barnes-Hut approximation for performance.
 *
 * The simulation runs internally using real physics units (meters, kg, seconds) but returns
 * an array of predicted positions scaled to Three.js scene units.
 *
 * **Important:** Assumes the target body for prediction is the *first* element (`[0]`) in the
 * `allBodiesInitialStates` array.
 *
 * @param allBodiesInitialStates - An array containing the initial `PhysicsStateReal` for *all* bodies
 *   involved in the gravitational simulation (including the target body at index 0).
 *   These states should represent the system at the start of the prediction period.
 * @param duration_s - The total time duration (in seconds) for which to predict the trajectory.
 * @param steps - The number of discrete time steps to use for the Verlet integration.
 *   More steps increase accuracy but also computational cost.
 * @param octreeSize - The initial size (half-width/radius) of the root Octree node used for
 *   the Barnes-Hut calculation. Should encompass the expected volume of the system during prediction.
 *   Defaults to 5e13 meters.
 * @param barnesHutTheta - The Barnes-Hut approximation parameter (θ). Controls the trade-off
 *   between accuracy and speed in the Octree force calculation. Lower values are more accurate
 *   but slower. Defaults to 0.7.
 * @returns An array of `THREE.Vector3` points representing the predicted trajectory of the target body,
 *   scaled by `METERS_TO_SCENE_UNITS`. Returns an empty array or partially predicted path if
 *   initial conditions are invalid or an integration error occurs.
 */
export function predictVerletTrajectory(
  allBodiesInitialStates: PhysicsStateReal[],
  duration_s: number,
  steps: number,
  octreeSize: number = 5e13,
  barnesHutTheta: number = 0.7,
): THREE.Vector3[] {
  if (
    steps <= 0 ||
    !allBodiesInitialStates ||
    allBodiesInitialStates.length === 0
  )
    return [];
  const targetBodyInitialState = allBodiesInitialStates[0];
  const targetBodyId = targetBodyInitialState.id;

  const dt = duration_s / steps;
  const predictedPoints: THREE.Vector3[] = [];

  let currentPredictionStates: PhysicsStateReal[] = [
    ...allBodiesInitialStates.map((body) => ({
      ...body,
      position_m: body.position_m.clone(),
      velocity_mps: body.velocity_mps.clone(),
    })),
  ];

  if (targetBodyInitialState.position_m) {
    predictedPoints.push(
      targetBodyInitialState.position_m
        .clone()
        .multiplyScalar(METERS_TO_SCENE_UNITS)
        .toThreeJS(),
    );
  } else {
    console.warn(
      `[predictVerletTrajectory] Initial target position missing for ${targetBodyId}`,
    );
    return [];
  }

  for (let i = 0; i < steps; i++) {
    const [accelerations, stepOctree] = _calculateAccelerationsForStep(
      currentPredictionStates,
      octreeSize,
      barnesHutTheta,
    );

    const stepResult = _integrateOneStep(
      currentPredictionStates,
      accelerations,
      stepOctree,
      barnesHutTheta,
      dt,
      targetBodyId,
      i,
    );

    if (stepResult.error) {
      console.warn(
        `[predictVerletTrajectory] Prediction aborted for ${targetBodyId} due to integration error at step ${i}.`,
      );
      return predictedPoints;
    }

    currentPredictionStates = stepResult.nextPredictionStates;

    if (stepResult.nextTargetPoint) {
      predictedPoints.push(stepResult.nextTargetPoint);
    } else {
      console.warn(
        `[predictVerletTrajectory] Target body point unexpectedly missing after step ${i}. Aborting.`,
      );
      break;
    }
  }

  return predictedPoints;
}
