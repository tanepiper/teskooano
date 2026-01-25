/**
 * FoundationPlacer - Handles foundation placement with terrain awareness
 *
 * Supports multiple placement modes inspired by different games:
 * - Valheim: Ground contact required for stability
 * - Rust: Grid-based, terrain mostly ignored
 * - ARK: Flexible with auto-pillar generation
 *
 * Usage:
 *   const placer = new FoundationPlacer({ mode: 'valheim' });
 *   const result = placer.place(foundation, position, terrainAnalyzer);
 */

import * as THREE from "three";

/**
 * Placement modes
 */
export const PlacementMode = {
  VALHEIM: "valheim", // Strict ground contact
  RUST: "rust", // Grid-based, terrain ignored
  ARK: "ark", // Flexible with auto-pillars
  CREATIVE: "creative", // No restrictions
};

/**
 * Placement result
 * @typedef {Object} PlacementResult
 * @property {boolean} valid - Whether placement is allowed
 * @property {string} reason - Rejection reason if invalid
 * @property {number} height - Final placement height
 * @property {number} slope - Terrain slope at location
 * @property {number} stability - Initial stability value
 * @property {boolean} groundContact - Whether foundation touches ground
 * @property {Array} pillars - Auto-generated pillars (ARK mode)
 */

export class FoundationPlacer {
  /**
   * Create foundation placer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.mode = options.mode ?? PlacementMode.VALHEIM;
    this.maxSlope = options.maxSlope ?? 30;
    this.autoLevel = options.autoLevel ?? true;
    this.gridSize = options.gridSize ?? 4;
    this.gridEnabled = options.gridEnabled ?? true;
    this.pillarThreshold = options.pillarThreshold ?? 0.5;
    this.maxPillarHeight = options.maxPillarHeight ?? 10;
    this.contactTolerance = options.contactTolerance ?? 0.15;
    this.buryTolerance = options.buryTolerance ?? 0.5;

    // Validation callbacks
    this.onValidate = options.onValidate ?? null;
    this.onPillarsGenerated = options.onPillarsGenerated ?? null;
  }

  /**
   * Attempt to place a foundation
   * @param {Object} foundation - Foundation piece to place
   * @param {THREE.Vector3} position - Desired position
   * @param {TerrainAnalyzer} analyzer - Terrain analyzer instance
   * @returns {PlacementResult} Placement result
   */
  place(foundation, position, analyzer) {
    // Snap to grid if enabled
    const snapped = this.gridEnabled
      ? this.snapToGrid(position)
      : position.clone();

    // Analyze terrain at placement location
    const foundationSize = foundation.width ?? this.gridSize;
    const slope = analyzer.analyzeSlope(snapped, {
      radius: foundationSize / 2,
      maxSlope: this.maxSlope,
    });

    // Custom validation hook
    if (this.onValidate) {
      const customResult = this.onValidate(foundation, snapped, slope);
      if (customResult && !customResult.valid) {
        return customResult;
      }
    }

    // Check for water
    if (analyzer.isOnWater && analyzer.isOnWater(snapped.x, snapped.z)) {
      if (!foundation.allowWater) {
        return {
          valid: false,
          reason: "Cannot build on water",
          position: snapped,
        };
      }
    }

    // Mode-specific placement logic
    switch (this.mode) {
      case PlacementMode.VALHEIM:
        return this.placeValheim(foundation, snapped, slope, analyzer);
      case PlacementMode.RUST:
        return this.placeRust(foundation, snapped, slope, analyzer);
      case PlacementMode.ARK:
        return this.placeArk(foundation, snapped, slope, analyzer);
      case PlacementMode.CREATIVE:
        return this.placeCreative(foundation, snapped, slope, analyzer);
      default:
        return this.placeValheim(foundation, snapped, slope, analyzer);
    }
  }

  /**
   * Valheim-style placement: Must touch ground for stability
   */
  placeValheim(foundation, position, slope, analyzer) {
    // Check slope limit
    if (!slope.canBuild) {
      return {
        valid: false,
        reason: `Slope too steep (${slope.angle.toFixed(1)}° exceeds ${this.maxSlope}° limit)`,
        slope: slope.angle,
        position,
      };
    }

    // Find height where foundation touches ground
    const contactResult = this.findGroundContactHeight(
      position,
      foundation,
      analyzer,
    );

    if (!contactResult.hasContact) {
      return {
        valid: false,
        reason: "Foundation must touch the ground",
        position,
        slope: slope.angle,
      };
    }

    // Check if foundation would be too buried
    const centerGround = analyzer.getHeightAt(position.x, position.z);
    const buryDepth = centerGround - contactResult.height;

    if (buryDepth > this.buryTolerance) {
      return {
        valid: false,
        reason: `Foundation would be buried (${buryDepth.toFixed(1)}m below center)`,
        position,
        buryDepth,
      };
    }

    // Apply final position
    foundation.position.set(position.x, contactResult.height, position.z);
    foundation.isGrounded = true;

    return {
      valid: true,
      height: contactResult.height,
      slope: slope.angle,
      stability: 1.0,
      groundContact: true,
      contactPoints: contactResult.contactPoints,
      position: foundation.position.clone(),
    };
  }

  /**
   * Rust-style placement: Grid-based, terrain mostly ignored
   */
  placeRust(foundation, position, slope, analyzer) {
    // Rust is more permissive with slopes
    const effectiveMaxSlope = this.maxSlope * 1.5;

    if (slope.angle > effectiveMaxSlope) {
      return {
        valid: false,
        reason: `Slope too steep for foundation`,
        slope: slope.angle,
        position,
      };
    }

    // Get ground height at center only
    const groundHeight = analyzer.getHeightAt(position.x, position.z);

    // Place at ground level or requested height, whichever is higher
    const placementHeight = Math.max(groundHeight, position.y);

    foundation.position.set(position.x, placementHeight, position.z);
    foundation.isGrounded = true;

    // Calculate actual ground contact
    const heightAboveGround = placementHeight - groundHeight;
    const hasContact = heightAboveGround < this.contactTolerance;

    return {
      valid: true,
      height: placementHeight,
      slope: slope.angle,
      stability: 1.0, // Always full stability in Rust mode
      groundContact: hasContact,
      heightAboveGround,
      position: foundation.position.clone(),
    };
  }

  /**
   * ARK-style placement: Flexible with auto-pillars
   */
  placeArk(foundation, position, slope, analyzer) {
    // ARK is very permissive
    const effectiveMaxSlope = this.maxSlope * 2;

    if (slope.angle > effectiveMaxSlope) {
      return {
        valid: false,
        reason: `Slope too extreme for building`,
        slope: slope.angle,
        position,
      };
    }

    const groundHeight = analyzer.getHeightAt(position.x, position.z);
    const gapHeight = position.y - groundHeight;

    // Generate pillars if needed
    let pillars = [];
    if (gapHeight > this.pillarThreshold) {
      if (gapHeight > this.maxPillarHeight) {
        return {
          valid: false,
          reason: `Too high above ground (${gapHeight.toFixed(1)}m exceeds ${this.maxPillarHeight}m limit)`,
          gapHeight,
          position,
        };
      }

      pillars = this.generatePillars(
        position,
        groundHeight,
        position.y,
        foundation,
      );

      if (this.onPillarsGenerated) {
        this.onPillarsGenerated(pillars, foundation);
      }
    }

    foundation.position.copy(position);
    foundation.isGrounded = true;

    return {
      valid: true,
      height: position.y,
      slope: slope.angle,
      stability: 1.0,
      groundContact: gapHeight <= this.pillarThreshold,
      pillars,
      pillarsGenerated: pillars.length,
      resourceCost: this.calculatePillarCost(pillars, foundation.material),
      position: foundation.position.clone(),
    };
  }

  /**
   * Creative mode: No restrictions
   */
  placeCreative(foundation, position, slope, analyzer) {
    foundation.position.copy(position);
    foundation.isGrounded = true;

    return {
      valid: true,
      height: position.y,
      slope: slope.angle,
      stability: 1.0,
      groundContact: false,
      position: foundation.position.clone(),
    };
  }

  /**
   * Find height where foundation corners touch ground
   */
  findGroundContactHeight(center, foundation, analyzer) {
    const corners = this.getFoundationCorners(center, foundation);
    const cornerHeights = corners.map((c) => ({
      position: c,
      groundHeight: analyzer.getHeightAt(c.x, c.z),
    }));

    // Find highest corner ground level
    const maxGroundHeight = Math.max(
      ...cornerHeights.map((c) => c.groundHeight),
    );

    // Count corners that would touch at this height
    const contactPoints = cornerHeights.filter(
      (c) => Math.abs(c.groundHeight - maxGroundHeight) < this.contactTolerance,
    );

    return {
      height: maxGroundHeight,
      hasContact: contactPoints.length >= 1,
      contactPoints: contactPoints.length,
      cornerHeights,
    };
  }

  /**
   * Get corner positions of foundation
   */
  getFoundationCorners(center, foundation) {
    const width = foundation.width ?? this.gridSize;
    const depth = foundation.depth ?? this.gridSize;
    const hw = width / 2;
    const hd = depth / 2;

    // Apply rotation if foundation has one
    const corners = [
      new THREE.Vector3(-hw, 0, -hd),
      new THREE.Vector3(hw, 0, -hd),
      new THREE.Vector3(hw, 0, hd),
      new THREE.Vector3(-hw, 0, hd),
    ];

    if (foundation.rotation) {
      const euler = new THREE.Euler(0, foundation.rotation.y ?? 0, 0);
      corners.forEach((c) => c.applyEuler(euler));
    }

    // Offset to center position
    corners.forEach((c) => c.add(center));

    return corners;
  }

  /**
   * Generate pillar stack for ARK mode
   */
  generatePillars(position, bottomY, topY, foundation) {
    const pillarHeight = 2.0;
    const gap = topY - bottomY;
    const count = Math.ceil(gap / pillarHeight);

    const pillars = [];
    for (let i = 0; i < count; i++) {
      const pillarY = bottomY + i * pillarHeight;
      const isLast = i === count - 1;
      const height = isLast ? topY - pillarY : pillarHeight;

      pillars.push({
        id: `pillar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "pillar",
        position: new THREE.Vector3(position.x, pillarY, position.z),
        height,
        material: foundation.material,
        autoGenerated: true,
        parentFoundation: foundation.id,
      });
    }

    return pillars;
  }

  /**
   * Calculate resource cost for pillars
   */
  calculatePillarCost(pillars, material) {
    const costPerPillar = {
      wood: { wood: 20 },
      stone: { stone: 30, wood: 5 },
      metal: { metal: 10, stone: 10 },
    };

    const materialKey = material?.name?.toLowerCase() ?? "wood";
    const baseCost = costPerPillar[materialKey] ?? costPerPillar.wood;

    const total = {};
    for (const resource of Object.keys(baseCost)) {
      total[resource] = baseCost[resource] * pillars.length;
    }

    return total;
  }

  /**
   * Snap position to building grid
   */
  snapToGrid(position) {
    return new THREE.Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      position.y,
      Math.round(position.z / this.gridSize) * this.gridSize,
    );
  }

  /**
   * Preview placement without committing
   */
  preview(foundation, position, analyzer) {
    // Clone foundation to avoid modifying original
    const previewFoundation = {
      ...foundation,
      id: `preview_${foundation.id}`,
      position: new THREE.Vector3(),
    };

    const result = this.place(previewFoundation, position, analyzer);

    return {
      ...result,
      preview: true,
      previewPosition: previewFoundation.position.clone(),
    };
  }

  /**
   * Get valid placement positions in an area (for build assist)
   */
  findValidPlacements(foundation, center, searchRadius, analyzer) {
    const validPositions = [];
    const step = this.gridSize;

    for (let dx = -searchRadius; dx <= searchRadius; dx += step) {
      for (let dz = -searchRadius; dz <= searchRadius; dz += step) {
        const testPos = new THREE.Vector3(
          center.x + dx,
          center.y,
          center.z + dz,
        );

        const result = this.preview(foundation, testPos, analyzer);

        if (result.valid) {
          validPositions.push({
            position: result.previewPosition,
            slope: result.slope,
            pillarsNeeded: result.pillarsGenerated ?? 0,
          });
        }
      }
    }

    // Sort by slope (flattest first)
    validPositions.sort((a, b) => a.slope - b.slope);

    return validPositions;
  }

  /**
   * Check if foundation can connect to existing structure
   */
  canConnect(newFoundation, existingPieces, snapDistance = 0.5) {
    const newCorners = this.getFoundationCorners(
      newFoundation.position,
      newFoundation,
    );

    for (const existing of existingPieces) {
      if (existing.type !== "foundation") continue;

      const existingCorners = this.getFoundationCorners(
        existing.position,
        existing,
      );

      // Check if any corners are close enough to snap
      for (const nc of newCorners) {
        for (const ec of existingCorners) {
          const distance = nc.distanceTo(ec);
          if (distance < snapDistance) {
            return {
              canConnect: true,
              snapPoint: ec.clone(),
              distance,
            };
          }
        }
      }
    }

    return { canConnect: false };
  }

  /**
   * Update placement mode
   */
  setMode(mode) {
    if (!Object.values(PlacementMode).includes(mode)) {
      throw new Error(`Invalid placement mode: ${mode}`);
    }
    this.mode = mode;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      mode: this.mode,
      maxSlope: this.maxSlope,
      autoLevel: this.autoLevel,
      gridSize: this.gridSize,
      gridEnabled: this.gridEnabled,
      pillarThreshold: this.pillarThreshold,
      maxPillarHeight: this.maxPillarHeight,
      contactTolerance: this.contactTolerance,
    };
  }
}

export default FoundationPlacer;
