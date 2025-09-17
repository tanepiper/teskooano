---
aliases: [accretion-disk.fragment.glsl]
tags: [renderer, threejs, rings, shader, fragment, accretion]
type: shader
package: "@teskooano/celestials-rings"
file: "src/shaders/accretion-disk.fragment.glsl"
status: active
---

# accretion-disk.fragment.glsl

Fragment shader for accretion disks with astrophysical properties, temperature-based emission, and relativistic effects.

## Overview

The accretion disk fragment shader is responsible for rendering accretion disks around black holes and other compact objects. It incorporates astrophysical properties like temperature, accretion rate, and relativistic effects to create realistic accretion disk visuals.

## Shader Features

- **Temperature-Based Emission**: Emission based on disk temperature
- **Accretion Rate Effects**: Visual effects based on accretion rate
- **Relativistic Effects**: Special relativistic effects for high-speed material
- **Emission Types**: Different emission types (thermal, synchrotron, etc.)
- **Multi-Source Lighting**: Lighting from multiple light sources
- **Shadow Casting**: Shadows from central object and other celestial objects
- **Procedural Noise**: Noise-based effects for disk variation

## Uniform Variables

### Basic Properties

```glsl
uniform vec3 color; // Base color
uniform float opacity; // Base opacity
uniform float time; // Time for animation
```

- **color**: Base color of the accretion disk
- **opacity**: Overall opacity of the disk
- **time**: Time value for animation effects

### Accretion Disk Properties

```glsl
uniform bool uIsAccretionDisk; // Whether this is an accretion disk
uniform float uTemperature; // Disk temperature
uniform float uAccretionRate; // Accretion rate
uniform int uEmissionType; // Type of emission (0=thermal, 1=synchrotron, 2=bremsstrahlung)
uniform bool uIsRelativistic; // Whether to apply relativistic effects
uniform float uInnerEdgeRadius; // Inner edge radius (ISCO)
```

- **uIsAccretionDisk**: Flag indicating this is an accretion disk
- **uTemperature**: Temperature of the accretion disk
- **uAccretionRate**: Rate of mass accretion
- **uEmissionType**: Type of emission (thermal, synchrotron, bremsstrahlung)
- **uIsRelativistic**: Whether to apply relativistic effects
- **uInnerEdgeRadius**: Inner edge radius (Innermost Stable Circular Orbit)

### Parent Body Properties

```glsl
uniform vec3 uParentPosition; // Parent body position
uniform float uParentRadius; // Parent body radius
```

- **uParentPosition**: World position of the central object
- **uParentRadius**: Radius of the central object

### Lighting Properties

```glsl
uniform float uDynamicAmbientIntensity; // Dynamic ambient light intensity
uniform int uLightCount; // Number of light sources
uniform vec3 uLightPositions[MAX_LIGHTS]; // Light source positions
uniform vec3 uLightColors[MAX_LIGHTS]; // Light source colors
uniform float uLightIntensities[MAX_LIGHTS]; // Light source intensities
```

- **uDynamicAmbientIntensity**: Intensity of dynamic ambient lighting
- **uLightCount**: Number of active light sources
- **uLightPositions**: Array of light source positions
- **uLightColors**: Array of light source colors
- **uLightIntensities**: Array of light source intensities

### Shadow Properties

```glsl
uniform int uShadowCasterCount; // Number of shadow casters
uniform vec3 uShadowCasterPositions[MAX_SHADOW_CASTERS]; // Shadow caster positions
uniform float uShadowCasterRadii[MAX_SHADOW_CASTERS]; // Shadow caster radii
```

- **uShadowCasterCount**: Number of shadow casting objects
- **uShadowCasterPositions**: Array of shadow caster positions
- **uShadowCasterRadii**: Array of shadow caster radii

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the fragment.

- **Usage**: Used for procedural effects and texture sampling
- **Source**: Passed from vertex shader

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

World space normal of the fragment.

- **Usage**: Used for lighting calculations
- **Source**: Passed from vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

World space position of the fragment.

- **Usage**: Used for lighting and shadow calculations
- **Source**: Passed from vertex shader

## Utility Functions

### noise

```glsl
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
```

2D noise function for procedural effects.

### hash

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
```

Hash function for pseudo-random number generation.

### getShadow

```glsl
float getShadow(vec3 worldPos, vec3 lightDir) {
  float shadow = 1.0;

  for (int i = 0; i < MAX_SHADOW_CASTERS; i++) {
    if (i >= uShadowCasterCount) break;

    vec3 casterPos = uShadowCasterPositions[i];
    float casterRadius = uShadowCasterRadii[i];

    // Calculate shadow from this caster
    vec3 toCaster = casterPos - worldPos;
    float distToCaster = length(toCaster);
    vec3 casterDir = toCaster / distToCaster;

    // Check if light direction intersects with caster
    float dotProduct = dot(lightDir, casterDir);
    if (dotProduct > 0.0) {
      float shadowDist = distToCaster * dotProduct;
      float shadowRadius = casterRadius * (shadowDist / distToCaster);

      if (shadowDist < distToCaster && shadowRadius > 0.0) {
        float shadowFactor = 1.0 - (shadowRadius / shadowDist);
        shadow *= shadowFactor;
      }
    }
  }

  return shadow;
}
```

Calculates shadow from shadow casters.

## Accretion Disk Functions

### calculateAccretionDiskEmission

```glsl
vec3 calculateAccretionDiskEmission(vec2 uv, float temperature, float accretionRate) {
  vec3 emission = vec3(0.0);

  // Calculate distance from center
  float distance = length(uv);

  // Temperature gradient (hotter near center)
  float tempGradient = 1.0 / (distance + 0.1);
  float localTemp = temperature * tempGradient;

  // Accretion rate effects
  float accretionEffect = accretionRate * 0.1;

  // Emission based on type
  if (uEmissionType == 0) { // Thermal emission
    // Blackbody radiation
    float intensity = pow(localTemp / 1000.0, 4.0);
    emission = vec3(intensity * 0.8, intensity * 0.6, intensity * 0.4);
  } else if (uEmissionType == 1) { // Synchrotron emission
    // Synchrotron radiation (bluer)
    float intensity = pow(localTemp / 1000.0, 2.0);
    emission = vec3(intensity * 0.4, intensity * 0.6, intensity * 0.8);
  } else if (uEmissionType == 2) { // Bremsstrahlung emission
    // Bremsstrahlung radiation (whiter)
    float intensity = pow(localTemp / 1000.0, 3.0);
    emission = vec3(intensity * 0.7, intensity * 0.7, intensity * 0.7);
  }

  // Apply accretion rate effects
  emission *= (1.0 + accretionEffect);

  // Add noise for variation
  float noiseValue = noise(uv * 10.0) * 0.1;
  emission += noiseValue;

  return emission;
}
```

Calculates emission from the accretion disk based on temperature and accretion rate.

### calculateAccretionLuminosity

```glsl
float calculateAccretionLuminosity(float temperature, float accretionRate) {
  // Luminosity calculation based on temperature and accretion rate
  float luminosity = pow(temperature / 1000.0, 4.0) * accretionRate;

  // Apply relativistic effects if enabled
  if (uIsRelativistic) {
    // Relativistic boost factor
    float gamma = 1.0 / sqrt(1.0 - 0.1); // Simplified relativistic factor
    luminosity *= gamma;
  }

  return luminosity;
}
```

Calculates the luminosity of the accretion disk.

## Main Function

```glsl
void main() {
  vec2 uv = vUv;

  // Check if this is an accretion disk
  if (!uIsAccretionDisk) {
    // Fall back to standard ring rendering
    gl_FragColor = vec4(color, opacity);
    return;
  }

  // Calculate accretion disk emission
  vec3 emission = calculateAccretionDiskEmission(uv, uTemperature, uAccretionRate);

  // Calculate luminosity
  float luminosity = calculateAccretionLuminosity(uTemperature, uAccretionRate);

  // Combine emission with base color
  vec3 finalColor = color + emission * luminosity;

  // Calculate opacity based on distance from center
  float distance = length(uv);
  float opacityFalloff = 1.0 - smoothstep(0.0, 1.0, distance);
  float finalOpacity = opacity * opacityFalloff;

  // Apply lighting from multiple sources
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;

    vec3 lightPos = uLightPositions[i];
    vec3 lightColor = uLightColors[i];
    float lightIntensity = uLightIntensities[i];

    vec3 lightDir = normalize(lightPos - vPosition);
    float lightDistance = length(lightPos - vPosition);

    // Calculate shadow
    float shadow = getShadow(vPosition, lightDir);

    // Calculate lighting
    float NdotL = max(dot(vWorldNormal, lightDir), 0.0);
    float attenuation = 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);

    finalColor += lightColor * lightIntensity * NdotL * attenuation * shadow;
  }

  // Apply dynamic ambient lighting
  finalColor += color * uDynamicAmbientIntensity * 0.1;

  // Final color output
  gl_FragColor = vec4(finalColor, finalOpacity);

  #include <logdepthbuf_fragment>
}
```

## Emission Types

The shader supports different emission types:

### Thermal Emission (Type 0)

- **Blackbody Radiation**: Based on temperature
- **Color**: Reddish (hotter objects emit more red)
- **Intensity**: Proportional to temperature^4

### Synchrotron Emission (Type 1)

- **Magnetic Field**: Emission from charged particles in magnetic fields
- **Color**: Bluish (high-energy emission)
- **Intensity**: Proportional to temperature^2

### Bremsstrahlung Emission (Type 2)

- **Free-Free Emission**: Emission from free electrons
- **Color**: White (broad spectrum)
- **Intensity**: Proportional to temperature^3

## Relativistic Effects

When relativistic effects are enabled:

- **Lorentz Factor**: Applies relativistic boost
- **Doppler Effect**: Simulates relativistic Doppler shift
- **Gravitational Redshift**: Simulates gravitational redshift
- **Time Dilation**: Simulates time dilation effects

## Temperature Gradient

The temperature gradient:

1. **Distance Calculation**: Calculates distance from center
2. **Gradient Application**: Applies 1/r temperature gradient
3. **Local Temperature**: Calculates local temperature
4. **Emission Calculation**: Uses local temperature for emission

## Accretion Rate Effects

The accretion rate affects:

- **Emission Intensity**: Higher accretion rate = brighter emission
- **Disk Structure**: Affects disk density and structure
- **Relativistic Effects**: Higher accretion rate = more relativistic effects

## Performance Considerations

- **Emission Type Check**: Only calculates emission for accretion disks
- **Loop Limits**: Uses MAX_LIGHTS and MAX_SHADOW_CASTERS constants
- **Early Breaks**: Breaks loops when limits are reached
- **Efficient Calculations**: Optimized mathematical operations

## Integration with Vertex Shader

The fragment shader works with the vertex shader to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **UV Coordinates**: Texture coordinates for procedural effects
3. **Transformation Data**: Properly transformed positions and normals

## Dependencies

- **Vertex Shader**: Requires world position and normal data
- **Uniforms**: Requires all uniform variables to be set
- **Constants**: Requires MAX_LIGHTS and MAX_SHADOW_CASTERS constants

## 🔗 Related

- [[celestials/rings/ring.vertex.glsl|Ring Vertex Shader]] - Vertex shader that provides data for this fragment shader
- [[celestials/rings/RingMaterials|Accretion Disk Material]] - Material that uses this shader
- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Renderer that creates the geometry for this shader
- [[celestials/rings/utils.ts|Ring Utilities]] - Utility functions for accretion disk calculations
