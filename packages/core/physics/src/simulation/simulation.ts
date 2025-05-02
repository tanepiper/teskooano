import { Observable, combineLatest } from "rxjs";
import { scan, startWith, map } from "rxjs/operators";
import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import {
  handleCollisions,
  type DestructionEvent,
} from "../collision/collision"; // <-- Import collision handler
import { velocityVerletIntegrate } from "../integrators/verlet"; // Use Velocity Verlet
import { Octree } from "../spatial/octree"; // Import Octree

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
  // otherBodies: PhysicsStateReal[], // No longer needed directly
  octree: Octree,
  theta: number = 0.7, // Default theta value
): OSVector3 => {
  // Calculate force using the Octree
  // Note: If targetBodyState is a *predicted* state, it won't be *in* the octree.
  // The octree's calculateForceOn method handles interactions with existing bodies/nodes.
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
  destroyedIds: Set<string | number>; // <-- Add destroyed IDs
  destructionEvents: DestructionEvent[]; // <-- Add destruction events
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
    octreeSize = 5e13, // Default octree size
    barnesHutTheta = 0.7, // Default theta
  } = params;

  // --- Octree Setup ---

  // Determine appropriate size if not provided (optional enhancement)
  // For now, using provided/default size centered at origin.
  const octree = new Octree(octreeSize);
  bodies.forEach((body) => octree.insert(body));
  // --- End Octree Setup ---

  // Step 1: Calculate acceleration for all bodies based on current state using Octree
  const accelerations = new Map<string, OSVector3>();
  bodies.forEach((body) => {
    const force = octree.calculateForceOn(body, barnesHutTheta);
    const acc = new OSVector3(0, 0, 0);
    if (body.mass_kg !== 0) {
      acc.copy(force).multiplyScalar(1 / body.mass_kg);
    }
    accelerations.set(body.id, acc);
  });

  // Step 2: Update state using Velocity Verlet
  const integratedStates = bodies.map((body) => {
    const currentAcceleration =
      accelerations.get(body.id) || new OSVector3(0, 0, 0);

    // Define the function needed by Velocity Verlet to calculate acceleration at a new state
    const calculateNewAcceleration = (
      newStateGuess: PhysicsStateReal,
    ): OSVector3 => {
      // Calculate acceleration on the guessed state using the *current* Octree
      // Pass the pre-built octree and theta parameter
      return calculateAccelerationForBody(
        newStateGuess,
        octree, // Pass the octree constructed for this step
        barnesHutTheta,
      );
    };

    // Apply Velocity Verlet integrator
    return velocityVerletIntegrate(
      body, // Current state
      currentAcceleration, // Acceleration at current state
      calculateNewAcceleration, // Function to calc acceleration at predicted state
      dt, // Time step
    );
  });

  // Step 3: Handle Collisions - Capture destruction events
  const [finalStates, destroyedIds, destructionEvents] = handleCollisions(
    integratedStates,
    radii,
    isStar,
    bodyTypes,
  );

  // Octree is rebuilt next step, no need to explicitly clear here unless memory is critical
  // octree.clear();

  // Return the final states, accelerations, destroyed IDs, and destruction events
  return {
    states: finalStates,
    accelerations,
    destroyedIds,
    destructionEvents,
  }; // <-- Include destructionEvents
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
  tick$: Observable<number>, // Emits dt
): Observable<SimulationStepResult> => {
  // Initial result seed for the scan operator
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
        // Run one simulation step using the state from the previous result
        return updateSimulation(previousResult.states, dt, params);
      },
      initialResult, // Start with the initial state wrapped in a result object
    ),
    // Start with the initial state so subscribers immediately get the starting point
    // Note: scan's seed is the first ACCUMULATED value. startWith emits BEFORE scan runs.
    // We map the initial result to ensure the type matches the stream output.
    startWith(initialResult),
  );
};
