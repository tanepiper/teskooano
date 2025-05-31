import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused now
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
  BaseStarUniformArgs,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";

// Removed shader imports as MainSequenceStarMaterial handles them
// import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";
// import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";

/**
 * Material for O-class stars
 * - Temperature: ≥ 33,000 K
 * - Color: Blue
 * - Main-sequence mass: ≥ 16 M☉
 * - Main-sequence radius: ≥ 6.6 R☉
 * - Main-sequence luminosity: ≥ 30,000 L☉
 * - Hydrogen lines: Weak
 * - Frequency: 0.00003% of main-sequence stars
 */
// ClassOStarMaterial class removed entirely

/**
 * Renderer for O-class stars
 */
export class ClassOStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for an O-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.8,
      pulseSpeed: 0.8,
      glowIntensity: 0.7,
      temperatureVariation: 0.02,
      metallicEffect: 0.2,
      noiseEvolutionSpeed: 0.03,
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
   * O-class stars are blue
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassOStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0x9bb0ff); // Default O-class color (Blue)
  }
}
