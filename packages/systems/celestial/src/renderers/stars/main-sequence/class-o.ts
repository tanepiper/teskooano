import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

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
export class ClassOStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const blueColor = new THREE.Color(0x9bb0ff);

    super(blueColor, {
      coronaIntensity: options.coronaIntensity ?? 0.7,

      pulseSpeed: options.pulseSpeed ?? 0.8,

      glowIntensity: options.glowIntensity ?? 0.8,

      temperatureVariation: options.temperatureVariation ?? 0.15,

      metallicEffect: options.metallicEffect ?? 0.4,
    });
  }
}

/**
 * Renderer for O-class stars
 */
export class ClassOStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for an O-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassOStarMaterial();
  }

  /**
   * O-class stars are blue
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0x9bb0ff);
  }
}
