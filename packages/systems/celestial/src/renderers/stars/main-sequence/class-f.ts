import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Import main sequence shaders as these will be used by Class F stars as well

// Define the type for the second constructor parameter of MainSequenceStarMaterial
type StarMaterialCtorOptions = ConstructorParameters<
  typeof MainSequenceStarMaterial
>[1];

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

    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.45,
      pulseSpeed: 0.48,
      glowIntensity: 0.5,
      temperatureVariation: 0.08,
      metallicEffect: 0.55,
      noiseEvolutionSpeed: 0.14,
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
   * F-class stars are yellowish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xfff4e8); // White for F-class
  }
}
