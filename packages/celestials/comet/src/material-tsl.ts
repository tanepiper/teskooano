import * as THREE from "three";
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from "three/webgpu";
import { uniform, color as colorNode, float, mul, add, sub } from "three/tsl";

// Simplified TSL materials for comets (WebGPU)

/**
 * TSL nucleus material - basic PBR for comet core
 */
export class CometNucleusNodeMaterial extends MeshStandardNodeMaterial {
  constructor(
    options: {
      colors?: THREE.Color[];
      roughness?: number;
      metalness?: number;
    } = {},
  ) {
    super();

    console.log(
      "[CometNucleusNodeMaterial] Creating WebGPU TSL nucleus material",
    );

    const baseColor = options.colors?.[0] ?? new THREE.Color(0x2c3e50);

    // Use standard PBR for nucleus
    this.colorNode = colorNode(baseColor);
    this.roughnessNode = float(options.roughness ?? 0.9);
    this.metalnessNode = float(options.metalness ?? 0.0);
  }
}

/**
 * TSL coma material - transparent glowing gas cloud
 */
export class CometComaNodeMaterial extends MeshBasicNodeMaterial {
  private colorUniform: any;
  private opacityUniform: any;
  private timeUniform: any;

  constructor(options: { color: THREE.Color; opacity: number }) {
    super();

    console.log("[CometComaNodeMaterial] Creating WebGPU TSL coma material");

    this.colorUniform = uniform(options.color);
    this.opacityUniform = uniform(options.opacity);
    this.timeUniform = uniform(0.0);

    // Coma is a simple glowing transparent sphere
    this.colorNode = this.colorUniform;
    this.opacityNode = this.opacityUniform;

    this.transparent = true;
    this.depthWrite = false;
    this.side = THREE.FrontSide;
  }

  updateTime(time: number): void {
    this.timeUniform.value = time;
  }

  updateOpacity(opacity: number): void {
    this.opacityUniform.value = opacity;
  }
}

/**
 * TSL particle material - additive blending particles for tail
 */
export class CometParticleNodeMaterial extends MeshBasicNodeMaterial {
  private colorUniform: any;

  constructor(options: { color: THREE.Color }) {
    super();

    console.log(
      "[CometParticleNodeMaterial] Creating WebGPU TSL particle material",
    );

    this.colorUniform = uniform(options.color);

    // Particles are simple additive blended points
    this.colorNode = this.colorUniform;

    this.transparent = true;
    this.blending = THREE.AdditiveBlending;
    this.depthWrite = false;
    this.depthTest = true;
  }
}

/**
 * TSL jet material - additive blending gas jets
 */
export class CometJetNodeMaterial extends MeshBasicNodeMaterial {
  private colorUniform: any;

  constructor(options: { color: THREE.Color }) {
    super();

    console.log("[CometJetNodeMaterial] Creating WebGPU TSL jet material");

    this.colorUniform = uniform(options.color);

    // Jets are additive particles
    this.colorNode = this.colorUniform;

    this.transparent = true;
    this.blending = THREE.AdditiveBlending;
    this.depthWrite = false;
    this.depthTest = true;
  }
}

/**
 * TSL simplified tail material - basic transparent mesh for LOD
 */
export class CometSimplifiedTailNodeMaterial extends MeshBasicNodeMaterial {
  private colorUniform: any;
  private opacityUniform: any;
  private timeUniform: any;

  constructor(options: { color: THREE.Color; opacity: number }) {
    super();

    console.log(
      "[CometSimplifiedTailNodeMaterial] Creating WebGPU TSL simplified tail material",
    );

    this.colorUniform = uniform(options.color);
    this.opacityUniform = uniform(options.opacity);
    this.timeUniform = uniform(0.0);

    // Simplified tail is a basic transparent mesh
    this.colorNode = this.colorUniform;
    this.opacityNode = this.opacityUniform;

    this.transparent = true;
    this.depthWrite = false;
  }

  updateTime(time: number): void {
    this.timeUniform.value = time;
  }
}
