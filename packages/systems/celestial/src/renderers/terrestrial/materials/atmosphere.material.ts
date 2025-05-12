import * as THREE from "three";
import type { PlanetAtmosphereProperties } from "@teskooano/data-types";

import atmosphereVertexShaderSource from "../../../shaders/terrestrial/atmosphere.vertex.glsl";
import atmosphereFragmentShaderSource from "../../../shaders/terrestrial/atmosphere.fragment.glsl";

const MAX_LIGHTS = 4;

/**
 * Material for atmospheric scattering effect with support for multiple light sources
 */
export class AtmosphereMaterial extends THREE.ShaderMaterial {
  private parentId: string;

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

    super({
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
      },
      vertexShader: atmosphereVertexShaderSource,
      fragmentShader: atmosphereFragmentShaderSource,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.parentId = parentId;
  }

  /**
   * Update the material with the current time, camera position, and light sources
   */
  update(
    time: number,
    camera?: THREE.Camera,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
  ): void {
    if (camera) {
      this.uniforms.uCameraPosition.value.copy(camera.position);
    }

    const lightPositions = this.uniforms.uLightPositions?.value || [];
    const lightColors = this.uniforms.uLightColors?.value || [];
    const lightIntensities = this.uniforms.uLightIntensities?.value || [];

    let numLights = 0;

    if (lightSources) {
      for (const [, lightData] of lightSources.entries()) {
        if (numLights < MAX_LIGHTS) {
          if (lightPositions[numLights])
            lightPositions[numLights].copy(lightData.position);
          if (lightColors[numLights])
            lightColors[numLights].copy(lightData.color);
          if (lightIntensities)
            lightIntensities[numLights] = lightData.intensity;
          numLights++;
        } else {
          break;
        }
      }
    }

    if (this.uniforms.uNumLights) {
      this.uniforms.uNumLights.value = numLights;
    }

    // Reset unused light slots
    // for (let i = numLights; i < MAX_LIGHTS; i++) {
    //   if (lightPositions[i]) lightPositions[i].set(0, 0, 0);
    //   if (lightColors[i]) lightColors[i].set(0, 0, 0);
    //   if (lightIntensities) lightIntensities[i] = 0.0;
    // }
  }

  dispose(): void {
    super.dispose();
  }
}
