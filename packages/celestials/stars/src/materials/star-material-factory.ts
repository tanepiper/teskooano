import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { RendererBackend } from "@teskooano/data-types";
import { EnhancedStarMaterial } from "./enhanced-star.material";
import { EnhancedStarNodeMaterial } from "./enhanced-star-tsl.material";

/**
 * Material Factory Options for Star Materials
 */
export interface StarMaterialFactoryOptions {
  rendererBackend: RendererBackend;
  object: RenderableCelestialObject;
  color?: THREE.Color;
  options?: {
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;
    lightingIntensity?: number;
  };
}

/**
 * Factory for creating star materials based on renderer backend
 */
export class StarMaterialFactory {
  /**
   * Create a star material for the specified renderer backend
   */
  static createMaterial(config: StarMaterialFactoryOptions): THREE.Material {
    const { rendererBackend, object, color, options } = config;

    if (rendererBackend === "webgpu") {
      console.log("[StarMaterialFactory] Creating WebGPU material (TSL)");
      return new EnhancedStarNodeMaterial(object, color, options);
    } else {
      console.log("[StarMaterialFactory] Creating WebGL material (GLSL)");
      return new EnhancedStarMaterial(object, color, options);
    }
  }

  /**
   * Check if a material is a WebGPU TSL material
   */
  static isWebGPUMaterial(material: THREE.Material): boolean {
    return material instanceof EnhancedStarNodeMaterial;
  }

  /**
   * Check if a material is a WebGL GLSL material
   */
  static isWebGLMaterial(material: THREE.Material): boolean {
    return material instanceof EnhancedStarMaterial;
  }
}
