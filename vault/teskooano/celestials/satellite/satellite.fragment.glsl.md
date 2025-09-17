---
aliases: [satellite.fragment.glsl]
tags: [renderer, threejs, satellites, shader, fragment]
type: shader
package: "@teskooano/celestials-satellite"
file: "src/shaders/satellite.fragment.glsl"
status: active
---

# satellite.fragment.glsl

Fragment shader for satellite rendering with PBR lighting, multi-source lighting, shadow casting, and texture sampling.

## Overview

The satellite fragment shader implements physically-based rendering (PBR) for satellite models with advanced lighting calculations, shadow casting, and texture sampling. It provides realistic lighting effects including multi-source lighting, soft shadows with penumbra, dynamic emissive lighting, and environment map reflections.

## Shader Features

- **PBR Lighting**: Physically-based rendering with metallic and roughness properties
- **Multi-Source Lighting**: Lighting from up to 4 dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies with penumbra effects
- **Texture Sampling**: Support for diffuse, normal, roughness, and metalness maps
- **Environment Reflection**: Environment map reflections for metallic surfaces
- **Dynamic Emissive**: Emissive lighting based on shadow conditions
- **Terminator Handling**: Smooth day/night transitions
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

## Data Structures

### LightSource

```glsl
struct LightSource {
  vec3 position;
  vec3 color;
  float intensity;
};
```

Structure for light source data with position, color, and intensity.

### ShadowCaster

```glsl
struct ShadowCaster {
  vec3 position;
  float radius;
};
```

Structure for shadow caster data with position and radius.

## Uniform Variables

### Base Material Properties

```glsl
uniform vec3 baseColor;
uniform float metalness;
uniform float roughness;
uniform float maxEmissiveIntensity;
```

- **baseColor**: Base color multiplier for the satellite
- **metalness**: Metallic factor for PBR materials (0.0-1.0)
- **roughness**: Roughness factor for PBR materials (0.0-1.0)
- **maxEmissiveIntensity**: Maximum emissive intensity when fully illuminated

### Dynamic Lighting

```glsl
uniform float uDynamicAmbientIntensity;
uniform float uEmissiveIntensity;
uniform vec3 uEmissiveColor;
```

- **uDynamicAmbientIntensity**: Dynamic ambient light intensity
- **uEmissiveIntensity**: Calculated emissive intensity
- **uEmissiveColor**: Emissive color

### Texture Uniforms

```glsl
uniform sampler2D map;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;
uniform sampler2D metalnessMap;
uniform bool hasMap;
uniform bool hasNormalMap;
uniform bool hasRoughnessMap;
uniform bool hasMetalnessMap;
```

- **map**: Diffuse texture sampler
- **normalMap**: Normal map sampler
- **roughnessMap**: Roughness map sampler
- **metalnessMap**: Metalness map sampler
- **hasMap**: Whether diffuse texture exists
- **hasNormalMap**: Whether normal map exists
- **hasRoughnessMap**: Whether roughness map exists
- **hasMetalnessMap**: Whether metalness map exists

### Environment Map

```glsl
uniform samplerCube envMap;
uniform bool hasEnvMap;
uniform float envMapIntensity;
```

- **envMap**: Environment map sampler for reflections
- **hasEnvMap**: Whether environment map exists
- **envMapIntensity**: Environment map reflection intensity

### Dynamic Lighting Arrays

```glsl
uniform int uNumLights;
uniform LightSource uLightSources[MAX_LIGHTS];
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
```

- **uNumLights**: Number of active light sources
- **uLightSources**: Array of light source data
- **uNumShadowCasters**: Number of active shadow casters
- **uShadowCasters**: Array of shadow caster data

## Varying Variables

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

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from fragment to camera.

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the fragment.

## Functions

### getShadow

```glsl
float getShadow(vec3 fragPos, vec3 lightDir) {
  // Early exit if no shadow casters
  if (uNumShadowCasters <= 0) return 1.0;

  float finalShadow = 1.0;

  for (int i = 0; i < uNumShadowCasters; i++) {
    // This check is necessary because the array is padded with empty data
    if (uShadowCasters[i].radius <= 0.0) continue;

    vec3 oc = fragPos - uShadowCasters[i].position;
    float b = dot(oc, lightDir);
    float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
    float discriminant = b * b - c;

    // If the ray intersects the shadow caster sphere
    if (discriminant >= 0.0) {
      float t1 = -b - sqrt(discriminant);
      float t2 = -b + sqrt(discriminant);

      // Check if the shadow caster is between the light and the fragment
      if (t1 > 0.001 || (t1 <= 0.001 && t2 > 0.001)) {
        // Calculate distance from ray to sphere center for penumbra
        float distToCenter = length(cross(oc, lightDir)) / length(lightDir);
        float radius = uShadowCasters[i].radius;

        // Simple soft shadow calculation
        if (distToCenter < radius) {
          // Inside umbra/penumbra
          float shadowStrength = 1.0 - smoothstep(radius * 0.8, radius * 1.2, distToCenter);
          shadowStrength = clamp(shadowStrength, 0.0, 1.0);
          float currentShadow = 1.0 - shadowStrength;
          finalShadow = min(finalShadow, currentShadow);
        }
      }
    }
  }
  return clamp(finalShadow, 0.0, 1.0);
}
```

Calculates shadow from spherical occluders with soft penumbra effects.

**Parameters:**

- **fragPos**: Fragment position in world space
- **lightDir**: Direction to light source

**Returns:**

- **float**: Shadow factor (0.0 = full shadow, 1.0 = fully lit)

**Process:**

1. **Early Exit**: Returns 1.0 if no shadow casters
2. **Loop Through Casters**: Iterates through all shadow casters
3. **Intersection Test**: Tests if light ray intersects shadow caster
4. **Penumbra Calculation**: Calculates soft shadow with penumbra
5. **Shadow Accumulation**: Accumulates shadow factors

## Main Function

```glsl
void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewDirection);

  // Sample textures if available
  vec3 diffuseColor = baseColor;
  if (hasMap) {
    diffuseColor = texture2D(map, vUv).rgb * baseColor;
  }

  // Sample normal map if available
  if (hasNormalMap) {
    vec3 normalMap = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
    normal = normalize(normal + normalMap * 0.5); // Blend with original normal
  }

  // Sample material properties from maps if available
  float finalMetalness = metalness;
  float finalRoughness = roughness;

  if (hasMetalnessMap) {
    finalMetalness = texture2D(metalnessMap, vUv).r;
  }

  if (hasRoughnessMap) {
    finalRoughness = texture2D(roughnessMap, vUv).r;
  }

  // Calculate environment map reflection
  vec3 reflection = vec3(0.0);
  if (hasEnvMap) {
    vec3 reflectDir = reflect(-viewDir, normal);
    reflection = textureCube(envMap, reflectDir).rgb * envMapIntensity * finalMetalness;
  }

  // Start with very low ambient lighting for realistic space conditions
  vec3 ambient = diffuseColor * (uDynamicAmbientIntensity * 0.02);

  // Calculate lighting from all light sources with proper terminator handling
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;

    LightSource light = uLightSources[i];
    // Clamp light intensity extremely aggressively to prevent flashes
    float clampedIntensity = clamp(light.intensity, 0.0, 2.0);
    if (clampedIntensity <= 0.0) continue;

    vec3 lightDir = normalize(light.position - vWorldPosition);
    // Validate light direction to prevent NaN
    if (length(lightDir) < 0.1) continue;

    // Create a smooth transition around the terminator
    float dotProduct = dot(normal, lightDir);
    float terminatorTransition = smoothstep(-0.15, 0.15, dotProduct);

    // Calculate shadow factor for this light source (applies to both day and night side)
    float shadowFactor = getShadow(vWorldPosition, lightDir);

    if (dotProduct > 0.0) {
      // Apply shadow factor to light intensity with extreme clamping
      float effectiveIntensity = clamp(clampedIntensity * shadowFactor, 0.0, 1.0);

      // Diffuse lighting with reduced strength for better terminator definition
      float diff = max(dotProduct, 0.0);
      vec3 diffuseContrib = light.color * diff * effectiveIntensity * 0.2 * terminatorTransition; // Further reduced
      totalDiffuse += clamp(diffuseContrib, vec3(0.0), vec3(0.5)); // Even lower clamp

      // Specular lighting (Blinn-Phong)
      vec3 halfwayDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
      vec3 specularContrib = light.color * spec * effectiveIntensity * 0.1 * terminatorTransition; // Further reduced
      totalSpecular += clamp(specularContrib, vec3(0.0), vec3(0.2)); // Even lower clamp
    } else {
      // Night side - very low lighting with smooth transition, but also affected by shadows
      float nightLight = clamp(0.02 * (1.0 - terminatorTransition) * shadowFactor, 0.0, 0.05); // Reduced values
      totalDiffuse += light.color * nightLight;
    }
  }

  // Combine lighting components
  vec3 diffuse = diffuseColor * totalDiffuse;
  vec3 specular = totalSpecular;

  // Add emissive lighting
  vec3 emissive = uEmissiveColor * uEmissiveIntensity;

  // Final color with environment map reflection - clamp all components extremely aggressively
  vec3 finalColor = clamp(ambient, vec3(0.0), vec3(1.0)) +
                   clamp(diffuse, vec3(0.0), vec3(1.0)) +
                   clamp(specular, vec3(0.0), vec3(1.0)) +
                   clamp(emissive, vec3(0.0), vec3(1.0)) +
                   clamp(reflection, vec3(0.0), vec3(1.0));

  // Final safety clamp before gamma correction - extremely aggressive
  finalColor = clamp(finalColor, vec3(0.0), vec3(1.5));

  // Apply gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  // Final output clamp to prevent any remaining wild values
  gl_FragColor = vec4(clamp(finalColor, vec3(0.0), vec3(1.0)), 1.0);

  #include <logdepthbuf_fragment>
}
```

## Lighting Calculation

### 1. Texture Sampling

```glsl
// Sample textures if available
vec3 diffuseColor = baseColor;
if (hasMap) {
  diffuseColor = texture2D(map, vUv).rgb * baseColor;
}

// Sample normal map if available
if (hasNormalMap) {
  vec3 normalMap = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  normal = normalize(normal + normalMap * 0.5); // Blend with original normal
}
```

**Process:**

- Samples diffuse texture if available
- Samples normal map for surface detail
- Blends normal map with original normal

### 2. Material Properties

```glsl
// Sample material properties from maps if available
float finalMetalness = metalness;
float finalRoughness = roughness;

if (hasMetalnessMap) {
  finalMetalness = texture2D(metalnessMap, vUv).r;
}

if (hasRoughnessMap) {
  finalRoughness = texture2D(roughnessMap, vUv).r;
}
```

**Process:**

- Samples metalness map if available
- Samples roughness map if available
- Uses uniform values as fallback

### 3. Environment Reflection

```glsl
// Calculate environment map reflection
vec3 reflection = vec3(0.0);
if (hasEnvMap) {
  vec3 reflectDir = reflect(-viewDir, normal);
  reflection = textureCube(envMap, reflectDir).rgb * envMapIntensity * finalMetalness;
}
```

**Process:**

- Calculates reflection direction
- Samples environment map
- Applies intensity and metalness

### 4. Ambient Lighting

```glsl
// Start with very low ambient lighting for realistic space conditions
vec3 ambient = diffuseColor * (uDynamicAmbientIntensity * 0.02);
```

**Process:**

- Very low ambient for realistic space conditions
- Uses dynamic ambient intensity
- Multiplies by diffuse color

### 5. Multi-Source Lighting

```glsl
for (int i = 0; i < MAX_LIGHTS; i++) {
  if (i >= uNumLights) break;

  LightSource light = uLightSources[i];
  // Clamp light intensity extremely aggressively to prevent flashes
  float clampedIntensity = clamp(light.intensity, 0.0, 2.0);
  if (clampedIntensity <= 0.0) continue;

  vec3 lightDir = normalize(light.position - vWorldPosition);
  // Validate light direction to prevent NaN
  if (length(lightDir) < 0.1) continue;

  // Create a smooth transition around the terminator
  float dotProduct = dot(normal, lightDir);
  float terminatorTransition = smoothstep(-0.15, 0.15, dotProduct);

  // Calculate shadow factor for this light source
  float shadowFactor = getShadow(vWorldPosition, lightDir);

  if (dotProduct > 0.0) {
    // Day side lighting
    float effectiveIntensity = clamp(clampedIntensity * shadowFactor, 0.0, 1.0);

    // Diffuse lighting
    float diff = max(dotProduct, 0.0);
    vec3 diffuseContrib = light.color * diff * effectiveIntensity * 0.2 * terminatorTransition;
    totalDiffuse += clamp(diffuseContrib, vec3(0.0), vec3(0.5));

    // Specular lighting (Blinn-Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
    vec3 specularContrib = light.color * spec * effectiveIntensity * 0.1 * terminatorTransition;
    totalSpecular += clamp(specularContrib, vec3(0.0), vec3(0.2));
  } else {
    // Night side lighting
    float nightLight = clamp(0.02 * (1.0 - terminatorTransition) * shadowFactor, 0.0, 0.05);
    totalDiffuse += light.color * nightLight;
  }
}
```

**Process:**

- Iterates through all light sources
- Clamps light intensity aggressively
- Calculates light direction and validates it
- Creates smooth terminator transition
- Calculates shadow factor
- Applies day/night side lighting
- Accumulates diffuse and specular contributions

### 6. Final Color Composition

```glsl
// Combine lighting components
vec3 diffuse = diffuseColor * totalDiffuse;
vec3 specular = totalSpecular;

// Add emissive lighting
vec3 emissive = uEmissiveColor * uEmissiveIntensity;

// Final color with environment map reflection - clamp all components extremely aggressively
vec3 finalColor = clamp(ambient, vec3(0.0), vec3(1.0)) +
                 clamp(diffuse, vec3(0.0), vec3(1.0)) +
                 clamp(specular, vec3(0.0), vec3(1.0)) +
                 clamp(emissive, vec3(0.0), vec3(1.0)) +
                 clamp(reflection, vec3(0.0), vec3(1.0));

// Final safety clamp before gamma correction - extremely aggressive
finalColor = clamp(finalColor, vec3(0.0), vec3(1.5));

// Apply gamma correction
finalColor = pow(finalColor, vec3(1.0 / 2.2));

// Final output clamp to prevent any remaining wild values
gl_FragColor = vec4(clamp(finalColor, vec3(0.0), vec3(1.0)), 1.0);
```

**Process:**

- Combines all lighting components
- Applies aggressive clamping to prevent artifacts
- Applies gamma correction
- Sets final fragment color

## Shadow System

### Soft Penumbra

- **Penumbra Range**: 0.8 to 1.2 times shadow caster radius
- **Smooth Transition**: Uses smoothstep for soft edges
- **Multiple Casters**: Supports multiple shadow-casting objects
- **Performance Optimized**: Efficient shadow calculations

### Shadow Calculation

1. **Intersection Test**: Tests if light ray intersects shadow caster
2. **Distance Calculation**: Calculates distance from ray to sphere center
3. **Penumbra Calculation**: Calculates soft shadow with penumbra
4. **Shadow Accumulation**: Accumulates shadow factors from multiple casters

## Performance Optimizations

### Aggressive Clamping

- **Light Intensity**: Clamped to 0.0-2.0 range
- **Color Components**: Clamped to 0.0-1.0 range
- **Final Color**: Clamped to 0.0-1.5 range
- **Prevents Artifacts**: Prevents lighting flashes and artifacts

### Early Exits

- **No Shadow Casters**: Early exit if no shadow casters
- **Invalid Light Direction**: Skips invalid light directions
- **Zero Intensity**: Skips lights with zero intensity
- **Performance**: Improves performance by skipping unnecessary calculations

### Efficient Calculations

- **Vector Operations**: Uses vector operations where possible
- **Built-in Functions**: Leverages built-in GLSL functions
- **Minimal Loops**: Optimized loop structures
- **GPU Optimization**: Optimized for GPU execution

## Integration with Vertex Shader

The fragment shader works with the vertex shader to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Transformation Data**: Properly transformed positions and normals
3. **Lighting Foundation**: Essential data for realistic lighting calculations
4. **Material Support**: Data for texture sampling and material effects

## Dependencies

### Three.js Built-ins

- **texture2D**: 2D texture sampling
- **textureCube**: Cube texture sampling
- **Built-in Functions**: GLSL built-in functions

### Shader Includes

- **common**: Common shader definitions and functions
- **logdepthbuf_pars_fragment**: Logarithmic depth buffer parameters
- **logdepthbuf_fragment**: Logarithmic depth buffer calculations

## 🔗 Related

- [[celestials/satellite/satellite.vertex.glsl|Satellite Vertex Shader]] - Vertex shader that provides data for this fragment shader
- [[celestials/satellite/SatelliteMaterial|Satellite Material]] - Material that uses this shader
- [[celestials/satellite/SatelliteRenderer|Satellite Renderer]] - Renderer that creates the geometry for this shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[renderer/threejs-lighting/threejs-lighting|Three.js Lighting System]] - Lighting system
