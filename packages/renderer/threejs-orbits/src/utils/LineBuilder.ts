import * as THREE from "three";
import { BufferPool } from "./BufferPool";

/**
 * Utility class for creating and updating THREE.js line objects.
 *
 * This class provides methods to efficiently create, update, and manage
 * line geometries with buffer reuse for optimized memory usage.
 */
export class LineBuilder {
  /** Buffer pool for efficient memory management */
  private bufferPool: BufferPool;

  /**
   * Creates a new LineBuilder instance.
   *
   * @param maxCachedBufferSize - The maximum size of buffer to keep in the cache
   */
  constructor(maxCachedBufferSize = 10000) {
    this.bufferPool = new BufferPool(maxCachedBufferSize);
  }

  /**
   * Creates a new THREE.js Line with a buffered geometry of the given size.
   *
   * @param size - The number of points the line can hold
   * @param material - The material to use for the line
   * @param name - Optional name for the line
   * @returns A new THREE.js Line object
   */
  createLine(
    size: number,
    material: THREE.Material,
    name?: string,
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = this.bufferPool.getBuffer(size);

    geometry.setAttribute("position", positionAttribute);
    geometry.setDrawRange(0, 0);

    const line = new THREE.Line(geometry, material);

    if (name) {
      line.name = name;
    }

    line.frustumCulled = false;
    return line;
  }

  /**
   * Updates an existing line with new points.
   *
   * @param line - The line to update
   * @param points - The new points to display
   * @param maxPoints - The maximum number of points to display
   * @returns The updated line
   */
  updateLine(
    line: THREE.Line,
    points: THREE.Vector3[],
    maxPoints: number,
  ): THREE.Line {
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    const numPointsToDraw = Math.min(
      points.length,
      maxPoints,
      positionAttribute.count,
    );

    // Update the points
    for (let i = 0; i < numPointsToDraw; i++) {
      const point = points[i];
      const offset = i * 3;

      const positions = positionAttribute.array as Float32Array;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
    }

    positionAttribute.needsUpdate = true;
    geometry.setDrawRange(0, numPointsToDraw);

    return line;
  }

  /**
   * Resizes a line's buffer capacity if needed.
   *
   * @param line - The line to resize
   * @param newCapacity - The new capacity needed
   * @returns The line with updated buffer capacity
   */
  resizeLineBuffer(line: THREE.Line, newCapacity: number): THREE.Line {
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;
    const existingCapacity = positionAttribute.count;

    if (existingCapacity >= newCapacity) {
      return line; // No need to resize
    }

    // Get a new buffer from the pool
    const newPositionAttribute = this.bufferPool.getBuffer(newCapacity);

    // Copy existing data to the new buffer
    const newPositions = newPositionAttribute.array as Float32Array;
    newPositions.set(positionAttribute.array.slice(0, existingCapacity * 3));

    // Return the old buffer to the pool
    this.bufferPool.releaseBuffer(positionAttribute, existingCapacity);

    // Set the new buffer
    geometry.deleteAttribute("position");
    geometry.setAttribute("position", newPositionAttribute);

    return line;
  }

  /**
   * Properly disposes a line and returns its buffer to the pool.
   *
   * @param line - The line to dispose
   */
  disposeLine(line: THREE.Line): void {
    if (!line.geometry) return;

    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    if (positionAttribute) {
      // Return the buffer to the pool
      this.bufferPool.releaseBuffer(positionAttribute, positionAttribute.count);

      // Remove the attribute from the geometry
      geometry.deleteAttribute("position");
    }

    // Dispose the material if needed
    if (line.material instanceof THREE.Material) {
      line.material.dispose();
    } else if (Array.isArray(line.material)) {
      line.material.forEach((mat) => mat.dispose());
    }
  }

  /**
   * Clears all cached buffers.
   */
  clear(): void {
    this.bufferPool.clear();
  }
}
