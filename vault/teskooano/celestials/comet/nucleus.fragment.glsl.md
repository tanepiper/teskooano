---
aliases: [nucleus.fragment.glsl]
tags: [renderer, threejs, comets, shader, fragment]
type: shader
package: "@teskooano/celestials-comet"
file: "src/shaders/nucleus.fragment.glsl"
status: active
---

# nucleus.fragment.glsl

Fragment shader for comet nucleus surface rendering with procedural texturing, multi-color palettes, and advanced lighting effects.

## Overview

The nucleus fragment shader implements sophisticated surface rendering for comet nuclei, featuring height-based color blending, procedural noise texturing, crater effects, and multi-light source lighting. It creates realistic rocky comet surfaces with configurable visual properties.

## Shader Features

- **Height-Based Color Blending**: Multi-color palettes with smooth transitions
- **Procedural Noise Texturing**: Multi-octave noise for surface detail
- **Crater Effects**: Sharp crater and crack generation
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Specular Highlights**: Blinn-Phong specular lighting
- **Day/Night Side Rendering**: Realistic lighting with dark night sides

## Varying Variables

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position from vertex shader.

- **Usage**: Lighting calculations, distance-based effects
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
uniform vec3 uCameraPosition;
```

- **uAmbientStrength**: Ambient lighting strength
- **uMetallicFactor**: Metallic surface factor
- **uRoughness**: Surface roughness
- **uSpecularColor**: Specular highlight color
- **uCameraPosition**: Current camera position

## Data Structures

### Light Structure

```glsl
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
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
float fbm(vec3 p)
```

- **Purpose**: Multi-octave noise for realistic surface detail
- **Octaves**: 4 octaves with decreasing amplitude
- **Usage**: Height-based color blending

## Main Rendering Pipeline

### 1. Base Color Generation

```glsl
// Generate noise coordinates with undulation
vec3 noiseCoord = vObjectPosition * uSimplePeriod;
noiseCoord += uUndulation * snoise(noiseCoord);

// Generate base noise for height mapping
float baseNoise = fbm(noiseCoord * uNoiseScale);

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

### 3. Lighting Calculation

```glsl
// Initialize lighting with ambient
vec3 lighting = vec3(uAmbientStrength * 0.1);
vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);

// Add light contributions
for (int i = 0; i < uNumLights; i++) {
    vec3 lightDirection = normalize(uLights[i].position - vWorldPosition);

    // Only light surfaces facing the light (day side)
    float dotProduct = dot(vWorldNormal, lightDirection);
    if (dotProduct > 0.0) {
        float diffuse = max(dotProduct, 0.0);
        lighting += uLights[i].color * diffuse * uLights[i].intensity * 0.4;

        // Specular - only on day side
        vec3 halfwayDir = normalize(lightDirection + viewDirection);
        float spec = pow(max(dot(vWorldNormal, halfwayDir), 0.0), 32.0);
        lighting += uLights[i].color * spec * uRoughness * uLights[i].intensity;
    }
}
```

### 4. Final Color Output

```glsl
gl_FragColor = vec4(finalColor * lighting, 1.0);
```

## Performance Optimizations

- **Efficient Noise**: Optimized simplex noise implementation
- **Conditional Lighting**: Only calculates lighting for surfaces facing lights
- **Day/Night Optimization**: Skips lighting calculations for night side
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
- **Day/Night Sides**: Realistic lighting with dark night sides
- **Ambient Lighting**: Configurable ambient light strength

## Integration

The fragment shader works with:

- **Vertex Shader**: [[nucleus.vertex.glsl]] provides world position and normal data
- **Material**: [[CometNucleusMaterial]] manages uniforms and updates
- **Renderer**: [[CometRenderer]] creates geometry and manages updates

## Dependencies

- **Simplex Noise**: Procedural noise generation
- **Lighting System**: Multi-light source support
- **Camera System**: View-dependent effects

## 🔗 Related

- [[nucleus.vertex.glsl]] - Vertex shader that provides input data
- [[CometNucleusMaterial]] - Material that uses this shader
- [[CometRenderer]] - Renderer that manages this shader
