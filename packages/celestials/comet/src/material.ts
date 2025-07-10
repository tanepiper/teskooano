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
        uDynamicAmbientIntensity: { value: 0.001 }, // Dynamic ambient uniform
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
        uDynamicAmbientIntensity: { value: 0.001 },
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
        uDynamicAmbientIntensity: { value: 0.001 },
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

/**
 * @deprecated Use CometParticleMaterial instead
 */
export class CometTailMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color; opacity: number }) {
    const tailVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

    const tailFragmentShader = `
varying vec2 vUv;
uniform vec3 uColor;
uniform float uOpacity;
// Add some noise function if needed later

void main() {
    // Fade along the length of the tail (vUv.x)
    float tailFade = pow(1.0 - vUv.x, 2.0); // Use pow for a more pronounced fade

    // Fade across the width of the tail (vUv.y) with a smoother curve
    float widthFade = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);

    gl_FragColor = vec4(uColor, tailFade * widthFade * uOpacity);
}
`;

    super({
      vertexShader: tailVertexShader,
      fragmentShader: tailFragmentShader,
      uniforms: {
        uColor: { value: options.color },
        uOpacity: { value: options.opacity },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}
