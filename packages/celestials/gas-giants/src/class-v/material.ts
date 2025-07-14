import * as THREE from "three";
import { BaseGasGiantMaterial } from "../base";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

import classVFragmentShader from "../shaders/class-v.fragment.glsl";
import classVVertexShader from "../shaders/class-v.vertex.glsl";

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
    const lights = LightArrayUtils.createLightSourceArray(MAX_LIGHTS);
    const shadowCasters =
      LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);

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
        uDynamicAmbientIntensity: { value: 0.25 }, // System-wide minimum ambient for "just enough glow"
      },
      vertexShader: classVVertexShader,
      fragmentShader: classVFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  updateLOD(lodLevel: number): void {}
}
