import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import {
  AsteroidFieldMaterial,
  type AsteroidFieldMaterialOptions,
} from "./material";
import { AsteroidFieldNodeMaterial } from "./material-tsl";

/**
 * Factory class for creating asteroid field materials.
 * Creates either GLSL (WebGL) or TSL (WebGPU) materials based on renderer backend.
 */
export class AsteroidFieldMaterialFactory {
  /**
   * Creates an asteroid field material for the specified renderer backend
   */
  createMaterial(
    rendererBackend: RendererBackend,
    options: AsteroidFieldMaterialOptions = {},
  ): THREE.Material {
    if (rendererBackend === "webgpu") {
      console.log(
        "[AsteroidFieldMaterialFactory] Creating WebGPU material (TSL)",
      );
      return new AsteroidFieldNodeMaterial(options);
    } else {
      console.log(
        "[AsteroidFieldMaterialFactory] Creating WebGL material (GLSL)",
      );
      return new AsteroidFieldMaterial(options);
    }
  }

  /**
   * Check if a material is a GLSL material (has uniforms property)
   */
  isGLSLMaterial(material: THREE.Material): boolean {
    return "uniforms" in material && material.uniforms !== undefined;
  }

  /**
   * Check if a material is a TSL material
   */
  isTSLMaterial(material: THREE.Material): boolean {
    return material instanceof AsteroidFieldNodeMaterial;
  }
}
