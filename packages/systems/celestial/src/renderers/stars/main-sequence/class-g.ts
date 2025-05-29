import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
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

// Define the type for the second constructor parameter of MainSequenceStarMaterial
type StarMaterialCtorOptions = ConstructorParameters<
  typeof MainSequenceStarMaterial
>[1];

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

    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.4,
      pulseSpeed: 0.45,
      glowIntensity: 0.45,
      temperatureVariation: 0.09,
      metallicEffect: 0.6,
      noiseEvolutionSpeed: 0.15, // Faster default for G-class
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
      // noiseScale is in CelestialMeshOptions, but not in MainSequenceStarMaterial's constructor options yet.
      // If it were, it would be: if (this.options.noiseScale !== undefined) optsFromMesh.noiseScale = this.options.noiseScale;
    }

    const finalMaterialOptions: StarMaterialCtorOptions = {
      ...classDefaults,
      ...optsFromMesh, // Options from CelestialMeshOptions override class defaults
    };

    return new MainSequenceStarMaterial(color, finalMaterialOptions);
  }

  /**
   * G-class stars are yellow (like our Sun)
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffcc00);
  }
}
