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
 * Default rendering options and uniforms for M-class stars (Red Dwarfs).
 */
const CLASS_M_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  // Visual appearance for M-type stars (dimmer, redder)
  coronaDistances: [1.1, 1.25], // Smaller, less distinct corona

  // Animation and variation
  timeOffset: Math.random() * 1000,

  // Shader uniforms for M-type stars
  uniforms: {
    uPulseSpeed: new Uniform(0.3), // Slower pulse
    uGlowIntensity: new Uniform(0.6), // Less intense glow
    uTemperatureVariation: new Uniform(0.05), // Less surface variation
    uNoiseScale: new Uniform(1.2), // Can have slightly different noise scale
  },
};

/**
 * Options for configuring a Class M star renderer instance.
 */
export interface ClassMRendererOptions {
  /** Overrides for general star rendering parameters (LODs, corona settings, etc.) */
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;

  /** Optional explicit color override */
  explicitStarColor?: string | number;
}

/**
 * Renderer for M-class main sequence stars.
 * This renderer extracts properties directly from the celestial object.
 */
export class ClassMRenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassMRendererOptions) {
    // Start with M-class defaults
    const baseOptions = { ...CLASS_M_DEFAULT_OPTIONS };

    // Merge with any user-provided options
    const userOptions = options?.rendererOptions || {};

    // Handle color override
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
    super(celestial, mergedOptions);

    // Create custom corona materials
    this.createCustomCoronas();
  }

  /**
   * Create custom corona materials specific to this star type
   */
  private createCustomCoronas(): void {
    // Clear existing corona materials
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];

    // Create a separate corona material for each scale factor
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Create base material with diminishing opacity for outer layers
      const opacityMultiplier = i === 0 ? 0.7 : 0.5 * (1 - i * 0.2);

      // Create standard corona material
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
