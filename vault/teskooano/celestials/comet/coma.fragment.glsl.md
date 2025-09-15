---
aliases: [coma.fragment.glsl]
tags: [renderer, threejs, comets, shader, fragment]
type: shader
package: "@teskooano/celestials-comet"
file: "src/shaders/coma.fragment.glsl"
status: active
---

# coma.fragment.glsl

Fragment shader for comet coma (gas cloud) rendering with volumetric effects, density animation, and lighting integration.

## Overview

The coma fragment shader implements volumetric gas cloud rendering for comet comas, featuring animated density patterns, spherical falloff, and lighting integration. It creates realistic gas cloud effects that scale with solar activity and provide atmospheric depth to the comet.

## Shader Features

- **Volumetric Rendering**: Spherical gas cloud with density-based opacity
- **Animated Density**: Time-based density noise for realistic gas movement
- **Lighting Integration**: Support for multiple light sources
- **Spherical Falloff**: Natural opacity falloff from center to edge
- **Performance Optimization**: Early pixel discard for transparent areas

## Varying Variables

### vDepth

```glsl
varying float vDepth;
```

Depth information for the vertex.

- **Type**: `float`
- **Usage**: Depth-based effects and falloff calculations
- **Source**: Coma vertex shader

### vNormal

```glsl
varying vec3 vNormal;
```

Surface normal for the vertex.

- **Type**: `vec3`
- **Usage**: Lighting calculations and spherical falloff
- **Source**: Coma vertex shader

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position of the vertex.

- **Type**: `vec3`
- **Usage**: Density noise generation and lighting calculations
- **Source**: Coma vertex shader

## Uniform Variables

### Color and Opacity Uniforms

```glsl
uniform vec3 uColor;
uniform float uOpacity;
```

- **uColor**: Base color for the gas cloud
- **uOpacity**: Base opacity for the coma

### Animation Uniforms

```glsl
uniform float uTime;
```

- **uTime**: Current simulation time for density animation

### Lighting Uniforms

```glsl
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
```

- **uNumLights**: Number of active light sources
- **uLights**: Array of light source data (position, color, intensity)

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

### 2D Simplex Noise

```glsl
float snoise(vec2 v)
```

- **Purpose**: Generates 2D simplex noise for density patterns
- **Range**: -1.0 to 1.0
- **Usage**: Animated density noise for gas movement

### Fractional Brownian Motion

```glsl
float fbm(vec2 p)
```

- **Purpose**: Multi-octave noise for detailed density patterns
- **Octaves**: 3 octaves with decreasing amplitude
- **Usage**: Realistic gas density variations

## Main Rendering Pipeline

### 1. Lighting Calculation

```glsl
// Calculate combined light direction from all sources
vec3 totalLightDirection = vec3(0.0);
for (int i = 0; i < uNumLights; i++) {
    totalLightDirection += normalize(uLights[i].position - vWorldPosition) * uLights[i].intensity;
}
totalLightDirection = normalize(totalLightDirection);
```

### 2. Spherical Falloff

```glsl
// Calculate spherical falloff based on normal and light direction
float falloff = 1.0 - abs(dot(vNormal, totalLightDirection));
falloff = pow(falloff, 1.5);
```

### 3. Animated Density Noise

```glsl
// Generate animated density noise
float densityNoise = fbm(vWorldPosition.xy * 0.1 + uTime * 0.05);
```

### 4. Final Opacity Calculation

```glsl
// Combine base opacity, spherical falloff, and density noise
float finalOpacity = uOpacity * falloff * densityNoise;

// Early pixel discard for performance
if (finalOpacity < 0.01) discard;
```

### 5. Color Output

```glsl
// Uniform color with calculated opacity
gl_FragColor = vec4(uColor, finalOpacity);
```

## Performance Optimizations

### Early Pixel Discard

- **Threshold Testing**: Discards pixels with opacity below 0.01
- **Performance Gain**: Reduces fragment processing for transparent areas
- **Quality Balance**: Maintains visual quality while improving performance

### Efficient Noise Generation

- **2D Noise**: Uses 2D noise instead of 3D for better performance
- **Optimized FBM**: Limited to 3 octaves for good detail without excessive computation
- **Time-based Animation**: Smooth animation with minimal computational overhead

### Lighting Optimization

- **Combined Light Direction**: Calculates single combined light direction
- **Normalized Results**: Ensures consistent lighting calculations
- **Efficient Dot Product**: Uses optimized dot product calculations

## Visual Effects

### Volumetric Rendering

- **Spherical Geometry**: Uses sphere geometry for natural gas cloud shape
- **Density-based Opacity**: Opacity varies based on density noise
- **Realistic Falloff**: Natural opacity falloff from center to edge

### Animated Density

- **Time-based Animation**: Density patterns change over time
- **Realistic Movement**: Simulates gas movement and turbulence
- **Configurable Speed**: Animation speed controlled by time uniform

### Lighting Integration

- **Multiple Light Sources**: Support for up to 4 light sources
- **Combined Lighting**: Blends light from all sources
- **Spherical Falloff**: Natural lighting falloff based on surface normal

## Material Properties

The coma material uses:

- **Transparency**: `transparent: true` for gas cloud effects
- **Normal Blending**: `blending: THREE.NormalBlending` for realistic compositing
- **Depth Writing**: `depthWrite: true` for proper depth sorting
- **Depth Testing**: `depthTest: true` for correct rendering order

## Integration with Comet System

The coma fragment shader works with:

1. **Coma Vertex Shader**: Provides position, normal, and depth data
2. **CometComaMaterial**: Manages uniforms and material properties
3. **CometRenderer**: Updates uniforms and manages activity-based scaling

## Activity-based Rendering

The coma shader supports activity-based rendering:

- **Opacity Scaling**: Base opacity scales with comet activity
- **Dynamic Updates**: Uniforms updated based on solar distance
- **Performance Optimization**: Reduced updates for inactive comets

## Usage Example

```glsl
// Typical uniform values for active comet
uColor = vec3(0.53, 0.81, 0.92);  // Light blue gas color
uOpacity = 0.5;                    // Base opacity
uTime = 1234.56;                   // Current simulation time
uNumLights = 1;                    // Single light source (Sun)
```

## Dependencies

- **2D Simplex Noise**: Procedural noise generation
- **Lighting System**: Multi-light source support
- **Time System**: Animation timing

## 🔗 Related

- [[CometComaMaterial]] - Material that uses this shader
- [[CometRenderer]] - Renderer that manages this shader
- [[CometMaterials]] - Collection of all comet materials
