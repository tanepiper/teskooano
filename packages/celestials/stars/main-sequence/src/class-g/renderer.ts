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
 * Default rendering options and uniforms for G-Class stars.
 */
const G_CLASS_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  // Visual appearance
  coronaDistances: [1.15, 1.3],

  // Animation and variation
  timeOffset: Math.random() * 1000,

  // G-specific shader uniforms
  uniforms: {
    uPulseSpeed: new Uniform(0.45),
    uGlowIntensity: new Uniform(1.05),
    uTemperatureVariation: new Uniform(0.12),
    uNoiseScale: new Uniform(1.2),
  },
};

/**
 * Options for configuring a Class G star renderer instance.
 */
export interface ClassGRendererOptions {
  /** Overrides for general star rendering parameters (LODs, corona settings, etc.) */
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;

  /** Optional explicit color override */
  explicitStarColor?: string | number;
}

/**
 * Renderer for G-class main sequence stars (e.g., Sol-like stars).
 * This renderer extracts properties directly from the celestial object.
 */
export class ClassGRenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassGRendererOptions) {
    // Start with G-class defaults
    const baseOptions = { ...G_CLASS_DEFAULT_OPTIONS };

    // Merge with any user-provided options
    const userOptions = options?.rendererOptions || {};

    // Handle color override - convert THREE.Color to hex if needed
    let colorOverride = options?.explicitStarColor;

    // Create the merged options
    const mergedOptions: MainSequenceStarRendererConstructorOptions = {
      ...baseOptions,
      ...userOptions,

      // Handle uniforms specially to merge them properly
      uniforms: {
        ...(baseOptions.uniforms || {}),
        ...(userOptions.uniforms || {}),
      },

      // Add explicit color override if provided
      explicitStarColor: colorOverride,
    };

    // Call super with the celestial object and merged options
    // The renderer will extract star properties directly from the celestial
    super(celestial, mergedOptions);

    // Create custom G-type corona materials
    this.createCustomGTypeCoronas();
  }

  /**
   * Create custom corona materials specific to G-type stars
   */
  private createCustomGTypeCoronas(): void {
    // Clear existing corona materials
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];

    // Create a separate corona material for each scale factor
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Create base material with diminishing opacity for outer layers
      const opacityMultiplier = i === 0 ? 0.7 : 0.5 * (1 - i * 0.2);

      // Use the factory method for G-type corona
      const coronaMaterial = CelestialCoronaMaterial.createGTypeCorona({
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
