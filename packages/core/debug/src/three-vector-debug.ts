/**
 * THREE.js specific vector debugging utilities
 * This file provides integrations for THREE.js vector types
 */
import { OSVector3 } from '@teskooano/core-math';
import { vectorDebug } from './vector-debug';

// Type definition for THREE.Vector3
// This saves us from adding a direct THREE.js dependency
export interface ThreeVector3 {
  x: number;
  y: number;
  z: number;
  clone(): ThreeVector3;
}

/**
 * Helper to convert a THREE.Vector3 to our OSVector3
 */
export function convertThreeVector(vector: ThreeVector3): OSVector3 {
  return new OSVector3(vector.x, vector.y, vector.z);
}

/**
 * Debug class for THREE.js vector operations
 */
export class ThreeVectorDebug {
  /**
   * Store a THREE.Vector3 in the debug system
   * 
   * @param name The debug context name
   * @param key The vector key
   * @param vector The THREE.Vector3 to store
   */
  public setVector(name: string, key: string, vector: ThreeVector3): void {
    const osVector = convertThreeVector(vector);
    vectorDebug.setVector(name, key, osVector);
  }

  /**
   * Store multiple THREE.Vector3 values at once
   * 
   * @param name The debug context name
   * @param vectors Record of vector keys to THREE.Vector3 objects
   */
  public setVectors(name: string, vectors: Record<string, ThreeVector3>): void {
    Object.entries(vectors).forEach(([key, vector]) => {
      this.setVector(name, key, vector);
    });
  }

  /**
   * Get a vector as a THREE.Vector3-like object
   * 
   * @param name The debug context name
   * @param key The vector key
   * @returns Object with x, y, z properties or undefined if not found
   */
  public getVector(name: string, key: string): {x: number; y: number; z: number} | undefined {
    const vector = vectorDebug.getVector(name, key);
    if (!vector) return undefined;
    return { x: vector.x, y: vector.y, z: vector.z };
  }
  
  /**
   * Get all vectors for a named debug context
   * 
   * @param name The debug context name
   * @returns Record of all vector keys to vector objects or undefined if not found
   */
  public getVectors(name: string): Record<string, {x: number; y: number; z: number}> | undefined {
    const vectors = vectorDebug.getVectors(name);
    if (!vectors) return undefined;
    
    const result: Record<string, {x: number; y: number; z: number}> = {};
    Object.entries(vectors).forEach(([key, vector]) => {
      result[key] = { x: vector.x, y: vector.y, z: vector.z };
    });
    return result;
  }

  /**
   * Get all debug context names
   */
  public getNames(): string[] {
    return vectorDebug.getNames();
  }

  /**
   * Clear vectors for a specific context
   */
  public clearVectors(name: string): void {
    vectorDebug.clearVectors(name);
  }

  /**
   * Clear all vector debug data
   */
  public clearAll(): void {
    vectorDebug.clearAll();
  }
}

/**
 * Singleton instance for THREE.js vector debugging
 */
export const threeVectorDebug = new ThreeVectorDebug(); 