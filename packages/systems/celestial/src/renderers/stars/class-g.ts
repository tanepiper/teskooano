import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

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
export class ClassGStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const yellowColor = new THREE.Color(0xffcc00);

    super(yellowColor, {
      coronaIntensity: options.coronaIntensity ?? 0.4,

      pulseSpeed: options.pulseSpeed ?? 0.45,

      glowIntensity: options.glowIntensity ?? 0.45,

      temperatureVariation: options.temperatureVariation ?? 0.09,

      metallicEffect: options.metallicEffect ?? 0.6,
    });
  }
}

/**
 * Renderer for G-class stars
 */
export class ClassGStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a G-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassGStarMaterial();
  }

  /**
   * G-class stars are yellow (like our Sun)
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffcc00);
  }
}
