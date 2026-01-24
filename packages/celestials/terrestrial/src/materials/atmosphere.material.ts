import * as THREE from "three";
import type { PlanetAtmosphereProperties } from "@teskooano/data-types";

import atmosphereVertexShaderSource from "../shaders/atmosphere.vertex.glsl";
import atmosphereFragmentShaderSource from "../shaders/atmosphere.fragment.glsl";

/**
 * Material for atmospheric scattering effect with support for multiple light sources
 * using Three.js internal lighting system.
 */
export class AtmosphereMaterial extends THREE.ShaderMaterial {
  private parentId: string;

  constructor(
    atmosphereProps: PlanetAtmosphereProperties & {
      aberrationIntensity?: number;
      opacity?: number;
    } = {} as PlanetAtmosphereProperties,
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
      opacity = 1.0,
    } = atmosphereProps ?? {};

    const { planetRadius = 1.0, parentId = "unknown" } = options;
    const MAX_LIGHTS = 4;

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
      },
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
          glowColor: { value: new THREE.Color(glowColor) },
          intensity: { value: intensity },
          power: { value: power },
          atmosphereThickness: { value: thickness },
          planetRadius: { value: planetRadius },
          aberrationIntensity: { value: aberrationIntensity },
          opacity: { value: opacity },
          uTime: { value: 0.0 },
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
        },
      ]),
      vertexShader: atmosphereVertexShaderSource,
      fragmentShader: atmosphereFragmentShaderSource,
      lights: true,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.parentId = parentId;
  }

  /**
   * Update the material with the current time
   */
  public update(
    time: number,
    _timeScale: number,
    _camera?: THREE.PerspectiveCamera,
    lightSources?: Map<string, any>,
  ): void {
    this.uniforms.uTime.value = time;

    if (lightSources && lightSources.size > 0) {
      const lights = Array.from(lightSources.values());
      const numLights = Math.min(lights.length, 4); // MAX_LIGHTS is 4

      this.uniforms.uNumWorldLights.value = numLights;

      for (let i = 0; i < 4; i++) {
        if (i < numLights) {
          const lightSource = lights[i];
          this.uniforms.uWorldLightPositions.value[i].copy(
            lightSource.position,
          );
          this.uniforms.uWorldLightColors.value[i].copy(lightSource.color);
          this.uniforms.uWorldLightIntensities.value[i] = lightSource.intensity;
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
  }

  dispose(): void {
    super.dispose();
  }
}
