/**
 * BuildingNetworkManager - Complete networking system for multiplayer building
 *
 * Integrates delta compression, client prediction, and conflict resolution
 * into a unified networking layer for building mechanics.
 *
 * Server-authoritative model with client prediction for responsiveness.
 *
 * Usage:
 *   // Server
 *   const server = new BuildingNetworkServer(buildingSystem);
 *   server.onClientMessage(clientId, message);
 *
 *   // Client
 *   const client = new BuildingNetworkClient(buildingSystem);
 *   client.connect(serverUrl);
 *   client.placeRequest(pieceType, position, rotation);
 */

import { DeltaCompressor, DeltaReceiver } from "./delta-compression.js";
import { ClientPrediction } from "./client-prediction.js";
import {
  ConflictResolver,
  BuildingPermissionSystem,
} from "./conflict-resolver.js";

/**
 * Message types for building network protocol
 */
export const MessageType = {
  // Client -> Server
  PLACE_REQUEST: "place_request",
  DESTROY_REQUEST: "destroy_request",
  UPGRADE_REQUEST: "upgrade_request",
  ROTATE_REQUEST: "rotate_request",
  CLAIM_REGION: "claim_region",
  AUTHORIZE_PLAYER: "authorize_player",

  // Server -> Client
  PLACE_CONFIRMED: "place_confirmed",
  PLACE_REJECTED: "place_rejected",
  PIECE_DESTROYED: "piece_destroyed",
  PIECE_UPDATED: "piece_updated",
  FULL_SYNC: "full_sync",
  DELTA_UPDATE: "delta_update",
  REGION_UPDATE: "region_update",

  // Bidirectional
  PING: "ping",
  PONG: "pong",
  ACK: "ack",
  ERROR: "error",
};

/**
 * Rate limiter for building operations
 */
class RateLimiter {
  constructor(options = {}) {
    this.limits = {
      place: options.placePerSecond ?? 5,
      destroy: options.destroyPerSecond ?? 10,
      upgrade: options.upgradePerSecond ?? 3,
    };
    this.buckets = new Map(); // clientId -> { action -> { count, resetTime } }
  }

  check(clientId, action) {
    const limit = this.limits[action] ?? 10;
    let clientBuckets = this.buckets.get(clientId);

    if (!clientBuckets) {
      clientBuckets = {};
      this.buckets.set(clientId, clientBuckets);
    }

    const now = Date.now();
    let bucket = clientBuckets[action];

    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 0, resetTime: now + 1000 };
      clientBuckets[action] = bucket;
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfter: bucket.resetTime - now,
      };
    }

    bucket.count++;
    return { allowed: true };
  }

  reset(clientId) {
    this.buckets.delete(clientId);
  }
}

/**
 * Server-side building network manager
 */
export class BuildingNetworkServer {
  constructor(buildingSystem, options = {}) {
    this.buildingSystem = buildingSystem;

    // Configuration
    this.tickRate = options.tickRate ?? 20; // Updates per second
    this.maxClientsPerUpdate = options.maxClientsPerUpdate ?? 50;

    // Subsystems
    this.deltaCompressor = new DeltaCompressor({
      maxHistorySize: options.deltaHistorySize ?? 64,
      compactMode: true,
    });
    this.conflictResolver = new ConflictResolver({
      strategy: options.conflictStrategy ?? "first_write",
      conflictWindow: options.conflictWindow ?? 100,
      enableLocking: options.enableLocking ?? false,
    });
    this.permissions = new BuildingPermissionSystem({
      defaultAllow: options.defaultAllowBuilding ?? true,
      regionRadius: options.regionRadius ?? 50,
    });
    this.rateLimiter = new RateLimiter(options.rateLimits);

    // Client management
    this.clients = new Map(); // clientId -> ClientState
    this.clientPositions = new Map(); // clientId -> position (for spatial broadcasts)

    // State
    this.stateVersion = 0;
    this.lastTickTime = 0;
    this.tickInterval = null;

    // Callbacks (implement these to send messages)
    this.sendToClient = options.sendToClient ?? null;
    this.broadcastToAll = options.broadcastToAll ?? null;
    this.broadcastToNearby = options.broadcastToNearby ?? null;

    // Set up conflict resolver callbacks
    this.conflictResolver.onRequestProcessed = (pending, success, reason) => {
      this.handleRequestProcessed(pending, success, reason);
    };

    // Statistics
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      placementsProcessed: 0,
      destructionsProcessed: 0,
      conflictsResolved: 0,
    };
  }

  /**
   * Start the server tick loop
   */
  start() {
    if (this.tickInterval) return;

    const tickMs = 1000 / this.tickRate;
    this.tickInterval = setInterval(() => this.tick(), tickMs);
    this.lastTickTime = Date.now();
  }

  /**
   * Stop the server tick loop
   */
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Server tick - process updates and send deltas
   */
  tick() {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    // Record current state
    this.stateVersion++;
    this.deltaCompressor.recordState(this.buildingSystem);

    // Send updates to clients
    this.sendUpdatesToClients();

    // Clean up
    this.conflictResolver.cleanupExpiredLocks();
  }

  /**
   * Send delta updates to all clients
   */
  sendUpdatesToClients() {
    if (!this.sendToClient) return;

    let clientsProcessed = 0;

    for (const [clientId, clientState] of this.clients) {
      if (clientsProcessed >= this.maxClientsPerUpdate) break;

      const delta = this.deltaCompressor.getDeltaForClient(clientId);

      if (delta && !delta.isEmpty) {
        const message = {
          type: delta.isFull ? MessageType.FULL_SYNC : MessageType.DELTA_UPDATE,
          data: delta.serialize(true),
          version: this.stateVersion,
        };

        this.sendToClient(clientId, message);
        this.stats.messagesSent++;
      }

      clientsProcessed++;
    }
  }

  /**
   * Handle incoming message from client
   */
  onClientMessage(clientId, message) {
    this.stats.messagesReceived++;

    switch (message.type) {
      case MessageType.PLACE_REQUEST:
        this.handlePlaceRequest(clientId, message);
        break;
      case MessageType.DESTROY_REQUEST:
        this.handleDestroyRequest(clientId, message);
        break;
      case MessageType.UPGRADE_REQUEST:
        this.handleUpgradeRequest(clientId, message);
        break;
      case MessageType.CLAIM_REGION:
        this.handleClaimRegion(clientId, message);
        break;
      case MessageType.AUTHORIZE_PLAYER:
        this.handleAuthorizePlayer(clientId, message);
        break;
      case MessageType.ACK:
        this.handleAck(clientId, message);
        break;
      case MessageType.PING:
        this.handlePing(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle place request
   */
  handlePlaceRequest(clientId, message) {
    // Rate limit check
    const rateCheck = this.rateLimiter.check(clientId, "place");
    if (!rateCheck.allowed) {
      this.sendReject(
        clientId,
        message.tempId,
        `Rate limited. Retry in ${rateCheck.retryAfter}ms`,
      );
      return;
    }

    // Permission check
    const position = message.position;
    if (!this.permissions.canBuild(clientId, position)) {
      this.sendReject(
        clientId,
        message.tempId,
        "No permission to build in this area",
      );
      return;
    }

    // Validate placement (collision, resources, etc.)
    const validation = this.validatePlacement(message, clientId);
    if (!validation.valid) {
      this.sendReject(clientId, message.tempId, validation.reason);
      return;
    }

    // Submit to conflict resolver
    const client = this.clients.get(clientId);
    this.conflictResolver.submitPlaceRequest(message, {
      id: clientId,
      ...client,
    });
  }

  /**
   * Handle destroy request
   */
  handleDestroyRequest(clientId, message) {
    const rateCheck = this.rateLimiter.check(clientId, "destroy");
    if (!rateCheck.allowed) {
      this.sendReject(clientId, message.tempId, "Rate limited");
      return;
    }

    const piece = this.buildingSystem.getPieceById(message.pieceId);
    if (!piece) {
      this.sendReject(clientId, message.tempId, "Piece not found");
      return;
    }

    // Permission check
    if (!this.permissions.canBuild(clientId, piece.position)) {
      this.sendReject(
        clientId,
        message.tempId,
        "No permission to destroy in this area",
      );
      return;
    }

    // Destroy piece
    const destroyed = this.buildingSystem.destroyPiece(piece);
    this.stats.destructionsProcessed++;

    // Broadcast destruction
    this.broadcastPieceDestroyed(message.pieceId, destroyed);

    // Confirm to requester
    this.sendConfirm(clientId, message.tempId, message.pieceId, {
      destroyed: destroyed.length,
    });
  }

  /**
   * Handle upgrade request
   */
  handleUpgradeRequest(clientId, message) {
    const rateCheck = this.rateLimiter.check(clientId, "upgrade");
    if (!rateCheck.allowed) {
      this.sendReject(clientId, message.tempId, "Rate limited");
      return;
    }

    const piece = this.buildingSystem.getPieceById(message.pieceId);
    if (!piece) {
      this.sendReject(clientId, message.tempId, "Piece not found");
      return;
    }

    // Permission check
    if (!this.permissions.canBuild(clientId, piece.position)) {
      this.sendReject(clientId, message.tempId, "No permission");
      return;
    }

    // Upgrade piece
    const upgraded = this.buildingSystem.upgradePiece(piece, message.material);
    if (!upgraded) {
      this.sendReject(clientId, message.tempId, "Cannot upgrade");
      return;
    }

    // Broadcast update
    this.broadcastPieceUpdated(piece);

    // Confirm
    this.sendConfirm(clientId, message.tempId, piece.id, {
      material: message.material,
    });
  }

  /**
   * Handle region claim request
   */
  handleClaimRegion(clientId, message) {
    const result = this.permissions.claimRegion(clientId, message.position);

    if (result.success) {
      this.send(clientId, {
        type: MessageType.REGION_UPDATE,
        action: "claimed",
        regionId: result.regionId,
        position: message.position,
      });
    } else {
      this.send(clientId, {
        type: MessageType.ERROR,
        error: result.reason,
      });
    }
  }

  /**
   * Handle authorize player request
   */
  handleAuthorizePlayer(clientId, message) {
    const result = this.permissions.authorize(
      clientId,
      message.playerId,
      message.regionId,
    );

    this.send(clientId, {
      type: MessageType.REGION_UPDATE,
      action: result.success ? "authorized" : "error",
      playerId: message.playerId,
      error: result.reason,
    });
  }

  /**
   * Handle acknowledgment
   */
  handleAck(clientId, message) {
    this.deltaCompressor.acknowledgeVersion(clientId, message.version);
  }

  /**
   * Handle ping
   */
  handlePing(clientId, message) {
    this.send(clientId, {
      type: MessageType.PONG,
      clientTime: message.clientTime,
      serverTime: Date.now(),
    });
  }

  /**
   * Handle processed request from conflict resolver
   */
  handleRequestProcessed(pending, success, reason) {
    const clientId = pending.client.id;
    const message = pending.request;

    if (success) {
      // Actually place the piece
      const piece = this.buildingSystem.place(
        message.pieceType,
        message.position,
        message.rotation,
        message.material,
      );

      this.stats.placementsProcessed++;

      // Send confirmation
      this.sendConfirm(clientId, message.tempId, piece.id, {
        position: piece.position,
        rotation: piece.rotation,
      });

      // Broadcast to nearby players
      if (this.broadcastToNearby) {
        this.broadcastToNearby(
          message.position,
          {
            type: MessageType.PIECE_UPDATED,
            piece: this.serializePiece(piece),
          },
          clientId,
        );
      }
    } else {
      this.sendReject(clientId, message.tempId, reason);
    }
  }

  /**
   * Validate placement request
   */
  validatePlacement(message, clientId) {
    // Check collision
    if (
      this.buildingSystem.checkCollision(message.position, message.pieceType)
    ) {
      return { valid: false, reason: "Position occupied" };
    }

    // Check structural validity
    if (
      !this.buildingSystem.isValidPlacement(message.pieceType, message.position)
    ) {
      return { valid: false, reason: "Invalid placement - needs support" };
    }

    // Additional validation (resources, limits, etc.) would go here

    return { valid: true };
  }

  /**
   * Send confirmation to client
   */
  sendConfirm(clientId, tempId, serverId, data = {}) {
    this.send(clientId, {
      type: MessageType.PLACE_CONFIRMED,
      tempId,
      serverId,
      ...data,
    });
  }

  /**
   * Send rejection to client
   */
  sendReject(clientId, tempId, reason) {
    this.send(clientId, {
      type: MessageType.PLACE_REJECTED,
      tempId,
      reason,
    });
  }

  /**
   * Broadcast piece destroyed
   */
  broadcastPieceDestroyed(pieceId, cascadeDestroyed = []) {
    const message = {
      type: MessageType.PIECE_DESTROYED,
      pieceId,
      cascade: cascadeDestroyed.map((p) => p.id),
    };

    if (this.broadcastToAll) {
      this.broadcastToAll(message);
    }
  }

  /**
   * Broadcast piece updated
   */
  broadcastPieceUpdated(piece) {
    const message = {
      type: MessageType.PIECE_UPDATED,
      piece: this.serializePiece(piece),
    };

    if (this.broadcastToAll) {
      this.broadcastToAll(message);
    }
  }

  /**
   * Send message to client
   */
  send(clientId, message) {
    if (this.sendToClient) {
      this.sendToClient(clientId, message);
      this.stats.messagesSent++;
    }
  }

  /**
   * Serialize piece for network
   */
  serializePiece(piece) {
    return {
      id: piece.id,
      type: piece.type,
      position: {
        x: piece.position.x,
        y: piece.position.y,
        z: piece.position.z,
      },
      rotation: piece.rotation?.y ?? 0,
      material: piece.material?.name ?? "default",
      health: piece.health,
    };
  }

  // ==================== Client Management ====================

  /**
   * Register new client
   */
  addClient(clientId, playerData = {}) {
    this.clients.set(clientId, {
      id: clientId,
      joinedAt: Date.now(),
      ...playerData,
    });

    // Send full state sync
    const fullSync = this.deltaCompressor.getDeltaForClient(clientId);
    this.send(clientId, {
      type: MessageType.FULL_SYNC,
      data: fullSync?.serialize(true),
      version: this.stateVersion,
    });
  }

  /**
   * Remove client
   */
  removeClient(clientId) {
    this.clients.delete(clientId);
    this.clientPositions.delete(clientId);
    this.deltaCompressor.removeClient(clientId);
    this.rateLimiter.reset(clientId);
  }

  /**
   * Update client position (for spatial queries)
   */
  updateClientPosition(clientId, position) {
    this.clientPositions.set(clientId, position);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      clients: this.clients.size,
      stateVersion: this.stateVersion,
      deltaCompressor: this.deltaCompressor.getStats(),
      conflictResolver: this.conflictResolver.getStats(),
    };
  }
}

/**
 * Client-side building network manager
 */
export class BuildingNetworkClient {
  constructor(buildingSystem, options = {}) {
    this.buildingSystem = buildingSystem;

    // Subsystems
    this.prediction = new ClientPrediction(buildingSystem, {
      predictionTimeout: options.predictionTimeout ?? 5000,
      enableGhostVisuals: options.enableGhostVisuals ?? true,
      sendToServer: (msg) => this.send(msg),
    });
    this.deltaReceiver = new DeltaReceiver();

    // Connection state
    this.connected = false;
    this.socket = null;
    this.serverUrl = null;

    // Latency tracking
    this.latency = 0;
    this.pingInterval = null;
    this.lastPingTime = 0;

    // Callbacks
    this.onConnected = options.onConnected ?? null;
    this.onDisconnected = options.onDisconnected ?? null;
    this.onError = options.onError ?? null;
    this.onPlaceConfirmed = options.onPlaceConfirmed ?? null;
    this.onPlaceRejected = options.onPlaceRejected ?? null;

    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesReceived: 0,
    };
  }

  /**
   * Connect to server
   */
  connect(serverUrl) {
    this.serverUrl = serverUrl;

    // WebSocket connection (implement based on your networking layer)
    this.socket = new WebSocket(serverUrl);

    this.socket.onopen = () => {
      this.connected = true;
      this.startPing();
      if (this.onConnected) this.onConnected();
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.stopPing();
      if (this.onDisconnected) this.onDisconnected();
    };

    this.socket.onerror = (error) => {
      if (this.onError) this.onError(error);
    };

    this.socket.onmessage = (event) => {
      this.onMessage(JSON.parse(event.data));
    };
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.stopPing();
  }

  /**
   * Send message to server
   */
  send(message) {
    if (!this.connected || !this.socket) return false;

    this.socket.send(JSON.stringify(message));
    this.stats.messagesSent++;
    return true;
  }

  /**
   * Handle incoming message
   */
  onMessage(message) {
    this.stats.messagesReceived++;

    switch (message.type) {
      case MessageType.PLACE_CONFIRMED:
        this.handlePlaceConfirmed(message);
        break;
      case MessageType.PLACE_REJECTED:
        this.handlePlaceRejected(message);
        break;
      case MessageType.FULL_SYNC:
      case MessageType.DELTA_UPDATE:
        this.handleStateUpdate(message);
        break;
      case MessageType.PIECE_DESTROYED:
        this.handlePieceDestroyed(message);
        break;
      case MessageType.PIECE_UPDATED:
        this.handlePieceUpdated(message);
        break;
      case MessageType.PONG:
        this.handlePong(message);
        break;
      case MessageType.ERROR:
        this.handleError(message);
        break;
    }
  }

  /**
   * Handle place confirmed
   */
  handlePlaceConfirmed(message) {
    this.prediction.onServerConfirm(message.tempId, message.serverId, message);
    if (this.onPlaceConfirmed) this.onPlaceConfirmed(message);
  }

  /**
   * Handle place rejected
   */
  handlePlaceRejected(message) {
    this.prediction.onServerReject(message.tempId, message.reason);
    if (this.onPlaceRejected) this.onPlaceRejected(message);
  }

  /**
   * Handle state update (full sync or delta)
   */
  handleStateUpdate(message) {
    const result = this.deltaReceiver.apply(message.data, this.buildingSystem);

    // Acknowledge receipt
    this.send({
      type: MessageType.ACK,
      version: message.version,
    });

    // Reconcile predictions with server state
    if (result.type === "full_sync") {
      this.prediction.reconcileWithServerState(message.data.pieces);
    }
  }

  /**
   * Handle piece destroyed
   */
  handlePieceDestroyed(message) {
    this.buildingSystem.removePieceById(message.pieceId);

    // Also remove cascade destroyed pieces
    for (const pieceId of message.cascade || []) {
      this.buildingSystem.removePieceById(pieceId);
    }
  }

  /**
   * Handle piece updated
   */
  handlePieceUpdated(message) {
    const piece = this.buildingSystem.getPieceById(message.piece.id);
    if (piece) {
      this.buildingSystem.updatePieceFromNetwork(piece, message.piece);
    } else {
      this.buildingSystem.addPieceFromNetwork(message.piece);
    }
  }

  /**
   * Handle pong
   */
  handlePong(message) {
    this.latency = Date.now() - message.clientTime;
  }

  /**
   * Handle error
   */
  handleError(message) {
    console.error("Server error:", message.error);
    if (this.onError) this.onError(message);
  }

  // ==================== Building Operations ====================

  /**
   * Request piece placement
   */
  placeRequest(pieceType, position, rotation, options = {}) {
    return this.prediction.predictPlace(pieceType, position, rotation, options);
  }

  /**
   * Request piece destruction
   */
  destroyRequest(piece) {
    return this.prediction.predictDestroy(piece);
  }

  /**
   * Request piece upgrade
   */
  upgradeRequest(piece, material) {
    const tempId = this.prediction.generateTempId();

    this.send({
      type: MessageType.UPGRADE_REQUEST,
      tempId,
      pieceId: piece.id,
      material,
    });

    return tempId;
  }

  // ==================== Utilities ====================

  /**
   * Start ping interval
   */
  startPing() {
    this.pingInterval = setInterval(() => {
      this.lastPingTime = Date.now();
      this.send({
        type: MessageType.PING,
        clientTime: this.lastPingTime,
      });
    }, 1000);
  }

  /**
   * Stop ping interval
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Update - call every frame
   */
  update(deltaTime) {
    this.prediction.update(deltaTime);
  }

  /**
   * Get latency
   */
  getLatency() {
    return this.latency;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      connected: this.connected,
      latency: this.latency,
      prediction: this.prediction.getStats(),
      deltaReceiver: {
        currentVersion: this.deltaReceiver.currentVersion,
        pendingDeltas: this.deltaReceiver.pendingDeltas.length,
      },
    };
  }
}

export default { BuildingNetworkServer, BuildingNetworkClient };
