import * as THREE from "three";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

// Import shaders from external files
import nucleusVertexShader from "./shaders/nucleus.vertex.glsl?raw";
import nucleusFragmentShader from "./shaders/nucleus.fragment.glsl?raw";

const MAX_LIGHTS = 4;

export interface AsteroidNucleusMaterialOptions {
  color: THREE.Color;
  darkColorMultiplier?: number;
  lightColorMultiplier?: number;
  fbmScale?: number;
  fineFbmScale?: number;
  fineFbmMix?: number;
  ambientStrength?: number;
  metallicFactor?: number;
  roughness?: number;
  specularColor?: THREE.Color;
}

export class AsteroidNucleusMaterial extends THREE.ShaderMaterial {
  constructor(options: AsteroidNucleusMaterialOptions) {
    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
      },
      uniforms: {
        uColor: { value: options.color },
        uNumLights: { value: 0 },
        uLights: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        uDarkColorMultiplier: { value: options.darkColorMultiplier ?? 0.5 },
        uLightColorMultiplier: { value: options.lightColorMultiplier ?? 1.5 },
        uFbmScale: { value: options.fbmScale ?? 0.8 },
        uFineFbmScale: { value: options.fineFbmScale ?? 8.0 },
        uFineFbmMix: { value: options.fineFbmMix ?? 0.2 },
        uAmbientStrength: { value: options.ambientStrength ?? 0.01 }, // Minimal ambient light
        uDynamicAmbientIntensity: { value: 0.25 }, // System-wide minimum ambient for "just enough glow"
        uMetallicFactor: { value: options.metallicFactor ?? 0.0 }, // Default to non-metallic
        uRoughness: { value: options.roughness ?? 0.5 }, // Default roughness
        uSpecularColor: {
          value: options.specularColor ?? new THREE.Color(0xffffff),
        }, // Default white specular
      },
      vertexShader: nucleusVertexShader,
      fragmentShader: nucleusFragmentShader,
    });
  }
}
