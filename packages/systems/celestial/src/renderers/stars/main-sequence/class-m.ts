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

    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.3,
      pulseSpeed: 0.35,
      glowIntensity: 0.3,
      temperatureVariation: 0.05,
      metallicEffect: 0.7,
      noiseEvolutionSpeed: 0.1, // Slower, more gentle animation for red dwarfs
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
   * M-class stars are red
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xff6347); // Red to orange-red for M-class
  }
}
