import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
  BaseStarUniformArgs,
} from "./main-sequence-star";

// Define the type for the second constructor parameter of MainSequenceStarMaterial
type StarMaterialCtorOptions = ConstructorParameters<
  typeof MainSequenceStarMaterial
>[1];

/**
 * Material for K-class stars
 * - Temperature: 3,900–5,300 K
 * - Color: Light orange
 * - Main-sequence mass: 0.45–0.8 M☉
 * - Main-sequence radius: 0.7–0.96 R☉
 * - Main-sequence luminosity: 0.08–0.6 L☉
 * - Hydrogen lines: Very weak
 * - Frequency: 12% of main-sequence stars
 */

/**
 * Renderer for K-class stars
 */
export class ClassKStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a K-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.3,
      pulseSpeed: 0.35,
      glowIntensity: 0.35,
      temperatureVariation: 0.12,
      metallicEffect: 0.7,
      noiseEvolutionSpeed: 0.18,
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
   * K-class stars are orange to red-orange
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassKStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xffdcb0); // Default K-class color (Orange to red-orange)
  }
}
