/**
 * Factory for creating procedural planet materials for WebGPU rendering.
 *
 * This factory creates WebGPU materials using TSL (ProceduralPlanetTSLMaterial).
 * WebGL/GLSL materials have been removed in the full WebGPU migration.
 *
 * @packageDocumentation
 */

import { ProceduralPlanetTSLMaterial } from "./procedural-planet-tsl.material";
import type { ProceduralSurfaceProperties } from "../types/procedural";

/**
 * Options for creating a procedural planet material.
 */
export interface ProceduralPlanetMaterialOptions {
  /** Surface properties defining terrain and colors */
  surfaceProps: ProceduralSurfaceProperties;
}

/**
 * Factory for creating procedural planet materials using WebGPU TSL.
 *
 * @example
 * ```typescript
 * const factory = new ProceduralPlanetMaterialFactory();
 * const material = factory.createMaterial({
 *   surfaceProps: {
 *     color1: '#003366',
 *     color2: '#4C9341',
 *     terrainAmplitude: 1.0,
 *     roughness: 0.7
 *   }
 * });
 * ```
 */
export class ProceduralPlanetMaterialFactory {
  /**
   * Creates a procedural planet material using WebGPU TSL.
   *
   * @param options Material creation options including surface properties
   * @returns A WebGPU TSL material
   */
  createMaterial(
    options: ProceduralPlanetMaterialOptions,
  ): ProceduralPlanetTSLMaterial {
    console.log("[ProceduralPlanetFactory] Creating WebGPU TSL material");
    return new ProceduralPlanetTSLMaterial(options.surfaceProps);
  }
}
