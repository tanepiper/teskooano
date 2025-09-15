---
aliases: [nucleus.fragment.glsl]
tags: [renderer, threejs, asteroids, shader, fragment]
type: shader
package: "@teskooano/celestials-asteroid"
file: "src/shaders/nucleus.fragment.glsl"
status: active
---

# nucleus.fragment.glsl

Fragment shader for asteroid surface rendering with procedural texturing, multi-color palettes, and advanced lighting effects.

## Overview

The nucleus fragment shader implements sophisticated surface rendering for asteroids, featuring height-based color blending, procedural noise texturing, crater effects, multi-light source lighting, and shadow casting. It creates realistic rocky asteroid surfaces with configurable visual properties.

## Shader Features

- **Height-Based Color Blending**: Multi-color palettes with smooth transitions
- **Procedural Noise Texturing**: Multi-octave noise for surface detail
- **Crater Effects**: Sharp crater and crack generation
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Shadow Casting**: Spherical shadow calculations from other celestial bodies
- **Specular Highlights**: Blinn-Phong specular lighting
- **Dynamic Ambient Lighting**: Configurable ambient light strength

## Varying Variables

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position from vertex shader.

- **Usage**: Lighting calculations, shadow casting, distance-based effects
- **Source**: [[nucleus.vertex.glsl]]

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

World-space normal from vertex shader.

- **Usage**: Lighting calculations, surface effects
- **Source**: [[nucleus.vertex.glsl]]

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates from vertex shader.

- **Usage**: Texture sampling, UV-based effects
- **Source**: [[nucleus.vertex.glsl]]

### vObjectPosition

```glsl
varying vec3 vObjectPosition;
```

Normalized object-space position from vertex shader.

- **Usage**: Noise generation, procedural effects
- **Source**: [[nucleus.vertex.glsl]]

## Uniform Variables

### Color and Height Uniforms

```glsl
uniform vec3 uColors[MAX_COLORS];
uniform float uHeights[MAX_COLORS];
uniform int uNumColors;
```

- **uColors**: Array of colors for the palette (up to 4 colors)
- **uHeights**: Height thresholds for color blending
- **uNumColors**: Number of active colors in the palette

### Lighting Uniforms

```glsl
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
```

- **uNumLights**: Number of active light sources
- **uLights**: Array of light source data (position, color, intensity)

### Shadow Uniforms

```glsl
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
```

- **uNumShadowCasters**: Number of active shadow casters
- **uShadowCasters**: Array of shadow caster data (position, radius)

### Surface Detail Uniforms

```glsl
uniform float uNoiseScale;
uniform float uBlendSharpness;
uniform float uCraterScale;
uniform float uCraterStrength;
uniform float uSimplePeriod;
uniform float uUndulation;
```

- **uNoiseScale**: Scale for base color layering noise
- **uBlendSharpness**: Sharpness of color transitions
- **uCraterScale**: Scale for crater noise
- **uCraterStrength**: Darkness and prominence of craters
- **uSimplePeriod**: Base frequency for noise generation
- **uUndulation**: Surface undulation/waviness amount

### Material Uniforms

```glsl
uniform float uAmbientStrength;
uniform float uMetallicFactor;
uniform float uRoughness;
uniform vec3 uSpecularColor;
```

- **uAmbientStrength**: Ambient lighting strength
- **uMetallicFactor**: Metallic surface factor
- **uRoughness**: Surface roughness
- **uSpecularColor**: Specular highlight color

### System Uniforms

```glsl
uniform vec3 uCameraPosition;
uniform float uTime;
```

- **uCameraPosition**: Current camera position
- **uTime**: Current simulation time

## Data Structures

### Light Structure

```glsl
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};
```

### ShadowCaster Structure

```glsl
struct ShadowCaster {
    vec3 position;
    float radius;
};
```

## Noise Functions

### Simplex Noise Implementation

The shader includes a complete simplex noise implementation:

```glsl
float snoise(vec3 v)
```

- **Purpose**: Generates 3D simplex noise for surface detail
- **Range**: -1.0 to 1.0
- **Usage**: Base for all procedural effects

### Fractional Brownian Motion

```glsl
float asteroidFBM(vec3 p)
```

- **Purpose**: Multi-octave noise for realistic surface detail
- **Octaves**: 4 octaves with decreasing amplitude
- **Usage**: Height-based color blending

## Lighting Functions

### Light Contribution Calculation

```glsl
vec3 calculateLightContribution(
    vec3 lightPos,
    vec3 lightColor,
    float intensity,
    vec3 normal,
    vec3 viewDir,
    vec3 worldPos
)
```

- **Purpose**: Calculates lighting contribution from a single light source
- **Features**: Diffuse and specular lighting
- **Specular**: Blinn-Phong with shininess factor 32

### Shadow Calculation

```glsl
float calculateShadowFactor(vec3 worldPos)
```

- **Purpose**: Calculates shadow factor from multiple shadow casters
- **Method**: Spherical shadow calculations
- **Strength**: 80% shadow at center of shadow sphere

## Main Rendering Pipeline

### 1. Base Color Generation

```glsl
// Generate noise coordinates with undulation
vec3 noiseCoord = vObjectPosition * uSimplePeriod;
noiseCoord += uUndulation * snoise(noiseCoord);

// Generate base noise for height mapping
float baseNoise = asteroidFBM(noiseCoord * uNoiseScale);

// Blend colors based on height
vec3 finalColor = uColors[0];
for (int i = 1; i < uNumColors; i++) {
    float blendFactor = smoothstep(uHeights[i-1], uHeights[i], baseNoise);
    finalColor = mix(finalColor, uColors[i], blendFactor * uBlendSharpness);
}
```

### 2. Crater Effects

```glsl
// Generate crater noise
vec3 craterCoord = vObjectPosition * uCraterScale;
float craterNoise = snoise(craterCoord);
float craters = pow(abs(craterNoise), 15.0);

// Apply crater darkening
finalColor *= (1.0 - craters * uCraterStrength);
```

### 3. Shadow Calculation

```glsl
// Calculate shadow factor from shadow casters
float shadowFactor = calculateShadowFactor(vWorldPosition);
```

### 4. Lighting Calculation

```glsl
// Initialize lighting with ambient
vec3 lighting = vec3(uAmbientStrength * 0.1);
vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);

// Add light contributions
for (int i = 0; i < uNumLights; i++) {
    vec3 lightDirection = normalize(uLights[i].position - vWorldPosition);

    // Only light surfaces facing the light
    float dotProduct = dot(vWorldNormal, lightDirection);
    if (dotProduct > 0.0) {
        vec3 lightContribution = calculateLightContribution(
            uLights[i].position,
            uLights[i].color,
            uLights[i].intensity,
            vWorldNormal,
            viewDirection,
            vWorldPosition
        );
        lighting += lightContribution * shadowFactor * 0.4;
    }
}
```

### 5. Final Color Output

```glsl
gl_FragColor = vec4(finalColor * lighting, 1.0);
```

## Performance Optimizations

- **Efficient Noise**: Optimized simplex noise implementation
- **Conditional Lighting**: Only calculates lighting for surfaces facing lights
- **Array Limits**: Uses defines to limit loop iterations
- **Minimal Calculations**: Avoids unnecessary computations

## Visual Effects

### Height-Based Color Blending

- **Multi-Color Palettes**: Up to 4 colors with smooth transitions
- **Height Mapping**: Noise values mapped to height thresholds
- **Smooth Blending**: Uses `smoothstep` for natural transitions
- **Sharpness Control**: Configurable transition sharpness

### Crater Effects

- **Sharp Craters**: Power function creates sharp crater edges
- **Darkening**: Craters darken the surface color
- **Scale Control**: Configurable crater size and strength
- **Realistic Appearance**: Single-octave noise for sharp features

### Lighting System

- **Multiple Lights**: Support for up to 4 light sources
- **Diffuse Lighting**: Standard Lambertian diffuse calculation
- **Specular Highlights**: Blinn-Phong specular with configurable shininess
- **Ambient Lighting**: Configurable ambient light strength
- **Shadow Casting**: Spherical shadows from other celestial bodies

## Integration

The fragment shader works with:

- **Vertex Shader**: [[nucleus.vertex.glsl]] provides world position and normal data
- **Material**: [[AsteroidNucleusMaterial]] manages uniforms and updates
- **Renderer**: [[AsteroidRenderer]] creates geometry and manages updates

## Dependencies

- **Three.js Common**: Standard Three.js shader utilities
- **Logarithmic Depth Buffer**: Large-scale rendering support
- **Simplex Noise**: Procedural noise generation
- **Lighting System**: Multi-light source support

## 🔗 Related

- [[nucleus.vertex.glsl]] - Vertex shader that provides input data
- [[AsteroidNucleusMaterial]] - Material that uses this shader
- [[AsteroidRenderer]] - Renderer that manages this shader
