import * as THREE from 'three';
import type { CelestialObject } from '@teskooano/data-types';
import { BaseStarMaterial, BaseStarRenderer } from './base-star';
import { RenderableCelestialObject } from '@teskooano/renderer-threejs';

/**
 * Material for A-class stars
 * - Temperature: 7,300–10,000 K
 * - Color: White
 * - Main-sequence mass: 1.4–2.1 M☉
 * - Main-sequence radius: 1.4–1.8 R☉
 * - Main-sequence luminosity: 5–25 L☉
 * - Hydrogen lines: Strong
 * - Frequency: 0.61% of main-sequence stars
 */
export class ClassAStarMaterial extends BaseStarMaterial {
  constructor(options: {
    coronaIntensity?: number;
    pulseSpeed?: number;
    glowIntensity?: number;
    temperatureVariation?: number;
    metallicEffect?: number;
  } = {}) {
    // White color for A-class stars
    const whiteColor = new THREE.Color(0xf8f7ff);
    
    super(whiteColor, {
      // Moderate corona intensity
      coronaIntensity: options.coronaIntensity ?? 0.5,
      // Moderate pulse speed
      pulseSpeed: options.pulseSpeed ?? 0.6,
      // Moderate glow intensity
      glowIntensity: options.glowIntensity ?? 0.6,
      // Moderate temperature variations
      temperatureVariation: options.temperatureVariation ?? 0.12,
      // Moderate metallic effect
      metallicEffect: options.metallicEffect ?? 0.5
    });
  }
}

/**
 * Renderer for A-class stars
 */
export class ClassAStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for an A-class star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new ClassAStarMaterial();
  }
  
  /**
   * A-class stars are white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8f7ff);
  }
} 