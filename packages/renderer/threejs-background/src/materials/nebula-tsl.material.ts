/**
 * TSL material for nebula background effects
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, float, color } from "three/tsl";

/**
 * WebGPU TSL material for nebula effects
 */
export class NebulaTSLMaterial extends MeshBasicNodeMaterial {
  constructor(
    nebulaColor: THREE.Color = new THREE.Color(0x4444ff),
    opacity: number = 0.2,
  ) {
    super();

    this.colorNode = uniform(color(nebulaColor));
    this.opacityNode = uniform(float(opacity));

    this.transparent = true;
    this.depthWrite = false;
    this.blending = THREE.AdditiveBlending;
    this.side = THREE.DoubleSide;

    console.log("[NebulaTSLMaterial] Created WebGPU TSL nebula material");
  }
}
