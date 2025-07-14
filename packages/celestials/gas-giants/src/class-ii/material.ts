import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

import classIIFragmentShader from "../shaders/class-ii.fragment.glsl";
import classIIVertexShader from "../shaders/class-ii.vertex.glsl";

const lodToOctaveMap = [2, 3, 5, 8];

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
    const lights = LightArrayUtils.createLightSourceArray(MAX_LIGHTS);
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

        stormMap: { value: options.textures?.stormMap },
        hasStormMap: { value: !!options.textures?.stormMap },
        uDynamicAmbientIntensity: { value: 0.25 }, // System-wide minimum ambient for "just enough glow"
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
