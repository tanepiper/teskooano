/**
 * TSL materials for comets
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, float, color } from "three/tsl";

/**
 * WebGPU TSL material for comet nucleus
 */
export class CometNucleusTSLMaterial extends MeshStandardNodeMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0x202020)) {
    super();

    this.colorNode = uniform(color(baseColor));
    this.roughnessNode = uniform(float(1.0)); // Very rough surface
    this.metalnessNode = uniform(float(0.0)); // Not metallic

    this.depthTest = true;
    this.depthWrite = true;

    console.log("[CometNucleusTSLMaterial] Created WebGPU TSL comet nucleus material");
  }
}

/**
 * WebGPU TSL material for comet coma (glowing cloud)
 */
export class CometComaTSLMaterial extends MeshBasicNodeMaterial {
  constructor(glowColor: THREE.Color = new THREE.Color(0x88CCFF), opacity: number = 0.3) {
    super();

    this.colorNode = uniform(color(glowColor));
    this.opacityNode = uniform(float(opacity));

    this.transparent = true;
    this.depthWrite = false;
    this.blending = THREE.AdditiveBlending;

    console.log("[CometComaTSLMaterial] Created WebGPU TSL comet coma material");
  }
}
