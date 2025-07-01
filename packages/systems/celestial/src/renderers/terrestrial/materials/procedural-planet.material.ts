import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import * as THREE from "three";

import proceduralFragmentShaderSource from "../../../shaders/terrestrial/procedural.fragment.glsl";
import proceduralVertexShaderSource from "../../../shaders/terrestrial/procedural.vertex.glsl";
import { ProceduralPlanetUniforms } from "../../../types/procedural";
import { LightSourceData } from "../../index";

/**
 * Material for rendering procedurally generated terrestrial planet surfaces using shaders.
 */
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  declare uniforms: ProceduralPlanetUniforms;
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

  constructor(surfaceProps: ProceduralSurfaceProperties) {
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
        value: Array(MAX_LIGHTS)
          .fill(0)
          .map(() => ({
            position: new THREE.Vector3(),
            color: new THREE.Color(1, 1, 1),
            intensity: 1.0,
          })),
      },
      uAmbientLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientLightIntensity: {
        value: surfaceProps.ambientLightIntensity ?? 0.2,
      },
      uCameraPosition: { value: new THREE.Vector3() },

      // Shadow casting uniforms
      uNumShadowCasters: { value: 0 },
      uShadowCasters: {
        value: Array(MAX_SHADOW_CASTERS)
          .fill(0)
          .map(() => ({
            position: new THREE.Vector3(),
            radius: 0,
          })),
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
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  protected resizeLightArrays(newSize: number): void {
    const defineSize = Math.max(1, newSize);
    if (this.defines.MAX_LIGHTS !== defineSize) {
      this.defines.MAX_LIGHTS = defineSize;
      this.needsUpdate = true;
    }

    const lights = [];
    for (let i = 0; i < defineSize; i++) {
      lights.push(
        this.uniforms.uLights.value[i] || {
          position: new THREE.Vector3(),
          color: new THREE.Color(1, 1, 1),
          intensity: 1.0,
        },
      );
    }
    this.uniforms.uLights.value = lights;
  }

  protected resizeShadowCasterArrays(newSize: number): void {
    const defineSize = Math.max(1, newSize);
    if (this.defines.MAX_SHADOW_CASTERS !== defineSize) {
      this.defines.MAX_SHADOW_CASTERS = defineSize;
      this.needsUpdate = true;
    }

    const shadowCasters = [];
    for (let i = 0; i < defineSize; i++) {
      shadowCasters.push(
        this.uniforms.uShadowCasters.value[i] || {
          position: new THREE.Vector3(),
          radius: 0,
        },
      );
    }
    this.uniforms.uShadowCasters.value = shadowCasters;
  }

  update(
    time: number,
    timeScale: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    this.uniforms.uTime.value = time;
    if (camera) {
      this.uniforms.uCameraPosition.value.copy(camera.position);
    }

    const numLights = lightSources?.size ?? 0;
    if (numLights !== this.currentNumLights) {
      this.resizeLightArrays(numLights);
      this.currentNumLights = numLights;
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
      this.currentNumShadowCasters = numShadowCasters;
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
