import * as THREE from "three";

export interface SatelliteMaterialOptions {
  /** Base color multiplier for the satellite */
  color?: THREE.Color;
  /** Metallic factor for PBR materials */
  metalness?: number;
  /** Roughness factor for PBR materials */
  roughness?: number;
  /** Maximum emissive intensity when fully lit */
  maxEmissiveIntensity?: number;
}

/**
 * PBR material for satellite rendering that calculates brightness based on incoming light
 */
export class SatelliteMaterial extends THREE.MeshStandardMaterial {
  private maxEmissiveIntensity: number;

  constructor(options: SatelliteMaterialOptions = {}) {
    super({
      color: options.color ?? new THREE.Color(0xdddddd),
      metalness: options.metalness ?? 0.7,
      roughness: options.roughness ?? 0.3,
      emissive: new THREE.Color(0xdddddd), // Same as base color for natural reflection
      emissiveIntensity: 0.0, // Will be calculated dynamically
    });

    this.maxEmissiveIntensity = options.maxEmissiveIntensity ?? 0.6;

    // Enable standard material features for proper lighting
    this.transparent = false;
    this.side = THREE.FrontSide;

    // Ensure the material responds to lighting
    this.needsUpdate = true;
  }

  /**
   * Updates emissive intensity based on the amount of light hitting the satellite
   */
  update(
    satellitePosition: THREE.Vector3,
    lightSources: Map<string, any>,
  ): void {
    let totalLuminosity = 0;

    // Calculate total light intensity hitting the satellite
    for (const lightSource of lightSources.values()) {
      const distance = satellitePosition.distanceTo(lightSource.position);
      const lightIntensity = lightSource.intensity ?? 1.0;

      // Inverse square law for light falloff, but clamped for visibility
      const falloff = Math.max(
        0.1,
        lightIntensity / (distance * distance * 0.001 + 1),
      );
      totalLuminosity += falloff;
    }

    // Convert luminosity to emissive intensity
    // Scale and clamp to reasonable values
    const calculatedIntensity = Math.min(
      totalLuminosity * 0.5,
      this.maxEmissiveIntensity,
    );
    this.emissiveIntensity = Math.max(0.05, calculatedIntensity); // Minimum brightness for visibility
  }

  /**
   * Updates lighting uniforms - not needed for standard materials
   * Three.js handles lighting automatically for MeshStandardMaterial
   */
  updateLighting(lightSources: any): void {
    // Standard material handles lighting automatically
    // This method is here for API compatibility
  }
}
