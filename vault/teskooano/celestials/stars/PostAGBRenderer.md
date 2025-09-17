---
aliases: [PostAGBRenderer, PostAGBMaterial]
tags: [renderer, threejs, stars, post-main-sequence, post-agb]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/post-agb/post-agb.ts"
status: active
---

# PostAGBRenderer & Material

Post-AGB star renderer for hot central stars of planetary nebulae. Features high temperature effects and contracted stellar structure.

## Overview

The `PostAGBRenderer` and `PostAGBMaterial` provide specialized rendering for post-AGB stars, which are the hot central stars of planetary nebulae. These stars have contracted from the AGB phase and are very hot and luminous.

## Class Definition

```typescript
export class PostAGBRenderer extends BaseStarRenderer<PostAGBMaterial>
export class PostAGBMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<PostAGBMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Post-AGB Phase**: Hot central star of planetary nebula
- **Contracted Structure**: Contracted from AGB phase
- **High Temperature**: Very hot and luminous
- **Temperature Range**: 5,000-30,000K surface temperatures

### Physical Properties

- **Mass Range**: 0.6-10 solar masses
- **Color**: White to blue-white
- **Structure**: Hot and contracted
- **Examples**: Central stars of planetary nebulae

### Visual Effects

- **High Temperature**: Very hot surface effects
- **Contracted Structure**: Compact, hot appearance
- **High Luminosity**: Very bright due to high temperature
- **Intense Activity**: High-intensity plasma effects

## Constructor

### PostAGBRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### PostAGBMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const postAGBDefaults = {
  noiseScale: 0.6, // Small scale due to contraction
  noiseIntensity: 0.6, // High intensity due to heat
  plasmaTurbulence: 0.3, // Moderate turbulence
  lightingIntensity: 1.5, // Very bright due to high temperature
};
```

### Color System

- **Base Color**: `#ffffff` (white)
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): PostAGBMaterial
```

Creates a new `PostAGBMaterial` instance for the given object.

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

Updates the material with high temperature effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### High Temperature

The material implements high temperature effects:

```typescript
const temperaturePhase = Math.sin(time * 0.0002) * 0.2 + 0.8;
```

- **High Temperature**: Very hot surface effects
- **Intense Activity**: High-intensity plasma effects
- **Bright Appearance**: Very bright due to high temperature

### Contracted Structure

- **Compact Design**: Contracted from AGB phase
- **Small Scale**: Small noise scale due to contraction
- **High Intensity**: High-intensity surface features

## Usage

### Basic Usage

```typescript
const postAGBObject = {
  id: "post-agb-1",
  properties: {
    mass: 2.0,
    radius: 0.5,
    temperature: 15000,
    stellarType: "POST_AGB",
  },
};

const renderer = new PostAGBRenderer(postAGBObject);
const material = renderer.createMaterial(postAGBObject);
```

### With Custom Options

```typescript
const renderer = new PostAGBRenderer(postAGBObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **High-Intensity Effects**: Performance-friendly intense patterns

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

- **Default Properties**: Uses post-AGB defaults for missing data
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
- [[celestials/stars/AGBRenderer|AGB Renderer]] - Previous evolution phase
- [[celestials/stars/WhiteDwarfRenderer|White Dwarf Renderer]] - Next evolution phase
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
