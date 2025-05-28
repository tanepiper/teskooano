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
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.45,
      pulseSpeed: 0.5,
      glowIntensity: 0.5,
      temperatureVariation: 0.1,
      metallicEffect: 0.55,
    });
  }

  /**
   * F-class stars are yellowish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xfff4ea);
  }
}
