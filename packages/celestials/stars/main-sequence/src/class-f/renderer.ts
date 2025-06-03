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
 * Default rendering options and uniforms for F-class stars (Yellow-White Dwarfs).
 */
const CLASS_F_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  coronaDistances: [1.18, 1.35],
  timeOffset: Math.random() * 1000,
  uniforms: {
    uPulseSpeed: new Uniform(0.5),
    uGlowIntensity: new Uniform(1.05),
    uTemperatureVariation: new Uniform(0.12),
    uNoiseScale: new Uniform(0.95),
  },
};

/**
 * Options for configuring a Class F star renderer instance.
 */
export interface ClassFRendererOptions {
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;
}

/**
 * Renderer for F-class main sequence stars.
 */
export class ClassFRenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassFRendererOptions) {
    const baseOptions = { ...CLASS_F_DEFAULT_OPTIONS };
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
    this.createClassFCoronas();
  }

  /**
   * Create custom corona materials specific to F-type stars
   */
  private createClassFCoronas(): void {
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      // Adjusted opacity for F-type (brighter than G)
      const opacityMultiplier = i === 0 ? 0.75 : 0.55 * (1 - i * 0.2);

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
