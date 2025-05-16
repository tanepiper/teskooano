import { Observable, combineLatest } from "rxjs";
import { scan, startWith, map } from "rxjs/operators";
import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import { CelestialType } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";
import {
  handleCollisions,
  type DestructionEvent,
} from "../collision/collision";
import {
  velocityVerletIntegrate,
  standardEuler,
  symplecticEuler,
} from "../integrators";
import { Octree } from "../spatial/octree";
import type { PhysicsEngineType } from "@teskooano/core-state";

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
  parentIds?: Map<string | number, string | undefined>;
  octreeSize?: number;
  barnesHutTheta?: number;
  physicsEngine?: PhysicsEngineType;
}

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
    physicsEngine = "verlet",
  } = params;

  // DEBUGGING START for parentIds map (conditional for brevity)
  // const MOON_ID_TO_DEBUG_PHYSICS = "planet-star-ibinequi-eduniqu"; // <--- REPLACE THIS with the same moon ID as above
  // if ((physicsEngine === "euler" || physicsEngine === "symplectic")) {
  //   const bodyToDebug = bodies.find(b => b.id === MOON_ID_TO_DEBUG_PHYSICS);
  //   if (bodyToDebug) { // Only log if the specific moon is in the current bodies array
  //     const now = new Date().getTime(); // Using getTime for more frequent, potentially less readable timestamp here
  //     if (parentIds) {
  //       const actualParentIdForMoon = parentIds.get(MOON_ID_TO_DEBUG_PHYSICS);
  //       if (parentIds.has(MOON_ID_TO_DEBUG_PHYSICS)) {
  //           console.log(`[PhysicsDebug ${now}] Moon: ${MOON_ID_TO_DEBUG_PHYSICS}, Expected Parent in Map: ${actualParentIdForMoon}`);
  //       } else {
  //           console.log(`[PhysicsDebug ${now}] Moon: ${MOON_ID_TO_DEBUG_PHYSICS} NOT FOUND in parentIds map. Map size: ${parentIds.size}`);
  //       }
  //     } else {
  //       console.log(`[PhysicsDebug ${now}] Moon: ${MOON_ID_TO_DEBUG_PHYSICS} - parentIds map is UNDEFINED/NULL in simulation params.`);
  //     }
  //   }
  // }
  // DEBUGGING END

  const accelerations = new Map<string, OSVector3>();
  let nBodyOctree: Octree | undefined; // For Verlet N-body calculations

  if (physicsEngine === "verlet") {
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
    // Simplified physics for "euler" or "symplectic"
    const centralStarState = bodies.find((b) => isStar.get(b.id));
    const bodyMap = new Map(bodies.map((b) => [b.id, b])); // Helper to find bodies by ID

    if (!centralStarState) {
      console.warn(
        `Simplified physics mode (${physicsEngine}) selected, but no central star identified. Bodies will experience no gravitational forces unless parentIds are defined and resolve.`,
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

    // This function is only relevant for Verlet integration.
    // It captures the nBodyOctree from the outer scope.
    const calculateNewAccelerationForVerlet = (
      newStateGuess: PhysicsStateReal,
    ): OSVector3 => {
      if (!nBodyOctree) {
        // This case should ideally not be reached if physicsEngine is "verlet"
        // as nBodyOctree would have been initialized.
        console.error(
          "CRITICAL: nBodyOctree not initialized for Verlet integration path when calculating new acceleration.",
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

    let integratedState: PhysicsStateReal;
    switch (physicsEngine) {
      case "euler":
        integratedState = standardEuler(body, currentAcceleration, dt);
        break;
      case "symplectic":
        integratedState = symplecticEuler(body, currentAcceleration, dt);
        break;
      case "verlet":
      default:
        integratedState = velocityVerletIntegrate(
          body,
          currentAcceleration,
          calculateNewAccelerationForVerlet, // Pass the N-body version for Verlet
          dt,
        );
        break;
    }

    // If Euler/Symplectic mode, and this is a primary star (a star with no parent),
    // force its velocity to zero and keep its position fixed.
    // This overrides any motion calculated by the integrator for such stars in these modes.
    if (
      (physicsEngine === "euler" || physicsEngine === "symplectic") &&
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
