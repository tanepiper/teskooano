import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, color as colorNode, float } from "three/tsl";

/**
 * Simplified TSL material for Schwarzschild black holes (WebGPU).
 * Provides basic visual representation without complex lensing effects.
 */
export class SchwarzschildBlackHoleNodeMaterial extends MeshBasicNodeMaterial {
  constructor() {
    super();

    console.log(
      "[SchwarzschildBlackHoleNodeMaterial] Creating WebGPU TSL black hole material",
    );

    // Black holes are completely black with no emission
    this.colorNode = colorNode(new THREE.Color(0x000000));
    this.transparent = false;
    this.depthWrite = true;
  }
}

/**
 * Simplified TSL material for Kerr black hole ergosphere (WebGPU).
 * Provides basic glowing effect around rotating black holes.
 */
export class ErgosphereNodeMaterial extends MeshBasicNodeMaterial {
  private colorUniform: any;
  private opacityUniform: any;

  constructor(options: { color?: THREE.Color; opacity?: number } = {}) {
    super();

    console.log(
      "[ErgosphereNodeMaterial] Creating WebGPU TSL ergosphere material",
    );

    this.colorUniform = uniform(options.color ?? new THREE.Color(0x4444ff));
    this.opacityUniform = uniform(options.opacity ?? 0.3);

    // Ergosphere is a semi-transparent glowing region
    this.colorNode = this.colorUniform;
    this.opacityNode = this.opacityUniform;

    this.transparent = true;
    this.blending = THREE.AdditiveBlending;
    this.depthWrite = false;
    this.side = THREE.BackSide;
  }
}

/**
 * Simplified TSL material for gravitational lensing effects (WebGPU).
 * Provides basic distortion visualization without complex ray tracing.
 */
export class GravitationalLensingNodeMaterial extends MeshBasicNodeMaterial {
  private strengthUniform: any;

  constructor(options: { strength?: number } = {}) {
    super();

    console.log(
      "[GravitationalLensingNodeMaterial] Creating WebGPU TSL lensing material",
    );

    this.strengthUniform = uniform(options.strength ?? 1.0);

    // Lensing effect is a semi-transparent distortion field
    this.colorNode = colorNode(new THREE.Color(0x222244));
    this.opacityNode = float(0.2);

    this.transparent = true;
    this.depthWrite = false;
    this.side = THREE.DoubleSide;
  }

  updateStrength(strength: number): void {
    this.strengthUniform.value = strength;
  }
}
