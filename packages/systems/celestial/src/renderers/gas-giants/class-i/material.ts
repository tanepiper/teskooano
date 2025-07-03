import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import { LightArrayUtils } from "../../base/CelestialRenderer";

import classIFragmentShader from "../../../shaders/gas-giants/class-i.fragment.glsl";
import classIVertexShader from "../../../shaders/gas-giants/class-i.vertex.glsl";

const lodToOctaveMap = [2, 3, 5, 8];

/**
 * Material for Class I gas giants (Ammonia Clouds) - Jupiter-like
 * Uses 4D fractal simplex noise based on example.
 * Supports dynamic numbers of lights and shadow casters.
 */
export class ClassIMaterial extends BaseGasGiantMaterial {
  private warpOctaves: number = 5;
  private colorOctaves: number = 3;

  constructor(options: {
    atmosphereColor: THREE.Color;
    cloudColor: THREE.Color;
    seed: string | number;
    stormMap?: THREE.Texture;
  }) {
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.4);

    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 16;
    const lights = Array(MAX_LIGHTS)
      .fill(0)
      .map(() => ({
        direction: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      }));
    const shadowCasters =
      LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);

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

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVertexShader,
      fragmentShader: classIFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    const newWarpOctaves = lodToOctaveMap[level];
    const newColorOctaves = lodToOctaveMap[Math.max(0, level - 1)];

    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves;
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves;
    }
  }
}
