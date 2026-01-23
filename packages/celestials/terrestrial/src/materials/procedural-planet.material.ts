import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import * as THREE from "three";

import proceduralFragmentShaderSource from "../shaders/procedural.fragment.glsl";
import proceduralVertexShaderSource from "../shaders/procedural.vertex.glsl";
import type { ProceduralPlanetUniforms } from "../types/procedural";
import {
  LightArrayUtils,
  LightSourceData,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for rendering procedurally generated terrestrial planet surfaces using shaders.
 */
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  declare uniforms: ProceduralPlanetUniforms;
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

  constructor(surfaceProps: ProceduralSurfaceProperties = {} as ProceduralSurfaceProperties) {
    const parseColor = (
      hex: string | undefined,
      defaultColor: string,
    ): THREE.Color => {
      try {
        return new THREE.Color(hex ?? defaultColor);
      } catch (e) {
        console.warn(
          `Error parsing color ${hex}, using default ${defaultColor}`,
          e,
        );
        return new THREE.Color(defaultColor);
      }
    };

    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 4;

    const uniforms = {
      uNumLights: { value: 0 },
      uLights: {
        value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
      },
      uAmbientLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientLightIntensity: {
        value: surfaceProps.ambientLightIntensity ?? 0.03, // System-wide minimum ambient for "just enough glow"
      },
      uCameraPosition: { value: new THREE.Vector3() },

      // Shadow casting uniforms
      uNumShadowCasters: { value: 0 },
      uShadowCasters: {
        value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
      },

      persistence: { value: surfaceProps.persistence ?? 0.5 },
      lacunarity: { value: surfaceProps.lacunarity ?? 2.0 },
      uSimplePeriod: { value: surfaceProps.simplePeriod ?? 4.0 },
      uOctaves: { value: surfaceProps.octaves ?? 6 },
      uUndulation: { value: surfaceProps.undulation ?? 0.1 },

      uColor1: { value: parseColor(surfaceProps.color1, "#5179B5") },
      uColor2: { value: parseColor(surfaceProps.color2, "#4C9341") },
      uColor3: { value: parseColor(surfaceProps.color3, "#836F27") },
      uColor4: { value: parseColor(surfaceProps.color4, "#A0A0A0") },
      uColor5: { value: parseColor(surfaceProps.color5, "#FFFFFF") },

      uHeight1: { value: surfaceProps.height1 ?? 0.0 },
      uHeight2: { value: surfaceProps.height2 ?? 0.2 },
      uHeight3: { value: surfaceProps.height3 ?? 0.4 },
      uHeight4: { value: surfaceProps.height4 ?? 0.6 },
      uHeight5: { value: surfaceProps.height5 ?? 0.8 },

      uBumpScale: { value: surfaceProps.bumpScale ?? 1 },
      uRoughness: { value: surfaceProps.roughness ?? 0.5 },

      uShininess: { value: surfaceProps.shininess ?? 16.0 },
      uSpecularStrength: { value: surfaceProps.specularStrength ?? 0.3 },

      uTerrainType: { value: surfaceProps.terrainType ?? 2 },
      uTerrainAmplitude: { value: surfaceProps.terrainAmplitude ?? 1.0 },
      uTerrainSharpness: { value: surfaceProps.terrainSharpness ?? 1.0 },
      uTerrainOffset: { value: surfaceProps.terrainOffset ?? 0.0 },

      uTime: { value: 0.0 },
    };

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: uniforms as any,
      vertexShader: proceduralVertexShaderSource,
      fragmentShader: proceduralFragmentShaderSource,
      precision: "highp",
      depthTest: true,
      depthWrite: true, // Ensure planets write to depth buffer for proper occlusion
      transparent: false, // Planets should be opaque
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
