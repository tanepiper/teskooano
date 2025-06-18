import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import classIVFragmentShader from "../../../shaders/gas-giants/class-iv.fragment.glsl";
import classIVVertexShader from "../../../shaders/gas-giants/class-iv.vertex.glsl";

const MAX_LIGHTS = 4;

/**
 * Material for Class IV gas giants (Alkali Metals / Dark)
 * Very low albedo.
 */
export class ClassIVMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    const lights: {
      direction: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }[] = [];
    for (let i = 0; i < MAX_LIGHTS; i++) {
      lights.push({
        direction: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      });
    }

    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        time: { value: 0 },

        uLights: { value: lights },
        uNumLights: { value: 0 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVVertexShader,
      fragmentShader: classIVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
