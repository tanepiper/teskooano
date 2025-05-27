import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for A-class stars
 * - Temperature: 7,300–10,000 K
 * - Color: White
 * - Main-sequence mass: 1.4–2.1 M☉
 * - Main-sequence radius: 1.4–1.8 R☉
 * - Main-sequence luminosity: 5–25 L☉
 * - Hydrogen lines: Strong
 * - Frequency: 0.61% of main-sequence stars
 */
export class ClassAStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const whiteColor = new THREE.Color(0xf8f7ff);

    super(whiteColor, {
      coronaIntensity: options.coronaIntensity ?? 0.5,

      pulseSpeed: options.pulseSpeed ?? 0.6,

      glowIntensity: options.glowIntensity ?? 0.6,

      temperatureVariation: options.temperatureVariation ?? 0.12,

      metallicEffect: options.metallicEffect ?? 0.5,
    });
  }
}

/**
 * Renderer for A-class stars
 */
export class ClassAStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for an A-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassAStarMaterial();
  }

  /**
   * A-class stars are white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8f7ff);
  }
}
