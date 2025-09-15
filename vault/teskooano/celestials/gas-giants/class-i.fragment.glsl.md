---
aliases: [class-i.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-i.fragment.glsl"
status: active
---

# class-i.fragment.glsl

Fragment shader for Class I gas giants (Ammonia Clouds - Jupiter-like) with 4D fractal simplex noise, atmospheric effects, and advanced lighting with shadow casting.

## Overview

The Class I fragment shader implements sophisticated atmospheric rendering for Class I gas giants, featuring 4D fractal simplex noise for realistic ammonia cloud layers, multi-light source lighting, shadow casting with penumbra effects, and storm map overlay support. It creates Jupiter-like atmospheric effects with procedural generation.

## Shader Features

- **4D Fractal Simplex Noise**: Advanced procedural atmospheric effects
- **Ammonia Cloud Simulation**: Realistic Jupiter-like atmospheric rendering
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
- **Source**: [[class-i.vertex.glsl]]

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

Vertex position in world space.

- **Usage**: Lighting calculations, distance-based effects
- **Source**: [[class-i.vertex.glsl]]

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera to vertex.

- **Usage**: View-dependent effects
- **Source**: [[class-i.vertex.glsl]]

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Usage**: Procedural noise generation
- **Source**: [[class-i.vertex.glsl]]

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: [[class-i.vertex.glsl]]

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: [[class-i.vertex.glsl]]

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates.

- **Usage**: Texture sampling
- **Source**: [[class-i.vertex.glsl]]

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 mainColor1;       // Mapped from atmosphereColor
uniform vec3 mainColor2;       // Mapped from cloudColor
uniform vec3 darkColor;        // Derived dark color
```

- **mainColor1**: Base atmosphere color
- **mainColor2**: Cloud layer color
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

The shader includes a complete 4D simplex noise implementation:

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

### 1. Noise Sample Point Setup

```glsl
// Noise Sample Point Setup (Class I parameters)
vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, seed);
seededSamplePoint.y *= 2.5;
float latitude = seededSamplePoint.y;
```

### 2. Atmospheric Warping

```glsl
// Noise Warping (Class I parameters)
float warpingStrength = 2.0;
float warpDecay = 2.0;
float warpLacunarity = 2.0;
float warping = fractalSimplex4(seededSamplePoint, uWarpOctaves, warpDecay, warpLacunarity) * warpingStrength;
```

### 3. Color Decision Generation

```glsl
// Color Decisions (Class I parameters)
float colorDecay = 2.0;
float colorLacunarity = 2.0;
float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seed, -seed, seed), uColorOctaves, colorDecay, colorLacunarity);
float colorDecision2 = fractalSimplex4(vec4(latitude - warping, seed, -seed, seed), uColorOctaves, colorDecay, colorLacunarity);
```

### 4. Color Blending

```glsl
// Color Blending (Class I parameters)
noiseColor = lerp(mainColor1, darkColor, smoothstep(0.4, 0.6, colorDecision1));
noiseColor = lerp(noiseColor, mainColor2, smoothstep(0.2, 0.8, colorDecision2));
```

### 5. Lighting Calculation

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

### 6. Storm Map Overlay

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

### 7. Final Color Output

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
        // Penumbra width is proportional to the occluder's radius
        float penumbra = uShadowCasters[i].radius * 0.8;
        float penumbraSq = penumbra * penumbra;

        // Calculate smooth fade from lit to shadow
        float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
        finalShadow = min(finalShadow, currentShadow);
      }
    }
  }
  return finalShadow;
}
```

## Performance Optimizations

### LOD Control

- **Octave Reduction**: Noise octave counts can be reduced for distant viewing
- **Dynamic Complexity**: Atmospheric complexity scales with distance
- **Efficient Calculations**: Optimized noise generation for real-time performance

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance

### Noise Optimization

- **4D Noise**: Efficient 4D simplex noise implementation
- **Fractal Generation**: Multi-octave noise with configurable complexity
- **Seeded Generation**: Deterministic results for consistent appearance

## Visual Effects

### Atmospheric Rendering

- **Ammonia Cloud Layers**: Realistic Jupiter-like atmospheric layers
- **Procedural Patterns**: Seeded randomness for consistent appearance
- **Atmospheric Warping**: Noise-based atmospheric distortion
- **Color Variation**: Multiple color layers with smooth blending

### Lighting Effects

- **Multi-Light Support**: Up to 4 light sources with individual contributions
- **Shadow Casting**: Real-time shadows with penumbra effects
- **Smooth Terminator**: Wide transition around day/night boundary
- **Night Side Illumination**: Subtle night side glow

### Storm Effects

- **Storm Map Overlay**: Optional storm texture overlay
- **Spherical Mapping**: Proper UV mapping for spherical objects
- **Alpha Blending**: Storm effects blend with atmospheric colors

## Integration

The fragment shader works with:

- **Vertex Shader**: [[class-i.vertex.glsl]] provides world position and normal data
- **Material**: [[ClassIMaterial]] manages uniforms and updates
- **Renderer**: [[ClassIGasGiantRenderer]] creates geometry and manages updates

## Dependencies

- **4D Simplex Noise**: Procedural noise generation
- **Lighting System**: Multi-light source support
- **Shadow Casting**: Real-time shadow calculations
- **Storm Textures**: Optional storm map overlay

## 🔗 Related

- [[class-i.vertex.glsl]] - Vertex shader that provides input data
- [[ClassIMaterial]] - Material that uses this shader
- [[ClassIGasGiantRenderer]] - Renderer that manages this shader
