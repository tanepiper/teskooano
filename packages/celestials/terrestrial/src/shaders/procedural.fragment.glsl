precision highp float;

#include <common>
#include <logdepthbuf_pars_fragment>

#define HEIGHT_LEVELS 5

// MODIFIED: Added varyings from vertex shader
varying vec2 vUv;
varying vec3 vWorldPosition;  // World space position of the fragment
varying vec3 vWorldNormal;    // Perturbed world normal from vertex shader
varying vec3 vObjectPosition; // Normalized object-space position for seamless noise
uniform vec3 uCameraPosition;

// --- Structs ---
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

// Multi-Light Uniforms
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;

// Shadow Caster Uniforms
struct ShadowCaster {
    vec3 position;
    float radius;
};
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

// Procedural Generation Parameters
uniform float uTime;
uniform float uBumpScale;
uniform float persistence;
uniform float lacunarity;
uniform float uSimplePeriod;
uniform int uOctaves;
uniform float uUndulation;

// Terrain generation parameters
uniform int uTerrainType; // 1 = simple, 2 = sharp peaks, 3 = sharp valleys
uniform float uTerrainAmplitude; // Controls overall height scale
uniform float uTerrainSharpness; // Controls terrain feature definition
uniform float uTerrainOffset; // Base height offset

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uHeight1;
uniform float uHeight2;
uniform float uHeight3;
uniform float uHeight4;
uniform float uHeight5;
uniform float uShininess;
uniform float uSpecularStrength;

// Include Simplex noise implementation
#ifndef NOISE_GLSL
    #include "../shared/noise.glsl"
#endif

#ifndef LIGHTING_GLSL
    #include "../shared/lighting.glsl"
#endif

#ifndef TERRAIN_GLSL
    #include "../shared/terrain.glsl"
#endif

// Returns a value from 0.0 (full shadow) to 1.0 (fully lit)
float getShadow(vec3 fragPos, vec3 lightDir) {
    float finalShadow = 1.0;

    for (int i = 0; i < uNumShadowCasters; i++) {
        // This check is necessary because the array is padded with empty data
        if (uShadowCasters[i].radius <= 0.0) continue;

        vec3 oc = fragPos - uShadowCasters[i].position;
        float b = dot(oc, lightDir);
        float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
        float discriminant = b * b - c;

        // If the ray is potentially inside the shadow cone
        if (discriminant > 0.0) {
            float t = -b - sqrt(discriminant);
            // Check if the intersection is in front of the fragment
            if (t > 0.001) {
                // Penumbra width is proportional to the occluder's radius.
                // A larger multiplier makes the edge softer.
                float penumbra = uShadowCasters[i].radius * 0.8;
                float penumbraSq = penumbra * penumbra;
                
                // Calculate a smooth fade from lit to shadow based on how deep the ray is.
                // 1.0 = lit edge, 0.0 = deep shadow.
                float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
                
                // The final shadow is the darkest of all potential shadows.
                finalShadow = min(finalShadow, currentShadow);
            }
        }
    }
    return finalShadow;
}

// --- Main Function ---
void main() {
    // Use normalized object position as the basis for noise
    vec3 noiseCoord = vObjectPosition * uSimplePeriod;

    // Calculate terrain height using the terrainHeight function with our uniforms
    float noiseValue = terrainHeight(
        uTerrainType,
        noiseCoord,
        uTerrainAmplitude,
        uTerrainSharpness,
        uTerrainOffset,
        uSimplePeriod,
        persistence,
        lacunarity,
        uOctaves,
        uUndulation
    );

    // --- Lighting Calculation --- 
    vec3 baseNormal = normalize(vWorldNormal);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Initialize base color with the lowest level
    vec3 baseColor = uColor1;
    
    // Array of colors and heights for the loop
    vec3 colors[HEIGHT_LEVELS];
    float heights[HEIGHT_LEVELS];
    
    colors[0] = uColor1;
    colors[1] = uColor2;
    colors[2] = uColor3;
    colors[3] = uColor4;
    colors[4] = uColor5;
    
    heights[0] = uHeight1;
    heights[1] = uHeight2;
    heights[2] = uHeight3;
    heights[3] = uHeight4;
    heights[4] = uHeight5;
    
    // Loop through height levels for color blending
    for(int i = 1; i < HEIGHT_LEVELS; i++) {
        float prevHeight = heights[i-1];
        float currHeight = heights[i];
        float blendFactor = smoothstep(prevHeight, currHeight, noiseValue);
        baseColor = mix(baseColor, colors[i], blendFactor);
    }

    // Determine shadow factor before calculating lighting
    float shadowFactor = 1.0;
    if (uNumLights > 0) {
        vec3 primaryLightDir = normalize(uLights[0].position - vWorldPosition);
        // Only calculate shadow if the surface is facing the light (day side)
        if (dot(baseNormal, primaryLightDir) > 0.0) {
            shadowFactor = getShadow(vWorldPosition, primaryLightDir);
        } else {
            // Night side gets no lighting, so shadow factor doesn't matter
            shadowFactor = 0.0;
        }
    }

    // Use base normal for lighting
    vec3 finalColor = calculateLighting(baseColor, baseNormal, viewDir, shadowFactor);

    // Clamp before gamma correction to prevent artifacts.
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply basic gamma correction.
    finalColor = pow(finalColor, vec3(1.0/2.2));

    // Output final lit color
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
} 