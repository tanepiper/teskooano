/**
 * TSL material for artificial satellites
 * @packageDocumentation
 */

import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { uniform, float, color } from "three/tsl";

/**
 * WebGPU TSL material for artificial satellites
 */
export class SatelliteTSLMaterial extends MeshStandardNodeMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xcccccc)) {
    super();

    this.colorNode = uniform(color(baseColor));
    this.roughnessNode = uniform(float(0.3)); // Smooth metallic surfaces
    this.metalnessNode = uniform(float(0.8)); // High metalness

    this.depthTest = true;
    this.depthWrite = true;

    console.log("[SatelliteTSLMaterial] Created WebGPU TSL satellite material");
  }
}
