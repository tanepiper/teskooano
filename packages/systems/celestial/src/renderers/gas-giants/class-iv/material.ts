import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import classIVFragmentShader from "../../../shaders/gas-giants/class-iv.fragment.glsl";
import classIVVertexShader from "../../../shaders/gas-giants/class-iv.vertex.glsl";

/**
 * Material for Class IV gas giants (Alkali Metals / Dark)
 * Very low albedo.
 */
export class ClassIVMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVVertexShader,
      fragmentShader: classIVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
