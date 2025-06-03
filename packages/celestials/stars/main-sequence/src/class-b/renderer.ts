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
 * Default rendering options and uniforms for B-class stars (Blue-White).
 */
const CLASS_B_DEFAULT_OPTIONS: Partial<CoreStarOptions> = {
  coronaDistances: [1.25, 1.5],
  timeOffset: Math.random() * 1000,
  uniforms: {
    uPulseSpeed: new Uniform(0.6),
    uGlowIntensity: new Uniform(1.25),
    uTemperatureVariation: new Uniform(0.18),
    uNoiseScale: new Uniform(0.85),
  },
};

/**
 * Options for configuring a Class B star renderer instance.
 */
export interface ClassBRendererOptions {
  rendererOptions?: Partial<MainSequenceStarRendererConstructorOptions>;
}

/**
 * Renderer for B-class main sequence stars.
 */
export class ClassBRenderer extends MainSequenceStarRenderer {
  constructor(celestial: CelestialObject, options?: ClassBRendererOptions) {
    const baseOptions = { ...CLASS_B_DEFAULT_OPTIONS };
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
    this.createClassBCoronas();
  }

  /**
   * Create custom corona materials specific to B-type stars
   */
  private createClassBCoronas(): void {
    for (const material of this.coronaMaterials) {
      material.dispose();
    }
    this.coronaMaterials = [];
    for (let i = 0; i < this.starOptions.coronaDistances.length; i++) {
      const opacityMultiplier = i === 0 ? 0.85 : 0.65 * (1 - i * 0.15);

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
