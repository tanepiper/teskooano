import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classVFragmentShader from "../../../shaders/gas-giants/class-v.fragment.glsl";
import classVVertexShader from "../../../shaders/gas-giants/class-v.vertex.glsl";

/**
 * Material for Class V gas giants (Silicate Clouds / Bright / Glowing)
 * High albedo, includes emissive component for heat.
 */
export class ClassVMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color;
    emissiveColor: THREE.Color;
    emissiveIntensity: number;
    stormMap?: THREE.Texture;
  }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        emissiveColor: { value: options.emissiveColor },
        emissiveIntensity: { value: options.emissiveIntensity },
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classVVertexShader,
      fragmentShader: classVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
