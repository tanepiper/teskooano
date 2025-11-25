/**
 * TSL material for black hole gravitational lensing effects
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, float, color } from "three/tsl";

/**
 * WebGPU TSL material for black hole visual effects
 */
export class BlackHoleTSLMaterial extends MeshBasicNodeMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0x000000)) {
    super();

    this.colorNode = uniform(color(baseColor));
    this.opacityNode = uniform(float(1.0));

    this.transparent = false;
    this.depthWrite = true;
    this.side = THREE.FrontSide;

    console.log(
      "[BlackHoleTSLMaterial] Created WebGPU TSL black hole material",
    );
  }
}
