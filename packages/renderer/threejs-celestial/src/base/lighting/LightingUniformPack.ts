import * as THREE from "three";
import type { LightSourcesMap } from "./LightingCalculator";

export interface LightingUniforms {
  uNumLights: { value: number };
  uLightPositions: { value: THREE.Vector3[] };
  uLightColors: { value: THREE.Color[] };
  uLightIntensities: { value: Float32Array | number[] };
  uAmbientColor?: { value: THREE.Color };
}

export class LightingUniformPack {
  static createLightArrays(maxLights: number): {
    positions: THREE.Vector3[];
    colors: THREE.Color[];
    intensities: Float32Array;
  } {
    return {
      positions: Array.from({ length: maxLights }, () => new THREE.Vector3()),
      colors: Array.from({ length: maxLights }, () => new THREE.Color()),
      intensities: new Float32Array(maxLights),
    };
  }

  static apply(
    uniforms: LightingUniforms,
    lightSources: LightSourcesMap | undefined,
    maxLights: number,
  ): THREE.Color {
    const lights = lightSources ? Array.from(lightSources.values()) : [];
    return this.applyFromArray(uniforms, lights, maxLights);
  }

  static applyFromArray(
    uniforms: LightingUniforms,
    lights: Array<{
      position: THREE.Vector3;
      color: THREE.Color;
      intensity?: number;
    }>,
    maxLights: number,
  ): THREE.Color {
    const numLights = Math.min(lights.length, maxLights);
    uniforms.uNumLights.value = numLights;

    for (let i = 0; i < maxLights; i++) {
      if (i < numLights) {
        const light = lights[i];
        uniforms.uLightPositions.value[i].copy(light.position);
        uniforms.uLightColors.value[i].copy(light.color);
        this.setIntensity(uniforms.uLightIntensities.value, i, light.intensity);
      } else {
        uniforms.uLightPositions.value[i].set(0, 0, 0);
        uniforms.uLightColors.value[i].set(0, 0, 0);
        this.setIntensity(uniforms.uLightIntensities.value, i, 0);
      }
    }

    const ambientColor =
      uniforms.uAmbientColor?.value ?? new THREE.Color(1, 1, 1);
    this.applyAmbientMix(ambientColor, lights);
    if (uniforms.uAmbientColor) {
      uniforms.uAmbientColor.value.copy(ambientColor);
    }
    return ambientColor;
  }

  private static applyAmbientMix(
    ambientColor: THREE.Color,
    lights: Array<{ color: THREE.Color; intensity?: number }>,
  ): void {
    let totalIntensity = 0;
    const tempColor = new THREE.Color();
    ambientColor.set(0, 0, 0);

    lights.forEach((light) => {
      const intensity = light.intensity ?? 1.0;
      if (intensity <= 0) return;
      tempColor.copy(light.color).multiplyScalar(intensity);
      ambientColor.add(tempColor);
      totalIntensity += intensity;
    });

    if (totalIntensity > 0) {
      ambientColor.multiplyScalar(1 / totalIntensity);
    } else {
      ambientColor.set(1, 1, 1);
    }
  }

  private static setIntensity(
    intensities: Float32Array | number[],
    index: number,
    value?: number,
  ): void {
    const normalizedValue = value ?? 0;
    if (intensities instanceof Float32Array) {
      intensities[index] = normalizedValue;
    } else {
      intensities[index] = normalizedValue;
    }
  }
}
