varying float vDepth;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];

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
        totalLightDirection += normalize(uLightPositions[i] - vWorldPosition) * uLightIntensities[i];
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
