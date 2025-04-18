import * as THREE from 'three';
import type { CelestialObject, StarProperties } from '@teskooano/data-types';
import { BaseStarMaterial, BaseStarRenderer } from './base-star';
import { RenderableCelestialObject } from '@teskooano/renderer-threejs';

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends BaseStarMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {}
  ) {
    super(color, options);
  }
}

/**
 * Main sequence star renderer
 */
export class MainSequenceStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a main sequence star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new MainSequenceStarMaterial(this.getStarColor(object));
  }
  
  /**
   * Get the star color based on its properties
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    
    // Use color from properties if specified
    if (properties && properties.color) {
      return new THREE.Color(properties.color);
    }
    
    // Default to yellow sun color
    return new THREE.Color(0xffcc00);
  }
} 