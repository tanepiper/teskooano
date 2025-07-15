import { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Manages a pre-allocated pool of PhysicsStateReal objects to avoid continuous
 * memory allocation and de-allocation within the prediction worker.
 */
export class PredictionDataPool {
  private objectIdToIndex: Map<string, number> = new Map();
  private indexToObjectId: Map<number, string> = new Map();
  private pool: PhysicsStateReal[];
  private nextAvailableIndex = 0;

  /**
   * Creates a new PredictionDataPool.
   * @param poolSize The maximum number of physics objects to manage.
   */
  constructor(poolSize: number) {
    this.pool = new Array(poolSize);
    for (let i = 0; i < poolSize; i++) {
      // Pre-allocate all objects and their vectors
      this.pool[i] = {
        id: "",
        mass_kg: 0,
        position_m: new OSVector3().setZero(),
        velocity_mps: new OSVector3().setZero(),
      };
    }
  }

  /**
   * Updates the entire pool of physics states from a flat buffer and an ID map.
   * @param flatData A Float32Array containing [mass, px, py, pz, vx, vy, vz] for each object.
   * @param idMap A map from object ID string to its index in the flatData array.
   * @returns The updated array of PhysicsStateReal objects from the internal pool.
   */
  public updateFromBuffer(
    flatData: Float32Array,
    idMap: Map<string, number>,
  ): PhysicsStateReal[] {
    this.reset();
    const floatsPerObject = 7; // mass, px, py, pz, vx, vy, vz

    idMap.forEach((index, objectId) => {
      const dataIndex = index * floatsPerObject;
      const poolIndex = this.getOrCreateIndex(objectId);

      if (poolIndex !== -1) {
        const state = this.pool[poolIndex];
        state.id = objectId;
        state.mass_kg = flatData[dataIndex];

        // Use setFromArray for more efficient vector initialization
        state.position_m.setFromArray([
          flatData[dataIndex + 1],
          flatData[dataIndex + 2],
          flatData[dataIndex + 3],
        ]);
        state.velocity_mps.setFromArray([
          flatData[dataIndex + 4],
          flatData[dataIndex + 5],
          flatData[dataIndex + 6],
        ]);
      }
    });

    // Return only the active (updated) states
    return this.pool.slice(0, this.nextAvailableIndex);
  }

  /**
   * Resets the pool's internal tracking without de-allocating the objects.
   */
  private reset(): void {
    this.nextAvailableIndex = 0;
    this.objectIdToIndex.clear();
    this.indexToObjectId.clear();
  }

  /**
   * Gets the index for a given object ID, creating a new one if it doesn't exist.
   * @param objectId The ID of the object.
   * @returns The index in the pool, or -1 if the pool is full.
   */
  private getOrCreateIndex(objectId: string): number {
    if (this.objectIdToIndex.has(objectId)) {
      return this.objectIdToIndex.get(objectId)!;
    }

    if (this.nextAvailableIndex >= this.pool.length) {
      console.warn("[PredictionDataPool] Pool is full.");
      return -1;
    }

    const index = this.nextAvailableIndex++;
    this.objectIdToIndex.set(objectId, index);
    this.indexToObjectId.set(index, objectId);
    return index;
  }
}
