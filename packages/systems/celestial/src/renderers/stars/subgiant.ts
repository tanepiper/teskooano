import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "./base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for subgiant stars with slightly evolved appearance
 */
export class SubgiantMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xffaa44)) {
    super(color, {
      coronaIntensity: 0.4,
      pulseSpeed: 0.3,
      glowIntensity: 0.5,
      temperatureVariation: 0.15,
      metallicEffect: 0.5,
    });
  }
}

/**
 * Renderer for subgiant stars - evolved stars between main sequence and giant phase
 * Characteristics:
 * - Slightly larger and cooler than main sequence
 * - Beginning to expand as hydrogen in core depletes
 * - More stable than giants but showing signs of evolution
 */
export class SubgiantRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new SubgiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Subgiants are typically yellow-orange, slightly cooler than main sequence
    return new THREE.Color(0xffaa44);
  }
}
