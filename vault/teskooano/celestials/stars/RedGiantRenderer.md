---
aliases: [RedGiantRenderer, RedGiantMaterial]
tags: [renderer, threejs, stars, post-main-sequence, red-giant]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/red-giant/red-giant.ts"
status: active
---

# RedGiantRenderer & Material

Red Giant star renderer for evolved stars with convective envelopes and hydrogen shell burning. Features large-scale convection effects and expanded stellar structure.

## Overview

The `RedGiantRenderer` and `RedGiantMaterial` provide specialized rendering for red giant stars, which are evolved stars that have exhausted hydrogen in their cores and expanded to large sizes. These stars have convective envelopes and are in the hydrogen shell burning phase.

## Class Definition

```typescript
export class RedGiantRenderer extends BaseStarRenderer<RedGiantMaterial>
export class RedGiantMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<RedGiantMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Red Giant Phase**: Evolved stars with hydrogen shell burning
- **Convective Envelope**: Large-scale convection cells
- **Expanded Structure**: Large size and low density
- **Temperature Range**: 3,000-5,000K surface temperatures

### Physical Properties

- **Mass Range**: 0.6-10 solar masses
- **Color**: Red to orange
- **Size**: Large radius, low density
- **Examples**: Aldebaran, Arcturus

### Visual Effects

- **Convective Envelope**: Large convection cell effects
- **Expanded Structure**: Large-scale noise patterns
- **Shell Burning**: Hydrogen shell burning visualization
- **Cooler Appearance**: Reduced lighting intensity

## Constructor

### RedGiantRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### RedGiantMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const redGiantDefaults = {
  noiseScale: 0.8, // Larger scale due to size
  noiseIntensity: 0.4, // More visible due to size
  plasmaTurbulence: 0.3, // Moderate turbulence
  lightingIntensity: 0.8, // Cooler, less intense
};
```

### Color System

- **Base Color**: `#ff6644` (red-orange)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): RedGiantMaterial
```

Creates a new `RedGiantMaterial` instance for the given object.

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

Updates the material with convective envelope effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Convective Envelope

The material implements large-scale convection effects:

```typescript
const convectivePhase = Math.sin(time * 0.00005) * 0.2 + 0.8;
```

- **Large Convection Cells**: Massive convection patterns
- **Slow Movement**: Gradual convection animation
- **Realistic Timing**: Slow evolution over time

### Expanded Structure

- **Large Noise Scale**: Scaled for the star's large size
- **Visible Patterns**: More prominent surface features
- **Cooler Appearance**: Reduced lighting intensity

## Usage

### Basic Usage

```typescript
const redGiantObject = {
  id: "red-giant-1",
  properties: {
    mass: 2.0,
    radius: 50.0,
    temperature: 4000,
    stellarType: "RED_GIANT",
  },
};

const renderer = new RedGiantRenderer(redGiantObject);
const material = renderer.createMaterial(redGiantObject);
```

### With Custom Options

```typescript
const renderer = new RedGiantRenderer(redGiantObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Large-Scale Effects**: Performance-friendly large patterns

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

- **Default Properties**: Uses red giant defaults for missing data
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
- [[celestials/stars/SubgiantRenderer|Subgiant Renderer]] - Previous evolution phase
- [[celestials/stars/HorizontalBranchRenderer|Horizontal Branch Renderer]] - Next evolution phase
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
