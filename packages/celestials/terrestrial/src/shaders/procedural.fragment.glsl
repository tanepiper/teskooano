precision highp float;

#include <common>
#include <logdepthbuf_pars_fragment>

#define HEIGHT_LEVELS 5

// MODIFIED: Added varyings from vertex shader
varying vec2 vUv;
varying vec3 vWorldPosition;  // World space position of the fragment
varying vec3 vWorldNormal;    // Perturbed world normal from vertex shader
varying vec3 vObjectPosition; // Normalized object-space position for seamless noise
varying vec3 vViewPosition;   // View space position of the fragment
varying vec3 vViewNormal;     // View space normal of the fragment
// uniform vec3 uCameraPosition; // Three.js defines cameraPosition automatically

// --- Structs ---
// Multi-Light Uniforms (Standard Three.js)
#include <lights_pars_begin>
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

// (Removed local getShadow - now in shared/lighting.glsl)

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
    
    // Apply procedural normal perturbation for terrain detail
    float oceanThreshold = uHeight2;
    float terrainBumpFactor = smoothstep(oceanThreshold - 0.05, oceanThreshold + 0.1, noiseValue);
    float modulatedBumpScale = uBumpScale * terrainBumpFactor;
    
    vec3 perturbedNormal = perturbNormal(baseNormal, vWorldPosition, modulatedBumpScale);
    
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

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

    // Perform lighting calculation with robust world-space support
    vec3 finalColor = calculateLighting(
        baseColor, 
        perturbedNormal, 
        vWorldPosition, 
        viewDir
    );

    // Clamp before gamma correction to prevent artifacts.
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply basic gamma correction.
    finalColor = pow(finalColor, vec3(1.0/2.2));

    // Output final lit color
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
}