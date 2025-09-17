import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { calculateNewtonianGravitationalForce } from "../forces/gravity";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmConfig,
} from "./force-calculation-algorithm";
import { SpatialPartitioning } from "../spatial/spatial-partitioning";

/**
 * Barnes-Hut force calculation algorithm using WASM spatial partitioning
 *
 * Uses the WASM library to create a neighbor graph and applies
 * Barnes-Hut approximation for efficient force calculations.
 */
export class BarnesHutAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3); // Pre-allocate for performance
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for performance
  private tempForce = new OSVector3();
  private tempAcceleration = new OSVector3();

  constructor(
    private spatialPartitioning: SpatialPartitioning,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
  ) {
    this.bodiesToFloat32Array = dependencies?.bodiesToFloat32Array;
  }

  /**
   * Calculate acceleration for a target body using Barnes-Hut approximation
   */
  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3 {
    if (!this.spatialPartitioning.isInitialized()) {
      console.warn(
        "WASM spatial partitioning not initialized, skipping acceleration calculation",
      );
      return new OSVector3(0, 0, 0);
    }

    // Use WASM spatial partitioning to build neighbor graph
    const positions = this.bodiesToFloat32Array
      ? this.bodiesToFloat32Array(allBodies)
      : this.bodiesToFloat32ArrayFallback(allBodies);
    const threshold = config.barnesHutThreshold || 1000 * 1.496e11; // Default 1000 AU
    const neighborGraph = this.spatialPartitioning.createNearByGraph(
      positions,
      threshold,
    );

    // Find the index of the target body
    const targetIndex = allBodies.findIndex(
      (body) => body.id === targetBody.id,
    );
    if (targetIndex === -1) {
      return new OSVector3(0, 0, 0);
    }

    // Apply Barnes-Hut approximation using the neighbor graph
    return this.calculateBarnesHutForces(
      targetBody,
      allBodies,
      neighborGraph,
      targetIndex,
      threshold,
    );
  }

  /**
   * Convert bodies to Float32Array for WASM library (fallback implementation)
   */
  private bodiesToFloat32ArrayFallback(
    bodies: PhysicsStateReal[],
  ): Float32Array {
    // Reuse pre-allocated array if possible
    if (bodies.length * 3 > this.tempPositions.length) {
      this.tempPositions = new Float32Array(bodies.length * 3);
    }

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const idx = i * 3;
      this.tempPositions[idx] = body.position_m.x;
      this.tempPositions[idx + 1] = body.position_m.y;
      this.tempPositions[idx + 2] = body.position_m.z;
    }

    return this.tempPositions.slice(0, bodies.length * 3);
  }

  /**
   * Calculate forces using Barnes-Hut approximation (optimized version)
   */
  private calculateBarnesHutForces(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    neighborGraph: number[][],
    targetIndex: number,
    threshold: number,
  ): OSVector3 {
    const netForce = new OSVector3(0, 0, 0);
    const targetNeighbors = neighborGraph[targetIndex] || [];

    // Calculate forces from direct neighbors (close bodies)
    for (const neighborIndex of targetNeighbors) {
      if (neighborIndex === targetIndex) continue; // Skip self

      const neighborBody = allBodies[neighborIndex];
      if (!neighborBody) continue;

      const distance = targetBody.position_m.distanceTo(
        neighborBody.position_m,
      );

      // Use pre-allocated vector for force calculation
      const force = calculateNewtonianGravitationalForce(
        neighborBody,
        targetBody,
        GRAVITATIONAL_CONSTANT,
      );
      netForce.add(force);
    }

    // For bodies not in the neighbor graph, use a simplified approximation
    // This is a basic implementation - a full Barnes-Hut would build a proper octree
    const processedIndices = new Set([targetIndex, ...targetNeighbors]);

    for (let i = 0; i < allBodies.length; i++) {
      if (processedIndices.has(i)) continue;

      const body = allBodies[i];
      const distance = targetBody.position_m.distanceTo(body.position_m);

      // Only consider very distant bodies for approximation
      if (distance > threshold) {
        const force = calculateNewtonianGravitationalForce(
          body,
          targetBody,
          GRAVITATIONAL_CONSTANT,
        );
        netForce.add(force);
      }
    }

    // Use pre-allocated vector for acceleration calculation
    this.tempAcceleration.set(0, 0, 0);
    if (targetBody.mass_kg !== 0) {
      this.tempAcceleration
        .copy(netForce)
        .multiplyScalar(1 / targetBody.mass_kg);
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
  }
}
