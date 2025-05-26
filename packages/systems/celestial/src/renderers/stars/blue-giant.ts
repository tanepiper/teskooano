import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "./base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for blue giant stars with hot, bright appearance
 */
export class BlueGiantMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0x6699ff)) {
    super(color, {
      coronaIntensity: 0.8,
      pulseSpeed: 0.4,
      glowIntensity: 0.9,
      temperatureVariation: 0.1,
      metallicEffect: 0.6,
    });
  }
}

/**
 * Renderer for blue giant stars - hot, massive evolved stars
 * Characteristics:
 * - Very hot and bright
 * - Blue-white color
 * - Strong stellar winds
 * - High luminosity
 */
export class BlueGiantRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new BlueGiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Blue giants are very hot and blue
    return new THREE.Color(0x6699ff);
  }
}
