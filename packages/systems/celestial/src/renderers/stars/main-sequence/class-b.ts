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

// Import main sequence shaders as these will be used by Class B stars as well

/**
 * Material for B-class stars
 * - Temperature: 10,000–33,000 K
 * - Color: Bluish white
 * - Main-sequence mass: 2.1–16 M☉
 * - Main-sequence radius: 1.8–6.6 R☉
 * - Main-sequence luminosity: 25–30,000 L☉
 * - Hydrogen lines: Medium
 * - Frequency: 0.12% of main-sequence stars
 */

/**
 * Renderer for B-class stars
 */
export class ClassBStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a B-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.7,
      pulseSpeed: 0.7,
      glowIntensity: 0.6,
      temperatureVariation: 0.03,
      metallicEffect: 0.3,
      noiseEvolutionSpeed: 0.05,
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
   * B-class stars are bluish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassBStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xaabfff); // Default B-class color (Blue-white)
  }
}
