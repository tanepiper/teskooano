---
aliases: [AGBRenderer, AGBMaterial]
tags:
  [renderer, threejs, stars, post-main-sequence, agb, asymptotic-giant-branch]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/asymptotic-giant-branch/agb.ts"
status: active
---

# AGBRenderer & Material

Asymptotic Giant Branch (AGB) star renderer for evolved stars with complex shell burning and strong mass loss. Features multiple shell burning effects and mass loss visualization.

## Overview

The `AGBRenderer` and `AGBMaterial` provide specialized rendering for AGB stars, which are evolved stars in the final stages of stellar evolution. These stars have carbon and oxygen cores with helium and hydrogen shell burning, and exhibit strong mass loss.

## Class Definition

```typescript
export class AGBRenderer extends BaseStarRenderer<AGBMaterial>
export class AGBMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<AGBMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **AGB Phase**: Final stages of stellar evolution
- **Shell Burning**: Helium and hydrogen shell burning
- **Mass Loss**: Strong stellar wind and mass loss
- **Temperature Range**: 2,500-4,500K surface temperatures

### Physical Properties

- **Mass Range**: 0.6-10 solar masses
- **Color**: Red to orange
- **Core**: Carbon and oxygen core
- **Examples**: Mira variables, carbon stars

### Visual Effects

- **Shell Burning**: Multiple shell burning effects
- **Mass Loss**: Stellar wind and mass loss visualization
- **Complex Structure**: Large-scale, complex patterns
- **High Turbulence**: Strong mass loss effects

## Constructor

### AGBRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### AGBMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const agbDefaults = {
  noiseScale: 1.5, // Large scale due to size
  noiseIntensity: 0.5, // High intensity due to shell burning
  plasmaTurbulence: 0.4, // High turbulence due to mass loss
  lightingIntensity: 0.9, // Moderate due to cool temperature
};
```

### Color System

- **Base Color**: `#ff5533` (red-orange)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): AGBMaterial
```

Creates a new `AGBMaterial` instance for the given object.

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

Updates the material with shell burning and mass loss effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Shell Burning

The material implements complex shell burning effects:

```typescript
const shellBurningPhase = Math.sin(time * 0.0001) * 0.3 + 0.7;
```

- **Multiple Shells**: Helium and hydrogen shell burning
- **Complex Patterns**: Large-scale, complex surface features
- **High Intensity**: Strong shell burning effects

### Mass Loss

- **Stellar Wind**: Mass loss visualization
- **High Turbulence**: Strong mass loss effects
- **Complex Structure**: Large-scale patterns

## Usage

### Basic Usage

```typescript
const agbObject = {
  id: "agb-1",
  properties: {
    mass: 2.0,
    radius: 100.0,
    temperature: 3500,
    stellarType: "AGB",
  },
};

const renderer = new AGBRenderer(agbObject);
const material = renderer.createMaterial(agbObject);
```

### With Custom Options

```typescript
const renderer = new AGBRenderer(agbObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Complex Effects**: Performance-friendly complex patterns

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

- **Default Properties**: Uses AGB defaults for missing data
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
- [[celestials/stars/HorizontalBranchRenderer|Horizontal Branch Renderer]] - Previous evolution phase
- [[celestials/stars/PostAGBRenderer|Post AGB Renderer]] - Next evolution phase
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
