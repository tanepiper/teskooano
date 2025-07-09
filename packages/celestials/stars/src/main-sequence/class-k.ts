import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial } from "../base/base-star";
import { MainSequenceStarRenderer } from "./main-sequence-star";
import { BaseCelestialRendererOptions } from "@teskooano/renderer-threejs-celestial";

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
export class ClassKStarRenderer extends MainSequenceStarRenderer<ClassKStarMaterial> {
  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
  }

  /**
   * Returns the appropriate material for a K-class star
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): ClassKStarMaterial {
    return new ClassKStarMaterial();
  }

  /**
   * K-class stars are light orange
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffaa55);
  }
}
