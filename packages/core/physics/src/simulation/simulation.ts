import { Observable, combineLatest } from "rxjs";
import { scan, startWith, map } from "rxjs/operators";
import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import {
  handleCollisions,
  type DestructionEvent,
} from "../collision/collision";
import { velocityVerletIntegrate } from "../integrators/verlet";
import { Octree } from "../spatial/octree";

/**
 * Helper function to calculate the acceleration on a single body, given its state
 * and the state of all other bodies. Required for Velocity Verlet.
 * @param targetBodyState The state (potentially predicted) of the body to calculate acceleration for.
 * @param otherBodies The current state of all *other* bodies in the simulation.
 * @param octree The Octree built from the current simulation state.
 * @param theta The Barnes-Hut approximation parameter.
 * @returns The acceleration vector (m/s^2) acting on the target body.
 */
const calculateAccelerationForBody = (
  targetBodyState: PhysicsStateReal,

  octree: Octree,
  theta: number = 0.7,
): OSVector3 => {
  const netForce = octree.calculateForceOn(targetBodyState, theta);

  const acceleration = new OSVector3(0, 0, 0);
  if (targetBodyState.mass_kg !== 0) {
    acceleration.copy(netForce).multiplyScalar(1 / targetBodyState.mass_kg);
  }
  return acceleration;
};

/**
 * Define a return type that includes both states and accelerations
 */
export interface SimulationStepResult {
  states: PhysicsStateReal[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string | number>;
  destructionEvents: DestructionEvent[];
}

/**
 * Defines the parameters needed for a simulation step, excluding state and dt.
 */
export interface SimulationParameters {
  radii: Map<string | number, number>;
  isStar: Map<string | number, boolean>;
  bodyTypes: Map<string | number, CelestialType>;
  octreeSize?: number;
  barnesHutTheta?: number;
}

/**
 * Updates the state of all bodies in the simulation for a given time step using an Octree.
 * Uses Barnes-Hut approximation for performance (O(N log N)).
 *
 * @param bodies - Array of all bodies in the simulation
 * @param dt - Time step duration (e.g., in seconds)
 * @param params - Simulation parameters (radii, types, octree settings)
 * @returns Updated array of body states
 */
export const updateSimulation = (
  bodies: PhysicsStateReal[],
  dt: number,
  params: SimulationParameters,
): SimulationStepResult => {
  const {
    radii,
    isStar,
    bodyTypes,
    octreeSize = 5e13,
    barnesHutTheta = 0.7,
  } = params;

  const octree = new Octree(octreeSize);
  bodies.forEach((body) => octree.insert(body));

  const accelerations = new Map<string, OSVector3>();
  bodies.forEach((body) => {
    const force = octree.calculateForceOn(body, barnesHutTheta);
    const acc = new OSVector3(0, 0, 0);
    if (body.mass_kg !== 0) {
      acc.copy(force).multiplyScalar(1 / body.mass_kg);
    }
    accelerations.set(body.id, acc);
  });

  const integratedStates = bodies.map((body) => {
    const currentAcceleration =
      accelerations.get(body.id) || new OSVector3(0, 0, 0);

    const calculateNewAcceleration = (
      newStateGuess: PhysicsStateReal,
    ): OSVector3 => {
      return calculateAccelerationForBody(
        newStateGuess,
        octree,
        barnesHutTheta,
      );
    };

    return velocityVerletIntegrate(
      body,
      currentAcceleration,
      calculateNewAcceleration,
      dt,
    );
  });

  const [finalStates, destroyedIds, destructionEvents] = handleCollisions(
    integratedStates,
    radii,
    isStar,
    bodyTypes,
  );

  return {
    states: finalStates,
    accelerations,
    destroyedIds,
    destructionEvents,
  };
};

/**
 * Creates an Observable stream representing the physics simulation.
 *
 * @param initialState - The initial state of all bodies.
 * @param parameters$ - An Observable emitting the simulation parameters (radii, types, octree settings).
 *                      These parameters can change over time.
 * @param tick$ - An Observable emitting the delta time (dt) for each simulation step.
 * @returns An Observable emitting the SimulationStepResult after each step.
 */
export const createSimulationStream = (
  initialState: PhysicsStateReal[],
  parameters$: Observable<SimulationParameters>,
  tick$: Observable<number>,
): Observable<SimulationStepResult> => {
  const initialResult: SimulationStepResult = {
    states: initialState,
    accelerations: new Map<string, OSVector3>(),
    destroyedIds: new Set<string | number>(),
    destructionEvents: [],
  };

  return combineLatest([tick$, parameters$]).pipe(
    scan(
      (
        previousResult: SimulationStepResult,
        [dt, params]: [number, SimulationParameters],
      ) => {
        return updateSimulation(previousResult.states, dt, params);
      },
      initialResult,
    ),

    startWith(initialResult),
  );
};
