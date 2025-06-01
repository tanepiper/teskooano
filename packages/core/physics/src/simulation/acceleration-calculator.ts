import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../types";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";
import { Octree } from "../spatial/octree";
import type { PhysicsEngineType } from "@teskooano/data-types";
import { calculateNewtonianForce } from "../forces/postNewtonian/newtonian";

/**
 * @class AccelerationCalculator
 * @description Handles acceleration calculations for different physics engine modes.
 * Responsible for computing gravitational forces and accelerations based on the selected physics model.
 */
export class AccelerationCalculator {
  private static readonly MIN_DISTANCE_SQ = 1e6; // 1km^2 to prevent extreme forces

  /**
   * Calculate acceleration for N-Body physics using Barnes-Hut approximation
   * @param targetBodyState The body to calculate acceleration for
   * @param octree The spatial octree containing all bodies
   * @param theta Barnes-Hut approximation parameter
   * @returns Acceleration vector in m/s²
   */
  public calculateNBodyAcceleration(
    targetBodyState: PhysicsStateReal,
    octree: Octree,
    theta: number = 0.7,
  ): OSVector3 {
    // EXPERIMENT: Use pure Newtonian force for performance comparison
    const forceFunction = (
      body1: PhysicsStateReal,
      body2: PhysicsStateReal,
      G: number,
    ) => {
      return calculateNewtonianForce(body1, body2, G);
    };

    const netForce = octree.calculateForceOn(
      targetBodyState,
      theta,
      forceFunction, // Pass the Newtonian force function
    );
    const acceleration = new OSVector3(0, 0, 0);

    if (targetBodyState.mass_kg !== 0) {
      acceleration.copy(netForce).multiplyScalar(1 / targetBodyState.mass_kg);
    }

    return acceleration;
  }

  /**
   * Calculate acceleration for simplified 2-body physics with a fixed central star
   * @param targetBodyState The body to calculate acceleration for
   * @param centralStar The central attractor (usually a star)
   * @returns Acceleration vector in m/s²
   */
  public calculateSimpleAcceleration(
    targetBodyState: PhysicsStateReal,
    centralStar: PhysicsStateReal,
  ): OSVector3 {
    const acceleration = new OSVector3(0, 0, 0);

    // Star is fixed - no acceleration
    if (targetBodyState.id === centralStar.id) {
      return acceleration;
    }

    // Massless bodies don't experience gravitational force
    if (targetBodyState.mass_kg === 0 || centralStar.mass_kg === 0) {
      return acceleration;
    }

    const rVec = centralStar.position_m.clone().sub(targetBodyState.position_m);
    const distSq = rVec.lengthSq();

    // Prevent extreme forces at close distances
    if (distSq < AccelerationCalculator.MIN_DISTANCE_SQ) {
      return acceleration;
    }

    const forceMag =
      (GRAVITATIONAL_CONSTANT * centralStar.mass_kg * targetBodyState.mass_kg) /
      distSq;
    const forceVec = rVec.normalize().multiplyScalar(forceMag);

    acceleration.copy(forceVec).multiplyScalar(1 / targetBodyState.mass_kg);
    return acceleration;
  }

  /**
   * Calculate accelerations for all bodies based on the physics engine mode
   * @param bodies Array of all physics bodies
   * @param physicsEngine The physics engine mode to use
   * @param octreeSize Size of the octree for N-body calculations
   * @param octreeMaxDepth Maximum depth for octree subdivision
   * @param softeningLength Gravitational softening parameter
   * @param barnesHutTheta Barnes-Hut approximation parameter
   * @param isStar Map indicating which bodies are stars
   * @param parentIds Map of parent-child relationships
   * @returns Map of body IDs to their acceleration vectors
   */
  public calculateAccelerationsForAllBodies(
    bodies: PhysicsStateReal[],
    physicsEngine: PhysicsEngineType,
    octreeSize: number,
    octreeMaxDepth: number,
    softeningLength: number,
    barnesHutTheta: number,
    isStar: Map<string | number, boolean>,
    parentIds?: Map<string | number, string | undefined>,
  ): {
    accelerations: Map<string, OSVector3>;
    octree?: Octree;
    centralStar?: PhysicsStateReal;
  } {
    const accelerations = new Map<string, OSVector3>();
    let octree: Octree | undefined;
    let centralStar: PhysicsStateReal | undefined;

    if (physicsEngine === "verlet") {
      octree = new Octree(octreeSize, octreeMaxDepth, softeningLength);

      // Insert all bodies into octree
      bodies.forEach((body) => {
        octree!.insert(body);
      });

      // Calculate N-body accelerations
      bodies.forEach((body) => {
        const acc = this.calculateNBodyAcceleration(
          body,
          octree!,
          barnesHutTheta,
        );
        accelerations.set(body.id, acc);
      });
    } else {
      // Find central star for simplified physics modes
      centralStar = this.findCentralStar(bodies, isStar, parentIds);

      if (
        !centralStar &&
        (physicsEngine === "euler" || physicsEngine === "symplectic")
      ) {
        console.warn(
          `Simplified physics mode (${physicsEngine}) selected, but no central star identified. Bodies will experience no gravitational forces unless parentIds are defined and resolve.`,
        );
      }

      if (physicsEngine === "euler" || physicsEngine === "symplectic") {
        this.calculateSimplifiedAccelerations(
          bodies,
          accelerations,
          centralStar,
          isStar,
          parentIds,
        );
      }
    }

    return { accelerations, octree, centralStar };
  }

  /**
   * Find the central star for simplified physics calculations
   */
  private findCentralStar(
    bodies: PhysicsStateReal[],
    isStar: Map<string | number, boolean>,
    parentIds?: Map<string | number, string | undefined>,
  ): PhysicsStateReal | undefined {
    // Prefer a star that has no parentId (main/root star)
    let centralStar = bodies.find(
      (b) => isStar.get(b.id) && (!parentIds || !parentIds.get(b.id)),
    );

    // Fallback to first star found
    if (!centralStar) {
      centralStar = bodies.find((b) => isStar.get(b.id));
    }

    return centralStar;
  }

  /**
   * Calculate accelerations for simplified physics modes (euler/symplectic)
   */
  private calculateSimplifiedAccelerations(
    bodies: PhysicsStateReal[],
    accelerations: Map<string, OSVector3>,
    centralStar: PhysicsStateReal | undefined,
    isStar: Map<string | number, boolean>,
    parentIds?: Map<string | number, string | undefined>,
  ): void {
    const bodyMap = new Map(bodies.map((b) => [b.id, b]));

    bodies.forEach((body) => {
      if (centralStar && body.id === centralStar.id) {
        // Central star is fixed
        accelerations.set(body.id, new OSVector3(0, 0, 0));
        return;
      }

      let attractorState: PhysicsStateReal | undefined;
      const parentId = parentIds?.get(body.id);

      if (parentId) {
        attractorState = bodyMap.get(parentId);
        if (!attractorState) {
          console.warn(
            `Body ${body.id} has parentId ${parentId}, but parent not found in current bodies. Defaulting to central star if available.`,
          );
        }
      }

      // If no specific parent or parent not found, default to central star
      if (!attractorState && centralStar) {
        attractorState = centralStar;
      }

      if (attractorState && attractorState.id !== body.id) {
        const acc = this.calculateSimpleAcceleration(body, attractorState);
        accelerations.set(body.id, acc);
      } else {
        // No valid attractor
        accelerations.set(body.id, new OSVector3(0, 0, 0));
      }
    });
  }
}
