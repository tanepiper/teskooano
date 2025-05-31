import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
  BaseStarUniformArgs,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/types"; // Added this import
import type { StarProperties } from "@teskooano/data-types";

// Unused shader imports can be removed if MainSequenceStarMaterial handles them
// import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";
// import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";

/**
 * Material for A-class stars
 * - Temperature: 7,300–10,000 K
 * - Color: White
 * - Main-sequence mass: 1.4–2.1 M☉
 * - Main-sequence radius: 1.4–1.8 R☉
 * - Main-sequence luminosity: 5–25 L☉
 * - Hydrogen lines: Strong
 * - Frequency: 0.61% of main-sequence stars
 */
// export class ClassAStarMaterial extends THREE.ShaderMaterial { ... } // Entire class removed

/**
 * Renderer for A-class stars
 */
export class ClassAStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for an A-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.6,
      pulseSpeed: 0.6,
      glowIntensity: 0.5,
      temperatureVariation: 0.05,
      metallicEffect: 0.4,
      noiseEvolutionSpeed: 0.08,
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
   * A-class stars are white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassAStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xcad7ff); // Default A-class color (Blue-white)
  }
}
