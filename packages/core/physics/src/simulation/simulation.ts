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

import { sortBodiesByHierarchy } from "../utils";
import {
  SimulationParameters,
  SimulationStepResult,
  SimulationConfiguration,
} from "./types";

/**
 * Validates if a simulation configuration is valid.
 * @param config The simulation configuration to validate.
 * @returns True if the configuration is valid, false otherwise.
 */
function isValidConfiguration(config: SimulationConfiguration): boolean {
  if (config.mode === "ideal") {
    return true; // Ideal mode doesn't need integrator or algorithm
  }
  if (config.mode === "nbody") {
    // N-Body mode requires both integrator and algorithm
    return config.integrator !== undefined && config.algorithm !== undefined;
  }
  return false;
}

/**
 * Returns the default simulation configuration.
 * @returns The default simulation configuration.
 */
function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: "nbody",
    integrator: "pefrl", // Changed to adaptive for better numerical stability with close-in orbits
    algorithm: "tree-pm",
  };
}

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
  const acceleration = new OSVector3().setZero();
  if (targetBodyState.id === centralStar.id) {
    return acceleration; // Star is fixed
  }

  if (targetBodyState.mass_kg === 0 || centralStar.mass_kg === 0) {
    return acceleration; // Massless body or star means no gravitational force as calculated
  }

  const rVec = centralStar.position_m.clone().sub(targetBodyState.position_m);
  const distSq = rVec.lengthSq();

  // Gravitational softening parameter (in meters squared).
  // This prevents the gravitational force from becoming infinite at very small distances.
  // A value around (parentRadius + moonRadius)^2 or similar can be physical.
  const SOFTENING_SQUARED = 1e6; // 1 km^2, adjustable based on simulation scale

  // Calculate the effective distance squared for gravitational force, applying softening
  const effectiveDistSq = distSq + SOFTENING_SQUARED;

  // If distance is exactly zero (should not happen with proper initial conditions
  // and softening, but as a safeguard),
  if (distSq === 0) {
    return acceleration; // No acceleration if at the exact same point
  }

  const forceMagnitude =
    (GRAVITATIONAL_CONSTANT * centralStar.mass_kg * targetBodyState.mass_kg) /
    effectiveDistSq;

  const forceVec = rVec.normalize().multiplyScalar(forceMagnitude);

  acceleration.copy(forceVec).multiplyScalar(1 / targetBodyState.mass_kg);
  console.log("targetBodyState.mass_kg", targetBodyState.mass_kg);
  console.log("acceleration", acceleration);
  console.log("forceVec", forceVec);
  console.log("forceMagnitude", forceMagnitude);
  console.log("effectiveDistSq", effectiveDistSq);
  console.log("distSq", distSq);
  console.log("rVec", rVec);
  console.log("centralStar", centralStar);
  console.log("targetBodyState", targetBodyState);
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
    console.warn(
      "Invalid simulation configuration provided, using default:",
      config,
    );
    const defaultConfig = getDefaultConfiguration();
    return updateSimulation(bodies, dt, {
      ...params,
      simulationConfig: defaultConfig,
    });
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
    orbitalParameters,
    currentTime_s,
  } = params;

  // Ensure simulationConfig exists, apply default if not.
  const simulationConfig = params.simulationConfig ?? getDefaultConfiguration();
  if (!params.simulationConfig) {
    console.warn(
      `Simulation configuration was not provided; applying default:`,
      simulationConfig,
    );
  }

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

    // Cache for ideal mode calculations to ensure each body is only calculated once
    const idealCache = new Map<string, PhysicsStateReal>();

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

      // Check cache first - if we've already calculated this body's position, use it
      if (idealCache.has(body.id)) {
        updatedStates[body.id] = idealCache.get(body.id)!;
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

      // Cache the result and store it
      idealCache.set(body.id, newState);
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

  if (
    algorithm === "barnes-hut" ||
    algorithm === "fmm" ||
    algorithm === "p3m" ||
    algorithm === "tree-pm"
  ) {
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
        console.warn(
          `Unknown integrator: ${integrator}, falling back to verlet`,
        );
        integratedState = velocityVerletIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForAdvanced,
          dt,
        );
        break;
    }

    // Note: Removed special handling for primary stars to allow natural motion
    // Stars will now move according to the physics simulation, which is more realistic

    return integratedState;
  });

  const [finalStates, destroyedIds, destructionEvents] = handleCollisions(
    integratedStates,
    radii,
    isStar,
    bodyTypes,
    params.ignoreCollisions,
  );

  return {
    states: finalStates,
    accelerations,
    destroyedIds,
    destructionEvents,
  };
};
