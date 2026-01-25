/**
 * HeuristicValidator - Fast stability validation for building systems
 *
 * Implements both arcade (connectivity-only) and heuristic (stability percentage)
 * approaches used by games like Fortnite, Rust, and Valheim.
 *
 * Usage:
 *   const validator = new HeuristicValidator({ mode: 'heuristic' });
 *   validator.addPiece(piece);
 *   const canPlace = validator.validatePlacement(newPiece);
 *   const unstable = validator.onPieceDestroyed(piece);
 */

import * as THREE from "three";

/**
 * Support relationship types
 */
export const SupportType = {
  GROUND: "ground", // Directly on terrain
  FOUNDATION: "foundation", // On a foundation piece
  VERTICAL: "vertical", // Wall/pillar support
  HORIZONTAL: "horizontal", // Floor/ceiling support
  CANTILEVER: "cantilever", // Offset horizontal support
};

/**
 * Validation modes
 */
export const ValidationMode = {
  ARCADE: "arcade", // Connectivity only (Fortnite/Minecraft)
  HEURISTIC: "heuristic", // Stability percentage (Rust/Valheim)
  HYBRID: "hybrid", // Arcade for placement, heuristic for limits
};

/**
 * Material presets with stability properties
 */
export const MaterialPresets = {
  WOOD: {
    name: "Wood",
    stabilityDecay: 0.15,
    maxStability: 1.0,
    canFloat: false,
  },
  STONE: {
    name: "Stone",
    stabilityDecay: 0.1,
    maxStability: 1.0,
    canFloat: false,
  },
  METAL: {
    name: "Metal",
    stabilityDecay: 0.05,
    maxStability: 1.0,
    canFloat: false,
  },
  THATCH: {
    name: "Thatch",
    stabilityDecay: 0.2,
    maxStability: 1.0,
    canFloat: false,
  },
  // Special materials
  SCAFFOLD: {
    name: "Scaffold",
    stabilityDecay: 0.25,
    maxStability: 0.5,
    canFloat: true, // Can be placed without support
  },
};

/**
 * Support graph for tracking piece relationships
 */
export class SupportGraph {
  constructor() {
    this.pieces = new Map(); // id -> piece
    this.supports = new Map(); // id -> Set<piece> (pieces this supports)
    this.supportedBy = new Map(); // id -> Set<piece> (pieces supporting this)
    this.groundedPieces = new Set(); // Pieces directly on ground
  }

  addPiece(piece) {
    this.pieces.set(piece.id, piece);
    this.supports.set(piece.id, new Set());
    this.supportedBy.set(piece.id, new Set());

    if (piece.isGrounded) {
      this.groundedPieces.add(piece.id);
    }
  }

  removePiece(piece) {
    const id = piece.id;

    // Remove from supporters' support lists
    for (const supporter of this.supportedBy.get(id) || []) {
      this.supports.get(supporter.id)?.delete(piece);
    }

    // Remove from supported pieces' supportedBy lists
    for (const supported of this.supports.get(id) || []) {
      this.supportedBy.get(supported.id)?.delete(piece);
    }

    this.pieces.delete(id);
    this.supports.delete(id);
    this.supportedBy.delete(id);
    this.groundedPieces.delete(id);
  }

  addSupportRelation(supporter, supported) {
    this.supports.get(supporter.id)?.add(supported);
    this.supportedBy.get(supported.id)?.add(supporter);
  }

  removeSupportRelation(supporter, supported) {
    this.supports.get(supporter.id)?.delete(supported);
    this.supportedBy.get(supported.id)?.delete(supporter);
  }

  getSupports(piece) {
    return Array.from(this.supportedBy.get(piece.id) || []);
  }

  getSupportedPieces(piece) {
    return Array.from(this.supports.get(piece.id) || []);
  }

  isGrounded(piece) {
    return this.groundedPieces.has(piece.id);
  }

  /**
   * Check if piece has path to any grounded piece (BFS)
   */
  hasPathToGround(piece) {
    if (this.isGrounded(piece)) return true;

    const visited = new Set();
    const queue = [piece];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (this.isGrounded(current)) return true;

      for (const supporter of this.getSupports(current)) {
        if (!visited.has(supporter.id)) {
          queue.push(supporter);
        }
      }
    }

    return false;
  }

  /**
   * Find all pieces that would be disconnected if piece is removed
   */
  findDisconnectedAfterRemoval(piece) {
    // Temporarily remove piece
    const supporters = this.getSupports(piece);
    const supported = this.getSupportedPieces(piece);

    // Find all pieces that might be affected
    const potentiallyAffected = new Set();
    const queue = [...supported];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === piece || potentiallyAffected.has(current)) continue;
      potentiallyAffected.add(current);

      for (const s of this.getSupportedPieces(current)) {
        queue.push(s);
      }
    }

    // Check which affected pieces would lose ground connection
    const disconnected = [];
    for (const affected of potentiallyAffected) {
      if (!this.hasPathToGroundExcluding(affected, piece)) {
        disconnected.push(affected);
      }
    }

    return disconnected;
  }

  hasPathToGroundExcluding(piece, excluded) {
    if (piece === excluded) return false;
    if (this.isGrounded(piece)) return true;

    const visited = new Set([excluded.id]);
    const queue = [piece];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (this.isGrounded(current)) return true;

      for (const supporter of this.getSupports(current)) {
        if (!visited.has(supporter.id)) {
          queue.push(supporter);
        }
      }
    }

    return false;
  }

  getAllPieces() {
    return Array.from(this.pieces.values());
  }

  clear() {
    this.pieces.clear();
    this.supports.clear();
    this.supportedBy.clear();
    this.groundedPieces.clear();
  }
}

/**
 * Main validator class
 */
export class HeuristicValidator {
  constructor(options = {}) {
    this.mode = options.mode ?? ValidationMode.HEURISTIC;
    this.minStability = options.minStability ?? 0.05;
    this.snapTolerance = options.snapTolerance ?? 0.15;
    this.defaultMaterial = options.defaultMaterial ?? MaterialPresets.WOOD;

    this.graph = new SupportGraph();
    this.stabilityCache = new Map();
    this.dirtyPieces = new Set();
  }

  /**
   * Add a piece to the system
   */
  addPiece(piece, detectSupports = true) {
    // Ensure piece has required properties
    piece.material = piece.material ?? this.defaultMaterial;
    piece.isGrounded = piece.isGrounded ?? this.detectGrounded(piece);

    this.graph.addPiece(piece);

    if (detectSupports) {
      this.detectAndAddSupports(piece);
    }

    this.invalidateStability(piece);
    return piece;
  }

  /**
   * Remove a piece and handle collapse
   */
  removePiece(piece) {
    // Find pieces that will collapse
    const toCollapse =
      this.mode === ValidationMode.ARCADE
        ? this.graph.findDisconnectedAfterRemoval(piece)
        : this.findUnstableAfterRemoval(piece);

    // Remove the piece
    this.graph.removePiece(piece);
    this.stabilityCache.delete(piece.id);

    // Invalidate affected pieces
    for (const p of toCollapse) {
      this.invalidateStability(p);
    }

    return toCollapse;
  }

  /**
   * Validate if a piece can be placed
   */
  validatePlacement(piece) {
    const result = {
      valid: false,
      stability: 0,
      reason: null,
      supports: [],
    };

    // Check for overlaps (would need spatial index in real impl)
    // Skipped here - assumed handled by collision system

    // Find potential supports
    const supports = this.findPotentialSupports(piece);
    result.supports = supports;

    // Mode-specific validation
    if (this.mode === ValidationMode.ARCADE) {
      // Arcade: just need connection to something grounded
      if (piece.isGrounded || this.detectGrounded(piece)) {
        result.valid = true;
        result.stability = 1.0;
      } else if (supports.length > 0) {
        // Check if any support has path to ground
        for (const support of supports) {
          if (this.graph.hasPathToGround(support)) {
            result.valid = true;
            result.stability = 1.0;
            break;
          }
        }
        if (!result.valid) {
          result.reason = "No connection to ground";
        }
      } else {
        result.reason = "No support found";
      }
    } else {
      // Heuristic: calculate stability
      const stability = this.calculateStabilityForPlacement(piece, supports);
      result.stability = stability;

      if (stability >= this.minStability) {
        result.valid = true;
      } else if (stability > 0) {
        result.reason = `Stability too low (${Math.round(stability * 100)}%)`;
      } else {
        result.reason = "No support found";
      }
    }

    // Special material handling
    if (!result.valid && piece.material.canFloat) {
      result.valid = true;
      result.stability = piece.material.maxStability;
      result.reason = null;
    }

    return result;
  }

  /**
   * Get stability of a piece
   */
  getStability(piece) {
    if (this.mode === ValidationMode.ARCADE) {
      return this.graph.hasPathToGround(piece) ? 1.0 : 0;
    }

    if (this.stabilityCache.has(piece.id) && !this.dirtyPieces.has(piece.id)) {
      return this.stabilityCache.get(piece.id);
    }

    const stability = this.calculateStability(piece);
    this.stabilityCache.set(piece.id, stability);
    this.dirtyPieces.delete(piece.id);
    return stability;
  }

  /**
   * Calculate stability for existing piece
   */
  calculateStability(piece) {
    // Grounded pieces are always 100%
    if (this.graph.isGrounded(piece)) {
      return 1.0;
    }

    const supports = this.graph.getSupports(piece);
    if (supports.length === 0) {
      return piece.material.canFloat ? piece.material.maxStability : 0;
    }

    // Find best supporter stability
    let maxSupportStability = 0;
    for (const supporter of supports) {
      const supporterStability = this.getStability(supporter);
      maxSupportStability = Math.max(maxSupportStability, supporterStability);
    }

    // Apply decay
    const decay = this.getDecayRate(piece);
    return Math.max(0, maxSupportStability - decay);
  }

  /**
   * Calculate stability for piece not yet in graph
   */
  calculateStabilityForPlacement(piece, supports) {
    if (this.detectGrounded(piece)) {
      return 1.0;
    }

    if (supports.length === 0) {
      return piece.material.canFloat ? piece.material.maxStability : 0;
    }

    let maxSupportStability = 0;
    for (const supporter of supports) {
      const supporterStability = this.getStability(supporter);
      maxSupportStability = Math.max(maxSupportStability, supporterStability);
    }

    const decay = this.getDecayRate(piece);
    return Math.max(0, maxSupportStability - decay);
  }

  /**
   * Get decay rate for a piece
   */
  getDecayRate(piece) {
    const baseDecay = piece.material.stabilityDecay;

    // Vertical pieces (walls, pillars) decay less
    const isVertical = piece.type === "wall" || piece.type === "pillar";
    const orientationMod = isVertical ? 0.6 : 1.0;

    // Cantilever penalty
    const isCantilever = piece.supportType === SupportType.CANTILEVER;
    const cantileverMod = isCantilever ? 1.5 : 1.0;

    return baseDecay * orientationMod * cantileverMod;
  }

  /**
   * Find unstable pieces after a removal
   */
  findUnstableAfterRemoval(piece) {
    const affected = this.getAffectedPieces(piece);
    const unstable = [];

    // Temporarily mark piece for exclusion
    const originalSupports = this.graph.getSupports(piece);
    const originalSupported = this.graph.getSupportedPieces(piece);

    // Remove support relationships temporarily
    for (const s of originalSupported) {
      this.graph.removeSupportRelation(piece, s);
    }

    // Check stability of affected pieces
    for (const p of affected) {
      this.stabilityCache.delete(p.id);
      const stability = this.calculateStability(p);
      if (stability < this.minStability) {
        unstable.push(p);
      }
    }

    // Restore relationships
    for (const s of originalSupported) {
      this.graph.addSupportRelation(piece, s);
    }

    // Restore cache
    for (const p of affected) {
      this.stabilityCache.delete(p.id);
    }

    return unstable;
  }

  /**
   * Get all pieces affected by changes to a piece
   */
  getAffectedPieces(piece) {
    const affected = new Set();
    const queue = [...this.graph.getSupportedPieces(piece)];

    while (queue.length > 0) {
      const current = queue.shift();
      if (affected.has(current)) continue;
      affected.add(current);

      for (const supported of this.graph.getSupportedPieces(current)) {
        queue.push(supported);
      }
    }

    return Array.from(affected);
  }

  /**
   * Detect if piece is on ground
   */
  detectGrounded(piece) {
    if (piece.type !== "foundation") return false;

    // Check if bottom of piece is at or below ground level
    const bottomY = piece.bounds?.min?.y ?? piece.position.y;
    return bottomY <= this.snapTolerance;
  }

  /**
   * Find potential support pieces for placement
   */
  findPotentialSupports(piece) {
    const supports = [];
    const pieceBounds = piece.bounds ?? this.estimateBounds(piece);

    for (const other of this.graph.getAllPieces()) {
      if (this.canSupport(other, piece, pieceBounds)) {
        supports.push(other);
      }
    }

    return supports;
  }

  /**
   * Check if one piece can support another
   */
  canSupport(supporter, piece, pieceBounds) {
    const supporterBounds = supporter.bounds ?? this.estimateBounds(supporter);
    pieceBounds = pieceBounds ?? this.estimateBounds(piece);

    // Supporter must be at or below piece
    if (supporterBounds.max.y < pieceBounds.min.y - this.snapTolerance) {
      return false;
    }

    // Vertical gap must be within tolerance
    const verticalGap = pieceBounds.min.y - supporterBounds.max.y;
    if (verticalGap > this.snapTolerance) {
      return false;
    }

    // Check horizontal overlap
    const overlapX =
      supporterBounds.max.x > pieceBounds.min.x - this.snapTolerance &&
      supporterBounds.min.x < pieceBounds.max.x + this.snapTolerance;
    const overlapZ =
      supporterBounds.max.z > pieceBounds.min.z - this.snapTolerance &&
      supporterBounds.min.z < pieceBounds.max.z + this.snapTolerance;

    return overlapX && overlapZ;
  }

  /**
   * Detect and add support relationships for a piece
   */
  detectAndAddSupports(piece) {
    const supports = this.findPotentialSupports(piece);

    for (const supporter of supports) {
      this.graph.addSupportRelation(supporter, piece);
      piece.supportType = this.determineSupportType(supporter, piece);
    }
  }

  /**
   * Determine the type of support relationship
   */
  determineSupportType(supporter, piece) {
    if (this.graph.isGrounded(supporter)) {
      return SupportType.GROUND;
    }

    if (supporter.type === "foundation") {
      return SupportType.FOUNDATION;
    }

    if (supporter.type === "wall" || supporter.type === "pillar") {
      return SupportType.VERTICAL;
    }

    // Check if piece is centered over supporter
    const dx = Math.abs(supporter.position.x - piece.position.x);
    const dz = Math.abs(supporter.position.z - piece.position.z);
    const offset = dx + dz;

    if (offset < 0.5) {
      return SupportType.HORIZONTAL;
    }

    return SupportType.CANTILEVER;
  }

  /**
   * Estimate bounds for piece without explicit bounds
   */
  estimateBounds(piece) {
    const size = piece.size ?? new THREE.Vector3(1, 1, 1);
    const halfSize = size.clone().multiplyScalar(0.5);
    const pos = piece.position ?? new THREE.Vector3();

    return {
      min: new THREE.Vector3().subVectors(pos, halfSize),
      max: new THREE.Vector3().addVectors(pos, halfSize),
    };
  }

  /**
   * Invalidate stability cache for piece and dependents
   */
  invalidateStability(piece) {
    this.dirtyPieces.add(piece.id);
    this.stabilityCache.delete(piece.id);

    const affected = this.getAffectedPieces(piece);
    for (const p of affected) {
      this.dirtyPieces.add(p.id);
      this.stabilityCache.delete(p.id);
    }
  }

  /**
   * Recalculate all dirty stability values
   */
  recalculateDirty() {
    const dirty = Array.from(this.dirtyPieces)
      .map((id) => this.graph.pieces.get(id))
      .filter((p) => p)
      .sort((a, b) => a.position.y - b.position.y); // Bottom up

    for (const piece of dirty) {
      this.getStability(piece);
    }

    this.dirtyPieces.clear();
  }

  /**
   * Get all pieces with stability below threshold
   */
  findUnstablePieces(threshold = null) {
    threshold = threshold ?? this.minStability;
    const unstable = [];

    for (const piece of this.graph.getAllPieces()) {
      const stability = this.getStability(piece);
      if (stability < threshold) {
        unstable.push({ piece, stability });
      }
    }

    return unstable;
  }

  /**
   * Set validation mode
   */
  setMode(mode) {
    this.mode = mode;
    // Clear cache when mode changes
    this.stabilityCache.clear();
    this.dirtyPieces.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    const pieces = this.graph.getAllPieces();
    let totalStability = 0;
    let minStability = Infinity;
    let maxStability = 0;
    let groundedCount = 0;

    for (const piece of pieces) {
      const stability = this.getStability(piece);
      totalStability += stability;
      minStability = Math.min(minStability, stability);
      maxStability = Math.max(maxStability, stability);
      if (this.graph.isGrounded(piece)) groundedCount++;
    }

    return {
      totalPieces: pieces.length,
      groundedPieces: groundedCount,
      avgStability: pieces.length > 0 ? totalStability / pieces.length : 0,
      minStability: minStability === Infinity ? 0 : minStability,
      maxStability,
      cacheSize: this.stabilityCache.size,
      dirtyCount: this.dirtyPieces.size,
      mode: this.mode,
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.graph.clear();
    this.stabilityCache.clear();
    this.dirtyPieces.clear();
  }
}

export default HeuristicValidator;
