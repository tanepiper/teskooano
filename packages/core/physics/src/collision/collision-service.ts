import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal, CelestialType } from "@teskooano/data-types";
import { CelestialDistanceService } from "../spatial/celestial-distance-service";
import { detectSphereCollision, Collision } from "./collision";

/**
 * Configuration for WASM-based collision detection
 */
export interface WasmCollisionConfig {
  /** Maximum distance to consider for collision detection (meters) */
  collisionDistance: number;
}

/**
 * High-performance collision detection using WASM spatial partitioning
 * Replaces O(n²) collision detection with O(n log n) spatial queries
 */
export class CollisionDetectionService {
  private spatialService: CelestialDistanceService;
  private config: WasmCollisionConfig;
  private bodiesMap: Map<string | number, PhysicsStateReal> = new Map();
  private radiiMap: Map<string | number, number> = new Map();
  private isStarMap: Map<string | number, boolean> = new Map();
  private bodyTypesMap: Map<string | number, CelestialType> = new Map();

  constructor(config: Partial<WasmCollisionConfig> = {}) {
    this.config = {
      collisionDistance: 1e6, // 1 million meters default
      ...config,
    };

    this.spatialService = CelestialDistanceService.getInstance();
  }

  /**
   * Initialize the collision detection system
   */
  async initialize(): Promise<void> {
    // The spatial service is initialized centrally, no need to initialize here
  }

  /**
   * Update the collision detection system with new body data
   * @param bodies Array of physics bodies
   * @param radii Map of body IDs to radii
   * @param isStar Map of body IDs to star flags
   * @param bodyTypes Map of body IDs to celestial types
   */
  update(
    bodies: PhysicsStateReal[],
    radii: Map<string | number, number>,
    isStar: Map<string | number, boolean>,
    bodyTypes: Map<string | number, CelestialType>,
  ): void {
    // Update internal maps
    this.bodiesMap.clear();
    this.radiiMap.clear();
    this.isStarMap.clear();
    this.bodyTypesMap.clear();

    bodies.forEach((body) => {
      this.bodiesMap.set(body.id, body);
      this.radiiMap.set(body.id, radii.get(body.id) || 0);
      this.isStarMap.set(body.id, isStar.get(body.id) || false);
      this.bodyTypesMap.set(
        body.id,
        bodyTypes.get(body.id) || CelestialType.PLANET,
      );
    });

    // Update spatial partitioning
    this.spatialService.update(bodies);
  }

  /**
   * Detect all collisions using optimized spatial partitioning
   * @param ignoreCollisions Optional map of body IDs that should ignore collisions
   * @returns Array of detected collisions
   */
  detectCollisions(
    ignoreCollisions?: Map<string | number, boolean>,
  ): Collision[] {
    const collisions: Collision[] = [];

    // Use WASM spatial partitioning for O(n log n) collision detection
    const potentialPairs = this.spatialService.getPotentialCollisionPairs();

    for (const [bodyId1, bodyId2] of potentialPairs) {
      // Skip if either body should ignore collisions
      if (ignoreCollisions?.get(bodyId1) || ignoreCollisions?.get(bodyId2)) {
        continue;
      }

      const body1 = this.bodiesMap.get(bodyId1);
      const body2 = this.bodiesMap.get(bodyId2);
      const radius1 = this.radiiMap.get(bodyId1);
      const radius2 = this.radiiMap.get(bodyId2);

      if (!body1 || !body2 || radius1 === undefined || radius2 === undefined) {
        continue;
      }

      const collision = detectSphereCollision(body1, radius1, body2, radius2);
      if (collision) {
        collisions.push(collision);
      }
    }

    return collisions;
  }

  /**
   * Handle collisions and return updated bodies and destroyed IDs
   * @param ignoreCollisions Optional map of body IDs that should ignore collisions
   * @returns Tuple of [updated bodies, destroyed IDs]
   */
  handleCollisions(
    ignoreCollisions?: Map<string | number, boolean>,
  ): [PhysicsStateReal[], Set<string>] {
    const collisions = this.detectCollisions(ignoreCollisions);
    const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
    const destroyedIds = new Set<string>();

    // Initialize with all bodies
    this.bodiesMap.forEach((body, id) => {
      updatedBodiesMap.set(id, { ...body });
    });

    // Process collisions using simple destruction rules
    for (const collision of collisions) {
      const body1 = updatedBodiesMap.get(collision.body1Id);
      const body2 = updatedBodiesMap.get(collision.body2Id);

      if (!body1 || !body2) {
        continue;
      }

      const body1IsStar = this.isStarMap.get(collision.body1Id) || false;
      const body2IsStar = this.isStarMap.get(collision.body2Id) || false;

      // Apply simple destruction rules
      const destroyedIdsForCollision = this.resolveSimpleCollision(
        collision.body1Id,
        collision.body2Id,
        body1,
        body2,
        body1IsStar,
        body2IsStar,
        updatedBodiesMap,
      );

      destroyedIdsForCollision.forEach((id) => destroyedIds.add(id));
    }

    // Remove destroyed bodies
    const finalBodies = Array.from(updatedBodiesMap.values()).filter(
      (body) => !destroyedIds.has(body.id),
    );

    return [finalBodies, destroyedIds];
  }

  /**
   * Simple collision resolution based on physics rules
   */
  private resolveSimpleCollision(
    id1: string | number,
    id2: string | number,
    body1: PhysicsStateReal,
    body2: PhysicsStateReal,
    body1IsStar: boolean,
    body2IsStar: boolean,
    updatedBodiesMap: Map<string | number, PhysicsStateReal>,
  ): string[] {
    const destroyedIds = new Set<string>();

    // Rule 1: If it's not a star and it hits a star, it's destroyed
    if (!body1IsStar && body2IsStar) {
      destroyedIds.add(String(id1));
      return Array.from(destroyedIds);
    }
    if (body1IsStar && !body2IsStar) {
      destroyedIds.add(String(id2));
      return Array.from(destroyedIds);
    }

    // Rule 2: If it's two stars, the smaller star is destroyed
    if (body1IsStar && body2IsStar) {
      if (body1.mass_kg >= body2.mass_kg) {
        destroyedIds.add(String(id2));
      } else {
        destroyedIds.add(String(id1));
      }
      return Array.from(destroyedIds);
    }

    // Rule 3: If it's two planets, the larger planet wins
    if (!body1IsStar && !body2IsStar) {
      if (body1.mass_kg >= body2.mass_kg) {
        destroyedIds.add(String(id2));
      } else {
        destroyedIds.add(String(id1));
      }
      return Array.from(destroyedIds);
    }

    return Array.from(destroyedIds);
  }

  /**
   * Find all bodies within a specific distance of a given point
   * @param point The point to search around
   * @param distance The search distance (meters)
   * @returns Array of body IDs within the distance
   */
  findBodiesInRange(point: OSVector3, distance: number): (string | number)[] {
    return this.spatialService.findBodiesInRange(point, distance);
  }

  /**
   * Find the closest body to a given point
   * @param point The point to search from
   * @returns The closest body ID and distance, or null if no bodies exist
   */
  findClosestBody(
    point: OSVector3,
  ): { bodyId: string | number; distance: number } | null {
    return this.spatialService.findClosestBody(point);
  }

  /**
   * Get statistics about the collision detection system
   */
  getStats(): {
    totalBodies: number;
    usingWasm: boolean;
    collisionDistance: number;
    spatialPartitioningStats?: any;
  } {
    return {
      totalBodies: this.bodiesMap.size,
      usingWasm: true, // Always using WASM now
      collisionDistance: this.config.collisionDistance,
    };
  }

  /**
   * Update the collision detection configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<WasmCollisionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.collisionDistance !== undefined) {
      this.spatialService.setNeighborDistance(config.collisionDistance);
    }
  }

  dispose(): void {
    this.bodiesMap.clear();
    this.radiiMap.clear();
    this.isStarMap.clear();
    this.bodyTypesMap.clear();
    // No need to dispose the spatial service as it's shared
  }
}
