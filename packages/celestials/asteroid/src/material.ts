import * as THREE from "three";
import {
  LightArrayUtils,
  LightSourceData,
} from "@teskooano/renderer-threejs-celestial";

// Import shaders from external files
import nucleusVertexShader from "./shaders/nucleus.vertex.glsl?raw";
import nucleusFragmentShader from "./shaders/nucleus.fragment.glsl?raw";

const MAX_LIGHTS = 4;
const MAX_COLORS = 4;
const MAX_SHADOW_CASTERS = 4;

export interface AsteroidNucleusMaterialOptions {
  colors: THREE.Color[]; // An array of colors for the palette
  heights: number[]; // An array of height thresholds for each color
  noiseScale?: number; // Scale for the base color layering noise
  blendSharpness?: number; // How sharp the transitions between layers are
  craterScale?: number; // Scale for the crater noise
  craterStrength?: number; // How dark and prominent the craters are
  simplePeriod?: number; // Base frequency for the noise generation
  undulation?: number; // Controls the amount of surface undulation/waviness
  ambientStrength?: number;
  metallicFactor?: number;
  roughness?: number;
  specularColor?: THREE.Color;
}

export class AsteroidNucleusMaterial extends THREE.ShaderMaterial {
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

  constructor(options: AsteroidNucleusMaterialOptions) {
    if (options.colors.length > MAX_COLORS) {
      console.warn(
        `AsteroidNucleusMaterial: Number of colors (${options.colors.length}) exceeds the maximum of ${MAX_COLORS}. Truncating.`,
      );
      options.colors = options.colors.slice(0, MAX_COLORS);
    }

    const paddedColors = [...options.colors];
    const paddedHeights = [...options.heights];
    while (paddedColors.length < MAX_COLORS) {
      paddedColors.push(new THREE.Color(0x000000));
      paddedHeights.push(paddedHeights[paddedHeights.length - 1] ?? 1.0);
    }

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_COLORS: MAX_COLORS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
        NUM_COLORS: options.colors.length,
      },
      uniforms: {
        uColors: { value: paddedColors },
        uHeights: { value: paddedHeights },
        uNumColors: { value: options.colors.length },
        uNumLights: { value: 0 },
        uLights: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        // Shadow casting uniforms
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
        uNoiseScale: { value: options.noiseScale ?? 2.0 },
        uBlendSharpness: { value: options.blendSharpness ?? 1.0 },
        uCraterScale: { value: options.craterScale ?? 12.0 },
        uCraterStrength: { value: options.craterStrength ?? 0.5 },
        uSimplePeriod: { value: options.simplePeriod ?? 1.0 },
        uUndulation: { value: options.undulation ?? 0.1 },
        uAmbientStrength: { value: options.ambientStrength ?? 0.01 },
        uMetallicFactor: { value: options.metallicFactor ?? 0.0 },
        uRoughness: { value: options.roughness ?? 0.5 },
        uSpecularColor: {
          value: options.specularColor ?? new THREE.Color(0xffffff),
        },
        uCameraPosition: { value: new THREE.Vector3() },
        uTime: { value: 0.0 },
      },
      vertexShader: nucleusVertexShader,
      fragmentShader: nucleusFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  protected resizeLightArrays(newSize: number): void {
    this.uniforms.uLights.value = LightArrayUtils.resizeLightArray(
      this,
      newSize,
      this.uniforms.uLights.value,
    );
    this.currentNumLights = newSize;
  }

  protected resizeShadowCasterArrays(newSize: number): void {
    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
    this.currentNumShadowCasters = newSize;
  }

  update(
    time: number,
    timeScale: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.PerspectiveCamera,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    this.uniforms.uTime.value = time;
    if (camera) {
      this.uniforms.uCameraPosition.value.copy(camera.position);
    }

    const numLights = lightSources?.size ?? 0;
    if (numLights !== this.currentNumLights) {
      this.resizeLightArrays(numLights);
    }

    this.uniforms.uNumLights.value = numLights;
    if (lightSources) {
      let i = 0;
      for (const lightData of lightSources.values()) {
        this.uniforms.uLights.value[i].position.copy(lightData.position);
        this.uniforms.uLights.value[i].color.copy(lightData.color);
        this.uniforms.uLights.value[i].intensity = lightData.intensity ?? 1.0;
        i++;
      }
    }

    const numShadowCasters = shadowCasters?.length ?? 0;
    if (numShadowCasters !== this.currentNumShadowCasters) {
      this.resizeShadowCasterArrays(numShadowCasters);
    }

    this.uniforms.uNumShadowCasters.value = numShadowCasters;
    if (shadowCasters) {
      for (let i = 0; i < numShadowCasters; i++) {
        this.uniforms.uShadowCasters.value[i].position.copy(
          shadowCasters[i].position,
        );
        this.uniforms.uShadowCasters.value[i].radius = shadowCasters[i].radius;
      }
    }
  }
}
