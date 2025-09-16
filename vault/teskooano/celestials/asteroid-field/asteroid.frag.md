---
aliases: [asteroid.frag]
tags: [renderer, threejs, asteroids, field, shader, fragment]
type: shader
package: "@teskooano/celestials-asteroid-field"
file: "src/shaders/asteroid.frag"
status: active
---

# asteroid.frag

Fragment shader for asteroid field texture rendering with rotation animation and color modulation.

## Overview

The asteroid fragment shader implements texture sampling from multiple asteroid variants, applies rotation animation to texture coordinates, and modulates colors for realistic asteroid field rendering. It supports alpha testing for proper compositing and provides configurable brightness enhancement.

## Shader Features

- **Multiple Texture Sampling**: Selects from 5 different asteroid texture variants
- **Rotation Animation**: Applies time-based texture coordinate rotation
- **Alpha Testing**: Discards transparent pixels for proper compositing
- **Color Modulation**: Applies vertex color variations and brightness enhancement
- **Performance Optimization**: Efficient texture sampling and early pixel discard

## Varying Variables

### vColor

```glsl
varying vec3 vColor;
```

Vertex color from the vertex shader.

- **Type**: `vec3`
- **Usage**: Color modulation for realistic appearance
- **Source**: [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]]

### vTextureIndex

```glsl
varying float vTextureIndex;
```

Texture index for variant selection.

- **Type**: `float`
- **Usage**: Selects which texture variant to sample
- **Range**: 0.0 to 4.0 (maps to 5 texture variants)
- **Source**: [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]]

### vInitialRotation

```glsl
varying float vInitialRotation;
```

Initial rotation offset for animation.

- **Type**: `float`
- **Usage**: Base rotation for texture coordinate rotation
- **Range**: 0.0 to 2π
- **Source**: [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]]

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates from the vertex shader.

- **Type**: `vec2`
- **Usage**: Base texture coordinates for sampling
- **Source**: [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]]

## Uniforms

### asteroidTextures

```glsl
uniform sampler2D asteroidTextures[5];
```

Array of 5 asteroid texture variants.

- **Type**: `sampler2D[5]`
- **Usage**: Texture sampling for visual variety
- **Source**: [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]]

### alphaTest

```glsl
uniform float alphaTest;
```

Alpha testing threshold for transparent pixels.

- **Type**: `float`
- **Usage**: Early pixel discard for performance
- **Range**: 0.0 to 1.0
- **Source**: [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]]

### time

```glsl
uniform float time;
```

Current simulation time for animation.

- **Type**: `float`
- **Usage**: Drives texture coordinate rotation
- **Source**: [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]]

### particleRotationSpeed

```glsl
uniform float particleRotationSpeed;
```

Speed of individual particle rotation.

- **Type**: `float`
- **Usage**: Controls rotation animation speed
- **Source**: [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]]

## Shader Implementation

### Main Function

```glsl
void main() {
  // Apply rotation to texture coordinates
  float angle = vInitialRotation + time * particleRotationSpeed;
  mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

  vec2 center = vec2(0.5, 0.5);
  vec2 uv = vUv - center;
  vec2 rotatedUV = rotationMatrix * uv + center;

  // Sample the appropriate texture based on texture index
  vec4 texColor;
  if (vTextureIndex < 0.5) {
      texColor = texture2D(asteroidTextures[0], rotatedUV);
  } else if (vTextureIndex < 1.5) {
      texColor = texture2D(asteroidTextures[1], rotatedUV);
  } else if (vTextureIndex < 2.5) {
      texColor = texture2D(asteroidTextures[2], rotatedUV);
  } else if (vTextureIndex < 3.5) {
      texColor = texture2D(asteroidTextures[3], rotatedUV);
  } else {
      texColor = texture2D(asteroidTextures[4], rotatedUV);
  }

  // Alpha test to discard transparent pixels
  if (texColor.a < alphaTest) discard;

  // Apply vertex color modulation and brightness
  vec3 finalColor = texColor.rgb * vColor * 1.5;
  float finalAlpha = 1.0;

  gl_FragColor = vec4(finalColor, finalAlpha);

  #include <logdepthbuf_fragment>
}
```

## Rendering Pipeline

### 1. Texture Coordinate Rotation

```glsl
// Calculate rotation angle
float angle = vInitialRotation + time * particleRotationSpeed;

// Create 2D rotation matrix
mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

// Apply rotation around center
vec2 center = vec2(0.5, 0.5);
vec2 uv = vUv - center;
vec2 rotatedUV = rotationMatrix * uv + center;
```

This creates a rotating effect for each asteroid particle, making them appear to tumble in space.

### 2. Texture Variant Selection

```glsl
// Select texture based on index
if (vTextureIndex < 0.5) {
    texColor = texture2D(asteroidTextures[0], rotatedUV);
} else if (vTextureIndex < 1.5) {
    texColor = texture2D(asteroidTextures[1], rotatedUV);
} else if (vTextureIndex < 2.5) {
    texColor = texture2D(asteroidTextures[2], rotatedUV);
} else if (vTextureIndex < 3.5) {
    texColor = texture2D(asteroidTextures[3], rotatedUV);
} else {
    texColor = texture2D(asteroidTextures[4], rotatedUV);
}
```

This provides visual variety by selecting from 5 different asteroid texture variants.

### 3. Alpha Testing

```glsl
// Early pixel discard for transparent areas
if (texColor.a < alphaTest) discard;
```

This improves performance by discarding transparent pixels early in the pipeline.

### 4. Color Modulation

```glsl
// Apply vertex color and brightness enhancement
vec3 finalColor = texColor.rgb * vColor * 1.5;
float finalAlpha = 1.0;
```

This applies vertex color variations and a brightness boost for realistic appearance.

## Performance Optimizations

### Early Pixel Discard

- **Alpha Testing**: Discards transparent pixels before expensive calculations
- **Performance Gain**: Reduces fragment processing for transparent areas
- **Configurable Threshold**: Adjustable alpha test value for different textures

### Efficient Texture Sampling

- **Conditional Sampling**: Only samples the required texture variant
- **Optimized Selection**: Uses simple conditional statements for texture selection
- **Memory Efficiency**: Accesses only one texture per fragment

### Rotation Optimization

- **Matrix-based Rotation**: Efficient 2D rotation matrix implementation
- **Center-based Rotation**: Rotates around texture center for natural appearance
- **Time-based Animation**: Smooth rotation animation using time uniform

## Visual Effects

### Texture Rotation

- **Individual Rotation**: Each asteroid rotates independently
- **Time-based Animation**: Smooth rotation driven by simulation time
- **Configurable Speed**: Adjustable rotation speed per particle
- **Natural Appearance**: Creates realistic tumbling motion

### Color Variation

- **Vertex Color Modulation**: Applies per-particle color variations
- **Brightness Enhancement**: 1.5x brightness boost for visibility
- **Realistic Appearance**: Creates natural color variations across the field

### Texture Variety

- **5 Variants**: Multiple texture variants for visual diversity
- **Random Assignment**: Each particle gets a random texture variant
- **Consistent Quality**: All variants maintain similar visual quality

## Integration with Vertex Shader

The fragment shader works with [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]] to provide:

1. **Position Data**: Transformed positions for rendering
2. **Color Data**: Instance colors for modulation
3. **Texture Data**: Texture indices and UV coordinates
4. **Animation Data**: Initial rotation for particle animation

## Dependencies

- **Three.js Common**: Standard Three.js shader utilities
- **Logarithmic Depth Buffer**: Large-scale rendering support
- **Texture Samplers**: Multiple texture variants
- **Time Uniform**: Animation timing

## Usage in Asteroid Field System

The fragment shader is used by:

1. **[[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]]**: Manages uniforms and texture loading
2. **[[celestials/asteroid-field/AsteroidFieldRenderer|Asteroid Field Renderer]]**: Creates instanced meshes with this shader
3. **THREE.InstancedMesh**: Provides instance data for rendering

## 🔗 Related

- [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]] - Vertex shader that provides input data
- [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]] - Material that uses this shader
- [[celestials/asteroid-field/AsteroidFieldRenderer|Asteroid Field Renderer]] - Renderer that manages this shader
