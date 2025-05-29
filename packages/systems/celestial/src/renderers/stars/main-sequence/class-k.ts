import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
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

    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.35,
      pulseSpeed: 0.4,
      glowIntensity: 0.4,
      temperatureVariation: 0.07,
      metallicEffect: 0.65,
      noiseEvolutionSpeed: 0.12,
      timeOffset: Math.random() * 1000.0,
    };

    const optsFromMesh: StarMaterialCtorOptions = {};
    if (this.options) {
      if (this.options.coronaIntensity !== undefined)
        optsFromMesh.coronaIntensity = this.options.coronaIntensity;
      if (this.options.pulseSpeed !== undefined)
        optsFromMesh.pulseSpeed = this.options.pulseSpeed;
      if (this.options.glowIntensity !== undefined)
        optsFromMesh.glowIntensity = this.options.glowIntensity;
      if (this.options.temperatureVariation !== undefined)
        optsFromMesh.temperatureVariation = this.options.temperatureVariation;
      if (this.options.metallicEffect !== undefined)
        optsFromMesh.metallicEffect = this.options.metallicEffect;
      if (this.options.noiseEvolutionSpeed !== undefined)
        optsFromMesh.noiseEvolutionSpeed = this.options.noiseEvolutionSpeed;
      if (this.options.timeOffset !== undefined)
        optsFromMesh.timeOffset = this.options.timeOffset;
    }

    const finalMaterialOptions: StarMaterialCtorOptions = {
      ...classDefaults,
      ...optsFromMesh,
    };

    return new MainSequenceStarMaterial(color, finalMaterialOptions);
  }

  /**
   * K-class stars are orange to red-orange
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffdab9);
  }
}
