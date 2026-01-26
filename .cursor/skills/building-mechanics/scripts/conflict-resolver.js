/**
 * ConflictResolver - Handle simultaneous building operations from multiple players
 *
 * When two players try to place at the same position at the same time,
 * or modify the same piece, this system determines who wins and how
 * to notify the losing party.
 *
 * Supports multiple resolution strategies:
 * - First-write-wins (simplest)
 * - Timestamp-based (fairest with clock sync)
 * - Lock-based (most robust)
 * - Optimistic with version checking
 *
 * Usage:
 *   const resolver = new ConflictResolver({ strategy: 'timestamp' });
 *   const result = resolver.resolvePlace(request1, request2);
 */

/**
 * Resolution strategies
 */
export const ResolutionStrategy = {
  FIRST_WRITE: "first_write", // First request to arrive wins
  TIMESTAMP: "timestamp", // Earlier client timestamp wins
  LOCK: "lock", // Pre-acquired locks required
  OPTIMISTIC: "optimistic", // Version-based conflict detection
};

/**
 * Conflict types
 */
export const ConflictType = {
  POSITION: "position", // Same placement position
  PIECE: "piece", // Same piece modified
  REGION: "region", // Same building region
  RESOURCE: "resource", // Same resource consumed
};

/**
 * Conflict result
 */
export class ConflictResult {
  constructor(winner, loser, type) {
    this.winner = winner;
    this.loser = loser;
    this.type = type;
    this.timestamp = Date.now();
    this.reason = null;
  }

  setReason(reason) {
    this.reason = reason;
    return this;
  }
}

/**
 * Lock for region-based conflict prevention
 */
export class RegionLock {
  constructor(region, owner, options = {}) {
    this.region = region;
    this.owner = owner;
    this.createdAt = Date.now();
    this.expiresAt = options.expiresAt ?? Date.now() + 30000; // 30s default
    this.authorized = new Set([owner]);
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  isAuthorized(playerId) {
    return this.authorized.has(playerId);
  }

  authorize(playerId) {
    this.authorized.add(playerId);
  }

  revoke(playerId) {
    if (playerId !== this.owner) {
      this.authorized.delete(playerId);
    }
  }

  extend(duration = 30000) {
    this.expiresAt = Date.now() + duration;
  }
}

/**
 * Pending request for conflict window
 */
class PendingRequest {
  constructor(request, client) {
    this.request = request;
    this.client = client;
    this.receivedAt = Date.now();
    this.clientTimestamp = request.timestamp ?? Date.now();
    this.position = request.position;
    this.pieceId = request.pieceId;
    this.processed = false;
    this.result = null;
  }
}

/**
 * Main conflict resolver
 */
export class ConflictResolver {
  constructor(options = {}) {
    this.strategy = options.strategy ?? ResolutionStrategy.FIRST_WRITE;
    this.conflictWindow = options.conflictWindow ?? 100; // ms to wait for conflicts
    this.positionTolerance = options.positionTolerance ?? 0.5; // units
    this.enableLocking = options.enableLocking ?? false;
    this.maxClockSkew = options.maxClockSkew ?? 1000; // Max allowed clock difference

    // State
    this.pendingRequests = [];
    this.locks = new Map(); // regionKey -> RegionLock
    this.pieceVersions = new Map(); // pieceId -> version
    this.processTimer = null;

    // Callbacks
    this.onConflictResolved = options.onConflictResolved ?? null;
    this.onRequestProcessed = options.onRequestProcessed ?? null;

    // Statistics
    this.stats = {
      requestsProcessed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      lockDenials: 0,
    };
  }

  /**
   * Submit a placement request
   */
  submitPlaceRequest(request, client) {
    const pending = new PendingRequest(request, client);
    this.pendingRequests.push(pending);

    // Schedule processing after conflict window
    this.scheduleProcessing();

    return pending;
  }

  /**
   * Submit a modification request
   */
  submitModifyRequest(request, client) {
    // Modifications can be processed immediately with version check
    if (this.strategy === ResolutionStrategy.OPTIMISTIC) {
      return this.processOptimisticModify(request, client);
    }

    const pending = new PendingRequest(request, client);
    pending.pieceId = request.pieceId;
    this.pendingRequests.push(pending);

    this.scheduleProcessing();
    return pending;
  }

  /**
   * Schedule batch processing of pending requests
   */
  scheduleProcessing() {
    if (this.processTimer) return;

    this.processTimer = setTimeout(() => {
      this.processTimer = null;
      this.processPendingRequests();
    }, this.conflictWindow);
  }

  /**
   * Process all pending requests
   */
  processPendingRequests() {
    if (this.pendingRequests.length === 0) return;

    // Group by conflict potential
    const positionGroups = this.groupByPosition(this.pendingRequests);
    const pieceGroups = this.groupByPiece(this.pendingRequests);

    // Process position conflicts (placements)
    for (const group of positionGroups.values()) {
      if (group.length > 1) {
        this.resolvePositionConflict(group);
      } else {
        this.processRequest(group[0]);
      }
    }

    // Process piece conflicts (modifications)
    for (const group of pieceGroups.values()) {
      if (group.length > 1) {
        this.resolvePieceConflict(group);
      } else if (!group[0].processed) {
        this.processRequest(group[0]);
      }
    }

    // Clear processed requests
    this.pendingRequests = this.pendingRequests.filter((r) => !r.processed);
  }

  /**
   * Group requests by position
   */
  groupByPosition(requests) {
    const groups = new Map();

    for (const req of requests) {
      if (!req.position) continue;

      const key = this.getPositionKey(req.position);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(req);
    }

    return groups;
  }

  /**
   * Group requests by piece ID
   */
  groupByPiece(requests) {
    const groups = new Map();

    for (const req of requests) {
      if (!req.pieceId) continue;

      if (!groups.has(req.pieceId)) {
        groups.set(req.pieceId, []);
      }
      groups.get(req.pieceId).push(req);
    }

    return groups;
  }

  /**
   * Get position key for grouping
   */
  getPositionKey(position) {
    const x = Math.round(position.x / this.positionTolerance);
    const y = Math.round(position.y / this.positionTolerance);
    const z = Math.round(position.z / this.positionTolerance);
    return `${x},${y},${z}`;
  }

  /**
   * Resolve conflict between placement requests
   */
  resolvePositionConflict(requests) {
    this.stats.conflictsDetected++;

    let winner;

    switch (this.strategy) {
      case ResolutionStrategy.FIRST_WRITE:
        winner = this.resolveFirstWrite(requests);
        break;
      case ResolutionStrategy.TIMESTAMP:
        winner = this.resolveByTimestamp(requests);
        break;
      case ResolutionStrategy.LOCK:
        winner = this.resolveByLock(requests);
        break;
      default:
        winner = this.resolveFirstWrite(requests);
    }

    // Process winner
    this.processRequest(winner);

    // Reject losers
    for (const req of requests) {
      if (req !== winner) {
        this.rejectRequest(
          req,
          "Position conflict - another player placed first",
        );
      }
    }

    this.stats.conflictsResolved++;

    // Callback
    if (this.onConflictResolved) {
      this.onConflictResolved(
        new ConflictResult(
          winner,
          requests.filter((r) => r !== winner),
          ConflictType.POSITION,
        ),
      );
    }
  }

  /**
   * Resolve conflict between piece modification requests
   */
  resolvePieceConflict(requests) {
    this.stats.conflictsDetected++;

    // For piece modifications, usually last write wins (most recent state)
    // Or use optimistic locking
    let winner;

    if (this.strategy === ResolutionStrategy.OPTIMISTIC) {
      // Find request with correct version
      const currentVersion = this.pieceVersions.get(requests[0].pieceId) ?? 0;
      winner = requests.find((r) => r.request.version === currentVersion);

      if (!winner) {
        // All stale - reject all
        for (const req of requests) {
          this.rejectRequest(req, "Piece was modified by another player");
        }
        return;
      }
    } else {
      winner = this.resolveByTimestamp(requests);
    }

    this.processRequest(winner);

    for (const req of requests) {
      if (req !== winner) {
        this.rejectRequest(req, "Piece modification conflict");
      }
    }

    this.stats.conflictsResolved++;
  }

  /**
   * First-write-wins resolution
   */
  resolveFirstWrite(requests) {
    return requests.reduce((earliest, req) =>
      req.receivedAt < earliest.receivedAt ? req : earliest,
    );
  }

  /**
   * Timestamp-based resolution
   */
  resolveByTimestamp(requests) {
    // Adjust for potential clock skew
    const adjusted = requests.map((req) => ({
      req,
      adjustedTime: this.adjustTimestamp(req.clientTimestamp, req.client),
    }));

    return adjusted.reduce((earliest, curr) =>
      curr.adjustedTime < earliest.adjustedTime ? curr : earliest,
    ).req;
  }

  /**
   * Lock-based resolution
   */
  resolveByLock(requests) {
    // Find request from lock holder
    for (const req of requests) {
      const regionKey = this.getRegionKey(req.position);
      const lock = this.locks.get(regionKey);

      if (lock && lock.isAuthorized(req.client.id) && !lock.isExpired()) {
        return req;
      }
    }

    // No valid lock holder - fall back to first-write
    return this.resolveFirstWrite(requests);
  }

  /**
   * Adjust timestamp for clock skew
   */
  adjustTimestamp(clientTimestamp, client) {
    const clockOffset = client.clockOffset ?? 0;
    return clientTimestamp - clockOffset;
  }

  /**
   * Process a winning request
   */
  processRequest(pending) {
    pending.processed = true;
    pending.result = { success: true };
    this.stats.requestsProcessed++;

    // Update version for piece modifications
    if (pending.pieceId) {
      const currentVersion = this.pieceVersions.get(pending.pieceId) ?? 0;
      this.pieceVersions.set(pending.pieceId, currentVersion + 1);
    }

    if (this.onRequestProcessed) {
      this.onRequestProcessed(pending, true);
    }
  }

  /**
   * Reject a losing request
   */
  rejectRequest(pending, reason) {
    pending.processed = true;
    pending.result = { success: false, reason };

    if (this.onRequestProcessed) {
      this.onRequestProcessed(pending, false, reason);
    }
  }

  /**
   * Process optimistic modify request
   */
  processOptimisticModify(request, client) {
    const pieceId = request.pieceId;
    const requestVersion = request.version;
    const currentVersion = this.pieceVersions.get(pieceId) ?? 0;

    if (requestVersion !== currentVersion) {
      return {
        success: false,
        reason: "Version mismatch - piece was modified",
        currentVersion,
        needsResync: true,
      };
    }

    // Update version
    this.pieceVersions.set(pieceId, currentVersion + 1);
    this.stats.requestsProcessed++;

    return {
      success: true,
      newVersion: currentVersion + 1,
    };
  }

  // ==================== Lock Management ====================

  /**
   * Acquire a lock on a region
   */
  acquireLock(position, playerId, options = {}) {
    if (!this.enableLocking) {
      return { success: false, reason: "Locking not enabled" };
    }

    const regionKey = this.getRegionKey(position);
    const existing = this.locks.get(regionKey);

    // Check for existing non-expired lock
    if (existing && !existing.isExpired()) {
      if (existing.owner === playerId) {
        // Extend existing lock
        existing.extend(options.duration);
        return { success: true, extended: true, lock: existing };
      }

      this.stats.lockDenials++;
      return {
        success: false,
        reason: "Region locked by another player",
        owner: existing.owner,
      };
    }

    // Create new lock
    const lock = new RegionLock(regionKey, playerId, options);
    this.locks.set(regionKey, lock);

    return { success: true, lock };
  }

  /**
   * Release a lock
   */
  releaseLock(position, playerId) {
    const regionKey = this.getRegionKey(position);
    const lock = this.locks.get(regionKey);

    if (!lock) {
      return { success: false, reason: "No lock found" };
    }

    if (lock.owner !== playerId) {
      return { success: false, reason: "Not lock owner" };
    }

    this.locks.delete(regionKey);
    return { success: true };
  }

  /**
   * Check if player can modify in region
   */
  canModifyRegion(position, playerId) {
    if (!this.enableLocking) return true;

    const regionKey = this.getRegionKey(position);
    const lock = this.locks.get(regionKey);

    if (!lock || lock.isExpired()) return true;
    return lock.isAuthorized(playerId);
  }

  /**
   * Get region key from position
   */
  getRegionKey(position) {
    // Larger regions than position tolerance
    const regionSize = 10;
    const x = Math.floor(position.x / regionSize);
    const z = Math.floor(position.z / regionSize);
    return `region_${x}_${z}`;
  }

  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks() {
    for (const [key, lock] of this.locks) {
      if (lock.isExpired()) {
        this.locks.delete(key);
      }
    }
  }

  // ==================== Version Management ====================

  /**
   * Get current version of a piece
   */
  getPieceVersion(pieceId) {
    return this.pieceVersions.get(pieceId) ?? 0;
  }

  /**
   * Set piece version (for sync)
   */
  setPieceVersion(pieceId, version) {
    this.pieceVersions.set(pieceId, version);
  }

  /**
   * Remove piece version tracking
   */
  removePieceVersion(pieceId) {
    this.pieceVersions.delete(pieceId);
  }

  // ==================== Utilities ====================

  /**
   * Set resolution strategy
   */
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      pendingRequests: this.pendingRequests.length,
      activeLocks: this.locks.size,
      trackedPieces: this.pieceVersions.size,
      strategy: this.strategy,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requestsProcessed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      lockDenials: 0,
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.pendingRequests = [];
    this.locks.clear();
    this.pieceVersions.clear();

    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
  }
}

/**
 * Permission system for building regions (Rust Tool Cupboard style)
 */
export class BuildingPermissionSystem {
  constructor(options = {}) {
    this.regions = new Map(); // regionId -> { owner, authorized, bounds }
    this.defaultAllow = options.defaultAllow ?? true; // Allow building outside regions
    this.regionRadius = options.regionRadius ?? 50;
  }

  /**
   * Claim a region
   */
  claimRegion(playerId, position) {
    // Check for overlapping claims
    for (const [id, region] of this.regions) {
      if (this.regionsOverlap(region.center, position, this.regionRadius)) {
        if (region.owner !== playerId) {
          return {
            success: false,
            reason: "Overlaps existing claim",
            owner: region.owner,
          };
        }
      }
    }

    const regionId = `claim_${Date.now()}_${playerId}`;
    this.regions.set(regionId, {
      id: regionId,
      owner: playerId,
      authorized: new Set([playerId]),
      center: { x: position.x, y: position.y, z: position.z },
      radius: this.regionRadius,
      createdAt: Date.now(),
    });

    return { success: true, regionId };
  }

  /**
   * Check if player can build at position
   */
  canBuild(playerId, position) {
    const region = this.getRegionAt(position);

    if (!region) {
      return this.defaultAllow;
    }

    return region.authorized.has(playerId);
  }

  /**
   * Authorize player in region
   */
  authorize(ownerId, playerId, regionId) {
    const region = this.regions.get(regionId);

    if (!region || region.owner !== ownerId) {
      return { success: false, reason: "Not region owner" };
    }

    region.authorized.add(playerId);
    return { success: true };
  }

  /**
   * Revoke player authorization
   */
  revoke(ownerId, playerId, regionId) {
    const region = this.regions.get(regionId);

    if (!region || region.owner !== ownerId) {
      return { success: false, reason: "Not region owner" };
    }

    if (playerId === ownerId) {
      return { success: false, reason: "Cannot revoke owner" };
    }

    region.authorized.delete(playerId);
    return { success: true };
  }

  /**
   * Get region at position
   */
  getRegionAt(position) {
    for (const region of this.regions.values()) {
      const dist = Math.sqrt(
        Math.pow(position.x - region.center.x, 2) +
          Math.pow(position.z - region.center.z, 2),
      );

      if (dist <= region.radius) {
        return region;
      }
    }
    return null;
  }

  /**
   * Check if two regions overlap
   */
  regionsOverlap(center1, center2, radius) {
    const dist = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.z - center2.z, 2),
    );
    return dist < radius * 2;
  }

  /**
   * Get all regions owned by player
   */
  getPlayerRegions(playerId) {
    const owned = [];
    for (const region of this.regions.values()) {
      if (region.owner === playerId) {
        owned.push(region);
      }
    }
    return owned;
  }

  /**
   * Remove region
   */
  removeRegion(regionId, playerId) {
    const region = this.regions.get(regionId);

    if (!region || region.owner !== playerId) {
      return { success: false, reason: "Not region owner" };
    }

    this.regions.delete(regionId);
    return { success: true };
  }
}

export default ConflictResolver;
