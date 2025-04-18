import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import { handleCollisions } from "../collision/collision"; // <-- Import collision handler
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
  theta: number = 0.7 // Default theta value
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
}

/**
 * Updates the state of all bodies in the simulation for a given time step using an Octree.
 * Uses Barnes-Hut approximation for performance (O(N log N)).
 *
 * @param bodies - Array of all bodies in the simulation
 * @param dt - Time step duration (e.g., in seconds)
 * @param radii - Map of body IDs to their radii
 * @param isStar - Map of body IDs to boolean indicating if they are stars
 * @param bodyTypes - Map of body IDs to their CelestialType
 * @param octreeSize - The size (half-width) of the root Octree node. Should encompass the simulation area.
 * @param barnesHutTheta - Approximation parameter (0 = exact N-body, >0 = approximation). Default 0.7.
 * @returns Updated array of body states
 */
export const updateSimulation = (
  bodies: PhysicsStateReal[],
  dt: number,
  radii: Map<string | number, number>, // <-- Add radii map
  isStar: Map<string | number, boolean>, // <-- Add isStar map
  bodyTypes: Map<string | number, CelestialType>, // --- NEW PARAM ---
  octreeSize: number = 5e13,
  barnesHutTheta: number = 0.7
): SimulationStepResult => {
  // --- Octree Setup ---
  // Determine appropriate size if not provided (optional enhancement)
  // For now, using provided/default size centered at origin.
  const octree = new Octree(octreeSize);
  bodies.forEach((body) => octree.insert(body));
  // --- End Octree Setup ---

  // Calculate initial forces based on current positions - **REMOVED**
  // const currentForces = calculateNetForces(bodies);

  // Step 1: Calculate acceleration for all bodies based on current state using Octree
  const accelerations = new Map<string, OSVector3>();
  bodies.forEach((body) => {
    // const force = currentForces.get(body.id) || new OSVector3(0, 0, 0); // Old way
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
      newStateGuess: PhysicsStateReal
    ): OSVector3 => {
      // Calculate acceleration on the guessed state using the *current* Octree
      // Pass the pre-built octree and theta parameter
      return calculateAccelerationForBody(
        newStateGuess,
        octree,
        barnesHutTheta
      );
    };

    // Apply Velocity Verlet integrator
    return velocityVerletIntegrate(
      body, // Current state
      currentAcceleration, // Acceleration at current state
      calculateNewAcceleration, // Function to calc acceleration at predicted state
      dt // Time step
    );
  });

  // Step 3: Handle Collisions
  const [finalStates, destroyedIds] = handleCollisions(
    integratedStates,
    radii,
    isStar,
    bodyTypes
  );

  // Octree is rebuilt next step, no need to explicitly clear here unless memory is critical
  // octree.clear();

  // Return the final states, accelerations, and destroyed IDs
  return { states: finalStates, accelerations, destroyedIds };
};

/**
 * Runs the simulation for a specified number of steps.
 *
 * @param bodies - Initial state of all bodies
 * @param dt - Time step duration (e.g., in seconds)
 * @param steps - Number of steps to run
 * @param radii - Map of body IDs to their radii
 * @param isStar - Map of body IDs to boolean indicating if they are stars
 * @param bodyTypes - Map of body IDs to their CelestialType
 * @param octreeSize - Size parameter for the Octree used in each step.
 * @param barnesHutTheta - Theta parameter for the Octree used in each step.
 * @returns Array of body states at each step
 */
export const runSimulation = (
  bodies: PhysicsStateReal[],
  dt: number,
  steps: number,
  radii: Map<string | number, number>, // <-- Add radii map
  isStar: Map<string | number, boolean>, // <-- Add isStar map
  bodyTypes: Map<string | number, CelestialType>, // --- NEW PARAM ---
  octreeSize?: number,
  barnesHutTheta?: number
): PhysicsStateReal[][] => {
  const states: PhysicsStateReal[][] = [[...bodies]]; // Store a copy of the initial state
  let currentStates = bodies;

  for (let i = 0; i < steps; i++) {
    // Pass octree parameters and collision maps to updateSimulation
    const stepResult = updateSimulation(
      currentStates,
      dt,
      radii,
      isStar,
      bodyTypes,
      octreeSize,
      barnesHutTheta
    );
    // We only store the states for this historical run function
    states.push([...stepResult.states]); // Store a copy of the new state
    currentStates = stepResult.states; // Update for the next iteration
  }

  return states;
};
