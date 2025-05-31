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
 * Material for M-class stars
 * - Temperature: 2,300–3,900 K
 * - Color: Light orangish red
 * - Main-sequence mass: 0.08–0.45 M☉
 * - Main-sequence radius: ≤ 0.7 R☉
 * - Main-sequence luminosity: ≤ 0.08 L☉
 * - Hydrogen lines: Very weak
 * - Frequency: 76% of main-sequence stars (most common)
 */

/**
 * Renderer for M-class stars (Red Dwarfs)
 */
export class ClassMStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for an M-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.2,
      pulseSpeed: 0.25,
      glowIntensity: 0.3,
      temperatureVariation: 0.15,
      metallicEffect: 0.8,
      noiseEvolutionSpeed: 0.2,
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
   * M-class stars are red
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[ClassMStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xffb089); // Default M-class color (Red)
  }
}
