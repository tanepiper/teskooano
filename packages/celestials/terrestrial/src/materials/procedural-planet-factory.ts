/**
 * Factory for creating procedural planet materials based on renderer backend.
 *
 * This factory creates either:
 * - WebGPU materials using TSL (ProceduralPlanetNodeMaterial)
 * - WebGL materials using GLSL (ProceduralPlanetMaterial)
 *
 * @packageDocumentation
 */

import * as THREE from "three";
import { MaterialFactory, MaterialFactoryOptions } from "./MaterialFactory";
import { ProceduralPlanetMaterial } from "./procedural-planet.material";
import { ProceduralPlanetNodeMaterial } from "./procedural-planet-tsl.material";
import type { ProceduralSurfaceProperties } from "../types/procedural";

/**
 * Options for creating a procedural planet material.
 */
export interface ProceduralPlanetMaterialOptions
  extends MaterialFactoryOptions {
  /** Surface properties defining terrain and colors */
  surfaceProps: ProceduralSurfaceProperties;
}

/**
 * Factory for creating procedural planet materials.
 *
 * Automatically selects the appropriate material implementation based on
 * the active renderer backend:
 * - WebGPU → TSL-based NodeMaterial (modern, performant)
 * - WebGL → GLSL-based ShaderMaterial (fallback, compatible)
 *
 * @example
 * ```typescript
 * const factory = new ProceduralPlanetMaterialFactory();
 * const material = factory.createMaterial({
 *   rendererBackend: sceneManager.rendererBackend,
 *   surfaceProps: {
 *     color1: '#003366',
 *     color2: '#4C9341',
 *     terrainAmplitude: 1.0,
 *     roughness: 0.7
 *   }
 * });
 * ```
 */
export class ProceduralPlanetMaterialFactory extends MaterialFactory {
  /**
   * Creates a procedural planet material appropriate for the active renderer.
   *
   * @param options Material creation options including renderer backend and surface properties
   * @returns A Three.js material compatible with the active renderer
   */
  createMaterial(options: ProceduralPlanetMaterialOptions): THREE.Material {
    if (this.isWebGPU(options)) {
      console.log("[ProceduralPlanetFactory] Creating WebGPU material (TSL)");
      return new ProceduralPlanetNodeMaterial(options.surfaceProps);
    } else {
      console.log("[ProceduralPlanetFactory] Creating WebGL material (GLSL)");
      return new ProceduralPlanetMaterial(options.surfaceProps);
    }
  }

  /**
   * Updates an existing material with new surface properties.
   *
   * Note: For significant changes, it's recommended to create a new material
   * rather than updating, as some properties may not be mutable.
   *
   * @param material The material to update
   * @param surfaceProps New surface properties
   */
  updateMaterial(
    material: THREE.Material,
    surfaceProps: Partial<ProceduralSurfaceProperties>,
  ): void {
    if (material instanceof ProceduralPlanetMaterial) {
      // Update GLSL material uniforms
      this.updateGLSLMaterial(material, surfaceProps);
    } else if (material instanceof ProceduralPlanetNodeMaterial) {
      // Update TSL material nodes
      // Note: TSL materials may need to be recreated for some property changes
      console.warn(
        "[ProceduralPlanetFactory] TSL material updates not yet implemented",
      );
    }
  }

  /**
   * Updates a GLSL material's uniforms.
   *
   * @param material The GLSL material to update
   * @param surfaceProps New surface properties
   */
  private updateGLSLMaterial(
    material: ProceduralPlanetMaterial,
    surfaceProps: Partial<ProceduralSurfaceProperties>,
  ): void {
    const uniforms = material.uniforms;

    // Update color uniforms
    if (surfaceProps.color1) uniforms.uColor1.value.set(surfaceProps.color1);
    if (surfaceProps.color2) uniforms.uColor2.value.set(surfaceProps.color2);
    if (surfaceProps.color3) uniforms.uColor3.value.set(surfaceProps.color3);
    if (surfaceProps.color4) uniforms.uColor4.value.set(surfaceProps.color4);
    if (surfaceProps.color5) uniforms.uColor5.value.set(surfaceProps.color5);

    // Update height thresholds
    if (surfaceProps.height1 !== undefined)
      uniforms.uHeight1.value = surfaceProps.height1;
    if (surfaceProps.height2 !== undefined)
      uniforms.uHeight2.value = surfaceProps.height2;
    if (surfaceProps.height3 !== undefined)
      uniforms.uHeight3.value = surfaceProps.height3;
    if (surfaceProps.height4 !== undefined)
      uniforms.uHeight4.value = surfaceProps.height4;
    if (surfaceProps.height5 !== undefined)
      uniforms.uHeight5.value = surfaceProps.height5;

    // Update terrain parameters
    if (surfaceProps.terrainAmplitude !== undefined)
      uniforms.uTerrainAmplitude.value = surfaceProps.terrainAmplitude;
    if (surfaceProps.terrainSharpness !== undefined)
      uniforms.uTerrainSharpness.value = surfaceProps.terrainSharpness;
    if (surfaceProps.terrainOffset !== undefined)
      uniforms.uTerrainOffset.value = surfaceProps.terrainOffset;

    // Update material properties
    if (surfaceProps.roughness !== undefined)
      uniforms.uRoughness.value = surfaceProps.roughness;
    if (surfaceProps.bumpScale !== undefined)
      uniforms.uBumpScale.value = surfaceProps.bumpScale;

    material.needsUpdate = true;
  }
}
