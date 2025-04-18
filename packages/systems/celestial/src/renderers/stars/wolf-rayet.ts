import * as THREE from "three";
import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "./base-star";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for Wolf-Rayet stars
 * - Temperature: 30,000-200,000 K
 * - Color: Blue-white
 * - Typical mass: 10-25 M☉
 * - Strong stellar winds
 * - Rapidly losing mass
 * - Helium-burning phase
 * - Strong emission lines
 * - Precursor to supernovae
 */
export class WolfRayetMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    // Intense blue-white color
    const blueWhiteColor = new THREE.Color(0xa0c8ff);

    super(blueWhiteColor, {
      // Extremely intense corona for stellar winds
      coronaIntensity: options.coronaIntensity ?? 1.2,
      // Medium-fast pulse to simulate instability
      pulseSpeed: options.pulseSpeed ?? 1.0,
      // Very strong glow
      glowIntensity: options.glowIntensity ?? 1.0,
      // High temperature variations - turbulent surface
      temperatureVariation: options.temperatureVariation ?? 0.25,
      // Medium metallic effect
      metallicEffect: options.metallicEffect ?? 0.5,
    });
  }
}

/**
 * Renderer for Wolf-Rayet stars
 */
export class WolfRayetRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a Wolf-Rayet star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new WolfRayetMaterial();
  }

  /**
   * Wolf-Rayet stars are intense blue-white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xa0c8ff);
  }

  /**
   * Override to create more extensive corona for Wolf-Rayet stars
   */
  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Call the base implementation first
    super.addCorona(object, group);

    // Add additional outer, fainter corona layer to simulate stellar winds
    const radius = object.radius || 1;
    const coronaScale = radius * 5;
    const color = this.getStarColor(object);

    // Use a sphere geometry for the stellar wind effect instead of planes
    const sphereGeometry = new THREE.SphereGeometry(coronaScale, 32, 32);

    // Create a material for the stellar wind sphere with high transparency
    const stellarWindMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create the stellar wind sphere and add to group
    const stellarWindSphere = new THREE.Mesh(
      sphereGeometry,
      stellarWindMaterial,
    );
    stellarWindSphere.name = `${object.celestialObjectId}-stellar-wind`;
    group.add(stellarWindSphere);
  }
}
