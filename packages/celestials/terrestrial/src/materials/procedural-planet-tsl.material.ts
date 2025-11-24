/**
 * TSL-based procedural planet material for WebGPU rendering.
 *
 * This material uses Three.js Shading Language (TSL) to create procedurally
 * generated terrain that works with both WebGL and WebGPU renderers.
 *
 * Based on: https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
 *
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform,
  vec3,
  vec4,
  float,
  color,
  positionLocal,
  normalLocal,
  uv,
  mix,
  add,
  mul,
  sub,
  div,
  mod,
  sin,
  cos,
  dot,
  normalize,
  smoothstep,
  clamp,
} from "three/tsl";
import type { ProceduralSurfaceProperties } from "@teskooano/data-types";

/**
 * WebGPU-compatible procedural planet material using TSL.
 *
 * Features:
 * - Multi-color terrain based on height thresholds
 * - Basic noise-based terrain generation
 * - Physically-based rendering (PBR) via MeshStandardNodeMaterial
 * - Automatic lighting integration
 *
 * Note: MeshStandardNodeMaterial is specifically designed for WebGPU
 * and uses TSL nodes for shader customization.
 *
 * @example
 * ```typescript
 * const material = new ProceduralPlanetNodeMaterial({
 *   color1: '#003366', // Deep ocean
 *   color2: '#4C9341', // Forest
 *   color3: '#836F27', // Mountain
 *   color4: '#A0A0A0', // Rock
 *   color5: '#FFFFFF', // Snow
 *   terrainAmplitude: 1.0,
 *   roughness: 0.7
 * });
 * ```
 */
export class ProceduralPlanetNodeMaterial extends MeshStandardNodeMaterial {
  /**
   * Creates a new TSL-based procedural planet material.
   *
   * @param surfaceProps Surface properties defining colors, terrain, and material characteristics
   */
  constructor(surfaceProps: ProceduralSurfaceProperties) {
    super();

    console.log("[ProceduralPlanetNodeMaterial] Creating WebGPU TSL material");

    // Parse colors with fallbacks
    const parseColor = (
      hex: string | undefined,
      defaultColor: string,
    ): THREE.Color => {
      try {
        return new THREE.Color(hex ?? defaultColor);
      } catch (e) {
        console.warn(
          `Error parsing color ${hex}, using default ${defaultColor}`,
          e,
        );
        return new THREE.Color(defaultColor);
      }
    };

    // Create TSL uniform nodes for colors
    // Note: uniform() takes raw JavaScript values, not wrapped in color()
    const color1Node = uniform(parseColor(surfaceProps.color1, "#5179B5"));
    const color2Node = uniform(parseColor(surfaceProps.color2, "#4C9341"));
    const color3Node = uniform(parseColor(surfaceProps.color3, "#836F27"));
    const color4Node = uniform(parseColor(surfaceProps.color4, "#A0A0A0"));
    const color5Node = uniform(parseColor(surfaceProps.color5, "#FFFFFF"));

    // Create TSL uniform nodes for height thresholds
    // Note: uniform() takes raw numbers, not wrapped in float()
    const height1Node = uniform(surfaceProps.height1 ?? 0.0);
    const height2Node = uniform(surfaceProps.height2 ?? 0.2);
    const height3Node = uniform(surfaceProps.height3 ?? 0.4);
    const height4Node = uniform(surfaceProps.height4 ?? 0.6);
    const height5Node = uniform(surfaceProps.height5 ?? 0.8);

    // Create TSL uniform nodes for terrain parameters
    const terrainAmplitude = uniform(surfaceProps.terrainAmplitude ?? 1.0);
    const terrainSharpness = uniform(surfaceProps.terrainSharpness ?? 1.0);
    const terrainOffset = uniform(surfaceProps.terrainOffset ?? 0.0);
    const octaves = uniform(surfaceProps.octaves ?? 6);
    const persistence = uniform(surfaceProps.persistence ?? 0.5);
    const lacunarity = uniform(surfaceProps.lacunarity ?? 2.0);

    // Create a simple noise-based terrain height function
    // This is a basic implementation - we'll enhance it with proper noise functions later
    const terrainHeightNode = this.createTerrainNode(
      terrainAmplitude,
      terrainSharpness,
      terrainOffset,
      octaves,
      persistence,
      lacunarity,
    );

    // Create color mixing based on terrain height
    // Uses smoothstep for smooth transitions between color bands
    const finalColorNode = this.createColorMixingNode(
      terrainHeightNode,
      color1Node,
      color2Node,
      color3Node,
      color4Node,
      color5Node,
      height1Node,
      height2Node,
      height3Node,
      height4Node,
      height5Node,
    );

    // Assign nodes to material properties
    // MeshStandardNodeMaterial handles lighting automatically
    this.colorNode = finalColorNode;
    this.roughnessNode = uniform(surfaceProps.roughness ?? 0.7);
    this.metalnessNode = uniform(0.0); // Terrestrial planets are not metallic

    // Optional: Add bump mapping based on terrain height
    // this.normalNode = this.createBumpNode(terrainHeightNode, surfaceProps.bumpScale ?? 1.0);
  }

  /**
   * Creates a TSL node for terrain height generation.
   *
   * Uses a simplified noise-like function based on position.
   * TODO: Replace with proper simplex/perlin noise implementation.
   *
   * @param amplitude Terrain height amplitude
   * @param sharpness Terrain feature sharpness
   * @param offset Terrain height offset
   * @param octaves Number of noise octaves
   * @param persistence Octave amplitude falloff
   * @param lacunarity Octave frequency multiplier
   * @returns TSL node representing terrain height (0.0 to 1.0)
   */
  private createTerrainNode(
    amplitude: any,
    sharpness: any,
    offset: any,
    octaves: any,
    persistence: any,
    lacunarity: any,
  ) {
    // Get the local position of the vertex (on the sphere surface)
    const pos = positionLocal;

    // Create simple pseudo-noise using trigonometric functions
    // This is a placeholder - proper noise functions will be added later
    const scaledPos = mul(pos, float(5.0));

    // Use sin/cos to create pseudo-random patterns
    const a = sin(mul(scaledPos.x, float(10.0)));
    const b = cos(mul(scaledPos.y, float(12.0)));
    const c = sin(mul(scaledPos.z, float(8.0)));

    // Combine for pseudo-noise effect
    const noise = mul(add(add(a, b), c), float(0.333));

    // Normalize to 0-1 range
    const baseNoise = add(mul(noise, float(0.5)), float(0.5));

    // Apply amplitude and offset
    const heightValue = add(mul(baseNoise, amplitude), offset);

    // Clamp to 0-1 range
    return clamp(heightValue, float(0.0), float(1.0));
  }

  /**
   * Creates a TSL node for mixing colors based on terrain height.
   *
   * Uses smoothstep for smooth transitions between color bands,
   * creating realistic terrain coloration.
   *
   * @param height Terrain height node (0.0 to 1.0)
   * @param color1-5 Color nodes for different height bands
   * @param height1-5 Height threshold nodes
   * @returns TSL node representing final surface color
   */
  private createColorMixingNode(
    height: any,
    color1: any,
    color2: any,
    color3: any,
    color4: any,
    color5: any,
    height1: any,
    height2: any,
    height3: any,
    height4: any,
    height5: any,
  ) {
    // Create smooth transitions between color bands
    // This creates more realistic terrain than hard cutoffs

    // Calculate mix factors for each color band
    const mix1to2 = smoothstep(height1, height2, height);
    const mix2to3 = smoothstep(height2, height3, height);
    const mix3to4 = smoothstep(height3, height4, height);
    const mix4to5 = smoothstep(height4, height5, height);

    // Mix colors progressively
    const color1to2 = mix(color1, color2, mix1to2);
    const color2to3 = mix(color1to2, color3, mix2to3);
    const color3to4 = mix(color2to3, color4, mix3to4);
    const finalColor = mix(color3to4, color5, mix4to5);

    return finalColor;
  }

  /**
   * Creates a TSL node for bump mapping based on terrain height.
   *
   * TODO: Implement proper normal perturbation for bump mapping.
   *
   * @param height Terrain height node
   * @param bumpScale Scale factor for bump effect
   * @returns TSL node representing perturbed normal
   */
  private createBumpNode(height: any, bumpScale: number) {
    // TODO: Implement bump mapping
    // This requires calculating height derivatives and perturbing the normal
    return normalLocal;
  }
}
