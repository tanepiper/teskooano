import * as THREE from "three";

/**
 * Manages a pool of THREE.js BufferAttributes to reduce memory allocations.
 *
 * This utility helps prevent excessive garbage collection by reusing buffers
 * that would otherwise be repeatedly created and discarded. It includes
 * memory tracking, performance monitoring, and automatic cleanup.
 */
export class BufferPool {
  /** Cache of buffer attributes to reduce garbage collection */
  private bufferCache: Map<number, THREE.BufferAttribute[]> = new Map();

  /** Maximum size to store in the buffer cache */
  private readonly maxCachedBufferSize: number;

  /** Maximum number of buffers to cache per size */
  private readonly maxBuffersPerSize: number;

  /** Statistics tracking */
  private stats = {
    totalAllocated: 0,
    totalReused: 0,
    totalReleased: 0,
    currentCached: 0,
    peakCached: 0,
  };

  /**
   * Creates a new BufferPool instance.
   *
   * @param maxCachedBufferSize - The maximum size of buffer to keep in the cache
   * @param maxBuffersPerSize - Maximum number of buffers to cache per size (default: 5)
   */
  constructor(maxCachedBufferSize = 10000, maxBuffersPerSize = 5) {
    this.maxCachedBufferSize = maxCachedBufferSize;
    this.maxBuffersPerSize = maxBuffersPerSize;
  }

  /**
   * Gets a buffer of the specified size, either from the cache or by creating a new one.
   *
   * @param size - The number of vertices (not the byte size)
   * @returns A BufferAttribute ready for use
   * @throws Error if size is invalid
   */
  getBuffer(size: number): THREE.BufferAttribute {
    if (size <= 0 || !Number.isInteger(size)) {
      throw new Error(
        `Invalid buffer size: ${size}. Size must be a positive integer.`,
      );
    }

    const cachedBuffers = this.bufferCache.get(size);

    if (cachedBuffers && cachedBuffers.length > 0) {
      // Reuse a cached buffer of the same size
      const buffer = cachedBuffers.pop()!;

      // Reset the buffer data efficiently
      const positions = buffer.array as Float32Array;
      positions.fill(0);

      this.stats.totalReused++;
      this.stats.currentCached--;

      return buffer;
    }

    // Create a new buffer when none cached
    const positions = new Float32Array(size * 3);
    const buffer = new THREE.BufferAttribute(positions, 3);

    this.stats.totalAllocated++;

    return buffer;
  }

  /**
   * Returns a buffer to the pool for later reuse.
   *
   * @param buffer - The buffer to cache
   * @param size - The size (number of vertices) of the buffer
   */
  releaseBuffer(buffer: THREE.BufferAttribute, size: number): void {
    if (!buffer || size <= 0) {
      return; // Ignore invalid buffers
    }

    // Only cache buffers under our size limit
    if (size <= this.maxCachedBufferSize) {
      const cachedBuffers = this.bufferCache.get(size) || [];

      // Limit the number of cached buffers per size
      if (cachedBuffers.length < this.maxBuffersPerSize) {
        // Reset buffer data before caching
        const array = buffer.array as Float32Array;
        array.fill(0);

        cachedBuffers.push(buffer);
        this.bufferCache.set(size, cachedBuffers);

        this.stats.totalReleased++;
        this.stats.currentCached++;
        this.stats.peakCached = Math.max(
          this.stats.peakCached,
          this.stats.currentCached,
        );
      }
    }
  }

  /**
   * Gets a buffer with a specific item size (for non-3D data).
   *
   * @param size - The number of items
   * @param itemSize - The number of components per item (default: 3)
   * @returns A BufferAttribute ready for use
   */
  getBufferWithItemSize(
    size: number,
    itemSize: number = 3,
  ): THREE.BufferAttribute {
    if (size <= 0 || !Number.isInteger(size)) {
      throw new Error(
        `Invalid buffer size: ${size}. Size must be a positive integer.`,
      );
    }

    if (itemSize <= 0 || !Number.isInteger(itemSize)) {
      throw new Error(
        `Invalid item size: ${itemSize}. Item size must be a positive integer.`,
      );
    }

    // For now, we'll create a new buffer with custom item size
    // In the future, we could extend the cache to handle different item sizes
    const positions = new Float32Array(size * itemSize);
    const buffer = new THREE.BufferAttribute(positions, itemSize);

    this.stats.totalAllocated++;

    return buffer;
  }

  /**
   * Clears all cached buffers.
   */
  clear(): void {
    this.bufferCache.clear();
    this.stats.currentCached = 0;
  }

  /**
   * Gets the number of buffers currently in the cache.
   */
  get cacheSize(): number {
    return this.stats.currentCached;
  }

  /**
   * Gets detailed statistics about buffer usage.
   */
  getStatistics(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Gets memory usage information.
   */
  getMemoryUsage(): { cachedBytes: number; totalCachedBuffers: number } {
    let totalBytes = 0;
    let totalBuffers = 0;

    for (const [size, buffers] of this.bufferCache.entries()) {
      totalBytes += size * 3 * 4 * buffers.length; // 3 components * 4 bytes per float * number of buffers
      totalBuffers += buffers.length;
    }

    return {
      cachedBytes: totalBytes,
      totalCachedBuffers: totalBuffers,
    };
  }

  /**
   * Performs garbage collection by removing excess cached buffers.
   * Keeps only the most recently used buffers.
   */
  garbageCollect(): void {
    for (const [size, buffers] of this.bufferCache.entries()) {
      if (buffers.length > this.maxBuffersPerSize) {
        // Keep only the most recent buffers
        const excess = buffers.length - this.maxBuffersPerSize;
        buffers.splice(0, excess);
        this.stats.currentCached -= excess;
      }
    }
  }

  /**
   * Resets all statistics counters.
   */
  resetStats(): void {
    this.stats = {
      totalAllocated: 0,
      totalReused: 0,
      totalReleased: 0,
      currentCached: 0,
      peakCached: 0,
    };
  }
}
