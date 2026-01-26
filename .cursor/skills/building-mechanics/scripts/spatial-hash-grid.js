/**
 * SpatialHashGrid - Uniform spatial partitioning for building systems
 *
 * Best for: Uniform object distribution, 2D/2.5D games, <5000 components
 * Time complexity: O(1) cell lookup + O(k) objects per cell
 *
 * Usage:
 *   const grid = new SpatialHashGrid(10); // 10-unit cells
 *   grid.insert(buildingPiece, piece.position);
 *   const nearby = grid.queryRadius(position, 15);
 */

import * as THREE from "three";

export class SpatialHashGrid {
  constructor(cellSize = 10) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.objectCells = new Map(); // object -> Set of cell keys (for objects spanning cells)
    this.objectCount = 0;
  }

  /**
   * Generate cell key from world coordinates
   */
  _hash(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Parse cell key back to cell coordinates
   */
  _parseKey(key) {
    const [x, y, z] = key.split(",").map(Number);
    return { x, y, z };
  }

  /**
   * Get cell world bounds from key
   */
  _getCellBounds(key) {
    const { x, y, z } = this._parseKey(key);
    return {
      min: new THREE.Vector3(
        x * this.cellSize,
        y * this.cellSize,
        z * this.cellSize,
      ),
      max: new THREE.Vector3(
        (x + 1) * this.cellSize,
        (y + 1) * this.cellSize,
        (z + 1) * this.cellSize,
      ),
    };
  }

  /**
   * Insert object at position (point-based)
   */
  insert(object, position) {
    const key = this._hash(position.x, position.y, position.z);

    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(object);

    // Track which cells contain this object
    if (!this.objectCells.has(object)) {
      this.objectCells.set(object, new Set());
      this.objectCount++;
    }
    this.objectCells.get(object).add(key);

    return key;
  }

  /**
   * Insert object with bounding box (spans multiple cells)
   */
  insertWithBounds(object, bounds) {
    const minCell = {
      x: Math.floor(bounds.min.x / this.cellSize),
      y: Math.floor(bounds.min.y / this.cellSize),
      z: Math.floor(bounds.min.z / this.cellSize),
    };
    const maxCell = {
      x: Math.floor(bounds.max.x / this.cellSize),
      y: Math.floor(bounds.max.y / this.cellSize),
      z: Math.floor(bounds.max.z / this.cellSize),
    };

    if (!this.objectCells.has(object)) {
      this.objectCells.set(object, new Set());
      this.objectCount++;
    }

    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        for (let z = minCell.z; z <= maxCell.z; z++) {
          const key = `${x},${y},${z}`;
          if (!this.cells.has(key)) {
            this.cells.set(key, new Set());
          }
          this.cells.get(key).add(object);
          this.objectCells.get(object).add(key);
        }
      }
    }
  }

  /**
   * Remove object from grid
   */
  remove(object) {
    const cellKeys = this.objectCells.get(object);
    if (!cellKeys) return false;

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(object);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.objectCells.delete(object);
    this.objectCount--;
    return true;
  }

  /**
   * Update object position (remove and re-insert)
   */
  update(object, newPosition) {
    this.remove(object);
    return this.insert(object, newPosition);
  }

  /**
   * Update object with new bounds
   */
  updateWithBounds(object, newBounds) {
    this.remove(object);
    this.insertWithBounds(object, newBounds);
  }

  /**
   * Query all objects within radius of position
   */
  queryRadius(position, radius) {
    const results = new Set();
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCell = {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize),
    };

    const radiusSq = radius * radius;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const key = `${centerCell.x + dx},${centerCell.y + dy},${centerCell.z + dz}`;
          const cell = this.cells.get(key);

          if (cell) {
            for (const object of cell) {
              // Get object position for distance check
              const objPos = object.position || object;
              if (objPos.distanceToSquared) {
                if (objPos.distanceToSquared(position) <= radiusSq) {
                  results.add(object);
                }
              } else {
                results.add(object);
              }
            }
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Query all objects within AABB bounds
   */
  queryBounds(bounds) {
    const results = new Set();
    const minCell = {
      x: Math.floor(bounds.min.x / this.cellSize),
      y: Math.floor(bounds.min.y / this.cellSize),
      z: Math.floor(bounds.min.z / this.cellSize),
    };
    const maxCell = {
      x: Math.floor(bounds.max.x / this.cellSize),
      y: Math.floor(bounds.max.y / this.cellSize),
      z: Math.floor(bounds.max.z / this.cellSize),
    };

    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        for (let z = minCell.z; z <= maxCell.z; z++) {
          const key = `${x},${y},${z}`;
          const cell = this.cells.get(key);
          if (cell) {
            for (const object of cell) {
              results.add(object);
            }
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Query single cell by position
   */
  queryCell(position) {
    const key = this._hash(position.x, position.y, position.z);
    const cell = this.cells.get(key);
    return cell ? Array.from(cell) : [];
  }

  /**
   * Find nearest object to position
   */
  findNearest(position, maxRadius = Infinity) {
    let nearest = null;
    let nearestDistSq = maxRadius * maxRadius;

    // Expand search outward from center cell
    let searchRadius = 0;
    const centerCell = {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize),
    };

    while (searchRadius * this.cellSize <= maxRadius || searchRadius === 0) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          for (let dz = -searchRadius; dz <= searchRadius; dz++) {
            // Only check shell of current radius
            if (
              Math.abs(dx) !== searchRadius &&
              Math.abs(dy) !== searchRadius &&
              Math.abs(dz) !== searchRadius
            ) {
              continue;
            }

            const key = `${centerCell.x + dx},${centerCell.y + dy},${centerCell.z + dz}`;
            const cell = this.cells.get(key);

            if (cell) {
              for (const object of cell) {
                const objPos = object.position || object;
                if (objPos.distanceToSquared) {
                  const distSq = objPos.distanceToSquared(position);
                  if (distSq < nearestDistSq) {
                    nearestDistSq = distSq;
                    nearest = object;
                  }
                }
              }
            }
          }
        }
      }

      // If we found something and searched far enough to be sure
      if (
        nearest &&
        (searchRadius + 1) * this.cellSize > Math.sqrt(nearestDistSq)
      ) {
        break;
      }
      searchRadius++;
    }

    return nearest;
  }

  /**
   * Raycast through grid cells
   */
  raycast(origin, direction, maxDistance = 1000) {
    const results = [];
    const ray = new THREE.Ray(origin, direction.normalize());

    // Simple approach: collect all cells the ray passes through
    const step = this.cellSize / 2;
    const steps = Math.ceil(maxDistance / step);
    const checkedCells = new Set();
    const point = origin.clone();

    for (let i = 0; i <= steps; i++) {
      const key = this._hash(point.x, point.y, point.z);

      if (!checkedCells.has(key)) {
        checkedCells.add(key);
        const cell = this.cells.get(key);

        if (cell) {
          for (const object of cell) {
            if (!results.includes(object)) {
              results.push(object);
            }
          }
        }
      }

      point.addScaledVector(direction, step);
    }

    return results;
  }

  /**
   * Get statistics about grid usage
   */
  getStats() {
    let totalObjects = 0;
    let maxPerCell = 0;
    let minPerCell = Infinity;
    let emptyCells = 0;

    for (const cell of this.cells.values()) {
      const count = cell.size;
      totalObjects += count;
      maxPerCell = Math.max(maxPerCell, count);
      minPerCell = Math.min(minPerCell, count);
      if (count === 0) emptyCells++;
    }

    return {
      cellCount: this.cells.size,
      objectCount: this.objectCount,
      cellSize: this.cellSize,
      maxObjectsPerCell: maxPerCell,
      minObjectsPerCell: minPerCell === Infinity ? 0 : minPerCell,
      avgObjectsPerCell:
        this.cells.size > 0 ? totalObjects / this.cells.size : 0,
      emptyCells,
      memoryEstimate: this.cells.size * 100 + this.objectCount * 50, // rough bytes
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.cells.clear();
    this.objectCells.clear();
    this.objectCount = 0;
  }

  /**
   * Visualize grid (debug)
   */
  createDebugMesh(scene, color = 0x00ff00) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });
    const group = new THREE.Group();
    group.name = "SpatialGridDebug";

    for (const key of this.cells.keys()) {
      const bounds = this._getCellBounds(key);
      const geometry = new THREE.BoxGeometry(
        this.cellSize,
        this.cellSize,
        this.cellSize,
      );
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, material);

      line.position.set(
        (bounds.min.x + bounds.max.x) / 2,
        (bounds.min.y + bounds.max.y) / 2,
        (bounds.min.z + bounds.max.z) / 2,
      );

      group.add(line);
    }

    scene.add(group);
    return group;
  }
}

/**
 * 2D variant for terrain-based games (ignores Y axis)
 */
export class SpatialHashGrid2D {
  constructor(cellSize = 10) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.objectCells = new Map();
    this.objectCount = 0;
  }

  _hash(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  insert(object, position) {
    const key = this._hash(position.x, position.z);

    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(object);

    if (!this.objectCells.has(object)) {
      this.objectCells.set(object, new Set());
      this.objectCount++;
    }
    this.objectCells.get(object).add(key);

    return key;
  }

  remove(object) {
    const cellKeys = this.objectCells.get(object);
    if (!cellKeys) return false;

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(object);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.objectCells.delete(object);
    this.objectCount--;
    return true;
  }

  queryRadius(position, radius) {
    const results = new Set();
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerX = Math.floor(position.x / this.cellSize);
    const centerZ = Math.floor(position.z / this.cellSize);
    const radiusSq = radius * radius;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${centerX + dx},${centerZ + dz}`;
        const cell = this.cells.get(key);

        if (cell) {
          for (const object of cell) {
            const objPos = object.position || object;
            const distSq =
              (objPos.x - position.x) ** 2 + (objPos.z - position.z) ** 2;
            if (distSq <= radiusSq) {
              results.add(object);
            }
          }
        }
      }
    }

    return Array.from(results);
  }

  clear() {
    this.cells.clear();
    this.objectCells.clear();
    this.objectCount = 0;
  }
}

export default SpatialHashGrid;
