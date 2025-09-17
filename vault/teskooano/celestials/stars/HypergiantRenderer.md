---
aliases: [HypergiantRenderer, HypergiantMaterial]
tags: [renderer, threejs, stars, post-main-sequence, hypergiant]
type: class
package: "@teskooano/celestials-stars"
file: "src/mature-stars/supergiant/hypergiant.ts"
status: active
---

# HypergiantRenderer & Material

Hypergiant star renderer for the most massive and luminous stars. Features extreme stellar parameters, massive coronas, and intense stellar winds.

## Overview

The `HypergiantRenderer` and `HypergiantMaterial` provide specialized rendering for hypergiant stars, which are the most massive and luminous stars in the universe. These stars have extreme parameters, massive coronas, and intense stellar winds.

## Class Definition

```typescript
export class HypergiantRenderer extends BaseStarRenderer<HypergiantMaterial>
export class HypergiantMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `BaseStarRenderer<HypergiantMaterial>` - Base star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Stellar Evolution Phase

- **Hypergiant Phase**: Most massive and luminous stars
- **Extreme Parameters**: Maximum stellar parameters
- **Massive Coronas**: Coronas extending far from the star
- **Intense Winds**: Extreme stellar winds

### Physical Properties

- **Mass Range**: 100+ solar masses
- **Luminosity**: Extremely luminous
- **Temperature**: Extremely hot and bright
- **Instability**: Unstable pulsations and mass loss

### Visual Effects

- **Massive Coronas**: Coronas extending far from the star
- **Intense Winds**: Extreme stellar wind effects
- **Unstable Pulsations**: Variable brightness and size
- **Extreme Activity**: Maximum plasma activity

## Constructor

### HypergiantRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### HypergiantMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Material Configuration

### Default Properties

```typescript
const hypergiantDefaults = {
  // Basic effects - all maxed out
  coronaIntensity: 1.5, // Massive corona
  pulseSpeed: 1.2, // Fast, unstable pulsations
  glowIntensity: 1.8, // Extremely bright
  temperatureVariation: 0.3, // High temperature variation
  metallicEffect: 0.2, // Less metallic, more plasma-dominated

  // Enhanced plasma dynamics - extreme values
  plasmaIntensity: 2.0, // Maximum plasma activity
  convectionScale: 25.0, // Massive convection cells
  convectionSpeed: 3.0, // Rapid convection
  plasmaTurbulence: 1.5, // Extreme turbulence
  magneticFieldStrength: 2.0, // Powerful magnetic fields

  // Sunspot system - different from smaller stars
  sunspotFrequency: 0.1, // Very few but massive
  sunspotSize: 15.0, // Huge sunspots
  sunspotContrast: 1.0, // High contrast
  sunspotLatitudeBand: 0.3, // Confined to specific bands
  sunspotCycle: 2000.0, // Very long cycles

  // Coronal mass ejections - extreme
  cmeFrequency: 1.5, // Frequent massive ejections
  cmeIntensity: 2.5, // Extremely intense
  cmeSpeed: 5.0, // Very fast
  cmeScale: 3.0, // Large scale
};
```

### Color System

- **Base Color**: Dynamic based on temperature
- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): HypergiantMaterial
```

Creates a new `HypergiantMaterial` instance for the given object.

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

Updates the material with extreme stellar effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Massive Coronas

The material implements massive corona effects:

- **Corona Intensity**: 1.5x normal intensity
- **Massive Scale**: Coronas extending far from the star
- **Extreme Brightness**: Extremely bright appearance

### Intense Stellar Winds

- **Extreme Turbulence**: 1.5x plasma turbulence
- **Powerful Winds**: Extreme stellar wind effects
- **Rapid Convection**: 3.0x convection speed

### Unstable Pulsations

- **Fast Pulsations**: 1.2x pulse speed
- **Variable Brightness**: Unstable brightness variations
- **Variable Size**: Unstable size variations

## Usage

### Basic Usage

```typescript
const hypergiantObject = {
  id: "hypergiant-1",
  properties: {
    mass: 150.0,
    radius: 2000.0,
    temperature: 20000,
    stellarType: "HYPERGIANT",
  },
};

const renderer = new HypergiantRenderer(hypergiantObject);
const material = renderer.createMaterial(hypergiantObject);
```

### With Custom Options

```typescript
const renderer = new HypergiantRenderer(hypergiantObject, {
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

- **Default Properties**: Uses hypergiant defaults for missing data
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
- [[celestials/stars/SupergiantRenderer|Supergiant Renderer]] - Less massive variant
- [[celestials/stars/WolfRayetRenderer|Wolf-Rayet Renderer]] - Related massive star type
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
