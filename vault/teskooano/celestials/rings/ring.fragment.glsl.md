---
aliases: [ring.fragment.glsl]
tags: [renderer, threejs, rings, shader, fragment]
type: shader
package: "@teskooano/celestials-rings"
file: "src/shaders/ring.fragment.glsl"
status: active
---

# ring.fragment.glsl

Fragment shader for ring systems with detailed segmentation, density variations, particle-like effects, and advanced lighting.

## Overview

The ring fragment shader is responsible for rendering standard planetary rings with detailed segmentation, density variations, and particle-like effects. It calculates lighting from multiple sources, including shadows from the parent body and other celestial objects, and applies dynamic ambient lighting.

## Shader Features

- **Detailed Segmentation**: Ring segments with configurable density and width
- **Density Variations**: Procedural density variations across the ring
- **Particle-Like Effects**: Individual particle rendering for detail
- **Multi-Source Lighting**: Lighting from multiple light sources
- **Shadow Casting**: Shadows from parent body and other celestial objects
- **Dynamic Ambient Lighting**: Dynamic ambient lighting effects
- **Procedural Noise**: Noise-based effects for natural variation

## Uniform Variables

### Basic Properties

```glsl
uniform vec3 color; // Ring color
uniform float opacity; // Ring opacity
uniform float time; // Time for animation
```

- **color**: Base color of the ring
- **opacity**: Overall opacity of the ring
- **time**: Time value for animation effects

### Parent Body Properties

```glsl
uniform vec3 uParentPosition; // Parent body position
uniform float uParentRadius; // Parent body radius
```

- **uParentPosition**: World position of the parent body
- **uParentRadius**: Radius of the parent body for shadow calculations

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

### Ring Properties

```glsl
uniform float uSegmentDensity; // Density of ring segments
uniform float uSegmentWidth; // Width of ring segments
uniform float uParticleDetail; // Detail level for particles
uniform float uDensityVariation; // Amount of density variation
```

- **uSegmentDensity**: Density of ring segments
- **uSegmentWidth**: Width of ring segments
- **uParticleDetail**: Detail level for particle effects
- **uDensityVariation**: Amount of density variation

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

### smootherstep

```glsl
float smootherstep(float edge0, float edge1, float x) {
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}
```

Smooth interpolation function for better visual transitions.

### hash

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
```

Hash function for pseudo-random number generation.

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

### fbm

```glsl
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}
```

Fractal Brownian Motion for complex noise patterns.

### smoothNoise

```glsl
float smoothNoise(vec2 p) {
  return fbm(p * 0.1) * 0.5 + 0.5;
}
```

Smooth noise function for gentle variations.

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

## Ring Rendering Functions

### createRingSegments

```glsl
float createRingSegments(vec2 uv) {
  float segments = 0.0;

  // Create ring segments based on UV coordinates
  float segmentCount = uSegmentDensity * 100.0;
  float segmentWidth = uSegmentWidth * 0.1;

  for (int i = 0; i < 10; i++) {
    if (float(i) >= segmentCount) break;

    float segmentPos = float(i) / segmentCount;
    float segmentCenter = segmentPos * 2.0 - 1.0;

    float dist = abs(uv.x - segmentCenter);
    if (dist < segmentWidth) {
      segments += 1.0 - (dist / segmentWidth);
    }
  }

  return segments;
}
```

Creates ring segments with configurable density and width.

### createDensityVariations

```glsl
float createDensityVariations(vec2 uv) {
  float variation = 0.0;

  // Add noise-based density variations
  variation += smoothNoise(uv * 2.0) * uDensityVariation;
  variation += smoothNoise(uv * 4.0) * uDensityVariation * 0.5;
  variation += smoothNoise(uv * 8.0) * uDensityVariation * 0.25;

  return variation;
}
```

Creates density variations using noise functions.

### createParticleDetail

```glsl
float createParticleDetail(vec2 uv) {
  float particles = 0.0;

  // Create particle-like effects
  float particleCount = uParticleDetail * 50.0;

  for (int i = 0; i < 20; i++) {
    if (float(i) >= particleCount) break;

    vec2 particlePos = vec2(
      hash(vec2(float(i), 0.0)),
      hash(vec2(float(i), 1.0))
    );

    float dist = distance(uv, particlePos);
    if (dist < 0.05) {
      particles += 1.0 - (dist / 0.05);
    }
  }

  return particles;
}
```

Creates particle-like effects for ring detail.

## Main Function

```glsl
void main() {
  vec2 uv = vUv;

  // Calculate ring segments
  float segments = createRingSegments(uv);

  // Add density variations
  float densityVariation = createDensityVariations(uv);

  // Add particle detail
  float particleDetail = createParticleDetail(uv);

  // Combine all effects
  float finalDensity = segments + densityVariation + particleDetail;
  finalDensity = clamp(finalDensity, 0.0, 1.0);

  // Calculate lighting
  vec3 finalColor = color;
  float finalOpacity = opacity * finalDensity;

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

## Lighting Calculation

The fragment shader calculates lighting from multiple sources:

1. **Light Direction**: Calculates direction from fragment to light source
2. **Distance Attenuation**: Applies distance-based attenuation
3. **Shadow Calculation**: Calculates shadows from shadow casters
4. **Normal Lighting**: Uses dot product of normal and light direction
5. **Color Accumulation**: Accumulates light contributions

## Shadow Calculation

The shadow system:

1. **Shadow Caster Loop**: Iterates through all shadow casters
2. **Intersection Test**: Checks if light ray intersects with caster
3. **Shadow Factor**: Calculates shadow factor based on caster size and distance
4. **Shadow Accumulation**: Multiplies shadow factors together

## Procedural Effects

The shader uses several procedural effects:

### Ring Segments

- **Configurable Density**: Adjustable number of segments
- **Configurable Width**: Adjustable segment width
- **Smooth Transitions**: Uses smootherstep for smooth edges

### Density Variations

- **Noise-Based**: Uses FBM for natural variation
- **Multi-Octave**: Multiple noise octaves for complexity
- **Configurable Intensity**: Adjustable variation amount

### Particle Detail

- **Particle Count**: Configurable number of particles
- **Random Positioning**: Uses hash function for positioning
- **Size Variation**: Configurable particle size

## Performance Considerations

- **Loop Limits**: Uses MAX_LIGHTS and MAX_SHADOW_CASTERS constants
- **Early Breaks**: Breaks loops when limits are reached
- **Efficient Calculations**: Optimized mathematical operations
- **Conditional Rendering**: Only calculates effects when needed

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
- [[celestials/rings/RingMaterials|Ring Materials]] - Material that uses this shader
- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Renderer that creates the geometry for this shader
- [[celestials/rings/utils.ts|Ring Utilities]] - Utility functions for ring calculations
