import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  AlgorithmType,
  type OrbitalParameters,
  PhysicsStateReal,
  SimulationMode,
  IntegratorType,
} from "@teskooano/data-types";
import { WasmCollisionDetection } from "../collision/wasm-collision";
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
import { WasmSpatialPartitioning } from "../spatial/wasm-partitioning";

import { sortBodiesByHierarchy } from "../utils";
import {
  SimulationParameters,
  SimulationStepResult,
  SimulationConfiguration,
} from "./types";
import {
  GRAVITATIONAL_CONSTANT,
  GRAVITATIONAL_SOFTENING_SQUARED,
} from "@teskooano/data-values";

/**
 * Configuration for WASM-enhanced simulation
 */
export interface WasmSimulationConfig {
  /** Maximum distance for neighbor finding (meters) */
  neighborDistance: number;
  /** Maximum distance for collision detection (meters) */
  collisionDistance: number;
}

/**
 * WASM-enhanced simulation manager with high-performance spatial partitioning
 */
export class WasmSimulationManager {
  private wasmCollisionDetection: WasmCollisionDetection;
  private wasmSpatialPartitioning: WasmSpatialPartitioning;
  private config: WasmSimulationConfig;
  private initialized = false;

  constructor(config: Partial<WasmSimulationConfig> = {}) {
    this.config = {
      neighborDistance: 1e9, // 1 billion meters for neighbor finding
      collisionDistance: 1e6, // 1 million meters for collision detection
      ...config,
    };

    this.wasmCollisionDetection = new WasmCollisionDetection({
      collisionDistance: this.config.collisionDistance,
    });

    this.wasmSpatialPartitioning = new WasmSpatialPartitioning(
      this.config.neighborDistance,
    );
  }

  /**
   * Initialize the WASM simulation manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.wasmCollisionDetection.initialize();
    await this.wasmSpatialPartitioning.initialize();
    this.initialized = true;
  }

  /**
   * Update simulation with WASM-enhanced collision detection and neighbor finding
   */
  updateSimulation(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    if (!this.initialized) {
      throw new Error(
        "WASM simulation manager not initialized. Call initialize() first.",
      );
    }

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

    const simulationConfig =
      params.simulationConfig ?? getDefaultConfiguration();

    if (simulationConfig.mode === SimulationMode.IDEAL) {
      return this.handleIdealMode(bodies, dt, params);
    }

    // Update WASM systems
    this.wasmCollisionDetection.update(bodies, radii, isStar, bodyTypes);
    this.wasmSpatialPartitioning.update(bodies);

    return this.handleNBodyMode(bodies, dt, params);
  }

  /**
   * Handle ideal mode simulation (Keplerian orbits)
   */
  private handleIdealMode(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    const { orbitalParameters, currentTime_s } = params;
    const updatedStates: Record<string, PhysicsStateReal> = {};
    const accelerations = new Map<string, OSVector3>();

    // Sort bodies by hierarchy for proper orbital calculations
    const sortedBodies = sortBodiesByHierarchy(
      bodies,
      params.parentIds || new Map(),
    );

    // Create a map of bodies for easy lookup
    const bodyMap = new Map(bodies.map((b) => [b.id, b]));

    sortedBodies.forEach((body) => {
      const orbitParams = orbitalParameters?.get(body.id);
      const parentId = params.parentIds?.get(body.id);

      if (orbitParams && parentId) {
        const parentState = bodyMap.get(parentId);
        if (parentState) {
          const newState = idealOrbit(
            body,
            parentState,
            orbitParams,
            (currentTime_s || 0) + dt,
          );
          updatedStates[body.id] = newState;
          accelerations.set(body.id, new OSVector3(0, 0, 0)); // No acceleration in ideal mode
        } else {
          updatedStates[body.id] = body;
          accelerations.set(body.id, new OSVector3(0, 0, 0));
        }
      } else {
        updatedStates[body.id] = body;
        accelerations.set(body.id, new OSVector3(0, 0, 0));
      }
    });

    return {
      states: Object.values(updatedStates),
      accelerations,
      destroyedIds: new Set(),
    };
  }

  /**
   * Handle N-body mode simulation with WASM enhancements
   */
  private handleNBodyMode(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
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

    const simulationConfig =
      params.simulationConfig ?? getDefaultConfiguration();
    const integrator = simulationConfig.integrator || IntegratorType.PEFRL;

    const accelerations = new Map<string, OSVector3>();
    let nBodyOctree: Octree | undefined;

    // Determine force calculation method based on algorithm
    const algorithm = simulationConfig.algorithm || AlgorithmType.BARNES_HUT;

    if (
      algorithm === AlgorithmType.BARNES_HUT ||
      algorithm === AlgorithmType.FMM ||
      algorithm === AlgorithmType.P3M ||
      algorithm === AlgorithmType.TREE_PM
    ) {
      // Use octree-based calculations for advanced algorithms
      nBodyOctree = new Octree(octreeSize);
      bodies.forEach((body) => {
        if (nBodyOctree) nBodyOctree.insert(body);
      });

      bodies.forEach((body) => {
        if (nBodyOctree) {
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
      if (centralStarState) {
        bodies.forEach((body) => {
          const acc = calculateAccelerationForBody_Simple(
            body,
            centralStarState,
          );
          accelerations.set(body.id, acc);
        });
      }
    }

    // Integration step
    const integratedStates = bodies.map((body) => {
      const currentAcceleration =
        accelerations.get(body.id) || new OSVector3(0, 0, 0);

      const calculateNewAccelerationForAdvanced = (
        stateGuess: PhysicsStateReal,
      ): OSVector3 => {
        if (nBodyOctree) {
          return calculateAccelerationForBody_NBody(
            stateGuess,
            nBodyOctree,
            barnesHutTheta,
          );
        } else {
          const centralStarState = bodies.find((b) => isStar.get(b.id));
          return centralStarState
            ? calculateAccelerationForBody_Simple(stateGuess, centralStarState)
            : new OSVector3(0, 0, 0);
        }
      };

      let integratedState: PhysicsStateReal;
      switch (integrator) {
        case IntegratorType.EULER:
          integratedState = standardEuler(body, currentAcceleration, dt);
          break;
        case IntegratorType.SYMPLECTIC:
          integratedState = symplecticEuler(body, currentAcceleration, dt);
          break;
        case IntegratorType.VERLET:
          integratedState = velocityVerletIntegrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          break;
        case IntegratorType.RK4:
          integratedState = rk4Integrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          break;
        case IntegratorType.ADAPTIVE:
          const adaptiveResult = adaptiveRKIntegrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          integratedState = adaptiveResult.newState;
          break;
        case IntegratorType.YOSHIDA4:
          integratedState = yoshida4Integrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          break;
        case IntegratorType.FOREST_RUTH:
          integratedState = forestRuthIntegrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          break;
        case IntegratorType.PEFRL:
          integratedState = pefrlIntegrate(
            body,
            currentAcceleration,
            calculateNewAccelerationForAdvanced,
            dt,
          );
          break;
        case IntegratorType.LEAPFROG:
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

      return integratedState;
    });

    // Use WASM collision detection with the integrated states
    this.wasmCollisionDetection.update(
      integratedStates,
      radii,
      isStar,
      bodyTypes,
    );
    const [finalStates, destroyedIds] =
      this.wasmCollisionDetection.handleCollisions(params.ignoreCollisions);

    return {
      states: finalStates,
      accelerations,
      destroyedIds,
    };
  }

  /**
   * Find all bodies within a specific distance of a given point
   */
  findBodiesInRange(point: OSVector3, distance: number): (string | number)[] {
    return this.wasmSpatialPartitioning.findBodiesInRange(point, distance);
  }

  /**
   * Find the closest body to a given point
   */
  findClosestBody(
    point: OSVector3,
  ): { bodyId: string | number; distance: number } | null {
    return this.wasmSpatialPartitioning.findClosestBody(point);
  }

  /**
   * Get statistics about the WASM simulation system
   */
  getStats(): {
    initialized: boolean;
    usingWasmCollisionDetection: boolean;
    usingWasmNeighborFinding: boolean;
    collisionDetectionStats?: any;
    spatialPartitioningStats?: any;
  } {
    return {
      initialized: this.initialized,
      usingWasmCollisionDetection: true, // Always using WASM now
      usingWasmNeighborFinding: true, // Always using WASM now
      collisionDetectionStats: this.wasmCollisionDetection.getStats(),
      spatialPartitioningStats: this.wasmSpatialPartitioning.getStats(),
    };
  }

  /**
   * Update the simulation configuration
   */
  updateConfig(config: Partial<WasmSimulationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.collisionDistance !== undefined) {
      this.wasmCollisionDetection.updateConfig({
        collisionDistance: config.collisionDistance,
      });
    }

    if (config.neighborDistance !== undefined) {
      this.wasmSpatialPartitioning.setNeighborDistance(config.neighborDistance);
    }
  }

  dispose(): void {
    this.wasmCollisionDetection.dispose();
    this.wasmSpatialPartitioning.dispose();
    this.initialized = false;
  }
}

// Helper functions (copied from simulation.ts)
function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: SimulationMode.NBODY,
    integrator: IntegratorType.PEFRL,
    algorithm: AlgorithmType.TREE_PM,
  };
}

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

const calculateAccelerationForBody_Simple = (
  targetBodyState: PhysicsStateReal,
  centralStar: PhysicsStateReal,
): OSVector3 => {
  const acceleration = new OSVector3().setZero();
  if (targetBodyState.id === centralStar.id) {
    return acceleration; // Star is fixed
  }

  if (targetBodyState.mass_kg === 0 || centralStar.mass_kg === 0) {
    return acceleration;
  }

  const rVec = centralStar.position_m.clone().sub(targetBodyState.position_m);
  const distSq = rVec.lengthSq();

  if (distSq < GRAVITATIONAL_SOFTENING_SQUARED) {
    return acceleration; // Too close, apply softening
  }

  const dist = Math.sqrt(distSq);
  const forceMagnitude =
    (GRAVITATIONAL_CONSTANT * centralStar.mass_kg * targetBodyState.mass_kg) /
    distSq;
  const forceVector = rVec.clone().multiplyScalar(forceMagnitude / dist);

  acceleration.copy(forceVector).multiplyScalar(1 / targetBodyState.mass_kg);
  return acceleration;
};
