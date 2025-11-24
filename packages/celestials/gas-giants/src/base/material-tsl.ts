/**
 * TSL-based gas giant material for WebGPU rendering.
 *
 * This is a simplified version that provides basic gas giant rendering
 * with WebGPU compatibility. Full procedural atmospheres will be added
 * in future iterations.
 *
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { uniform, float } from "three/tsl";

/**
 * Options for creating a basic WebGPU gas giant material
 */
export interface BasicGasGiantNodeMaterialOptions {
  /** Base color of the gas giant */
  baseColor: THREE.Color;
  /** Cloud/atmosphere color */
  cloudColor?: THREE.Color;
  /** Emissive color for hot Jupiters (Class V) */
  emissiveColor?: THREE.Color;
  /** Emissive intensity */
  emissiveIntensity?: number;
  /** Roughness (0-1) */
  roughness?: number;
  /** Metalness (0-1) */
  metalness?: number;
}

/**
 * Basic WebGPU-compatible gas giant material using TSL.
 *
 * This provides a simplified rendering suitable for WebGPU while
 * maintaining visual quality. Full procedural atmospheres will be
 * migrated to TSL in future updates.
 *
 * Features:
 * - PBR-based rendering via MeshStandardNodeMaterial
 * - Automatic lighting integration
 * - Optional emissive properties for hot Jupiters
 * - LOD-compatible performance
 */
export class BasicGasGiantNodeMaterial extends MeshStandardNodeMaterial {
  constructor(options: BasicGasGiantNodeMaterialOptions) {
    super();

    console.log(
      "[BasicGasGiantNodeMaterial] Creating WebGPU TSL gas giant material",
    );

    // Set base color
    this.colorNode = uniform(options.baseColor);

    // Set PBR properties
    this.roughnessNode = uniform(options.roughness ?? 0.8);
    this.metalnessNode = uniform(options.metalness ?? 0.0);

    // Add emissive properties if provided (for hot Jupiters)
    if (options.emissiveColor && options.emissiveIntensity) {
      this.emissiveNode = uniform(
        options.emissiveColor.clone().multiplyScalar(options.emissiveIntensity),
      );
    }

    // TODO: Add procedural noise-based atmosphere in future TSL migration
    // TODO: Add dynamic lighting array support
    // TODO: Add shadow casting support
  }

  /**
   * Update material time uniform (placeholder for future animation)
   */
  updateTime(time: number): void {
    // TODO: Implement time-based animation when procedural effects are added
  }

  /**
   * Update LOD level (placeholder for future optimization)
   */
  updateLOD(lodLevel: number): void {
    // TODO: Implement LOD-based quality adjustments
  }
}
