/**
 * NormalMapGenerator - Generates normal maps from height maps.
 *
 * Uses a Sobel filter to compute surface normals from height differences,
 * producing tangent-space normal maps for lighting calculations.
 *
 * @module texture-generation/generators/NormalMapGenerator
 */

import * as THREE from "three";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type { TextureResolution } from "../types";

// Import shader source
import normalFromHeightShader from "../shaders/normal-from-height.frag.glsl";

/**
 * NormalMapGenerator converts height maps to normal maps.
 */
export class NormalMapGenerator {
  private offscreenRenderer: OffscreenRenderer;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private resolution: TextureResolution;

  /**
   * Creates a new NormalMapGenerator.
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
   * Generates a normal map from a height map.
   *
   * @param heightMapTarget - Height map render target
   * @param normalStrength - Intensity of normal displacement (default: 2.0)
   * @returns WebGLRenderTarget containing the normal map
   */
  generate(
    heightMapTarget: THREE.WebGLRenderTarget,
    normalStrength: number = 2.0,
  ): THREE.WebGLRenderTarget {
    // Create render target if needed
    if (!this.renderTarget) {
      this.renderTarget = this.offscreenRenderer.createRenderTarget(
        this.resolution,
        {
          format: THREE.RGBAFormat,
          type: THREE.UnsignedByteType, // Normal maps don't need float precision
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
      uNormalStrength: { value: normalStrength },
    };

    // Render normal map
    this.offscreenRenderer.renderToTarget(
      normalFromHeightShader,
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
