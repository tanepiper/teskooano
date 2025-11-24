/**
 * Material factory for gas giants supporting both WebGL and WebGPU renderers.
 *
 * @packageDocumentation
 */

import * as THREE from "three";
import type { RendererBackend } from "@teskooano/data-types";
import { BasicGasGiantMaterial } from "./material";
import {
  BasicGasGiantNodeMaterial,
  type BasicGasGiantNodeMaterialOptions,
} from "./material-tsl";

/**
 * Options for creating gas giant materials
 */
export interface GasGiantMaterialFactoryOptions {
  /** Active renderer backend */
  rendererBackend: RendererBackend;
  /** Base color of the gas giant */
  baseColor: THREE.Color;
  /** Cloud/atmosphere color (optional) */
  cloudColor?: THREE.Color;
  /** Emissive color for hot Jupiters (optional) */
  emissiveColor?: THREE.Color;
  /** Emissive intensity */
  emissiveIntensity?: number;
  /** Roughness (0-1) */
  roughness?: number;
  /** Metalness (0-1) */
  metalness?: number;
}

/**
 * Factory for creating gas giant materials based on active renderer backend.
 *
 * - WebGPU: Creates TSL-based `BasicGasGiantNodeMaterial`
 * - WebGL: Creates GLSL-based `BasicGasGiantMaterial`
 *
 * This ensures compatibility with both rendering backends while
 * maintaining consistent visual output.
 */
export class GasGiantMaterialFactory {
  /**
   * Creates a gas giant material compatible with the active renderer backend.
   *
   * @param options Configuration options including renderer backend and visual properties
   * @returns Material compatible with the active renderer
   */
  static createMaterial(
    options: GasGiantMaterialFactoryOptions,
  ): THREE.Material {
    const isWebGPU = options.rendererBackend === "webgpu";

    if (isWebGPU) {
      console.log("[GasGiantMaterialFactory] Creating WebGPU material (TSL)");

      const tslOptions: BasicGasGiantNodeMaterialOptions = {
        baseColor: options.baseColor,
        cloudColor: options.cloudColor,
        emissiveColor: options.emissiveColor,
        emissiveIntensity: options.emissiveIntensity,
        roughness: options.roughness,
        metalness: options.metalness,
      };

      return new BasicGasGiantNodeMaterial(tslOptions);
    } else {
      console.log("[GasGiantMaterialFactory] Creating WebGL material (GLSL)");
      return new BasicGasGiantMaterial(options.baseColor);
    }
  }
}
