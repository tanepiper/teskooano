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
uniform float uMetallicFactor; // Controls metallicness/shininess
uniform float uRoughness; // Controls blurriness of specular highlight
uniform vec3 uSpecularColor; // Color of the specular highlight

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
    vec3 baseColor = mix(darkColor, lightColor, noise);

    // Add some subtle high-frequency details
    float fineNoise = fbm(vWorldPosition.xy * uFineFbmScale);
    baseColor = mix(baseColor, baseColor * 0.8, fineNoise * uFineFbmMix);

    // --- Lighting Calculation ---
    vec3 totalLighting = vec3(uAmbientStrength); // Start with minimal ambient light

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightDirection = normalize(uLights[i].position - vWorldPosition);
        float diffuse = max(dot(vNormal, lightDirection), 0.0);

        // Apply a power to the diffuse term to increase falloff and create a sharper terminator
        float diffuseFalloff = pow(diffuse, 1.5);

        totalLighting += uLights[i].color * diffuseFalloff * uLights[i].intensity;

        // View-independent shininess: More like a 'sheen' or brighter diffuse
        // Higher metallicFactor increases shininess, lower roughness makes it sharper
        float shininess = pow(diffuse, 1.0 / uRoughness); // Higher diffuse -> brighter sheen
        vec3 metallicEffect = uSpecularColor * shininess * uMetallicFactor * uLights[i].intensity;

        totalLighting += metallicEffect;
    }

    vec3 finalColor = baseColor * totalLighting;

    // Apply gamma correction for proper brightness
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
} 