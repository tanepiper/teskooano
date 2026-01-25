import * as THREE from "three";
import type { PlanetAtmosphereProperties } from "@teskooano/data-types";

import atmosphereVertexShaderSource from "../shaders/atmosphere.vertex.glsl";
import atmosphereFragmentShaderSource from "../shaders/atmosphere.fragment.glsl";
import { LightingUniformPack } from "@teskooano/renderer-threejs-celestial";

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

    const lightArrays = LightingUniformPack.createLightArrays(MAX_LIGHTS);

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
          uNumLights: { value: 0 },
          uLightPositions: { value: lightArrays.positions },
          uLightColors: { value: lightArrays.colors },
          uLightIntensities: { value: lightArrays.intensities },
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

    LightingUniformPack.apply(
      {
        uNumLights: this.uniforms.uNumLights,
        uLightPositions: this.uniforms.uLightPositions,
        uLightColors: this.uniforms.uLightColors,
        uLightIntensities: this.uniforms.uLightIntensities,
      },
      lightSources,
      4,
    );
  }

  dispose(): void {
    super.dispose();
  }
}
