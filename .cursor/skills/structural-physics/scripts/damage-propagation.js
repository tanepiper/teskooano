/**
 * DamagePropagation - Damage states, cascading destruction, and collapse effects
 *
 * Implements partial damage, structural weakening, and realistic-feeling
 * cascading collapses for building systems.
 *
 * Usage:
 *   const damageSystem = new DamageSystem(validator, optimizer);
 *   damageSystem.applyDamage(piece, 50);
 *   const result = damageSystem.destroyPiece(piece);
 *   damageSystem.update(deltaTime); // Animate collapses
 */

import * as THREE from "three";

/**
 * Damage states for building pieces
 */
export const DamageState = {
  PRISTINE: "pristine", // 100-61% health
  DAMAGED: "damaged", // 60-26% health
  CRITICAL: "critical", // 25-1% health
  DESTROYED: "destroyed", // 0% health
};

/**
 * Damage types with different effects
 */
export const DamageType = {
  PHYSICAL: "physical", // Melee, bullets, projectiles
  EXPLOSIVE: "explosive", // Area damage, splash
  FIRE: "fire", // Over time, spreads
  STRUCTURAL: "structural", // From collapse/cascade
  DECAY: "decay", // Over time degradation
};

/**
 * Material resistance properties
 */
export const MaterialResistance = {
  WOOD: {
    physical: 1.0,
    explosive: 1.2,
    fire: 1.5,
    structural: 1.0,
    decay: 1.2,
  },
  STONE: {
    physical: 0.5,
    explosive: 0.8,
    fire: 0.2,
    structural: 0.7,
    decay: 0.5,
  },
  METAL: {
    physical: 0.3,
    explosive: 0.6,
    fire: 0.1,
    structural: 0.5,
    decay: 0.3,
  },
  THATCH: {
    physical: 1.5,
    explosive: 2.0,
    fire: 3.0,
    structural: 1.5,
    decay: 2.0,
  },
};

/**
 * Damageable wrapper for building pieces
 */
export class DamageablePiece {
  constructor(piece, options = {}) {
    this.piece = piece;
    this.maxHealth = options.maxHealth ?? piece.material?.health ?? 100;
    this.health = this.maxHealth;
    this.damageState = DamageState.PRISTINE;
    this.damageHistory = [];
    this.onFire = false;
    this.fireIntensity = 0;
    this.decayRate = options.decayRate ?? 0;

    // Resistance based on material
    const materialName = piece.material?.name ?? "WOOD";
    this.resistance =
      MaterialResistance[materialName] ?? MaterialResistance.WOOD;
  }

  /**
   * Apply damage with type-specific resistance
   */
  takeDamage(amount, type = DamageType.PHYSICAL, source = null) {
    const resistance = this.resistance[type] ?? 1.0;
    const actualDamage = amount * resistance;

    this.health = Math.max(0, this.health - actualDamage);
    this.updateDamageState();

    // Track damage history
    this.damageHistory.push({
      amount: actualDamage,
      type,
      source,
      timestamp: Date.now(),
      healthAfter: this.health,
    });

    // Fire can spread
    if (
      type === DamageType.FIRE &&
      !this.onFire &&
      this.resistance.fire > 0.5
    ) {
      this.onFire = true;
      this.fireIntensity = 0.3;
    }

    return {
      damageDealt: actualDamage,
      newHealth: this.health,
      newState: this.damageState,
      destroyed: this.damageState === DamageState.DESTROYED,
    };
  }

  /**
   * Heal the piece
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateDamageState();
    return this.health;
  }

  /**
   * Update damage state based on health
   */
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

  /**
   * Get stability modifier based on damage
   */
  getStabilityModifier() {
    switch (this.damageState) {
      case DamageState.PRISTINE:
        return 1.0;
      case DamageState.DAMAGED:
        return 0.85;
      case DamageState.CRITICAL:
        return 0.6;
      default:
        return 0;
    }
  }

  /**
   * Get health percentage
   */
  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  /**
   * Update fires and decay
   */
  update(deltaTime) {
    // Fire damage over time
    if (this.onFire) {
      this.fireIntensity = Math.min(1.0, this.fireIntensity + deltaTime * 0.1);
      const fireDamage = this.fireIntensity * deltaTime * 10;
      this.takeDamage(fireDamage, DamageType.FIRE);

      // Fire burns out on resistant materials
      if (this.resistance.fire < 0.3) {
        this.onFire = false;
        this.fireIntensity = 0;
      }
    }

    // Decay over time
    if (this.decayRate > 0) {
      const decayDamage = this.decayRate * deltaTime;
      this.takeDamage(decayDamage, DamageType.DECAY);
    }

    return this.damageState;
  }
}

/**
 * Collapse animation for destroyed pieces
 */
export class CollapseAnimation {
  constructor(piece, options = {}) {
    this.piece = piece;
    this.mesh = piece.mesh || piece;
    this.startTime = performance.now();
    this.delay = options.delay ?? 0;
    this.duration = options.duration ?? 800 + Math.random() * 400;

    // Initial state
    this.startPosition = this.mesh.position.clone();
    this.startRotation = this.mesh.rotation.clone();
    this.startScale = this.mesh.scale.clone();

    // Physics
    this.velocity =
      options.velocity ??
      new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2 - 1,
        (Math.random() - 0.5) * 3,
      );
    this.angularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
    );
    this.gravity = options.gravity ?? -15;

    // State
    this.phase = "waiting";
    this.progress = 0;
    this.complete = false;
  }

  /**
   * Update animation
   */
  update(deltaTime) {
    const elapsed = performance.now() - this.startTime;

    // Wait for delay
    if (this.phase === "waiting") {
      if (elapsed >= this.delay) {
        this.phase = "falling";
        this.fallStart = performance.now();
      }
      return false;
    }

    // Calculate progress
    const fallElapsed = performance.now() - this.fallStart;
    this.progress = Math.min(fallElapsed / this.duration, 1);
    const t = this.progress;

    // Apply physics
    const dt = t; // Normalized time

    // Position: initial + velocity*t + 0.5*gravity*t^2
    this.mesh.position.x = this.startPosition.x + this.velocity.x * dt * 2;
    this.mesh.position.y =
      this.startPosition.y +
      this.velocity.y * dt * 2 +
      0.5 * this.gravity * dt * dt * 4;
    this.mesh.position.z = this.startPosition.z + this.velocity.z * dt * 2;

    // Rotation
    this.mesh.rotation.x = this.startRotation.x + this.angularVelocity.x * t;
    this.mesh.rotation.y = this.startRotation.y + this.angularVelocity.y * t;
    this.mesh.rotation.z = this.startRotation.z + this.angularVelocity.z * t;

    // Scale down slightly
    const scale = 1 - t * 0.3;
    this.mesh.scale.setScalar(scale);

    // Fade out
    if (this.mesh.material) {
      if (!this.mesh.material.transparent) {
        this.mesh.material = this.mesh.material.clone();
        this.mesh.material.transparent = true;
      }
      this.mesh.material.opacity = 1 - t;
    }

    // Check completion
    if (this.progress >= 1) {
      this.complete = true;
      return true;
    }

    return false;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress() {
    return this.progress;
  }
}

/**
 * Main damage system
 */
export class DamageSystem {
  constructor(validator, optimizer = null, options = {}) {
    this.validator = validator;
    this.optimizer = optimizer;

    // Configuration
    this.cascadeDamagePercent = options.cascadeDamagePercent ?? 0.2; // 20% damage to neighbors
    this.cascadeRadius = options.cascadeRadius ?? 2;
    this.fireSpreadChance = options.fireSpreadChance ?? 0.3;
    this.fireSpreadRadius = options.fireSpreadRadius ?? 3;
    this.collapseDelay = options.collapseDelay ?? 50; // ms between cascade collapses

    // State
    this.damageables = new Map(); // pieceId -> DamageablePiece
    this.activeCollapses = [];
    this.pendingDestructions = [];
    this.scene = options.scene ?? null;

    // Callbacks
    this.onPieceDestroyed = options.onPieceDestroyed ?? null;
    this.onPieceDamaged = options.onPieceDamaged ?? null;
    this.onCollapseComplete = options.onCollapseComplete ?? null;
  }

  /**
   * Register a piece with the damage system
   */
  registerPiece(piece, options = {}) {
    const damageable = new DamageablePiece(piece, options);
    this.damageables.set(piece.id, damageable);
    return damageable;
  }

  /**
   * Unregister a piece
   */
  unregisterPiece(piece) {
    this.damageables.delete(piece.id);
  }

  /**
   * Get damageable for a piece
   */
  getDamageable(piece) {
    return this.damageables.get(piece.id);
  }

  /**
   * Apply damage to a piece
   */
  applyDamage(piece, amount, type = DamageType.PHYSICAL, source = null) {
    const damageable = this.getDamageable(piece);
    if (!damageable) return null;

    const result = damageable.takeDamage(amount, type, source);

    // Notify optimizer of potential stability change
    if (this.optimizer) {
      this.optimizer.queueUpdate(piece);
    }

    // Callback
    if (this.onPieceDamaged) {
      this.onPieceDamaged(piece, result);
    }

    // Handle destruction
    if (result.destroyed) {
      this.destroyPiece(piece, { damageType: type, source });
    }

    return result;
  }

  /**
   * Apply explosive damage in radius
   */
  applyExplosiveDamage(center, radius, baseDamage) {
    const affected = [];

    for (const [id, damageable] of this.damageables) {
      const piece = damageable.piece;
      const distance = piece.position.distanceTo(center);

      if (distance <= radius) {
        // Damage falls off with distance
        const falloff = 1 - distance / radius;
        const damage = baseDamage * falloff * falloff;

        const result = this.applyDamage(
          piece,
          damage,
          DamageType.EXPLOSIVE,
          center,
        );
        affected.push({ piece, result, distance });
      }
    }

    return affected;
  }

  /**
   * Destroy a piece and handle cascading effects
   */
  destroyPiece(piece, options = {}) {
    const damageable = this.getDamageable(piece);

    const result = {
      destroyed: piece,
      collapsed: [],
      damaged: [],
      animations: [],
    };

    // Start collapse animation for destroyed piece
    if (piece.mesh || piece instanceof THREE.Object3D) {
      const anim = new CollapseAnimation(piece, { delay: 0 });
      this.activeCollapses.push(anim);
      result.animations.push(anim);
    }

    // Find structurally unstable pieces
    const unstable = this.validator.removePiece(piece);

    // Queue unstable pieces for collapse with staggered delay
    for (let i = 0; i < unstable.length; i++) {
      const unstablePiece = unstable[i];

      this.pendingDestructions.push({
        piece: unstablePiece,
        delay: (i + 1) * this.collapseDelay,
        timestamp: performance.now(),
        cause: "structural",
      });
    }

    result.collapsed = unstable;

    // Apply cascade damage to neighbors
    const neighbors = this.findNeighbors(piece, this.cascadeRadius);
    for (const neighbor of neighbors) {
      if (neighbor === piece || unstable.includes(neighbor)) continue;

      const cascadeDamage =
        (damageable?.maxHealth ?? 100) * this.cascadeDamagePercent;
      const damageResult = this.applyDamage(
        neighbor,
        cascadeDamage,
        DamageType.STRUCTURAL,
        piece,
      );

      if (damageResult && !damageResult.destroyed) {
        result.damaged.push({ piece: neighbor, damage: cascadeDamage });
      }
    }

    // Spread fire if piece was on fire
    if (damageable?.onFire) {
      this.spreadFire(piece.position);
    }

    // Clean up
    this.unregisterPiece(piece);

    // Callback
    if (this.onPieceDestroyed) {
      this.onPieceDestroyed(piece, result);
    }

    return result;
  }

  /**
   * Find neighboring pieces within radius
   */
  findNeighbors(piece, radius) {
    const neighbors = [];
    const position = piece.position;

    for (const [id, damageable] of this.damageables) {
      if (damageable.piece === piece) continue;

      const dist = damageable.piece.position.distanceTo(position);
      if (dist <= radius) {
        neighbors.push(damageable.piece);
      }
    }

    return neighbors;
  }

  /**
   * Spread fire from a position
   */
  spreadFire(position) {
    const nearby = this.findNeighbors({ position }, this.fireSpreadRadius);

    for (const piece of nearby) {
      const damageable = this.getDamageable(piece);
      if (!damageable || damageable.onFire) continue;

      // Chance to catch fire based on material
      if (Math.random() < this.fireSpreadChance * damageable.resistance.fire) {
        damageable.onFire = true;
        damageable.fireIntensity = 0.2;
      }
    }
  }

  /**
   * Update damage system - call every frame
   */
  update(deltaTime) {
    const now = performance.now();

    // Update damageable pieces (fire, decay)
    for (const [id, damageable] of this.damageables) {
      damageable.update(deltaTime);
    }

    // Process pending destructions
    for (let i = this.pendingDestructions.length - 1; i >= 0; i--) {
      const pending = this.pendingDestructions[i];

      if (now - pending.timestamp >= pending.delay) {
        this.pendingDestructions.splice(i, 1);

        // Create collapse animation
        const piece = pending.piece;
        if (piece.mesh || piece instanceof THREE.Object3D) {
          const anim = new CollapseAnimation(piece, {
            delay: 0,
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              Math.random() * -2,
              (Math.random() - 0.5) * 2,
            ),
          });
          this.activeCollapses.push(anim);
        }

        // Clean up
        this.unregisterPiece(piece);
        this.validator.removePiece(piece);
      }
    }

    // Update collapse animations
    for (let i = this.activeCollapses.length - 1; i >= 0; i--) {
      const anim = this.activeCollapses[i];
      const complete = anim.update(deltaTime);

      if (complete) {
        this.activeCollapses.splice(i, 1);

        // Remove from scene
        if (this.scene && anim.mesh.parent) {
          anim.mesh.parent.remove(anim.mesh);
        }

        // Callback
        if (this.onCollapseComplete) {
          this.onCollapseComplete(anim.piece);
        }
      }
    }
  }

  /**
   * Get all pieces on fire
   */
  getBurningPieces() {
    const burning = [];
    for (const [id, damageable] of this.damageables) {
      if (damageable.onFire) {
        burning.push(damageable.piece);
      }
    }
    return burning;
  }

  /**
   * Extinguish fires in radius
   */
  extinguishFires(position, radius) {
    let extinguished = 0;

    for (const [id, damageable] of this.damageables) {
      if (!damageable.onFire) continue;

      const dist = damageable.piece.position.distanceTo(position);
      if (dist <= radius) {
        damageable.onFire = false;
        damageable.fireIntensity = 0;
        extinguished++;
      }
    }

    return extinguished;
  }

  /**
   * Get damage statistics
   */
  getStats() {
    let totalHealth = 0;
    let totalMaxHealth = 0;
    let damagedCount = 0;
    let criticalCount = 0;
    let burningCount = 0;

    for (const [id, damageable] of this.damageables) {
      totalHealth += damageable.health;
      totalMaxHealth += damageable.maxHealth;

      if (damageable.damageState === DamageState.DAMAGED) damagedCount++;
      if (damageable.damageState === DamageState.CRITICAL) criticalCount++;
      if (damageable.onFire) burningCount++;
    }

    return {
      totalPieces: this.damageables.size,
      healthPercent:
        totalMaxHealth > 0
          ? Math.round((totalHealth / totalMaxHealth) * 100)
          : 0,
      damagedPieces: damagedCount,
      criticalPieces: criticalCount,
      burningPieces: burningCount,
      activeCollapses: this.activeCollapses.length,
      pendingDestructions: this.pendingDestructions.length,
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.damageables.clear();
    this.activeCollapses = [];
    this.pendingDestructions = [];
  }
}

/**
 * Visual effects for damage states
 */
export class DamageVisualizer {
  constructor(options = {}) {
    this.colors = {
      pristine: options.pristineColor ?? null, // Use original color
      damaged: options.damagedColor ?? new THREE.Color(0xaa8866),
      critical: options.criticalColor ?? new THREE.Color(0x884422),
      fire: options.fireColor ?? new THREE.Color(0xff4400),
    };

    this.showCracks = options.showCracks ?? true;
    this.showSmoke = options.showSmoke ?? true;
  }

  /**
   * Update visual appearance based on damage state
   */
  updateVisuals(piece, damageable) {
    const mesh = piece.mesh || piece;
    if (!mesh.material) return;

    // Color based on state
    if (damageable.onFire) {
      this.applyFireEffect(mesh, damageable.fireIntensity);
    } else {
      switch (damageable.damageState) {
        case DamageState.DAMAGED:
          this.applyDamageColor(mesh, this.colors.damaged, 0.3);
          break;
        case DamageState.CRITICAL:
          this.applyDamageColor(mesh, this.colors.critical, 0.6);
          break;
        default:
          this.restoreOriginalColor(mesh);
      }
    }
  }

  applyDamageColor(mesh, color, intensity) {
    if (!mesh._originalColor) {
      mesh._originalColor = mesh.material.color.clone();
    }
    mesh.material.color.copy(mesh._originalColor).lerp(color, intensity);
  }

  applyFireEffect(mesh, intensity) {
    if (!mesh._originalColor) {
      mesh._originalColor = mesh.material.color.clone();
    }

    // Flickering fire effect
    const flicker = 0.8 + Math.random() * 0.2;
    const fireColor = this.colors.fire.clone().multiplyScalar(flicker);
    mesh.material.color
      .copy(mesh._originalColor)
      .lerp(fireColor, intensity * 0.5);

    // Emissive glow
    if (mesh.material.emissive) {
      mesh.material.emissive.copy(fireColor).multiplyScalar(intensity * 0.3);
    }
  }

  restoreOriginalColor(mesh) {
    if (mesh._originalColor) {
      mesh.material.color.copy(mesh._originalColor);
      if (mesh.material.emissive) {
        mesh.material.emissive.setScalar(0);
      }
    }
  }
}

export default DamageSystem;
