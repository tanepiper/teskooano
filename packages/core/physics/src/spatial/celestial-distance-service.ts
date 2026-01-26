import { WasmPartitioningConfig } from "./types";
import { SpatialPartitioning } from "./spatial-partitioning";
import { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Centralized WASM spatial partitioning service
 * Provides a single source of truth for spatial operations across the simulation
 */
export class CelestialDistanceService {
  private static instance: CelestialDistanceService | null = null;
  private spatialPartitioning: SpatialPartitioning | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the WASM spatial service
   */
  public static getInstance(): CelestialDistanceService {
    if (!CelestialDistanceService.instance) {
      CelestialDistanceService.instance = new CelestialDistanceService();
    }
    return CelestialDistanceService.instance;
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
      this.spatialPartitioning = new SpatialPartitioning(
        config.neighborDistance || 1e12, // Default to 1 trillion meters (~6700 AU)
      );
      await this.spatialPartitioning.initialize();
      // console.log(this.spatialPartitioning.getStats());
      return true;
    } catch (error) {
      console.error(
        "[CelestialDistanceService] Failed to initialize WASM spatial partitioning:",
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
  public getSpatialPartitioning(): SpatialPartitioning | null {
    return this.spatialPartitioning;
  }

  /**
   * Check if the service is initialized and ready to use
   */
  public isInitialized(): boolean {
    return (
      this.spatialPartitioning !== null &&
      this.spatialPartitioning.isInitialized()
    );
  }

  /**
   * Update the spatial partitioning with new body data
   * @param bodies Array of physics bodies
   */
  public update(bodies: PhysicsStateReal[]): void {
    if (!this.isInitialized()) {
      console.warn(
        "[CelestialDistanceService] Attempted to update before initialization",
      );
      return;
    }
    // console.log(`[CelestialDistanceService] Updating with ${bodies.length} bodies`);
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
        "[CelestialDistanceService] Attempted to find neighbors before initialization",
      );
      return [];
    }
    const neighbors = this.spatialPartitioning!.findNeighbors(bodyId);
    return neighbors;
  }

  /**
   * Find all bodies within a specific distance of a given point
   * @param point The point to search around
   * @param distance The search distance (meters)
   * @param silent If true, suppress warning messages (for cases where caller already checked initialization)
   * @returns Array of body IDs within the distance
   */
  public findBodiesInRange(
    point: any,
    distance: number,
    silent: boolean = false,
  ): (string | number)[] {
    if (!this.isInitialized()) {
      if (!silent) {
        console.warn(
          "[CelestialDistanceService] Attempted to find bodies in range before initialization",
        );
      }
      return [];
    }
    const bodiesInRange = this.spatialPartitioning!.findBodiesInRange(
      point,
      distance,
    );
    return bodiesInRange;
  }

  /**
   * Get potential collision pairs
   * @returns Array of [bodyId1, bodyId2] pairs
   */
  public getPotentialCollisionPairs(): [string | number, string | number][] {
    if (!this.isInitialized()) {
      console.warn(
        "[CelestialDistanceService] Attempted to get collision pairs before initialization",
      );
      return [];
    }
    const collisionPairs =
      this.spatialPartitioning!.getPotentialCollisionPairs();
    return collisionPairs;
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
        "[CelestialDistanceService] Attempted to find closest body before initialization",
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
        "[CelestialDistanceService] Attempted to calculate distances before initialization",
      );
      return new Map();
    }
    return this.spatialPartitioning!.calculateDistancesToAll(point);
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
    CelestialDistanceService.instance = null;
  }
}
