/**
 * TSL material for asteroids
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { uniform, float, color } from "three/tsl";

/**
 * WebGPU TSL material for asteroids
 */
export class AsteroidTSLMaterial extends MeshStandardNodeMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0x808080)) {
    super();

    this.colorNode = uniform(color(baseColor));
    this.roughnessNode = uniform(float(0.9)); // Asteroids are very rough
    this.metalnessNode = uniform(float(0.1)); // Slight metalness for minerals

    this.depthTest = true;
    this.depthWrite = true;

    console.log("[AsteroidTSLMaterial] Created WebGPU TSL asteroid material");
  }
}
