import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import {
  AsteroidNucleusMaterial,
  type AsteroidNucleusMaterialOptions,
} from "./material";
import { AsteroidNucleusMaterialTSL } from "./material-tsl";

/**
 * Factory for creating asteroid materials based on renderer backend
 */
export class AsteroidMaterialFactory {
  /**
   * Create an asteroid nucleus material for the specified renderer backend
   */
  static createMaterial(
    rendererBackend: RendererBackend,
    options: AsteroidNucleusMaterialOptions,
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      console.log("[AsteroidMaterialFactory] Creating WebGPU material (TSL)");
      return new AsteroidNucleusMaterialTSL(options);
    } else {
      console.log("[AsteroidMaterialFactory] Creating WebGL material (GLSL)");
      return new AsteroidNucleusMaterial(options);
    }
  }

  /**
   * Check if a material is a WebGPU TSL material
   */
  static isWebGPUMaterial(material: THREE.Material): boolean {
    return material instanceof AsteroidNucleusMaterialTSL;
  }

  /**
   * Check if a material is a WebGL GLSL material
   */
  static isWebGLMaterial(material: THREE.Material): boolean {
    return material instanceof AsteroidNucleusMaterial;
  }
}
