/**
 * RoughnessMapGenerator - Generates roughness maps from height maps.
 *
 * Derives surface roughness from terrain slope and local variation.
 * Steep, detailed areas get higher roughness values.
 *
 * @module texture-generation/generators/RoughnessMapGenerator
 */

import * as THREE from "three";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type { TextureResolution } from "../types";

// Import shader source
import roughnessFromHeightShader from "../shaders/roughness-from-height.frag.glsl";

/**
 * Configuration for roughness map generation.
 */
export interface RoughnessConfig {
  /** Base roughness level (0-1), default 0.5 */
  baseRoughness: number;
  /** How much slope affects roughness (0-1), default 0.3 */
  slopeInfluence: number;
  /** How much local variation affects roughness (0-1), default 0.2 */
  variationInfluence: number;
}

/**
 * Default roughness configuration.
 */
export const DEFAULT_ROUGHNESS_CONFIG: RoughnessConfig = {
  baseRoughness: 0.5,
  slopeInfluence: 0.3,
  variationInfluence: 0.2,
};

/**
 * RoughnessMapGenerator creates roughness maps from height maps.
 */
export class RoughnessMapGenerator {
  private offscreenRenderer: OffscreenRenderer;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private resolution: TextureResolution;

  /**
   * Creates a new RoughnessMapGenerator.
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
   * Generates a roughness map from a height map.
   *
   * @param heightMapTarget - Height map render target
   * @param config - Roughness generation configuration
   * @returns WebGLRenderTarget containing the roughness map
   */
  generate(
    heightMapTarget: THREE.WebGLRenderTarget,
    config: RoughnessConfig = DEFAULT_ROUGHNESS_CONFIG,
  ): THREE.WebGLRenderTarget {
    // Create render target if needed
    if (!this.renderTarget) {
      this.renderTarget = this.offscreenRenderer.createRenderTarget(
        this.resolution,
        {
          format: THREE.RGBAFormat,
          type: THREE.UnsignedByteType,
          minFilter: THREE.LinearMipmapLinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          generateMipmaps: true,
        },
      );
    }

    // Set up uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uHeightMap: { value: heightMapTarget.texture },
      uTexelSize: {
        value: new THREE.Vector2(
          1.0 / this.resolution.width,
          1.0 / this.resolution.height,
        ),
      },
      uBaseRoughness: { value: config.baseRoughness },
      uSlopeInfluence: { value: config.slopeInfluence },
      uVariationInfluence: { value: config.variationInfluence },
    };

    // Render roughness map
    this.offscreenRenderer.renderToTarget(
      roughnessFromHeightShader,
      uniforms,
      this.renderTarget,
    );

    return this.renderTarget;
  }

  /**
   * Gets the render target.
   */
  getRenderTarget(): THREE.WebGLRenderTarget | null {
    return this.renderTarget;
  }

  /**
   * Creates a detached texture that persists after disposal.
   */
  detachTexture(): THREE.DataTexture | null {
    if (!this.renderTarget) return null;
    return this.offscreenRenderer.detachTexture(this.renderTarget);
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
