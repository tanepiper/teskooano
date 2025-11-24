/**
 * Base Material Factory for creating renderer-aware materials.
 *
 * This factory creates either:
 * - WebGL materials using GLSL shaders (ShaderMaterial)
 * - WebGPU materials using TSL node system (NodeMaterial)
 *
 * Based on: https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
 *
 * @packageDocumentation
 */

import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";

/**
 * Options for material creation
 */
export interface MaterialFactoryOptions {
  /** The active renderer backend */
  rendererBackend: RendererBackend;
  /** Additional material-specific options */
  [key: string]: any;
}

/**
 * Base class for material factories that support both WebGL and WebGPU.
 *
 * @example
 * ```typescript
 * class TerrestrialMaterialFactory extends MaterialFactory {
 *   createMaterial(options: MaterialFactoryOptions): THREE.Material {
 *     if (options.rendererBackend === 'webgpu') {
 *       return this.createWebGPUMaterial(options);
 *     } else {
 *       return this.createWebGLMaterial(options);
 *     }
 *   }
 *
 *   private createWebGPUMaterial(options: MaterialFactoryOptions): THREE.Material {
 *     // Create TSL node material
 *     const material = new THREE.MeshStandardNodeMaterial();
 *     // Configure with TSL nodes
 *     return material;
 *   }
 *
 *   private createWebGLMaterial(options: MaterialFactoryOptions): THREE.Material {
 *     // Create GLSL shader material
 *     return new THREE.ShaderMaterial({
 *       vertexShader: glslVertex,
 *       fragmentShader: glslFragment
 *     });
 *   }
 * }
 * ```
 */
export abstract class MaterialFactory {
  /**
   * Creates a material appropriate for the active renderer backend.
   *
   * @param options Material creation options including renderer backend
   * @returns A Three.js material compatible with the active renderer
   */
  abstract createMaterial(options: MaterialFactoryOptions): THREE.Material;

  /**
   * Checks if WebGPU is the active backend.
   *
   * @param options Material creation options
   * @returns True if WebGPU is active
   */
  protected isWebGPU(options: MaterialFactoryOptions): boolean {
    return options.rendererBackend === "webgpu";
  }

  /**
   * Checks if WebGL is the active backend.
   *
   * @param options Material creation options
   * @returns True if WebGL is active
   */
  protected isWebGL(options: MaterialFactoryOptions): boolean {
    return options.rendererBackend === "webgl";
  }
}

/**
 * Utility function to get the active renderer backend from a SceneManager.
 *
 * @param sceneManager The scene manager instance
 * @returns The active renderer backend
 */
export function getRendererBackend(sceneManager: {
  rendererBackend: RendererBackend;
}): RendererBackend {
  return sceneManager.rendererBackend;
}
