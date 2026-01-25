import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { AU_METERS } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmConfig,
} from "./force-calculation-algorithm";
import { SpatialPartitioning } from "../spatial/spatial-partitioning";
import { Octree } from "../spatial/octree";

/**
 * Barnes-Hut force calculation algorithm using an octree approximation.
 *
 * Builds a mass-weighted octree and uses the Barnes-Hut opening angle
 * to approximate distant bodies as a single point mass.
 */
export class BarnesHutAlgorithm implements ForceCalculationAlgorithm {
  // Pre-allocated vectors for performance
  private tempAcceleration = new OSVector3();
  private octree?: Octree;
  private lastBodiesRef?: PhysicsStateReal[];

  constructor(private spatialPartitioning: SpatialPartitioning) {}

  /**
   * Calculate acceleration for a target body using Barnes-Hut approximation
   */
  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3 {
    if (!this.octree || this.lastBodiesRef !== allBodies) {
      this.buildOctree(allBodies);
    }

    if (!this.octree) {
      return new OSVector3(0, 0, 0);
    }

    const theta = config.barnesHutTheta ?? 0.5;
    const force = this.octree.calculateForceOn(targetBody, theta);

    this.tempAcceleration.set(0, 0, 0);
    if (targetBody.mass_kg !== 0) {
      this.tempAcceleration.copy(force).multiplyScalar(1 / targetBody.mass_kg);
    }
    return this.tempAcceleration.clone();
  }

  /**
   * Update the spatial partitioning with new body positions
   */
  update(bodies: PhysicsStateReal[]): void {
    if (this.spatialPartitioning.isInitialized()) {
      this.spatialPartitioning.update(bodies);
    }
    this.buildOctree(bodies);
  }

  private buildOctree(bodies: PhysicsStateReal[]): void {
    if (bodies.length === 0) {
      this.octree = undefined;
      this.lastBodiesRef = bodies;
      return;
    }

    let maxDistance = 0;
    for (const body of bodies) {
      const distance = body.position_m.length();
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }

    const octreeSize = Math.max(maxDistance * 1.1, AU_METERS);
    this.octree = new Octree(octreeSize);
    for (const body of bodies) {
      this.octree.insert(body);
    }
    this.lastBodiesRef = bodies;
  }
}
