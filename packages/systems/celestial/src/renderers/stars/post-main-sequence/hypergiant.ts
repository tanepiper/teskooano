import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for hypergiant stars with extreme, unstable appearance
 */
export class HypergiantMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff4433)) {
    super(color, {
      coronaIntensity: 1.2,
      pulseSpeed: 0.1,
      glowIntensity: 1.5,
      temperatureVariation: 0.6,
      metallicEffect: 0.3,
    });
  }
}

/**
 * Renderer for hypergiant stars - the most massive and luminous stars
 * Characteristics:
 * - Extreme size and luminosity
 * - Highly unstable and variable
 * - Massive stellar winds and eruptions
 * - Short-lived and rare
 */
export class HypergiantRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new HypergiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Hypergiants can be red, yellow, or blue - default to red
    return new THREE.Color(0xff4433);
  }
}
