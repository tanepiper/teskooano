import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classIIIFragmentShader from "../../../shaders/gas-giants/class-iii.fragment.glsl";
import classIIIVertexShader from "../../../shaders/gas-giants/class-iii.vertex.glsl";

/**
 * Create initial arrays for lights and shadow casters with reasonable starting sizes
 */
function createInitialLightArray(initialSize: number = 4): Array<{
  direction: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
}> {
  const lights: Array<{
    direction: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> = [];

  for (let i = 0; i < initialSize; i++) {
    lights.push({
      direction: new THREE.Vector3(),
      color: new THREE.Color(),
      intensity: 0,
    });
  }

  return lights;
}

function createInitialShadowCasterArray(initialSize: number = 8): Array<{
  position: THREE.Vector3;
  radius: number;
}> {
  const shadowCasters: Array<{ position: THREE.Vector3; radius: number }> = [];

  for (let i = 0; i < initialSize; i++) {
    shadowCasters.push({
      position: new THREE.Vector3(),
      radius: 0,
    });
  }

  return shadowCasters;
}

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 * Supports dynamic numbers of lights and shadow casters.
 */
export class ClassIIIMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 16;
    const lights = createInitialLightArray(MAX_LIGHTS);
    const shadowCasters = createInitialShadowCasterArray(MAX_SHADOW_CASTERS); // Start with more for gas giants with many moons

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
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

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {}
}
