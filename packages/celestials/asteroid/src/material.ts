import * as THREE from "three";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

// Import shaders from external files
import nucleusVertexShader from "./shaders/nucleus.vertex.glsl?raw";
import nucleusFragmentShader from "./shaders/nucleus.fragment.glsl?raw";

const MAX_LIGHTS = 4;
const MAX_COLORS = 4;

export interface AsteroidNucleusMaterialOptions {
  colors: THREE.Color[]; // An array of colors for the palette
  heights: number[]; // An array of height thresholds for each color
  noiseScale?: number; // Scale for the base color layering noise
  blendSharpness?: number; // How sharp the transitions between layers are
  craterScale?: number; // Scale for the crater noise
  craterStrength?: number; // How dark and prominent the craters are
  simplePeriod?: number; // Base frequency for the noise generation
  undulation?: number; // Controls the amount of surface undulation/waviness
  ambientStrength?: number;
  metallicFactor?: number;
  roughness?: number;
  specularColor?: THREE.Color;
}

export class AsteroidNucleusMaterial extends THREE.ShaderMaterial {
  constructor(options: AsteroidNucleusMaterialOptions) {
    if (options.colors.length > MAX_COLORS) {
      console.warn(
        `AsteroidNucleusMaterial: Number of colors (${options.colors.length}) exceeds the maximum of ${MAX_COLORS}. Truncating.`,
      );
      options.colors = options.colors.slice(0, MAX_COLORS);
    }

    const paddedColors = [...options.colors];
    const paddedHeights = [...options.heights];
    while (paddedColors.length < MAX_COLORS) {
      paddedColors.push(new THREE.Color(0x000000));
      paddedHeights.push(paddedHeights[paddedHeights.length - 1] ?? 1.0);
    }

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_COLORS: MAX_COLORS,
        NUM_COLORS: options.colors.length,
      },
      uniforms: {
        uColors: { value: paddedColors },
        uHeights: { value: paddedHeights },
        uNumColors: { value: options.colors.length },
        uNumLights: { value: 0 },
        uLights: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        uNoiseScale: { value: options.noiseScale ?? 2.0 },
        uBlendSharpness: { value: options.blendSharpness ?? 1.0 },
        uCraterScale: { value: options.craterScale ?? 12.0 },
        uCraterStrength: { value: options.craterStrength ?? 0.5 },
        uSimplePeriod: { value: options.simplePeriod ?? 1.0 },
        uUndulation: { value: options.undulation ?? 0.1 },
        uAmbientStrength: { value: options.ambientStrength ?? 0.01 },
        uMetallicFactor: { value: options.metallicFactor ?? 0.0 },
        uRoughness: { value: options.roughness ?? 0.5 },
        uSpecularColor: {
          value: options.specularColor ?? new THREE.Color(0xffffff),
        },
      },
      vertexShader: nucleusVertexShader,
      fragmentShader: nucleusFragmentShader,
    });
  }
}
