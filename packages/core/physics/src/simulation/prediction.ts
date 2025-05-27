import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { Octree } from "../spatial/octree";
import { velocityVerletIntegrate } from "../integrators";
import * as THREE from "three";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

/**
 * Options for trajectory prediction
 */
export interface TrajectoryPredictionOptions {
  octreeSize?: number;
  barnesHutTheta?: number;
  scaleToSceneUnits?: boolean;
  collisionDetection?: boolean;
  bodyTypes?: Map<string | number, CelestialType>;
  radii?: Map<string | number, number>;
  octreeMaxDepth?: number;
  softeningLength?: number;
}

/**
 * @class TrajectoryPredictionService
 * @description Singleton service for predicting celestial body trajectories.
 * Provides methods to calculate future orbital paths using the same physics
 * calculations as the main simulation engine.
 */
export class TrajectoryPredictionService {
  private static instance: TrajectoryPredictionService;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance of the TrajectoryPredictionService
   * @returns The singleton instance
   */
  public static getInstance(): TrajectoryPredictionService {
    if (!TrajectoryPredictionService.instance) {
      TrajectoryPredictionService.instance = new TrajectoryPredictionService();
    }
    return TrajectoryPredictionService.instance;
  }

  /**
   * Predicts the future trajectory of a specific body using the same physics
   * calculation methods as the main simulation.
   *
   * @param targetBodyId - The ID of the body whose trajectory is being predicted.
   * @param allBodiesInitialStates - An array containing the initial PhysicsStateReal for all bodies.
   * @param duration_s - The total time duration (in seconds) for which to predict the trajectory.
   * @param steps - The number of discrete time steps to use for the integration.
   * @param options - Optional parameters for the prediction.
   * @returns An array of THREE.Vector3 points representing the predicted trajectory, scaled for visualization.
   */
  public predictTrajectory(
    targetBodyId: string | number,
    allBodiesInitialStates: PhysicsStateReal[],
    duration_s: number,
    steps: number,
    options: TrajectoryPredictionOptions = {},
  ): THREE.Vector3[] {
    const {
      octreeSize = 5e13,
      octreeMaxDepth = 20,
      softeningLength = 1e6,
      barnesHutTheta = 0.7,
      scaleToSceneUnits = true,
      collisionDetection = false,
      bodyTypes = new Map(),
      radii = new Map(),
    } = options;

    if (
      steps <= 0 ||
      !allBodiesInitialStates ||
      allBodiesInitialStates.length === 0
    ) {
      return [];
    }

    const targetBodyIndex = allBodiesInitialStates.findIndex(
      (b) => b.id === targetBodyId,
    );
    if (targetBodyIndex === -1) {
      console.warn(
        `Target body ID ${targetBodyId} not found in initial states.`,
      );
      return [];
    }

    const dt = duration_s / steps;
    const predictedPoints: THREE.Vector3[] = [];

    // Make a deep copy of the initial states to avoid modifying the original data
    let currentStates: PhysicsStateReal[] = this.clonePhysicsStates(
      allBodiesInitialStates,
    );

    // Add the initial position
    const initialTargetState = currentStates[targetBodyIndex];
    if (initialTargetState.position_m) {
      const initialPoint = this.convertToVisualizationPoint(
        initialTargetState.position_m,
        scaleToSceneUnits,
      );
      predictedPoints.push(initialPoint);
    } else {
      console.warn(`Initial target position missing for ${targetBodyId}`);
      return [];
    }

    // Simulation loop
    for (let i = 0; i < steps; i++) {
      const nextStates = this.integrateOneStep(
        currentStates,
        dt,
        octreeSize,
        octreeMaxDepth,
        softeningLength,
        barnesHutTheta,
      );

      if (!nextStates) {
        console.warn(
          `Prediction aborted at step ${i} due to integration error.`,
        );
        break;
      }

      // Handle collision detection if enabled
      if (
        collisionDetection &&
        this.detectCollisionWithTarget(nextStates, targetBodyId, radii, i)
      ) {
        break;
      }

      // Find and add the target body's new position
      const targetNextState = nextStates.find(
        (state) => state.id === targetBodyId,
      );
      if (targetNextState) {
        const nextPoint = this.convertToVisualizationPoint(
          targetNextState.position_m,
          scaleToSceneUnits,
        );
        predictedPoints.push(nextPoint);
      } else {
        console.warn(`Target state not found after step ${i}. Aborting.`);
        break;
      }

      // Update current states for next step
      currentStates = nextStates;
    }

    return predictedPoints;
  }

  /**
   * Predict multiple trajectories simultaneously for efficiency
   * @param targetBodyIds Array of body IDs to predict
   * @param allBodiesInitialStates Initial states of all bodies
   * @param duration_s Prediction duration in seconds
   * @param steps Number of integration steps
   * @param options Prediction options
   * @returns Map of body ID to trajectory points
   */
  public predictMultipleTrajectories(
    targetBodyIds: (string | number)[],
    allBodiesInitialStates: PhysicsStateReal[],
    duration_s: number,
    steps: number,
    options: TrajectoryPredictionOptions = {},
  ): Map<string | number, THREE.Vector3[]> {
    const results = new Map<string | number, THREE.Vector3[]>();

    if (targetBodyIds.length === 0) {
      return results;
    }

    const {
      octreeSize = 5e13,
      octreeMaxDepth = 20,
      softeningLength = 1e6,
      barnesHutTheta = 0.7,
      scaleToSceneUnits = true,
      collisionDetection = false,
      radii = new Map(),
    } = options;

    // Initialize result arrays
    targetBodyIds.forEach((id) => {
      results.set(id, []);
    });

    const dt = duration_s / steps;
    let currentStates = this.clonePhysicsStates(allBodiesInitialStates);

    // Add initial positions
    targetBodyIds.forEach((targetId) => {
      const initialState = currentStates.find((state) => state.id === targetId);
      if (initialState?.position_m) {
        const initialPoint = this.convertToVisualizationPoint(
          initialState.position_m,
          scaleToSceneUnits,
        );
        results.get(targetId)?.push(initialPoint);
      }
    });

    // Simulation loop
    for (let i = 0; i < steps; i++) {
      const nextStates = this.integrateOneStep(
        currentStates,
        dt,
        octreeSize,
        octreeMaxDepth,
        softeningLength,
        barnesHutTheta,
      );

      if (!nextStates) {
        console.warn(
          `Multi-prediction aborted at step ${i} due to integration error.`,
        );
        break;
      }

      // Add points for all target bodies
      targetBodyIds.forEach((targetId) => {
        const targetState = nextStates.find((state) => state.id === targetId);
        if (targetState) {
          const point = this.convertToVisualizationPoint(
            targetState.position_m,
            scaleToSceneUnits,
          );
          results.get(targetId)?.push(point);
        }
      });

      currentStates = nextStates;
    }

    return results;
  }

  /**
   * Clone physics states to avoid modifying original data
   */
  private clonePhysicsStates(states: PhysicsStateReal[]): PhysicsStateReal[] {
    return states.map((body) => ({
      ...body,
      position_m: body.position_m.clone(),
      velocity_mps: body.velocity_mps.clone(),
    }));
  }

  /**
   * Convert a position to a visualization point
   */
  private convertToVisualizationPoint(
    position: OSVector3,
    scaleToSceneUnits: boolean,
  ): THREE.Vector3 {
    return scaleToSceneUnits
      ? position.clone().multiplyScalar(METERS_TO_SCENE_UNITS).toThreeJS()
      : position.clone().toThreeJS();
  }

  /**
   * Perform one integration step for all bodies
   */
  private integrateOneStep(
    currentStates: PhysicsStateReal[],
    dt: number,
    octreeSize: number,
    octreeMaxDepth: number,
    softeningLength: number,
    barnesHutTheta: number,
  ): PhysicsStateReal[] | null {
    // Calculate accelerations using Octree (same as in main simulation)
    const octree = new Octree(octreeSize, octreeMaxDepth, softeningLength);
    currentStates.forEach((body) => octree.insert(body));

    const accelerations = new Map<string | number, OSVector3>();
    currentStates.forEach((body) => {
      const netForce = octree.calculateForceOn(body, barnesHutTheta);
      const acc = new OSVector3(0, 0, 0);
      if (body.mass_kg !== 0) {
        acc.copy(netForce).multiplyScalar(1 / body.mass_kg);
      }
      accelerations.set(body.id, acc);
    });

    // Integration
    const nextStates: PhysicsStateReal[] = [];
    let integrationError = false;

    for (const body of currentStates) {
      if (integrationError) break;

      const acceleration = accelerations.get(body.id);
      if (!acceleration) {
        console.error(`Acceleration calculation failed for body ${body.id}`);
        return null;
      }

      try {
        // Create acceleration calculator function for Verlet integration
        const calculateNewAcceleration = (
          stateGuess: PhysicsStateReal,
        ): OSVector3 => {
          const force = octree.calculateForceOn(stateGuess, barnesHutTheta);
          const acc = new OSVector3(0, 0, 0);
          if (stateGuess.mass_kg !== 0) {
            acc.copy(force).multiplyScalar(1 / stateGuess.mass_kg);
          }
          return acc;
        };

        // Use the same Verlet integrator as the main simulation
        const nextState = velocityVerletIntegrate(
          body,
          acceleration,
          calculateNewAcceleration,
          dt,
        );

        // Validate state
        if (!this.isValidPhysicsState(nextState)) {
          console.error(
            `Non-finite state detected for body ${body.id}. Aborting prediction.`,
          );
          return null;
        }

        nextStates.push(nextState);
      } catch (error) {
        console.error(`Error during integration for body ${body.id}:`, error);
        return null;
      }
    }

    return nextStates;
  }

  /**
   * Validate that a physics state has finite values
   */
  private isValidPhysicsState(state: PhysicsStateReal): boolean {
    const posOk =
      Number.isFinite(state.position_m.x) &&
      Number.isFinite(state.position_m.y) &&
      Number.isFinite(state.position_m.z);
    const velOk =
      Number.isFinite(state.velocity_mps.x) &&
      Number.isFinite(state.velocity_mps.y) &&
      Number.isFinite(state.velocity_mps.z);
    return posOk && velOk;
  }

  /**
   * Detect if there's a collision involving the target body
   */
  private detectCollisionWithTarget(
    nextStates: PhysicsStateReal[],
    targetBodyId: string | number,
    radii: Map<string | number, number>,
    stepIndex: number,
  ): boolean {
    if (radii.size === 0) return false;

    for (let j = 0; j < nextStates.length; j++) {
      const bodyA = nextStates[j];
      const radiusA = radii.get(bodyA.id) || 0;

      for (let k = j + 1; k < nextStates.length; k++) {
        const bodyB = nextStates[k];
        const radiusB = radii.get(bodyB.id) || 0;

        const distance = bodyA.position_m.distanceTo(bodyB.position_m);
        const combinedRadii = radiusA + radiusB;

        if (distance < combinedRadii) {
          // Collision detected that would involve our target
          if (bodyA.id === targetBodyId || bodyB.id === targetBodyId) {
            console.warn(
              `Collision predicted at step ${stepIndex} for target body. Ending prediction.`,
            );
            return true;
          }
        }
      }
    }
    return false;
  }
}

/** Singleton instance of the TrajectoryPredictionService */
export const trajectoryPredictionService =
  TrajectoryPredictionService.getInstance();

// Legacy functions removed - use trajectoryPredictionService singleton instead
