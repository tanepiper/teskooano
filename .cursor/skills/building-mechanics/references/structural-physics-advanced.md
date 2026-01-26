# Structural Physics Advanced

Building games face a fundamental tension: realistic physics create satisfying, believable structures but demand enormous computation and frustrate players with unexpected collapses. This reference covers the spectrum from arcade simplicity to full simulation, with focus on the heuristic middle ground used by most successful building games.

## The Physics Spectrum

### Arcade Style (Fortnite, Minecraft)

No structural simulation at all. Pieces exist or don't exist. The only physics rule: if a structure becomes disconnected from any grounded piece, it collapses entirely.

**Characteristics:**

- Binary stability: connected = stable, disconnected = collapse
- No stress, no load distribution, no material strength
- Pieces can float if connected to something grounded
- Collapse is instant and total

**Why it works:** Speed. Fortnite players build during combat—checking "is this connected?" is O(1) with proper data structures. Full physics would make build battles impossible.

**Implementation:**

```javascript
// Arcade: Just check connectivity to ground
function isStable(piece, buildingGraph) {
  return buildingGraph.hasPathToGround(piece);
}

function onPieceDestroyed(piece, buildingGraph) {
  buildingGraph.remove(piece);

  // Find all pieces no longer connected to ground
  const disconnected = buildingGraph.findDisconnected();

  // Instant collapse - no physics, just removal
  for (const p of disconnected) {
    destroyPiece(p);
  }
}
```

### Heuristic Style (Rust, Valheim, 7 Days to Die)

Simplified stability rules that feel physics-like without simulating actual forces. Each piece has a "stability value" based on its support chain, not real stress calculations.

**Rust's approach:** Every piece has stability 0-100%. Ground pieces = 100%. Each piece above inherits stability minus a penalty. When stability hits 0%, the piece can't be placed or collapses.

**Valheim's insight:** The developers explicitly stated their system "does not work like real materials – it's more like pressure in a plumbing system, a magic force from the ground." This framing helps players build mental models.

**Why it works:**

- Predictable: players learn the rules and plan around them
- Fast: O(n) worst case for stability recalculation, usually O(log n) with caching
- Tunable: designers control exactly how tall/wide structures can be

**The stability formula:**

```javascript
// Heuristic stability calculation
function calculateStability(piece, graph) {
  // Ground pieces are always 100%
  if (piece.isFoundation && piece.touchesGround) {
    return 1.0;
  }

  // Find supporting pieces
  const supports = graph.getSupports(piece);
  if (supports.length === 0) {
    return 0; // No support = unstable
  }

  // Inherit best supporter's stability minus decay
  let maxSupportStability = 0;
  for (const support of supports) {
    const supportStability =
      support.cachedStability ?? calculateStability(support, graph);
    maxSupportStability = Math.max(maxSupportStability, supportStability);
  }

  // Apply material-specific decay
  const decay = piece.material.stabilityDecay; // e.g., wood: 0.15, stone: 0.10
  return Math.max(0, maxSupportStability - decay);
}
```

### Realistic Style (Medieval Engineers, Space Engineers)

Full physics simulation with stress propagation, material deformation, and dynamic fracture. Every piece has mass, every connection has strength limits.

**Characteristics:**

- Real load distribution through structures
- Material fatigue and breaking points
- Dynamic collapse with pieces falling realistically
- Computationally expensive

**Why it's rare:** The Medieval Engineers developers found players spent more time fighting physics than building. Structures collapsed unexpectedly. The "fun" ceiling was low despite technical impressiveness.

**When to use:** Engineering sandboxes, educational simulations, or games where structural failure IS the gameplay (bridge builders, demolition games).

## Choosing Your Approach

| Factor                | Arcade                        | Heuristic               | Realistic        |
| --------------------- | ----------------------------- | ----------------------- | ---------------- |
| Computation           | O(1) per query                | O(n) worst case         | O(n²) or worse   |
| Player learning curve | Minutes                       | Hours                   | Days             |
| Emergent structures   | Limited                       | Moderate                | High             |
| Frustration potential | Low                           | Medium                  | High             |
| Multiplayer friendly  | Excellent                     | Good                    | Difficult        |
| Best for              | Action games, combat building | Survival, base building | Engineering sims |

**Rule of thumb:** If building happens during combat or time pressure, use arcade. If building is a primary activity players spend hours on, use heuristic. Only use realistic if structural engineering IS your game.

## Implementing Heuristic Physics

### The Support Graph

Model structures as directed graphs where edges represent "supports" relationships.

```javascript
class SupportGraph {
  constructor() {
    this.nodes = new Map(); // pieceId -> piece
    this.supports = new Map(); // pieceId -> Set of pieces this supports
    this.supportedBy = new Map(); // pieceId -> Set of pieces supporting this
  }

  addPiece(piece) {
    this.nodes.set(piece.id, piece);
    this.supports.set(piece.id, new Set());
    this.supportedBy.set(piece.id, new Set());
  }

  addSupport(supporter, supported) {
    this.supports.get(supporter.id).add(supported);
    this.supportedBy.get(supported.id).add(supporter);
  }

  getSupports(piece) {
    return Array.from(this.supportedBy.get(piece.id) || []);
  }

  getSupportedPieces(piece) {
    return Array.from(this.supports.get(piece.id) || []);
  }

  removePiece(piece) {
    // Remove all support relationships
    for (const supported of this.supports.get(piece.id) || []) {
      this.supportedBy.get(supported.id)?.delete(piece);
    }
    for (const supporter of this.supportedBy.get(piece.id) || []) {
      this.supports.get(supporter.id)?.delete(piece);
    }

    this.nodes.delete(piece.id);
    this.supports.delete(piece.id);
    this.supportedBy.delete(piece.id);
  }
}
```

### Stability Propagation

When a piece is destroyed, stability changes ripple upward through dependent pieces.

```javascript
class StabilitySystem {
  constructor(graph) {
    this.graph = graph;
    this.stabilityCache = new Map();
    this.minStability = 0.05; // Below this = collapse
  }

  /**
   * Recalculate stability for affected pieces after destruction
   */
  onPieceDestroyed(piece) {
    const affected = this.getAffectedPieces(piece);
    this.graph.removePiece(piece);

    // Clear cache for affected pieces
    for (const p of affected) {
      this.stabilityCache.delete(p.id);
    }

    // Recalculate and find collapses
    const toCollapse = [];
    for (const p of affected) {
      const stability = this.calculateStability(p);
      if (stability < this.minStability) {
        toCollapse.push(p);
      }
    }

    return toCollapse;
  }

  /**
   * Get all pieces that depend on this piece for support
   */
  getAffectedPieces(piece) {
    const affected = new Set();
    const queue = [piece];

    while (queue.length > 0) {
      const current = queue.shift();
      const supported = this.graph.getSupportedPieces(current);

      for (const p of supported) {
        if (!affected.has(p)) {
          affected.add(p);
          queue.push(p);
        }
      }
    }

    return affected;
  }

  /**
   * Calculate stability with caching
   */
  calculateStability(piece) {
    if (this.stabilityCache.has(piece.id)) {
      return this.stabilityCache.get(piece.id);
    }

    const stability = this._computeStability(piece);
    this.stabilityCache.set(piece.id, stability);
    return stability;
  }

  _computeStability(piece) {
    // Foundations touching ground are 100% stable
    if (piece.type === "foundation" && piece.onGround) {
      return 1.0;
    }

    const supports = this.graph.getSupports(piece);
    if (supports.length === 0) {
      return 0;
    }

    // Find maximum stability from supporters
    let maxStability = 0;
    for (const supporter of supports) {
      const supporterStability = this.calculateStability(supporter);
      maxStability = Math.max(maxStability, supporterStability);
    }

    // Apply decay based on piece type and material
    const decay = this.getDecayRate(piece);
    return Math.max(0, maxStability - decay);
  }

  getDecayRate(piece) {
    // Vertical pieces (walls, pillars) decay less than horizontal (floors, roofs)
    const baseDecay = piece.material?.stabilityDecay ?? 0.1;
    const orientationMultiplier = piece.isVertical ? 0.5 : 1.0;
    return baseDecay * orientationMultiplier;
  }
}
```

### Support Detection

Determining which pieces support which requires geometric analysis.

```javascript
class SupportDetector {
  constructor(options = {}) {
    this.snapTolerance = options.snapTolerance ?? 0.1;
  }

  /**
   * Find all support relationships for a piece
   */
  findSupports(piece, allPieces) {
    const supports = [];

    for (const other of allPieces) {
      if (other === piece) continue;

      if (this.canSupport(other, piece)) {
        supports.push(other);
      }
    }

    return supports;
  }

  /**
   * Check if 'supporter' can support 'piece'
   */
  canSupport(supporter, piece) {
    // Supporter must be below or at same level
    if (supporter.bounds.max.y < piece.bounds.min.y - this.snapTolerance) {
      return false;
    }

    // Must be within snap tolerance vertically
    const verticalGap = piece.bounds.min.y - supporter.bounds.max.y;
    if (verticalGap > this.snapTolerance) {
      return false;
    }

    // Check horizontal overlap
    return this.hasHorizontalOverlap(supporter, piece);
  }

  hasHorizontalOverlap(a, b) {
    const overlapX =
      a.bounds.max.x > b.bounds.min.x && a.bounds.min.x < b.bounds.max.x;
    const overlapZ =
      a.bounds.max.z > b.bounds.min.z && a.bounds.min.z < b.bounds.max.z;
    return overlapX && overlapZ;
  }

  /**
   * Determine support type for visual feedback
   */
  getSupportType(supporter, piece) {
    const centerDist =
      Math.abs(supporter.position.x - piece.position.x) +
      Math.abs(supporter.position.z - piece.position.z);

    if (supporter.type === "foundation" && supporter.onGround) {
      return "ground";
    } else if (supporter.type === "pillar" || supporter.type === "wall") {
      return "vertical";
    } else if (centerDist < 0.5) {
      return "direct"; // Directly above
    } else {
      return "cantilever"; // Offset support
    }
  }
}
```

## Damage and Partial Destruction

Real structures don't collapse all at once. Implement damage states for more interesting gameplay.

### Damage States

```javascript
const DamageState = {
  PRISTINE: "pristine", // Full health
  DAMAGED: "damaged", // Visible damage, reduced stability
  CRITICAL: "critical", // Near collapse, major stability penalty
  DESTROYED: "destroyed", // Gone
};

class DamageableBuilding {
  constructor(piece) {
    this.piece = piece;
    this.maxHealth = piece.material.health;
    this.health = this.maxHealth;
    this.damageState = DamageState.PRISTINE;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateDamageState();
    return this.damageState;
  }

  updateDamageState() {
    const healthPercent = this.health / this.maxHealth;

    if (healthPercent <= 0) {
      this.damageState = DamageState.DESTROYED;
    } else if (healthPercent <= 0.25) {
      this.damageState = DamageState.CRITICAL;
    } else if (healthPercent <= 0.6) {
      this.damageState = DamageState.DAMAGED;
    } else {
      this.damageState = DamageState.PRISTINE;
    }
  }

  getStabilityModifier() {
    switch (this.damageState) {
      case DamageState.PRISTINE:
        return 1.0;
      case DamageState.DAMAGED:
        return 0.8;
      case DamageState.CRITICAL:
        return 0.5;
      default:
        return 0;
    }
  }
}
```

### Cascading Damage

When a piece is destroyed, adjacent pieces may take damage from the collapse.

```javascript
class DamageSystem {
  constructor(stabilitySystem) {
    this.stability = stabilitySystem;
    this.damagePropagation = 0.3; // Collapse does 30% damage to neighbors
  }

  destroyPiece(piece) {
    const results = {
      destroyed: [piece],
      damaged: [],
      collapsed: [],
    };

    // Find pieces that will collapse due to stability loss
    const unstable = this.stability.onPieceDestroyed(piece);

    // Process collapses in order (bottom to top)
    unstable.sort((a, b) => a.position.y - b.position.y);

    for (const p of unstable) {
      results.collapsed.push(p);

      // Propagate damage to neighbors
      const neighbors = this.getAdjacentPieces(p);
      for (const neighbor of neighbors) {
        if (
          !results.destroyed.includes(neighbor) &&
          !results.collapsed.includes(neighbor)
        ) {
          const damage = p.mass * this.damagePropagation;
          const newState = neighbor.takeDamage(damage);

          if (newState === DamageState.DESTROYED) {
            results.destroyed.push(neighbor);
          } else if (newState !== DamageState.PRISTINE) {
            results.damaged.push(neighbor);
          }
        }
      }
    }

    return results;
  }
}
```

## Visual Feedback

Players need to understand stability without studying numbers.

### Stability Visualization (Valheim Style)

Valheim uses color coding: blue/green = strong, yellow = moderate, red = weak.

```javascript
class StabilityVisualizer {
  constructor() {
    this.colors = {
      excellent: new THREE.Color(0x4488ff), // Blue - grounded
      good: new THREE.Color(0x44ff44), // Green - stable
      moderate: new THREE.Color(0xffff44), // Yellow - getting weak
      weak: new THREE.Color(0xff8844), // Orange - danger
      critical: new THREE.Color(0xff4444), // Red - about to collapse
    };
  }

  getStabilityColor(stability) {
    if (stability >= 0.9) return this.colors.excellent;
    if (stability >= 0.7) return this.colors.good;
    if (stability >= 0.5) return this.colors.moderate;
    if (stability >= 0.25) return this.colors.weak;
    return this.colors.critical;
  }

  /**
   * Apply stability coloring to building pieces
   */
  visualizeStability(pieces, stabilitySystem, enabled = true) {
    for (const piece of pieces) {
      if (!enabled) {
        piece.mesh.material.color.setHex(piece.originalColor);
        continue;
      }

      const stability = stabilitySystem.calculateStability(piece);
      const color = this.getStabilityColor(stability);
      piece.mesh.material.color.copy(color);
    }
  }

  /**
   * Create stability indicator UI element
   */
  createStabilityIndicator(piece, stabilitySystem) {
    const stability = stabilitySystem.calculateStability(piece);
    const percent = Math.round(stability * 100);
    const color = this.getStabilityColor(stability);

    return {
      text: `${percent}%`,
      color: `#${color.getHexString()}`,
      position: piece.position.clone().add(new THREE.Vector3(0, 2, 0)),
    };
  }
}
```

### Collapse Animation

Instant disappearance feels wrong. Animate collapses for feedback.

```javascript
class CollapseAnimator {
  constructor(scene) {
    this.scene = scene;
    this.activeCollapses = [];
  }

  /**
   * Animate a piece collapsing
   */
  collapse(piece, delay = 0) {
    const animation = {
      piece,
      startTime: performance.now() + delay,
      duration: 800 + Math.random() * 400,
      startPosition: piece.position.clone(),
      startRotation: piece.rotation.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -5,
        (Math.random() - 0.5) * 2,
      ),
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
      ),
      phase: "waiting",
    };

    this.activeCollapses.push(animation);
    return animation;
  }

  /**
   * Animate multiple pieces with cascading delay
   */
  collapseMultiple(pieces) {
    // Sort by height (top pieces fall last for visual effect)
    pieces.sort((a, b) => b.position.y - a.position.y);

    pieces.forEach((piece, index) => {
      this.collapse(piece, index * 50); // 50ms stagger
    });
  }

  /**
   * Update all active collapse animations
   */
  update(deltaTime) {
    const now = performance.now();
    const gravity = -20;

    for (let i = this.activeCollapses.length - 1; i >= 0; i--) {
      const anim = this.activeCollapses[i];

      if (anim.phase === "waiting") {
        if (now >= anim.startTime) {
          anim.phase = "falling";
          anim.fallStart = now;
        }
        continue;
      }

      const elapsed = now - anim.fallStart;
      const t = Math.min(elapsed / anim.duration, 1);

      // Apply physics
      const piece = anim.piece;
      piece.position.x = anim.startPosition.x + anim.velocity.x * t;
      piece.position.y =
        anim.startPosition.y + anim.velocity.y * t + 0.5 * gravity * t * t;
      piece.position.z = anim.startPosition.z + anim.velocity.z * t;

      piece.rotation.x = anim.startRotation.x + anim.angularVelocity.x * t;
      piece.rotation.y = anim.startRotation.y + anim.angularVelocity.y * t;
      piece.rotation.z = anim.startRotation.z + anim.angularVelocity.z * t;

      // Fade out
      if (piece.mesh.material.opacity !== undefined) {
        piece.mesh.material.transparent = true;
        piece.mesh.material.opacity = 1 - t;
      }

      // Remove when done
      if (t >= 1) {
        this.scene.remove(piece.mesh);
        this.activeCollapses.splice(i, 1);
      }
    }
  }
}
```

## Performance Considerations

### Caching Strategy

Stability calculations can be expensive. Cache aggressively.

```javascript
class CachedStabilitySystem {
  constructor(graph) {
    this.graph = graph;
    this.cache = new Map();
    this.dirty = new Set(); // Pieces needing recalculation
  }

  invalidate(piece) {
    // Mark this piece and all dependent pieces as dirty
    this.dirty.add(piece.id);

    const dependents = this.graph.getAffectedPieces(piece);
    for (const dep of dependents) {
      this.dirty.add(dep.id);
      this.cache.delete(dep.id);
    }
  }

  getStability(piece) {
    if (!this.dirty.has(piece.id) && this.cache.has(piece.id)) {
      return this.cache.get(piece.id);
    }

    const stability = this.calculateStability(piece);
    this.cache.set(piece.id, stability);
    this.dirty.delete(piece.id);
    return stability;
  }

  /**
   * Batch recalculate all dirty pieces
   * Call this once per frame, not per piece
   */
  recalculateDirty() {
    // Sort dirty pieces by support order (bottom to top)
    const sorted = Array.from(this.dirty)
      .map((id) => this.graph.nodes.get(id))
      .filter((p) => p)
      .sort((a, b) => a.position.y - b.position.y);

    for (const piece of sorted) {
      this.getStability(piece);
    }

    this.dirty.clear();
  }
}
```

### Event-Driven Updates

Only recalculate when something changes.

```javascript
class EventDrivenStability {
  constructor() {
    this.listeners = new Set();
  }

  // Called when piece is placed
  onPiecePlaced(piece) {
    this.invalidateAffected(piece);
    this.scheduleRecalculation();
  }

  // Called when piece is destroyed
  onPieceDestroyed(piece) {
    this.invalidateAffected(piece);
    this.scheduleRecalculation();
  }

  // Debounce recalculations
  scheduleRecalculation() {
    if (this.recalcTimer) return;

    this.recalcTimer = requestAnimationFrame(() => {
      this.recalcTimer = null;
      this.recalculateAll();
      this.notifyListeners();
    });
  }
}
```

## Material Properties

Different materials create different building constraints.

```javascript
const Materials = {
  WOOD: {
    name: "Wood",
    health: 100,
    stabilityDecay: 0.15, // Loses 15% per piece
    maxStackHeight: 6, // Can stack ~6 pieces high
    buildTime: 1.0,
    upgradeTo: "STONE",
  },
  STONE: {
    name: "Stone",
    health: 300,
    stabilityDecay: 0.1, // Loses 10% per piece
    maxStackHeight: 10,
    buildTime: 2.0,
    upgradeTo: "METAL",
  },
  METAL: {
    name: "Metal",
    health: 500,
    stabilityDecay: 0.05, // Loses 5% per piece
    maxStackHeight: 20,
    buildTime: 3.0,
    upgradeTo: null,
  },
  THATCH: {
    name: "Thatch",
    health: 50,
    stabilityDecay: 0.2,
    maxStackHeight: 4,
    buildTime: 0.5,
    upgradeTo: "WOOD",
  },
};

// Helper to check if placement is valid
function canPlace(piece, stabilitySystem) {
  const stability = stabilitySystem.calculateStability(piece);
  return stability >= 0.05; // Minimum 5% to place
}
```

## Integration Checklist

When implementing structural physics in your building system:

- [ ] Choose physics approach based on game type (arcade/heuristic/realistic)
- [ ] Implement support graph for tracking piece relationships
- [ ] Add stability calculation with appropriate decay rates
- [ ] Cache stability values and invalidate on changes
- [ ] Implement visual feedback (colors, indicators)
- [ ] Add collapse animations for destroyed pieces
- [ ] Handle cascading damage for connected pieces
- [ ] Tune material properties for desired building limits
- [ ] Test with maximum expected structure sizes
- [ ] Profile stability recalculation performance

## Related References

- `heuristic-validator.js` - Fast arcade/heuristic stability checking
- `stability-optimizer.js` - Caching and batch recalculation
- `damage-propagation.js` - Damage states and cascading destruction
- `physics-engine-lite.js` - Optional realistic physics mode
- `structural-validation.md` - Original structural validation reference
