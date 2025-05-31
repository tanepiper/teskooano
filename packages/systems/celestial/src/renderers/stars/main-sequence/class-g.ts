import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
  BaseStarUniformArgs,
} from "./main-sequence-star";

/**
 * Material for G-class stars (includes our Sun)
 * - Temperature: 5,300–6,000 K
 * - Color: Yellow
 * - Main-sequence mass: 0.8–1.04 M☉
 * - Main-sequence radius: 0.96–1.15 R☉
 * - Main-sequence luminosity: 0.6–1.5 L☉
 * - Hydrogen lines: Weak
 * - Frequency: 7.6% of main-sequence stars
 */

/**
 * Renderer for G-class stars
 */
export class ClassGStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a G-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    // Defaults specific to G-Class stars
    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.4,
      pulseSpeed: 0.45,
      glowIntensity: 0.45,
      temperatureVariation: 0.09,
      metallicEffect: 0.6,
      noiseEvolutionSpeed: 0.15,
      // timeOffset is better sourced from properties.timeOffset or randomized if not present
    };

    // Shader uniforms from object properties take precedence
    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults, // Apply class-specific defaults first
      ...(propsUniforms || {}), // Override with any defined properties from shaderUniforms.baseStar
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0, // Prioritize properties.timeOffset
    };

    // Options from CelestialMeshOptions (this.options) are no longer used for shader parameters here
    // as they've been removed from CelestialMeshOptions.
    // If there were any general options from CelestialMeshOptions to pass, they would be handled differently.

    return new MainSequenceStarMaterial(color, finalMaterialOptions);
  }

  /**
   * G-class stars are yellow (like our Sun)
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    // If star.properties.color is available, it should take precedence
    // This allows data-driven color overriding the class default.
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassGStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xffcc00); // Default G-class color
  }
}
