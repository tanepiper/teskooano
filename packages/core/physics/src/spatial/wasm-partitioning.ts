import { init, createNearByGraph } from "@robertaron/spacial-partitioning";
import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";

/**
 * Configuration for the WASM spatial partitioning system
 */
export interface WasmPartitioningConfig {
  /** Maximum distance to consider two points as neighbors (meters) */
  neighborDistance: number;
  /** Whether the WASM module has been initialized */
  initialized: boolean;
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageOperationTime: number;
  wasmOperations: number;
  traditionalOperations: number;
  lastResetTime: number;
}

/**
 * High-performance spatial partitioning using WASM
 * Provides O(n log n) neighbor finding and collision detection
 */
export class WasmSpatialPartitioning {
  private config: WasmPartitioningConfig;
  private bodyIds: (string | number)[] = [];
  private positions: Float32Array = new Float32Array();
  private neighborGraph: number[][] = [];
  private performanceMetrics: PerformanceMetrics = {
    totalOperations: 0,
    averageOperationTime: 0,
    wasmOperations: 0,
    traditionalOperations: 0,
    lastResetTime: Date.now(),
  };

  constructor(neighborDistance: number = 1e6) {
    this.config = {
      neighborDistance,
      initialized: false,
    };
    this.positions = new Float32Array();
    this.bodyIds = [];
  }

  /**
   * Initialize the WASM module. Must be called before using any other methods.
   */
  async initialize(): Promise<void> {
    if (this.config.initialized) {
      return;
    }

    try {
      await init();
      this.config.initialized = true;
    } catch (error) {
      console.error("Failed to initialize WASM spatial partitioning:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("WASM spatial partitioning initialization failed");
    }
  }

  /**
   * Update the spatial partitioning with new body positions
   * @param bodies Array of physics bodies to partition
   */
  update(bodies: PhysicsStateReal[]): void {
    if (!this.config.initialized) {
      throw new Error(
        "WASM spatial partitioning not initialized. Call initialize() first.",
      );
    }

    const numBodies = bodies.length;
    this.positions = new Float32Array(numBodies * 3);
    this.bodyIds = new Array(numBodies);

    // Convert bodies to flat position array
    for (let i = 0; i < numBodies; i++) {
      const body = bodies[i];
      const index = i * 3;
      this.positions[index] = body.position_m.x;
      this.positions[index + 1] = body.position_m.y;
      this.positions[index + 2] = body.position_m.z;
      this.bodyIds[i] = body.id;

      // Debug: Log first few positions to see the scale
      // if (i < 3) {
      //   console.log(`[WasmSpatialPartitioning] Body ${body.id} position: (${body.position_m.x.toFixed(2)}, ${body.position_m.y.toFixed(2)}, ${body.position_m.z.toFixed(2)}) meters`);
      // }
    }

    // Generate neighbor graph using WASM
    this.neighborGraph = createNearByGraph(
      this.positions,
      this.config.neighborDistance,
    );
  }

  /**
   * Find all bodies within the neighbor distance of a given body
   * @param bodyId The ID of the body to find neighbors for
   * @returns Array of neighbor body IDs
   */
  findNeighbors(bodyId: string | number): (string | number)[] {
    const index = this.bodyIds.indexOf(bodyId);
    if (index === -1) {
      return [];
    }

    return (
      this.neighborGraph[index]?.map(
        (neighborIndex) => this.bodyIds[neighborIndex],
      ) || []
    );
  }

  /**
   * Find all bodies within a specific distance of a given point
   * @param point The point to search around
   * @param distance The search distance (meters)
   * @returns Array of body IDs within the distance
   */
  findBodiesInRange(point: OSVector3, distance: number): (string | number)[] {
    if (!this.config.initialized) {
      return [];
    }

    // console.log(`[WasmSpatialPartitioning] Search point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}) meters`);
    // console.log(`[WasmSpatialPartitioning] Search distance: ${distance} meters`);

    const bodiesInRange: (string | number)[] = [];
    const distances: number[] = [];

    // Calculate distances to all stored bodies
    for (let i = 0; i < this.bodyIds.length; i++) {
      const index = i * 3;
      const bodyX = this.positions[index];
      const bodyY = this.positions[index + 1];
      const bodyZ = this.positions[index + 2];

      const dx = point.x - bodyX;
      const dy = point.y - bodyY;
      const dz = point.z - bodyZ;
      const distanceSq = dx * dx + dy * dy + dz * dz;
      const actualDistance = Math.sqrt(distanceSq);

      if (distanceSq <= distance * distance) {
        bodiesInRange.push(this.bodyIds[i]);
        distances.push(actualDistance);
      }
    }

    // Debug: Log the first few results to see what's happening
    // if (bodiesInRange.length > 0) {
    //   console.log(`[WasmSpatialPartitioning] Found ${bodiesInRange.length} bodies in range ${distance} meters from point (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}) meters`);
    //   console.log(`[WasmSpatialPartitioning] Body IDs: ${bodiesInRange.slice(0, 5).join(', ')}`);
    //   console.log(`[WasmSpatialPartitioning] Distances: ${distances.slice(0, 5).map(d => d.toFixed(2)).join(', ')} meters`);
    // }

    return bodiesInRange;
  }

  /**
   * Calculate distances from a point to all objects using WASM optimization
   * @param point The reference point
   * @returns Map of object IDs to distances in meters
   */
  calculateDistancesToAll(point: OSVector3): Map<string | number, number> {
    const distances = new Map<string | number, number>();

    if (!this.config.initialized) {
      return distances;
    }

    try {
      const pointX = point.x;
      const pointY = point.y;
      const pointZ = point.z;

      // Calculate distances to all objects
      for (let i = 0; i < this.positions.length; i += 3) {
        const objX = this.positions[i];
        const objY = this.positions[i + 1];
        const objZ = this.positions[i + 2];

        const dx = pointX - objX;
        const dy = pointY - objY;
        const dz = pointZ - objZ;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const objectIndex = i / 3;
        const objectId = this.bodyIds[objectIndex];
        if (objectId !== undefined) {
          distances.set(objectId, distance);
        }
      }
    } catch (error) {
      console.error("Error calculating distances:", error);
    }

    return distances;
  }

  /**
   * Get all potential collision pairs based on spatial proximity
   * @returns Array of [bodyId1, bodyId2] pairs that are close enough to potentially collide
   */
  getPotentialCollisionPairs(): [string | number, string | number][] {
    const pairs: [string | number, string | number][] = [];
    const seen = new Set<string>();

    for (let i = 0; i < this.neighborGraph.length; i++) {
      const neighbors = this.neighborGraph[i];
      const bodyId1 = this.bodyIds[i];

      for (const neighborIndex of neighbors) {
        const bodyId2 = this.bodyIds[neighborIndex];

        // Create a unique key for this pair to avoid duplicates
        const pairKey =
          bodyId1 < bodyId2 ? `${bodyId1}-${bodyId2}` : `${bodyId2}-${bodyId1}`;

        if (!seen.has(pairKey)) {
          seen.add(pairKey);
          pairs.push([bodyId1, bodyId2]);
        }
      }
    }

    return pairs;
  }

  /**
   * Find the closest body to a given point
   * @param point The point to search from
   * @returns The closest body ID and distance, or null if no bodies exist
   */
  findClosestBody(
    point: OSVector3,
  ): { bodyId: string | number; distance: number } | null {
    if (this.bodyIds.length === 0) {
      return null;
    }

    let closestBodyId: string | number | null = null;
    let closestDistance = Infinity;

    for (let i = 0; i < this.bodyIds.length; i++) {
      const index = i * 3;
      const bodyX = this.positions[index];
      const bodyY = this.positions[index + 1];
      const bodyZ = this.positions[index + 2];

      const dx = point.x - bodyX;
      const dy = point.y - bodyY;
      const dz = point.z - bodyZ;
      const distanceSq = dx * dx + dy * dy + dz * dz;

      if (distanceSq < closestDistance) {
        closestDistance = distanceSq;
        closestBodyId = this.bodyIds[i];
      }
    }

    return closestBodyId !== null
      ? { bodyId: closestBodyId, distance: Math.sqrt(closestDistance) }
      : null;
  }

  /**
   * Get all bodies within a spherical region
   * @param center The center of the sphere
   * @param radius The radius of the sphere (meters)
   * @returns Array of body IDs within the sphere
   */
  getBodiesInSphere(center: OSVector3, radius: number): (string | number)[] {
    return this.findBodiesInRange(center, radius);
  }

  /**
   * Update the neighbor distance threshold
   * @param distance New neighbor distance (meters)
   */
  setNeighborDistance(distance: number): void {
    this.config.neighborDistance = distance;
  }

  /**
   * Get the current configuration
   */
  getConfig(): WasmPartitioningConfig {
    return { ...this.config };
  }

  /**
   * Check if the WASM spatial partitioning is initialized
   */
  isInitialized(): boolean {
    return this.config.initialized;
  }

  /**
   * Get statistics about the current partitioning
   */
  getStats(): {
    totalBodies: number;
    averageNeighbors: number;
    maxNeighbors: number;
    neighborDistance: number;
    performance: PerformanceMetrics;
  } {
    if (this.neighborGraph.length === 0) {
      return {
        totalBodies: 0,
        averageNeighbors: 0,
        maxNeighbors: 0,
        neighborDistance: this.config.neighborDistance,
        performance: this.performanceMetrics,
      };
    }

    let totalNeighbors = 0;
    let maxNeighbors = 0;

    for (const neighbors of this.neighborGraph) {
      const neighborCount = neighbors.length;
      totalNeighbors += neighborCount;
      maxNeighbors = Math.max(maxNeighbors, neighborCount);
    }

    return {
      totalBodies: this.bodyIds.length,
      averageNeighbors: totalNeighbors / this.neighborGraph.length,
      maxNeighbors,
      neighborDistance: this.config.neighborDistance,
      performance: this.performanceMetrics,
    };
  }

  /**
   * Track performance metrics for operations
   */
  private trackOperation(
    operationType: "wasm" | "traditional",
    duration: number,
  ): void {
    this.performanceMetrics.totalOperations++;
    this.performanceMetrics.averageOperationTime =
      (this.performanceMetrics.averageOperationTime *
        (this.performanceMetrics.totalOperations - 1) +
        duration) /
      this.performanceMetrics.totalOperations;

    if (operationType === "wasm") {
      this.performanceMetrics.wasmOperations++;
    } else {
      this.performanceMetrics.traditionalOperations++;
    }
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalOperations: 0,
      averageOperationTime: 0,
      wasmOperations: 0,
      traditionalOperations: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * Update configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<WasmPartitioningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get performance improvement ratio
   */
  getPerformanceImprovement(): number {
    if (this.performanceMetrics.traditionalOperations === 0) {
      return 0;
    }
    return (
      this.performanceMetrics.wasmOperations /
      this.performanceMetrics.traditionalOperations
    );
  }

  dispose(): void {
    this.bodyIds = [];
    this.positions = new Float32Array();
    this.neighborGraph = [];
    this.config.initialized = false;
  }
}
