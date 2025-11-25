/**
 * Factory for creating star materials using WebGPU TSL
 * @packageDocumentation
 */

import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";
import { EnhancedStarTSLMaterial } from "./enhanced-star-tsl.material";
import { CoronaTSLMaterial } from "./corona-tsl.material";

/**
 * Options for creating a star material
 */
export interface StarMaterialOptions {
  /** Base star color */
  color: THREE.Color;
  /** Material configuration options */
  options?: {
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;
    lightingIntensity?: number;
  };
}

/**
 * Factory for creating WebGPU TSL star materials
 */
export class StarMaterialTSLFactory {
  /**
   * Creates an enhanced star material using WebGPU TSL
   */
  createStarMaterial(
    object: RenderableCelestialObject,
    config: StarMaterialOptions,
  ): EnhancedStarTSLMaterial {
    console.log("[StarMaterialTSLFactory] Creating WebGPU TSL star material");
    return new EnhancedStarTSLMaterial(object, config.color, config.options);
  }

  /**
   * Creates a corona material using WebGPU TSL
   */
  createCoronaMaterial(
    color: THREE.Color,
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
    } = {},
  ): CoronaTSLMaterial {
    console.log("[StarMaterialTSLFactory] Creating WebGPU TSL corona material");
    return new CoronaTSLMaterial(color, options);
  }
}
