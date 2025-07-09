import type { PhysicsStateReal, OrbitalParameters } from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import { calculateKeplerianStateAtTime } from "../../orbital/kepler";
import { sortBodiesByHierarchy } from "../../utils";

/**
 * Simulation step result for Ideal Orrery mode
 */
export interface IdealOrbitResult {
  states: PhysicsStateReal[];
  metadata: {
    stepTime: number;
    algorithmUsed: string;
    integratorUsed: string;
    totalBodies: number;
  };
}

/**
 * Parameters for Ideal Orrery simulation
 */
export interface IdealOrbitParams {
  bodies: PhysicsStateReal[];
  deltaTime: number;
  configuration: SimulationConfiguration;
  orbitalParameters: Map<string, OrbitalParameters>;
  parentIds: Map<string, string>;
  currentTime_s: number;
}

/**
 * Ideal Orrery simulation using perfect Keplerian orbits
 * Provides stable, predictable orbital mechanics without N-body interactions
 */
export class IdealOrreryStrategy {
  readonly name = "ideal-orrery";
  readonly description = "Perfect Keplerian orbits with no gravitational interactions";
  readonly complexity = "O(N)";

  simulate(params: IdealOrbitParams): IdealOrbitResult {
    const startTime = performance.now();
    
    const { bodies, orbitalParameters, parentIds, currentTime_s } = params;
    
    // Validate required parameters for ideal mode
    if (!orbitalParameters || currentTime_s === undefined || !parentIds) {
      console.error(
        'CRITICAL: "ideal" physics mode requires orbitalParameters, currentTime_s, and parentIds to be provided.'
      );
      return {
        states: bodies,
        metadata: {
          stepTime: 0,
          algorithmUsed: "ideal-error",
          integratorUsed: "none",
          totalBodies: bodies.length
        }
      };
    }

    const bodyMap = new Map(bodies.map((b) => [b.id, b]));
    const sortedBodies = sortBodiesByHierarchy(bodies, parentIds);
    const updatedStates: Record<string, PhysicsStateReal> = {};

    // Process each body using hierarchical order
    for (const body of sortedBodies) {
      const bodyOrbitalParams = orbitalParameters.get(body.id);
      const parentId = parentIds.get(body.id);

      // Bodies without parents or orbital parameters remain unchanged
      if (!parentId || !bodyOrbitalParams) {
        updatedStates[body.id] = body;
        continue;
      }

      // Get the parent's updated state from this simulation step
      const parentState = updatedStates[parentId];

      if (!parentState) {
        console.warn(
          `Could not find parent with ID ${parentId} for body ${body.id} in the set of already-updated bodies. This should not happen with a sorted list.`
        );
        updatedStates[body.id] = body; // Keep original state if can't update
        continue;
      }

      // Calculate the ideal Keplerian orbit position
      const newState = this.calculateIdealOrbit(
        body,
        parentState,
        bodyOrbitalParams,
        currentTime_s
      );
      updatedStates[body.id] = newState;
    }

    const endTime = performance.now();
    
    return {
      states: Object.values(updatedStates),
      metadata: {
        stepTime: endTime - startTime,
        algorithmUsed: "keplerian",
        integratorUsed: "analytical",
        totalBodies: bodies.length
      }
    };
  }

  canHandle(config: SimulationConfiguration): boolean {
    return config.mode === "ideal";
  }

  getRecommendedParameters(): Partial<IdealOrbitParams> {
    return {
      // No special parameters needed for ideal mode
    };
  }

  /**
   * Calculates the ideal Keplerian orbit position for a body
   * This is based on the existing idealOrbit function
   */
  private calculateIdealOrbit(
    body: PhysicsStateReal,
    parent: PhysicsStateReal,
    orbitalParameters: OrbitalParameters,
    currentTime_s: number
  ): PhysicsStateReal {
    // Calculate relative state using the centralized Keplerian solver
    const { position, velocity } = calculateKeplerianStateAtTime(
      orbitalParameters,
      currentTime_s
    );

    // Add parent's state for world coordinates
    // This translates the relative orbit into the simulation's absolute space
    position.add(parent.position_m);
    velocity.add(parent.velocity_mps);

    // Return the new state
    return {
      ...body,
      position_m: position,
      velocity_mps: velocity,
    };
  }
}