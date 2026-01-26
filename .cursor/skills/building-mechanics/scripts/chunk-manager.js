/**
 * ChunkManager - World streaming for large-scale building systems
 *
 * Divides the world into chunks that load/unload based on player proximity.
 * Enables effectively infinite worlds while keeping memory bounded.
 *
 * Based on: Minecraft's 16x16x256 chunk system, Rust's streaming architecture
 *
 * Usage:
 *   const chunkManager = new ChunkManager({ chunkSize: 64, loadDistance: 3 });
 *   chunkManager.onChunkLoad = async (chunkKey) => loadChunkData(chunkKey);
 *   chunkManager.onChunkUnload = (chunkKey, chunk) => saveChunkData(chunkKey, chunk);
 *   // In game loop:
 *   chunkManager.update(playerPosition);
 */

import * as THREE from "three";
import { Octree } from "./octree.js";

export class Chunk {
  constructor(key, bounds, chunkSize) {
    this.key = key;
    this.bounds = bounds;
    this.chunkSize = chunkSize;
    this.objects = new Map(); // objectId -> object
    this.spatialIndex = new Octree(bounds, { maxDepth: 4, maxObjects: 16 });
    this.meshGroup = new THREE.Group();
    this.meshGroup.name = `Chunk_${key}`;

    this.state = "unloaded"; // unloaded, loading, loaded, unloading
    this.lastAccess = Date.now();
    this.isDirty = false;
    this.metadata = {};
  }

  /**
   * Add object to chunk
   */
  addObject(id, object, position) {
    this.objects.set(id, { object, position: position.clone() });
    this.spatialIndex.insert(object, position);

    if (object.mesh) {
      this.meshGroup.add(object.mesh);
    } else if (object instanceof THREE.Object3D) {
      this.meshGroup.add(object);
    }

    this.isDirty = true;
    this.lastAccess = Date.now();
  }

  /**
   * Remove object from chunk
   */
  removeObject(id) {
    const entry = this.objects.get(id);
    if (!entry) return false;

    this.spatialIndex.remove(entry.object);

    if (entry.object.mesh) {
      this.meshGroup.remove(entry.object.mesh);
    } else if (entry.object instanceof THREE.Object3D) {
      this.meshGroup.remove(entry.object);
    }

    this.objects.delete(id);
    this.isDirty = true;
    this.lastAccess = Date.now();
    return true;
  }

  /**
   * Query objects within radius
   */
  queryRadius(position, radius) {
    this.lastAccess = Date.now();
    return this.spatialIndex.queryRadius(position, radius);
  }

  /**
   * Get all objects in chunk
   */
  getAllObjects() {
    return Array.from(this.objects.values());
  }

  /**
   * Get object count
   */
  get objectCount() {
    return this.objects.size;
  }

  /**
   * Serialize chunk data for saving
   */
  serialize() {
    const objects = [];
    for (const [id, { object, position }] of this.objects) {
      objects.push({
        id,
        type: object.type || object.constructor.name,
        position: { x: position.x, y: position.y, z: position.z },
        data: object.serialize ? object.serialize() : {},
      });
    }
    return {
      key: this.key,
      metadata: this.metadata,
      objects,
    };
  }

  /**
   * Clear chunk data
   */
  clear() {
    this.objects.clear();
    this.spatialIndex.clear();
    this.meshGroup.clear();
    this.isDirty = false;
  }
}

export class ChunkManager {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize ?? 64;
    this.loadDistance = options.loadDistance ?? 3;
    this.unloadDistance = options.unloadDistance ?? this.loadDistance + 2;
    this.maxLoadedChunks = options.maxLoadedChunks ?? 100;
    this.loadBatchSize = options.loadBatchSize ?? 2; // Chunks to load per frame
    this.worldHeight = options.worldHeight ?? 256;

    this.chunks = new Map(); // chunkKey -> Chunk
    this.loadQueue = [];
    this.unloadQueue = [];
    this.scene = options.scene || null;

    // Callbacks
    this.onChunkLoad = options.onChunkLoad || null; // async (chunkKey) => chunkData
    this.onChunkUnload = options.onChunkUnload || null; // (chunkKey, chunk) => void
    this.onChunkCreate = options.onChunkCreate || null; // (chunk) => void

    // Stats
    this.stats = {
      loadedChunks: 0,
      loadingChunks: 0,
      queuedLoads: 0,
      totalObjects: 0,
    };

    // Internal state
    this._lastPlayerChunk = null;
    this._isProcessing = false;
  }

  /**
   * Convert world position to chunk key
   */
  worldToChunkKey(position) {
    const cx = Math.floor(position.x / this.chunkSize);
    const cz = Math.floor(position.z / this.chunkSize);
    return `${cx},${cz}`;
  }

  /**
   * Parse chunk key to chunk coordinates
   */
  parseChunkKey(key) {
    const [x, z] = key.split(",").map(Number);
    return { x, z };
  }

  /**
   * Get chunk bounds from key
   */
  getChunkBounds(key) {
    const { x, z } = this.parseChunkKey(key);
    return {
      min: new THREE.Vector3(x * this.chunkSize, 0, z * this.chunkSize),
      max: new THREE.Vector3(
        (x + 1) * this.chunkSize,
        this.worldHeight,
        (z + 1) * this.chunkSize,
      ),
    };
  }

  /**
   * Main update - call every frame with player position
   */
  async update(playerPosition) {
    const playerChunkKey = this.worldToChunkKey(playerPosition);
    const playerChunk = this.parseChunkKey(playerChunkKey);

    // Only recalculate if player moved to new chunk
    if (this._lastPlayerChunk !== playerChunkKey) {
      this._lastPlayerChunk = playerChunkKey;
      this._updateChunkQueues(playerChunk);
    }

    // Process queues
    await this._processLoadQueue();
    this._processUnloadQueue();
    this._updateStats();
  }

  /**
   * Determine which chunks to load/unload
   */
  _updateChunkQueues(playerChunk) {
    const chunksToLoad = new Set();
    const chunksToKeep = new Set();

    // Determine chunks that should be loaded
    for (let dx = -this.loadDistance; dx <= this.loadDistance; dx++) {
      for (let dz = -this.loadDistance; dz <= this.loadDistance; dz++) {
        const key = `${playerChunk.x + dx},${playerChunk.z + dz}`;
        chunksToKeep.add(key);

        if (!this.chunks.has(key)) {
          chunksToLoad.add(key);
        }
      }
    }

    // Sort load queue by distance (closest first)
    this.loadQueue = Array.from(chunksToLoad).sort((a, b) => {
      const aCoords = this.parseChunkKey(a);
      const bCoords = this.parseChunkKey(b);
      const aDist =
        Math.abs(aCoords.x - playerChunk.x) +
        Math.abs(aCoords.z - playerChunk.z);
      const bDist =
        Math.abs(bCoords.x - playerChunk.x) +
        Math.abs(bCoords.z - playerChunk.z);
      return aDist - bDist;
    });

    // Determine chunks to unload
    for (const [key, chunk] of this.chunks) {
      if (chunk.state === "loaded" || chunk.state === "loading") {
        const coords = this.parseChunkKey(key);
        const dist = Math.max(
          Math.abs(coords.x - playerChunk.x),
          Math.abs(coords.z - playerChunk.z),
        );

        if (dist > this.unloadDistance) {
          this.unloadQueue.push(key);
        }
      }
    }
  }

  /**
   * Process chunk load queue
   */
  async _processLoadQueue() {
    if (this._isProcessing) return;
    this._isProcessing = true;

    const toLoad = this.loadQueue.splice(0, this.loadBatchSize);

    for (const key of toLoad) {
      if (this.chunks.has(key)) continue;

      // Create chunk
      const bounds = this.getChunkBounds(key);
      const chunk = new Chunk(key, bounds, this.chunkSize);
      chunk.state = "loading";
      this.chunks.set(key, chunk);

      // Add to scene
      if (this.scene) {
        this.scene.add(chunk.meshGroup);
      }

      // Load data
      try {
        if (this.onChunkLoad) {
          const data = await this.onChunkLoad(key);
          if (data) {
            this._populateChunk(chunk, data);
          }
        }
        chunk.state = "loaded";

        if (this.onChunkCreate) {
          this.onChunkCreate(chunk);
        }
      } catch (error) {
        console.error(`Failed to load chunk ${key}:`, error);
        chunk.state = "loaded"; // Mark as loaded even if empty
      }
    }

    this._isProcessing = false;
  }

  /**
   * Process chunk unload queue
   */
  _processUnloadQueue() {
    // Limit unloads per frame
    const toUnload = this.unloadQueue.splice(0, 1);

    for (const key of toUnload) {
      const chunk = this.chunks.get(key);
      if (!chunk) continue;

      chunk.state = "unloading";

      // Save if dirty
      if (this.onChunkUnload && chunk.isDirty) {
        this.onChunkUnload(key, chunk);
      }

      // Remove from scene
      if (this.scene) {
        this.scene.remove(chunk.meshGroup);
      }

      // Dispose resources
      chunk.clear();
      this.chunks.delete(key);
    }

    // Force unload if over limit
    if (this.chunks.size > this.maxLoadedChunks) {
      this._forceTrimChunks();
    }
  }

  /**
   * Populate chunk with loaded data
   */
  _populateChunk(chunk, data) {
    if (data.metadata) {
      chunk.metadata = data.metadata;
    }

    if (data.objects && Array.isArray(data.objects)) {
      for (const objData of data.objects) {
        // Objects need to be created by the game - we just store position data
        const position = new THREE.Vector3(
          objData.position.x,
          objData.position.y,
          objData.position.z,
        );

        // Store raw data for later object creation
        chunk.objects.set(objData.id, {
          object: objData,
          position,
        });
      }
    }
  }

  /**
   * Force trim chunks when over limit
   */
  _forceTrimChunks() {
    const sortedChunks = Array.from(this.chunks.entries())
      .filter(([_, chunk]) => chunk.state === "loaded")
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const toRemove = sortedChunks.slice(
      0,
      this.chunks.size - this.maxLoadedChunks,
    );

    for (const [key] of toRemove) {
      if (!this.unloadQueue.includes(key)) {
        this.unloadQueue.push(key);
      }
    }
  }

  /**
   * Update stats
   */
  _updateStats() {
    let loaded = 0;
    let loading = 0;
    let totalObjects = 0;

    for (const chunk of this.chunks.values()) {
      if (chunk.state === "loaded") loaded++;
      if (chunk.state === "loading") loading++;
      totalObjects += chunk.objectCount;
    }

    this.stats = {
      loadedChunks: loaded,
      loadingChunks: loading,
      queuedLoads: this.loadQueue.length,
      totalObjects,
    };
  }

  /**
   * Get chunk at position (creates if needed)
   */
  getChunkAt(position) {
    const key = this.worldToChunkKey(position);
    return this.chunks.get(key);
  }

  /**
   * Get or create chunk at position
   */
  getOrCreateChunk(position) {
    const key = this.worldToChunkKey(position);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      const bounds = this.getChunkBounds(key);
      chunk = new Chunk(key, bounds, this.chunkSize);
      chunk.state = "loaded";
      this.chunks.set(key, chunk);

      if (this.scene) {
        this.scene.add(chunk.meshGroup);
      }
    }

    return chunk;
  }

  /**
   * Add object to appropriate chunk
   */
  addObject(id, object, position) {
    const chunk = this.getOrCreateChunk(position);
    chunk.addObject(id, object, position);
    return chunk;
  }

  /**
   * Remove object from its chunk
   */
  removeObject(id, position) {
    const chunk = this.getChunkAt(position);
    if (chunk) {
      return chunk.removeObject(id);
    }
    return false;
  }

  /**
   * Query objects near position across chunks
   */
  queryRadius(position, radius) {
    const results = [];
    const chunkRadius = Math.ceil(radius / this.chunkSize) + 1;
    const centerChunk = this.parseChunkKey(this.worldToChunkKey(position));

    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
        const key = `${centerChunk.x + dx},${centerChunk.z + dz}`;
        const chunk = this.chunks.get(key);

        if (chunk && chunk.state === "loaded") {
          const chunkResults = chunk.queryRadius(position, radius);
          results.push(...chunkResults);
        }
      }
    }

    return results;
  }

  /**
   * Force load a specific chunk
   */
  async forceLoadChunk(key) {
    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    }

    const bounds = this.getChunkBounds(key);
    const chunk = new Chunk(key, bounds, this.chunkSize);
    chunk.state = "loading";
    this.chunks.set(key, chunk);

    if (this.scene) {
      this.scene.add(chunk.meshGroup);
    }

    if (this.onChunkLoad) {
      const data = await this.onChunkLoad(key);
      if (data) {
        this._populateChunk(chunk, data);
      }
    }

    chunk.state = "loaded";
    return chunk;
  }

  /**
   * Mark chunk as dirty (needs saving)
   */
  markDirty(position) {
    const chunk = this.getChunkAt(position);
    if (chunk) {
      chunk.isDirty = true;
    }
  }

  /**
   * Save all dirty chunks
   */
  saveAllDirty() {
    const saved = [];

    for (const [key, chunk] of this.chunks) {
      if (chunk.isDirty && this.onChunkUnload) {
        this.onChunkUnload(key, chunk);
        chunk.isDirty = false;
        saved.push(key);
      }
    }

    return saved;
  }

  /**
   * Get chunk grid for debug rendering
   */
  createDebugGrid(scene, color = 0x4444ff) {
    const group = new THREE.Group();
    group.name = "ChunkDebugGrid";

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });

    for (const [key] of this.chunks) {
      const bounds = this.getChunkBounds(key);
      const geometry = new THREE.BoxGeometry(
        this.chunkSize,
        this.worldHeight,
        this.chunkSize,
      );
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, material);

      line.position.set(
        (bounds.min.x + bounds.max.x) / 2,
        this.worldHeight / 2,
        (bounds.min.z + bounds.max.z) / 2,
      );

      group.add(line);
    }

    scene.add(group);
    return group;
  }

  /**
   * Clear all chunks
   */
  clear() {
    for (const [key, chunk] of this.chunks) {
      if (this.scene) {
        this.scene.remove(chunk.meshGroup);
      }
      chunk.clear();
    }

    this.chunks.clear();
    this.loadQueue = [];
    this.unloadQueue = [];
    this._lastPlayerChunk = null;
  }
}

export default ChunkManager;
