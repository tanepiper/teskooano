---
aliases: [MainSequenceStarMaterial]
tags: [renderer, threejs, stars, material, main-sequence]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/main-sequence-star.ts"
status: active
---

# MainSequenceStarMaterial

Material for main sequence stars with shader effects.

## Overview

The `MainSequenceStarMaterial` class is a specialized material for main sequence stars. It extends the `EnhancedStarMaterial` and provides enhanced shader effects specifically optimized for main sequence star rendering.

## Class Definition

```typescript
export class MainSequenceStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `EnhancedStarMaterial` - Enhanced star material with 3-color plasma system

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  color: THREE.Color = new THREE.Color(0xffff00),
)
```

### Parameters

#### object

- **Type**: `RenderableCelestialObject`
- **Description**: The celestial object to render

#### color

- **Type**: `THREE.Color`
- **Default**: `new THREE.Color(0xffff00)` (yellow)
- **Description**: Base color of the star

## Features

### Enhanced Shader Effects

- **3-Color Plasma System**: Hot, surface, and cool colors
- **Dynamic Plasma Effects**: Noise-driven plasma with configurable parameters
- **Stellar Phenomena**: Sunspots, coronal mass ejections, stellar flares
- **Time-Based Animation**: Continuous plasma animation
- **Procedural Noise**: Simplex noise and fractal Brownian motion

### Main Sequence Optimization

- **Spectral Characteristics**: Optimized for main sequence star properties
- **Temperature-Based Colors**: Accurate color representation
- **Stellar Activity**: Realistic stellar activity patterns
- **Performance**: Optimized for main sequence star rendering

## Material Properties

### Shader Configuration

- **Vertex Shader**: Enhanced star vertex shader
- **Fragment Shader**: Enhanced star fragment shader
- **Uniforms**: Time, colors, noise parameters, lighting

### Rendering Properties

- **Transparency**: Opaque (transparent: false)
- **Side**: Front side only
- **Depth Testing**: Enabled
- **Depth Writing**: Enabled
- **Blending**: Normal blending

## Color System

### 3-Color Plasma System

1. **Hot Color**: Brightest areas (plasma flares, hot spots)
2. **Surface Color**: Normal surface areas
3. **Cool Color**: Darker areas (sunspots, cool regions)

### Color Generation

- **Base Color**: Constructor parameter
- **Hot Color**: 40% brighter than base
- **Surface Color**: Same as base
- **Cool Color**: 70% darker than base

## Plasma Effects

### Noise Parameters

- **Noise Scale**: Controls the size of noise patterns
- **Noise Intensity**: Controls the strength of noise effects
- **Plasma Turbulence**: Controls the turbulence level

### Animation

- **Time-Based**: Uses time uniform for animation
- **Continuous**: Continuous animation cycles
- **Scaled**: Time is scaled for visible animation

## Usage

### Basic Usage

```typescript
const material = new MainSequenceStarMaterial(
  starObject,
  new THREE.Color(0xffff00),
);
```

### With Star Renderer

```typescript
const renderer = new MainSequenceStarRenderer(starObject);
const material = renderer.createMaterial(starObject);
```

### Custom Configuration

```typescript
const material = new MainSequenceStarMaterial(
  starObject,
  new THREE.Color(0xff6600),
);
// Material inherits all EnhancedStarMaterial features
```

## Integration

### With MainSequenceStarRenderer

The material is used by the `MainSequenceStarRenderer`:

```typescript
protected createMaterial(
  object: RenderableCelestialObject<StarProperties>,
): TMainSequenceMaterial {
  if (this.materialCache.has(object.id)) {
    return this.materialCache.get(object.id)!;
  }
  const color = this.getStarColor(object);
  const material = new MainSequenceStarMaterial(
    object,
    color,
  ) as TMainSequenceMaterial;
  this.materialCache.set(object.id, material);
  return material;
}
```

### Material Caching

- **Cache**: Materials are cached by object ID
- **Reuse**: Avoids recreating materials
- **Performance**: Improves rendering performance

## Performance

### Optimizations

- **Inherited Features**: Inherits all EnhancedStarMaterial optimizations
- **Main Sequence Specific**: Optimized for main sequence stars
- **Efficient Shaders**: Uses optimized shader code
- **GPU Optimized**: Optimized for GPU execution

### Memory Usage

- **Efficient Memory**: Efficient memory usage
- **Resource Management**: Proper resource disposal
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Parameter Validation**: Validates constructor parameters
- **Object Validation**: Validates celestial object
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

- [[EnhancedStarMaterial]] - Base enhanced star material
- [[MainSequenceStarRenderer]] - Renderer that uses this material
- [[BaseStarMaterial]] - Base star material
- [[enhanced-star.vertex.glsl]] - Vertex shader
- [[enhanced-star.fragment.glsl]] - Fragment shader
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/data-types]] - Type definitions
