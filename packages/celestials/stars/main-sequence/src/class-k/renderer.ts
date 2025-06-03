import type { CelestialObject } from "@teskooano/celestial-object";
import * as THREE from "three";
import { Uniform } from "three";
import {
  MainSequenceStarRenderer,
  type MainSequenceStarRendererConstructorOptions,
} from "../base/star-renderer";
import { CelestialCoronaMaterial } from "../base/corona-material";
import type { MainSequenceStarRendererOptions as CoreStarOptions } from "../types/star.types";

/**
 * Default rendering options and uniforms for K-class stars (Orange Dwarfs).
 */
const CLASS_K_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  coronaDistances: [1.12, 1.28],
  timeOffset: Math.random() * 1000,
  uniforms: {
    uPulseSpeed: new Uniform(0.4),
    uGlowIntensity: new Uniform(0.85),
    uTemperatureVariation: new Uniform(0.08),
    uNoiseScale: new Uniform(1.05),
  },
};

/**
 * Options for configuring a Class K star renderer instance.
 */
export interface ClassKRendererOptions {
  /** Overrides for general star rendering parameters (LODs, corona settings, etc.) */
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;
}

/**
 * Renderer for K-class main sequence stars.
 * This renderer extracts properties directly from the celestial object.
 */
export class ClassKRenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassKRendererOptions) {
    // Start with K-class defaults
    const baseOptions = { ...CLASS_K_DEFAULT_OPTIONS };

    // Merge with any user-provided options
    const userOptions = options?.rendererOptions || {};

    // Create the merged options
    const mergedOptions: MainSequenceStarRendererConstructorOptions = {
      ...baseOptions,
      ...userOptions,

      // Handle uniforms specially to merge them properly
      uniforms: {
        ...(baseOptions.uniforms || {}),
        ...(userOptions.uniforms || {}),
      },
    };

    // Call super with the celestial object and merged options
    super(celestial, mergedOptions);

    // Create custom corona materials specific to K-type stars
    this.createClassKCoronas();
  }

  /**
   * Create custom corona materials specific to K-type stars
   */
  private createClassKCoronas(): void {
    // Clear existing corona materials
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];

    // Create a separate corona material for each scale factor
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Adjusted opacity for K-type (slightly less bright than G)
      const opacityMultiplier = i === 0 ? 0.65 : 0.45 * (1 - i * 0.2);

      const coronaMaterial = new CelestialCoronaMaterial({
        starColor: new THREE.Color(this.baseColor),
        timeOffset: this.starOptions.timeOffset,
        customUniforms: this.starOptions.uniforms,
        opacityMultiplier,
      });

      this.coronaMaterials.push(coronaMaterial);
    }

    // Rebuild the LOD meshes to use the new corona materials
    this.rebuildLODGroups();
  }
}
