import * as THREE from 'three';

/**
 * A simple object pool for THREE.Vector3 instances.
 */
export class Vector3Pool {
  private pool: THREE.Vector3[] = [];
  private acquiredCount = 0; // Track acquired vectors for debugging

  /**
   * Get a Vector3 instance from the pool or create a new one.
   * Optionally sets the vector's components.
   */
  get(x = 0, y = 0, z = 0): THREE.Vector3 {
    this.acquiredCount++;
    const vector = this.pool.pop() || new THREE.Vector3();
    return vector.set(x, y, z);
  }

  /**
   * Release a Vector3 instance back into the pool.
   * Resets the vector to (0, 0, 0).
   */
  release(vector: THREE.Vector3): void {
    if (this.acquiredCount <= 0) {
       console.warn('Vector3Pool: Released more vectors than acquired!');
       return; // Avoid negative counts or pushing extra vectors
    }
    this.acquiredCount--;
    vector.set(0, 0, 0); // Reset for reuse
    this.pool.push(vector);
  }

  /**
   * Releases multiple vectors back into the pool.
   */
  releaseAll(vectors: THREE.Vector3[]): void {
    vectors.forEach(v => this.release(v));
  }
  
  /**
   * Get the current number of available vectors in the pool.
   */
  get availableCount(): number {
    return this.pool.length;
  }
  
  /**
   * Get the current number of vectors acquired from the pool.
   */
  get currentAcquiredCount(): number {
    return this.acquiredCount;
  }
}

// Create a default global instance
export const vectorPool = new Vector3Pool(); 