import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classIIIFragmentShader from "../../../shaders/gas-giants/class-iii.fragment.glsl";
import classIIIVertexShader from "../../../shaders/gas-giants/class-iii.vertex.glsl";

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 8;

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 */
export class ClassIIIMaterial extends BaseGasGiantMaterial {
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

    const shadowCasters: { position: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < MAX_SHADOW_CASTERS; i++) {
      shadowCasters.push({
        position: new THREE.Vector3(),
        radius: 0,
      });
    }

    super({
      uniforms: {
        baseColor: { value: options.baseColor },

        time: { value: 0 },

        uLights: { value: lights },
        uNumLights: { value: 0 },

        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIIIVertexShader,
      fragmentShader: classIIIFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
