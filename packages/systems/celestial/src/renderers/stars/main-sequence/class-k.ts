import * as THREE from "three";
import {
  MainSequenceStarRenderer,
  MainSequenceStarMaterial,
} from "./main-sequence-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

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
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.3,
      pulseSpeed: 0.3,
      glowIntensity: 0.35,
      temperatureVariation: 0.07,
      metallicEffect: 0.65,
    });
  }

  /**
   * K-class stars are orange to red-orange
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffaa55);
  }
}
