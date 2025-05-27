import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for carbon stars with deep red, sooty appearance
 */
export class CarbonStarMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xaa2211)) {
    super(color, {
      coronaIntensity: 0.4,
      pulseSpeed: 0.25,
      glowIntensity: 0.5,
      temperatureVariation: 0.3,
      metallicEffect: 0.1,
    });
  }
}

/**
 * Renderer for carbon stars - evolved stars with carbon-rich atmospheres
 * Characteristics:
 * - Deep red color due to carbon compounds
 * - Sooty, dusty appearance
 * - Variable brightness
 * - Cool surface temperature
 */
export class CarbonStarRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new CarbonStarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Carbon stars are very red due to carbon absorption
    return new THREE.Color(0xaa2211);
  }
}
