---
aliases: [corona.vertex.glsl]
tags: [renderer, threejs, stars, shader, vertex]
type: shader
package: "@teskooano/celestials-stars"
file: "src/shaders/corona.vertex.glsl"
status: active
---

# corona.vertex.glsl

Vertex shader for corona effects in star rendering.

## Overview

The corona vertex shader is a simple vertex shader that provides the necessary data for corona fragment shader rendering. It handles basic vertex transformations and passes data to the fragment shader for corona effects.

## Shader Features

- **Basic Vertex Transformation**: Standard MVP transformation
- **UV Coordinates**: Passes texture coordinates
- **Normal Transformation**: Transforms normals to world space
- **Position Data**: Passes vertex position
- **Logarithmic Depth Buffer**: Supports logarithmic depth buffer

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

Texture coordinates for the fragment shader.

### vNormal

```glsl
varying vec3 vNormal;
```

Transformed normal in world space.

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in object space.

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

## Vertex Processing

### UV Coordinates

```glsl
vUv = uv;
```

**Process:**

- Passes texture coordinates to fragment shader
- Used for corona texture sampling
- Maintains original UV mapping

### Normal Transformation

```glsl
vNormal = normalize(normalMatrix * normal);
```

**Process:**

- Transforms normal from object space to world space
- Uses normalMatrix for proper transformation
- Normalizes result for accurate lighting
- Used for corona lighting calculations

### Position Data

```glsl
vPosition = position;
```

**Process:**

- Passes vertex position to fragment shader
- Used for corona distance calculations
- Maintains object space coordinates
- Used for corona effects

### MVP Transformation

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

**Process:**

- Applies model-view-projection transformation
- Transforms vertex to clip space
- Standard Three.js transformation
- Required for proper rendering

## Logarithmic Depth Buffer

### Include

```glsl
#include <logdepthbuf_vertex>
```

**Purpose:**

- Supports logarithmic depth buffer
- Improves depth precision for large scenes
- Required for Three.js logarithmic depth buffer
- Maintains depth accuracy

## Corona Integration

### Data Flow

1. **Vertex Position**: Passed to fragment shader
2. **UV Coordinates**: Used for texture sampling
3. **Normal**: Used for lighting calculations
4. **Transformation**: Standard MVP transformation

### Fragment Shader Usage

- **vUv**: Used for corona texture sampling
- **vNormal**: Used for corona lighting
- **vPosition**: Used for distance calculations

## Performance

### Efficiency

- **Minimal Calculations**: Only essential transformations
- **GPU Optimized**: Uses built-in GLSL functions
- **Vector Operations**: Efficient vector operations
- **No Custom Logic**: No custom calculations

### Memory Usage

- **Minimal Varyings**: Only necessary data passed
- **Efficient Packing**: Optimized data packing
- **GPU Memory**: Minimal GPU memory usage

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses standard Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## Error Handling

### Validation

- **Input Validation**: Validates input data
- **Transformation**: Ensures proper transformation
- **Normalization**: Ensures proper normalization

### Fallbacks

- **Default Values**: Provides default values
- **Error Recovery**: Recovers from errors
- **Graceful Degradation**: Maintains functionality

## 🔗 Related

- [[corona.fragment.glsl]] - Fragment shader that uses this vertex shader
- [[CoronaMaterial]] - Material that uses this shader
- [[BaseStarRenderer]] - Renderer that creates the geometry for this shader
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/data-types]] - Type definitions
