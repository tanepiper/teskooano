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
    // Yellow color for G-class stars (like our Sun)
    const yellowColor = new THREE.Color(0xffcc00);

    super(yellowColor, {
      // Medium-low corona intensity
      coronaIntensity: options.coronaIntensity ?? 0.4,
      // Medium pulse speed
      pulseSpeed: options.pulseSpeed ?? 0.45,
      // Medium glow intensity
      glowIntensity: options.glowIntensity ?? 0.45,
      // Medium temperature variations
      temperatureVariation: options.temperatureVariation ?? 0.09,
      // Higher metallic effect (Sun has more visible surface details)
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
