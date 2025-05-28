import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarRenderer,
  MainSequenceStarMaterial,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer"; // Added this import

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
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.5,
      pulseSpeed: 0.6,
      glowIntensity: 0.6,
      temperatureVariation: 0.12,
      metallicEffect: 0.5,
    });
  }

  /**
   * A-class stars are white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8f7ff);
  }
}
