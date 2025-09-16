---
aliases: [SupergiantRenderer, SupergiantMaterial]
tags: [renderer, threejs, stars, post-main-sequence, supergiant]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/supergiant/supergiant.ts"
status: active
---

# SupergiantRenderer & Material

Supergiant star renderer for massive, luminous stars with extreme stellar wind effects. Features powerful stellar winds and advanced fusion stages.

## Overview

The `SupergiantRenderer` and `SupergiantMaterial` provide specialized rendering for supergiant stars, which are massive, luminous stars in advanced fusion stages. These stars have extreme parameters and powerful stellar winds.

## Class Definition

```typescript
export class SupergiantRenderer extends BaseStarRenderer<SupergiantMaterial>
export class SupergiantMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<SupergiantMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Supergiant Phase**: Massive, luminous stars
- **Advanced Fusion**: Advanced fusion stages
- **Stellar Winds**: Powerful stellar winds
- **Temperature Range**: 3,000-50,000K surface temperatures

### Physical Properties

- **Mass Range**: 10-100 solar masses
- **Color**: Red to blue (depending on type)
- **Luminosity**: Extremely luminous
- **Examples**: Antares, Betelgeuse, Rigel

### Visual Effects

- **Stellar Winds**: Powerful stellar wind effects
- **Extreme Parameters**: All extreme values
- **High Turbulence**: High turbulence due to stellar winds
- **Very Bright**: Extremely luminous appearance

## Constructor

### SupergiantRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### SupergiantMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const supergiantDefaults = {
  noiseScale: 2.0, // Large scale due to massive size
  noiseIntensity: 0.7, // High intensity due to mass
  plasmaTurbulence: 0.6, // High turbulence due to stellar winds
  lightingIntensity: 1.3, // Very bright
};
```

### Color System

- **Base Color**: `#ff8844` (orange)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): SupergiantMaterial
```

Creates a new `SupergiantMaterial` instance for the given object.

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

Updates the material with extreme stellar wind effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Stellar Winds

The material implements powerful stellar wind effects:

```typescript
const windPhase = Math.sin(time * 0.0001) * 0.4 + 0.6;
```

- **Powerful Winds**: Extreme stellar wind effects
- **High Turbulence**: High turbulence due to stellar winds
- **Massive Scale**: Large-scale effects due to massive size

### Extreme Parameters

- **All Extreme Values**: Maximum noise scale, intensity, and turbulence
- **Very Bright**: Extremely luminous appearance
- **Advanced Fusion**: Advanced fusion stage visualization

## Usage

### Basic Usage

```typescript
const supergiantObject = {
  id: "supergiant-1",
  properties: {
    mass: 50.0,
    radius: 1000.0,
    temperature: 10000,
    stellarType: "SUPERGIANT",
  },
};

const renderer = new SupergiantRenderer(supergiantObject);
const material = renderer.createMaterial(supergiantObject);
```

### With Custom Options

```typescript
const renderer = new SupergiantRenderer(supergiantObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Extreme Effects**: Performance-friendly extreme patterns

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

- **Default Properties**: Uses supergiant defaults for missing data
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
- [[celestials/stars/HypergiantRenderer|Hypergiant Renderer]] - More massive variant
- [[celestials/stars/WolfRayetRenderer|Wolf-Rayet Renderer]] - Related massive star type
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
