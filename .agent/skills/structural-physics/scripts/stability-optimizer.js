/**
 * StabilityOptimizer - Performance optimization for structural stability systems
 *
 * Provides caching, batch recalculation, incremental updates, and dirty tracking
 * to handle large structures (1000+ pieces) efficiently.
 *
 * Usage:
 *   const optimizer = new StabilityOptimizer(validator);
 *   optimizer.queueUpdate(piece);
 *   optimizer.processUpdates(); // Call once per frame
 *   const stability = optimizer.getStability(piece);
 */

/**
 * Priority levels for stability updates
 */
export const UpdatePriority = {
  IMMEDIATE: 0, // Process this frame
  HIGH: 1, // Process within 2 frames
  NORMAL: 2, // Process within 5 frames
  LOW: 3, // Process when idle
  BACKGROUND: 4, // Batch process
};

/**
 * Cache entry with metadata
 */
class CacheEntry {
  constructor(stability, timestamp) {
    this.stability = stability;
    this.timestamp = timestamp;
    this.accessCount = 0;
    this.lastAccess = timestamp;
  }

  access() {
    this.accessCount++;
    this.lastAccess = performance.now();
    return this.stability;
  }

  isStale(maxAge) {
    return performance.now() - this.timestamp > maxAge;
  }
}

/**
 * Update queue with priority handling
 */
class PriorityUpdateQueue {
  constructor() {
    this.queues = new Map();
    for (const priority of Object.values(UpdatePriority)) {
      this.queues.set(priority, new Set());
    }
    this.pieceToPrority = new Map();
  }

  add(pieceId, priority = UpdatePriority.NORMAL) {
    // If piece already queued, upgrade priority if needed
    const existingPriority = this.pieceToPrority.get(pieceId);
    if (existingPriority !== undefined) {
      if (priority < existingPriority) {
        this.queues.get(existingPriority).delete(pieceId);
        this.queues.get(priority).add(pieceId);
        this.pieceToPrority.set(pieceId, priority);
      }
      return;
    }

    this.queues.get(priority).add(pieceId);
    this.pieceToPrority.set(pieceId, priority);
  }

  remove(pieceId) {
    const priority = this.pieceToPrority.get(pieceId);
    if (priority !== undefined) {
      this.queues.get(priority).delete(pieceId);
      this.pieceToPrority.delete(pieceId);
    }
  }

  /**
   * Get next batch of pieces to process
   */
  getNextBatch(maxCount, maxPriority = UpdatePriority.BACKGROUND) {
    const batch = [];

    for (const [priority, queue] of this.queues) {
      if (priority > maxPriority) break;

      for (const pieceId of queue) {
        batch.push({ pieceId, priority });
        if (batch.length >= maxCount) break;
      }

      if (batch.length >= maxCount) break;
    }

    // Remove from queues
    for (const { pieceId } of batch) {
      this.remove(pieceId);
    }

    return batch;
  }

  /**
   * Get count by priority
   */
  getCount(priority = null) {
    if (priority !== null) {
      return this.queues.get(priority)?.size ?? 0;
    }
    return this.pieceToPrority.size;
  }

  clear() {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
    this.pieceToPrority.clear();
  }
}

/**
 * Dependency tracker for incremental updates
 */
class DependencyTracker {
  constructor() {
    this.dependsOn = new Map(); // pieceId -> Set<pieceId> (pieces this depends on)
    this.dependents = new Map(); // pieceId -> Set<pieceId> (pieces depending on this)
  }

  addDependency(dependent, dependency) {
    if (!this.dependsOn.has(dependent)) {
      this.dependsOn.set(dependent, new Set());
    }
    this.dependsOn.get(dependent).add(dependency);

    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }
    this.dependents.get(dependency).add(dependent);
  }

  removePiece(pieceId) {
    // Remove this piece from all dependency lists
    const deps = this.dependsOn.get(pieceId);
    if (deps) {
      for (const dep of deps) {
        this.dependents.get(dep)?.delete(pieceId);
      }
    }

    // Remove all dependents' references
    const dependents = this.dependents.get(pieceId);
    if (dependents) {
      for (const dep of dependents) {
        this.dependsOn.get(dep)?.delete(pieceId);
      }
    }

    this.dependsOn.delete(pieceId);
    this.dependents.delete(pieceId);
  }

  getDependents(pieceId) {
    return Array.from(this.dependents.get(pieceId) || []);
  }

  /**
   * Get all pieces affected by a change (transitive)
   */
  getAffectedPieces(pieceId) {
    const affected = new Set();
    const queue = [pieceId];

    while (queue.length > 0) {
      const current = queue.shift();
      const deps = this.dependents.get(current);

      if (deps) {
        for (const dep of deps) {
          if (!affected.has(dep)) {
            affected.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return Array.from(affected);
  }

  clear() {
    this.dependsOn.clear();
    this.dependents.clear();
  }
}

/**
 * Main optimizer class
 */
export class StabilityOptimizer {
  constructor(validator, options = {}) {
    this.validator = validator;

    // Configuration
    this.maxCacheAge = options.maxCacheAge ?? 5000; // 5 seconds
    this.maxCacheSize = options.maxCacheSize ?? 10000; // 10k entries
    this.batchSize = options.batchSize ?? 50; // Pieces per frame
    this.immediateBatchSize = options.immediateBatchSize ?? 10;
    this.enableProfiling = options.enableProfiling ?? false;

    // State
    this.cache = new Map();
    this.updateQueue = new PriorityUpdateQueue();
    this.dependencies = new DependencyTracker();
    this.frameCount = 0;

    // Profiling
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      recalculations: 0,
      batchesProcessed: 0,
      totalProcessTime: 0,
    };
  }

  /**
   * Get stability with caching
   */
  getStability(piece) {
    const cached = this.cache.get(piece.id);

    if (cached && !cached.isStale(this.maxCacheAge)) {
      this.stats.cacheHits++;
      return cached.access();
    }

    this.stats.cacheMisses++;
    return this.calculateAndCache(piece);
  }

  /**
   * Calculate stability and update cache
   */
  calculateAndCache(piece) {
    const stability = this.validator.calculateStability(piece);

    this.cache.set(piece.id, new CacheEntry(stability, performance.now()));
    this.stats.recalculations++;

    // Track dependencies
    const supports = this.validator.graph.getSupports(piece);
    for (const support of supports) {
      this.dependencies.addDependency(piece.id, support.id);
    }

    // Evict if cache too large
    if (this.cache.size > this.maxCacheSize) {
      this.evictStaleEntries();
    }

    return stability;
  }

  /**
   * Queue a piece for stability update
   */
  queueUpdate(piece, priority = UpdatePriority.NORMAL) {
    this.invalidateCache(piece.id);
    this.updateQueue.add(piece.id, priority);

    // Queue dependents with lower priority
    const affected = this.dependencies.getAffectedPieces(piece.id);
    for (const depId of affected) {
      this.invalidateCache(depId);
      this.updateQueue.add(
        depId,
        Math.min(priority + 1, UpdatePriority.BACKGROUND),
      );
    }
  }

  /**
   * Queue multiple pieces efficiently
   */
  queueBulkUpdate(pieces, priority = UpdatePriority.NORMAL) {
    const allAffected = new Set();

    for (const piece of pieces) {
      this.invalidateCache(piece.id);
      this.updateQueue.add(piece.id, priority);

      const affected = this.dependencies.getAffectedPieces(piece.id);
      for (const depId of affected) {
        allAffected.add(depId);
      }
    }

    // Queue all affected with lower priority
    for (const depId of allAffected) {
      this.invalidateCache(depId);
      this.updateQueue.add(
        depId,
        Math.min(priority + 1, UpdatePriority.BACKGROUND),
      );
    }
  }

  /**
   * Force immediate update of a piece
   */
  updateImmediate(piece) {
    this.invalidateCache(piece.id);
    return this.calculateAndCache(piece);
  }

  /**
   * Process queued updates - call once per frame
   */
  processUpdates(timeBudgetMs = 2) {
    const startTime = performance.now();
    this.frameCount++;

    // Always process immediate priority
    this.processBatch(this.immediateBatchSize, UpdatePriority.IMMEDIATE);

    // Process high priority every frame
    if (performance.now() - startTime < timeBudgetMs) {
      this.processBatch(this.batchSize, UpdatePriority.HIGH);
    }

    // Process normal priority every 2 frames
    if (
      this.frameCount % 2 === 0 &&
      performance.now() - startTime < timeBudgetMs
    ) {
      this.processBatch(this.batchSize, UpdatePriority.NORMAL);
    }

    // Process low priority every 5 frames
    if (
      this.frameCount % 5 === 0 &&
      performance.now() - startTime < timeBudgetMs
    ) {
      this.processBatch(this.batchSize, UpdatePriority.LOW);
    }

    // Process background when idle
    if (performance.now() - startTime < timeBudgetMs * 0.5) {
      this.processBatch(this.batchSize, UpdatePriority.BACKGROUND);
    }

    this.stats.totalProcessTime += performance.now() - startTime;
  }

  /**
   * Process a batch of updates
   */
  processBatch(maxCount, maxPriority) {
    const batch = this.updateQueue.getNextBatch(maxCount, maxPriority);

    if (batch.length === 0) return 0;

    // Sort by position (bottom to top) for correct calculation order
    const pieces = batch
      .map(({ pieceId }) => this.validator.graph.pieces.get(pieceId))
      .filter((p) => p)
      .sort((a, b) => a.position.y - b.position.y);

    for (const piece of pieces) {
      this.calculateAndCache(piece);
    }

    this.stats.batchesProcessed++;
    return pieces.length;
  }

  /**
   * Invalidate cache entry
   */
  invalidateCache(pieceId) {
    this.cache.delete(pieceId);
  }

  /**
   * Evict stale entries to manage memory
   */
  evictStaleEntries() {
    const now = performance.now();
    const toEvict = [];

    for (const [id, entry] of this.cache) {
      if (entry.isStale(this.maxCacheAge)) {
        toEvict.push(id);
      }
    }

    // If not enough stale entries, evict least recently used
    if (this.cache.size - toEvict.length > this.maxCacheSize * 0.8) {
      const entries = Array.from(this.cache.entries())
        .filter(([id]) => !toEvict.includes(id))
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

      const targetSize = Math.floor(this.maxCacheSize * 0.7);
      const toRemove = entries.slice(0, this.cache.size - targetSize);
      toEvict.push(...toRemove.map(([id]) => id));
    }

    for (const id of toEvict) {
      this.cache.delete(id);
    }

    return toEvict.length;
  }

  /**
   * Handle piece placement
   */
  onPiecePlaced(piece) {
    this.queueUpdate(piece, UpdatePriority.IMMEDIATE);
  }

  /**
   * Handle piece destruction
   */
  onPieceDestroyed(piece) {
    // Get affected before removing from dependencies
    const affected = this.dependencies.getAffectedPieces(piece.id);

    // Clean up
    this.invalidateCache(piece.id);
    this.updateQueue.remove(piece.id);
    this.dependencies.removePiece(piece.id);

    // Queue affected pieces for update
    for (const depId of affected) {
      this.updateQueue.add(depId, UpdatePriority.HIGH);
    }

    return affected;
  }

  /**
   * Precompute stability for a region
   */
  precomputeRegion(pieces) {
    // Sort bottom to top
    const sorted = [...pieces].sort((a, b) => a.position.y - b.position.y);

    for (const piece of sorted) {
      this.calculateAndCache(piece);
    }
  }

  /**
   * Get pending update count
   */
  getPendingCount() {
    return this.updateQueue.getCount();
  }

  /**
   * Check if updates are pending
   */
  hasPendingUpdates() {
    return this.updateQueue.getCount() > 0;
  }

  /**
   * Get statistics
   */
  getStats() {
    const hitRate =
      this.stats.cacheHits + this.stats.cacheMisses > 0
        ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
        : 0;

    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: Math.round(hitRate * 100) + "%",
      pendingUpdates: this.updateQueue.getCount(),
      pendingImmediate: this.updateQueue.getCount(UpdatePriority.IMMEDIATE),
      pendingHigh: this.updateQueue.getCount(UpdatePriority.HIGH),
      avgProcessTime:
        this.stats.batchesProcessed > 0
          ? this.stats.totalProcessTime / this.stats.batchesProcessed
          : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      recalculations: 0,
      batchesProcessed: 0,
      totalProcessTime: 0,
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.cache.clear();
    this.updateQueue.clear();
    this.dependencies.clear();
    this.resetStats();
  }
}

/**
 * Zone-based optimizer for very large worlds
 * Divides world into zones, only processes active zones
 */
export class ZonedStabilityOptimizer extends StabilityOptimizer {
  constructor(validator, options = {}) {
    super(validator, options);

    this.zoneSize = options.zoneSize ?? 100;
    this.activeZoneRadius = options.activeZoneRadius ?? 2;
    this.zones = new Map(); // zoneKey -> Set<pieceId>
    this.activeZones = new Set();
    this.playerPosition = null;
  }

  /**
   * Get zone key for position
   */
  getZoneKey(position) {
    const zx = Math.floor(position.x / this.zoneSize);
    const zz = Math.floor(position.z / this.zoneSize);
    return `${zx},${zz}`;
  }

  /**
   * Register piece in zone
   */
  registerPiece(piece) {
    const key = this.getZoneKey(piece.position);

    if (!this.zones.has(key)) {
      this.zones.set(key, new Set());
    }
    this.zones.get(key).add(piece.id);
  }

  /**
   * Unregister piece from zone
   */
  unregisterPiece(piece) {
    const key = this.getZoneKey(piece.position);
    this.zones.get(key)?.delete(piece.id);
  }

  /**
   * Update player position and active zones
   */
  setPlayerPosition(position) {
    this.playerPosition = position;
    this.updateActiveZones();
  }

  /**
   * Update which zones are active
   */
  updateActiveZones() {
    if (!this.playerPosition) return;

    const centerZone = this.getZoneKey(this.playerPosition);
    const [cx, cz] = centerZone.split(",").map(Number);

    const newActive = new Set();
    for (let dx = -this.activeZoneRadius; dx <= this.activeZoneRadius; dx++) {
      for (let dz = -this.activeZoneRadius; dz <= this.activeZoneRadius; dz++) {
        newActive.add(`${cx + dx},${cz + dz}`);
      }
    }

    this.activeZones = newActive;
  }

  /**
   * Override process to only handle active zones
   */
  processBatch(maxCount, maxPriority) {
    const batch = this.updateQueue.getNextBatch(maxCount * 2, maxPriority);

    if (batch.length === 0) return 0;

    // Filter to active zones
    const activeBatch = batch
      .filter(({ pieceId }) => {
        const piece = this.validator.graph.pieces.get(pieceId);
        if (!piece) return false;
        const zoneKey = this.getZoneKey(piece.position);
        return this.activeZones.has(zoneKey);
      })
      .slice(0, maxCount);

    // Re-queue inactive pieces with lower priority
    for (const { pieceId } of batch) {
      if (!activeBatch.find((b) => b.pieceId === pieceId)) {
        this.updateQueue.add(pieceId, UpdatePriority.BACKGROUND);
      }
    }

    // Process active batch
    const pieces = activeBatch
      .map(({ pieceId }) => this.validator.graph.pieces.get(pieceId))
      .filter((p) => p)
      .sort((a, b) => a.position.y - b.position.y);

    for (const piece of pieces) {
      this.calculateAndCache(piece);
    }

    this.stats.batchesProcessed++;
    return pieces.length;
  }

  /**
   * Get zone statistics
   */
  getZoneStats() {
    let totalPieces = 0;
    let activePieces = 0;

    for (const [key, pieces] of this.zones) {
      totalPieces += pieces.size;
      if (this.activeZones.has(key)) {
        activePieces += pieces.size;
      }
    }

    return {
      totalZones: this.zones.size,
      activeZones: this.activeZones.size,
      totalPieces,
      activePieces,
      zoneSize: this.zoneSize,
      activeRadius: this.activeZoneRadius,
    };
  }
}

export default StabilityOptimizer;
