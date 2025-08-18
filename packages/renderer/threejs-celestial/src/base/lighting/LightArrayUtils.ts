import type { LightSourcesMap } from "./LightingCalculator";
import * as THREE from "three";

/**
 * Utility class for managing light and shadow caster arrays in shader materials
 */
export class LightArrayUtils {
  /**
   * Creates an initial array of light sources with the specified size
   */
  static createLightSourceArray(size: number = 4): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      }));
  }

  /**
   * Creates an initial array of shadow casters with the specified size
   */
  static createShadowCasterArray(size: number = 4): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    return Array(size)
      .fill(0)
      .map(() => ({
        position: new THREE.Vector3(),
        radius: 0,
      }));
  }

  /**
   * Resizes a light source array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of light sources
   * @returns A new array of light sources with the specified size
   */
  static resizeLightArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_LIGHTS !== defineSize) {
      material.defines.MAX_LIGHTS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          color: new THREE.Color(),
          intensity: 0,
        });
      }
    }

    return newArray;
  }

  /**
   * Resizes a shadow caster array to the new size, preserving existing data
   *
   * @param material The shader material containing the uniforms
   * @param newSize The new size for the array
   * @param currentArray The current array of shadow casters
   * @returns A new array of shadow casters with the specified size
   */
  static resizeShadowCasterArray(
    material: THREE.ShaderMaterial,
    newSize: number,
    currentArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }>,
  ): Array<{
    position: THREE.Vector3;
    radius: number;
  }> {
    const defineSize = Math.max(1, newSize);

    // Update the shader define if needed
    if (material.defines.MAX_SHADOW_CASTERS !== defineSize) {
      material.defines.MAX_SHADOW_CASTERS = defineSize;
      material.needsUpdate = true;
    }

    const newArray: Array<{
      position: THREE.Vector3;
      radius: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < defineSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          radius: 0,
        });
      }
    }

    return newArray;
  }

  /**
   * Converts LightSourcesMap to shader-compatible array format
   *
   * @param lightSources Map of light sources
   * @returns Array formatted for shader uniforms
   */
  static toShaderFormat(lightSources: LightSourcesMap): Array<{
    position: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> {
    const lights: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    for (const lightData of lightSources.values()) {
      lights.push({
        position: lightData.position.clone(),
        color: lightData.color.clone(),
        intensity: lightData.intensity ?? 1.0,
      });
    }

    return lights;
  }
}
