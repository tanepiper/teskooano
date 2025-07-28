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

export interface CometNucleusMaterialOptions {
  color: THREE.Color;
  darkColorMultiplier?: number;
  lightColorMultiplier?: number;
  fbmScale?: number;
  fineFbmScale?: number;
  fineFbmMix?: number;
  ambientStrength?: number;
}

export class CometNucleusMaterial extends THREE.ShaderMaterial {
  constructor(options: CometNucleusMaterialOptions) {
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
