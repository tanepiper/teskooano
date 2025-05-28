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
    return new MainSequenceStarMaterial(color, {
      coronaIntensity: 0.4,
      pulseSpeed: 0.45,
      glowIntensity: 0.45,
      temperatureVariation: 0.09,
      metallicEffect: 0.6,
    });
  }

  /**
   * G-class stars are yellow (like our Sun)
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffcc00);
  }
}
