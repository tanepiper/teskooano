---
aliases: [class-iv.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-iv.fragment.glsl"
status: active
---

# class-iv.fragment.glsl

Fragment shader for Class IV gas giants (Alkali Metals) with alkali metal absorption patterns, hot atmospheric effects, and enhanced rim lighting for very hot, metal-rich atmospheres.

## Overview

The Class IV fragment shader implements atmospheric rendering for Class IV gas giants, featuring alkali metal cloud layers with absorption patterns, hot atmospheric effects, and enhanced rim lighting. It creates very hot, metal-rich atmospheric effects with subtle alkali metal absorption bands and enhanced specular lighting.

## Shader Features

- **Alkali Metal Absorption**: Realistic alkali metal absorption patterns and bands
- **Hot Atmospheric Effects**: Atmospheric effects optimized for very hot gas giants
- **Enhanced Rim Lighting**: More intense rim lighting for hot atmospheres
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Storm Map Overlay**: Optional storm texture overlay
- **Smooth Terminator**: Wide transition around day/night boundary
- **Metallic Appearance**: Specialized rendering for metal-rich atmospheres

## Varying Variables

### vNormal

```glsl
varying vec3 vNormal;
```

World space normal for lighting.

- **Usage**: Lighting calculations
- **Source**: Class IV vertex shader

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World space position.

- **Usage**: Lighting calculations, distance-based effects
- **Source**: Class IV vertex shader

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera.

- **Usage**: View-dependent effects
- **Source**: Class IV vertex shader

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Usage**: Alkali metal absorption pattern calculations
- **Source**: Class IV vertex shader

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: Class IV vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: Class IV vertex shader

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates.

- **Usage**: Texture sampling
- **Source**: Class IV vertex shader

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 baseColor; // A very dark base color (e.g., dark grey/brown/red)
```

- **baseColor**: Very dark base color for alkali metal atmospheres

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

## Main Rendering Pipeline

### 1. Alkali Metal Absorption Setup

```glsl
vec3 normal = normalize(vNormal);
vec3 viewDir = normalize(vViewDirection);
vec3 diffuseNormal = normalize(vSphereNormalW);

// Create alkali metal absorption patterns and hot atmospheric effects
float viewAngle = dot(viewDir, normal);
float atmosphereIntensity = 1.0 - abs(viewAngle);
```

**Atmospheric Setup:**

- **View Angle**: Calculates angle between view direction and normal
- **Atmosphere Intensity**: Stronger effects at edges (limb darkening)

### 2. Alkali Metal Absorption Patterns

```glsl
// Create hot atmospheric disturbances with alkali metal lines
float latitude = vUnitSamplePoint.y * 1.2 + time * 0.001;
float longitude = atan(vUnitSamplePoint.z, vUnitSamplePoint.x) * 1.5 + time * 0.0008;

// Alkali metal absorption bands (more subtle and detailed)
float sodiumBands = sin(latitude * 3.5) * sin(longitude * 2.0) * 0.15 + 0.5;
float potassiumBands = sin(longitude * 3.0 + latitude * 1.5) * 0.1 + 0.5;
float hotSpots = sin(latitude * 5.0) * sin(longitude * 4.0) * 0.08 + 0.5;

sodiumBands = smoothstep(0.4, 0.6, sodiumBands);
potassiumBands = smoothstep(0.45, 0.55, potassiumBands);
hotSpots = smoothstep(0.6, 0.8, hotSpots);
```

**Alkali Metal Patterns:**

- **Sodium Bands**: 3.5x latitude, 2.0x longitude with 0.15 amplitude
- **Potassium Bands**: 3.0x longitude, 1.5x latitude with 0.1 amplitude
- **Hot Spots**: 5.0x latitude, 4.0x longitude with 0.08 amplitude
- **Smoothstep**: Creates distinct absorption bands

### 3. Alkali Metal Color Calculation

```glsl
// Very subtle alkali effects, preserving base color detail
vec3 alkaliColor = baseColor;
alkaliColor *= (0.3 + sodiumBands * 0.4); // Darken with sodium absorption
alkaliColor *= (0.8 + potassiumBands * 0.2); // Slight potassium darkening
alkaliColor += vec3(0.2, 0.1, 0.05) * hotSpots * 0.3; // Subtle hot spots

// Apply atmospheric effects much more subtly
alkaliColor = mix(baseColor * 0.5, alkaliColor, 0.8 + atmosphereIntensity * 0.2);
```

**Color Calculation:**

- **Sodium Absorption**: 0.3 to 0.7 range (darkening effect)
- **Potassium Absorption**: 0.8 to 1.0 range (slight darkening)
- **Hot Spots**: Reddish-orange hot spots (0.2, 0.1, 0.05)
- **Atmospheric Mixing**: Limited mixing for subtle effects

### 4. Lighting Calculation

```glsl
// Much darker ambient for proper night sides
vec3 ambient = alkaliColor * (uDynamicAmbientIntensity * 0.03); // Extremely dark ambient for Class IV
vec3 totalDiffuse = vec3(0.0);
vec3 totalSpecular = vec3(0.0);

for (int i = 0; i < uNumLights; i++) {
  vec3 lightDir = normalize(uLights[i].position - vPosition);

  // Create a much wider, smoother transition around the terminator
  float dotProduct = dot(diffuseNormal, lightDir);
  float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct);

  float ndl = max(dotProduct, 0.0);
  ndl = clamp01(ndl);

  float shadow = getShadow(vPosition, lightDir);

  // Apply lighting with smooth terminator transition
  float lightContribution = terminatorTransition * shadow;
  totalDiffuse += alkaliColor * ndl * lightContribution * 0.03 * uLights[i].color * uLights[i].intensity; // Very low diffuse

  // Specular component with smooth falloff
  vec3 halfAngle = normalize(viewDir + lightDir);
  float specComp = max(0.0, dot(normal, halfAngle));
  specComp = clamp01(specComp);
  specComp = pow(specComp, 100.0); // Very tight

  // Apply specular with smoother falloff
  float specularFalloff = smoothstep(-0.1, 0.2, dotProduct); // Very tight falloff for specular
  totalSpecular += vec3(0.08) * specComp * lightContribution * specularFalloff * uLights[i].color * uLights[i].intensity;

  // Add minimal night side illumination
  float nightContribution = (1.0 - terminatorTransition) * 0.01; // Minimal night glow for dark planets
  totalDiffuse += alkaliColor * nightContribution * uLights[i].color * uLights[i].intensity;
}
```

**Lighting Features:**

- **Extremely Dark Ambient**: 0.03 factor for very dark atmospheres
- **Very Low Diffuse**: 0.03 factor for minimal diffuse lighting
- **Very Tight Specular**: Power 100.0 for very sharp highlights
- **Tight Specular Falloff**: -0.1 to 0.2 range for tight specular control
- **Minimal Night Glow**: 0.01 factor for dark planets

### 5. Enhanced Rim Lighting

```glsl
// Rim Lighting (Class IV adjustments - more intense)
float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
float rimIntensity = pow(rimDot, 4.0); // Sharper falloff
rimIntensity = clamp01(rimIntensity * 0.8); // More intense rim
vec3 rimColor = mix(baseColor, vec3(1.0), 0.3) * 1.3; // Brighter rim color
vec3 rim = rimColor * rimIntensity;
```

**Enhanced Rim Lighting:**

- **Sharper Falloff**: Power 4.0 for sharper rim effect
- **More Intense**: 0.8 intensity factor
- **Brighter Rim Color**: 0.3 white blending with 1.3 brightness multiplier

### 6. Final Color Composition

```glsl
// Combine components
vec3 finalColor = ambient + totalDiffuse + totalSpecular + rim;
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
  // Blend the storm with the procedural texture, use lower alpha for dark planets
  finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.5);
}
```

**Storm Overlay:**

- **Lower Alpha**: 0.5 factor for dark planets (vs 0.8 for other classes)

### 8. Final Color Output

```glsl
// Clamp before gamma correction to prevent artifacts
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

## Class IV Specific Features

### Alkali Metal Characteristics

- **Sodium Absorption**: Distinct sodium absorption bands with darkening effect
- **Potassium Absorption**: Subtle potassium absorption with slight darkening
- **Hot Spots**: Reddish-orange hot spots for thermal effects
- **Metal-Rich Atmosphere**: Specialized rendering for metal-rich atmospheres

### Alkali Metal Parameters

| Element       | Pattern            | Amplitude | Smoothstep Range | Effect                     |
| ------------- | ------------------ | --------- | ---------------- | -------------------------- |
| **Sodium**    | 3.5x lat, 2.0x lon | 0.15      | 0.4-0.6          | Darkening (0.3-0.7)        |
| **Potassium** | 3.0x lon, 1.5x lat | 0.1       | 0.45-0.55        | Slight darkening (0.8-1.0) |
| **Hot Spots** | 5.0x lat, 4.0x lon | 0.08      | 0.6-0.8          | Reddish-orange spots       |

### Lighting Characteristics

| Component            | Class IV Value | Purpose                        |
| -------------------- | -------------- | ------------------------------ |
| **Ambient Factor**   | 0.03           | Extremely dark ambient         |
| **Diffuse Factor**   | 0.03           | Very low diffuse lighting      |
| **Specular Power**   | 100.0          | Very tight specular highlights |
| **Specular Falloff** | -0.1 to 0.2    | Very tight specular control    |
| **Rim Intensity**    | 0.8            | More intense rim lighting      |
| **Rim Falloff**      | 4.0            | Sharper rim falloff            |
| **Rim Brightness**   | 1.3            | Brighter rim color             |

### Visual Effects

- **Alkali Metal Absorption**: Realistic absorption bands for sodium and potassium
- **Hot Atmospheric Effects**: Atmospheric effects optimized for very hot temperatures
- **Enhanced Rim Lighting**: More intense rim lighting for hot atmospheres
- **Metallic Appearance**: Specialized rendering for metal-rich atmospheres

## Performance Optimizations

### Simplified Rendering

- **No Complex Noise**: No 4D simplex noise for performance
- **Simple Patterns**: Basic sine wave patterns for alkali metal absorption
- **Efficient Calculations**: Optimized lighting calculations

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance

## Integration

The fragment shader works with:

- **Vertex Shader**: Class IV vertex shader provides world position and normal data
- **Material**: [[ClassIVMaterial]] manages uniforms and updates
- **Renderer**: [[ClassIVGasGiantRenderer]] creates geometry and manages updates

## Dependencies

- **Alkali Metal Absorption**: Simple absorption pattern calculations
- **Lighting System**: Multi-light source support
- **Shadow Casting**: Real-time shadow calculations
- **Storm Textures**: Optional storm map overlay

## 🔗 Related

- [[class-iv.vertex.glsl]] - Vertex shader that provides input data
- [[ClassIVMaterial]] - Material that uses this shader
- [[ClassIVGasGiantRenderer]] - Renderer that manages this shader
- [[class-i.fragment.glsl]] - Class I fragment shader for comparison
- [[class-ii.fragment.glsl]] - Class II fragment shader for comparison
- [[class-iii.fragment.glsl]] - Class III fragment shader for comparison
