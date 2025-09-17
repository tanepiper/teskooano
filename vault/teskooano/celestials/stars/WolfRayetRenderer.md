---
aliases: [WolfRayetRenderer, WolfRayetMaterial]
tags: [renderer, threejs, stars, post-main-sequence, wolf-rayet]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/supergiant/wolf-rayet.ts"
status: active
---

# WolfRayetRenderer & Material

Wolf-Rayet star renderer for massive stars in the helium-burning phase with strong stellar winds. Features rapid mass loss and strong emission lines.

## Overview

The `WolfRayetRenderer` and `WolfRayetMaterial` provide specialized rendering for Wolf-Rayet stars, which are massive stars in the helium-burning phase with strong stellar winds and rapid mass loss. These stars are precursors to supernovae.

## Class Definition

```typescript
export class WolfRayetRenderer extends BaseStarRenderer<WolfRayetMaterial>
export class WolfRayetMaterial extends BaseStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<WolfRayetMaterial>` - Base star renderer
- `BaseStarMaterial` - Base star material

## Key Features

### Stellar Evolution Phase

- **Wolf-Rayet Phase**: Helium-burning phase
- **Strong Winds**: Strong stellar winds
- **Mass Loss**: Rapidly losing mass
- **Temperature Range**: 30,000-200,000K surface temperatures

### Physical Properties

- **Mass Range**: 10-25 solar masses
- **Color**: Blue-white
- **Winds**: Strong stellar winds
- **Emission**: Strong emission lines

### Visual Effects

- **Strong Winds**: Strong stellar wind effects
- **Mass Loss**: Rapid mass loss visualization
- **Emission Lines**: Strong emission line effects
- **Precursor Effects**: Supernova precursor visualization

## Constructor

### WolfRayetRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### WolfRayetMaterial

```typescript
constructor(
  object: RenderableCelestialObject,
  options: {
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;
    lightingIntensity?: number;
  } = {},
)
```

**Parameters:**

- **object**: The celestial object with star properties
- **options**: Optional material configuration

## Material Configuration

### Default Properties

```typescript
const wolfRayetDefaults = {
  noiseScale: 1.5, // Large scale due to winds
  noiseIntensity: 0.6, // High intensity due to activity
  plasmaTurbulence: 0.4, // High turbulence due to winds
  lightingIntensity: 1.2, // Bright due to high temperature
};
```

### Color System

- **Base Color**: `#a0c8ff` (blue-white)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): WolfRayetMaterial
```

Creates a new `WolfRayetMaterial` instance for the given object.

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

Updates the material with strong stellar wind effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Strong Stellar Winds

The material implements strong stellar wind effects:

- **High Turbulence**: 0.4x plasma turbulence
- **Strong Winds**: Strong stellar wind effects
- **Mass Loss**: Rapid mass loss visualization

### Emission Lines

- **Strong Emission**: Strong emission line effects
- **High Temperature**: 30,000-200,000K surface temperatures
- **Blue-White Color**: Blue-white appearance

## Usage

### Basic Usage

```typescript
const wolfRayetObject = {
  id: "wolf-rayet-1",
  properties: {
    mass: 20.0,
    radius: 5.0,
    temperature: 100000,
    stellarType: "WOLF_RAYET",
  },
};

const renderer = new WolfRayetRenderer(wolfRayetObject);
const material = renderer.createMaterial(wolfRayetObject);
```

### With Custom Options

```typescript
const renderer = new WolfRayetRenderer(wolfRayetObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Wind Effects**: Performance-friendly wind patterns

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

- **Default Properties**: Uses Wolf-Rayet defaults for missing data
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
- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class
- [[celestials/stars/SupergiantRenderer|Supergiant Renderer]] - Related massive star type
- [[celestials/stars/HypergiantRenderer|Hypergiant Renderer]] - Related massive star type
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
