import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused now
import {
  MainSequenceStarRenderer,
  MainSequenceStarMaterial,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Removed shader imports as MainSequenceStarMaterial handles them
// import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";
// import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";

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
    // Instantiate MainSequenceStarMaterial with Class O specific options
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.7,
      pulseSpeed: 0.8,
      glowIntensity: 0.8,
      temperatureVariation: 0.15,
      metallicEffect: 0.4,
    });
  }

  /**
   * O-class stars are blue
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0x9bb0ff);
  }
}
