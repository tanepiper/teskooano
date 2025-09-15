---
aliases: [nucleus.vertex.glsl]
tags: [renderer, threejs, comets, shader, vertex]
type: shader
package: "@teskooano/celestials-comet"
file: "src/shaders/nucleus.vertex.glsl"
status: active
---

# nucleus.vertex.glsl

Vertex shader for comet nucleus rendering with world position and normal calculation.

## Overview

The nucleus vertex shader is responsible for transforming vertex positions and calculating world-space coordinates and normals for the fragment shader. It provides the foundation for advanced lighting and surface texturing effects on the comet nucleus.

## Shader Features

- **World Position Calculation**: Transforms local vertex positions to world space
- **World Normal Calculation**: Calculates world-space normals for lighting
- **UV Coordinate Passing**: Passes texture coordinates to fragment shader
- **Object Position Normalization**: Provides normalized object-space positions
- **Simple Implementation**: Minimal vertex shader for efficient rendering

## Varying Variables

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

World-space normal vector for lighting calculations.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for lighting and surface effects
- **Calculation**: `normalize(mat3(modelMatrix) * normal)`

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position of the vertex.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for lighting and shadow calculations
- **Calculation**: `(modelMatrix * vec4(position, 1.0)).xyz`

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Type**: `vec2`
- **Usage**: Passed through from input UV coordinates
- **Calculation**: `uv`

### vObjectPosition

```glsl
varying vec3 vObjectPosition;
```

Normalized object-space position for procedural effects.

- **Type**: `vec3`
- **Usage**: Used in fragment shader for noise generation and surface effects
- **Calculation**: `normalize(position)`

## Shader Implementation

### Main Function

```glsl
void main() {
    vUv = uv;
    vObjectPosition = normalize(position);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Pass the world-space normal to the fragment shader
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Transformation Pipeline

1. **UV Coordinates**: Pass through texture coordinates
2. **Object Position**: Normalize local position for procedural effects
3. **World Position**: Transform to world space using model matrix
4. **World Normal**: Transform normal to world space and normalize
5. **Clip Position**: Transform to clip space for rendering

## Usage in Fragment Shader

The varying variables are used in the fragment shader for:

### vWorldNormal

- **Lighting Calculations**: Diffuse and specular lighting
- **Surface Effects**: Normal-based surface detail
- **Day/Night Side**: Determines which side of the comet is lit

### vWorldPosition

- **Lighting**: Distance calculations to light sources
- **Camera Effects**: View-dependent effects
- **Position-based Effects**: Distance-based atmospheric effects

### vUv

- **Texture Sampling**: Traditional texture coordinate usage
- **Procedural Effects**: UV-based noise generation
- **Surface Mapping**: Coordinate-based surface effects

### vObjectPosition

- **Noise Generation**: Object-space noise for surface detail
- **Procedural Texturing**: Position-based texture generation
- **Surface Displacement**: Object-space displacement effects

## Performance Considerations

- **Efficient Transformations**: Uses matrix multiplication for world space
- **Normal Normalization**: Ensures correct lighting calculations
- **Minimal Calculations**: Only performs necessary transformations
- **No Complex Operations**: Simple vertex shader for optimal performance

## Integration with Fragment Shader

The vertex shader works in conjunction with [[nucleus.fragment.glsl]] to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Procedural Coordinates**: Object-space positions for noise generation
3. **Texture Coordinates**: UV coordinates for surface mapping
4. **Lighting Foundation**: Essential data for realistic lighting calculations

## Dependencies

- **Model Matrix**: Object transformation matrix
- **Projection Matrix**: Camera projection matrix
- **Model View Matrix**: Combined model and view transformation

## 🔗 Related

- [[nucleus.fragment.glsl]] - Fragment shader that uses this vertex shader output
- [[CometNucleusMaterial]] - Material that uses this shader
- [[CometRenderer]] - Renderer that creates the geometry for this shader
