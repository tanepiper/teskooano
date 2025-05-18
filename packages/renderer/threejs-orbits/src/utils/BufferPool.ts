import * as THREE from "three";

/**
 * Manages a pool of THREE.js BufferAttributes to reduce memory allocations.
 *
 * This utility helps prevent excessive garbage collection by reusing buffers
 * that would otherwise be repeatedly created and discarded.
 */
export class BufferPool {
  /** Cache of buffer attributes to reduce garbage collection */
  private bufferCache: Map<number, THREE.BufferAttribute> = new Map();

  /** Maximum size to store in the buffer cache */
  private readonly maxCachedBufferSize: number;

  /**
   * Creates a new BufferPool instance.
   *
   * @param maxCachedBufferSize - The maximum size of buffer to keep in the cache
   */
  constructor(maxCachedBufferSize = 10000) {
    this.maxCachedBufferSize = maxCachedBufferSize;
  }

  /**
   * Gets a buffer of the specified size, either from the cache or by creating a new one.
   *
   * @param size - The number of vertices (not the byte size)
   * @returns A BufferAttribute ready for use
   */
  getBuffer(size: number): THREE.BufferAttribute {
    if (this.bufferCache.has(size)) {
      // Reuse a cached buffer of the same size
      const buffer = this.bufferCache.get(size)!;
      this.bufferCache.delete(size);

      // Reset the buffer data
      const positions = buffer.array as Float32Array;
      positions.fill(0);

      return buffer;
    }

    // Create a new buffer when none cached
    const positions = new Float32Array(size * 3);
    return new THREE.BufferAttribute(positions, 3);
  }

  /**
   * Returns a buffer to the pool for later reuse.
   *
   * @param buffer - The buffer to cache
   * @param size - The size (number of vertices) of the buffer
   */
  releaseBuffer(buffer: THREE.BufferAttribute, size: number): void {
    // Only cache buffers under our size limit
    if (size <= this.maxCachedBufferSize) {
      // Reset buffer data before caching
      const array = buffer.array as Float32Array;
      array.fill(0);

      this.bufferCache.set(size, buffer);
    }
  }

  /**
   * Clears all cached buffers.
   */
  clear(): void {
    this.bufferCache.clear();
  }

  /**
   * Gets the number of buffers currently in the cache.
   */
  get cacheSize(): number {
    return this.bufferCache.size;
  }
}
