---
aliases: [basic.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/basic.fragment.glsl"
status: active
---

# basic.fragment.glsl

Fragment shader for basic gas giant rendering used in LOD levels, featuring simple lighting with shadow casting and smooth terminator handling.

## Overview

The basic fragment shader provides simplified gas giant rendering for LOD levels, featuring basic lighting with shadow casting, smooth terminator handling, and performance optimization for distant viewing. It's used in medium and distant LOD levels where complex atmospheric effects are not needed.

## Shader Features

- **Simple Lighting**: Basic diffuse lighting with multiple light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Smooth Terminator**: Wide transition around day/night boundary
- **Performance Optimization**: Simplified rendering for LOD levels
- **Dynamic Ambient Lighting**: Configurable ambient light intensity
- **Gamma Correction**: Basic gamma correction for realistic appearance

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Usage**: Texture sampling (currently unused)
- **Source**: Basic vertex shader

### vNormal

```glsl
varying vec3 vNormal;
```

Vertex normal in world space.

- **Usage**: Lighting calculations
- **Source**: Basic vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: Basic vertex shader

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: Basic vertex shader

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 baseColor;
```

- **baseColor**: Base color for the gas giant

### Lighting Uniforms

```glsl
uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;
uniform float uDynamicAmbientIntensity;
```

- **uLights**: Array of light sources (up to 4)
- **uNumLights**: Number of active light sources
- **uShadowCasters**: Array of shadow casters (up to 8)
- **uNumShadowCasters**: Number of active shadow casters
- **uDynamicAmbientIntensity**: Dynamic ambient lighting intensity

### Time Uniform

```glsl
uniform float time;
```

- **time**: Current simulation time (currently unused)

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

## Shadow Casting System

### Ray-Sphere Intersection

```glsl
float getShadow(vec3 fragPos, vec3 lightPos, vec3 casterPos, float casterRadius) {
  vec3 lightDir = normalize(lightPos - fragPos);
  vec3 oc = fragPos - casterPos;
  float b = dot(oc, lightDir);
  float c = dot(oc, oc) - (casterRadius * casterRadius);
  float discriminant = b * b - c;

  if (discriminant < 0.0) {
    return 1.0; // No intersection, fully lit
  }

  float t = -b - sqrt(discriminant);
  if (t > 0.001) { // Epsilon to avoid self-shadowing
    return 0.0; // In shadow
  }

  return 1.0; // Lit
}
```

## Main Rendering Pipeline

### 1. Normal Calculation

```glsl
vec3 normal = normalize(vNormal);
```

### 2. Ambient Lighting

```glsl
// Much darker ambient for proper night sides
vec3 ambient = baseColor * (uDynamicAmbientIntensity * 0.05);
```

### 3. Diffuse Lighting with Shadow Casting

```glsl
// Diffuse lighting with smooth terminator handling
vec3 diffuse = vec3(0.0);

for (int i = 0; i < MAX_LIGHTS; i++) {
  if (i >= uNumLights) break;

  // Calculate direction from fragment to light
  vec3 lightDir = normalize(uLights[i].position - vPosition);

  // Calculate smooth terminator transition
  float dotProduct = dot(normal, lightDir);

  // Create a much wider, smoother transition around the terminator
  float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct);

  // Diffuse component
  float diff = max(dotProduct, 0.0);

  // Shadow calculation
  float shadow = 1.0;
  for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
    if (j >= uNumShadowCasters) break;
    shadow = min(shadow, getShadow(vPosition, uLights[i].position,
                                  uShadowCasters[j].position,
                                  uShadowCasters[j].radius));
  }

  // Apply lighting with smooth terminator transition
  float lightContribution = terminatorTransition * shadow;
  diffuse += diff * uLights[i].color * uLights[i].intensity * lightContribution * 0.3;

  // Add subtle night side illumination
  float nightContribution = (1.0 - terminatorTransition) * 0.02;
  diffuse += nightContribution * uLights[i].color * uLights[i].intensity;
}
```

### 4. Final Color Calculation

```glsl
// Final color
vec3 finalColor = ambient + diffuse * baseColor;

// Clamp before gamma correction to prevent artifacts
finalColor = clamp(finalColor, 0.0, 1.0);

// Apply basic gamma correction
finalColor = pow(finalColor, vec3(1.0 / 2.2));

gl_FragColor = vec4(finalColor, 1.0);
```

## Performance Optimizations

### Simplified Rendering

- **Basic Lighting**: Simple diffuse lighting without complex atmospheric effects
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Minimal Calculations**: Reduced computational complexity for LOD levels

### LOD Optimization

- **Distance-based Usage**: Used in medium and distant LOD levels
- **Performance Focus**: Optimized for distant viewing where detail is not critical
- **Memory Efficiency**: Minimal uniform usage and calculations

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Simple shadow casting without penumbra effects
- **Night Side Illumination**: Subtle night side glow for realism

## Visual Effects

### Basic Lighting

- **Diffuse Lighting**: Standard Lambertian diffuse lighting
- **Multi-Light Support**: Support for up to 4 light sources
- **Smooth Terminator**: Wide transition around day/night boundary
- **Night Side Illumination**: Subtle night side glow

### Shadow Effects

- **Real-time Shadows**: Shadow casting with multiple shadow casters
- **Efficient Calculations**: Simple ray-sphere intersection tests
- **Performance Focus**: Optimized for LOD levels

### Color Rendering

- **Base Color**: Simple base color rendering
- **Ambient Lighting**: Configurable ambient light intensity
- **Gamma Correction**: Basic gamma correction for realistic appearance

## Integration

The fragment shader works with:

- **Vertex Shader**: [[celestials/gas-giants/basic.vertex.glsl|Basic Vertex Shader]] provides position and normal data
- **Material**: [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] manages uniforms and updates
- **Renderer**: [[celestials/gas-giants/BaseGasGiantRenderer|Base Gas Giant Renderer]] creates geometry and manages updates

## Usage in LOD System

The basic fragment shader is used in:

1. **LOD Level 1**: Medium detail level with reduced complexity
2. **LOD Level 2**: Distant viewing level for performance
3. **Fallback Rendering**: Simple rendering when complex effects fail

## Dependencies

- **Basic Lighting**: Simple diffuse lighting calculations
- **Shadow Casting**: Real-time shadow calculations
- **Gamma Correction**: Basic gamma correction

## 🔗 Related

- [[celestials/gas-giants/basic.vertex.glsl|Basic Vertex Shader]] - Vertex shader that provides input data
- [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] - Material that uses this shader
- [[celestials/gas-giants/BaseGasGiantRenderer|Base Gas Giant Renderer]] - Renderer that manages this shader
- [[celestials/gas-giants/class-i.fragment.glsl|Class I Fragment Shader]] - Complex fragment shader for comparison
