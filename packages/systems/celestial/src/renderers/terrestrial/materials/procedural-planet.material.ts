import * as THREE from "three";
import type { ProceduralSurfaceProperties } from "@teskooano/data-types";

import { PlanetType } from "@teskooano/data-types";

import proceduralVertexShaderSource from "../../../shaders/terrestrial/procedural.vertex.glsl";
import proceduralFragmentShaderSource from "../../../shaders/terrestrial/procedural.fragment.glsl";

const MAX_LIGHTS = 4;

interface ProceduralPlanetUniforms {
  uNumLights: { value: number };
  uLightPositions: { value: THREE.Vector3[] };
  uLightColors: { value: THREE.Color[] };
  uLightIntensities: { value: number[] };
  uAmbientLightColor: { value: THREE.Color };
  uAmbientLightIntensity: { value: number };
  uCameraPosition: { value: THREE.Vector3 };

  persistence: { value: number };
  lacunarity: { value: number };
  uSimplePeriod: { value: number };
  uOctaves: { value: number };

  uColorLow: { value: THREE.Color };
  uColorMid1: { value: THREE.Color };
  uColorMid2: { value: THREE.Color };
  uColorHigh: { value: THREE.Color };

  uBumpScale: { value: number };

  uTime: { value: number };

  [key: string]: { value: any };
}

/**
 * Material for rendering procedurally generated terrestrial planet surfaces using shaders.
 */
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial {
  declare uniforms: ProceduralPlanetUniforms;

  constructor(
    surfaceProps: ProceduralSurfaceProperties & { bumpScale?: number },
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
      uAmbientLightIntensity: { value: 0.2 },
      uCameraPosition: { value: new THREE.Vector3() },

      persistence: { value: surfaceProps.persistence ?? 0.5 },
      lacunarity: { value: surfaceProps.lacunarity ?? 2.0 },
      uSimplePeriod: { value: surfaceProps.simplePeriod ?? 4.0 },
      uOctaves: { value: surfaceProps.octaves ?? 6 },

      uColorLow: { value: parseColor(surfaceProps.colorLow, "#5179B5") },
      uColorMid1: { value: parseColor(surfaceProps.colorMid1, "#4C9341") },
      uColorMid2: { value: parseColor(surfaceProps.colorMid2, "#836F27") },
      uColorHigh: { value: parseColor(surfaceProps.colorHigh, "#A0A0A0") },

      uBumpScale: { value: surfaceProps.bumpScale ?? 1 },

      uTime: { value: 0.0 },
    };

    super({
      uniforms,
      vertexShader: proceduralVertexShaderSource,
      fragmentShader: proceduralFragmentShaderSource,
      side: THREE.FrontSide,
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
