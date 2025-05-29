import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { CelestialType } from "@teskooano/data-types";
import type { PhysicsEngineType } from "@teskooano/core-state";
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
  /**
   * Integrate all bodies using the specified physics engine
   * @param bodies Array of physics bodies to integrate
   * @param accelerations Map of current accelerations for each body
   * @param dt Time step
   * @param physicsEngine Physics engine mode
   * @param params Integration parameters
   * @returns Array of integrated physics states
   */
  public integrateAllBodies(
    bodies: PhysicsStateReal[],
    accelerations: Map<string, OSVector3>,
    dt: number,
    physicsEngine: PhysicsEngineType,
    params: IntegrationParameters,
  ): PhysicsStateReal[] {
    return bodies.map((body) => {
      const currentAcceleration =
        accelerations.get(body.id) || new OSVector3(0, 0, 0);

      let integratedState: PhysicsStateReal;

      switch (physicsEngine) {
        case "kepler":
          integratedState = this.integrateKepler(body, params);
          break;
        case "euler":
          integratedState = standardEuler(body, currentAcceleration, dt);
          break;
        case "symplectic":
          integratedState = symplecticEuler(body, currentAcceleration, dt);
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

      // Apply post-integration fixes for simplified physics modes
      if (physicsEngine === "euler" || physicsEngine === "symplectic") {
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
    body: PhysicsStateReal,
    params: IntegrationParameters,
  ): PhysicsStateReal {
    const orbit = params.orbitalParams?.get(body.id);
    const parentIdForBody = params.parentIds?.get(body.id);
    const isStar = params.isStar?.get(body.id) || false;

    // Special handling for primary stars in Kepler mode
    // Main star should stay fixed at origin in ideal orbits mode
    if (isStar && !parentIdForBody) {
      // This is a primary star with no parent - keep it fixed at its current position
      return {
        ...body,
        velocity_mps: new OSVector3(0, 0, 0), // No velocity for primary star
      };
    }

    let parentState: PhysicsStateReal | undefined;
    if (parentIdForBody && params.allBodies) {
      parentState = params.allBodies.find((b) => b.id === parentIdForBody);
    }
    if (!parentState && params.centralStar) {
      parentState = params.centralStar;
    }

    // Only attempt Kepler integration if we have valid orbital parameters
    if (orbit && parentState && this.isValidOrbitForKepler(orbit)) {
      const t = params.currentTime || 0;
      return updateOrbitalBodyKepler(
        body,
        parentState,
        orbit,
        -t, // Flip time sign to match drawn orbit direction in LH coordinates
      );
    }

    // Log warning once per invalid object
    if (orbit && !this.isValidOrbitForKepler(orbit)) {
      const bodyId = String(body.id);
      if (!IntegrationManager.warnedInvalidOrbits.has(bodyId)) {
        console.warn(
          `[IntegrationManager] Object ${bodyId} has invalid orbital parameters for Kepler mode. Keeping object fixed in space.`,
        );
        IntegrationManager.warnedInvalidOrbits.add(bodyId);
      }
    }

    // If no valid orbital parameters, return body unchanged (effectively fixed in space)
    return { ...body };
  }

  /**
   * Check if orbital parameters are valid for Kepler integration
   */
  private isValidOrbitForKepler(
    orbit: import("@teskooano/data-types").OrbitalParameters,
  ): boolean {
    // Check for essential parameters
    if (!orbit.period_s || orbit.period_s <= 0) {
      return false;
    }
    if (!orbit.realSemiMajorAxis_m || orbit.realSemiMajorAxis_m <= 0) {
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
    body: PhysicsStateReal,
    currentAcceleration: OSVector3,
    params: IntegrationParameters,
    dt: number,
  ): PhysicsStateReal {
    const calculateNewAccelerationForVerlet = (
      newStateGuess: PhysicsStateReal,
    ): OSVector3 => {
      if (!params.octree) {
        console.error(
          "CRITICAL: octree not initialized for Verlet integration when calculating new acceleration.",
        );
        return new OSVector3(0, 0, 0);
      }

      // Recalculate acceleration for the predicted state
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

    return velocityVerletIntegrate(
      body,
      currentAcceleration,
      calculateNewAccelerationForVerlet,
      dt,
    );
  }

  /**
   * Apply fixes for simplified physics modes (keep primary stars fixed)
   */
  private applySimplifiedPhysicsFixes(
    originalBody: PhysicsStateReal,
    integratedState: PhysicsStateReal,
    isStar: Map<string | number, boolean>,
    parentIds?: Map<string | number, string | undefined>,
  ): PhysicsStateReal {
    // If this is a primary star (star with no parent), keep it fixed
    if (
      isStar.get(originalBody.id) && // It's a star
      (!parentIds || !parentIds.has(originalBody.id)) // And it has no parent
    ) {
      return {
        ...integratedState,
        velocity_mps: new OSVector3(0, 0, 0), // Force velocity to zero
        position_m: originalBody.position_m.clone(), // Keep original position
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
  orbitalParams?: Map<
    string | number,
    import("@teskooano/data-types").OrbitalParameters
  >;
  currentTime?: number;
  centralStar?: PhysicsStateReal;
  allBodies?: PhysicsStateReal[];
  octree?: Octree;
  barnesHutTheta?: number;
}
