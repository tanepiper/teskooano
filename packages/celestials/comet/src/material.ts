import * as THREE from "three";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

// Import shaders from external files
import nucleusVertexShader from "./shaders/nucleus.vertex.glsl?raw";
import nucleusFragmentShader from "./shaders/nucleus.fragment.glsl?raw";
import comaVertexShader from "./shaders/coma.vertex.glsl?raw";
import comaFragmentShader from "./shaders/coma.fragment.glsl?raw";
import particleVertexShader from "./shaders/particle.vertex.glsl?raw";
import particleFragmentShader from "./shaders/particle.fragment.glsl?raw";
import jetVertexShader from "./shaders/jet.vertex.glsl?raw";
import jetFragmentShader from "./shaders/jet.fragment.glsl?raw";
import simplifiedTailVertexShader from "./shaders/simplified-tail.vertex.glsl?raw";
import simplifiedTailFragmentShader from "./shaders/simplified-tail.fragment.glsl?raw";

const MAX_LIGHTS = 4;
const MAX_COLORS = 4;

export interface CometNucleusMaterialOptions {
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

export class CometNucleusMaterial extends THREE.ShaderMaterial {
  constructor(options: CometNucleusMaterialOptions) {
    if (options.colors.length > MAX_COLORS) {
      console.warn(
        `CometNucleusMaterial: Number of colors (${options.colors.length}) exceeds the maximum of ${MAX_COLORS}. Truncating.`,
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
        uCameraPosition: { value: new THREE.Vector3() },
      },
      vertexShader: nucleusVertexShader,
      fragmentShader: nucleusFragmentShader,
    });
  }
}

export class CometComaMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color; opacity: number }) {
    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
      },
      uniforms: {
        uColor: { value: options.color },
        uOpacity: { value: options.opacity },
        uTime: { value: 0.0 },
        uNumLights: { value: 0 },
        uLights: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
      },
      vertexShader: comaVertexShader,
      fragmentShader: comaFragmentShader,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }
}

export class CometParticleMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color }) {
    super({
      uniforms: {
        uColor: { value: options.color },
        uLightIntensity: { value: 1.0 },
        uAmbientStrength: { value: 0.01 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending, // Use additive for a brighter, glowing effect
      depthWrite: false,
    });
  }
}

export class CometJetMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color }) {
    super({
      uniforms: {
        uColor: { value: options.color },
        uLightPosition: { value: new THREE.Vector3() },
        uLightColor: { value: new THREE.Color(0xffffff) },
        uLightIntensity: { value: 1.0 },
        uAmbientStrength: { value: 0.01 },
      },
      vertexShader: jetVertexShader,
      fragmentShader: jetFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
}

export class CometSimplifiedTailMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color; opacity: number }) {
    super({
      uniforms: {
        uColor: { value: options.color },
        uOpacity: { value: options.opacity },
        uTime: { value: 0.0 },
      },
      vertexShader: simplifiedTailVertexShader,
      fragmentShader: simplifiedTailFragmentShader,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }
}
