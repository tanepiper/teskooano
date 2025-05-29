import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer"; // Added this import

// Unused shader imports can be removed if MainSequenceStarMaterial handles them
// import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";
// import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";

// Define the type for the second constructor parameter of MainSequenceStarMaterial
type StarMaterialCtorOptions = ConstructorParameters<
  typeof MainSequenceStarMaterial
>[1];

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

    const classDefaults: StarMaterialCtorOptions = {
      coronaIntensity: 0.5,
      pulseSpeed: 0.5,
      glowIntensity: 0.6,
      temperatureVariation: 0.1,
      metallicEffect: 0.5,
      noiseEvolutionSpeed: 0.16,
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
   * A-class stars are white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xcadaff); // White to bluish-white for A-class
  }
}
