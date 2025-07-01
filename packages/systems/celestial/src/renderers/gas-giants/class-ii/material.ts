import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";

import classIIFragmentShader from "../../../shaders/gas-giants/class-ii.fragment.glsl";
import classIIVertexShader from "../../../shaders/gas-giants/class-ii.vertex.glsl";

const lodToOctaveMap = [2, 3, 5, 8];

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
 * Material for Class II gas giants (Water Clouds) - Using the new shaders
 * Supports dynamic numbers of lights and shadow casters.
 */
export class ClassIIMaterial extends BaseGasGiantMaterial {
  private warpOctaves: number = 5;
  private colorOctaves: number = 3;

  constructor(options: {
    atmosphereColor: THREE.Color;
    cloudColor: THREE.Color;
    seed: string | number;
    textures?: {
      stormMap?: THREE.Texture;
      cloudMap?: THREE.Texture;
      detailMap?: THREE.Texture;
    };
  }) {
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.35);

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
        mainColor1: { value: options.atmosphereColor },
        mainColor2: { value: options.cloudColor },
        darkColor: { value: darkColor },

        uSeed: { value: options.seed },

        time: { value: 0 },

        uLights: { value: lights },
        uNumLights: { value: 0 },

        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },

        uWarpOctaves: { value: 5 },
        uColorOctaves: { value: 3 },

        stormMap: { value: options.textures?.stormMap },
        hasStormMap: { value: !!options.textures?.stormMap },
      },
      vertexShader: classIIVertexShader,
      fragmentShader: classIIFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    const newWarpOctaves = lodToOctaveMap[level];

    const newColorOctaves = lodToOctaveMap[Math.max(0, level)];

    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves;
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves;
    }
  }

  dispose(): void {
    if (this.uniforms.stormMap?.value) {
      this.uniforms.stormMap.value.dispose();
    }

    super.dispose();
  }
}
