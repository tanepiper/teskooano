---
aliases: [HorizontalBranchRenderer, HorizontalBranchMaterial]
tags: [renderer, threejs, stars, post-main-sequence, horizontal-branch]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/horizontal-branch/horizontal-branch.ts"
status: active
---

# HorizontalBranchRenderer & Material

Horizontal Branch star renderer for stars in the helium core burning phase. Features stable helium fusion effects and contracted stellar structure.

## Overview

The `HorizontalBranchRenderer` and `HorizontalBranchMaterial` provide specialized rendering for horizontal branch stars, which are evolved stars that have contracted from the red giant phase and are now burning helium in their cores. These stars are in a stable phase of stellar evolution.

## Class Definition

```typescript
export class HorizontalBranchRenderer extends BaseStarRenderer<HorizontalBranchMaterial>
export class HorizontalBranchMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<HorizontalBranchMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Horizontal Branch Phase**: Helium core burning phase
- **Contracted Structure**: Contracted from red giant phase
- **Stable Fusion**: Stable helium fusion in core
- **Temperature Range**: 4,500-7,500K surface temperatures

### Physical Properties

- **Mass Range**: 0.6-2.0 solar masses
- **Color**: Yellow to white
- **Structure**: Contracted, stable
- **Examples**: RR Lyrae variables

### Visual Effects

- **Stable Helium Fusion**: Stable fusion effects
- **Contracted Structure**: Compact stellar structure
- **Bright Appearance**: Enhanced lighting from helium fusion
- **Stable Activity**: Low turbulence, stable patterns

## Constructor

### HorizontalBranchRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### HorizontalBranchMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const horizontalBranchDefaults = {
  noiseScale: 1.0, // Moderate scale
  noiseIntensity: 0.3, // Moderate intensity
  plasmaTurbulence: 0.2, // Low turbulence
  lightingIntensity: 1.2, // Bright due to helium fusion
};
```

### Color System

- **Base Color**: `#ffdd88` (yellow-white)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): HorizontalBranchMaterial
```

Creates a new `HorizontalBranchMaterial` instance for the given object.

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

Updates the material with stable helium fusion effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Stable Helium Fusion

The material implements stable helium fusion effects:

```typescript
const fusionPhase = Math.sin(time * 0.0001) * 0.1 + 0.9;
```

- **Stable Fusion**: Consistent fusion patterns
- **Helium Burning**: Helium core burning visualization
- **Stable Activity**: Low turbulence, stable patterns

### Contracted Structure

- **Compact Design**: Contracted from red giant phase
- **Stable Patterns**: Consistent surface features
- **Bright Appearance**: Enhanced lighting from helium fusion

## Usage

### Basic Usage

```typescript
const horizontalBranchObject = {
  id: "horizontal-branch-1",
  properties: {
    mass: 1.0,
    radius: 3.0,
    temperature: 6000,
    stellarType: "HORIZONTAL_BRANCH",
  },
};

const renderer = new HorizontalBranchRenderer(horizontalBranchObject);
const material = renderer.createMaterial(horizontalBranchObject);
```

### With Custom Options

```typescript
const renderer = new HorizontalBranchRenderer(horizontalBranchObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Stable Effects**: Performance-friendly stable patterns

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

- **Default Properties**: Uses horizontal branch defaults for missing data
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
- [[celestials/stars/RedGiantRenderer|Red Giant Renderer]] - Previous evolution phase
- [[celestials/stars/AGBRenderer|AGB Renderer]] - Next evolution phase
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
