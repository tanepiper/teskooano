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
 * Default rendering options and uniforms for A-class stars (White/Bluish-White).
 */
const CLASS_A_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  coronaDistances: [1.2, 1.4], // A-types are hot, larger coronas
  timeOffset: Math.random() * 1000,
  uniforms: {
    uPulseSpeed: new Uniform(0.55), // Faster pulse
    uGlowIntensity: new Uniform(1.15), // More intense glow
    uTemperatureVariation: new Uniform(0.15), // Higher surface variation
    uNoiseScale: new Uniform(0.9), // Different noise characteristic
  },
};

/**
 * Options for configuring a Class A star renderer instance.
 */
export interface ClassARendererOptions {
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;
}

/**
 * Renderer for A-class main sequence stars.
 */
export class ClassARenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassARendererOptions) {
    const baseOptions = { ...CLASS_A_DEFAULT_OPTIONS };
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
    this.createClassACoronas();
  }

  /**
   * Create custom corona materials specific to A-type stars
   */
  private createClassACoronas(): void {
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Adjusted opacity for A-type (bright white/blueish)
      const opacityMultiplier = i === 0 ? 0.8 : 0.6 * (1 - i * 0.2);

      const coronaMaterial = new CelestialCoronaMaterial({
        starColor: new THREE.Color(this.baseColor),
        timeOffset: this.starOptions.timeOffset,
        customUniforms: this.starOptions.uniforms,
        opacityMultiplier,
      });
      this.coronaMaterials.push(coronaMaterial);
    }
    this.rebuildLODGroups();
  }
}
