import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for white dwarf stars
 * - Temperature: 8,000-40,000 K
 * - Color: White to pale blue
 * - Typical mass: 0.5-0.7 M☉
 * - Typical radius: ~0.01 R☉ (Earth-sized)
 * - Very high density
 * - No fusion - cooling remnant of a star
 * - Electron-degenerate matter
 */
export class WhiteDwarfMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const whiteColor = new THREE.Color(0xf8fcff);

    super(whiteColor, {
      coronaIntensity: options.coronaIntensity ?? 0.4,

      pulseSpeed: options.pulseSpeed ?? 0.2,

      glowIntensity: options.glowIntensity ?? 0.7,

      temperatureVariation: options.temperatureVariation ?? 0.05,

      metallicEffect: options.metallicEffect ?? 0.8,
    });
  }
}

/**
 * Renderer for white dwarf stars
 */
export class WhiteDwarfRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a white dwarf star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new WhiteDwarfMaterial();
  }

  /**
   * White dwarfs are white with slight blue tint
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8fcff);
  }
}
