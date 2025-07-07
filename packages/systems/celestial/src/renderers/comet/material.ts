import * as THREE from "three";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

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

const nucleusVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Pass the world-space normal to the fragment shader
    vNormal = normalize(mat3(modelMatrix) * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nucleusFragmentShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

uniform vec3 uColor;
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
uniform float uDarkColorMultiplier;
uniform float uLightColorMultiplier;
uniform float uFbmScale;
uniform float uFineFbmScale;
uniform float uFineFbmMix;
uniform float uAmbientStrength;
uniform float uDynamicAmbientIntensity;

// Simplex noise function (as it was)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

// Fractional Brownian Motion for a more detailed, multi-layered noise
float fbm(vec2 p) {
    float f = 0.0;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    f += 0.5000 * snoise(p); p = m * p;
    f += 0.2500 * snoise(p); p = m * p;
    f += 0.1250 * snoise(p);
    return (f + 1.0) * 0.5; // Map from [-1, 1] to [0, 1]
}

void main() {
    // Use FBM for a richer texture
    float noise = fbm(vWorldPosition.xy * uFbmScale); 

    vec3 darkColor = uColor * uDarkColorMultiplier;
    vec3 lightColor = uColor * uLightColorMultiplier;

    // Use the noise to blend between a dark and light version of the base color
    vec3 finalColor = mix(darkColor, lightColor, noise);

    // Add some subtle high-frequency details
    float fineNoise = fbm(vWorldPosition.xy * uFineFbmScale);
    finalColor = mix(finalColor, finalColor * 0.8, fineNoise * uFineFbmMix);

    // --- Lighting Calculation ---
    vec3 totalLighting = vec3(uAmbientStrength); // Start with minimal ambient light

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightDirection = normalize(uLights[i].position - vWorldPosition);
        float diffuse = max(dot(vNormal, lightDirection), 0.0);
        totalLighting += uLights[i].color * diffuse * uLights[i].intensity;
    }

    gl_FragColor = vec4(finalColor * totalLighting, 1.0);
}
`;

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

const comaVertexShader = `
varying float vDepth;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Pass the world-space normal to the fragment shader
    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const comaFragmentShader = `
varying float vDepth;
varying vec3 vNormal;
varying vec3 vWorldPosition;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];

// 2D Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

// Fractional Brownian Motion for a more detailed noise
float fbm(vec2 p) {
    float f = 0.0;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    f += 0.5000 * snoise(p); p = m * p;
    f += 0.2500 * snoise(p); p = m * p;
    f += 0.1250 * snoise(p);
    return (f + 1.0) * 0.5; // Map from [-1, 1] to [0, 1]
}

void main() {
    // --- Lighting and Falloff ---
    vec3 totalLightDirection = vec3(0.0);
    for (int i = 0; i < uNumLights; i++) {
        totalLightDirection += normalize(uLights[i].position - vWorldPosition) * uLights[i].intensity;
    }
    totalLightDirection = normalize(totalLightDirection);

    float falloff = 1.0 - abs(dot(vNormal, totalLightDirection));
    falloff = pow(falloff, 1.5);

    // Animated particle noise to represent the density of the gas.
    float densityNoise = fbm(vWorldPosition.xy * 0.1 + uTime * 0.05);
    
    // The final opacity is a combination of the base opacity, the spherical falloff, and the density noise.
    // The lighting is now independent of the camera position.
    float finalOpacity = uOpacity * falloff * densityNoise;

    if (finalOpacity < 0.01) discard;

    // The color is uniform, as the coma is a glowing gas, not a reflective surface.
    gl_FragColor = vec4(uColor, finalOpacity);
}
`;

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

const particleVertexShader = `
attribute float size;
attribute float alpha;
varying float vAlpha;
varying float vDepth;
varying vec3 vWorldPosition;

void main() {
    vAlpha = alpha;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    vDepth = -mvPosition.z;
    gl_PointSize = size * (300.0 / vDepth);
    // Clamp the max size to prevent them from being huge when the camera is very close.
    gl_PointSize = min(gl_PointSize, 20.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
uniform vec3 uColor;
uniform float uLightIntensity;
uniform float uDynamicAmbientIntensity;

varying float vAlpha;
varying float vDepth;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    // Soft particle edge
    float strength = 1.0 - smoothstep(0.4, 0.5, dist);
    if (strength < 0.01) discard;

    float finalAlpha = vAlpha * strength;

    // The tail is emissive, its brightness depends on its own properties and general
    // light intensity, not direction. Minimal ambient term to prevent pure black.
    float ambientStrength = uDynamicAmbientIntensity; // Use dynamic ambient for realistic star-based lighting
    vec3 finalColor = uColor * (ambientStrength + uLightIntensity);

    gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

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

const jetParticleFragmentShader = `
  uniform vec3 uColor;
  uniform float uLightIntensity;
  uniform float uDynamicAmbientIntensity;

  varying float vAlpha;
  varying float vDepth;

  // --- Noise Functions for Cloudy Texture ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec2 x1 = x0.xy + C.xx - i1;
      vec2 x2 = x0.xy + C.zz;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
      return 130.0 * dot(m, g);
  }
  float fbm(vec2 p) {
      float f = 0.0;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      f += 0.5000 * snoise(p); p = m * p;
      f += 0.2500 * snoise(p); p = m * p;
      f += 0.1250 * snoise(p);
      return (f + 1.0) * 0.5;
  }
  // --- End Noise Functions ---

  void main() {
      // Use noise for a cloudy shape
      float noise = fbm(gl_PointCoord * 4.0);

      // Combine with a circular falloff to keep it contained
      float dist = distance(gl_PointCoord, vec2(0.5));
      float circularFalloff = smoothstep(0.5, 0.2, dist);

      float strength = noise * circularFalloff;
      if (strength < 0.01) discard;

      // Simplified, non-directional lighting for glowing gas. Minimal ambient.
      float ambientStrength = uDynamicAmbientIntensity; // Use dynamic ambient for realistic star-based lighting
      vec3 finalColor = uColor * (ambientStrength + uLightIntensity * 0.5);

      float finalAlpha = vAlpha * strength;

      gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export class CometJetMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color }) {
    const jetParticleVertexShader = `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      varying float vDepth;
      varying vec3 vWorldPosition;

      void main() {
          vAlpha = alpha;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vec4 mvPosition = viewMatrix * worldPosition;
          vDepth = -mvPosition.z;

          // A simpler, more standard way to size points.
          gl_PointSize = size * (150.0 / vDepth);
          // Clamp the max size to prevent them from being huge when the camera is very close.
          gl_PointSize = min(gl_PointSize, 15.0);

          gl_Position = projectionMatrix * mvPosition;
      }
    `;

    super({
      uniforms: {
        uColor: { value: options.color },
        uLightPosition: { value: new THREE.Vector3() },
        uLightColor: { value: new THREE.Color(0xffffff) },
        uLightIntensity: { value: 1.0 },
        uDynamicAmbientIntensity: { value: 0.001 },
      },
      vertexShader: jetParticleVertexShader,
      fragmentShader: jetParticleFragmentShader, // Use the new cloudy shader
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
}

/**
 * @deprecated Use CometParticleMaterial instead
 */
export class CometTailMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color; opacity: number }) {
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

const simplifiedTailVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simplifiedTailFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;

// Re-use noise from coma shader
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}


void main() {
    // Fade along the length of the tail (vUv.y goes from 0 at base to 1 at tip)
    float lengthFade = 1.0 - vUv.y;
    lengthFade = pow(lengthFade, 0.5);

    // Fade across the width of the tail
    float widthFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
    widthFade = pow(widthFade, 2.0);

    // Add some shimmering noise
    float noise = snoise(vec2(vUv.y * 5.0, uTime * 0.1)) * 0.5 + 0.5;
    
    float finalOpacity = uOpacity * lengthFade * widthFade * (0.5 + noise * 0.5);

    if (finalOpacity < 0.01) discard;

    gl_FragColor = vec4(uColor, finalOpacity);
}
`;

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
