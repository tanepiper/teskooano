---
aliases: [BaseStarMaterial]
tags: [renderer, threejs, stars, material, base]
type: class
package: "@teskooano/celestials-stars"
file: "src/base/base-star.ts"
status: active
---

# BaseStarMaterial

Abstract base material for stars with enhanced shader effects.

## Overview

The `BaseStarMaterial` class is an abstract base class that provides the foundation for all star materials. It implements enhanced shader effects including plasma noise, 3-color plasma system, and uniform lighting for realistic star rendering.

## Class Definition

```typescript
export abstract class BaseStarMaterial extends THREE.ShaderMaterial
```

**Inheritance:**

- `THREE.ShaderMaterial` - Three.js shader material
- Abstract base class for star materials

## Constructor

```typescript
constructor(
  color: THREE.Color = new THREE.Color(0xffff00),
  options: {
    // Basic plasma noise parameters
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;

    // Uniform lighting
    lightingIntensity?: number;
  } = {},
)
```

### Parameters

#### color

- **Type**: `THREE.Color`
- **Default**: `new THREE.Color(0xffff00)` (yellow)
- **Description**: Base color of the star

#### options

- **Type**: Object with optional properties
- **Description**: Configuration options for the material

##### noiseScale

- **Type**: `number`
- **Default**: `1.0`
- **Description**: Scale of noise patterns

##### noiseIntensity

- **Type**: `number`
- **Default**: `0.2`
- **Description**: Intensity of noise effects

##### plasmaTurbulence

- **Type**: `number`
- **Default**: `0.1`
- **Description**: Turbulence level of plasma

##### lightingIntensity

- **Type**: `number`
- **Default**: `1.0`
- **Description**: Overall lighting intensity

## Shader Configuration

### Vertex Shader

```typescript
vertexShader: enhancedStarVertexShader;
```

Uses the enhanced star vertex shader for vertex processing.

### Fragment Shader

```typescript
fragmentShader: enhancedStarFragmentShader;
```

Uses the enhanced star fragment shader for fragment processing.

## Uniforms

### Time Uniform

```typescript
uTime: {
  value: 0.0;
}
```

Current time for animation effects.

### Color Uniforms

```typescript
uStarColor: {
  value: color;
}
uHotColor: {
  value: color.clone().multiplyScalar(1.4);
}
uSurfaceColor: {
  value: color;
}
uCoolColor: {
  value: color.clone().multiplyScalar(0.3);
}
```

- **uStarColor**: Base star color
- **uHotColor**: Hot plasma color (40% brighter)
- **uSurfaceColor**: Surface color (same as base)
- **uCoolColor**: Cool color (70% darker)

### Noise Parameters

```typescript
uNoiseScale: {
  value: options.noiseScale ?? 1.0;
}
uNoiseIntensity: {
  value: options.noiseIntensity ?? 0.2;
}
uPlasmaTurbulence: {
  value: options.plasmaTurbulence ?? 0.1;
}
```

- **uNoiseScale**: Scale of noise patterns
- **uNoiseIntensity**: Intensity of noise effects
- **uPlasmaTurbulence**: Turbulence level of plasma

### Lighting Uniform

```typescript
uLightingIntensity: {
  value: options.lightingIntensity ?? 1.0;
}
```

- **uLightingIntensity**: Overall lighting intensity

## Material Properties

### Transparency

```typescript
transparent: false;
```

Stars are opaque by default.

### Side

```typescript
side: THREE.FrontSide;
```

Only renders the front side of the geometry.

### Depth Testing

```typescript
depthTest: true;
depthWrite: true;
```

Enables depth testing and writing for proper occlusion.

### Blending

```typescript
blending: THREE.NormalBlending;
```

Uses normal blending for opaque stars.

## Methods

### update

```typescript
update(
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

**Purpose:**
Updates the material with the current time and animation state.

**Parameters:**

- **time**: Current time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Current camera
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

**Process:**

1. Updates the time uniform with scaled animation time
2. Creates visible animation cycles
3. Logs animation time for debugging

### dispose

```typescript
dispose(): void
```

**Purpose:**
Disposes of any resources used by the material.

**Process:**

- Currently empty implementation
- Can be overridden by subclasses

## Color System

### 3-Color Plasma System

The material implements a 3-color plasma system:

1. **Hot Color**: Brightest areas (plasma flares, hot spots)
2. **Surface Color**: Normal surface areas
3. **Cool Color**: Darker areas (sunspots, cool regions)

### Color Generation

```typescript
uHotColor: {
  value: color.clone().multiplyScalar(1.4);
}
uSurfaceColor: {
  value: color;
}
uCoolColor: {
  value: color.clone().multiplyScalar(0.3);
}
```

- **Hot Color**: 40% brighter than base color
- **Surface Color**: Same as base color
- **Cool Color**: 70% darker than base color

## Plasma Effects

### Noise Parameters

- **Noise Scale**: Controls the size of noise patterns
- **Noise Intensity**: Controls the strength of noise effects
- **Plasma Turbulence**: Controls the turbulence level

### Animation

- **Time-Based**: Uses time uniform for animation
- **Continuous**: Continuous animation cycles
- **Scaled**: Time is scaled for visible animation

## Performance

### Optimizations

- **Efficient Shaders**: Uses optimized shader code
- **Minimal Uniforms**: Only necessary uniforms
- **GPU Optimized**: Optimized for GPU execution

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource disposal

## Usage

### Basic Usage

```typescript
const material = new MyStarMaterial(new THREE.Color(0xffff00), {
  noiseScale: 1.5,
  noiseIntensity: 0.3,
  plasmaTurbulence: 0.2,
  lightingIntensity: 1.2,
});
```

### Custom Implementation

```typescript
class MyStarMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color, options: any = {}) {
    super(color, options);
    // Custom initialization
  }

  update(time: number, timeScale: number, ...args: any[]): void {
    super.update(time, timeScale, ...args);
    // Custom update logic
  }
}
```

## Error Handling

### Validation

- **Parameter Validation**: Validates constructor parameters
- **Uniform Validation**: Ensures uniforms exist
- **Type Safety**: TypeScript type checking

### Fallbacks

- **Default Values**: Provides default values for missing parameters
- **Error Recovery**: Recovers from errors gracefully
- **Graceful Degradation**: Maintains functionality with errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Enhanced star material implementation
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base star renderer
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
