import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialPhysicsState,
  PhysicsEngineType,
  CelestialOrbitalProperties,
} from "@teskooano/celestial-object";
import {
  velocityVerletIntegrate,
  standardEuler,
  symplecticEuler,
} from "../integrators";
import { updateOrbitalBodyKepler } from "../orbital/orbital";
import { Octree } from "../spatial/octree";

/**
 * @class IntegrationManager
 * @description Manages different numerical integration schemes for physics simulation.
 * Handles state updates using various integrators (Verlet, Euler, Symplectic, Kepler).
 */
export class IntegrationManager {
  private static warnedInvalidOrbits = new Set<string>();

  private mergeIntegratorResult(
    originalBody: CelestialPhysicsState,
    integratorResult: {
      id: string;
      mass_kg: number;
      position_m: OSVector3;
      velocity_mps: OSVector3;
      ticksSinceLastPhysicsUpdate?: number;
    },
  ): CelestialPhysicsState {
    return {
      ...originalBody,
      id: integratorResult.id,
      mass_kg: integratorResult.mass_kg,
      position_m: integratorResult.position_m,
      velocity_mps: integratorResult.velocity_mps,
      ticksSinceLastPhysicsUpdate: integratorResult.ticksSinceLastPhysicsUpdate,
    };
  }

  public integrateAllBodies(
    bodies: CelestialPhysicsState[],
    accelerations: Map<string, OSVector3>,
    dt: number,
    physicsEngine: PhysicsEngineType,
    params: IntegrationParameters,
  ): CelestialPhysicsState[] {
    return bodies.map((body) => {
      const currentAcceleration =
        accelerations.get(body.id) || new OSVector3(0, 0, 0);

      let integratedState: CelestialPhysicsState;
      let integratorResult: any;

      switch (physicsEngine) {
        case "kepler":
          integratedState = this.integrateKepler(body, params);
          return integratedState;
        case "euler":
          integratorResult = standardEuler(body, currentAcceleration, dt);
          integratedState = this.mergeIntegratorResult(body, integratorResult);
          break;
        case "symplectic":
          integratorResult = symplecticEuler(body, currentAcceleration, dt);
          integratedState = this.mergeIntegratorResult(body, integratorResult);
          break;
        case "verlet":
        default:
          integratedState = this.integrateVerlet(
            body,
            currentAcceleration,
            params,
            dt,
          );
          break;
      }

      if (
        physicsEngine === "euler" ||
        physicsEngine === "symplectic" ||
        physicsEngine === "verlet"
      ) {
        integratedState = this.applySimplifiedPhysicsFixes(
          body,
          integratedState,
          params.isStar,
          params.parentIds,
        );
      }

      return integratedState;
    });
  }

  /**
   * Integrate using Kepler orbital mechanics (analytical solution)
   */
  private integrateKepler(
    body: CelestialPhysicsState,
    params: IntegrationParameters,
  ): CelestialPhysicsState {
    const orbit = params.orbitalParams?.get(body.id);
    const parentIdForBody = params.parentIds?.get(body.id);
    const isStar = params.isStar?.get(body.id) || false;

    if (isStar && !parentIdForBody) {
      return {
        ...body,
        position_m: body.position_m.clone(),
        velocity_mps: new OSVector3(0, 0, 0),
      };
    }

    let parentState: CelestialPhysicsState | undefined;
    if (parentIdForBody && params.allBodies) {
      parentState = params.allBodies.find((b) => b.id === parentIdForBody);
    }
    if (!parentState && params.centralStar) {
      parentState = params.centralStar;
    }

    if (orbit && parentState && this.isValidOrbitForKepler(orbit)) {
      const t = params.currentTime || 0;
      return updateOrbitalBodyKepler(body, parentState, orbit, -t);
    }

    if (orbit && !this.isValidOrbitForKepler(orbit)) {
      const bodyId = String(body.id);
      if (!IntegrationManager.warnedInvalidOrbits.has(bodyId)) {
        console.warn(
          `[IntegrationManager] Object ${bodyId} has invalid orbital parameters for Kepler mode. Keeping object fixed in space. Current position: ${body.position_m.x},${body.position_m.y},${body.position_m.z}`,
        );
        IntegrationManager.warnedInvalidOrbits.add(bodyId);
      }
    }
    return { ...body, velocity_mps: new OSVector3(0, 0, 0) };
  }

  /**
   * Check if orbital parameters are valid for Kepler integration
   */
  private isValidOrbitForKepler(orbit: CelestialOrbitalProperties): boolean {
    if (!orbit.period_s || orbit.period_s <= 0) {
      return false;
    }
    if (!orbit.semiMajorAxis_m || orbit.semiMajorAxis_m <= 0) {
      return false;
    }
    if (orbit.eccentricity < 0 || orbit.eccentricity >= 1) {
      return false;
    }
    return true;
  }

  /**
   * Integrate using Velocity Verlet method with N-body acceleration calculation
   */
  private integrateVerlet(
    body: CelestialPhysicsState,
    currentAcceleration: OSVector3,
    params: IntegrationParameters,
    dt: number,
  ): CelestialPhysicsState {
    const calculateNewAccelerationForVerlet = (
      newStateGuess: CelestialPhysicsState,
    ): OSVector3 => {
      if (!params.octree) {
        console.error(
          "CRITICAL: octree not initialized for Verlet integration when calculating new acceleration.",
        );
        return new OSVector3(0, 0, 0);
      }

      const netForce = params.octree.calculateForceOn(
        newStateGuess,
        params.barnesHutTheta || 0.7,
      );
      const acceleration = new OSVector3(0, 0, 0);
      if (newStateGuess.mass_kg !== 0) {
        acceleration.copy(netForce).multiplyScalar(1 / newStateGuess.mass_kg);
      }
      return acceleration;
    };

    const physicsStateRealBody = {
      id: body.id,
      mass_kg: body.mass_kg,
      position_m: body.position_m,
      velocity_mps: body.velocity_mps,
      ticksSinceLastPhysicsUpdate: body.ticksSinceLastPhysicsUpdate,
    };

    const integratorResult = velocityVerletIntegrate(
      physicsStateRealBody,
      currentAcceleration,
      (stateGuessReal) => {
        const celestialStateGuess: CelestialPhysicsState = {
          ...body,
          id: stateGuessReal.id,
          mass_kg: stateGuessReal.mass_kg,
          position_m: stateGuessReal.position_m,
          velocity_mps: stateGuessReal.velocity_mps,
          ticksSinceLastPhysicsUpdate:
            stateGuessReal.ticksSinceLastPhysicsUpdate,
        };
        return calculateNewAccelerationForVerlet(celestialStateGuess);
      },
      dt,
    );
    return this.mergeIntegratorResult(body, integratorResult);
  }

  /**
   * Apply fixes for simplified physics modes (keep primary stars fixed)
   */
  private applySimplifiedPhysicsFixes(
    originalBodyState: CelestialPhysicsState,
    integratedState: CelestialPhysicsState,
    isStar: Map<string | number, boolean>,
    parentIds?: Map<string | number, string | undefined>,
  ): CelestialPhysicsState {
    if (
      isStar.get(originalBodyState.id) &&
      (!parentIds || !parentIds.get(originalBodyState.id))
    ) {
      return {
        ...integratedState,
        velocity_mps: new OSVector3(0, 0, 0),
        position_m: originalBodyState.position_m.clone(),
      };
    }
    return integratedState;
  }
}

/**
 * Parameters needed for integration calculations
 */
export interface IntegrationParameters {
  isStar: Map<string | number, boolean>;
  parentIds?: Map<string | number, string | undefined>;
  orbitalParams?: Map<string | number, CelestialOrbitalProperties>;
  currentTime?: number;
  centralStar?: CelestialPhysicsState;
  allBodies?: CelestialPhysicsState[];
  octree?: Octree;
  barnesHutTheta?: number;
}
