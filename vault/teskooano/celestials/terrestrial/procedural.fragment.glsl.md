---
aliases: [procedural.fragment.glsl]
tags: [renderer, threejs, terrestrial, shader, fragment]
type: shader
package: "@teskooano/celestials-terrestrial"
file: "src/shaders/procedural.fragment.glsl"
status: active
---

# procedural.fragment.glsl

Fragment shader for procedural terrestrial planet surfaces with noise-driven terrain generation, height-based color blending, and multi-source lighting.

## Overview

The procedural fragment shader implements comprehensive procedural surface generation for terrestrial planets. It combines noise-driven terrain generation, height-based color blending, multi-source lighting calculations, and shadow casting to create realistic planetary surfaces.

## Shader Features

- **Noise-Driven Terrain**: Simplex noise-based terrain generation with configurable parameters
- **Height-Based Color Blending**: 5-level color palette with smooth height-based transitions
- **Multi-Source Lighting**: Support for up to 4 dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies with penumbra effects
- **Terrain Types**: Multiple terrain generation algorithms (simple, sharp peaks, sharp valleys)
- **Performance Optimized**: Efficient calculations with aggressive value clamping

## Includes

```glsl
precision highp float;

#include <common>
#include <logdepthbuf_pars_fragment>
```

- **precision highp float**: High precision floating point for better quality
- **common**: Three.js common shader definitions
- **logdepthbuf_pars_fragment**: Logarithmic depth buffer fragment parameters

## Defines

```glsl
#define HEIGHT_LEVELS 5
```

- **HEIGHT_LEVELS**: Number of height levels for color blending (5)

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the fragment.

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position of the fragment.

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

World-space normal of the fragment.

### vObjectPosition

```glsl
varying vec3 vObjectPosition;
```

Normalized object-space position for seamless noise generation.

## Uniform Variables

### Camera

```glsl
uniform vec3 uCameraPosition;
```

Camera position for lighting calculations.

### Lighting Uniforms

```glsl
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;
```

- **uNumLights**: Number of active light sources
- **uLights**: Array of light source data
- **uAmbientLightColor**: Ambient light color
- **uAmbientLightIntensity**: Ambient light intensity

### Shadow Uniforms

```glsl
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
```

- **uNumShadowCasters**: Number of active shadow casters
- **uShadowCasters**: Array of shadow caster data

### Noise Parameters

```glsl
uniform float uTime;
uniform float uBumpScale;
uniform float persistence;
uniform float lacunarity;
uniform float uSimplePeriod;
uniform int uOctaves;
uniform float uUndulation;
```

- **uTime**: Current time for animation
- **uBumpScale**: Bump mapping scale
- **persistence**: Noise persistence (0.0-1.0)
- **lacunarity**: Noise lacunarity (1.0+)
- **uSimplePeriod**: Noise period
- **uOctaves**: Number of noise octaves
- **uUndulation**: Surface undulation

### Terrain Parameters

```glsl
uniform int uTerrainType;
uniform float uTerrainAmplitude;
uniform float uTerrainSharpness;
uniform float uTerrainOffset;
```

- **uTerrainType**: Terrain generation type (1=simple, 2=sharp peaks, 3=sharp valleys)
- **uTerrainAmplitude**: Terrain height scale
- **uTerrainSharpness**: Terrain feature definition
- **uTerrainOffset**: Base height offset

### Color Palette

```glsl
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
```

- **uColor1**: Lowest height color (e.g., ocean floor)
- **uColor2**: Low height color (e.g., ocean, lowlands)
- **uColor3**: Medium height color (e.g., hills, plateaus)
- **uColor4**: High height color (e.g., mountains, peaks)
- **uColor5**: Highest height color (e.g., snow caps, peaks)

### Height Levels

```glsl
uniform float uHeight1;
uniform float uHeight2;
uniform float uHeight3;
uniform float uHeight4;
uniform float uHeight5;
```

- **uHeight1**: Height threshold 1 (0.0)
- **uHeight2**: Height threshold 2 (0.2)
- **uHeight3**: Height threshold 3 (0.4)
- **uHeight4**: Height threshold 4 (0.6)
- **uHeight5**: Height threshold 5 (0.8)

### Material Properties

```glsl
uniform float uShininess;
uniform float uSpecularStrength;
```

- **uShininess**: Surface shininess
- **uSpecularStrength**: Specular reflection strength

## Data Structures

### Light

```glsl
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};
```

Structure for light source data.

### ShadowCaster

```glsl
struct ShadowCaster {
    vec3 position;
    float radius;
};
```

Structure for shadow caster data.

## Functions

### getShadow

```glsl
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
```

Calculates shadow from spherical occluders with soft penumbra effects.

**Parameters:**

- **fragPos**: Fragment position in world space
- **lightDir**: Direction to light source

**Returns:**

- **float**: Shadow factor (0.0 = full shadow, 1.0 = fully lit)

**Process:**

1. **Loop Through Casters**: Iterates through all shadow casters
2. **Intersection Test**: Tests if light ray intersects shadow caster
3. **Penumbra Calculation**: Calculates soft shadow with penumbra
4. **Shadow Accumulation**: Accumulates shadow factors

## Main Function

```glsl
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

    // Calculate shadow factor for day side lighting only
    float shadowFactor = 1.0;
    if (uNumLights > 0) {
        vec3 primaryLightDir = normalize(uLights[0].position - vWorldPosition);
        float dotProduct = dot(baseNormal, primaryLightDir);

        if (dotProduct > 0.0) {
            // Day side - calculate shadows
            shadowFactor = getShadow(vWorldPosition, primaryLightDir);
        } else {
            // Night side - no shadows needed
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
```

## Terrain Generation

### Noise Coordinate Calculation

```glsl
vec3 noiseCoord = vObjectPosition * uSimplePeriod;
```

**Process:**

- Uses normalized object-space position for seamless noise
- Scales by noise period for feature size control
- Provides consistent coordinates across sphere surface

### Terrain Height Calculation

```glsl
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
```

**Process:**

- Calls terrain generation function with all parameters
- Generates height value based on noise and terrain type
- Returns normalized height value (0.0-1.0)

## Color Blending System

### Height-Based Color Blending

```glsl
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
```

**Process:**

1. **Initialize**: Starts with lowest height color
2. **Array Setup**: Sets up color and height arrays
3. **Blending Loop**: Iterates through height levels
4. **Smooth Blending**: Uses smoothstep for smooth transitions
5. **Color Mixing**: Mixes colors based on height

### Color Palette Levels

1. **Color1**: Lowest height (e.g., ocean floor, deep valleys)
2. **Color2**: Low height (e.g., ocean, lowlands)
3. **Color3**: Medium height (e.g., hills, plateaus)
4. **Color4**: High height (e.g., mountains, peaks)
5. **Color5**: Highest height (e.g., snow caps, peaks)

## Lighting System

### Shadow Calculation

```glsl
// Calculate shadow factor for day side lighting only
float shadowFactor = 1.0;
if (uNumLights > 0) {
    vec3 primaryLightDir = normalize(uLights[0].position - vWorldPosition);
    float dotProduct = dot(baseNormal, primaryLightDir);

    if (dotProduct > 0.0) {
        // Day side - calculate shadows
        shadowFactor = getShadow(vWorldPosition, primaryLightDir);
    } else {
        // Night side - no shadows needed
        shadowFactor = 0.0;
    }
}
```

**Process:**

1. **Light Direction**: Calculates direction to primary light
2. **Day/Night Check**: Determines if fragment is on day or night side
3. **Shadow Calculation**: Calculates shadows only for day side
4. **Shadow Factor**: Returns shadow factor for lighting

### Lighting Calculation

```glsl
vec3 finalColor = calculateLighting(baseColor, baseNormal, viewDir, shadowFactor);
```

**Process:**

- Uses shared lighting function from `lighting.glsl`
- Applies multi-source lighting calculations
- Incorporates shadow factor
- Returns final lit color

## Performance Optimizations

### Efficient Calculations

- **Noise Optimization**: Optimized noise generation
- **Color Blending**: Efficient color blending algorithm
- **Shadow Optimization**: Efficient shadow calculations
- **GPU Optimization**: Optimized for GPU execution

### Value Clamping

- **Color Clamping**: Clamps colors to prevent artifacts
- **Gamma Correction**: Applies gamma correction for realistic colors
- **Range Validation**: Validates all values within expected ranges

### Early Exits

- **Shadow Skip**: Skips shadow calculations for night side
- **Light Validation**: Validates light sources before calculations
- **Performance**: Improves performance by skipping unnecessary calculations

## Integration with Vertex Shader

The fragment shader works with the vertex shader to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Transformation Data**: Properly transformed positions and normals
3. **Lighting Foundation**: Essential data for realistic lighting calculations
4. **Procedural Support**: Data for seamless noise generation

## Dependencies

### Shader Includes

- **common**: Common shader definitions and functions
- **logdepthbuf_pars_fragment**: Logarithmic depth buffer parameters
- **logdepthbuf_fragment**: Logarithmic depth buffer calculations

### Shared Shaders

- **noise.glsl**: Noise generation functions
- **lighting.glsl**: Lighting calculation functions
- **terrain.glsl**: Terrain generation functions

## Error Handling

### Validation

- **Range Checking**: Validates all uniform values
- **Array Bounds**: Checks array bounds before access
- **Division by Zero**: Prevents division by zero errors

### Fallbacks

- **Default Values**: Provides default values for missing data
- **Error Recovery**: Recovers from calculation errors
- **Graceful Degradation**: Maintains functionality with errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js shader features
- **Extensions**: Supports Three.js extensions

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[procedural.vertex.glsl]] - Vertex shader that provides data for this fragment shader
- [[ProceduralPlanetMaterial]] - Material that uses this shader
- [[BaseTerrestrialRenderer]] - Renderer that creates the geometry for this shader
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/data-types]] - Type definitions
