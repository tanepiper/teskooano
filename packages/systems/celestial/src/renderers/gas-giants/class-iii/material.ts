import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classIIIFragmentShader from "../../../shaders/gas-giants/class-iii.fragment.glsl";
import classIIIVertexShader from "../../../shaders/gas-giants/class-iii.vertex.glsl";

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 */
export class ClassIIIMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },

        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIIIVertexShader,
      fragmentShader: classIIIFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
