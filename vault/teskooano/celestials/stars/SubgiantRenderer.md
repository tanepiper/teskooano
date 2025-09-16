---
aliases: [SubgiantRenderer, SubgiantMaterial]
tags: [renderer, threejs, stars, post-main-sequence, subgiant]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/subgiant/subgiant.ts"
status: active
---

# SubgiantRenderer & Material

Subgiant star renderer for stars in the transition phase between main sequence and red giant. Features gradual expansion effects and moderate stellar activity.

## Overview

The `SubgiantRenderer` and `SubgiantMaterial` provide specialized rendering for subgiant stars, which are in the transition phase between main sequence and red giant evolution. These stars have exhausted hydrogen in their cores and are beginning to expand and cool.

## Class Definition

```typescript
export class SubgiantRenderer extends BaseStarRenderer<SubgiantMaterial>
export class SubgiantMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<SubgiantMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Transition Phase**: Between main sequence and red giant
- **Hydrogen Shell Burning**: Core hydrogen exhausted, shell burning active
- **Gradual Expansion**: Slowly growing in size
- **Temperature Range**: 4,000-7,000K surface temperatures

### Physical Properties

- **Mass Range**: 0.6-10 solar masses
- **Color**: Yellow to orange
- **Expansion**: Gradual size increase
- **Cooling**: Surface temperature decreasing

### Visual Effects

- **Gradual Expansion**: Slow growth animation
- **Moderate Activity**: Balanced stellar activity
- **Shell Burning**: Hydrogen shell burning effects
- **Transition Effects**: Smooth evolution visualization

## Constructor

### SubgiantRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### SubgiantMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const subgiantDefaults = {
  noiseScale: 1.2, // Moderate noise scale
  noiseIntensity: 0.3, // Moderate noise intensity
  plasmaTurbulence: 0.2, // Low plasma turbulence
  lightingIntensity: 1.1, // Slightly enhanced lighting
};
```

### Color System

- **Base Color**: `#ffaa44` (yellow-orange)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): SubgiantMaterial
```

Creates a new `SubgiantMaterial` instance for the given object.

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

Updates the material with gradual expansion effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Gradual Expansion

The material implements a gradual expansion effect:

```typescript
const expansionPhase = Math.sin(time * 0.0001) * 0.1 + 0.9;
```

- **Slow Growth**: Very gradual size increase
- **Smooth Animation**: Sine wave-based expansion
- **Realistic Timing**: Slow evolution over time

### Stellar Activity

- **Moderate Noise**: Balanced noise effects
- **Shell Burning**: Hydrogen shell burning visualization
- **Transition Effects**: Smooth evolution between phases

## Usage

### Basic Usage

```typescript
const subgiantObject = {
  id: "subgiant-1",
  properties: {
    mass: 2.0,
    radius: 2.5,
    temperature: 5500,
    stellarType: "SUBGIANT",
  },
};

const renderer = new SubgiantRenderer(subgiantObject);
const material = renderer.createMaterial(subgiantObject);
```

### With Custom Options

```typescript
const renderer = new SubgiantRenderer(subgiantObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Gradual Effects**: Smooth, performance-friendly animations

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource cleanup
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Property Validation**: Ensures required properties exist
- **Fallback Values**: Provides defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

### Fallbacks

- **Default Properties**: Uses subgiant defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

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

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Base material class
- [[celestials/stars/RedGiantRenderer|Red Giant Renderer]] - Next evolution phase
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
