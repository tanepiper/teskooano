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
 * Default rendering options and uniforms for O-class stars (Intense Blue).
 */
const CLASS_O_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  coronaDistances: [1.3, 1.6], // O-types are extremely hot and luminous, largest coronas
  timeOffset: Math.random() * 1000,
  uniforms: {
    uPulseSpeed: new Uniform(0.7), // Extremely fast pulse
    uGlowIntensity: new Uniform(1.4), // Extremely intense glow, almost white-blue hot
    uTemperatureVariation: new Uniform(0.22), // Very high surface variation, violent activity
    uNoiseScale: new Uniform(0.8), // Fine, energetic noise patterns
  },
};

/**
 * Options for configuring a Class O star renderer instance.
 */
export interface ClassORendererOptions {
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;
}

/**
 * Renderer for O-class main sequence stars.
 */
export class ClassORenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassORendererOptions) {
    const baseOptions = { ...CLASS_O_DEFAULT_OPTIONS };
    const userOptions = options?.rendererOptions || {};

    const mergedOptions: MainSequenceStarRendererConstructorOptions = {
      ...baseOptions,
      ...userOptions,
      uniforms: {
        ...(baseOptions.uniforms || {}),
        ...(userOptions.uniforms || {}),
      },
    };
    super(celestial, mergedOptions);
    this.createClassOCoronas();
  }

  /**
   * Create custom corona materials specific to O-type stars
   */
  private createClassOCoronas(): void {
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Adjusted opacity for O-type (intensely bright, often appearing blue-white)
      const opacityMultiplier = i === 0 ? 0.9 : 0.7 * (1 - i * 0.1);

      const coronaMaterial = new CelestialCoronaMaterial({
        starColor: new THREE.Color(this.baseColor), // baseColor from MainSequenceStarRenderer, should be blueish for O-type
        timeOffset: this.starOptions.timeOffset,
        customUniforms: this.starOptions.uniforms,
        opacityMultiplier,
      });
      this.coronaMaterials.push(coronaMaterial);
    }
    this.rebuildLODGroups();
  }
}
