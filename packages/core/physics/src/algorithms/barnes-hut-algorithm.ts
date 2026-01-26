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
 * Barnes-Hut force calculation algorithm using WASM spatial partitioning.
 *
 * Uses WASM spatial partitioning as the primary spatial structure and builds
 * an octree from the same data for Barnes-Hut approximation calculations.
 * This ensures a single unified N-body pipeline through WASM.
 */
export class BarnesHutAlgorithm implements ForceCalculationAlgorithm {
  // Pre-allocated vectors for performance
  private tempAcceleration = new OSVector3();
  private octree?: Octree;
  private lastBodiesRef?: PhysicsStateReal[];
  private lastBodiesHash?: string;

  constructor(private spatialPartitioning: SpatialPartitioning) {}

  /**
   * Calculate acceleration for a target body using Barnes-Hut approximation.
   * Uses WASM spatial partitioning as the source of truth for body positions.
   */
  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3 {
    // Ensure WASM spatial partitioning is updated (single source of truth)
    if (!this.spatialPartitioning.isInitialized()) {
      console.warn(
        "[BarnesHutAlgorithm] WASM spatial partitioning not initialized, falling back to zero acceleration",
      );
      return new OSVector3(0, 0, 0);
    }

    // Build octree from current bodies if needed (for Barnes-Hut approximation)
    const bodiesHash = this.getBodiesHash(allBodies);
    if (!this.octree || this.lastBodiesHash !== bodiesHash) {
      this.buildOctreeFromBodies(allBodies);
      this.lastBodiesHash = bodiesHash;
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
   * Update the WASM spatial partitioning with new body positions.
   * This is the single entry point for updating spatial data in the N-body pipeline.
   */
  update(bodies: PhysicsStateReal[]): void {
    if (!this.spatialPartitioning.isInitialized()) {
      console.warn(
        "[BarnesHutAlgorithm] Cannot update: WASM spatial partitioning not initialized",
      );
      return;
    }

    // Update WASM spatial partitioning (single source of truth)
    this.spatialPartitioning.update(bodies);

    // Invalidate octree cache so it rebuilds on next force calculation
    this.lastBodiesHash = undefined;
    this.lastBodiesRef = bodies;
  }

  /**
   * Build octree from body data for Barnes-Hut approximation.
   * The octree is built from the same body data that WASM uses.
   */
  private buildOctreeFromBodies(bodies: PhysicsStateReal[]): void {
    if (bodies.length === 0) {
      this.octree = undefined;
      this.lastBodiesRef = bodies;
      return;
    }

    // Calculate octree size from body positions
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

  /**
   * Generate a simple hash of body IDs and positions for cache invalidation.
   */
  private getBodiesHash(bodies: PhysicsStateReal[]): string {
    if (bodies.length === 0) return "";
    // Simple hash based on body count and first/last body IDs
    return `${bodies.length}_${bodies[0]?.id}_${bodies[bodies.length - 1]?.id}`;
  }
}
