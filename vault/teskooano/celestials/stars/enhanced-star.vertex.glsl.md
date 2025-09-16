---
aliases: [enhanced-star.vertex.glsl]
tags: [renderer, threejs, stars, shader, vertex]
type: shader
package: "@teskooano/celestials-stars"
file: "src/shaders/enhanced-star.vertex.glsl"
status: active
---

# enhanced-star.vertex.glsl

Vertex shader for enhanced star rendering with plasma effects, supporting dynamic plasma animation and stellar phenomena.

## Overview

The enhanced star vertex shader is responsible for transforming vertex positions and providing essential data for the fragment shader. It supports dynamic plasma effects, stellar phenomena, and time-based animation for realistic star rendering.

## Shader Features

- **Basic Transformations**: Standard vertex transformations for 3D rendering
- **UV Coordinates**: Passes texture coordinates for material sampling
- **Normal Calculation**: Calculates transformed normals for lighting
- **Position Data**: Provides vertex position data for noise generation
- **Time Support**: Supports time-based animation effects
- **Logarithmic Depth**: Supports logarithmic depth buffer for large scenes

## Includes

```glsl
#include <common>
#include <logdepthbuf_pars_vertex>
```

- **common**: Three.js common shader definitions
- **logdepthbuf_pars_vertex**: Logarithmic depth buffer vertex parameters

## Uniform Variables

### uTime

```glsl
uniform float uTime;
```

Current time for animation effects.

- **Usage**: Used for time-based animation in fragment shader
- **Type**: float
- **Purpose**: Enables continuous animation of plasma effects

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the vertex.

- **Usage**: Used in fragment shader for texture sampling
- **Calculation**: `uv`
- **Purpose**: Provides UV coordinates for material effects

### vNormal

```glsl
varying vec3 vNormal;
```

Transformed normal of the vertex.

- **Usage**: Used in fragment shader for lighting calculations
- **Calculation**: `normalize(normalMatrix * normal)`
- **Purpose**: Provides transformed normal for lighting direction

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in object space.

- **Usage**: Used in fragment shader for noise generation
- **Calculation**: `position`
- **Purpose**: Provides position data for procedural effects

## Main Function

```glsl
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

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

### 2. Normal Transformation

```glsl
vNormal = normalize(normalMatrix * normal);
```

**Process:**

- Takes local vertex normal
- Applies normal matrix transformation
- Normalizes the result
- Used for lighting calculations in fragment shader

### 3. Position Data

```glsl
vPosition = position;
```

**Process:**

- Takes local vertex position
- Passes through to fragment shader
- Used for noise generation and procedural effects

### 4. Final Position Calculation

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

**Process:**

- Applies model-view matrix transformation
- Applies projection matrix transformation
- Sets final vertex position for rendering

### 5. Logarithmic Depth

```glsl
#include <logdepthbuf_vertex>
```

**Process:**

- Includes logarithmic depth buffer calculations
- Enables proper depth handling for large scenes
- Prevents z-fighting at great distances

## Usage in Fragment Shader

The varying variables are used in the fragment shader for:

### vUv

- **Texture Sampling**: UV coordinates for texture sampling
- **Material Effects**: UV-based material effects
- **Procedural Effects**: UV-based procedural effects

### vNormal

- **Lighting Calculations**: Normal for lighting direction calculations
- **Surface Effects**: Normal-based surface effects
- **Reflection Calculations**: Normal for environment map reflections

### vPosition

- **Noise Generation**: Input for procedural noise functions
- **Plasma Effects**: Coordinates for plasma generation
- **Stellar Phenomena**: Position-based stellar effects

## Plasma Effects Support

### Position-Based Noise

The vertex shader provides position data for plasma generation:

```glsl
vPosition = position;
```

**Purpose:**

- Provides object-space position for noise generation
- Enables seamless plasma effects across star surface
- Supports time-based animation in fragment shader

### Normal-Based Lighting

The vertex shader provides transformed normals for lighting:

```glsl
vNormal = normalize(normalMatrix * normal);
```

**Purpose:**

- Provides world-space normals for lighting calculations
- Enables realistic lighting effects
- Supports surface-based effects

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

1. **Position Data**: Object-space position for noise generation
2. **Normal Data**: Transformed normals for lighting
3. **UV Data**: Texture coordinates for material effects
4. **Time Support**: Time uniform for animation effects

## Dependencies

### Three.js Built-ins

- **modelMatrix**: Object transformation matrix
- **projectionMatrix**: Camera projection matrix
- **modelViewMatrix**: Combined model and view transformation
- **normalMatrix**: Normal transformation matrix
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

- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader that uses this vertex shader output
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Material that uses this shader
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Renderer that creates the geometry for this shader
- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Main sequence star renderer
- [[celestials/stars/ClassGStarRenderer|Class G Star Renderer]] - G-class star renderer
- [[celestials/stars/ClassOStarRenderer|Class O Star Renderer]] - O-class star renderer
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
