/**
 * PhysicsEngineLite - Simplified realistic structural physics
 *
 * Provides optional realistic physics simulation for building systems.
 * More computationally expensive than heuristic validation but creates
 * more emergent and realistic structural behavior.
 *
 * Best for: Engineering sandboxes, bridge builders, educational simulations
 * NOT recommended for: Action games, real-time combat building
 *
 * Usage:
 *   const physics = new PhysicsEngineLite();
 *   physics.addPiece(piece);
 *   physics.simulate(deltaTime);
 *   const stressed = physics.getOverstressedPieces();
 */

import * as THREE from "three";

/**
 * Material physical properties
 */
export const PhysicalMaterials = {
  WOOD: {
    name: "Wood",
    density: 600, // kg/m³
    tensileStrength: 40, // MPa (along grain)
    compressiveStrength: 30, // MPa
    shearStrength: 8, // MPa
    elasticity: 12000, // MPa (Young's modulus)
    failureStrain: 0.01, // 1% strain to failure
  },
  STONE: {
    name: "Stone",
    density: 2500,
    tensileStrength: 5, // Stone is weak in tension
    compressiveStrength: 100,
    shearStrength: 15,
    elasticity: 50000,
    failureStrain: 0.002,
  },
  METAL: {
    name: "Metal",
    density: 7800,
    tensileStrength: 400,
    compressiveStrength: 400,
    shearStrength: 250,
    elasticity: 200000,
    failureStrain: 0.02,
  },
  CONCRETE: {
    name: "Concrete",
    density: 2400,
    tensileStrength: 3,
    compressiveStrength: 30,
    shearStrength: 5,
    elasticity: 30000,
    failureStrain: 0.003,
  },
};

/**
 * Force types
 */
export const ForceType = {
  GRAVITY: "gravity",
  LOAD: "load", // Applied loads (players, objects)
  WIND: "wind",
  SUPPORT: "support", // Reaction forces
  INTERNAL: "internal", // Internal stress
};

/**
 * Connection between pieces
 */
export class StructuralConnection {
  constructor(pieceA, pieceB, options = {}) {
    this.pieceA = pieceA;
    this.pieceB = pieceB;
    this.type = options.type ?? "rigid"; // rigid, pin, roller

    // Connection point (world space)
    this.point =
      options.point ??
      new THREE.Vector3()
        .addVectors(pieceA.position, pieceB.position)
        .multiplyScalar(0.5);

    // Strength
    this.maxTension = options.maxTension ?? 10000; // N
    this.maxCompression = options.maxCompression ?? 10000;
    this.maxShear = options.maxShear ?? 5000;

    // Current state
    this.tension = 0;
    this.compression = 0;
    this.shear = 0;
    this.failed = false;
    this.strain = 0;
  }

  /**
   * Calculate stress ratio (0 = no stress, 1 = at limit)
   */
  getStressRatio() {
    const tensionRatio = this.tension / this.maxTension;
    const compressionRatio = this.compression / this.maxCompression;
    const shearRatio = this.shear / this.maxShear;
    return Math.max(tensionRatio, compressionRatio, shearRatio);
  }

  /**
   * Check if connection should fail
   */
  checkFailure() {
    if (this.failed) return true;

    if (
      this.tension > this.maxTension ||
      this.compression > this.maxCompression ||
      this.shear > this.maxShear
    ) {
      this.failed = true;
      return true;
    }
    return false;
  }

  /**
   * Reset forces for new simulation step
   */
  reset() {
    this.tension = 0;
    this.compression = 0;
    this.shear = 0;
  }
}

/**
 * Physical piece representation
 */
export class PhysicalPiece {
  constructor(piece, material = PhysicalMaterials.WOOD) {
    this.piece = piece;
    this.material = material;
    this.id = piece.id;

    // Geometry
    this.position = piece.position.clone();
    this.size = piece.size?.clone() ?? new THREE.Vector3(1, 1, 1);
    this.rotation = piece.rotation?.clone() ?? new THREE.Euler();

    // Physical properties
    this.volume = this.size.x * this.size.y * this.size.z;
    this.mass = this.volume * material.density;
    this.centerOfMass = this.position.clone();

    // Cross-sectional properties (simplified)
    this.crossSectionArea = this.size.x * this.size.z;
    this.momentOfInertia = (this.size.x * Math.pow(this.size.y, 3)) / 12;

    // Constraints
    this.isFixed = piece.isGrounded ?? false;
    this.fixedAxes = { x: false, y: this.isFixed, z: false };

    // Forces and state
    this.forces = [];
    this.netForce = new THREE.Vector3();
    this.stress = { tension: 0, compression: 0, shear: 0 };
    this.strain = 0;
    this.displacement = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    // Connections
    this.connections = [];

    // Failure state
    this.failed = false;
    this.failureType = null;
  }

  /**
   * Apply a force to the piece
   */
  applyForce(force, type = ForceType.LOAD, point = null) {
    this.forces.push({
      vector: force.clone(),
      type,
      point: point?.clone() ?? this.centerOfMass.clone(),
    });
  }

  /**
   * Calculate net force on piece
   */
  calculateNetForce() {
    this.netForce.set(0, 0, 0);

    for (const force of this.forces) {
      this.netForce.add(force.vector);
    }

    return this.netForce;
  }

  /**
   * Calculate internal stress
   */
  calculateStress() {
    const force = this.netForce.length();

    // Simplified stress calculation (axial)
    const axialStress = force / this.crossSectionArea;

    // Determine if tension or compression based on force direction
    if (this.netForce.y > 0) {
      this.stress.tension = axialStress;
      this.stress.compression = 0;
    } else {
      this.stress.compression = axialStress;
      this.stress.tension = 0;
    }

    // Shear from horizontal forces
    const horizontalForce = Math.sqrt(
      this.netForce.x * this.netForce.x + this.netForce.z * this.netForce.z,
    );
    this.stress.shear = horizontalForce / this.crossSectionArea;

    return this.stress;
  }

  /**
   * Calculate strain from stress
   */
  calculateStrain() {
    const maxStress = Math.max(
      this.stress.tension,
      this.stress.compression,
      this.stress.shear,
    );

    // Hooke's law: strain = stress / E
    this.strain = maxStress / (this.material.elasticity * 1e6);
    return this.strain;
  }

  /**
   * Check for structural failure
   */
  checkFailure() {
    if (this.failed) return true;

    // Check against material limits
    const tensionLimit = this.material.tensileStrength * 1e6;
    const compressionLimit = this.material.compressiveStrength * 1e6;
    const shearLimit = this.material.shearStrength * 1e6;

    if (this.stress.tension > tensionLimit) {
      this.failed = true;
      this.failureType = "tension";
      return true;
    }

    if (this.stress.compression > compressionLimit) {
      this.failed = true;
      this.failureType = "compression";
      return true;
    }

    if (this.stress.shear > shearLimit) {
      this.failed = true;
      this.failureType = "shear";
      return true;
    }

    // Check strain limit
    if (this.strain > this.material.failureStrain) {
      this.failed = true;
      this.failureType = "strain";
      return true;
    }

    return false;
  }

  /**
   * Get safety factor (strength / current stress)
   */
  getSafetyFactor() {
    const tensionSF =
      this.stress.tension > 0
        ? (this.material.tensileStrength * 1e6) / this.stress.tension
        : Infinity;
    const compressionSF =
      this.stress.compression > 0
        ? (this.material.compressiveStrength * 1e6) / this.stress.compression
        : Infinity;
    const shearSF =
      this.stress.shear > 0
        ? (this.material.shearStrength * 1e6) / this.stress.shear
        : Infinity;

    return Math.min(tensionSF, compressionSF, shearSF);
  }

  /**
   * Reset forces for new simulation step
   */
  resetForces() {
    this.forces = [];
    this.netForce.set(0, 0, 0);
  }
}

/**
 * Main physics engine
 */
export class PhysicsEngineLite {
  constructor(options = {}) {
    this.gravity = options.gravity ?? -9.81;
    this.windForce = options.windForce ?? new THREE.Vector3();
    this.damping = options.damping ?? 0.98;
    this.maxIterations = options.maxIterations ?? 10;
    this.convergenceThreshold = options.convergenceThreshold ?? 0.001;

    // State
    this.pieces = new Map();
    this.connections = [];
    this.groundLevel = options.groundLevel ?? 0;

    // Simulation settings
    this.timeScale = options.timeScale ?? 1;
    this.substeps = options.substeps ?? 4;

    // Callbacks
    this.onPieceFailed = options.onPieceFailed ?? null;
    this.onConnectionFailed = options.onConnectionFailed ?? null;
  }

  /**
   * Add a piece to the simulation
   */
  addPiece(piece, material = PhysicalMaterials.WOOD) {
    const physicalPiece = new PhysicalPiece(piece, material);
    this.pieces.set(piece.id, physicalPiece);
    return physicalPiece;
  }

  /**
   * Remove a piece from simulation
   */
  removePiece(piece) {
    const id = piece.id ?? piece;

    // Remove connections
    this.connections = this.connections.filter(
      (conn) => conn.pieceA.id !== id && conn.pieceB.id !== id,
    );

    this.pieces.delete(id);
  }

  /**
   * Create connection between pieces
   */
  connect(pieceA, pieceB, options = {}) {
    const physA = this.pieces.get(pieceA.id ?? pieceA);
    const physB = this.pieces.get(pieceB.id ?? pieceB);

    if (!physA || !physB) return null;

    const connection = new StructuralConnection(physA, physB, options);
    this.connections.push(connection);

    physA.connections.push(connection);
    physB.connections.push(connection);

    return connection;
  }

  /**
   * Auto-detect and create connections between nearby pieces
   */
  autoConnect(tolerance = 0.2) {
    const piecesArray = Array.from(this.pieces.values());

    for (let i = 0; i < piecesArray.length; i++) {
      for (let j = i + 1; j < piecesArray.length; j++) {
        const a = piecesArray[i];
        const b = piecesArray[j];

        // Check if pieces are close enough
        const dist = a.position.distanceTo(b.position);
        const maxDist = (a.size.length() + b.size.length()) / 2 + tolerance;

        if (dist < maxDist) {
          // Check if not already connected
          const existing = this.connections.find(
            (c) =>
              (c.pieceA === a && c.pieceB === b) ||
              (c.pieceA === b && c.pieceB === a),
          );

          if (!existing) {
            this.connect(a.piece, b.piece);
          }
        }
      }
    }
  }

  /**
   * Run one simulation step
   */
  simulate(deltaTime) {
    const dt = (deltaTime * this.timeScale) / this.substeps;

    for (let step = 0; step < this.substeps; step++) {
      // Reset forces
      for (const piece of this.pieces.values()) {
        piece.resetForces();
      }

      for (const conn of this.connections) {
        conn.reset();
      }

      // Apply gravity
      this.applyGravity();

      // Apply wind
      if (this.windForce.lengthSq() > 0) {
        this.applyWind();
      }

      // Solve constraints (iterative)
      this.solveConstraints();

      // Calculate stresses
      this.calculateStresses();

      // Check for failures
      this.checkFailures();

      // Update positions (for dynamic simulation)
      this.updatePositions(dt);
    }
  }

  /**
   * Apply gravity to all pieces
   */
  applyGravity() {
    for (const piece of this.pieces.values()) {
      if (piece.isFixed) continue;

      const gravityForce = new THREE.Vector3(0, piece.mass * this.gravity, 0);
      piece.applyForce(gravityForce, ForceType.GRAVITY);
    }
  }

  /**
   * Apply wind force
   */
  applyWind() {
    for (const piece of this.pieces.values()) {
      // Wind force proportional to exposed area
      const area = piece.size.x * piece.size.y;
      const force = this.windForce.clone().multiplyScalar(area);
      piece.applyForce(force, ForceType.WIND);
    }
  }

  /**
   * Solve structural constraints iteratively
   */
  solveConstraints() {
    for (let iter = 0; iter < this.maxIterations; iter++) {
      let maxError = 0;

      // Process connections
      for (const conn of this.connections) {
        if (conn.failed) continue;

        const a = conn.pieceA;
        const b = conn.pieceB;

        // Calculate relative displacement
        const relPos = new THREE.Vector3().subVectors(b.position, a.position);
        const restLength =
          a.position.distanceTo(conn.point) + b.position.distanceTo(conn.point);
        const currentLength = relPos.length();

        // Calculate error
        const error = currentLength - restLength;
        maxError = Math.max(maxError, Math.abs(error));

        if (Math.abs(error) < this.convergenceThreshold) continue;

        // Calculate correction forces
        const direction = relPos.normalize();
        const stiffness =
          (a.material.elasticity + b.material.elasticity) * 0.5 * 1e6;
        const force = error * stiffness * 0.01;

        // Distribute force based on mass
        const totalMass = a.mass + b.mass;
        const aRatio = a.isFixed ? 0 : b.mass / totalMass;
        const bRatio = b.isFixed ? 0 : a.mass / totalMass;

        // Apply forces
        if (!a.isFixed) {
          a.applyForce(
            direction.clone().multiplyScalar(force * aRatio),
            ForceType.INTERNAL,
          );
        }
        if (!b.isFixed) {
          b.applyForce(
            direction.clone().multiplyScalar(-force * bRatio),
            ForceType.INTERNAL,
          );
        }

        // Record connection stress
        if (force > 0) {
          conn.tension = Math.abs(force);
        } else {
          conn.compression = Math.abs(force);
        }
      }

      // Check convergence
      if (maxError < this.convergenceThreshold) break;
    }
  }

  /**
   * Calculate stress in all pieces
   */
  calculateStresses() {
    for (const piece of this.pieces.values()) {
      piece.calculateNetForce();
      piece.calculateStress();
      piece.calculateStrain();
    }
  }

  /**
   * Check for structural failures
   */
  checkFailures() {
    const failures = {
      pieces: [],
      connections: [],
    };

    // Check piece failures
    for (const piece of this.pieces.values()) {
      if (!piece.failed && piece.checkFailure()) {
        failures.pieces.push(piece);

        if (this.onPieceFailed) {
          this.onPieceFailed(piece);
        }
      }
    }

    // Check connection failures
    for (const conn of this.connections) {
      if (!conn.failed && conn.checkFailure()) {
        failures.connections.push(conn);

        if (this.onConnectionFailed) {
          this.onConnectionFailed(conn);
        }
      }
    }

    return failures;
  }

  /**
   * Update positions based on forces (for dynamic simulation)
   */
  updatePositions(dt) {
    for (const piece of this.pieces.values()) {
      if (piece.isFixed || piece.failed) continue;

      // Simple Euler integration
      const acceleration = piece.netForce.clone().divideScalar(piece.mass);
      piece.velocity.add(acceleration.multiplyScalar(dt));
      piece.velocity.multiplyScalar(this.damping);

      const displacement = piece.velocity.clone().multiplyScalar(dt);
      piece.displacement.add(displacement);

      // Clamp to ground
      if (piece.position.y + piece.displacement.y < this.groundLevel) {
        piece.displacement.y = this.groundLevel - piece.position.y;
        piece.velocity.y = 0;
      }
    }
  }

  /**
   * Get pieces under high stress
   */
  getOverstressedPieces(threshold = 0.8) {
    const overstressed = [];

    for (const piece of this.pieces.values()) {
      const sf = piece.getSafetyFactor();
      if (sf < 1 / threshold) {
        // Safety factor below 1.25
        overstressed.push({
          piece,
          safetyFactor: sf,
          failureType: this.getPrimaryStressType(piece),
        });
      }
    }

    return overstressed.sort((a, b) => a.safetyFactor - b.safetyFactor);
  }

  /**
   * Get primary stress type for a piece
   */
  getPrimaryStressType(piece) {
    const { tension, compression, shear } = piece.stress;
    if (tension >= compression && tension >= shear) return "tension";
    if (compression >= tension && compression >= shear) return "compression";
    return "shear";
  }

  /**
   * Get total structure weight
   */
  getTotalWeight() {
    let total = 0;
    for (const piece of this.pieces.values()) {
      total += piece.mass;
    }
    return total;
  }

  /**
   * Get structure center of mass
   */
  getCenterOfMass() {
    const com = new THREE.Vector3();
    let totalMass = 0;

    for (const piece of this.pieces.values()) {
      com.addScaledVector(piece.centerOfMass, piece.mass);
      totalMass += piece.mass;
    }

    if (totalMass > 0) {
      com.divideScalar(totalMass);
    }

    return com;
  }

  /**
   * Get simulation statistics
   */
  getStats() {
    let minSF = Infinity;
    let maxStrain = 0;
    let failedPieces = 0;
    let failedConnections = 0;

    for (const piece of this.pieces.values()) {
      minSF = Math.min(minSF, piece.getSafetyFactor());
      maxStrain = Math.max(maxStrain, piece.strain);
      if (piece.failed) failedPieces++;
    }

    for (const conn of this.connections) {
      if (conn.failed) failedConnections++;
    }

    return {
      pieceCount: this.pieces.size,
      connectionCount: this.connections.length,
      totalWeight: this.getTotalWeight(),
      minSafetyFactor: minSF === Infinity ? 0 : minSF,
      maxStrain: maxStrain,
      failedPieces,
      failedConnections,
      isStable: failedPieces === 0 && failedConnections === 0 && minSF > 1,
    };
  }

  /**
   * Clear simulation
   */
  clear() {
    this.pieces.clear();
    this.connections = [];
  }
}

/**
 * Stress visualization helper
 */
export class StressVisualizer {
  constructor(options = {}) {
    this.lowStressColor = options.lowStressColor ?? new THREE.Color(0x00ff00);
    this.midStressColor = options.midStressColor ?? new THREE.Color(0xffff00);
    this.highStressColor = options.highStressColor ?? new THREE.Color(0xff0000);
  }

  /**
   * Get color for stress level
   */
  getStressColor(safetyFactor) {
    const color = new THREE.Color();

    if (safetyFactor >= 3) {
      color.copy(this.lowStressColor);
    } else if (safetyFactor >= 1.5) {
      const t = (safetyFactor - 1.5) / 1.5;
      color.copy(this.midStressColor).lerp(this.lowStressColor, t);
    } else if (safetyFactor >= 1) {
      const t = (safetyFactor - 1) / 0.5;
      color.copy(this.highStressColor).lerp(this.midStressColor, t);
    } else {
      color.copy(this.highStressColor);
    }

    return color;
  }

  /**
   * Apply stress visualization to pieces
   */
  visualize(physicsEngine, enabled = true) {
    for (const piece of physicsEngine.pieces.values()) {
      const mesh = piece.piece.mesh || piece.piece;
      if (!mesh.material) continue;

      if (!enabled) {
        if (mesh._originalColor) {
          mesh.material.color.copy(mesh._originalColor);
        }
        continue;
      }

      if (!mesh._originalColor) {
        mesh._originalColor = mesh.material.color.clone();
      }

      const sf = piece.getSafetyFactor();
      const color = this.getStressColor(sf);
      mesh.material.color.copy(color);
    }
  }
}

export default PhysicsEngineLite;
