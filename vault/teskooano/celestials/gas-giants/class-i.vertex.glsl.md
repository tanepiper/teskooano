---
aliases: [class-i.vertex.glsl]
tags: [renderer, threejs, gas-giants, shader, vertex]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-i.vertex.glsl"
status: active
---

# class-i.vertex.glsl

Vertex shader for Class I gas giants (Ammonia Clouds - Jupiter-like) with world position and normal calculation for atmospheric rendering.

## Overview

The Class I vertex shader is responsible for transforming vertex positions and calculating world-space coordinates and normals for the fragment shader. It provides the foundation for advanced atmospheric lighting and procedural effects on Class I gas giants with ammonia cloud layers.

## Shader Features

- **World Position Calculation**: Transforms local vertex positions to world space
- **World Normal Calculation**: Calculates world-space normals for lighting
- **Sphere Normal Calculation**: Perfect sphere normals for diffuse lighting
- **Unit Sample Point**: Normalized local position for noise sampling
- **View Direction**: Fixed view direction for consistent lighting
- **UV Coordinate Passing**: Passes texture coordinates to fragment shader

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Type**: `vec2`
- **Usage**: Passed through from input UV coordinates
- **Calculation**: `uv`

### vNormal

```glsl
varying vec3 vNormal;
```

Vertex normal in world space.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for specular lighting
- **Calculation**: `normalize(normalMatrix * normal)`

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for lighting calculations
- **Calculation**: `(modelMatrix * vec4(position, 1.0)).xyz`

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera to vertex.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for view-dependent effects
- **Calculation**: Fixed direction `vec3(0.0, 1.0, 0.0)`

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for diffuse lighting
- **Calculation**: `normalize(mat3(modelMatrix) * unitSamplePoint)`

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for procedural noise generation
- **Calculation**: `normalize(position)`

## Uniform Variables

### time

```glsl
uniform float time;
```

Time for potential animation.

- **Type**: `float`
- **Usage**: Animation timing for atmospheric effects
- **Source**: Material uniform

## Shader Implementation

### Main Function

```glsl
void main() {
  // Pass texture coordinates to fragment shader
  vUv = uv;

  // Calculate the world position and pass it to the fragment shader
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPosition = worldPosition.xyz;

  // Local position and normal
  vec3 localPosition = position;
  vec3 localNormal = normal;

  // World position and normal
  vec4 worldPosition4 = modelMatrix * vec4(localPosition, 1.0);
  vec3 worldNormal = normalize(mat3(modelMatrix) * localNormal);

  // Normalized local position (used as base for noise sampling)
  vec3 unitSamplePoint = normalize(localPosition);

  // Calculate world normal assuming a perfect sphere at origin, transformed
  vSphereNormalW = normalize(mat3(modelMatrix) * unitSamplePoint);

  // Fixed view direction from "above" the planet
  vec3 viewDirection = vec3(0.0, 1.0, 0.0);

  // Calculate final vertex position in clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);

  vNormal = normalize(normalMatrix * normal);
  vUnitSamplePoint = normalize(position);
}
```

### Transformation Pipeline

1. **UV Coordinates**: Pass through texture coordinates
2. **World Position**: Transform to world space using model matrix
3. **Local Position**: Store local position for calculations
4. **World Normal**: Transform normal to world space and normalize
5. **Unit Sample Point**: Normalize local position for noise sampling
6. **Sphere Normal**: Calculate perfect sphere normal for diffuse lighting
7. **View Direction**: Set fixed view direction for consistent lighting
8. **Clip Position**: Transform to clip space for rendering

## Usage in Fragment Shader

The varying variables are used in the fragment shader for:

### vPosition

- **Lighting Calculations**: Distance calculations to light sources
- **Shadow Calculations**: Position for shadow ray intersection tests
- **Atmospheric Effects**: Position-based atmospheric effects

### vNormal

- **Specular Lighting**: Normal for specular highlight calculations
- **Surface Effects**: Normal-based surface effects
- **Lighting Direction**: Normal for lighting direction calculations

### vSphereNormalW

- **Diffuse Lighting**: Perfect sphere normal for consistent diffuse lighting
- **Atmospheric Rendering**: Smooth atmospheric effects
- **Procedural Texturing**: Consistent lighting for procedural textures

### vUnitSamplePoint

- **Noise Generation**: Object-space noise for atmospheric effects
- **Procedural Texturing**: Position-based texture generation
- **Atmospheric Patterns**: Consistent atmospheric pattern generation

### vViewDirection

- **View-Dependent Effects**: Effects that change based on viewing angle
- **Atmospheric Scattering**: View-dependent atmospheric scattering
- **Lighting Calculations**: View direction for lighting calculations

## Performance Considerations

- **Efficient Transformations**: Uses matrix multiplication for world space
- **Normal Normalization**: Ensures correct lighting calculations
- **Minimal Calculations**: Only performs necessary transformations
- **Fixed View Direction**: Removes camera dependency for consistent lighting

## Integration with Fragment Shader

The vertex shader works in conjunction with [[class-i.fragment.glsl]] to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Procedural Coordinates**: Object-space positions for noise generation
3. **Lighting Foundation**: Essential data for realistic lighting calculations
4. **Atmospheric Effects**: Data for atmospheric rendering

## Class I Specific Features

The vertex shader is optimized for Class I gas giants:

- **Ammonia Cloud Rendering**: Provides data for ammonia cloud atmospheric effects
- **Jupiter-like Appearance**: Optimized for Jupiter-like atmospheric rendering
- **Atmospheric Layers**: Supports multiple atmospheric layers
- **Procedural Effects**: Enables procedural atmospheric pattern generation

## Dependencies

- **Model Matrix**: Object transformation matrix
- **Projection Matrix**: Camera projection matrix
- **Model View Matrix**: Combined model and view transformation
- **Normal Matrix**: Normal transformation matrix

## 🔗 Related

- [[class-i.fragment.glsl]] - Fragment shader that uses this vertex shader output
- [[ClassIMaterial]] - Material that uses this shader
- [[ClassIGasGiantRenderer]] - Renderer that creates the geometry for this shader
