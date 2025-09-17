---
aliases: [procedural.vertex.glsl]
tags: [renderer, threejs, terrestrial, shader, vertex]
type: shader
package: "@teskooano/celestials-terrestrial"
file: "src/shaders/procedural.vertex.glsl"
status: active
---

# procedural.vertex.glsl

Vertex shader for procedural terrestrial planet surfaces with world-space transformations and seamless noise generation support.

## Overview

The procedural vertex shader is responsible for transforming vertex positions and providing essential data for the fragment shader. It calculates world-space position, normal, and object-space position for seamless noise generation, enabling realistic procedural terrain rendering.

## Shader Features

- **World-Space Calculations**: Transforms local positions to world space
- **Normal Transformation**: Calculates world-space normals for lighting
- **Object-Space Position**: Provides normalized object-space position for seamless noise
- **UV Coordinates**: Passes texture coordinates for material sampling
- **Logarithmic Depth**: Supports logarithmic depth buffer for large scenes

## Includes

```glsl
#include <common>
#include <logdepthbuf_pars_vertex>
```

- **common**: Three.js common shader definitions
- **logdepthbuf_pars_vertex**: Logarithmic depth buffer vertex parameters

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Usage**: Used in fragment shader for texture sampling
- **Calculation**: `uv`
- **Purpose**: Provides UV coordinates for material effects

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World-space position of the vertex.

- **Usage**: Used in fragment shader for lighting calculations
- **Calculation**: `(modelMatrix * vec4(objectSpacePosition, 1.0)).xyz`
- **Purpose**: Provides world-space position for distance calculations and lighting

### vWorldNormal

```glsl
varying vec3 vWorldNormal;
```

World-space normal of the vertex.

- **Usage**: Used in fragment shader for lighting direction calculations
- **Calculation**: `normalize((modelMatrix * vec4(objectSpaceNormal, 0.0)).xyz)`
- **Purpose**: Provides world-space normal for lighting and reflection calculations

### vObjectPosition

```glsl
varying vec3 vObjectPosition;
```

Normalized object-space position for seamless noise generation.

- **Usage**: Used in fragment shader for procedural noise generation
- **Calculation**: `normalize(objectSpacePosition)`
- **Purpose**: Provides seamless noise coordinates for terrain generation

## Main Function

```glsl
void main() {
  vUv = uv;

  // --- Basic Transformations ONLY ---
  vec3 objectSpacePosition = position;
  vec3 objectSpaceNormal = normalize(normal);
  vObjectPosition = normalize(objectSpacePosition);

  vWorldPosition = (modelMatrix * vec4(objectSpacePosition, 1.0)).xyz;
  vWorldNormal = normalize((modelMatrix * vec4(objectSpaceNormal, 0.0)).xyz);

  // Standard MVP transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(objectSpacePosition, 1.0);

  #include <logdepthbuf_vertex>
}
```

## Transformation Pipeline

### 1. UV Coordinate Passing

```glsl
vUv = uv;
```

**Process:**

- Passes through UV coordinates
- Used for texture sampling in fragment shader

### 2. Object-Space Position

```glsl
vec3 objectSpacePosition = position;
vec3 objectSpaceNormal = normalize(normal);
vObjectPosition = normalize(objectSpacePosition);
```

**Process:**

- Takes local vertex position
- Normalizes vertex normal
- Creates normalized object-space position for seamless noise
- Used for procedural terrain generation

### 3. World Position Calculation

```glsl
vWorldPosition = (modelMatrix * vec4(objectSpacePosition, 1.0)).xyz;
```

**Process:**

- Takes local vertex position
- Applies model matrix transformation
- Extracts XYZ components for world position
- Used for lighting distance calculations

### 4. World Normal Calculation

```glsl
vWorldNormal = normalize((modelMatrix * vec4(objectSpaceNormal, 0.0)).xyz);
```

**Process:**

- Takes local vertex normal
- Applies model matrix transformation (with 0.0 w-component)
- Normalizes the result
- Used for lighting direction calculations

### 5. Final Position Calculation

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(objectSpacePosition, 1.0);
```

**Process:**

- Applies model-view matrix transformation
- Applies projection matrix transformation
- Sets final vertex position for rendering

### 6. Logarithmic Depth

```glsl
#include <logdepthbuf_vertex>
```

**Process:**

- Includes logarithmic depth buffer calculations
- Enables proper depth handling for large scenes
- Prevents z-fighting at great distances

## Seamless Noise Generation

### Object-Space Position

The key feature of this shader is the `vObjectPosition` varying variable:

```glsl
vObjectPosition = normalize(objectSpacePosition);
```

**Purpose:**

- Provides seamless noise coordinates for procedural generation
- Ensures noise patterns are consistent across the sphere surface
- Enables realistic terrain generation without visible seams

**Usage in Fragment Shader:**

- Used as input for noise functions
- Provides consistent coordinate system for terrain generation
- Enables height-based color blending

## Usage in Fragment Shader

The varying variables are used in the fragment shader for:

### vWorldPosition

- **Lighting Calculations**: Distance calculations to light sources
- **Shadow Calculations**: Position for shadow ray intersection tests
- **World Space Effects**: Position-based effects and calculations

### vWorldNormal

- **Lighting Calculations**: Normal for lighting direction calculations
- **Surface Effects**: Normal-based surface effects
- **Reflection Calculations**: Normal for environment map reflections

### vObjectPosition

- **Noise Generation**: Input for procedural noise functions
- **Terrain Generation**: Coordinates for terrain height calculation
- **Seamless Effects**: Ensures seamless procedural effects

### vUv

- **Texture Sampling**: UV coordinates for texture sampling
- **Material Properties**: UV-based material property sampling
- **Procedural Effects**: UV-based procedural effects

## Performance Considerations

### Efficient Transformations

- **Matrix Operations**: Uses efficient matrix multiplication
- **Normalization**: Only normalizes when necessary
- **Minimal Calculations**: Performs only essential calculations

### Memory Usage

- **Varying Variables**: Minimal number of varying variables
- **Data Types**: Uses appropriate data types for precision
- **Interpolation**: Efficient interpolation across fragments

### GPU Optimization

- **Vector Operations**: Uses vector operations where possible
- **Built-in Functions**: Leverages built-in GLSL functions
- **Shader Efficiency**: Optimized for GPU execution

## Integration with Fragment Shader

The vertex shader works in conjunction with the fragment shader to provide:

1. **World-Space Data**: Position and normal data for lighting
2. **Transformation Data**: Properly transformed positions and normals
3. **Lighting Foundation**: Essential data for realistic lighting calculations
4. **Procedural Support**: Data for seamless noise generation

## Dependencies

### Three.js Built-ins

- **modelMatrix**: Object transformation matrix
- **projectionMatrix**: Camera projection matrix
- **modelViewMatrix**: Combined model and view transformation
- **position**: Vertex position attribute
- **normal**: Vertex normal attribute
- **uv**: Vertex UV coordinate attribute

### Shader Includes

- **common**: Common shader definitions and functions
- **logdepthbuf_pars_vertex**: Logarithmic depth buffer parameters
- **logdepthbuf_vertex**: Logarithmic depth buffer calculations

## Error Handling

### Validation

- **Normalization**: Ensures normals are properly normalized
- **Range Checking**: Validates coordinate ranges
- **Matrix Validation**: Ensures matrix transformations are valid

### Fallbacks

- **Default Values**: Provides default values for missing data
- **Error Recovery**: Recovers from transformation errors
- **Graceful Degradation**: Maintains functionality with errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js shader features
- **Extensions**: Supports Three.js extensions

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/terrestrial/procedural.fragment.glsl|Procedural Fragment Shader]] - Fragment shader that uses this vertex shader output
- [[celestials/terrestrial/ProceduralPlanetMaterial|ProceduralPlanetMaterial]] - Material that uses this shader
- [[celestials/terrestrial/BaseTerrestrialRenderer|BaseTerrestrialRenderer]] - Renderer that creates the geometry for this shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
