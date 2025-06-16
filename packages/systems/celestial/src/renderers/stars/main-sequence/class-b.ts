import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial } from "../base/base-star";
import { MainSequenceStarRenderer } from "./main-sequence-star";
import { BaseCelestialRendererOptions } from "../../base/BaseCelestialRenderer";

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
    const bluishWhiteColor = new THREE.Color(0xaabfff);

    super(bluishWhiteColor, {
      coronaIntensity: options.coronaIntensity ?? 0.6,

      pulseSpeed: options.pulseSpeed ?? 0.7,

      glowIntensity: options.glowIntensity ?? 0.7,

      temperatureVariation: options.temperatureVariation ?? 0.14,

      metallicEffect: options.metallicEffect ?? 0.45,
    });
  }
}

/**
 * Renderer for B-class stars
 */
export class ClassBStarRenderer extends MainSequenceStarRenderer {
  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
  }

  /**
   * Returns the appropriate material for a B-class star
   */
  public getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassBStarMaterial();
  }

  /**
   * B-class stars are bluish white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xaabfff);
  }
}
