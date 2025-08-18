import {
  WasmSpatialPartitioning,
  type WasmPartitioningConfig,
} from "./wasm-partitioning";
import { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Centralized WASM spatial partitioning service
 * Provides a single source of truth for spatial operations across the simulation
 */
export class WasmSpatialService {
  private static instance: WasmSpatialService | null = null;
  private spatialPartitioning: WasmSpatialPartitioning | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the WASM spatial service
   */
  public static getInstance(): WasmSpatialService {
    if (!WasmSpatialService.instance) {
      WasmSpatialService.instance = new WasmSpatialService();
    }
    return WasmSpatialService.instance;
  }

  /**
   * Initialize the WASM spatial partitioning service
   * @param config Configuration for the spatial partitioning
   * @returns Promise that resolves to true if initialization was successful
   */
  public async initialize(
    config: Partial<WasmPartitioningConfig> = {},
  ): Promise<boolean> {
    // If already initializing, wait for the existing promise
    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return success
    if (this.spatialPartitioning?.isInitialized()) {
      return true;
    }

    // Start initialization
    this.isInitializing = true;
    this.initializationPromise = this.performInitialization(config);

    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async performInitialization(
    config: Partial<WasmPartitioningConfig>,
  ): Promise<boolean> {
    try {
      console.log(
        "[WasmSpatialService] Initializing centralized WASM spatial partitioning...",
      );

      this.spatialPartitioning = new WasmSpatialPartitioning(
        config.neighborDistance || 1e9, // Default to 1 billion meters
      );

      await this.spatialPartitioning.initialize();

      console.log(
        "[WasmSpatialService] WASM spatial partitioning initialized successfully",
      );
      return true;
    } catch (error) {
      console.error(
        "[WasmSpatialService] Failed to initialize WASM spatial partitioning:",
        error,
      );
      this.spatialPartitioning = null;
      return false;
    }
  }

  /**
   * Get the spatial partitioning instance
   * @returns The spatial partitioning instance or null if not initialized
   */
  public getSpatialPartitioning(): WasmSpatialPartitioning | null {
    return this.spatialPartitioning;
  }

  /**
   * Check if the service is initialized and ready to use
   */
  public isInitialized(): boolean {
    return this.spatialPartitioning?.isInitialized() || false;
  }

  /**
   * Update the spatial partitioning with new body data
   * @param bodies Array of physics bodies
   */
  public update(bodies: PhysicsStateReal[]): void {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to update before initialization",
      );
      return;
    }
    this.spatialPartitioning!.update(bodies);
  }

  /**
   * Find neighbors of a specific body
   * @param bodyId The ID of the body to find neighbors for
   * @returns Array of neighbor body IDs
   */
  public findNeighbors(bodyId: string | number): (string | number)[] {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to find neighbors before initialization",
      );
      return [];
    }
    return this.spatialPartitioning!.findNeighbors(bodyId);
  }

  /**
   * Find all bodies within a specific distance of a given point
   * @param point The point to search around
   * @param distance The search distance (meters)
   * @returns Array of body IDs within the distance
   */
  public findBodiesInRange(point: any, distance: number): (string | number)[] {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to find bodies in range before initialization",
      );
      return [];
    }
    return this.spatialPartitioning!.findBodiesInRange(point, distance);
  }

  /**
   * Get potential collision pairs
   * @returns Array of [bodyId1, bodyId2] pairs
   */
  public getPotentialCollisionPairs(): [string | number, string | number][] {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to get collision pairs before initialization",
      );
      return [];
    }
    return this.spatialPartitioning!.getPotentialCollisionPairs();
  }

  /**
   * Find the closest body to a given point
   * @param point The point to search from
   * @returns The closest body ID and distance, or null if no bodies exist
   */
  public findClosestBody(
    point: any,
  ): { bodyId: string | number; distance: number } | null {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to find closest body before initialization",
      );
      return null;
    }
    return this.spatialPartitioning!.findClosestBody(point);
  }

  /**
   * Calculate distances from a point to all objects
   * @param point The reference point
   * @returns Map of object IDs to distances in meters
   */
  public calculateDistancesToAll(point: any): Map<string | number, number> {
    if (!this.isInitialized()) {
      console.warn(
        "[WasmSpatialService] Attempted to calculate distances before initialization",
      );
      return new Map();
    }
    return this.spatialPartitioning!.calculateDistancesToAll(point);
  }

  /**
   * Get statistics about the spatial partitioning system
   */
  public getStats() {
    if (!this.isInitialized()) {
      return {
        initialized: false,
        totalBodies: 0,
        averageNeighbors: 0,
        maxNeighbors: 0,
        neighborDistance: 0,
        performance: {
          totalOperations: 0,
          averageOperationTime: 0,
          wasmOperations: 0,
          traditionalOperations: 0,
          lastResetTime: Date.now(),
        },
      };
    }
    return this.spatialPartitioning!.getStats();
  }

  /**
   * Reset performance metrics
   */
  public resetPerformanceMetrics(): void {
    if (this.isInitialized()) {
      this.spatialPartitioning!.resetPerformanceMetrics();
    }
  }

  /**
   * Set the neighbor distance for spatial partitioning
   * @param distance The new neighbor distance in meters
   */
  public setNeighborDistance(distance: number): void {
    if (this.isInitialized()) {
      this.spatialPartitioning!.updateConfig({ neighborDistance: distance });
    }
  }

  /**
   * Dispose of the service and clean up resources
   */
  public dispose(): void {
    if (this.spatialPartitioning) {
      this.spatialPartitioning.dispose();
      this.spatialPartitioning = null;
    }
    WasmSpatialService.instance = null;
  }
}
