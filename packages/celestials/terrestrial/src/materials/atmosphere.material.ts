import * as THREE from "three";
import type { PlanetAtmosphereProperties } from "@teskooano/data-types";

import atmosphereVertexShaderSource from "../shaders/atmosphere.vertex.glsl";
import atmosphereFragmentShaderSource from "../shaders/atmosphere.fragment.glsl";
import {
  LightArrayUtils,
  LightSourceData,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for atmospheric scattering effect with support for multiple light sources
 */
export class AtmosphereMaterial extends THREE.ShaderMaterial {
  private parentId: string;
  protected currentNumLights: number = 0;

  constructor(
    atmosphereProps: PlanetAtmosphereProperties & {
      aberrationIntensity?: number;
    },
    options: {
      planetRadius?: number;
      parentId?: string;
    } = {},
  ) {
    const {
      glowColor = "#fefefe",
      intensity = 1.0,
      power = 2.0,
      thickness = 0.1,
      aberrationIntensity = 1,
    } = atmosphereProps;

    const { planetRadius = 1.0, parentId = "unknown" } = options;
    const MAX_LIGHTS = 4;

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
      },
      uniforms: {
        // Atmosphere properties
        glowColor: { value: new THREE.Color(glowColor) },
        intensity: { value: intensity },
        power: { value: power },
        atmosphereThickness: { value: thickness },
        planetRadius: { value: planetRadius },
        aberrationIntensity: { value: aberrationIntensity },

        // Light properties
        uNumLights: { value: 0 },
        uLightPositions: {
          value: Array(MAX_LIGHTS)
            .fill(0)
            .map(() => new THREE.Vector3()),
        },
        uLightColors: {
          value: Array(MAX_LIGHTS)
            .fill(0)
            .map(() => new THREE.Color(1, 1, 1)),
        },
        uLightIntensities: { value: Array(MAX_LIGHTS).fill(1.0) },

        // Camera
        uCameraPosition: { value: new THREE.Vector3() },
        uTime: { value: 0.0 },
      },
      vertexShader: atmosphereVertexShaderSource,
      fragmentShader: atmosphereFragmentShaderSource,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: true,
    });

    this.parentId = parentId;
    this.currentNumLights = MAX_LIGHTS;
  }

  protected resizeLightArrays(newSize: number): void {
    const defineSize = Math.max(1, newSize);
    if (this.defines.MAX_LIGHTS !== defineSize) {
      this.defines.MAX_LIGHTS = defineSize;
      this.needsUpdate = true;
    }

    // Since the atmosphere material uses separate arrays for positions, colors, and intensities,
    // we need to handle each array separately rather than using LightArrayUtils directly
    const lightPositions = [];
    const lightColors = [];
    const lightIntensities = [];

    for (let i = 0; i < defineSize; i++) {
      lightPositions.push(
        this.uniforms.uLightPositions.value[i] || new THREE.Vector3(),
      );
      lightColors.push(
        this.uniforms.uLightColors.value[i] || new THREE.Color(1, 1, 1),
      );
      lightIntensities.push(this.uniforms.uLightIntensities.value[i] ?? 1.0);
    }

    this.uniforms.uLightPositions.value = lightPositions;
    this.uniforms.uLightColors.value = lightColors;
    this.uniforms.uLightIntensities.value = lightIntensities;
  }

  /**
   * Update the material with the current time, camera position, and light sources
   */
  update(
    time: number,
    timeScale: number,
    camera?: THREE.PerspectiveCamera,
    lightSources?: Map<string, LightSourceData>,
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
        this.uniforms.uLightPositions.value[i].copy(lightData.position);
        this.uniforms.uLightColors.value[i].copy(lightData.color);
        this.uniforms.uLightIntensities.value[i] = lightData.intensity ?? 1.0;
        i++;
      }
    }
  }

  dispose(): void {
    super.dispose();
  }
}
