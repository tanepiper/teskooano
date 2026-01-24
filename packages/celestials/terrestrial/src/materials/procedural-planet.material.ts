import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import * as THREE from "three";

import proceduralFragmentShaderSource from "../shaders/procedural.fragment.glsl";
import proceduralVertexShaderSource from "../shaders/procedural.vertex.glsl";
import type { ProceduralPlanetUniforms } from "../types/procedural";
import {
  LightArrayUtils,
  LightSourceData,
} from "@teskooano/renderer-threejs-celestial";

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 4;

/**
 * Material for rendering procedurally generated terrestrial planet surfaces using shaders.
 */
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  declare uniforms: ProceduralPlanetUniforms;
  protected currentNumShadowCasters: number = 0;

  constructor(
    surfaceProps: ProceduralSurfaceProperties = {} as ProceduralSurfaceProperties,
  ) {
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
      uAmbientLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientLightIntensity: {
        value: surfaceProps.ambientLightIntensity ?? 0.03, // System-wide minimum ambient for "just enough glow"
      },
      uTime: { value: 0.0 },

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
      uPrimaryLightDirection: { value: new THREE.Vector3(1, 0, 0) },
      uNumWorldLights: { value: 0 },
      uWorldLightPositions: {
        value: Array(MAX_LIGHTS)
          .fill(0)
          .map(() => new THREE.Vector3(0, 0, 0)),
      },
      uWorldLightColors: {
        value: Array(MAX_LIGHTS)
          .fill(0)
          .map(() => new THREE.Color(0xffffff)),
      },
      uWorldLightIntensities: {
        value: new Float32Array(MAX_LIGHTS).fill(0),
      },
    };

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, uniforms]),
      vertexShader: proceduralVertexShaderSource,
      fragmentShader: proceduralFragmentShaderSource,
      lights: true, // Enable Three.js internal lighting system
      precision: "highp",
      depthTest: true,
      depthWrite: true, // Ensure planets write to depth buffer for proper occlusion
      transparent: false, // Planets should be opaque
    });

    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
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

  public update(
    time: number,
    timeScale: number,
    lightSources?: Map<string, any>,
    camera?: THREE.PerspectiveCamera,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    this.uniforms.uTime.value = time;

    if (lightSources && lightSources.size > 0) {
      const lights = Array.from(lightSources.values());
      const planetPos =
        (this as any).planetPosition || new THREE.Vector3(0, 0, 0);
      const numLights = Math.min(lights.length, MAX_LIGHTS);

      this.uniforms.uNumWorldLights.value = numLights;

      for (let i = 0; i < MAX_LIGHTS; i++) {
        if (i < numLights) {
          const lightSource = lights[i];
          this.uniforms.uWorldLightPositions.value[i].copy(
            lightSource.position,
          );
          this.uniforms.uWorldLightColors.value[i].copy(lightSource.color);
          this.uniforms.uWorldLightIntensities.value[i] = lightSource.intensity;

          if (i === 0) {
            // Legacy/Shadow support: direction from planet to first sun
            this.uniforms.uPrimaryLightDirection.value
              .subVectors(lightSource.position, planetPos)
              .normalize();
          }
        } else {
          // Zero out unused slots
          this.uniforms.uWorldLightPositions.value[i].set(0, 0, 0);
          this.uniforms.uWorldLightColors.value[i].set(0, 0, 0);
          this.uniforms.uWorldLightIntensities.value[i] = 0;
        }
      }
    } else {
      this.uniforms.uNumWorldLights.value = 0;
    }

    const numShadowCasters = shadowCasters?.length ?? 0;
    this.uniforms.uNumShadowCasters.value = numShadowCasters;
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
