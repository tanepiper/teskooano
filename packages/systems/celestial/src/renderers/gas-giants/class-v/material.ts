import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classVFragmentShader from "../../../shaders/gas-giants/class-v.fragment.glsl";
import classVVertexShader from "../../../shaders/gas-giants/class-v.vertex.glsl";

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
 * Material for Class V gas giants (Silicate Clouds / Bright / Glowing)
 * High albedo, includes emissive component for heat.
 * Supports dynamic numbers of lights and shadow casters.
 */
export class ClassVMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color;
    emissiveColor: THREE.Color;
    emissiveIntensity: number;
    stormMap?: THREE.Texture;
  }) {
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
        emissiveColor: { value: options.emissiveColor },
        emissiveIntensity: { value: options.emissiveIntensity },
        time: { value: 0 },

        uLights: { value: lights },
        uNumLights: { value: 0 },

        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classVVertexShader,
      fragmentShader: classVFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {}
}
