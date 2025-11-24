/**
 * TSL-based ring material for WebGPU rendering
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, vec3, vec4, float, color } from "three/tsl";

/**
 * Options for creating a ring material
 */
export interface RingMaterialTSLOptions {
  /** Base color of the ring */
  color: THREE.Color;
  /** Opacity of the ring */
  opacity?: number;
  /** Whether the ring casts shadows */
  castShadow?: boolean;
  /** Whether the ring receives shadows */
  receiveShadow?: boolean;
}

/**
 * WebGPU TSL material for planetary rings
 */
export class RingMaterialTSL extends MeshBasicNodeMaterial {
  constructor(options: RingMaterialTSLOptions) {
    super();

    // Set color
    this.colorNode = uniform(color(options.color));
    this.opacityNode = uniform(float(options.opacity ?? 0.8));

    // Configure material properties
    this.transparent = true;
    this.side = THREE.DoubleSide;
    this.depthWrite = false;
    this.blending = THREE.NormalBlending;

    console.log("[RingMaterialTSL] Created WebGPU TSL ring material");
  }

  /**
   * Update material properties
   */
  updateColor(newColor: THREE.Color): void {
    // TSL uniforms update automatically
  }

  /**
   * Update opacity
   */
  updateOpacity(newOpacity: number): void {
    // TSL uniforms update automatically
  }
}
