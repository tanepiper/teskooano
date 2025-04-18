/**
 * Vector-based debug utilities
 */
import { OSVector3 } from "@teskooano/core-math";

/**
 * Class for storing and manipulating debug vectors
 */
export class VectorDebug {
  /**
   * Map of named debug vectors
   * Each entry can contain multiple vectors relevant for that particular debug context
   */
  private _vectors: Map<string, Record<string, OSVector3>> = new Map();

  /**
   * Set a debug vector with a specific name and key
   *
   * @param name The debug context name (e.g. 'ring-system-1')
   * @param key The vector key (e.g. 'sunDir', 'parentPos', etc)
   * @param vector The vector to store
   */
  public setVector(name: string, key: string, vector: OSVector3): void {
    let entry = this._vectors.get(name);
    if (!entry) {
      entry = {};
      this._vectors.set(name, entry);
    }
    entry[key] = vector.clone();
  }

  /**
   * Get a debug vector by name and key
   *
   * @param name The debug context name
   * @param key The vector key
   * @returns The vector or undefined if not found
   */
  public getVector(name: string, key: string): OSVector3 | undefined {
    const entry = this._vectors.get(name);
    return entry?.[key];
  }

  /**
   * Get all vectors for a named debug context
   *
   * @param name The debug context name
   * @returns Record of all vectors for this context or undefined if not found
   */
  public getVectors(name: string): Record<string, OSVector3> | undefined {
    return this._vectors.get(name);
  }

  /**
   * Get all debug contexts
   *
   * @returns Array of all debug context names
   */
  public getNames(): string[] {
    return Array.from(this._vectors.keys());
  }

  /**
   * Clear all vectors for a specific debug context
   *
   * @param name The debug context name
   */
  public clearVectors(name: string): void {
    this._vectors.delete(name);
  }

  /**
   * Clear all debug vectors
   */
  public clearAll(): void {
    this._vectors.clear();
  }
}

/**
 * Singleton instance of the VectorDebug class
 */
export const vectorDebug = new VectorDebug();
