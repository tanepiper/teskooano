import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classVFragmentShader from "../../../shaders/gas-giants/class-v.fragment.glsl";
import classVVertexShader from "../../../shaders/gas-giants/class-v.vertex.glsl";

const MAX_LIGHTS = 4;

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
        emissiveColor: { value: options.emissiveColor },
        emissiveIntensity: { value: options.emissiveIntensity },
        time: { value: 0 },

        uLights: { value: lights },
        uNumLights: { value: 0 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classVVertexShader,
      fragmentShader: classVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}
