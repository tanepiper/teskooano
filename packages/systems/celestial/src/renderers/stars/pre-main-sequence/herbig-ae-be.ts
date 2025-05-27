import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for Herbig Ae/Be stars with bright, hot appearance
 */
export class HerbigAeBeMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0x88aaff)) {
    super(color, {
      coronaIntensity: 0.7,
      pulseSpeed: 0.6,
      glowIntensity: 0.8,
      temperatureVariation: 0.2,
      metallicEffect: 0.4,
    });
  }
}

/**
 * Renderer for Herbig Ae/Be stars - intermediate-mass pre-main sequence stars
 * Characteristics:
 * - Hotter and more massive than T Tauri stars
 * - Strong emission lines
 * - Circumstellar disks and envelopes
 * - Blue-white appearance
 */
export class HerbigAeBeRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new HerbigAeBeMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Herbig Ae/Be stars are hot, blue-white
    return new THREE.Color(0x88aaff);
  }
}
