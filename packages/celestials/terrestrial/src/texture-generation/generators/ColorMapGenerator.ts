/**
 * ColorMapGenerator - Generates color/albedo maps from height maps.
 *
 * Uses the existing Teskooano 5-color palette system to map
 * height values to surface colors with smooth transitions.
 *
 * @module texture-generation/generators/ColorMapGenerator
 */

import * as THREE from "three";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type { TextureResolution } from "../types";

// Import shader source
import colorFromHeightShader from "../shaders/color-from-height.frag.glsl";

/**
 * Color palette configuration for the color map generator.
 */
export interface ColorPaletteConfig {
  /** Color palette (5 colors as hex strings or THREE.Color) */
  colors: [
    string | THREE.Color,
    string | THREE.Color,
    string | THREE.Color,
    string | THREE.Color,
    string | THREE.Color,
  ];
  /** Height thresholds for color transitions (5 values, 0-1) */
  heightThresholds: [number, number, number, number, number];
  /** Optional: How much slope affects color (0-1) */
  slopeColorInfluence?: number;
  /** Optional: Color to blend for steep areas */
  slopeColor?: string | THREE.Color;
}

/**
 * Converts a color to THREE.Color.
 */
function toColor(color: string | THREE.Color): THREE.Color {
  if (color instanceof THREE.Color) {
    return color;
  }
  return new THREE.Color(color);
}

/**
 * ColorMapGenerator creates albedo/diffuse color maps from height maps.
 */
export class ColorMapGenerator {
  private offscreenRenderer: OffscreenRenderer;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private resolution: TextureResolution;

  /**
   * Creates a new ColorMapGenerator.
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
   * Generates a color map from a height map.
   *
   * @param heightMapTarget - Height map render target
   * @param config - Color palette configuration
   * @returns WebGLRenderTarget containing the color map
   */
  generate(
    heightMapTarget: THREE.WebGLRenderTarget,
    config: ColorPaletteConfig,
  ): THREE.WebGLRenderTarget {
    // Create render target if needed
    // Use RGBFormat instead of RGBAFormat to save 25% memory (no alpha channel needed)
    if (!this.renderTarget) {
      this.renderTarget = this.offscreenRenderer.createRenderTarget(
        this.resolution,
        {
          format: THREE.RGBFormat,
          type: THREE.UnsignedByteType,
          minFilter: THREE.LinearMipmapLinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          generateMipmaps: true,
        },
      );
    }

    // Convert colors
    const colors = config.colors.map(toColor);
    const slopeColor = config.slopeColor
      ? toColor(config.slopeColor)
      : new THREE.Color(0.4, 0.35, 0.3); // Default rocky color

    // Set up uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uHeightMap: { value: heightMapTarget.texture },
      uColor1: { value: colors[0] },
      uColor2: { value: colors[1] },
      uColor3: { value: colors[2] },
      uColor4: { value: colors[3] },
      uColor5: { value: colors[4] },
      uHeight1: { value: config.heightThresholds[0] },
      uHeight2: { value: config.heightThresholds[1] },
      uHeight3: { value: config.heightThresholds[2] },
      uHeight4: { value: config.heightThresholds[3] },
      uHeight5: { value: config.heightThresholds[4] },
      uTexelSize: {
        value: new THREE.Vector2(
          1.0 / this.resolution.width,
          1.0 / this.resolution.height,
        ),
      },
      uSlopeColorInfluence: { value: config.slopeColorInfluence ?? 0.0 },
      uSlopeColor: { value: slopeColor },
    };

    // Render color map
    this.offscreenRenderer.renderToTarget(
      colorFromHeightShader,
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
