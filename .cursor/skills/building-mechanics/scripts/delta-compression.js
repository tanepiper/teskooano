/**
 * DeltaCompression - Efficient state synchronization for networked building
 *
 * Only sends changes (deltas) rather than full state. Based on the Source
 * engine pattern: track what each client has acknowledged, compute difference,
 * send only what changed.
 *
 * Usage:
 *   const compressor = new DeltaCompressor();
 *   compressor.recordState(buildingState, version);
 *   const delta = compressor.getDeltaForClient(clientId, currentState, version);
 *   // On client acknowledgment:
 *   compressor.acknowledgeVersion(clientId, version);
 */

/**
 * Serialization helpers for network transmission
 */
export const Serializers = {
  vector3(v) {
    return { x: v.x, y: v.y, z: v.z };
  },

  vector3Compact(v, precision = 100) {
    // Quantize to reduce size
    return {
      x: Math.round(v.x * precision) / precision,
      y: Math.round(v.y * precision) / precision,
      z: Math.round(v.z * precision) / precision,
    };
  },

  euler(e) {
    return { x: e.x, y: e.y, z: e.z, order: e.order };
  },

  eulerCompact(e, precision = 1000) {
    // Usually only Y rotation matters for buildings
    return { y: Math.round(e.y * precision) / precision };
  },

  piece(piece) {
    return {
      id: piece.id,
      type: piece.type,
      position: this.vector3Compact(piece.position),
      rotation: this.eulerCompact(piece.rotation),
      material: piece.material?.name ?? "default",
      health: piece.health,
      buildingId: piece.buildingId,
    };
  },

  pieceMinimal(piece) {
    return {
      id: piece.id,
      t: piece.type,
      p: this.vector3Compact(piece.position),
      r: piece.rotation?.y ?? 0,
      m: piece.material?.name?.[0] ?? "W", // Single char material
      h: Math.round(piece.health),
    };
  },
};

/**
 * State snapshot for delta computation
 */
export class StateSnapshot {
  constructor(version) {
    this.version = version;
    this.timestamp = Date.now();
    this.pieces = new Map(); // id -> piece data
    this.buildings = new Map(); // buildingId -> metadata
  }

  /**
   * Create snapshot from current building state
   */
  static fromBuildingSystem(buildingSystem, version) {
    const snapshot = new StateSnapshot(version);

    for (const piece of buildingSystem.getAllPieces()) {
      snapshot.pieces.set(piece.id, {
        id: piece.id,
        type: piece.type,
        position: piece.position.clone(),
        rotation: piece.rotation?.clone(),
        material: piece.material?.name,
        health: piece.health,
        buildingId: piece.buildingId,
        lastModified: piece.lastModified ?? Date.now(),
      });
    }

    return snapshot;
  }

  /**
   * Clone this snapshot
   */
  clone() {
    const copy = new StateSnapshot(this.version);
    copy.timestamp = this.timestamp;

    for (const [id, piece] of this.pieces) {
      copy.pieces.set(id, {
        ...piece,
        position: piece.position.clone(),
        rotation: piece.rotation?.clone(),
      });
    }

    for (const [id, data] of this.buildings) {
      copy.buildings.set(id, { ...data });
    }

    return copy;
  }
}

/**
 * Delta between two states
 */
export class StateDelta {
  constructor(baseVersion, targetVersion) {
    this.baseVersion = baseVersion;
    this.targetVersion = targetVersion;
    this.timestamp = Date.now();

    this.added = []; // Full piece data for new pieces
    this.removed = []; // IDs of removed pieces
    this.modified = []; // Partial updates for changed pieces

    this.isEmpty = true;
  }

  /**
   * Serialize for network transmission
   */
  serialize(compact = true) {
    const serializer = compact ? Serializers.pieceMinimal : Serializers.piece;

    return {
      bv: this.baseVersion,
      tv: this.targetVersion,
      ts: this.timestamp,
      a: this.added.map((p) => serializer.call(Serializers, p)),
      r: this.removed,
      m: this.modified.map((m) => this.serializeModification(m, compact)),
    };
  }

  serializeModification(mod, compact) {
    const result = { id: mod.id };

    if (mod.health !== undefined) {
      result[compact ? "h" : "health"] = Math.round(mod.health);
    }
    if (mod.material !== undefined) {
      result[compact ? "m" : "material"] = compact
        ? mod.material[0]
        : mod.material;
    }
    if (mod.position !== undefined) {
      result[compact ? "p" : "position"] = Serializers.vector3Compact(
        mod.position,
      );
    }
    if (mod.rotation !== undefined) {
      result[compact ? "r" : "rotation"] = mod.rotation.y ?? 0;
    }

    return result;
  }

  /**
   * Get approximate size in bytes
   */
  getApproximateSize() {
    // Rough estimate
    return (
      this.added.length * 50 +
      this.removed.length * 8 +
      this.modified.length * 20 +
      20 // Header
    );
  }
}

/**
 * Full state sync message (when delta not possible)
 */
export class FullStateSync {
  constructor(state, version) {
    this.version = version;
    this.timestamp = Date.now();
    this.pieces = Array.from(state.pieces.values());
    this.isFull = true;
  }

  serialize(compact = true) {
    const serializer = compact ? Serializers.pieceMinimal : Serializers.piece;

    return {
      v: this.version,
      ts: this.timestamp,
      full: true,
      pieces: this.pieces.map((p) => serializer.call(Serializers, p)),
    };
  }
}

/**
 * Main delta compression system
 */
export class DeltaCompressor {
  constructor(options = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 64;
    this.maxHistoryAge = options.maxHistoryAge ?? 10000; // 10 seconds
    this.compactMode = options.compactMode ?? true;

    // State history ring buffer
    this.stateHistory = [];
    this.currentVersion = 0;

    // Per-client acknowledgment tracking
    this.clientAcks = new Map(); // clientId -> { version, timestamp }

    // Statistics
    this.stats = {
      deltasSent: 0,
      fullSyncsSent: 0,
      bytesCompressed: 0,
      bytesUncompressed: 0,
    };
  }

  /**
   * Record a new state snapshot
   */
  recordState(buildingSystem) {
    this.currentVersion++;
    const snapshot = StateSnapshot.fromBuildingSystem(
      buildingSystem,
      this.currentVersion,
    );

    this.stateHistory.push(snapshot);

    // Trim old history
    this.trimHistory();

    return this.currentVersion;
  }

  /**
   * Remove old state history
   */
  trimHistory() {
    const now = Date.now();

    // Remove by age
    while (
      this.stateHistory.length > 0 &&
      now - this.stateHistory[0].timestamp > this.maxHistoryAge
    ) {
      this.stateHistory.shift();
    }

    // Remove by count
    while (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Find state snapshot by version
   */
  findState(version) {
    return this.stateHistory.find((s) => s.version === version);
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.stateHistory[this.stateHistory.length - 1];
  }

  /**
   * Client acknowledges receiving a version
   */
  acknowledgeVersion(clientId, version) {
    const current = this.clientAcks.get(clientId);

    // Only update if newer
    if (!current || version > current.version) {
      this.clientAcks.set(clientId, {
        version,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get last acknowledged version for client
   */
  getClientAckVersion(clientId) {
    return this.clientAcks.get(clientId)?.version ?? 0;
  }

  /**
   * Remove client tracking
   */
  removeClient(clientId) {
    this.clientAcks.delete(clientId);
  }

  /**
   * Compute delta for a specific client
   */
  getDeltaForClient(clientId) {
    const currentState = this.getCurrentState();
    if (!currentState) {
      return null;
    }

    const ackVersion = this.getClientAckVersion(clientId);
    const baseState = this.findState(ackVersion);

    // If we don't have the base state, send full sync
    if (!baseState) {
      this.stats.fullSyncsSent++;
      return new FullStateSync(currentState, this.currentVersion);
    }

    // If already up to date, nothing to send
    if (ackVersion >= this.currentVersion) {
      return null;
    }

    // Compute delta
    const delta = this.computeDelta(baseState, currentState);

    // If delta is larger than full state, send full state instead
    const fullState = new FullStateSync(currentState, this.currentVersion);
    if (delta.getApproximateSize() > fullState.pieces.length * 30) {
      this.stats.fullSyncsSent++;
      return fullState;
    }

    this.stats.deltasSent++;
    return delta;
  }

  /**
   * Compute delta between two states
   */
  computeDelta(baseState, targetState) {
    const delta = new StateDelta(baseState.version, targetState.version);

    // Find added pieces (in target but not in base)
    for (const [id, piece] of targetState.pieces) {
      if (!baseState.pieces.has(id)) {
        delta.added.push(piece);
        delta.isEmpty = false;
      }
    }

    // Find removed pieces (in base but not in target)
    for (const [id] of baseState.pieces) {
      if (!targetState.pieces.has(id)) {
        delta.removed.push(id);
        delta.isEmpty = false;
      }
    }

    // Find modified pieces
    for (const [id, targetPiece] of targetState.pieces) {
      const basePiece = baseState.pieces.get(id);
      if (!basePiece) continue; // Already handled as added

      const changes = this.computePieceChanges(basePiece, targetPiece);
      if (changes) {
        delta.modified.push(changes);
        delta.isEmpty = false;
      }
    }

    return delta;
  }

  /**
   * Compute changes between two pieces
   */
  computePieceChanges(basePiece, targetPiece) {
    const changes = { id: targetPiece.id };
    let hasChanges = false;

    // Health change
    if (basePiece.health !== targetPiece.health) {
      changes.health = targetPiece.health;
      hasChanges = true;
    }

    // Material change (upgrade)
    if (basePiece.material !== targetPiece.material) {
      changes.material = targetPiece.material;
      hasChanges = true;
    }

    // Position change (rare for buildings)
    if (!this.vectorsEqual(basePiece.position, targetPiece.position)) {
      changes.position = targetPiece.position;
      hasChanges = true;
    }

    // Rotation change
    if (!this.rotationsEqual(basePiece.rotation, targetPiece.rotation)) {
      changes.rotation = targetPiece.rotation;
      hasChanges = true;
    }

    return hasChanges ? changes : null;
  }

  /**
   * Compare vectors with tolerance
   */
  vectorsEqual(a, b, tolerance = 0.001) {
    if (!a || !b) return a === b;
    return (
      Math.abs(a.x - b.x) < tolerance &&
      Math.abs(a.y - b.y) < tolerance &&
      Math.abs(a.z - b.z) < tolerance
    );
  }

  /**
   * Compare rotations with tolerance
   */
  rotationsEqual(a, b, tolerance = 0.001) {
    if (!a || !b) return a === b;
    return Math.abs((a.y || 0) - (b.y || 0)) < tolerance;
  }

  /**
   * Get statistics
   */
  getStats() {
    const compressionRatio =
      this.stats.bytesUncompressed > 0
        ? this.stats.bytesCompressed / this.stats.bytesUncompressed
        : 0;

    return {
      ...this.stats,
      compressionRatio: Math.round(compressionRatio * 100) + "%",
      historySize: this.stateHistory.length,
      trackedClients: this.clientAcks.size,
      currentVersion: this.currentVersion,
      oldestVersion: this.stateHistory[0]?.version ?? 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      deltasSent: 0,
      fullSyncsSent: 0,
      bytesCompressed: 0,
      bytesUncompressed: 0,
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.stateHistory = [];
    this.clientAcks.clear();
    this.currentVersion = 0;
    this.resetStats();
  }
}

/**
 * Client-side delta receiver
 */
export class DeltaReceiver {
  constructor() {
    this.currentVersion = 0;
    this.pendingDeltas = []; // For out-of-order handling
  }

  /**
   * Apply received delta or full sync
   */
  apply(message, buildingSystem) {
    if (message.full) {
      return this.applyFullSync(message, buildingSystem);
    } else {
      return this.applyDelta(message, buildingSystem);
    }
  }

  /**
   * Apply full state sync
   */
  applyFullSync(sync, buildingSystem) {
    // Clear existing state
    buildingSystem.clear();

    // Add all pieces
    for (const pieceData of sync.pieces) {
      const piece = this.deserializePiece(pieceData);
      buildingSystem.addPieceFromNetwork(piece);
    }

    this.currentVersion = sync.v;
    this.pendingDeltas = [];

    return {
      type: "full_sync",
      version: sync.v,
      pieceCount: sync.pieces.length,
    };
  }

  /**
   * Apply delta update
   */
  applyDelta(delta, buildingSystem) {
    // Check if we can apply this delta
    if (delta.bv !== this.currentVersion) {
      // Out of order - queue for later or request full sync
      if (delta.bv > this.currentVersion) {
        this.pendingDeltas.push(delta);
        return { type: "queued", version: delta.tv };
      } else {
        // Old delta, ignore
        return { type: "ignored", version: delta.tv };
      }
    }

    // Apply added pieces
    for (const pieceData of delta.a) {
      const piece = this.deserializePiece(pieceData);
      buildingSystem.addPieceFromNetwork(piece);
    }

    // Apply removed pieces
    for (const pieceId of delta.r) {
      buildingSystem.removePieceById(pieceId);
    }

    // Apply modifications
    for (const mod of delta.m) {
      this.applyModification(mod, buildingSystem);
    }

    this.currentVersion = delta.tv;

    // Try to apply any queued deltas
    this.processQueuedDeltas(buildingSystem);

    return {
      type: "delta",
      version: delta.tv,
      added: delta.a.length,
      removed: delta.r.length,
      modified: delta.m.length,
    };
  }

  /**
   * Apply modification to existing piece
   */
  applyModification(mod, buildingSystem) {
    const piece = buildingSystem.getPieceById(mod.id);
    if (!piece) return;

    if (mod.h !== undefined || mod.health !== undefined) {
      piece.health = mod.h ?? mod.health;
    }
    if (mod.m !== undefined || mod.material !== undefined) {
      const materialName = this.expandMaterial(mod.m ?? mod.material);
      piece.material = buildingSystem.getMaterial(materialName);
    }
    if (mod.p !== undefined || mod.position !== undefined) {
      const pos = mod.p ?? mod.position;
      piece.position.set(pos.x, pos.y, pos.z);
    }
    if (mod.r !== undefined || mod.rotation !== undefined) {
      const rot = mod.r ?? mod.rotation;
      if (typeof rot === "number") {
        piece.rotation.y = rot;
      } else {
        piece.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      }
    }

    buildingSystem.onPieceUpdated(piece);
  }

  /**
   * Process any queued deltas that can now be applied
   */
  processQueuedDeltas(buildingSystem) {
    let applied = true;

    while (applied && this.pendingDeltas.length > 0) {
      applied = false;

      for (let i = 0; i < this.pendingDeltas.length; i++) {
        const delta = this.pendingDeltas[i];

        if (delta.bv === this.currentVersion) {
          this.pendingDeltas.splice(i, 1);
          this.applyDelta(delta, buildingSystem);
          applied = true;
          break;
        }
      }
    }
  }

  /**
   * Deserialize piece from network format
   */
  deserializePiece(data) {
    return {
      id: data.id,
      type: data.t ?? data.type,
      position: data.p ?? data.position,
      rotation:
        typeof (data.r ?? data.rotation) === "number"
          ? { x: 0, y: data.r ?? data.rotation, z: 0 }
          : (data.r ?? data.rotation ?? { x: 0, y: 0, z: 0 }),
      material: this.expandMaterial(data.m ?? data.material),
      health: data.h ?? data.health ?? 100,
    };
  }

  /**
   * Expand single-char material code
   */
  expandMaterial(code) {
    if (!code || code.length > 1) return code;

    const map = {
      W: "Wood",
      S: "Stone",
      M: "Metal",
      T: "Thatch",
      d: "default",
    };

    return map[code] || code;
  }

  /**
   * Request full sync from server
   */
  requestFullSync() {
    this.pendingDeltas = [];
    return { type: "request_full_sync", currentVersion: this.currentVersion };
  }
}

export default DeltaCompressor;
