/**
 * TSL material for asteroid field particle systems
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, float, color, instanceIndex } from "three/tsl";

/**
 * WebGPU TSL material for asteroid field particles
 */
export class AsteroidFieldTSLMaterial extends MeshBasicNodeMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0x888888)) {
    super();

    this.colorNode = uniform(color(baseColor));
    this.transparent = false;
    this.depthWrite = true;

    console.log("[AsteroidFieldTSLMaterial] Created WebGPU TSL asteroid field material");
  }
}
