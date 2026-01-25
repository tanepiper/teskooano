import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmConfig,
} from "./force-calculation-algorithm";

/**
 * FMM (Fast Multipole Method) force calculation algorithm using WASM spatial partitioning
 *
 * Uses the WASM library to create a neighbor graph and applies
 * Fast Multipole Method for efficient force calculations.
 */
export class FMMAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3); // Pre-allocate for performance
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for performance
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();
  private tempForce = new OSVector3();

  constructor(
    private spatialPartitioning: any,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
  ) {
    this.bodiesToFloat32Array = dependencies?.bodiesToFloat32Array;
  }

  /**
   * Calculate acceleration for a target body using FMM approximation
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
    const threshold = config.neighborDistance || 1000 * 1.496e11; // Default 1000 AU
    const neighborGraph =
      config.neighborGraph ||
      this.spatialPartitioning.createNearByGraph(
        this.bodiesToFloat32Array
          ? this.bodiesToFloat32Array(allBodies)
          : this.bodiesToFloat32ArrayFallback(allBodies),
        threshold,
      );

    // Validate that neighbor graph indices are within bounds
    if (neighborGraph.length !== allBodies.length) {
      console.warn(
        `Neighbor graph length (${neighborGraph.length}) doesn't match bodies length (${allBodies.length})`,
      );
    }

    // Additional validation: check if any neighbor indices are out of bounds
    for (let i = 0; i < neighborGraph.length; i++) {
      const neighbors = neighborGraph[i];
      for (const neighborIndex of neighbors) {
        if (neighborIndex >= allBodies.length) {
          console.error(
            `CRITICAL: Neighbor graph contains invalid index ${neighborIndex} for body ${i} (${allBodies[i]?.id}), bodies length: ${allBodies.length}`,
          );
          break;
        }
      }
    }

    // Find the index of the target body
    const targetIndex = allBodies.findIndex(
      (body) => body.id === targetBody.id,
    );

    if (targetIndex === -1) {
      return new OSVector3(0, 0, 0);
    }

    // Calculate FMM forces using neighbor graph
    return this.calculateFMMForces(
      targetBody,
      allBodies,
      neighborGraph,
      targetIndex,
      threshold,
    );
  }

  /**
   * Calculate FMM forces for a target body
   */
  private calculateFMMForces(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    neighborGraph: number[][],
    targetIndex: number,
    threshold: number,
  ): OSVector3 {
    const acceleration = new OSVector3(0, 0, 0);
    const G = GRAVITATIONAL_CONSTANT;

    // Get neighbors from the graph
    const neighbors = neighborGraph[targetIndex] || [];

    // For FMM, we use a hierarchical approach:
    // 1. Direct calculation for nearby particles (neighbors)
    // 2. Multipole expansion for distant particles

    // Direct calculation for neighbors (short-range forces)
    for (const neighborIndex of neighbors) {
      if (neighborIndex === targetIndex) continue;

      // Bounds check to ensure neighborIndex is valid
      if (neighborIndex < 0 || neighborIndex >= allBodies.length) {
        console.warn(
          `Invalid neighbor index: ${neighborIndex}, bodies length: ${allBodies.length}`,
        );
        continue;
      }

      const neighborBody = allBodies[neighborIndex];

      // Additional safety check
      if (!neighborBody || !neighborBody.position_m) {
        console.warn(
          `Invalid neighbor body at index ${neighborIndex}:`,
          neighborBody,
        );
        continue;
      }

      // Use pre-allocated vector for position difference
      this.tempPosition.set(
        neighborBody.position_m.x - targetBody.position_m.x,
        neighborBody.position_m.y - targetBody.position_m.y,
        neighborBody.position_m.z - targetBody.position_m.z,
      );
      const rMag = this.tempPosition.length();

      if (rMag > 0) {
        const forceMag = (G * neighborBody.mass_kg) / (rMag * rMag);
        this.tempPosition.multiplyScalar(forceMag / rMag);
        acceleration.add(this.tempPosition);
      }
    }

    // Multipole expansion for distant particles (long-range forces)
    // This is a simplified FMM implementation
    const distantBodies = allBodies.filter(
      (_, index) => !neighbors.includes(index) && index !== targetIndex,
    );

    if (distantBodies.length > 0) {
      // Group distant bodies into clusters for multipole expansion
      const clusters = this.createClusters(distantBodies, 8); // 8 clusters for simplicity

      for (const cluster of clusters) {
        if (cluster.length > 0) {
          const clusterForce = this.calculateMultipoleForce(
            targetBody,
            cluster,
          );
          acceleration.add(clusterForce);
        }
      }
    }

    return acceleration;
  }

  /**
   * Create clusters of bodies for multipole expansion (optimized version)
   */
  private createClusters(
    bodies: PhysicsStateReal[],
    numClusters: number,
  ): PhysicsStateReal[][] {
    if (bodies.length === 0) return [];

    // Pre-allocate clusters array
    const clusters: PhysicsStateReal[][] = [];
    for (let i = 0; i < numClusters; i++) {
      clusters[i] = [];
    }

    // Find bounding box using pre-allocated vectors
    const firstBody = bodies[0];
    this.tempMin.set(
      firstBody.position_m.x,
      firstBody.position_m.y,
      firstBody.position_m.z,
    );
    this.tempMax.set(
      firstBody.position_m.x,
      firstBody.position_m.y,
      firstBody.position_m.z,
    );

    // Single pass through bodies to find bounds
    for (let i = 1; i < bodies.length; i++) {
      const pos = bodies[i].position_m;
      this.tempMin.x = Math.min(this.tempMin.x, pos.x);
      this.tempMin.y = Math.min(this.tempMin.y, pos.y);
      this.tempMin.z = Math.min(this.tempMin.z, pos.z);
      this.tempMax.x = Math.max(this.tempMax.x, pos.x);
      this.tempMax.y = Math.max(this.tempMax.y, pos.y);
      this.tempMax.z = Math.max(this.tempMax.z, pos.z);
    }

    // Calculate range for normalization
    const rangeX = this.tempMax.x - this.tempMin.x;
    const rangeY = this.tempMax.y - this.tempMin.y;
    const rangeZ = this.tempMax.z - this.tempMin.z;

    // Assign bodies to clusters based on position
    for (const body of bodies) {
      const pos = body.position_m;
      const normalizedX = rangeX > 0 ? (pos.x - this.tempMin.x) / rangeX : 0;
      const normalizedY = rangeY > 0 ? (pos.y - this.tempMin.y) / rangeY : 0;
      const normalizedZ = rangeZ > 0 ? (pos.z - this.tempMin.z) / rangeZ : 0;

      // Simple 3D grid clustering
      const clusterX = Math.floor(normalizedX * 2);
      const clusterY = Math.floor(normalizedY * 2);
      const clusterZ = Math.floor(normalizedZ * 2);
      const clusterIndex = clusterX + clusterY * 2 + clusterZ * 4;

      if (clusterIndex >= 0 && clusterIndex < numClusters) {
        clusters[clusterIndex].push(body);
      }
    }

    return clusters;
  }

  /**
   * Calculate multipole force from a cluster of bodies (optimized version)
   */
  private calculateMultipoleForce(
    targetBody: PhysicsStateReal,
    cluster: PhysicsStateReal[],
  ): OSVector3 {
    if (cluster.length === 0) return new OSVector3(0, 0, 0);

    // Calculate cluster center of mass using pre-allocated vector
    let totalMass = 0;
    this.tempCenterOfMass.set(0, 0, 0);

    for (const body of cluster) {
      totalMass += body.mass_kg;

      // Use pre-allocated vector for position calculation
      this.tempPosition.set(
        body.position_m.x * body.mass_kg,
        body.position_m.y * body.mass_kg,
        body.position_m.z * body.mass_kg,
      );
      this.tempCenterOfMass.add(this.tempPosition);
    }

    if (totalMass === 0) return new OSVector3(0, 0, 0);

    this.tempCenterOfMass.multiplyScalar(1 / totalMass);

    // Calculate force from cluster center of mass using pre-allocated vector
    this.tempPosition.set(
      this.tempCenterOfMass.x - targetBody.position_m.x,
      this.tempCenterOfMass.y - targetBody.position_m.y,
      this.tempCenterOfMass.z - targetBody.position_m.z,
    );
    const rMag = this.tempPosition.length();

    if (rMag > 0) {
      const G = GRAVITATIONAL_CONSTANT;
      const forceMag = (G * totalMass) / (rMag * rMag);
      this.tempPosition.multiplyScalar(forceMag / rMag);
      return this.tempPosition.clone();
    }

    return new OSVector3(0, 0, 0);
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
   * Initialize the algorithm with the given bodies
   */
  initialize(bodies: PhysicsStateReal[]): void {
    // FMM-specific initialization if needed
    console.log(`FMM Algorithm initialized with ${bodies.length} bodies`);
  }

  /**
   * Update the algorithm's internal state
   */
  update(bodies: PhysicsStateReal[]): void {
    // FMM-specific updates if needed
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up FMM-specific resources
  }
}
