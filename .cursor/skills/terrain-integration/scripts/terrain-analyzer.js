/**
 * TerrainAnalyzer - Analyzes terrain for building suitability
 *
 * Provides slope detection, buildability checks, and terrain height sampling
 * for foundation placement systems.
 *
 * Usage:
 *   const analyzer = new TerrainAnalyzer(terrainMesh);
 *   const slope = analyzer.analyzeSlope(position, { radius: 4 });
 *   const buildable = analyzer.isBuildable(position, 4, 30);
 */

import * as THREE from "three";

/**
 * Terrain analysis results
 * @typedef {Object} SlopeAnalysis
 * @property {number} angle - Slope angle in degrees
 * @property {THREE.Vector3} normal - Terrain normal at position
 * @property {number} minHeight - Lowest height in sample area
 * @property {number} maxHeight - Highest height in sample area
 * @property {number} heightDiff - Height variation across area
 * @property {THREE.Vector3} slopeDirection - Direction of steepest slope
 * @property {boolean} canBuild - Whether slope is within buildable limit
 * @property {Array} samples - Raw height samples
 */

/**
 * Buildability check results
 * @typedef {Object} BuildabilityResult
 * @property {boolean} buildable - Whether area is suitable for building
 * @property {number} slope - Calculated slope angle
 * @property {number} heightVariation - Height difference across area
 * @property {number} suggestedHeight - Recommended foundation height
 */

export class TerrainAnalyzer {
  /**
   * Create terrain analyzer
   * @param {THREE.Mesh} terrain - Terrain mesh to analyze
   * @param {Object} options - Configuration options
   */
  constructor(terrain, options = {}) {
    this.terrain = terrain;
    this.sampleResolution = options.sampleResolution ?? 0.5;
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheSize = options.cacheSize ?? 10000;
    this.heightCache = new Map();

    // Raycaster for height queries
    this.raycaster = new THREE.Raycaster();
    this.rayOrigin = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3(0, -1, 0);

    // Optional heightmap for faster queries
    this.heightmap = terrain.userData?.heightmap ?? null;
    this.heightmapResolution = terrain.userData?.heightmapResolution ?? null;
    this.terrainBounds = terrain.userData?.bounds ?? this.computeBounds();
  }

  /**
   * Compute terrain bounding box
   */
  computeBounds() {
    if (!this.terrain.geometry.boundingBox) {
      this.terrain.geometry.computeBoundingBox();
    }
    return this.terrain.geometry.boundingBox.clone();
  }

  /**
   * Get terrain height at position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {number} Height at position
   */
  getHeightAt(x, z) {
    // Check cache first
    if (this.cacheEnabled) {
      const key = this.getCacheKey(x, z);
      if (this.heightCache.has(key)) {
        return this.heightCache.get(key);
      }
    }

    // Try heightmap if available
    let height;
    if (this.heightmap) {
      height = this.sampleHeightmap(x, z);
    } else {
      height = this.raycastHeight(x, z);
    }

    // Cache result
    if (this.cacheEnabled) {
      this.cacheHeight(x, z, height);
    }

    return height;
  }

  /**
   * Generate cache key for position
   */
  getCacheKey(x, z) {
    const precision = 1 / this.sampleResolution;
    return `${Math.round(x * precision)},${Math.round(z * precision)}`;
  }

  /**
   * Cache height value with LRU eviction
   */
  cacheHeight(x, z, height) {
    const key = this.getCacheKey(x, z);

    // Simple LRU: clear half of cache when full
    if (this.heightCache.size >= this.cacheSize) {
      const keysToDelete = Array.from(this.heightCache.keys()).slice(
        0,
        this.cacheSize / 2,
      );
      keysToDelete.forEach((k) => this.heightCache.delete(k));
    }

    this.heightCache.set(key, height);
  }

  /**
   * Sample height from heightmap array
   */
  sampleHeightmap(x, z) {
    if (!this.heightmap || !this.heightmapResolution) {
      return this.raycastHeight(x, z);
    }

    const bounds = this.terrainBounds;
    const res = this.heightmapResolution;

    // Normalize coordinates to heightmap space
    const nx = (x - bounds.min.x) / (bounds.max.x - bounds.min.x);
    const nz = (z - bounds.min.z) / (bounds.max.z - bounds.min.z);

    // Clamp to valid range
    const cx = Math.max(0, Math.min(1, nx));
    const cz = Math.max(0, Math.min(1, nz));

    // Get heightmap indices
    const ix = Math.floor(cx * (res - 1));
    const iz = Math.floor(cz * (res - 1));

    // Bilinear interpolation
    const fx = cx * (res - 1) - ix;
    const fz = cz * (res - 1) - iz;

    const i00 = iz * res + ix;
    const i10 = iz * res + Math.min(ix + 1, res - 1);
    const i01 = Math.min(iz + 1, res - 1) * res + ix;
    const i11 = Math.min(iz + 1, res - 1) * res + Math.min(ix + 1, res - 1);

    const h00 = this.heightmap[i00] ?? 0;
    const h10 = this.heightmap[i10] ?? 0;
    const h01 = this.heightmap[i01] ?? 0;
    const h11 = this.heightmap[i11] ?? 0;

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  /**
   * Get height via raycast (slower but works with any mesh)
   */
  raycastHeight(x, z) {
    this.rayOrigin.set(x, 10000, z);
    this.raycaster.set(this.rayOrigin, this.rayDirection);

    const intersects = this.raycaster.intersectObject(this.terrain, true);

    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    // Fallback: return minimum terrain height
    return this.terrainBounds?.min.y ?? 0;
  }

  /**
   * Analyze slope at a position
   * @param {THREE.Vector3} center - Center point to analyze
   * @param {Object} options - Analysis options
   * @returns {SlopeAnalysis} Slope analysis results
   */
  analyzeSlope(center, options = {}) {
    const radius = options.radius ?? 2;
    const samples = options.samples ?? 8;
    const maxSlope = options.maxSlope ?? 45;

    // Sample heights in a circle
    const heights = [];
    const centerHeight = this.getHeightAt(center.x, center.z);

    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;

      heights.push({
        x,
        z,
        height: this.getHeightAt(x, z),
        angle,
      });
    }

    // Calculate slope metrics
    const minHeight = Math.min(centerHeight, ...heights.map((h) => h.height));
    const maxHeight = Math.max(centerHeight, ...heights.map((h) => h.height));
    const heightDiff = maxHeight - minHeight;

    // Slope angle from height difference over diameter
    const slopeAngle = Math.atan2(heightDiff, radius * 2) * (180 / Math.PI);

    // Calculate normal vector
    const normal = this.calculateNormal(center, heights, radius);

    // Find steepest slope direction
    let maxSlopeValue = 0;
    const slopeDirection = new THREE.Vector3();

    for (const sample of heights) {
      const slope = Math.abs(sample.height - centerHeight) / radius;
      if (slope > maxSlopeValue) {
        maxSlopeValue = slope;
        slopeDirection
          .set(sample.x - center.x, 0, sample.z - center.z)
          .normalize();

        // Point downhill
        if (sample.height < centerHeight) {
          slopeDirection.negate();
        }
      }
    }

    return {
      angle: slopeAngle,
      normal,
      minHeight,
      maxHeight,
      heightDiff,
      centerHeight,
      slopeDirection,
      canBuild: slopeAngle <= maxSlope,
      samples: heights,
    };
  }

  /**
   * Calculate terrain normal at position
   */
  calculateNormal(center, samples, radius) {
    // Find samples at cardinal directions
    const north = this.findClosestSample(samples, 0);
    const east = this.findClosestSample(samples, Math.PI / 2);
    const south = this.findClosestSample(samples, Math.PI);
    const west = this.findClosestSample(samples, Math.PI * 1.5);

    if (!north || !south || !east || !west) {
      return new THREE.Vector3(0, 1, 0);
    }

    // Calculate gradients
    const dx = (east.height - west.height) / (radius * 2);
    const dz = (south.height - north.height) / (radius * 2);

    // Normal from gradients
    const normal = new THREE.Vector3(-dx, 1, -dz).normalize();
    return normal;
  }

  /**
   * Find sample closest to target angle
   */
  findClosestSample(samples, targetAngle) {
    let closest = null;
    let minDiff = Infinity;

    for (const sample of samples) {
      let diff = Math.abs(sample.angle - targetAngle);
      // Handle wrap-around
      diff = Math.min(diff, Math.PI * 2 - diff);

      if (diff < minDiff) {
        minDiff = diff;
        closest = sample;
      }
    }

    return closest;
  }

  /**
   * Check if area is suitable for building
   * @param {THREE.Vector3} center - Center of build area
   * @param {number} size - Size of build area
   * @param {number} maxSlope - Maximum allowed slope in degrees
   * @returns {BuildabilityResult} Buildability assessment
   */
  isBuildable(center, size, maxSlope = 30) {
    const halfSize = size / 2;

    // Sample corners and center
    const points = [
      { x: center.x, z: center.z },
      { x: center.x - halfSize, z: center.z - halfSize },
      { x: center.x + halfSize, z: center.z - halfSize },
      { x: center.x + halfSize, z: center.z + halfSize },
      { x: center.x - halfSize, z: center.z + halfSize },
    ];

    const heights = points.map((p) => this.getHeightAt(p.x, p.z));
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    const heightVariation = maxH - minH;

    // Calculate effective slope from corner to corner
    const diagonal = Math.sqrt(2) * size;
    const slope = Math.atan2(heightVariation, diagonal) * (180 / Math.PI);

    return {
      buildable: slope <= maxSlope,
      slope,
      heightVariation,
      minHeight: minH,
      maxHeight: maxH,
      suggestedHeight: maxH,
      cornerHeights: heights.slice(1), // Exclude center
    };
  }

  /**
   * Find optimal foundation height for position
   * @param {THREE.Vector3} center - Foundation center
   * @param {number} size - Foundation size
   * @returns {number} Recommended foundation height
   */
  findOptimalHeight(center, size) {
    const result = this.isBuildable(center, size);

    if (result.buildable) {
      // Use max corner height to avoid terrain clipping
      return result.maxHeight;
    }

    // For steep slopes, elevate above highest point
    return result.maxHeight + result.heightVariation * 0.25;
  }

  /**
   * Get terrain heights along a line (for walls, fences)
   * @param {THREE.Vector3} start - Start point
   * @param {THREE.Vector3} end - End point
   * @param {number} segments - Number of sample points
   * @returns {Array} Height samples along line
   */
  getHeightsAlongLine(start, end, segments = 10) {
    const samples = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;

      samples.push({
        t,
        x,
        z,
        height: this.getHeightAt(x, z),
      });
    }

    return samples;
  }

  /**
   * Find flat areas within a region (for build suggestions)
   * @param {THREE.Vector3} center - Search center
   * @param {number} searchRadius - Radius to search
   * @param {number} buildSize - Required build area size
   * @param {number} maxSlope - Maximum acceptable slope
   * @returns {Array} List of suitable build locations
   */
  findFlatAreas(center, searchRadius, buildSize, maxSlope = 20) {
    const gridStep = buildSize;
    const candidates = [];

    for (let dx = -searchRadius; dx <= searchRadius; dx += gridStep) {
      for (let dz = -searchRadius; dz <= searchRadius; dz += gridStep) {
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > searchRadius) continue;

        const testPos = new THREE.Vector3(center.x + dx, 0, center.z + dz);

        const result = this.isBuildable(testPos, buildSize, maxSlope);

        if (result.buildable) {
          candidates.push({
            position: testPos,
            slope: result.slope,
            height: result.suggestedHeight,
            distanceFromCenter: distance,
          });
        }
      }
    }

    // Sort by slope (flatter first), then distance
    candidates.sort((a, b) => {
      const slopeDiff = a.slope - b.slope;
      if (Math.abs(slopeDiff) > 1) return slopeDiff;
      return a.distanceFromCenter - b.distanceFromCenter;
    });

    return candidates;
  }

  /**
   * Get terrain type/material at position (if terrain has material data)
   */
  getTerrainType(x, z) {
    if (!this.terrain.userData?.materialMap) {
      return "default";
    }

    // Sample material map similar to heightmap
    const materialMap = this.terrain.userData.materialMap;
    const res =
      this.terrain.userData.materialMapResolution ?? this.heightmapResolution;

    if (!res) return "default";

    const bounds = this.terrainBounds;
    const nx = (x - bounds.min.x) / (bounds.max.x - bounds.min.x);
    const nz = (z - bounds.min.z) / (bounds.max.z - bounds.min.z);

    const ix = Math.floor(Math.max(0, Math.min(1, nx)) * (res - 1));
    const iz = Math.floor(Math.max(0, Math.min(1, nz)) * (res - 1));

    return materialMap[iz * res + ix] ?? "default";
  }

  /**
   * Check if position is on water (if terrain has water data)
   */
  isOnWater(x, z) {
    if (this.terrain.userData?.waterLevel === undefined) {
      return false;
    }

    const height = this.getHeightAt(x, z);
    return height < this.terrain.userData.waterLevel;
  }

  /**
   * Clear height cache
   * Call after terrain modifications
   */
  clearCache() {
    this.heightCache.clear();
  }

  /**
   * Clear cache in a specific region
   * More efficient than full clear for local modifications
   */
  clearCacheRegion(center, radius) {
    const precision = 1 / this.sampleResolution;
    const keysToDelete = [];

    for (const [key, _] of this.heightCache) {
      const [kx, kz] = key.split(",").map(Number);
      const x = kx / precision;
      const z = kz / precision;

      const dist = Math.sqrt(
        Math.pow(x - center.x, 2) + Math.pow(z - center.z, 2),
      );

      if (dist <= radius) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((k) => this.heightCache.delete(k));
  }

  /**
   * Get debug visualization of analyzed area
   */
  createDebugVisualization(center, radius, samples = 16) {
    const analysis = this.analyzeSlope(center, { radius, samples });
    const geometry = new THREE.BufferGeometry();

    // Create points for each sample
    const positions = [];
    const colors = [];

    // Center point
    positions.push(center.x, analysis.centerHeight + 0.1, center.z);
    colors.push(0, 1, 0); // Green for center

    // Sample points
    for (const sample of analysis.samples) {
      positions.push(sample.x, sample.height + 0.1, sample.z);

      // Color by relative height (red = high, blue = low)
      const normalized =
        (sample.height - analysis.minHeight) / (analysis.heightDiff || 1);
      colors.push(normalized, 0, 1 - normalized);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
    });

    return new THREE.Points(geometry, material);
  }
}

export default TerrainAnalyzer;
