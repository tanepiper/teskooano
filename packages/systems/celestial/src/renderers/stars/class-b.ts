import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
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
export class ClassBStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    // Bluish white color for B-class stars
    const bluishWhiteColor = new THREE.Color(0xaabfff);

    super(bluishWhiteColor, {
      // High corona intensity but less than O-class
      coronaIntensity: options.coronaIntensity ?? 0.6,
      // Slightly slower pulse than O-class
      pulseSpeed: options.pulseSpeed ?? 0.7,
      // High glow intensity
      glowIntensity: options.glowIntensity ?? 0.7,
      // Moderate temperature variations
      temperatureVariation: options.temperatureVariation ?? 0.14,
      // Moderate metallic effect
      metallicEffect: options.metallicEffect ?? 0.45,
    });
  }
}

/**
 * Renderer for B-class stars
 */
export class ClassBStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a B-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassBStarMaterial();
  }

  /**
   * B-class stars are bluish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xaabfff);
  }
}
