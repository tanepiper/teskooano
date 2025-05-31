import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
  BaseStarUniformArgs,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";

// Import main sequence shaders as these will be used by Class F stars as well

/**
 * Material for F-class stars
 * - Temperature: 6,000–7,300 K
 * - Color: Yellowish white
 * - Main-sequence mass: 1.04–1.4 M☉
 * - Main-sequence radius: 1.15–1.4 R☉
 * - Main-sequence luminosity: 1.5–5 L☉
 * - Hydrogen lines: Medium
 * - Frequency: 3.0% of main-sequence stars
 */

/**
 * Renderer for F-class stars
 */
export class ClassFStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for an F-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.5,
      pulseSpeed: 0.5,
      glowIntensity: 0.4,
      temperatureVariation: 0.07,
      metallicEffect: 0.5,
      noiseEvolutionSpeed: 0.12,
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };

    return new MainSequenceStarMaterial(color, finalMaterialOptions);
  }

  /**
   * F-class stars are yellowish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassFStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xf8f7ff); // Default F-class color (White)
  }
}
