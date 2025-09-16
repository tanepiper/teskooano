---
aliases: [class-ii.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-ii.fragment.glsl"
status: active
---

# class-ii.fragment.glsl

Fragment shader for Class II gas giants (Water Clouds) with 4D fractal simplex noise, smoother atmospheric effects, and enhanced detail noise for realistic water vapor cloud rendering.

## Overview

The Class II fragment shader implements atmospheric rendering for Class II gas giants, featuring water vapor cloud layers with smoother, more subtle atmospheric effects compared to Class I. It uses 4D fractal simplex noise with adjusted parameters to create realistic water cloud formations and cooler temperature atmospheric effects.

## Shader Features

- **4D Fractal Simplex Noise**: Advanced procedural atmospheric effects with smoother parameters
- **Water Cloud Simulation**: Realistic water vapor cloud rendering for cooler gas giants
- **Enhanced Detail Noise**: Additional detail layer for more realistic cloud formations
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Storm Map Overlay**: Optional storm texture overlay
- **LOD-Controlled Octaves**: Dynamic noise complexity based on distance
- **Smooth Terminator**: Wide transition around day/night boundary

## Varying Variables

### vNormal

```glsl
varying vec3 vNormal;
```

Vertex normal in world space.

- **Usage**: Specular lighting calculations
- **Source**: Class II vertex shader

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

Vertex position in world space.

- **Usage**: Lighting calculations, distance-based effects
- **Source**: Class II vertex shader

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera to vertex.

- **Usage**: View-dependent effects
- **Source**: Class II vertex shader

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Usage**: Procedural noise generation
- **Source**: Class II vertex shader

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: Class II vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: Class II vertex shader

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates.

- **Usage**: Texture sampling
- **Source**: Class II vertex shader

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 mainColor1;       // Mapped from atmosphereColor (e.g., light yellow/cream)
uniform vec3 mainColor2;       // Mapped from cloudColor (e.g., light brown/orange)
uniform vec3 darkColor;        // Derived dark color (e.g., dark brown/red)
```

- **mainColor1**: Base atmosphere color for water clouds
- **mainColor2**: Water cloud layer color
- **darkColor**: Derived dark color for atmospheric depth

### Noise Uniforms

```glsl
uniform float uSeed;           // Seed for procedural generation
uniform int uWarpOctaves;      // LOD-controlled octave count for warping noise
uniform int uColorOctaves;     // LOD-controlled octave count for color noise
```

- **uSeed**: Seed for deterministic procedural generation
- **uWarpOctaves**: Number of octaves for atmospheric warping (LOD-controlled)
- **uColorOctaves**: Number of octaves for color variation (LOD-controlled)

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
- **uShadowCasters**: Array of shadow casters (up to 16)
- **uNumShadowCasters**: Number of active shadow casters
- **uDynamicAmbientIntensity**: Dynamic ambient lighting intensity

### Storm Map Uniforms

```glsl
uniform sampler2D stormMap;
uniform bool hasStormMap;
```

- **stormMap**: Optional storm texture overlay
- **hasStormMap**: Flag indicating if storm map is available

### Time Uniform

```glsl
uniform float time;
```

- **time**: Current simulation time for animation

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

### 4D Simplex Noise Implementation

The shader includes the same 4D simplex noise implementation as Class I:

```glsl
float snoise(vec4 v)
```

- **Purpose**: Generates 4D simplex noise for atmospheric effects
- **Range**: -1.0 to 1.0
- **Usage**: Base for all procedural atmospheric effects

### Fractal Simplex Noise 4D

```glsl
float fractalSimplex4(vec4 p, int nbOctaves, float decay, float lacunarity)
```

- **Purpose**: Multi-octave 4D noise for realistic atmospheric detail
- **Octaves**: Configurable number of octaves (LOD-controlled)
- **Usage**: Atmospheric warping and color variation

## Main Rendering Pipeline

### 1. Noise Sample Point Setup (Class II Parameters)

```glsl
// Noise Sample Point Setup - Smoother Class II
vec4 seededSamplePoint = vec4(vUnitSamplePoint * 1.2, seed);
seededSamplePoint.y *= 1.5;
float latitude = seededSamplePoint.y;
```

**Class II Adjustments:**

- **Scale Factor**: 1.2 (vs 2.0 for Class I) - Smoother, less detailed patterns
- **Latitude Scaling**: 1.5 (vs 2.5 for Class I) - More subtle latitude effects

### 2. Atmospheric Warping (Class II Parameters)

```glsl
// Noise Warping
float warpingStrength = 0.4;
float warpDecay = 1.9;
float warpLacunarity = 2.0;
float warping = fractalSimplex4(seededSamplePoint, uWarpOctaves, warpDecay, warpLacunarity) * warpingStrength;
```

**Class II Adjustments:**

- **Warping Strength**: 0.4 (vs 2.0 for Class I) - Much smoother atmospheric distortion
- **Warp Decay**: 1.9 (vs 2.0 for Class I) - Slightly less amplitude decay
- **Warp Lacunarity**: 2.0 (same as Class I)

### 3. Color Decision Generation (Class II Parameters)

```glsl
// Color Decisions
float colorDecay = 1.8;
float colorLacunarity = 2.0;
float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seed * 0.7, -seed * 1.1, seed), uColorOctaves, colorDecay, colorLacunarity);
float colorDecision2 = fractalSimplex4(vec4(latitude - warping * 0.8, seed * 1.3, -seed * 0.9, seed), uColorOctaves, colorDecay, colorLacunarity);
```

**Class II Adjustments:**

- **Color Decay**: 1.8 (vs 2.0 for Class I) - Smoother color transitions
- **Seed Variations**: Different seed multipliers for more varied patterns
- **Warping Reduction**: 0.8 multiplier for second decision

### 4. Color Blending (Class II Parameters)

```glsl
// Color Blending
noiseColor = lerp(mainColor1, darkColor, smoothstep(0.25, 0.75, colorDecision1));
noiseColor = lerp(noiseColor, mainColor2, smoothstep(0.2, 0.8, colorDecision2));
```

**Class II Adjustments:**

- **Smoother Transitions**: 0.25-0.75 range (vs 0.4-0.6 for Class I)
- **More Gradual Blending**: 0.2-0.8 range (vs 0.2-0.8 for Class I)

### 5. Enhanced Detail Noise (Class II Specific)

```glsl
// Detail Noise
float detailNoiseScale = 3.0;
vec4 detailSamplePoint = vec4(vUnitSamplePoint * detailNoiseScale, seed * 2.0);
float detailNoise = fractalSimplex4(detailSamplePoint, max(1, uColorOctaves - 2), 2.0, 2.0);
vec3 detailColorVariation = (mainColor1 - mainColor2) * 0.08;
noiseColor = lerp(noiseColor, noiseColor + detailColorVariation, smoothstep(0.3, 0.7, detailNoise));
```

**Class II Specific Feature:**

- **Detail Layer**: Additional noise layer for more realistic cloud formations
- **Scale**: 3.0 for fine detail
- **Color Variation**: Subtle color variations based on main colors
- **LOD Control**: Reduces octaves for distant viewing

### 6. Lighting Calculation

```glsl
// Calculate lighting components
vec3 totalLight = vec3(0.0);
vec3 diffuseNormal = normalize(vSphereNormalW);

// Much darker ambient for proper night sides
totalLight += vec3(uDynamicAmbientIntensity * 0.05);

for (int i = 0; i < uNumLights; i++) {
  if (uLights[i].intensity <= 0.0) continue;

  vec3 lightDir = normalize(uLights[i].position - vPosition);

  // Create a much wider, smoother transition around the terminator
  float dotProduct = dot(diffuseNormal, lightDir);
  float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct);

  float diffuse = max(dotProduct, 0.0);
  float shadow = getShadow(vPosition, lightDir);

  // Apply lighting with smooth terminator transition
  float lightContribution = terminatorTransition * shadow;
  totalLight += uLights[i].color * uLights[i].intensity * diffuse * lightContribution * 0.3;

  // Add subtle night side illumination
  float nightContribution = (1.0 - terminatorTransition) * 0.02;
  totalLight += uLights[i].color * uLights[i].intensity * nightContribution;
}
```

### 7. Storm Map Overlay

```glsl
// Apply storm overlay if available
if (hasStormMap) {
  vec2 stormUv = vec2(
    0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
    0.5 - asin(vUnitSamplePoint.y) / 3.14159
  );

  vec4 stormColor = texture2D(stormMap, stormUv);
  finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.8);
}
```

### 8. Final Color Output

```glsl
// Final color is a mix based on the noise value
vec3 finalColor = noiseColor * totalLight;

// Clamp before gamma correction
finalColor = clamp(finalColor, 0.0, 1.0);

// Apply basic gamma correction
finalColor = pow(finalColor, vec3(1.0 / 2.2));

gl_FragColor = vec4(finalColor, 1.0);
```

## Shadow Casting System

### Ray-Sphere Intersection

```glsl
float getShadow(vec3 fragPos, vec3 lightDir) {
  float finalShadow = 1.0;

  for (int i = 0; i < uNumShadowCasters; i++) {
    if (uShadowCasters[i].radius <= 0.0) continue;

    vec3 oc = fragPos - uShadowCasters[i].position;
    float b = dot(oc, lightDir);
    float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
    float discriminant = b * b - c;

    if (discriminant > 0.0) {
      float t = -b - sqrt(discriminant);
      if (t > 0.001) {
        float penumbra = uShadowCasters[i].radius * 0.8;
        float penumbraSq = penumbra * penumbra;

        float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
        finalShadow = min(finalShadow, currentShadow);
      }
    }
  }
  return finalShadow;
}
```

## Class II Specific Features

### Water Cloud Characteristics

- **Smoother Patterns**: Reduced noise intensity for more subtle water cloud formations
- **Cooler Temperature Effects**: Atmospheric effects optimized for cooler gas giants
- **Enhanced Detail**: Additional detail noise layer for realistic cloud structure
- **Gradual Transitions**: Smoother color blending for water vapor clouds

### Atmospheric Parameters

| Parameter            | Class II Value | Class I Value | Purpose                       |
| -------------------- | -------------- | ------------- | ----------------------------- |
| **Scale Factor**     | 1.2            | 2.0           | Smoother patterns             |
| **Latitude Scaling** | 1.5            | 2.5           | Subtle latitude effects       |
| **Warping Strength** | 0.4            | 2.0           | Smooth atmospheric distortion |
| **Color Decay**      | 1.8            | 2.0           | Smooth color transitions      |
| **Detail Scale**     | 3.0            | N/A           | Fine cloud detail             |

### Visual Effects

- **Water Vapor Clouds**: Realistic water cloud formations with smooth transitions
- **Cooler Atmosphere**: Atmospheric effects optimized for cooler temperatures
- **Enhanced Detail**: Additional detail layer for more realistic cloud structure
- **Smooth Blending**: Gradual color transitions for water vapor effects

## Performance Optimizations

### LOD Control

- **Octave Reduction**: Noise octave counts can be reduced for distant viewing
- **Detail Reduction**: Detail noise octaves reduce with distance
- **Dynamic Complexity**: Atmospheric complexity scales with distance

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance

### Noise Optimization

- **4D Noise**: Efficient 4D simplex noise implementation
- **Fractal Generation**: Multi-octave noise with configurable complexity
- **Seeded Generation**: Deterministic results for consistent appearance

## Integration

The fragment shader works with:

- **Vertex Shader**: Class II vertex shader provides world position and normal data
- **Material**: [[celestials/gas-giants/GasGiantMaterials|Class II Material]] manages uniforms and updates
- **Renderer**: [[celestials/gas-giants/ClassIIGasGiantRenderer|Class II Gas Giant Renderer]] creates geometry and manages updates

## Dependencies

- **4D Simplex Noise**: Procedural noise generation
- **Lighting System**: Multi-light source support
- **Shadow Casting**: Real-time shadow calculations
- **Storm Textures**: Optional storm map overlay

## 🔗 Related

- [[celestials/gas-giants/class-ii.vertex.glsl|Class II Vertex Shader]] - Vertex shader that provides input data
- [[celestials/gas-giants/GasGiantMaterials|Class II Material]] - Material that uses this shader
- [[celestials/gas-giants/ClassIIGasGiantRenderer|Class II Gas Giant Renderer]] - Renderer that manages this shader
- [[celestials/gas-giants/class-i.fragment.glsl|Class I Fragment Shader]] - Class I fragment shader for comparison
