import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for F-class stars
 * - Temperature: 6,000–7,300 K
 * - Color: Yellowish white
 * - Main-sequence mass: 1.04–1.4 M☉
 * - Main-sequence radius: 1.15–1.4 R☉
 * - Main-sequence luminosity: 1.5–5 L☉
 * - Hydrogen lines: Medium
 * - Frequency: 3.0% of main-sequence stars
 */
export class ClassFStarMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const yellowishWhiteColor = new THREE.Color(0xfff4ea);

    super(yellowishWhiteColor, {
      coronaIntensity: options.coronaIntensity ?? 0.45,

      pulseSpeed: options.pulseSpeed ?? 0.5,

      glowIntensity: options.glowIntensity ?? 0.5,

      temperatureVariation: options.temperatureVariation ?? 0.1,

      metallicEffect: options.metallicEffect ?? 0.55,
    });
  }
}

/**
 * Renderer for F-class stars
 */
export class ClassFStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for an F-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassFStarMaterial();
  }

  /**
   * F-class stars are yellowish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xfff4ea);
  }
}
