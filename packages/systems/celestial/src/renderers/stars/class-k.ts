import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

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
export class ClassKStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const lightOrangeColor = new THREE.Color(0xffaa55);

    super(lightOrangeColor, {
      coronaIntensity: options.coronaIntensity ?? 0.35,

      pulseSpeed: options.pulseSpeed ?? 0.4,

      glowIntensity: options.glowIntensity ?? 0.4,

      temperatureVariation: options.temperatureVariation ?? 0.08,

      metallicEffect: options.metallicEffect ?? 0.65,
    });
  }
}

/**
 * Renderer for K-class stars
 */
export class ClassKStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a K-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassKStarMaterial();
  }

  /**
   * K-class stars are light orange
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffaa55);
  }
}
