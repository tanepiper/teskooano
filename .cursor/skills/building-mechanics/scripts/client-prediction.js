/**
 * ClientPrediction - Optimistic placement with rollback for responsive building
 *
 * Players expect immediate feedback when placing. With network latency,
 * waiting for server confirmation feels sluggish. This system predicts
 * placement locally and reconciles with server responses.
 *
 * Usage:
 *   const prediction = new ClientPrediction(buildingSystem, networkManager);
 *   const localPiece = prediction.predictPlace(pieceType, position, rotation);
 *   // When server responds:
 *   prediction.onServerConfirm(tempId, serverId, success);
 */

import * as THREE from "three";

/**
 * Prediction states
 */
export const PredictionState = {
  PENDING: "pending", // Waiting for server response
  CONFIRMED: "confirmed", // Server accepted
  REJECTED: "rejected", // Server rejected
  TIMEOUT: "timeout", // No response in time
  CORRECTED: "corrected", // Accepted but position adjusted
};

/**
 * Individual prediction record
 */
export class PredictionRecord {
  constructor(tempId, pieceData, options = {}) {
    this.tempId = tempId;
    this.pieceData = pieceData;
    this.localPiece = null;

    this.state = PredictionState.PENDING;
    this.serverId = null;
    this.serverData = null;
    this.error = null;

    this.createdAt = Date.now();
    this.resolvedAt = null;
    this.timeout = options.timeout ?? 5000;
    this.retryCount = 0;
    this.maxRetries = options.maxRetries ?? 2;

    // Callbacks
    this.onConfirm = options.onConfirm ?? null;
    this.onReject = options.onReject ?? null;
    this.onTimeout = options.onTimeout ?? null;
  }

  /**
   * Check if prediction has timed out
   */
  isTimedOut() {
    return (
      this.state === PredictionState.PENDING &&
      Date.now() - this.createdAt > this.timeout
    );
  }

  /**
   * Mark as confirmed
   */
  confirm(serverId, serverData = null) {
    this.state = serverData?.corrected
      ? PredictionState.CORRECTED
      : PredictionState.CONFIRMED;
    this.serverId = serverId;
    this.serverData = serverData;
    this.resolvedAt = Date.now();

    if (this.onConfirm) {
      this.onConfirm(this);
    }
  }

  /**
   * Mark as rejected
   */
  reject(error) {
    this.state = PredictionState.REJECTED;
    this.error = error;
    this.resolvedAt = Date.now();

    if (this.onReject) {
      this.onReject(this);
    }
  }

  /**
   * Mark as timed out
   */
  markTimeout() {
    this.state = PredictionState.TIMEOUT;
    this.resolvedAt = Date.now();

    if (this.onTimeout) {
      this.onTimeout(this);
    }
  }

  /**
   * Get latency (request to response time)
   */
  getLatency() {
    if (!this.resolvedAt) return null;
    return this.resolvedAt - this.createdAt;
  }
}

/**
 * Ghost piece for visual prediction
 */
export class GhostPiece {
  constructor(piece, options = {}) {
    this.piece = piece;
    this.isPredicted = true;
    this.opacity = options.opacity ?? 0.7;
    this.pulseSpeed = options.pulseSpeed ?? 2;
    this.pulseAmount = options.pulseAmount ?? 0.2;

    // Visual state
    this.baseOpacity = this.opacity;
    this.currentOpacity = this.opacity;
    this.time = 0;

    // Apply ghost appearance
    this.applyGhostMaterial();
  }

  /**
   * Make piece look like a ghost/prediction
   */
  applyGhostMaterial() {
    const mesh = this.piece.mesh || this.piece;
    if (!mesh.material) return;

    // Clone material to avoid affecting others
    if (!mesh._originalMaterial) {
      mesh._originalMaterial = mesh.material;
      mesh.material = mesh.material.clone();
    }

    mesh.material.transparent = true;
    mesh.material.opacity = this.opacity;

    // Slight color tint to indicate prediction
    if (mesh.material.color) {
      mesh.material.color.multiplyScalar(1.1);
    }
  }

  /**
   * Update ghost animation
   */
  update(deltaTime) {
    this.time += deltaTime;

    // Pulse opacity
    const pulse = Math.sin(this.time * this.pulseSpeed) * this.pulseAmount;
    this.currentOpacity = this.baseOpacity + pulse;

    const mesh = this.piece.mesh || this.piece;
    if (mesh.material) {
      mesh.material.opacity = Math.max(0.3, Math.min(0.9, this.currentOpacity));
    }
  }

  /**
   * Convert to solid (confirmed) piece
   */
  solidify() {
    const mesh = this.piece.mesh || this.piece;

    if (mesh._originalMaterial) {
      mesh.material = mesh._originalMaterial;
      delete mesh._originalMaterial;
    } else if (mesh.material) {
      mesh.material.transparent = false;
      mesh.material.opacity = 1.0;
    }

    this.isPredicted = false;
  }

  /**
   * Fade out and remove
   */
  fadeOut(duration = 300) {
    return new Promise((resolve) => {
      const mesh = this.piece.mesh || this.piece;
      const startOpacity = mesh.material?.opacity ?? 1;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (mesh.material) {
          mesh.material.opacity = startOpacity * (1 - progress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }
}

/**
 * Main client prediction system
 */
export class ClientPrediction {
  constructor(buildingSystem, options = {}) {
    this.buildingSystem = buildingSystem;

    // Configuration
    this.predictionTimeout = options.predictionTimeout ?? 5000;
    this.maxPendingPredictions = options.maxPendingPredictions ?? 10;
    this.enableGhostVisuals = options.enableGhostVisuals ?? true;
    this.autoRetry = options.autoRetry ?? true;
    this.maxRetries = options.maxRetries ?? 2;

    // State
    this.predictions = new Map(); // tempId -> PredictionRecord
    this.ghostPieces = new Map(); // tempId -> GhostPiece
    this.tempIdCounter = 0;
    this.serverIdMap = new Map(); // tempId -> serverId (for reconciliation)

    // Network interface (set by network manager)
    this.sendToServer = options.sendToServer ?? null;

    // Callbacks
    this.onPredictionConfirmed = options.onPredictionConfirmed ?? null;
    this.onPredictionRejected = options.onPredictionRejected ?? null;
    this.onPredictionTimeout = options.onPredictionTimeout ?? null;

    // Statistics
    this.stats = {
      totalPredictions: 0,
      confirmed: 0,
      rejected: 0,
      timeouts: 0,
      corrections: 0,
      avgLatency: 0,
      latencySum: 0,
    };
  }

  /**
   * Generate unique temporary ID
   */
  generateTempId() {
    return `pred_${Date.now()}_${++this.tempIdCounter}`;
  }

  /**
   * Predict a piece placement
   */
  predictPlace(pieceType, position, rotation, options = {}) {
    // Check prediction limit
    if (this.predictions.size >= this.maxPendingPredictions) {
      console.warn("Too many pending predictions");
      return null;
    }

    const tempId = this.generateTempId();

    // Create piece data
    const pieceData = {
      type: pieceType,
      position: position.clone(),
      rotation: rotation?.clone() ?? new THREE.Euler(),
      material: options.material ?? "default",
      tempId,
    };

    // Create local piece immediately
    const localPiece = this.buildingSystem.createPiece(pieceData);
    localPiece.id = tempId;
    localPiece.isPredicted = true;

    // Add to building system (but mark as predicted)
    this.buildingSystem.addPredictedPiece(localPiece);

    // Create prediction record
    const record = new PredictionRecord(tempId, pieceData, {
      timeout: this.predictionTimeout,
      maxRetries: this.maxRetries,
      onConfirm: (r) => this.handleConfirm(r),
      onReject: (r) => this.handleReject(r),
      onTimeout: (r) => this.handleTimeout(r),
    });
    record.localPiece = localPiece;

    this.predictions.set(tempId, record);
    this.stats.totalPredictions++;

    // Create ghost visual
    if (this.enableGhostVisuals) {
      const ghost = new GhostPiece(localPiece);
      this.ghostPieces.set(tempId, ghost);
    }

    // Send to server
    if (this.sendToServer) {
      this.sendToServer({
        type: "place_request",
        tempId,
        pieceType,
        position: this.serializeVector(position),
        rotation: this.serializeRotation(rotation),
        material: options.material,
      });
    }

    return localPiece;
  }

  /**
   * Predict piece destruction
   */
  predictDestroy(piece) {
    const tempId = this.generateTempId();
    const pieceId = piece.id;

    // Remove locally immediately
    const removedPiece = this.buildingSystem.removePiece(piece);

    // Create prediction record
    const record = new PredictionRecord(
      tempId,
      {
        action: "destroy",
        pieceId,
        removedPiece,
      },
      {
        timeout: this.predictionTimeout,
        onReject: (r) => {
          // Rollback: restore the piece
          if (r.pieceData.removedPiece) {
            this.buildingSystem.addPiece(r.pieceData.removedPiece);
          }
        },
      },
    );

    this.predictions.set(tempId, record);

    // Send to server
    if (this.sendToServer) {
      this.sendToServer({
        type: "destroy_request",
        tempId,
        pieceId,
      });
    }

    return tempId;
  }

  /**
   * Handle server confirmation
   */
  onServerConfirm(tempId, serverId, serverData = null) {
    const record = this.predictions.get(tempId);
    if (!record) return;

    record.confirm(serverId, serverData);
  }

  /**
   * Handle server rejection
   */
  onServerReject(tempId, error) {
    const record = this.predictions.get(tempId);
    if (!record) return;

    record.reject(error);
  }

  /**
   * Internal confirm handler
   */
  handleConfirm(record) {
    const { tempId, serverId, serverData, localPiece } = record;

    // Update piece ID
    if (localPiece) {
      localPiece.id = serverId;
      localPiece.isPredicted = false;

      // Apply any server corrections
      if (serverData?.position) {
        const pos = this.deserializeVector(serverData.position);
        if (!localPiece.position.equals(pos)) {
          localPiece.position.copy(pos);
          this.stats.corrections++;
        }
      }

      // Register with building system under real ID
      this.buildingSystem.confirmPredictedPiece(tempId, serverId);
    }

    // Solidify ghost
    const ghost = this.ghostPieces.get(tempId);
    if (ghost) {
      ghost.solidify();
      this.ghostPieces.delete(tempId);
    }

    // Track mapping
    this.serverIdMap.set(tempId, serverId);

    // Update stats
    this.stats.confirmed++;
    const latency = record.getLatency();
    if (latency) {
      this.stats.latencySum += latency;
      this.stats.avgLatency = this.stats.latencySum / this.stats.confirmed;
    }

    // Clean up
    this.predictions.delete(tempId);

    // Callback
    if (this.onPredictionConfirmed) {
      this.onPredictionConfirmed(record);
    }
  }

  /**
   * Internal reject handler
   */
  handleReject(record) {
    const { tempId, localPiece, error } = record;

    // Remove predicted piece
    if (localPiece) {
      this.buildingSystem.removePredictedPiece(tempId);
    }

    // Fade out ghost
    const ghost = this.ghostPieces.get(tempId);
    if (ghost) {
      ghost.fadeOut().then(() => {
        this.ghostPieces.delete(tempId);
      });
    }

    // Update stats
    this.stats.rejected++;

    // Clean up
    this.predictions.delete(tempId);

    // Callback
    if (this.onPredictionRejected) {
      this.onPredictionRejected(record, error);
    }
  }

  /**
   * Internal timeout handler
   */
  handleTimeout(record) {
    const { tempId, localPiece } = record;

    // Retry if enabled
    if (this.autoRetry && record.retryCount < record.maxRetries) {
      record.retryCount++;
      record.createdAt = Date.now();
      record.state = PredictionState.PENDING;

      // Resend request
      if (this.sendToServer) {
        this.sendToServer({
          type: "place_request",
          tempId,
          pieceType: record.pieceData.type,
          position: this.serializeVector(record.pieceData.position),
          rotation: this.serializeRotation(record.pieceData.rotation),
          retry: record.retryCount,
        });
      }
      return;
    }

    // Remove predicted piece
    if (localPiece) {
      this.buildingSystem.removePredictedPiece(tempId);
    }

    // Remove ghost
    const ghost = this.ghostPieces.get(tempId);
    if (ghost) {
      ghost.fadeOut().then(() => {
        this.ghostPieces.delete(tempId);
      });
    }

    // Update stats
    this.stats.timeouts++;

    // Clean up
    this.predictions.delete(tempId);

    // Callback
    if (this.onPredictionTimeout) {
      this.onPredictionTimeout(record);
    }
  }

  /**
   * Update predictions - call every frame
   */
  update(deltaTime) {
    // Check for timeouts
    for (const [tempId, record] of this.predictions) {
      if (record.isTimedOut()) {
        record.markTimeout();
      }
    }

    // Update ghost visuals
    for (const ghost of this.ghostPieces.values()) {
      ghost.update(deltaTime);
    }
  }

  /**
   * Get pending prediction count
   */
  getPendingCount() {
    return this.predictions.size;
  }

  /**
   * Check if a piece is predicted
   */
  isPredicted(pieceOrId) {
    const id = pieceOrId.id ?? pieceOrId;
    return this.predictions.has(id);
  }

  /**
   * Get real server ID for a temp ID
   */
  getServerId(tempId) {
    return this.serverIdMap.get(tempId);
  }

  /**
   * Reconcile with server state (after full sync)
   */
  reconcileWithServerState(serverPieces) {
    // Remove any predictions that conflict with server state
    for (const [tempId, record] of this.predictions) {
      const localPiece = record.localPiece;
      if (!localPiece) continue;

      // Check if server has a piece at same position
      const conflicting = serverPieces.find((sp) =>
        this.vectorsEqual(sp.position, localPiece.position),
      );

      if (conflicting) {
        // Server has authoritative piece - remove prediction
        this.handleReject(record);
      }
    }
  }

  /**
   * Serialize vector for network
   */
  serializeVector(v) {
    return { x: v.x, y: v.y, z: v.z };
  }

  /**
   * Deserialize vector from network
   */
  deserializeVector(data) {
    return new THREE.Vector3(data.x, data.y, data.z);
  }

  /**
   * Serialize rotation for network
   */
  serializeRotation(r) {
    if (!r) return { y: 0 };
    return { x: r.x, y: r.y, z: r.z };
  }

  /**
   * Compare vectors
   */
  vectorsEqual(a, b, tolerance = 0.01) {
    if (!a || !b) return false;
    return (
      Math.abs(a.x - b.x) < tolerance &&
      Math.abs(a.y - b.y) < tolerance &&
      Math.abs(a.z - b.z) < tolerance
    );
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      pending: this.predictions.size,
      ghosts: this.ghostPieces.size,
      confirmRate:
        this.stats.totalPredictions > 0
          ? Math.round(
              (this.stats.confirmed / this.stats.totalPredictions) * 100,
            ) + "%"
          : "N/A",
      avgLatencyMs: Math.round(this.stats.avgLatency),
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalPredictions: 0,
      confirmed: 0,
      rejected: 0,
      timeouts: 0,
      corrections: 0,
      avgLatency: 0,
      latencySum: 0,
    };
  }

  /**
   * Clear all predictions
   */
  clear() {
    // Remove all predicted pieces
    for (const [tempId, record] of this.predictions) {
      if (record.localPiece) {
        this.buildingSystem.removePredictedPiece(tempId);
      }
    }

    this.predictions.clear();
    this.ghostPieces.clear();
    this.serverIdMap.clear();
  }
}

export default ClientPrediction;
