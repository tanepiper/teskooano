precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>

#define MAX_COLORS 4

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;
varying vec3 vObjectPosition; // Normalized object-space position

struct ShadowCaster {
    vec3 position;
    float radius;
};

uniform vec3 uColors[MAX_COLORS];
uniform float uHeights[MAX_COLORS];
uniform int uNumColors;

uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

// Shadow casting uniforms
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

uniform float uNoiseScale;
uniform float uBlendSharpness;
uniform float uCraterScale;
uniform float uCraterStrength;
uniform float uSimplePeriod;
uniform float uUndulation;
uniform float uMetallicFactor;
uniform float uRoughness;
uniform vec3 uSpecularColor;
uniform vec3 uCameraPosition;
uniform float uTime;

// --- Simplex Noise Functions (inlined from shared modules) ---
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalize gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// --- Asteroid-specific noise and lighting functions ---
float asteroidFBM(vec3 p) {
    float f = 0.0;
    mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
    f += 0.5000 * snoise(p); p = m * p * 2.02;
    f += 0.2500 * snoise(p); p = m * p * 2.03;
    f += 0.1250 * snoise(p); p = m * p * 2.01;
    f += 0.0625 * snoise(p);
    return f / 0.9375;
}

// Function to calculate lighting contribution from a single light source (from shared lighting module)
vec3 calculateLightContribution(vec3 lightPos, vec3 lightColor, float intensity, vec3 normal, vec3 viewDir, vec3 worldPos) {
    vec3 lightDir = normalize(lightPos - worldPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * diff * intensity;

    // Basic Blinn-Phong Specular
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0); // Shininess factor 32
    vec3 specular = lightColor * spec * intensity * 0.3; // Specular intensity 0.3

    return diffuse + specular;
}

// --- Shadow Calculation ---
float calculateShadowFactor(vec3 worldPos) {
    float shadowFactor = 1.0;
    
    for (int i = 0; i < uNumShadowCasters; i++) {
        vec3 toShadowCaster = uShadowCasters[i].position - worldPos;
        float distanceToShadowCaster = length(toShadowCaster);
        
        // Check if we're within the shadow radius
        if (distanceToShadowCaster < uShadowCasters[i].radius) {
            // Simple spherical shadow - could be more sophisticated
            float shadowStrength = 1.0 - (distanceToShadowCaster / uShadowCasters[i].radius);
            shadowFactor *= (1.0 - shadowStrength * 0.8); // 80% shadow at center
        }
    }
    
    return shadowFactor;
}

// --- Main ---
void main() {
    // --- Base Color from Height Map ---
    vec3 noiseCoord = vObjectPosition * uSimplePeriod;
    noiseCoord += uUndulation * snoise(noiseCoord); // Add undulation
    
    float baseNoise = asteroidFBM(noiseCoord * uNoiseScale);

    vec3 finalColor = uColors[0];
    for (int i = 1; i < uNumColors; i++) {
        float blendFactor = smoothstep(uHeights[i-1], uHeights[i], baseNoise);
        finalColor = mix(finalColor, uColors[i], blendFactor * uBlendSharpness);
    }

    // --- Craters/Cracks Layer ---
    vec3 craterCoord = vObjectPosition * uCraterScale;
    float craterNoise = snoise(craterCoord); // Use single snoise for sharper features
    float craters = pow(abs(craterNoise), 15.0);
    finalColor *= (1.0 - craters * uCraterStrength);

    // --- Calculate Shadow Factor ---
    float shadowFactor = calculateShadowFactor(vWorldPosition);

    // --- Lighting using modular lighting functions ---
    vec3 lighting = uAmbientColor * (uAmbientIntensity * 0.1); // Much darker ambient
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightDirection = normalize(uLightPositions[i] - vWorldPosition);
        
        // Only calculate lighting if the surface is facing the light (day side)
        float dotProduct = dot(vWorldNormal, lightDirection);
        if (dotProduct > 0.0) {
            vec3 lightContribution = calculateLightContribution(
                uLightPositions[i],
                uLightColors[i],
                uLightIntensities[i],
                vWorldNormal,
                viewDirection,
                vWorldPosition
            );
            lighting += lightContribution * shadowFactor * 0.4; // Reduced diffuse strength
        }
        // Night side gets no direct lighting, only the very low ambient
    }

    gl_FragColor = vec4(finalColor * lighting, 1.0);

    #include <logdepthbuf_fragment>
} 
