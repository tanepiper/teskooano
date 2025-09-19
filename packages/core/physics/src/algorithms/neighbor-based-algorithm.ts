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

  // Performance optimization caches
  private lastNeighborIds: (string | number)[] = [];
  private lastTargetBodyId: string | number = "";
  private neighborCache: Map<string | number, (string | number)[]> = new Map();

  // Cache for spatial partitioning updates to reduce WASM calls
  private lastBodiesHash: string = "";
  private lastUpdateTime: number = 0;
  private updateThrottleMs: number = 16; // Only update every 16ms (60fps)

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
    // Create hash of current bodies state for caching
    const currentBodiesHash = this.createBodiesHash(allBodies);
    const currentTime = performance.now();

    // Throttle spatial partitioning updates to reduce WASM calls
    const shouldUpdateSpatialPartitioning =
      currentBodiesHash !== this.lastBodiesHash ||
      currentTime - this.lastUpdateTime > this.updateThrottleMs;

    if (shouldUpdateSpatialPartitioning) {
      // Update spatial partitioning only when necessary
      if (this.spatialPartitioning.isInitialized()) {
        this.spatialPartitioning.update(allBodies);
        this.lastBodiesHash = currentBodiesHash;
        this.lastUpdateTime = currentTime;
      }
    }

    // Use cached neighbors if available
    let neighborIds: (string | number)[] = [];

    if (
      targetBody.id === this.lastTargetBodyId &&
      this.lastNeighborIds.length > 0 &&
      currentBodiesHash === this.lastBodiesHash
    ) {
      // Reuse cached neighbors
      neighborIds = this.lastNeighborIds;
    } else {
      // Use WASM spatial partitioning for neighbor finding
      if (this.spatialPartitioning.isInitialized()) {
        neighborIds = this.spatialPartitioning.findNeighbors(targetBody.id);
        // Cache the result
        this.lastNeighborIds = neighborIds;
        this.lastTargetBodyId = targetBody.id;
        this.neighborCache.set(targetBody.id, neighborIds);
      } else {
        console.warn(
          "WASM spatial partitioning not initialized, skipping acceleration calculation",
        );
        return new OSVector3(0, 0, 0);
      }
    }

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

  /**
   * Create a hash of bodies for caching purposes
   */
  private createBodiesHash(bodies: PhysicsStateReal[]): string {
    // Simple hash based on body count and IDs
    return `${bodies.length}-${bodies.map((b) => b.id).join(",")}`;
  }
}
