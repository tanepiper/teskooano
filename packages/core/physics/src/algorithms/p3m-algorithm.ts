import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmConfig,
} from "./force-calculation-algorithm";

/**
 * P3M (Particle-Particle Particle-Mesh) force calculation algorithm using WASM spatial partitioning
 *
 * Uses the WASM library to create a neighbor graph and applies
 * P3M method for efficient force calculations.
 */
export class P3MAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3); // Pre-allocate for performance
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
  private meshSize: number = 16; // Reduced from 64 to 16 (4,096 cells instead of 262,144)
  private cutoffRadius: number = 1000 * 1.496e11; // Default 1000 AU

  // Pre-allocated vectors for mesh creation to avoid memory allocation
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCellMin = new OSVector3();
  private tempCellMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();

  constructor(
    private spatialPartitioning: any,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
  ) {
    this.bodiesToFloat32Array = dependencies?.bodiesToFloat32Array;
  }

  /**
   * Calculate acceleration for a target body using P3M approximation
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

    // Calculate P3M forces using neighbor graph
    return this.calculateP3MForces(
      targetBody,
      allBodies,
      neighborGraph,
      targetIndex,
      threshold,
    );
  }

  /**
   * Calculate P3M forces for a target body (optimized version)
   */
  private calculateP3MForces(
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

    // P3M method combines:
    // 1. Direct particle-particle calculation for nearby particles
    // 2. Particle-mesh calculation for long-range forces

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

      if (rMag > 0 && rMag < this.cutoffRadius) {
        // Apply softening to avoid singularities
        const softening = 0.1 * 1.496e11; // 0.1 AU softening
        const rSoft = Math.sqrt(rMag * rMag + softening * softening);
        const forceMag = (G * neighborBody.mass_kg) / (rSoft * rSoft);

        // Use pre-allocated vector for force calculation
        this.tempPosition.multiplyScalar(forceMag / rMag);
        acceleration.add(this.tempPosition);
      }
    }

    // Particle-mesh calculation for long-range forces
    const meshForce = this.calculateMeshForce(
      targetBody,
      allBodies,
      neighbors,
      targetIndex,
    );
    acceleration.add(meshForce);

    return acceleration;
  }

  /**
   * Calculate long-range forces using particle-mesh method (optimized version)
   */
  private calculateMeshForce(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    neighbors: number[],
    targetIndex: number,
  ): OSVector3 {
    // Simplified particle-mesh calculation
    // In a full implementation, this would use FFT to solve Poisson equation

    const meshForce = new OSVector3(0, 0, 0);
    const G = GRAVITATIONAL_CONSTANT;

    // Calculate forces from distant particles (not in neighbors)
    const distantBodies = allBodies.filter(
      (_, index) => !neighbors.includes(index) && index !== targetIndex,
    );

    if (distantBodies.length === 0) return meshForce;

    // Create a simple mesh representation
    const mesh = this.createMesh(distantBodies);

    // Calculate force from mesh using pre-allocated vector
    for (const cell of mesh) {
      if (cell.totalMass > 0) {
        // Use pre-allocated vector for position difference
        this.tempPosition.set(
          cell.centerOfMass.x - targetBody.position_m.x,
          cell.centerOfMass.y - targetBody.position_m.y,
          cell.centerOfMass.z - targetBody.position_m.z,
        );
        const rMag = this.tempPosition.length();

        if (rMag > this.cutoffRadius) {
          // Apply mesh-based force calculation
          const forceMag = (G * cell.totalMass) / (rMag * rMag);
          this.tempPosition.multiplyScalar(forceMag / rMag);
          meshForce.add(this.tempPosition);
        }
      }
    }

    return meshForce;
  }

  /**
   * Create a simple mesh representation of distant bodies (optimized version)
   */
  private createMesh(bodies: PhysicsStateReal[]): Array<{
    centerOfMass: OSVector3;
    totalMass: number;
  }> {
    if (bodies.length === 0) return [];

    // Adaptive mesh size based on number of bodies to balance performance vs accuracy
    const adaptiveMeshSize = Math.min(
      this.meshSize,
      Math.max(8, Math.floor(Math.cbrt(bodies.length * 4))), // Scale with body count
    );

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

    // Calculate cell size using adaptive mesh size
    const cellSize = Math.max(
      (this.tempMax.x - this.tempMin.x) / adaptiveMeshSize,
      (this.tempMax.y - this.tempMin.y) / adaptiveMeshSize,
      (this.tempMax.z - this.tempMin.z) / adaptiveMeshSize,
    );

    // Pre-allocate mesh array with reasonable size estimate
    const mesh: Array<{
      centerOfMass: OSVector3;
      totalMass: number;
    }> = [];

    // Use spatial indexing instead of filtering all bodies for each cell
    const gridSize = adaptiveMeshSize;
    const cellSizeInv = 1.0 / cellSize;

    // Pre-calculate cell indices for all bodies
    const bodyCellIndices: number[] = [];
    for (let i = 0; i < bodies.length; i++) {
      const pos = bodies[i].position_m;
      const cellX = Math.floor((pos.x - this.tempMin.x) * cellSizeInv);
      const cellY = Math.floor((pos.y - this.tempMin.y) * cellSizeInv);
      const cellZ = Math.floor((pos.z - this.tempMin.z) * cellSizeInv);

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(gridSize - 1, cellX));
      const clampedY = Math.max(0, Math.min(gridSize - 1, cellY));
      const clampedZ = Math.max(0, Math.min(gridSize - 1, cellZ));

      bodyCellIndices[i] =
        clampedX * gridSize * gridSize + clampedY * gridSize + clampedZ;
    }

    // Group bodies by cell index
    const cellBodies: { [cellIndex: number]: number[] } = {};
    for (let i = 0; i < bodies.length; i++) {
      const cellIndex = bodyCellIndices[i];
      if (!cellBodies[cellIndex]) {
        cellBodies[cellIndex] = [];
      }
      cellBodies[cellIndex].push(i);
    }

    // Process only cells that have bodies
    for (const cellIndexStr in cellBodies) {
      const cellIndex = parseInt(cellIndexStr);
      const bodyIndices = cellBodies[cellIndex];

      if (bodyIndices.length > 0) {
        // Calculate cell center of mass using pre-allocated vector
        let totalMass = 0;
        this.tempCenterOfMass.set(0, 0, 0);

        for (const bodyIndex of bodyIndices) {
          const body = bodies[bodyIndex];
          totalMass += body.mass_kg;

          // Use pre-allocated vector for position calculation
          this.tempPosition.set(
            body.position_m.x * body.mass_kg,
            body.position_m.y * body.mass_kg,
            body.position_m.z * body.mass_kg,
          );
          this.tempCenterOfMass.add(this.tempPosition);
        }

        if (totalMass > 0) {
          this.tempCenterOfMass.multiplyScalar(1 / totalMass);
          mesh.push({
            centerOfMass: this.tempCenterOfMass.clone(),
            totalMass,
          });
        }
      }
    }

    return mesh;
  }

  /**
   * Check if a position is within a cell
   */
  private isInCell(
    pos: OSVector3,
    cellMin: OSVector3,
    cellMax: OSVector3,
  ): boolean {
    return (
      pos.x >= cellMin.x &&
      pos.x < cellMax.x &&
      pos.y >= cellMin.y &&
      pos.y < cellMax.y &&
      pos.z >= cellMin.z &&
      pos.z < cellMax.z
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
   * Initialize the algorithm with the given bodies
   */
  initialize(bodies: PhysicsStateReal[]): void {
    // P3M-specific initialization if needed
    console.log(`P3M Algorithm initialized with ${bodies.length} bodies`);
  }

  /**
   * Update the algorithm's internal state
   */
  update(bodies: PhysicsStateReal[]): void {
    // P3M-specific updates if needed
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up P3M-specific resources
  }
}
