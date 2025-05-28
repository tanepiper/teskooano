import * as THREE from "three";
// import type { CelestialObject } from "@teskooano/data-types"; // This seems unused
import {
  MainSequenceStarMaterial,
  MainSequenceStarRenderer,
} from "./main-sequence-star";
// import { BaseStarMaterial } from "../base/base-star"; // No longer needed
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Import main sequence shaders as these will be used by Class B stars as well

/**
 * Material for B-class stars
 * - Temperature: 10,000–33,000 K
 * - Color: Bluish white
 * - Main-sequence mass: 2.1–16 M☉
 * - Main-sequence radius: 1.8–6.6 R☉
 * - Main-sequence luminosity: 25–30,000 L☉
 * - Hydrogen lines: Medium
 * - Frequency: 0.12% of main-sequence stars
 */

/**
 * Renderer for B-class stars
 */
export class ClassBStarRenderer extends MainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a B-class star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    const color = this.getStarColor(object);
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.6,
      pulseSpeed: 0.7,
      glowIntensity: 0.7,
      temperatureVariation: 0.14,
      metallicEffect: 0.45,
    });
  }

  /**
   * B-class stars are bluish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xaabfff);
  }
}
