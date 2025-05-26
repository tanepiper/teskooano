import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "./base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for supergiant stars with massive, luminous appearance
 */
export class SupergiantMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff6644)) {
    super(color, {
      coronaIntensity: 0.9,
      pulseSpeed: 0.15,
      glowIntensity: 1.0,
      temperatureVariation: 0.4,
      metallicEffect: 0.4,
    });
  }
}

/**
 * Renderer for supergiant stars - extremely large, luminous evolved stars
 * Characteristics:
 * - Enormous size and luminosity
 * - Variable colors (red, yellow, or blue depending on temperature)
 * - Strong stellar winds and mass loss
 * - Unstable and variable
 */
export class SupergiantRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new SupergiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Default to red supergiant, but could vary based on temperature
    return new THREE.Color(0xff6644);
  }
}
