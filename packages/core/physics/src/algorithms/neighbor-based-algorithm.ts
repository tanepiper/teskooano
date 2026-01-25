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
 * Neighbor-based force calculation algorithm
 *
 * Uses WASM spatial partitioning to find nearby bodies and calculates
 * forces between all neighbors. This is the current implementation
 * that was hardcoded in SimulationManager.
 */
export class NeighborBasedAlgorithm implements ForceCalculationAlgorithm {
  // Pre-allocated vectors for performance
  private tempForce = new OSVector3();
  private tempAcceleration = new OSVector3();

  // Pre-allocated body map to avoid creating new Map every call
  private bodyMap = new Map<string | number, PhysicsStateReal>();

  constructor(private spatialPartitioning: SpatialPartitioning) {}

  /**
   * Calculate acceleration for a target body using neighbor-based approach
   * Optimized with neighbor caching to reduce WASM calls
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

    const neighborIds = this.spatialPartitioning.findNeighbors(targetBody.id);

    const netForce = new OSVector3(0, 0, 0);

    // Reuse pre-allocated map for fast body lookup
    this.bodyMap.clear();
    for (const body of allBodies) {
      this.bodyMap.set(body.id, body);
    }

    // Calculate forces from all neighboring bodies
    for (const neighborId of neighborIds) {
      // Skip self-interaction
      if (neighborId === targetBody.id) continue;

      // Get neighbor body from the bodies array
      const neighborBody = this.bodyMap.get(neighborId);
      if (!neighborBody) continue;

      // Calculate gravitational force using standardized function
      const force = calculateNewtonianGravitationalForce(
        neighborBody,
        targetBody,
        GRAVITATIONAL_CONSTANT,
      );
      netForce.add(force);
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
