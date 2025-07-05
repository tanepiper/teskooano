import * as THREE from "three";

const nucleusVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nucleusFragmentShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uLightIntensity;

// From packages/systems/celestial/src/shaders/shared/simplex/2d.glsl
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    m = m*m;
    m = m*m;
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
    // Procedural texturing
    float baseNoise = snoise(vWorldPosition.xy * 0.5) * 0.5 + 0.5;
    float detailNoise = snoise(vWorldPosition.xy * 5.0) * 0.5 + 0.5;
    
    vec3 baseColor = uColor;
    vec3 detailColor = uColor * 0.7; // Darker shade for cracks/details

    vec3 finalColor = mix(baseColor, detailColor, detailNoise * 0.5);
    finalColor = mix(finalColor, baseColor * 1.2, baseNoise * 0.3);


    vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
    float diffuse = max(dot(vNormal, lightDirection), 0.0);

    // Adding a bit of ambient light to see the dark side
    float ambientStrength = 0.15;
    vec3 ambient = vec3(ambientStrength);

    vec3 lighting = ambient + (uLightColor * diffuse * uLightIntensity);

    gl_FragColor = vec4(finalColor * lighting, 1.0);
}
`;

export class CometNucleusMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color }) {
    super({
      uniforms: {
        uColor: { value: options.color },
        uLightPosition: { value: new THREE.Vector3() },
        uLightColor: { value: new THREE.Color(0xffffff) },
        uLightIntensity: { value: 1.0 },
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
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const comaFragmentShader = `
varying float vDepth;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;

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
    // Fresnel effect for soft edges on the sphere
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
    fresnel = pow(fresnel, 1.5);

    // Animated particle noise
    float noise = fbm(vWorldPosition.xy * 0.1 + uTime * 0.05);
    
    // When close, boost opacity
    float opacityBoost = 1.0 + 1.0 * (1.0 - smoothstep(0.0, 500.0, vDepth));
    
    float finalOpacity = uOpacity * fresnel * noise * opacityBoost;

    if (finalOpacity < 0.01) discard;

    gl_FragColor = vec4(uColor, finalOpacity);
}
`;

export class CometComaMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color; opacity: number }) {
    super({
      uniforms: {
        uColor: { value: options.color },
        uOpacity: { value: options.opacity },
        uTime: { value: 0.0 },
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

void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_PointSize = size * (300.0 / vDepth);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
uniform vec3 uColor;
varying float vAlpha;
varying float vDepth;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    // Soft particle edge
    float strength = 1.0 - smoothstep(0.4, 0.5, dist);
    if (strength < 0.01) discard;

    // When close (vDepth is small), boost opacity to compensate for additive blending spread.
    float opacityBoost = 1.0 + 1.0 * (1.0 - smoothstep(0.0, 500.0, vDepth));
    float finalAlpha = vAlpha * strength * opacityBoost;

    gl_FragColor = vec4(uColor, finalAlpha);
    gl_FragColor.a = clamp(gl_FragColor.a, 0.0, 1.0);
}
`;

export class CometParticleMaterial extends THREE.ShaderMaterial {
  constructor(options: { color: THREE.Color }) {
    super({
      uniforms: {
        uColor: { value: options.color },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      blending: THREE.NormalBlending,
      transparent: true,
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
