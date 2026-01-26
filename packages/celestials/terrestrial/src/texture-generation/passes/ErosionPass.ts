/**
 * ErosionPass - Particle-based hydraulic erosion simulation.
 *
 * This is Pass 3 of the terrain generation pipeline.
 * Runs on CPU for accurate physical simulation of water erosion,
 * creating realistic river valleys and sediment deposits.
 *
 * Algorithm based on Hans Theobald Beyer's particle-based erosion
 * with thermal erosion additions.
 *
 * @module texture-generation/passes/ErosionPass
 */

import * as THREE from "three";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type { ErosionPassConfig, TextureResolution } from "../types";

/**
 * Simple seeded random number generator.
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  let state = Math.abs(hash) || 1;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * 2D position with floating point coordinates.
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Calculates the gradient at a position using bilinear interpolation.
 */
function calculateGradient(
  heightMap: Float32Array,
  width: number,
  height: number,
  pos: Position,
): { gradX: number; gradY: number; height: number } {
  const x = pos.x;
  const y = pos.y;

  // Get integer coordinates
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);

  // Get fractional parts
  const fx = x - x0;
  const fy = y - y0;

  // Wrap coordinates for spherical mapping
  const x1 = (x0 + 1) % width;
  const y1 = Math.min(y0 + 1, height - 1);

  // Sample four corners
  const h00 = heightMap[y0 * width + x0];
  const h10 = heightMap[y0 * width + x1];
  const h01 = heightMap[y1 * width + x0];
  const h11 = heightMap[y1 * width + x1];

  // Calculate gradients
  const gradX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
  const gradY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;

  // Interpolate height
  const heightValue =
    h00 * (1 - fx) * (1 - fy) +
    h10 * fx * (1 - fy) +
    h01 * (1 - fx) * fy +
    h11 * fx * fy;

  return { gradX, gradY, height: heightValue };
}

/**
 * Deposits sediment at a position with bilinear interpolation.
 */
function depositSediment(
  heightMap: Float32Array,
  width: number,
  height: number,
  pos: Position,
  amount: number,
): void {
  const x = pos.x;
  const y = pos.y;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  const x1 = (x0 + 1) % width;
  const y1 = Math.min(y0 + 1, height - 1);

  // Distribute deposit across four pixels
  heightMap[y0 * width + x0] += amount * (1 - fx) * (1 - fy);
  heightMap[y0 * width + x1] += amount * fx * (1 - fy);
  heightMap[y1 * width + x0] += amount * (1 - fx) * fy;
  heightMap[y1 * width + x1] += amount * fx * fy;
}

/**
 * Erodes terrain at a position using a brush pattern.
 */
function erodeWithBrush(
  heightMap: Float32Array,
  width: number,
  height: number,
  pos: Position,
  amount: number,
  brushRadius: number,
): void {
  const centerX = Math.floor(pos.x);
  const centerY = Math.floor(pos.y);

  let totalWeight = 0;
  const weights: { x: number; y: number; w: number }[] = [];

  // Calculate brush weights
  for (let dy = -brushRadius; dy <= brushRadius; dy++) {
    for (let dx = -brushRadius; dx <= brushRadius; dx++) {
      const px = (centerX + dx + width) % width;
      const py = Math.max(0, Math.min(height - 1, centerY + dy));

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= brushRadius) {
        const weight = 1 - dist / brushRadius;
        weights.push({ x: px, y: py, w: weight });
        totalWeight += weight;
      }
    }
  }

  // Apply erosion with normalized weights
  if (totalWeight > 0) {
    for (const { x, y, w } of weights) {
      heightMap[y * width + x] -= amount * (w / totalWeight);
    }
  }
}

/**
 * Performs hydraulic erosion simulation.
 *
 * @param heightMap - Height map to erode (modified in place)
 * @param width - Map width
 * @param height - Map height
 * @param config - Erosion configuration
 * @param seed - Seed for random number generation
 */
export function hydraulicErosion(
  heightMap: Float32Array,
  width: number,
  height: number,
  config: ErosionPassConfig,
  seed: string,
): void {
  const random = createSeededRandom(seed + "_erosion");

  const {
    iterations,
    sedimentCapacity,
    depositionRate,
    erosionRate,
    evaporationRate,
    gravity,
    inertia,
    minSlope,
    brushRadius,
  } = config;

  // Skip if no iterations
  if (iterations <= 0) return;

  for (let i = 0; i < iterations; i++) {
    // Random starting position (avoiding poles)
    const startX = random() * width;
    const startY = height * 0.1 + random() * (height * 0.8);

    let pos: Position = { x: startX, y: startY };
    let dir: Position = { x: 0, y: 0 };
    let velocity = 1;
    let water = 1;
    let sediment = 0;

    const maxLifetime = 100;

    for (let lifetime = 0; lifetime < maxLifetime; lifetime++) {
      const oldPos = { ...pos };

      // Calculate gradient
      const {
        gradX,
        gradY,
        height: currentHeight,
      } = calculateGradient(heightMap, width, height, pos);

      // Update direction with inertia
      dir.x = dir.x * inertia - gradX * (1 - inertia);
      dir.y = dir.y * inertia - gradY * (1 - inertia);

      // Normalize direction
      const dirLen = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      if (dirLen < 0.0001) {
        // Random direction if stuck
        const angle = random() * Math.PI * 2;
        dir.x = Math.cos(angle);
        dir.y = Math.sin(angle);
      } else {
        dir.x /= dirLen;
        dir.y /= dirLen;
      }

      // Move droplet
      pos.x += dir.x;
      pos.y += dir.y;

      // Wrap X coordinate for spherical mapping
      if (pos.x < 0) pos.x += width;
      if (pos.x >= width) pos.x -= width;

      // Stop at boundaries
      if (pos.y < 0 || pos.y >= height - 1) {
        break;
      }

      // Calculate new height
      const { height: newHeight } = calculateGradient(
        heightMap,
        width,
        height,
        pos,
      );

      const heightDiff = newHeight - currentHeight;

      // Calculate sediment capacity
      const capacity = Math.max(
        -heightDiff * velocity * water * sedimentCapacity,
        minSlope,
      );

      if (sediment > capacity || heightDiff > 0) {
        // Deposit sediment
        const depositAmount =
          heightDiff > 0
            ? Math.min(sediment, heightDiff)
            : (sediment - capacity) * depositionRate;

        sediment -= depositAmount;
        depositSediment(heightMap, width, height, oldPos, depositAmount);
      } else {
        // Erode terrain
        const erodeAmount = Math.min(
          (capacity - sediment) * erosionRate,
          -heightDiff,
        );

        sediment += erodeAmount;
        erodeWithBrush(
          heightMap,
          width,
          height,
          oldPos,
          erodeAmount,
          brushRadius,
        );
      }

      // Update velocity
      velocity = Math.sqrt(
        Math.max(0, velocity * velocity + heightDiff * gravity),
      );

      // Evaporate water
      water *= 1 - evaporationRate;

      // Stop if out of water
      if (water < 0.01) break;
    }
  }
}

/**
 * Performs thermal erosion simulation.
 *
 * Material falls from steep slopes, creating talus deposits.
 *
 * @param heightMap - Height map to erode (modified in place)
 * @param width - Map width
 * @param height - Map height
 * @param config - Erosion configuration
 * @param iterations - Number of thermal erosion iterations
 */
export function thermalErosion(
  heightMap: Float32Array,
  width: number,
  height: number,
  config: ErosionPassConfig,
  iterations: number,
): void {
  const { thermalErosionRate, talusAngle } = config;
  const maxSlope = Math.tan(talusAngle);

  // Temporary buffer for changes
  const changes = new Float32Array(width * height);

  for (let iter = 0; iter < iterations; iter++) {
    changes.fill(0);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const h = heightMap[idx];

        // Check all 8 neighbors
        const neighbors: { idx: number; slope: number }[] = [];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = (x + dx + width) % width;
            const ny = y + dy;

            if (ny < 0 || ny >= height) continue;

            const nidx = ny * width + nx;
            const nh = heightMap[nidx];

            // Calculate slope (accounting for diagonal distance)
            const dist = Math.sqrt(dx * dx + dy * dy);
            const slope = (h - nh) / dist;

            if (slope > maxSlope) {
              neighbors.push({ idx: nidx, slope });
            }
          }
        }

        // Distribute material to steep neighbors
        if (neighbors.length > 0) {
          const totalExcess = neighbors.reduce(
            (sum, n) => sum + (n.slope - maxSlope),
            0,
          );
          const transfer =
            thermalErosionRate * Math.min(totalExcess * 0.5, h * 0.1);

          changes[idx] -= transfer;

          for (const n of neighbors) {
            const weight = (n.slope - maxSlope) / totalExcess;
            changes[n.idx] += transfer * weight;
          }
        }
      }
    }

    // Apply changes
    for (let i = 0; i < heightMap.length; i++) {
      heightMap[i] = Math.max(0, Math.min(1, heightMap[i] + changes[i]));
    }
  }
}

/**
 * ErosionPass applies hydraulic and thermal erosion to the height map.
 */
export class ErosionPass {
  private offscreenRenderer: OffscreenRenderer;
  private resolution: TextureResolution;

  /**
   * Creates a new ErosionPass.
   *
   * @param offscreenRenderer - Shared OffscreenRenderer instance
   * @param resolution - Texture resolution
   */
  constructor(
    offscreenRenderer: OffscreenRenderer,
    resolution: TextureResolution,
  ) {
    this.offscreenRenderer = offscreenRenderer;
    this.resolution = resolution;
  }

  /**
   * Applies erosion to a height map.
   *
   * This operation runs on the CPU and modifies the height map in place.
   *
   * @param inputTarget - Height map from previous pass
   * @param config - Erosion configuration
   * @param seed - Seed for random number generation
   * @returns WebGLRenderTarget containing the eroded height map
   */
  apply(
    inputTarget: THREE.WebGLRenderTarget,
    config: ErosionPassConfig,
    seed: string,
  ): THREE.WebGLRenderTarget {
    const { width, height } = this.resolution;

    // Read height map from GPU
    const heightMap = this.offscreenRenderer.readHeightMap(inputTarget);

    // Apply hydraulic erosion (CPU)
    if (config.iterations > 0) {
      hydraulicErosion(heightMap, width, height, config, seed);
    }

    // Apply thermal erosion (CPU)
    if (config.enableThermalErosion) {
      // Scale thermal iterations based on hydraulic iterations
      const thermalIterations = Math.max(
        1,
        Math.floor(config.iterations * 0.1),
      );
      thermalErosion(heightMap, width, height, config, thermalIterations);
    }

    // Create output texture
    const outputTexture = this.offscreenRenderer.createHeightMapTexture(
      heightMap,
      this.resolution,
    );

    // Create new render target with the eroded data
    const outputTarget = this.offscreenRenderer.createRenderTarget(
      this.resolution,
      {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      },
    );

    // Copy texture data to render target
    // We'll render a simple pass-through shader to copy the data
    const passThroughShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main() {
        gl_FragColor = texture2D(uTexture, vUv);
      }
    `;

    this.offscreenRenderer.renderToTarget(
      passThroughShader,
      { uTexture: { value: outputTexture } },
      outputTarget,
    );

    // Clean up temporary texture
    outputTexture.dispose();

    return outputTarget;
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    // No persistent resources to dispose
  }
}
