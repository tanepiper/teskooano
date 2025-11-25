/**
 * TSL Material Factory for Gas Giants
 * @packageDocumentation
 */

import * as THREE from "three";
import { GasGiantClass } from "@teskooano/data-types";
import { BasicGasGiantNodeMaterial, type BasicGasGiantNodeMaterialOptions } from "./material-tsl";

/**
 * Factory for creating gas giant materials using WebGPU TSL
 */
export class GasGiantTSLMaterialFactory {
  /**
   * Creates a gas giant material based on class type
   */
  createMaterial(
    gasGiantClass: GasGiantClass,
    baseColor: THREE.Color,
    cloudColor?: THREE.Color,
    options?: Partial<BasicGasGiantNodeMaterialOptions>,
  ): BasicGasGiantNodeMaterial {
    const materialOptions: BasicGasGiantNodeMaterialOptions = {
      baseColor,
      cloudColor: cloudColor || baseColor.clone().multiplyScalar(0.8),
      ...options,
    };

    // Adjust properties based on gas giant class
    switch (gasGiantClass) {
      case GasGiantClass.CLASS_I:
        // Jupiter-like: Ammonia clouds
        materialOptions.roughness = options?.roughness ?? 0.8;
        materialOptions.metalness = options?.metalness ?? 0.0;
        break;

      case GasGiantClass.CLASS_II:
        // Water clouds
        materialOptions.roughness = options?.roughness ?? 0.7;
        materialOptions.metalness = options?.metalness ?? 0.0;
        break;

      case GasGiantClass.CLASS_III:
        // Cloudless
        materialOptions.roughness = options?.roughness ?? 0.6;
        materialOptions.metalness = options?.metalness ?? 0.0;
        break;

      case GasGiantClass.CLASS_IV:
        // Alkali metals
        materialOptions.roughness = options?.roughness ?? 0.5;
        materialOptions.metalness = options?.metalness ?? 0.1;
        break;

      case GasGiantClass.CLASS_V:
        // Hot Jupiter with silicate clouds
        materialOptions.roughness = options?.roughness ?? 0.4;
        materialOptions.metalness = options?.metalness ?? 0.2;
        // Add emissive for hot Jupiter
        if (!options?.emissiveColor) {
          materialOptions.emissiveColor = baseColor.clone();
          materialOptions.emissiveIntensity = options?.emissiveIntensity ?? 0.3;
        }
        break;
    }

    return new BasicGasGiantNodeMaterial(materialOptions);
  }
}
