import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for M-class stars
 * - Temperature: 2,300–3,900 K
 * - Color: Light orangish red
 * - Main-sequence mass: 0.08–0.45 M☉
 * - Main-sequence radius: ≤ 0.7 R☉
 * - Main-sequence luminosity: ≤ 0.08 L☉
 * - Hydrogen lines: Very weak
 * - Frequency: 76% of main-sequence stars (most common)
 */
export class ClassMStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const orangishRedColor = new THREE.Color(0xff6644);

    super(orangishRedColor, {
      coronaIntensity: options.coronaIntensity ?? 0.3,

      pulseSpeed: options.pulseSpeed ?? 0.35,

      glowIntensity: options.glowIntensity ?? 0.35,

      temperatureVariation: options.temperatureVariation ?? 0.07,

      metallicEffect: options.metallicEffect ?? 0.7,
    });
  }
}

/**
 * Renderer for M-class stars
 */
export class ClassMStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for an M-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassMStarMaterial();
  }

  /**
   * M-class stars are light orangish red
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xff6644);
  }
}
