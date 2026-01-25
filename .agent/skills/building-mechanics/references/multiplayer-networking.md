# Multiplayer Networking for Building Systems

Networked building introduces challenges beyond typical game networking. Structures persist, players modify them simultaneously, and the combinatorial state space explodes. This reference covers authority models, synchronization strategies, and conflict resolution patterns used by production multiplayer building games.

## The Networking Challenge

Building systems create unique networking problems:

1. **State explosion**: A base with 1,000 pieces has 1,000+ entities to sync, each with position, rotation, material, health, and relationships.

2. **Simultaneous modification**: Multiple players editing the same structure at once creates race conditions and conflicts.

3. **Persistence**: Unlike transient game state (player positions), buildings must survive server restarts and player disconnections.

4. **Ownership complexity**: Who can modify what? Rust's Tool Cupboard system exists specifically to solve building permission conflicts.

5. **Bandwidth constraints**: Fortnite runs at 30Hz tick rate (not 60Hz) specifically because building generates so much state change.

## Authority Models

### Server-Authoritative (Recommended)

The server is the single source of truth. Clients send requests; server validates and broadcasts results.

**Flow:**

```
Client: "I want to place a wall at (10, 0, 15)"
Server: Validates position, collision, permissions, resources
Server: "Wall placed with ID 4827 at (10, 0, 15)"
Server: Broadcasts to all clients
All Clients: Create wall locally
```

**Advantages:**

- Cheat-resistant (server validates everything)
- Consistent state across all clients
- Clear conflict resolution (server decides)

**Disadvantages:**

- Latency visible to placing player
- Server CPU load scales with player count
- Requires client prediction for responsiveness

**When to use:** Any competitive or persistent game. This is Rust's and Fortnite's model.

### Client-Authoritative (Avoid for Building)

Clients make changes locally and inform server. Server trusts clients.

**Why it fails for building:**

- Trivial to cheat (spawn free resources, clip through walls)
- Conflict resolution becomes impossible
- State divergence across clients

**Only viable for:** Single-player with cloud save, or fully trusted clients (same-room co-op).

### Hybrid Authority

Different systems use different authority. Common pattern:

- **Server-authoritative:** Building placement, destruction, permissions
- **Client-authoritative:** Camera, UI state, local preview
- **Predicted:** Movement, some interactions

This is the practical approach. Clients predict placement visually while server validates.

## Client Prediction for Building

Players expect immediate feedback when placing. With 100ms latency, waiting for server confirmation feels sluggish. Solution: predict locally, reconcile with server.

### Optimistic Placement

```javascript
// Client-side
function onPlaceAttempt(piece, position, rotation) {
  // Generate temporary local ID
  const tempId = generateTempId();

  // Create ghost/preview immediately
  const localPiece = createLocalPiece(piece, position, rotation, tempId);
  localPiece.isPredicted = true;
  localPiece.confirmedByServer = false;

  // Send request to server
  sendToServer({
    type: "place_request",
    tempId,
    pieceType: piece.type,
    position: serializeVector(position),
    rotation: serializeRotation(rotation),
    timestamp: Date.now(),
  });

  // Add to pending predictions
  pendingPlacements.set(tempId, {
    localPiece,
    requestTime: Date.now(),
    timeout: 5000,
  });

  return localPiece;
}
```

### Server Confirmation

```javascript
// Client receives server response
function onPlaceConfirmed(message) {
  const { tempId, serverId, success, position, rotation, reason } = message;

  const pending = pendingPlacements.get(tempId);
  if (!pending) return; // Already timed out

  pendingPlacements.delete(tempId);

  if (success) {
    // Replace predicted piece with confirmed
    const confirmedPiece = pending.localPiece;
    confirmedPiece.id = serverId;
    confirmedPiece.isPredicted = false;
    confirmedPiece.confirmedByServer = true;

    // Correct position if server adjusted it (snapping, etc.)
    if (position) {
      confirmedPiece.position.copy(deserializeVector(position));
    }

    buildingSystem.registerPiece(confirmedPiece);
  } else {
    // Rollback: remove predicted piece
    buildingSystem.removePiece(pending.localPiece);
    showError(reason); // "Cannot place: overlapping existing structure"
  }
}
```

### Prediction Timeout

Predictions can't wait forever. Handle network issues gracefully.

```javascript
function updatePredictions() {
  const now = Date.now();

  for (const [tempId, pending] of pendingPlacements) {
    if (now - pending.requestTime > pending.timeout) {
      // Assume failure after timeout
      buildingSystem.removePiece(pending.localPiece);
      pendingPlacements.delete(tempId);
      showError("Placement timed out - please try again");
    }
  }
}
```

## Delta Compression

Sending full structure state every tick is prohibitive. Rust structures can have thousands of pieces. Solution: only send what changed.

### The Source Engine Pattern

Valve's approach (used in CS, TF2, etc.):

1. Server tracks what state each client has acknowledged
2. Server computes delta (difference) from last acknowledged state
3. Server sends only the delta
4. If heavy packet loss detected, send full state to resync

```javascript
class DeltaCompressor {
  constructor() {
    this.clientStates = new Map(); // clientId -> acknowledged state version
    this.stateHistory = []; // Ring buffer of recent states
    this.maxHistory = 64; // Keep ~1 second at 60Hz
  }

  recordState(state, version) {
    this.stateHistory.push({ state: this.cloneState(state), version });

    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift();
    }
  }

  getDeltaForClient(clientId, currentState, currentVersion) {
    const lastAcked = this.clientStates.get(clientId) ?? 0;
    const baseState = this.findState(lastAcked);

    if (!baseState) {
      // Client too far behind, send full state
      return { full: true, state: currentState };
    }

    // Compute delta
    const delta = this.computeDelta(baseState, currentState);
    return {
      full: false,
      delta,
      baseVersion: lastAcked,
      version: currentVersion,
    };
  }

  computeDelta(oldState, newState) {
    const delta = {
      added: [],
      removed: [],
      modified: [],
    };

    // Find added pieces
    for (const [id, piece] of newState.pieces) {
      if (!oldState.pieces.has(id)) {
        delta.added.push(this.serializePiece(piece));
      } else {
        // Check for modifications
        const oldPiece = oldState.pieces.get(id);
        if (this.pieceChanged(oldPiece, piece)) {
          delta.modified.push(this.serializePieceChanges(oldPiece, piece));
        }
      }
    }

    // Find removed pieces
    for (const [id] of oldState.pieces) {
      if (!newState.pieces.has(id)) {
        delta.removed.push(id);
      }
    }

    return delta;
  }

  pieceChanged(oldPiece, newPiece) {
    // Quick checks for common changes
    if (oldPiece.health !== newPiece.health) return true;
    if (oldPiece.material !== newPiece.material) return true;
    if (!oldPiece.position.equals(newPiece.position)) return true;
    return false;
  }
}
```

### Building-Specific Delta Optimization

Building pieces don't move often. Optimize for common cases:

```javascript
function serializePieceChanges(oldPiece, newPiece) {
  const changes = { id: newPiece.id };

  // Only include changed fields
  if (oldPiece.health !== newPiece.health) {
    changes.health = newPiece.health;
  }
  if (oldPiece.material !== newPiece.material) {
    changes.material = newPiece.material;
  }
  // Position changes are rare for buildings - flag separately
  if (!oldPiece.position.equals(newPiece.position)) {
    changes.position = serializeVector(newPiece.position);
  }

  return changes;
}
```

### Batching Updates

Group multiple changes into single packets:

```javascript
class UpdateBatcher {
  constructor(maxBatchSize = 50, maxDelay = 50) {
    this.pending = [];
    this.maxBatchSize = maxBatchSize;
    this.maxDelay = maxDelay;
    this.lastFlush = Date.now();
  }

  add(update) {
    this.pending.push(update);

    if (this.pending.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  update() {
    if (
      this.pending.length > 0 &&
      Date.now() - this.lastFlush > this.maxDelay
    ) {
      this.flush();
    }
  }

  flush() {
    if (this.pending.length === 0) return;

    const batch = {
      type: "building_update_batch",
      updates: this.pending,
      timestamp: Date.now(),
    };

    this.pending = [];
    this.lastFlush = Date.now();

    broadcast(batch);
  }
}
```

## Conflict Resolution

Two players place at the same spot at the same time. Who wins?

### First-Write-Wins

Simplest approach: first request to reach server succeeds.

```javascript
// Server-side
function handlePlaceRequest(request, client) {
  const position = deserializeVector(request.position);

  // Check if position is already occupied
  if (buildingSystem.isOccupied(position)) {
    return { success: false, reason: "Position occupied" };
  }

  // Atomically place and register
  const piece = buildingSystem.place(
    request.pieceType,
    position,
    request.rotation,
  );

  return { success: true, serverId: piece.id };
}
```

**Problem:** With network latency, "first" is ambiguous. Player A clicks first but has higher latency; Player B's request arrives first.

### Timestamp-Based Resolution

Include client timestamp, server decides based on who clicked first.

```javascript
function handlePlaceRequest(request, client) {
  const position = deserializeVector(request.position);
  const clientTime = request.timestamp;

  // Check pending requests for same position
  const conflicting = pendingRequests.find(
    (r) => vectorsEqual(r.position, position) && r.clientTime < clientTime,
  );

  if (conflicting) {
    // Earlier request wins
    return { success: false, reason: "Position claimed by another player" };
  }

  // Hold request briefly to allow conflicts to arrive
  pendingRequests.push({
    request,
    client,
    position,
    clientTime,
    serverTime: Date.now(),
  });

  // Process after conflict window
  setTimeout(() => processRequest(request, client), CONFLICT_WINDOW_MS);
}
```

**Problem:** Requires trusting client timestamps (cheatable) or complex clock synchronization.

### Lock-Based Resolution (Rust's Tool Cupboard)

Players claim regions. Only the owner (or authorized players) can modify.

```javascript
class BuildingPermissionSystem {
  constructor() {
    this.regions = new Map(); // regionId -> { owner, authorized: Set, bounds }
  }

  claimRegion(player, position, radius) {
    const regionId = this.generateRegionId();

    // Check for overlapping claims
    for (const [id, region] of this.regions) {
      if (this.regionsOverlap(region.bounds, position, radius)) {
        return { success: false, reason: "Overlaps existing claim" };
      }
    }

    this.regions.set(regionId, {
      owner: player.id,
      authorized: new Set([player.id]),
      bounds: { center: position, radius },
    });

    return { success: true, regionId };
  }

  canModify(player, position) {
    for (const region of this.regions.values()) {
      if (this.isInRegion(position, region.bounds)) {
        return region.authorized.has(player.id);
      }
    }
    // Outside all regions - allow (or deny, depending on game rules)
    return true;
  }

  authorize(owner, playerToAuth, regionId) {
    const region = this.regions.get(regionId);
    if (!region || region.owner !== owner.id) {
      return { success: false, reason: "Not region owner" };
    }

    region.authorized.add(playerToAuth.id);
    return { success: true };
  }
}
```

### Optimistic Locking

Clients include version number. Server rejects if version is stale.

```javascript
// Client request includes last known version
function placeRequest(piece, position, structureVersion) {
  return {
    type: "place_request",
    pieceType: piece.type,
    position: serializeVector(position),
    structureVersion, // Version of structure when client made decision
  };
}

// Server checks version
function handlePlaceRequest(request, client) {
  const structure = getStructureAt(request.position);

  if (structure && structure.version !== request.structureVersion) {
    // Structure changed since client's view - reject
    return {
      success: false,
      reason: "Structure modified by another player",
      currentVersion: structure.version,
      resync: getStructureState(structure),
    };
  }

  // Proceed with placement, increment version
  structure.version++;
  // ... place piece ...
}
```

## Large Structure Synchronization

A 500-piece base can't be sent every tick. Strategies for initial sync and ongoing updates.

### Chunked Initial Sync

When player approaches a large structure, stream it in chunks:

```javascript
class StructureStreamer {
  constructor() {
    this.chunkSize = 50; // Pieces per chunk
    this.streamDelay = 50; // ms between chunks
  }

  async streamStructureToClient(client, structure) {
    const pieces = Array.from(structure.pieces.values());
    const chunks = this.chunkArray(pieces, this.chunkSize);

    // Send metadata first
    client.send({
      type: "structure_stream_start",
      structureId: structure.id,
      totalPieces: pieces.length,
      chunkCount: chunks.length,
    });

    // Stream chunks
    for (let i = 0; i < chunks.length; i++) {
      await this.delay(this.streamDelay);

      client.send({
        type: "structure_chunk",
        structureId: structure.id,
        chunkIndex: i,
        pieces: chunks[i].map((p) => this.serializePiece(p)),
      });
    }

    client.send({
      type: "structure_stream_complete",
      structureId: structure.id,
    });
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### Priority-Based Updates

Not all pieces are equally important. Prioritize visible/nearby pieces.

```javascript
class PrioritySync {
  getPriority(piece, player) {
    let priority = 0;

    // Distance factor (closer = higher priority)
    const distance = piece.position.distanceTo(player.position);
    priority += Math.max(0, 100 - distance);

    // Visibility factor
    if (this.isInPlayerFOV(piece, player)) {
      priority += 50;
    }

    // Recent change factor
    const timeSinceChange = Date.now() - piece.lastModified;
    if (timeSinceChange < 1000) {
      priority += 100; // Recently changed pieces are critical
    }

    // Structural importance
    if (piece.type === "foundation") {
      priority += 20;
    }

    return priority;
  }

  getUpdatesForClient(client, allUpdates, maxUpdates = 20) {
    return allUpdates
      .map((update) => ({
        update,
        priority: this.getPriority(update.piece, client.player),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxUpdates)
      .map(({ update }) => update);
  }
}
```

### Structure IDs (Rust's Approach)

Group pieces by building. Query and sync at building level, not piece level.

```javascript
class BuildingIdSystem {
  constructor() {
    this.buildings = new Map(); // buildingId -> { pieces: Set, bounds, version }
    this.pieceToBuilding = new Map(); // pieceId -> buildingId
  }

  addPiece(piece, nearbyPiece = null) {
    let buildingId;

    if (nearbyPiece) {
      // Join existing building
      buildingId = this.pieceToBuilding.get(nearbyPiece.id);
    }

    if (!buildingId) {
      // Create new building
      buildingId = this.generateBuildingId();
      this.buildings.set(buildingId, {
        pieces: new Set(),
        bounds: null,
        version: 1,
      });
    }

    const building = this.buildings.get(buildingId);
    building.pieces.add(piece.id);
    building.version++;
    this.pieceToBuilding.set(piece.id, buildingId);
    this.updateBounds(building);

    return buildingId;
  }

  getBuildingPieces(buildingId) {
    const building = this.buildings.get(buildingId);
    return building ? Array.from(building.pieces) : [];
  }

  getBuildingsInRange(position, range) {
    const results = [];

    for (const [id, building] of this.buildings) {
      if (this.boundsInRange(building.bounds, position, range)) {
        results.push(id);
      }
    }

    return results;
  }
}
```

## Server Performance

Building operations can strain servers. Patterns for scalability.

### Rate Limiting

Prevent spam and DoS via excessive building:

```javascript
class BuildingRateLimiter {
  constructor(options = {}) {
    this.maxPlacementsPerSecond = options.maxPlacementsPerSecond ?? 5;
    this.maxDestructionsPerSecond = options.maxDestructionsPerSecond ?? 10;
    this.clientBuckets = new Map();
  }

  checkLimit(clientId, action) {
    let bucket = this.clientBuckets.get(clientId);

    if (!bucket) {
      bucket = {
        placements: { count: 0, resetTime: Date.now() + 1000 },
        destructions: { count: 0, resetTime: Date.now() + 1000 },
      };
      this.clientBuckets.set(clientId, bucket);
    }

    const now = Date.now();
    const limit =
      action === "place"
        ? { bucket: bucket.placements, max: this.maxPlacementsPerSecond }
        : { bucket: bucket.destructions, max: this.maxDestructionsPerSecond };

    // Reset bucket if window passed
    if (now > limit.bucket.resetTime) {
      limit.bucket.count = 0;
      limit.bucket.resetTime = now + 1000;
    }

    if (limit.bucket.count >= limit.max) {
      return { allowed: false, retryAfter: limit.bucket.resetTime - now };
    }

    limit.bucket.count++;
    return { allowed: true };
  }
}
```

### Async Processing

Don't block the main tick for building operations:

```javascript
class AsyncBuildingProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxProcessTimePerTick = 5; // ms
  }

  enqueue(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
    });
  }

  processTick() {
    if (this.queue.length === 0) return;

    const startTime = performance.now();

    while (this.queue.length > 0) {
      if (performance.now() - startTime > this.maxProcessTimePerTick) {
        break; // Yield to other systems
      }

      const { operation, resolve, reject } = this.queue.shift();

      try {
        const result = operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }
}
```

### Spatial Partitioning for Network

Only send updates to clients who can see them:

```javascript
class NetworkSpatialPartition {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.clientCells = new Map(); // clientId -> Set of cell keys
    this.cellClients = new Map(); // cellKey -> Set of clientIds
  }

  updateClientPosition(clientId, position) {
    // Remove from old cells
    const oldCells = this.clientCells.get(clientId) || new Set();
    for (const cell of oldCells) {
      this.cellClients.get(cell)?.delete(clientId);
    }

    // Add to new cells (with some range)
    const newCells = this.getCellsInRange(position, 200);
    this.clientCells.set(clientId, newCells);

    for (const cell of newCells) {
      if (!this.cellClients.has(cell)) {
        this.cellClients.set(cell, new Set());
      }
      this.cellClients.get(cell).add(clientId);
    }
  }

  getClientsForPosition(position) {
    const cell = this.getCellKey(position);
    return Array.from(this.cellClients.get(cell) || []);
  }

  broadcastToNearby(position, message, excludeClient = null) {
    const clients = this.getClientsForPosition(position);

    for (const clientId of clients) {
      if (clientId !== excludeClient) {
        sendToClient(clientId, message);
      }
    }
  }
}
```

## Message Protocol

Efficient wire format for building messages.

### Message Types

```javascript
const BuildingMessageType = {
  // Client -> Server
  PLACE_REQUEST: 0x01,
  DESTROY_REQUEST: 0x02,
  UPGRADE_REQUEST: 0x03,
  ROTATE_REQUEST: 0x04,

  // Server -> Client
  PLACE_CONFIRMED: 0x10,
  PLACE_REJECTED: 0x11,
  PIECE_DESTROYED: 0x12,
  PIECE_UPDATED: 0x13,
  STRUCTURE_SYNC: 0x14,
  DELTA_UPDATE: 0x15,

  // Bidirectional
  PING: 0xf0,
  PONG: 0xf1,
};
```

### Binary Encoding

JSON is convenient but verbose. For high-frequency updates, binary is better:

```javascript
class BuildingMessageEncoder {
  encodePlace(tempId, pieceType, position, rotation) {
    const buffer = new ArrayBuffer(26);
    const view = new DataView(buffer);

    let offset = 0;
    view.setUint8(offset++, BuildingMessageType.PLACE_REQUEST);
    view.setUint32(offset, tempId); offset += 4;
    view.setUint8(offset++, pieceType);
    view.setFloat32(offset, position.x); offset += 4;
    view.setFloat32(offset, position.y); offset += 4;
    view.setFloat32(offset, position.z); offset += 4;
    view.setFloat32(offset, rotation.y); offset += 4; // Only Y rotation usually needed

    return buffer;
  }

  decodePlace(buffer) {
    const view = new DataView(buffer);
    let offset = 1; // Skip type byte

    return {
      tempId: view.getUint32(offset), offset += 4,
      pieceType: view.getUint8(offset++),
      position: {
        x: view.getFloat32(offset), offset += 4,
        y: view.getFloat32(offset), offset += 4,
        z: view.getFloat32(offset), offset += 4
      },
      rotation: view.getFloat32(offset)
    };
  }
}
```

## Integration Checklist

When implementing networked building:

- [ ] Choose authority model (server-authoritative recommended)
- [ ] Implement client prediction with rollback
- [ ] Add delta compression for ongoing updates
- [ ] Handle conflicts (first-write, timestamp, or lock-based)
- [ ] Implement chunked sync for large structures
- [ ] Add rate limiting to prevent abuse
- [ ] Use spatial partitioning for targeted broadcasts
- [ ] Add permission system if needed (tool cupboard style)
- [ ] Test with simulated latency and packet loss
- [ ] Profile server CPU usage under load

## Related References

- `building-network-manager.js` - Complete networking system
- `client-prediction.js` - Optimistic placement and rollback
- `delta-compression.js` - State delta computation
- `conflict-resolver.js` - Conflict detection and resolution
- `performance-at-scale.md` - Spatial partitioning for network queries
