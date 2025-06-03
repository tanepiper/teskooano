import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialPhysicsState,
  CelestialStatus,
  CelestialType,
  PhysicsEngineType,
  CelestialOrbitalProperties,
} from "@teskooano/celestial-object";
import { AccelerationCalculator } from "./acceleration-calculator";
import {
  IntegrationManager,
  IntegrationParameters,
} from "./integration-manager";
import { handleCollisions } from "../collision/collision";
import type { DestructionEvent } from "../collision/collision-types";

/**
 * Result of a single simulation step
 */
export interface SimulationStepResult {
  states: CelestialPhysicsState[];
  accelerations: Map<string, OSVector3>;
  destroyedIds: Set<string | number>;
  destructionEvents: DestructionEvent[];
}

/**
 * Parameters needed for a simulation step
 */
export interface SimulationParameters {
  radii: Map<string | number, number>;
  isStar: Map<string | number, boolean>;
  bodyTypes: Map<string | number, CelestialType>;
  parentIds?: Map<string | number, string | undefined>;
  octreeSize?: number;
  octreeMaxDepth?: number;
  softeningLength?: number;
  barnesHutTheta?: number;
  physicsEngine?: PhysicsEngineType;
  orbitalParams?: Map<string | number, CelestialOrbitalProperties>;
  currentTime?: number;
}

/**
 * @class SimulationOrchestrator
 * @description Orchestrates the complete simulation step by coordinating acceleration calculations,
 * integration, and collision handling. Acts as the central coordinator for physics simulation.
 */
export class SimulationOrchestrator {
  private readonly accelerationCalculator: AccelerationCalculator;
  private readonly integrationManager: IntegrationManager;

  constructor() {
    this.accelerationCalculator = new AccelerationCalculator();
    this.integrationManager = new IntegrationManager();
  }

  /**
   * Execute a complete simulation step
   * @param bodies Array of all bodies in the simulation
   * @param dt Time step duration
   * @param params Simulation parameters
   * @returns Complete simulation step result
   */
  public executeSimulationStep(
    bodies: CelestialPhysicsState[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    // Set default parameters
    const {
      radii,
      isStar,
      bodyTypes,
      parentIds,
      octreeSize = 5e13,
      octreeMaxDepth = 20,
      softeningLength = 1e6,
      barnesHutTheta = 0.7,
      physicsEngine = "verlet",
      orbitalParams,
      currentTime,
    } = params;

    // Step 1: Calculate accelerations for all bodies
    const { accelerations, octree, centralStar } =
      this.accelerationCalculator.calculateAccelerationsForAllBodies(
        bodies,
        physicsEngine,
        octreeSize,
        octreeMaxDepth,
        softeningLength,
        barnesHutTheta,
        isStar,
        parentIds,
      );

    // Step 2: Integrate all bodies using the calculated accelerations
    const integrationParams: IntegrationParameters = {
      isStar,
      parentIds,
      orbitalParams,
      currentTime,
      centralStar,
      allBodies: bodies,
      octree,
      barnesHutTheta,
    };

    const integratedStates = this.integrationManager.integrateAllBodies(
      bodies,
      accelerations,
      dt,
      physicsEngine,
      integrationParams,
    );

    // Step 3: Handle collisions and destruction
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
  }

  /**
   * Create an initial empty simulation result
   * @param initialStates Initial physics states
   * @returns Initial simulation step result
   */
  public createInitialResult(
    initialStates: CelestialPhysicsState[],
  ): SimulationStepResult {
    return {
      states: initialStates,
      accelerations: new Map<string, OSVector3>(),
      destroyedIds: new Set<string | number>(),
      destructionEvents: [],
    };
  }
}
