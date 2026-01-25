import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import {
  LightArrayUtils,
  LightingUniformPack,
} from "@teskooano/renderer-threejs-celestial";

import classIIIFragmentShader from "../shaders/class-iii.fragment.glsl";
import classIIIVertexShader from "../shaders/class-iii.vertex.glsl";

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 * Supports dynamic numbers of lights and shadow casters.
 */
export class ClassIIIMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 16;
    const lights = LightingUniformPack.createLightArrays(MAX_LIGHTS);
    const shadowCasters =
      LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: {
        baseColor: { value: options.baseColor },

        time: { value: 0 },

        uLightPositions: { value: lights.positions },
        uLightColors: { value: lights.colors },
        uLightIntensities: { value: lights.intensities },
        uNumLights: { value: 0 },

        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
        uAmbientColor: { value: new THREE.Color(0xffffff) },
        uAmbientIntensity: { value: 0.03 }, // System-wide minimum ambient for "just enough glow"
      },
      vertexShader: classIIIVertexShader,
      fragmentShader: classIIIFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {}
}
