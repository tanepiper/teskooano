import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  type OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";
import {
  handleCollisions,
  type DestructionEvent,
} from "../collision/collision";
import {
  velocityVerletIntegrate,
  standardEuler,
  symplecticEuler,
  idealOrbit,
  rk4Integrate,
  adaptiveRKIntegrate,
  yoshida4Integrate,
  forestRuthIntegrate,
  pefrlIntegrate,
  leapfrogIntegrate,
} from "../integrators";
import { Octree } from "../spatial/octree";
import { 
  isValidConfiguration,
  getDefaultConfiguration
} from "@teskooano/core-state";
import { sortBodiesByHierarchy } from "../utils";
import { SimulationParameters, SimulationStepResult, SimulationConfiguration } from "./types";

/**
 * Helper function to calculate the acceleration on a single body, given its state
 * and the state of all other bodies. Required for Velocity Verlet.
 * @param targetBodyState The state (potentially predicted) of the body to calculate acceleration for.
 * @param otherBodies The current state of all *other* bodies in the simulation.
 * @param octree The Octree built from the current simulation state.
 * @param theta The Barnes-Hut approximation parameter.
 * @returns The acceleration vector (m/s^2) acting on the target body.
 */
const calculateAccelerationForBody_NBody = (
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

// NEW function for simplified 2-body physics with a fixed star
const calculateAccelerationForBody_Simple = (
  targetBodyState: PhysicsStateReal,
  centralStar: PhysicsStateReal,
): OSVector3 => {
  const acceleration = new OSVector3(0, 0, 0);
  if (targetBodyState.id === centralStar.id) {
    return acceleration; // Star is fixed
  }

  if (targetBodyState.mass_kg === 0 || centralStar.mass_kg === 0) {
    return acceleration; // Massless body or star means no gravitational force as calculated
  }

  const rVec = centralStar.position_m.clone().sub(targetBodyState.position_m);
  const distSq = rVec.lengthSq();

  // Define a minimum distance squared to prevent extreme forces or division by zero.
  // 1km^2 = 1e6 m^2. This is arbitrary and might need tuning or a more robust solution
  // for close encounters in a game context (e.g., soft potentials, collision).
  const MIN_DISTANCE_SQ = 1e6;

  if (distSq < MIN_DISTANCE_SQ) {
    // If bodies are extremely close or overlapping, gravitational force calculation is problematic.
    // For simple mode, returning zero acceleration can prevent numerical instability.
    // Collisions should ideally handle merges/destruction before this becomes an issue.
    return acceleration;
  }

  const forceMag =
    (GRAVITATIONAL_CONSTANT * centralStar.mass_kg * targetBodyState.mass_kg) /
    distSq;
  const forceVec = rVec.normalize().multiplyScalar(forceMag);

  acceleration.copy(forceVec).multiplyScalar(1 / targetBodyState.mass_kg);
  return acceleration;
};

/**
 * Main simulation function using the new configuration system
 */
export const updateSimulationWithConfiguration = (
  bodies: PhysicsStateReal[],
  dt: number,
  params: SimulationParameters & { 
    simulationConfig: SimulationConfiguration;
  },
): SimulationStepResult => {
  const config = params.simulationConfig;
  
  // Ensure configuration is valid
  if (!isValidConfiguration(config)) {
    console.warn("Invalid simulation configuration provided, using default:", config);
    const defaultConfig = getDefaultConfiguration();
    return updateSimulation(bodies, dt, { ...params, simulationConfig: defaultConfig });
  }

  return updateSimulation(bodies, dt, params);
};

/**
 * Updates the state of all bodies in the simulation for a given time step using an Octree.
 * Uses Barnes-Hut approximation for performance (O(N log N)).
 *
 * @param bodies - Array of all bodies in the simulation
 * @param dt - Time step duration (e.g., in seconds)
 * @param params - Simulation parameters (radii, types, octree settings, physicsEngine)
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
    parentIds,
    octreeSize = 5e13,
    barnesHutTheta = 0.7,
    simulationConfig,
    orbitalParameters,
    currentTime_s,
  } = params;

  if (simulationConfig.mode === "ideal") {
    if (!orbitalParameters || currentTime_s === undefined || !parentIds) {
      console.error(
        'CRITICAL: "ideal" simulation mode requires `orbitalParameters`, `currentTime_s`, and `parentIds` to be provided.',
      );
      return {
        states: bodies,
        accelerations: new Map(),
        destroyedIds: new Set(),
        destructionEvents: [],
      };
    }

    const bodyMap = new Map(bodies.map((b) => [b.id, b]));
    const sortedBodies = sortBodiesByHierarchy(bodies, parentIds);
    const updatedStates: Record<string, PhysicsStateReal> = {};

    for (const body of sortedBodies) {
      const bodyOrbitalParams = orbitalParameters.get(body.id);
      const parentId = parentIds.get(body.id);

      if (!parentId || !bodyOrbitalParams) {
        updatedStates[body.id] = body;
        continue;
      }

      // For ideal orbits, the parent state *must* be the already-updated state from this same tick.
      // We get it from our `updatedStates` map, which we are building as we iterate.
      const parentState = updatedStates[parentId];

      if (!parentState) {
        console.warn(
          `Could not find parent with ID ${parentId} for body ${body.id} in the set of already-updated bodies. This should not happen with a sorted list.`,
        );
        updatedStates[body.id] = body; // Can't update, so keep original state.
        continue;
      }
      const newState = idealOrbit(
        body,
        parentState,
        bodyOrbitalParams,
        currentTime_s,
      );
      updatedStates[body.id] = newState;
    }

    // In Ideal mode, we completely bypass collision detection for a pure "on-rails" orrery simulation.
    return {
      states: Object.values(updatedStates),
      accelerations: new Map(),
      destroyedIds: new Set(),
      destructionEvents: [],
    };
  }

  const accelerations = new Map<string, OSVector3>();
  let nBodyOctree: Octree | undefined; // For advanced N-body calculations

  // Determine force calculation method based on algorithm
  const algorithm = simulationConfig.algorithm || "barnes-hut";
  
  if (algorithm === "barnes-hut" || algorithm === "fmm" || algorithm === "p3m" || algorithm === "tree-pm") {
    // Use octree-based calculations for advanced algorithms
    nBodyOctree = new Octree(octreeSize);
    // It's important to insert all bodies before calculating forces for any of them
    bodies.forEach((body) => {
      if (nBodyOctree) nBodyOctree.insert(body);
    });

    bodies.forEach((body) => {
      if (nBodyOctree) {
        // Ensure octree is initialized
        const acc = calculateAccelerationForBody_NBody(
          body,
          nBodyOctree,
          barnesHutTheta,
        );
        accelerations.set(body.id, acc);
      }
    });
  } else {
    // Direct or simplified physics calculation
    const centralStarState = bodies.find((b) => isStar.get(b.id));
    const bodyMap = new Map(bodies.map((b) => [b.id, b])); // Helper to find bodies by ID

    if (!centralStarState) {
      console.warn(
        `Direct physics algorithm selected, but no central star identified. Bodies will experience no gravitational forces unless parentIds are defined and resolve.`,
      );
    }

    bodies.forEach((body) => {
      let attractorState: PhysicsStateReal | undefined | null = null;

      if (centralStarState && body.id === centralStarState.id) {
        // Central star is fixed
        accelerations.set(body.id, new OSVector3(0, 0, 0));
        return; // Next body
      }

      const parentId = parentIds?.get(body.id);

      if (parentId) {
        attractorState = bodyMap.get(parentId);
        if (!attractorState) {
          console.warn(
            `Body ${body.id} has parentId ${parentId}, but parent not found in current bodies. Defaulting to central star if available.`,
          );
        }
      }

      // If no specific parent, or parent not found, default to central star
      if (!attractorState && centralStarState) {
        attractorState = centralStarState;
      }

      if (attractorState && attractorState.id !== body.id) {
        // Ensure not attracting to itself
        const acc = calculateAccelerationForBody_Simple(body, attractorState);
        accelerations.set(body.id, acc);
      } else {
        // No valid attractor (e.g. orphan moon and no central star, or only one body in system)
        accelerations.set(body.id, new OSVector3(0, 0, 0));
      }
    });
  }

  const integratedStates = bodies.map((body) => {
    const currentAcceleration =
      accelerations.get(body.id) || new OSVector3(0, 0, 0);

    // This function is relevant for Verlet and other advanced integrators.
    // It captures the nBodyOctree from the outer scope.
    const calculateNewAccelerationForAdvanced = (
      newStateGuess: PhysicsStateReal,
    ): OSVector3 => {
      if (!nBodyOctree) {
        // This case should ideally not be reached for advanced algorithms
        // as nBodyOctree would have been initialized.
        console.error(
          "CRITICAL: nBodyOctree not initialized for advanced integration path when calculating new acceleration.",
        );
        return new OSVector3(0, 0, 0); // Fallback to zero acceleration
      }
      return calculateAccelerationForBody_NBody(
        // Ensure this uses NBody
        newStateGuess,
        nBodyOctree,
        barnesHutTheta,
      );
    };

    // Get integrator from configuration
    const integrator = simulationConfig.integrator || "verlet";
    
    let integratedState: PhysicsStateReal;
    switch (integrator) {
      case "euler":
        integratedState = standardEuler(body, currentAcceleration, dt);
        break;
      case "symplectic":
        integratedState = symplecticEuler(body, currentAcceleration, dt);
        break;
      case "verlet":
        integratedState = velocityVerletIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      case "rk4":
        integratedState = rk4Integrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      case "adaptive":
        const adaptiveResult = adaptiveRKIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        integratedState = adaptiveResult.newState;
        break;
      case "yoshida4":
        integratedState = yoshida4Integrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      case "forest-ruth":
        integratedState = forestRuthIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      case "pefrl":
        integratedState = pefrlIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      case "leapfrog":
        integratedState = leapfrogIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
      default:
        console.warn(`Unknown integrator: ${integrator}, falling back to verlet`);
        integratedState = velocityVerletIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
    }

    // If using Euler/Symplectic integrators with direct algorithm, and this is a primary star (a star with no parent),
    // force its velocity to zero and keep its position fixed.
    // This overrides any motion calculated by the integrator for such stars in these modes.
    if (
      (integrator === "euler" || integrator === "symplectic") &&
      algorithm === "direct" &&
      isStar.get(body.id) && // It's a star
      (!parentIds || !parentIds.has(body.id)) // And it has no parent
    ) {
      integratedState.velocity_mps = new OSVector3(0, 0, 0); // Force velocity to zero
      // Ensure its position does not change from its state *before* this integration step.
      // 'body' is the state from the beginning of this 'updateSimulation' call (the input to the .map()).
      integratedState.position_m = body.position_m.clone();
    }

    return integratedState;
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
