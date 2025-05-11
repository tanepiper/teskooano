import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import * as THREE from "three";

import proceduralFragmentShaderSource from "../../../shaders/terrestrial/procedural.fragment.glsl";
import proceduralVertexShaderSource from "../../../shaders/terrestrial/procedural.vertex.glsl";
import { ProceduralPlanetUniforms } from "../../../types/procedural";

const MAX_LIGHTS = 4;

/**
 * Material for rendering procedurally generated terrestrial planet surfaces using shaders.
 */
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  declare uniforms: ProceduralPlanetUniforms;

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

    const uniforms: ProceduralPlanetUniforms = {
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
      uAmbientLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientLightIntensity: {
        value: surfaceProps.ambientLightIntensity ?? 0.2,
      },
      uCameraPosition: { value: new THREE.Vector3() },

      persistence: { value: surfaceProps.persistence ?? 0.5 },
      lacunarity: { value: surfaceProps.lacunarity ?? 2.0 },
      uSimplePeriod: { value: surfaceProps.simplePeriod ?? 4.0 },
      uOctaves: { value: surfaceProps.octaves ?? 6 },

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

      uTime: { value: 0.0 },
    };

    super({
      uniforms,
      vertexShader: proceduralVertexShaderSource,
      fragmentShader: proceduralFragmentShaderSource,
      precision: "highp",
    });
  }

  update(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    camera?: THREE.Camera,
  ): void {
    this.uniforms.uTime.value = time;
    if (camera) {
      this.uniforms.uCameraPosition.value.copy(camera.position);
    }

    const lightPositions = this.uniforms.uLightPositions?.value || [];
    const lightColors = this.uniforms.uLightColors?.value || [];

    if (!this.uniforms.uLightIntensities) {
      this.uniforms.uLightIntensities = { value: Array(MAX_LIGHTS).fill(1.0) };
    }
    const lightIntensities = this.uniforms.uLightIntensities.value;

    let numLights = 0;

    if (lightSources) {
      for (const [, /*id*/ lightData] of lightSources.entries()) {
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

    for (let i = numLights; i < MAX_LIGHTS; i++) {
      if (lightPositions[i]) lightPositions[i].set(0, 0, 0);
      if (lightColors[i]) lightColors[i].set(0, 0, 0);
      if (lightIntensities) lightIntensities[i] = 0.0;
    }
  }
}
