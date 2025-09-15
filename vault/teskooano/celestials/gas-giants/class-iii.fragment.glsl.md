---
aliases: [class-iii.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-iii.fragment.glsl"
status: active
---

# class-iii.fragment.glsl

Fragment shader for Class III gas giants (Cloudless) with atmospheric scattering effects, subtle banding, and enhanced specular lighting for clear, hot atmospheres.

## Overview

The Class III fragment shader implements atmospheric rendering for Class III gas giants, featuring cloudless, clear atmospheres with atmospheric scattering effects, subtle banding, and enhanced specular lighting. It creates hot, clear atmospheric effects without complex cloud formations, focusing on atmospheric scattering and rim lighting.

## Shader Features

- **Atmospheric Scattering**: Realistic atmospheric scattering effects for clear atmospheres
- **Subtle Banding**: Very subtle atmospheric banding for visual interest
- **Enhanced Specular Lighting**: Sharp specular highlights for hot, clear atmospheres
- **Rim Lighting**: Atmospheric rim lighting effects
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Storm Map Overlay**: Optional storm texture overlay
- **Smooth Terminator**: Wide transition around day/night boundary

## Varying Variables

### vNormal

```glsl
varying vec3 vNormal;
```

World space normal for lighting.

- **Usage**: Lighting calculations
- **Source**: Class III vertex shader

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World space position.

- **Usage**: Lighting calculations, distance-based effects
- **Source**: Class III vertex shader

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera.

- **Usage**: View-dependent effects
- **Source**: Class III vertex shader

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Usage**: Atmospheric banding calculations
- **Source**: Class III vertex shader

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: Class III vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: Class III vertex shader

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates.

- **Usage**: Texture sampling
- **Source**: Class III vertex shader

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 baseColor;        // The primary azure/blue color
```

- **baseColor**: Primary color for the cloudless atmosphere (typically azure/blue)

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

### 1. Atmospheric Scattering Setup

```glsl
vec3 normal = normalize(vNormal);
vec3 viewDir = normalize(vViewDirection);
vec3 diffuseNormal = normalize(vSphereNormalW);

// Create atmospheric scattering effect for cloudless azure appearance
float viewAngle = dot(viewDir, normal);
float atmosphereIntensity = 1.0 - abs(viewAngle); // Stronger at edges
```

**Atmospheric Scattering:**

- **View Angle**: Calculates angle between view direction and normal
- **Atmosphere Intensity**: Stronger scattering at edges (limb darkening effect)

### 2. Subtle Atmospheric Banding

```glsl
// Create subtle atmospheric banding with better contrast
float latitude = vUnitSamplePoint.y * 1.0 + time * 0.0005; // Very slow movement
float longitude = atan(vUnitSamplePoint.z, vUnitSamplePoint.x) * 1.0;

// Subtle atmospheric variations (much more subtle than previous)
float bands = sin(latitude * 3.0 + longitude * 1.5) * 0.05 + 0.5; // Very subtle banding
bands = smoothstep(0.45, 0.55, bands);
```

**Atmospheric Banding:**

- **Latitude**: Based on Y coordinate with slow time animation
- **Longitude**: Based on XZ coordinates
- **Banding**: Very subtle sine wave patterns (0.05 amplitude)
- **Smoothstep**: Creates subtle contrast bands

### 3. Atmospheric Color Calculation

```glsl
// Subtle depth variations using the base color more conservatively
vec3 atmosphereColor = baseColor * (0.95 + bands * 0.1); // Very subtle variation
atmosphereColor = mix(baseColor, atmosphereColor, atmosphereIntensity * 0.2); // Much less mixing
```

**Color Calculation:**

- **Base Variation**: 0.95 to 1.05 range for subtle color variation
- **Atmospheric Mixing**: Limited mixing (0.2 factor) for subtle effects

### 4. Lighting Calculation

```glsl
// Much darker ambient for proper night sides
vec3 ambient = atmosphereColor * (uDynamicAmbientIntensity * 0.05);
vec3 totalDiffuse = vec3(0.0);
vec3 totalSpecular = vec3(0.0);

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
  totalDiffuse += atmosphereColor * diffuse * lightContribution * 0.25 * uLights[i].color * uLights[i].intensity;

  // Specular component (basic Blinn-Phong) with smooth falloff
  vec3 halfAngle = normalize(viewDir + lightDir);
  float specComp = max(0.0, dot(normal, halfAngle));
  specComp = clamp01(specComp);
  specComp = pow(specComp, 40.0); // Sharper highlights for Class III

  // Apply specular with smoother falloff
  float specularFalloff = smoothstep(-0.2, 0.3, dotProduct);
  totalSpecular += vec3(0.05) * specComp * lightContribution * specularFalloff * uLights[i].color * uLights[i].intensity;

  // Add subtle night side illumination
  float nightContribution = (1.0 - terminatorTransition) * 0.02;
  totalDiffuse += atmosphereColor * nightContribution * uLights[i].color * uLights[i].intensity;
}
```

**Lighting Features:**

- **Diffuse Lighting**: Standard Lambertian diffuse lighting
- **Specular Highlights**: Sharp highlights (power 40.0) for hot, clear atmospheres
- **Smooth Terminator**: Wide transition around day/night boundary
- **Night Side Illumination**: Subtle night side glow

### 5. Rim Lighting

```glsl
// Rim Lighting (Class III adjustments - potentially less pronounced)
float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
float rimIntensity = pow(rimDot, 2.0); // Softer falloff
rimIntensity = clamp01(rimIntensity * 0.4); // Less intense rim
vec3 rimColor = mix(baseColor, vec3(1.0), 0.10); // Blend even less white
vec3 rim = rimColor * rimIntensity;
```

**Rim Lighting:**

- **Rim Calculation**: Based on view angle and normal
- **Softer Falloff**: Power 2.0 for softer rim effect
- **Less Intense**: 0.4 intensity factor
- **Color Blending**: Minimal white blending (0.10)

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
  finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.8);
}
```

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

## Class III Specific Features

### Cloudless Atmosphere Characteristics

- **Clear Atmosphere**: No cloud formations, focusing on atmospheric scattering
- **Hot Temperature Effects**: Atmospheric effects optimized for hot gas giants
- **Enhanced Specular**: Sharp specular highlights for hot, clear atmospheres
- **Subtle Banding**: Very subtle atmospheric banding for visual interest

### Atmospheric Scattering

- **Limb Darkening**: Stronger scattering at edges for realistic atmospheric effects
- **View Angle Dependent**: Scattering intensity based on viewing angle
- **Subtle Variations**: Very subtle color variations for atmospheric depth

### Lighting Characteristics

| Component            | Class III Value | Purpose                              |
| -------------------- | --------------- | ------------------------------------ |
| **Specular Power**   | 40.0            | Sharp highlights for hot atmospheres |
| **Specular Falloff** | -0.2 to 0.3     | Tight falloff for specular           |
| **Rim Intensity**    | 0.4             | Less intense rim lighting            |
| **Rim Falloff**      | 2.0             | Softer rim falloff                   |
| **Color Blending**   | 0.10            | Minimal white blending               |

### Visual Effects

- **Atmospheric Scattering**: Realistic scattering effects for clear atmospheres
- **Subtle Banding**: Very subtle atmospheric banding patterns
- **Sharp Specular**: Sharp specular highlights for hot atmospheres
- **Rim Lighting**: Atmospheric rim lighting effects

## Performance Optimizations

### Simplified Rendering

- **No Complex Noise**: No 4D simplex noise for performance
- **Simple Banding**: Basic sine wave patterns for atmospheric banding
- **Efficient Calculations**: Optimized lighting calculations

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance

## Integration

The fragment shader works with:

- **Vertex Shader**: Class III vertex shader provides world position and normal data
- **Material**: [[ClassIIIMaterial]] manages uniforms and updates
- **Renderer**: [[ClassIIIGasGiantRenderer]] creates geometry and manages updates

## Dependencies

- **Atmospheric Scattering**: Simple scattering calculations
- **Lighting System**: Multi-light source support
- **Shadow Casting**: Real-time shadow calculations
- **Storm Textures**: Optional storm map overlay

## 🔗 Related

- [[class-iii.vertex.glsl]] - Vertex shader that provides input data
- [[ClassIIIMaterial]] - Material that uses this shader
- [[ClassIIIGasGiantRenderer]] - Renderer that manages this shader
- [[class-i.fragment.glsl]] - Class I fragment shader for comparison
- [[class-ii.fragment.glsl]] - Class II fragment shader for comparison
