/**
 * BaseTerrainPass - Generates base terrain height map using FBM noise.
 *
 * This is Pass 1 of the terrain generation pipeline.
 * Uses GPU-accelerated noise generation with equirectangular projection
 * for seamless spherical mapping.
 *
 * @module texture-generation/passes/BaseTerrainPass
 */

import * as THREE from "three";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type { TerrainGenerationInput, TextureResolution } from "../types";

// Import shader source
import baseTerrainFragShader from "../shaders/base-terrain.frag.glsl";

/**
 * Simple seeded random number generator.
 * Uses a linear congruential generator for deterministic results.
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
 * Generate a seed offset vector from a string seed.
 */
function seedToOffset(seed: string): THREE.Vector3 {
  const random = createSeededRandom(seed);
  return new THREE.Vector3(
    (random() - 0.5) * 1000,
    (random() - 0.5) * 1000,
    (random() - 0.5) * 1000,
  );
}

/**
 * BaseTerrainPass generates the initial height map using FBM noise.
 */
export class BaseTerrainPass {
  private offscreenRenderer: OffscreenRenderer;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private resolution: TextureResolution;

  /**
   * Creates a new BaseTerrainPass.
   *
   * @param offscreenRenderer - Shared OffscreenRenderer instance
   * @param resolution - Output texture resolution
   */
  constructor(
    offscreenRenderer: OffscreenRenderer,
    resolution: TextureResolution,
  ) {
    this.offscreenRenderer = offscreenRenderer;
    this.resolution = resolution;
  }

  /**
   * Generates the base terrain height map.
   *
   * @param input - Terrain generation input parameters
   * @returns WebGLRenderTarget containing the height map
   */
  generate(input: TerrainGenerationInput): THREE.WebGLRenderTarget {
    // Create render target if needed
    if (!this.renderTarget) {
      this.renderTarget = this.offscreenRenderer.createRenderTarget(
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
    }

    // Generate seed offset from seed string
    const seedOffset = seedToOffset(input.seed);

    // Set up uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uTerrainType: { value: input.terrainType },
      uTerrainAmplitude: { value: input.terrainAmplitude },
      uTerrainSharpness: { value: input.terrainSharpness },
      uTerrainOffset: { value: input.terrainOffset },
      uPersistence: { value: input.persistence },
      uLacunarity: { value: input.lacunarity },
      uSimplePeriod: { value: input.simplePeriod },
      uOctaves: { value: input.octaves },
      uUndulation: { value: input.undulation },
      uSeedOffset: { value: seedOffset },
    };

    // Render terrain to target
    this.offscreenRenderer.renderToTarget(
      baseTerrainFragShader,
      uniforms,
      this.renderTarget,
    );

    return this.renderTarget;
  }

  /**
   * Gets the generated height map as a Float32Array.
   *
   * @returns Height map data (single channel, values 0-1)
   */
  getHeightMapData(): Float32Array | null {
    if (!this.renderTarget) return null;
    return this.offscreenRenderer.readHeightMap(this.renderTarget);
  }

  /**
   * Gets the render target.
   */
  getRenderTarget(): THREE.WebGLRenderTarget | null {
    return this.renderTarget;
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
  }
}
