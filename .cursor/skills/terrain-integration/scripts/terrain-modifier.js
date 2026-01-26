/**
 * TerrainModifier - Modify terrain heightmap for building
 *
 * Provides terrain modification operations including flatten, raise, and lower.
 * Supports undo/redo, serialization for save/load, and networking.
 *
 * Usage:
 *   const modifier = new TerrainModifier(terrainMesh);
 *   modifier.flatten(position, 5, targetHeight);
 *   modifier.raise(position, 3, 2);
 *   modifier.undo();
 */

import * as THREE from "three";

/**
 * Modification types
 */
export const ModificationType = {
  FLATTEN: "flatten",
  RAISE: "raise",
  LOWER: "lower",
  SMOOTH: "smooth",
  LEVEL: "level",
};

/**
 * Falloff functions for edge blending
 */
export const FalloffMode = {
  LINEAR: "linear",
  SMOOTH: "smooth", // Smoothstep
  SHARP: "sharp", // Quadratic
  CONSTANT: "constant", // No falloff
};

export class TerrainModifier {
  /**
   * Create terrain modifier
   * @param {THREE.Mesh} terrain - Terrain mesh to modify
   * @param {Object} options - Configuration options
   */
  constructor(terrain, options = {}) {
    this.terrain = terrain;
    this.geometry = terrain.geometry;

    // Configuration
    this.resolution = options.resolution ?? 1;
    this.maxModification = options.maxModification ?? 10;
    this.falloffMode = options.falloffMode ?? FalloffMode.SMOOTH;
    this.maxHistorySize = options.maxHistorySize ?? 50;

    // Store original heights for reference
    this.originalHeights = this.captureHeights();

    // Modification history for undo/redo
    this.history = [];
    this.historyIndex = -1;

    // Bounds for coordinate mapping
    this.bounds = this.computeBounds();

    // Event callbacks
    this.onModified = options.onModified ?? null;
    this.onUndo = options.onUndo ?? null;
    this.onRedo = options.onRedo ?? null;
  }

  /**
   * Compute terrain bounding box
   */
  computeBounds() {
    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    return this.geometry.boundingBox.clone();
  }

  /**
   * Capture current height values
   */
  captureHeights() {
    const position = this.geometry.attributes.position;
    const heights = new Float32Array(position.count);

    for (let i = 0; i < position.count; i++) {
      heights[i] = position.getY(i);
    }

    return heights;
  }

  /**
   * Flatten terrain in an area
   * @param {THREE.Vector3} center - Center of area to flatten
   * @param {number} radius - Radius of effect
   * @param {number} targetHeight - Height to flatten to (null = average)
   * @returns {Object} Modification result
   */
  flatten(center, radius, targetHeight = null) {
    const affected = this.getAffectedVertices(center, radius);

    if (affected.length === 0) {
      return { success: false, reason: "No vertices in range" };
    }

    // Calculate target height if not specified
    const finalTarget = targetHeight ?? this.getAverageHeight(affected);

    // Record state for undo
    const modifications = [];

    for (const vertex of affected) {
      const influence = this.calculateInfluence(vertex, center, radius);
      const newHeight = THREE.MathUtils.lerp(
        vertex.height,
        finalTarget,
        influence,
      );

      // Clamp to modification limits
      const clampedHeight = this.clampHeight(vertex, newHeight);

      if (Math.abs(clampedHeight - vertex.height) > 0.001) {
        modifications.push({
          index: vertex.index,
          oldHeight: vertex.height,
          newHeight: clampedHeight,
        });

        this.setVertexHeight(vertex.index, clampedHeight);
      }
    }

    if (modifications.length > 0) {
      this.recordHistory({
        type: ModificationType.FLATTEN,
        center: center.clone(),
        radius,
        targetHeight: finalTarget,
        modifications,
      });

      this.updateMesh();
    }

    if (this.onModified) {
      this.onModified({
        type: ModificationType.FLATTEN,
        center,
        radius,
        verticesModified: modifications.length,
      });
    }

    return {
      success: true,
      type: ModificationType.FLATTEN,
      verticesModified: modifications.length,
      targetHeight: finalTarget,
      center: center.clone(),
    };
  }

  /**
   * Raise terrain in an area
   * @param {THREE.Vector3} center - Center of area
   * @param {number} radius - Radius of effect
   * @param {number} amount - Amount to raise
   * @returns {Object} Modification result
   */
  raise(center, radius, amount) {
    const affected = this.getAffectedVertices(center, radius);

    if (affected.length === 0) {
      return { success: false, reason: "No vertices in range" };
    }

    const modifications = [];

    for (const vertex of affected) {
      const influence = this.calculateInfluence(vertex, center, radius);
      const raise = amount * influence;
      const newHeight = vertex.height + raise;
      const clampedHeight = this.clampHeight(vertex, newHeight);

      if (Math.abs(clampedHeight - vertex.height) > 0.001) {
        modifications.push({
          index: vertex.index,
          oldHeight: vertex.height,
          newHeight: clampedHeight,
        });

        this.setVertexHeight(vertex.index, clampedHeight);
      }
    }

    if (modifications.length > 0) {
      this.recordHistory({
        type: ModificationType.RAISE,
        center: center.clone(),
        radius,
        amount,
        modifications,
      });

      this.updateMesh();
    }

    if (this.onModified) {
      this.onModified({
        type: ModificationType.RAISE,
        center,
        radius,
        amount,
        verticesModified: modifications.length,
      });
    }

    return {
      success: true,
      type: ModificationType.RAISE,
      verticesModified: modifications.length,
      amount,
      center: center.clone(),
    };
  }

  /**
   * Lower terrain in an area
   */
  lower(center, radius, amount) {
    return this.raise(center, radius, -amount);
  }

  /**
   * Smooth terrain in an area
   */
  smooth(center, radius, strength = 0.5) {
    const affected = this.getAffectedVertices(center, radius);

    if (affected.length === 0) {
      return { success: false, reason: "No vertices in range" };
    }

    // Calculate average height of neighbors for each vertex
    const targetHeights = new Map();

    for (const vertex of affected) {
      const neighbors = this.getNeighborVertices(vertex, 1);
      if (neighbors.length > 0) {
        const avgHeight =
          neighbors.reduce((sum, n) => sum + n.height, 0) / neighbors.length;
        targetHeights.set(vertex.index, avgHeight);
      }
    }

    const modifications = [];

    for (const vertex of affected) {
      const targetHeight = targetHeights.get(vertex.index);
      if (targetHeight === undefined) continue;

      const influence = this.calculateInfluence(vertex, center, radius);
      const newHeight = THREE.MathUtils.lerp(
        vertex.height,
        targetHeight,
        influence * strength,
      );
      const clampedHeight = this.clampHeight(vertex, newHeight);

      if (Math.abs(clampedHeight - vertex.height) > 0.001) {
        modifications.push({
          index: vertex.index,
          oldHeight: vertex.height,
          newHeight: clampedHeight,
        });

        this.setVertexHeight(vertex.index, clampedHeight);
      }
    }

    if (modifications.length > 0) {
      this.recordHistory({
        type: ModificationType.SMOOTH,
        center: center.clone(),
        radius,
        strength,
        modifications,
      });

      this.updateMesh();
    }

    return {
      success: true,
      type: ModificationType.SMOOTH,
      verticesModified: modifications.length,
    };
  }

  /**
   * Level terrain to match foundation footprint
   */
  levelForFoundation(foundation, padding = 1) {
    const width = (foundation.width ?? 4) + padding * 2;
    const depth = (foundation.depth ?? 4) + padding * 2;
    const center = foundation.position.clone();
    const targetHeight = foundation.position.y;

    // Use rectangular area instead of circular
    const affected = this.getAffectedVerticesRect(
      center,
      width,
      depth,
      foundation.rotation?.y ?? 0,
    );

    if (affected.length === 0) {
      return { success: false, reason: "No vertices in footprint" };
    }

    const modifications = [];

    for (const vertex of affected) {
      const influence = this.calculateRectInfluence(
        vertex,
        center,
        width,
        depth,
        padding,
      );
      const newHeight = THREE.MathUtils.lerp(
        vertex.height,
        targetHeight,
        influence,
      );
      const clampedHeight = this.clampHeight(vertex, newHeight);

      if (Math.abs(clampedHeight - vertex.height) > 0.001) {
        modifications.push({
          index: vertex.index,
          oldHeight: vertex.height,
          newHeight: clampedHeight,
        });

        this.setVertexHeight(vertex.index, clampedHeight);
      }
    }

    if (modifications.length > 0) {
      this.recordHistory({
        type: ModificationType.LEVEL,
        center: center.clone(),
        width,
        depth,
        targetHeight,
        modifications,
      });

      this.updateMesh();
    }

    return {
      success: true,
      type: ModificationType.LEVEL,
      verticesModified: modifications.length,
      targetHeight,
    };
  }

  /**
   * Get vertices within radius of center
   */
  getAffectedVertices(center, radius) {
    const vertices = [];
    const position = this.geometry.attributes.position;
    const radiusSq = radius * radius;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);

      const dx = x - center.x;
      const dz = z - center.z;
      const distSq = dx * dx + dz * dz;

      if (distSq <= radiusSq) {
        vertices.push({
          index: i,
          x,
          z,
          height: position.getY(i),
          distance: Math.sqrt(distSq),
        });
      }
    }

    return vertices;
  }

  /**
   * Get vertices within rectangular area
   */
  getAffectedVerticesRect(center, width, depth, rotation = 0) {
    const vertices = [];
    const position = this.geometry.attributes.position;
    const hw = width / 2;
    const hd = depth / 2;

    // Create rotation matrix for rotated rectangles
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);

      // Translate to center
      const dx = x - center.x;
      const dz = z - center.z;

      // Rotate to local space
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;

      // Check if within rectangle
      if (Math.abs(localX) <= hw && Math.abs(localZ) <= hd) {
        vertices.push({
          index: i,
          x,
          z,
          localX,
          localZ,
          height: position.getY(i),
        });
      }
    }

    return vertices;
  }

  /**
   * Get neighboring vertices
   */
  getNeighborVertices(vertex, distance = 1) {
    const neighbors = [];
    const position = this.geometry.attributes.position;
    const threshold = this.resolution * distance * 1.5;

    for (let i = 0; i < position.count; i++) {
      if (i === vertex.index) continue;

      const x = position.getX(i);
      const z = position.getZ(i);
      const dx = x - vertex.x;
      const dz = z - vertex.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= threshold) {
        neighbors.push({
          index: i,
          x,
          z,
          height: position.getY(i),
        });
      }
    }

    return neighbors;
  }

  /**
   * Calculate influence based on distance and falloff
   */
  calculateInfluence(vertex, center, radius) {
    const normalized = vertex.distance / radius;

    switch (this.falloffMode) {
      case FalloffMode.LINEAR:
        return 1 - normalized;

      case FalloffMode.SMOOTH:
        // Smoothstep
        const t = 1 - normalized;
        return t * t * (3 - 2 * t);

      case FalloffMode.SHARP:
        // Quadratic falloff
        return Math.pow(1 - normalized, 2);

      case FalloffMode.CONSTANT:
        return 1;

      default:
        return 1 - normalized;
    }
  }

  /**
   * Calculate influence for rectangular area
   */
  calculateRectInfluence(vertex, center, width, depth, padding) {
    const hw = (width - padding * 2) / 2;
    const hd = (depth - padding * 2) / 2;

    // Distance from inner rectangle edge
    const edgeDistX = Math.max(0, Math.abs(vertex.localX) - hw);
    const edgeDistZ = Math.max(0, Math.abs(vertex.localZ) - hd);
    const edgeDist = Math.sqrt(edgeDistX * edgeDistX + edgeDistZ * edgeDistZ);

    if (edgeDist === 0) return 1; // Inside inner rectangle

    const normalized = edgeDist / padding;
    return Math.max(0, 1 - normalized);
  }

  /**
   * Get average height of vertices
   */
  getAverageHeight(vertices) {
    if (vertices.length === 0) return 0;
    const sum = vertices.reduce((acc, v) => acc + v.height, 0);
    return sum / vertices.length;
  }

  /**
   * Clamp height to modification limits
   */
  clampHeight(vertex, newHeight) {
    const original = this.originalHeights[vertex.index];
    return THREE.MathUtils.clamp(
      newHeight,
      original - this.maxModification,
      original + this.maxModification,
    );
  }

  /**
   * Set height of a single vertex
   */
  setVertexHeight(index, height) {
    const position = this.geometry.attributes.position;
    position.setY(index, height);
  }

  /**
   * Update terrain mesh after modifications
   */
  updateMesh() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();

    // Update collision mesh if separate
    if (this.terrain.userData?.collisionMesh) {
      const collisionGeo = this.terrain.userData.collisionMesh.geometry;
      collisionGeo.attributes.position.copy(this.geometry.attributes.position);
      collisionGeo.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Record modification to history
   */
  recordHistory(entry) {
    // Remove any redo history
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add new entry
    this.history.push(entry);
    this.historyIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last modification
   */
  undo() {
    if (this.historyIndex < 0) {
      return { success: false, reason: "Nothing to undo" };
    }

    const entry = this.history[this.historyIndex];

    // Revert modifications
    for (const mod of entry.modifications) {
      this.setVertexHeight(mod.index, mod.oldHeight);
    }

    this.historyIndex--;
    this.updateMesh();

    if (this.onUndo) {
      this.onUndo(entry);
    }

    return {
      success: true,
      type: entry.type,
      verticesReverted: entry.modifications.length,
    };
  }

  /**
   * Redo undone modification
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      return { success: false, reason: "Nothing to redo" };
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];

    // Reapply modifications
    for (const mod of entry.modifications) {
      this.setVertexHeight(mod.index, mod.newHeight);
    }

    this.updateMesh();

    if (this.onRedo) {
      this.onRedo(entry);
    }

    return {
      success: true,
      type: entry.type,
      verticesModified: entry.modifications.length,
    };
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.historyIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Get modification history summary
   */
  getHistorySummary() {
    return this.history.map((entry, i) => ({
      index: i,
      type: entry.type,
      verticesModified: entry.modifications.length,
      isCurrent: i === this.historyIndex,
    }));
  }

  /**
   * Reset terrain to original state
   */
  reset() {
    const position = this.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      position.setY(i, this.originalHeights[i]);
    }

    this.history = [];
    this.historyIndex = -1;
    this.updateMesh();

    return { success: true, verticesReset: position.count };
  }

  /**
   * Serialize all modifications for saving
   */
  serialize() {
    return {
      version: 1,
      history: this.history.map((entry) => ({
        type: entry.type,
        center: entry.center
          ? {
              x: entry.center.x,
              y: entry.center.y,
              z: entry.center.z,
            }
          : null,
        radius: entry.radius,
        amount: entry.amount,
        targetHeight: entry.targetHeight,
        modifications: entry.modifications.map((m) => ({
          index: m.index,
          oldHeight: m.oldHeight,
          newHeight: m.newHeight,
        })),
      })),
      historyIndex: this.historyIndex,
    };
  }

  /**
   * Deserialize and apply modifications
   */
  deserialize(data) {
    if (data.version !== 1) {
      throw new Error(`Unsupported serialization version: ${data.version}`);
    }

    // Reset first
    this.reset();

    // Apply all modifications up to saved history index
    for (let i = 0; i <= data.historyIndex; i++) {
      const entry = data.history[i];

      for (const mod of entry.modifications) {
        this.setVertexHeight(mod.index, mod.newHeight);
      }
    }

    // Restore history
    this.history = data.history.map((entry) => ({
      ...entry,
      center: entry.center
        ? new THREE.Vector3(entry.center.x, entry.center.y, entry.center.z)
        : null,
    }));
    this.historyIndex = data.historyIndex;

    this.updateMesh();

    return {
      success: true,
      modificationsApplied: data.historyIndex + 1,
    };
  }

  /**
   * Get delta since last sync (for networking)
   */
  getDeltaSince(lastSyncIndex) {
    if (lastSyncIndex >= this.historyIndex) {
      return { hasChanges: false };
    }

    const entries = this.history.slice(
      lastSyncIndex + 1,
      this.historyIndex + 1,
    );

    return {
      hasChanges: true,
      fromIndex: lastSyncIndex,
      toIndex: this.historyIndex,
      entries: entries.map((e) => this.serializeEntry(e)),
    };
  }

  /**
   * Serialize single history entry
   */
  serializeEntry(entry) {
    return {
      type: entry.type,
      center: entry.center
        ? {
            x: entry.center.x,
            y: entry.center.y,
            z: entry.center.z,
          }
        : null,
      radius: entry.radius,
      modifications: entry.modifications.map((m) => ({
        index: m.index,
        newHeight: m.newHeight,
      })),
    };
  }

  /**
   * Apply delta from network
   */
  applyDelta(delta) {
    for (const entry of delta.entries) {
      for (const mod of entry.modifications) {
        this.setVertexHeight(mod.index, mod.newHeight);
      }
    }

    this.updateMesh();

    return { success: true, entriesApplied: delta.entries.length };
  }
}

export default TerrainModifier;
