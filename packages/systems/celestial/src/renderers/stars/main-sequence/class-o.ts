import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused now
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Removed shader imports as MainSequenceStarMaterial handles them
// import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";
// import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";

// Define the type for the second constructor parameter of MainSequenceStarMaterial
type StarMaterialCtorOptions = ConstructorParameters<
  typeof MainSequenceStarMaterial
>[1];

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

    // Class-specific defaults for O-Class stars (hot, blue, intense)
    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.7,
      pulseSpeed: 0.6,
      glowIntensity: 0.8,
      temperatureVariation: 0.15,
      metallicEffect: 0.4,
      noiseEvolutionSpeed: 0.2, // Faster animation for more dynamic O-type stars
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
   * O-class stars are blue
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0x9bb0ff);
  }
}
