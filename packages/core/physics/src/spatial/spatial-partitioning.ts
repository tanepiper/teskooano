import { createNearByGraph, init } from "@robertaron/spacial-partitioning";
import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { PerformanceMetrics, WasmPartitioningConfig } from "./types";

/**
 * High-performance spatial partitioning using WASM
 * Provides O(n log n) neighbor finding and collision detection
 */
export class SpatialPartitioning {
  /**
   * Configuration for the WASM spatial partitioning system
   */
  private config: WasmPartitioningConfig;
  /**
   * Array of body IDs
   */
  private bodyIds: (string | number)[] = [];
  /**
   * Array of positions
   */
  private positions: Float32Array = new Float32Array();
  /**
   * Array of neighbor graph
   */
  private neighborGraph: number[][] = [];
  /**
   * Performance metrics
   */
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
    this.neighborGraph = []; // Ensure neighborGraph is initialized
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
   * Helper function to convert any array-like value to a regular number array.
   * Handles typed arrays (Uint32Array, Int32Array, etc.), regular arrays, and array-like objects.
   */
  private toNumberArray(value: unknown): number[] {
    // Already a regular array - filter for valid numbers
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is number => typeof v === "number" && !isNaN(v),
      );
    }

    // Handle typed arrays (Uint32Array, Int32Array, Float32Array, etc.)
    // TypedArrays have a length property and are iterable
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      // TypedArray - use spread operator which works with iterables
      const typedArray = value as unknown as Iterable<number>;
      try {
        return [...typedArray].filter(
          (v): v is number => typeof v === "number" && !isNaN(v),
        );
      } catch {
        return [];
      }
    }

    // Handle array-like objects with length property
    if (
      value !== null &&
      typeof value === "object" &&
      "length" in value &&
      typeof (value as ArrayLike<unknown>).length === "number"
    ) {
      try {
        return Array.from(value as ArrayLike<number>).filter(
          (v): v is number => typeof v === "number" && !isNaN(v),
        );
      } catch {
        return [];
      }
    }

    // Not convertible to array
    return [];
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
    this.neighborGraph = []; // Reset neighbor graph before updating

    // Convert bodies to flat position array
    for (let i = 0; i < numBodies; i++) {
      const body = bodies[i];
      const index = i * 3;
      this.positions[index] = body.position_m.x;
      this.positions[index + 1] = body.position_m.y;
      this.positions[index + 2] = body.position_m.z;
      this.bodyIds[i] = body.id;
    }

    // Generate neighbor graph using WASM
    try {
      const graph = createNearByGraph(
        this.positions,
        this.config.neighborDistance,
      );

      // Handle various return types from WASM
      // The WASM library may return typed arrays, regular arrays, or array-like objects
      let graphArray: unknown[];
      if (Array.isArray(graph)) {
        graphArray = graph;
      } else if (
        ArrayBuffer.isView(graph) ||
        (graph !== null &&
          typeof graph === "object" &&
          "length" in graph &&
          typeof (graph as ArrayLike<unknown>).length === "number")
      ) {
        // Convert array-like to regular array
        try {
          graphArray = Array.from(graph as ArrayLike<unknown>);
        } catch {
          console.error(
            "[SpatialPartitioning] Failed to convert WASM result to array",
          );
          this.neighborGraph = [];
          return;
        }
      } else {
        console.error(
          "[SpatialPartitioning] WASM createNearByGraph returned unexpected type:",
          typeof graph,
        );
        this.neighborGraph = [];
        return;
      }

      // Convert all entries to regular number arrays, handling typed arrays
      this.neighborGraph = graphArray.map((entry) => this.toNumberArray(entry));
    } catch (error) {
      console.error(
        "[SpatialPartitioning] Error creating neighbor graph:",
        error,
      );
      this.neighborGraph = [];
    }
  }

  /**
   * Find all bodies within the neighbor distance of a given body
   * @param bodyId The ID of the body to find neighbors for
   * @returns Array of neighbor body IDs
   */
  findNeighbors(bodyId: string | number): (string | number)[] {
    if (!this.config.initialized) {
      return [];
    }

    const index = this.bodyIds.indexOf(bodyId);
    if (index === -1 || index >= this.neighborGraph.length) {
      return [];
    }

    const rawNeighbors = this.neighborGraph[index];

    // Convert to regular array if needed (fallback for typed arrays)
    const neighbors = this.toNumberArray(rawNeighbors);

    // Map neighbor indices to body IDs, filtering out invalid indices
    return neighbors
      .filter(
        (neighborIndex) =>
          neighborIndex >= 0 && neighborIndex < this.bodyIds.length,
      )
      .map((neighborIndex) => this.bodyIds[neighborIndex])
      .filter((id) => id !== undefined); // Filter out any undefined IDs
  }

  /**
   * Create a neighbor graph using the WASM library
   * @param positions Flat array of 3D coordinates (x, y, z, x, y, z, ...)
   * @param distance Maximum distance to consider two points as neighbors
   * @returns Array of arrays, where each sub-array contains the indices of neighboring points
   */
  createNearByGraph(positions: Float32Array, distance: number): number[][] {
    if (!this.config.initialized) {
      throw new Error(
        "WASM spatial partitioning not initialized. Call initialize() first.",
      );
    }

    const result = createNearByGraph(positions, distance);

    // Handle various return types from WASM
    let resultArray: unknown[];
    if (Array.isArray(result)) {
      resultArray = result;
    } else if (
      ArrayBuffer.isView(result) ||
      (result !== null &&
        typeof result === "object" &&
        "length" in result &&
        typeof (result as ArrayLike<unknown>).length === "number")
    ) {
      try {
        resultArray = Array.from(result as ArrayLike<unknown>);
      } catch {
        console.error(
          "[SpatialPartitioning] Failed to convert WASM result to array",
        );
        return [];
      }
    } else {
      console.error(
        "[SpatialPartitioning] WASM createNearByGraph returned unexpected type:",
        typeof result,
      );
      return [];
    }

    // Convert all entries to regular number arrays, handling typed arrays
    return resultArray.map((entry) => this.toNumberArray(entry));
  }

  /**
   * Find all bodies within a specific distance of a given point
   * Optimized to avoid expensive square root calculations
   * @param point The point to search around
   * @param distance The search distance (meters)
   * @returns Array of body IDs within the distance
   */
  findBodiesInRange(point: OSVector3, distance: number): (string | number)[] {
    if (!this.config.initialized) {
      return [];
    }

    const bodiesInRange: (string | number)[] = [];
    const distanceSquared = distance * distance; // Pre-calculate to avoid repeated multiplication

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

      // Compare squared distances to avoid expensive sqrt operation
      if (distanceSq <= distanceSquared) {
        bodiesInRange.push(this.bodyIds[i]);
      }
    }

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

    for (let i = 0; i < this.neighborGraph.length; i++) {
      const rawNeighbors = this.neighborGraph[i];
      const bodyId1 = this.bodyIds[i];

      // Skip if bodyId1 is undefined
      if (bodyId1 === undefined) {
        continue;
      }

      // Convert to regular array if needed (fallback for typed arrays)
      const neighbors = this.toNumberArray(rawNeighbors);

      for (const neighborIndex of neighbors) {
        // Only process pairs where i < neighborIndex to avoid duplicates
        if (i < neighborIndex && neighborIndex < this.bodyIds.length) {
          const bodyId2 = this.bodyIds[neighborIndex];
          if (bodyId2 !== undefined) {
            pairs.push([bodyId1, bodyId2]);
          }
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
   * Update configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<WasmPartitioningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  dispose(): void {
    this.bodyIds = [];
    this.positions = new Float32Array();
    this.neighborGraph = [];
    this.config.initialized = false;
  }
}
