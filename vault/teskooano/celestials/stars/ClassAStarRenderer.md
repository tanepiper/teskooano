---
aliases: [ClassAStarRenderer, ClassAStarMaterial]
tags: [renderer, threejs, stars, main-sequence, a-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-a.ts"
status: active
---

# ClassAStarRenderer & Material

A-class main-sequence star renderer with spectral subclass support (A0–A9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassAStarRenderer` and `ClassAStarMaterial` provide specialized rendering for A-class main sequence stars, which are white stars with surface temperatures of 7,500-10,000K and masses of 1.4-2.18 solar masses. These stars are white in color and have strong hydrogen absorption lines.

## Class Definition

```typescript
export class ClassAStarRenderer extends MainSequenceStarRenderer<ClassAStarMaterial>
export class ClassAStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassAStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **A0-A9 Subclasses**: Full support for A0V through A9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### A-Class Specific Properties

- **Temperature Range**: 7,500-10,000K surface temperatures
- **Mass Range**: 1.4-2.18 solar masses
- **Luminosity**: 5-20 solar luminosities
- **Color**: White colors (B-V index: -0.15 to 0.0)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence
- **Lighting Intensity**: Luminosity-based lighting

## Constructor

### ClassAStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassAStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### A-Class Physical Properties

The material uses comprehensive spectral data for A-class stars:

```typescript
const A_CLASS_DATA: Record<number, AClassSpectralData> = {
  0: {
    mass: 2.18,
    radius: 2.0,
    luminosity: 20,
    temperature: 10000,
    colorIndex: 0.0,
  },
  1: {
    mass: 2.0,
    radius: 1.8,
    luminosity: 15,
    temperature: 9500,
    colorIndex: -0.05,
  },
  2: {
    mass: 1.8,
    radius: 1.6,
    luminosity: 12,
    temperature: 9000,
    colorIndex: -0.1,
  },
  // ... A3-A9 data
  9: {
    mass: 1.4,
    radius: 1.2,
    luminosity: 5,
    temperature: 7500,
    colorIndex: -0.15,
  },
};
```

### Color Generation

The material automatically generates realistic colors based on:

1. **B-V Color Index**: Converts spectral color index to RGB
2. **Temperature Scaling**: Adjusts colors based on stellar temperature
3. **Color Palette**: Creates hot, surface, and cool color variations

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): ClassAStarMaterial
```

Creates a new `ClassAStarMaterial` instance for the given object.

### getStarColor

```typescript
protected getStarColor(star: RenderableCelestialObject): THREE.Color
```

Gets the star color based on its spectral properties.

## Material Properties

### Noise Parameters

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence

### Lighting

- **Lighting Intensity**: Luminosity-based lighting

### Color System

- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions

## Usage

### Basic Usage

```typescript
const aStarObject = {
  id: "a-star-1",
  properties: {
    spectralClass: "A5V",
    mass: 1.8,
    radius: 1.6,
    luminosity: 12,
    temperature: 9000,
  },
};

const renderer = new ClassAStarRenderer(aStarObject);
const material = renderer.createMaterial(aStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassAStarRenderer(aStarObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Spectral Data Lookup**: Fast O(1) lookup for spectral properties
- **Efficient Color Generation**: Optimized color calculations

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource cleanup
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Spectral Class Parsing**: Validates spectral class format
- **Property Validation**: Ensures required properties exist
- **Fallback Values**: Provides defaults for missing data

### Fallbacks

- **Default Subclass**: Falls back to A5V if parsing fails
- **Default Properties**: Uses A5V properties for missing data
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

- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Base renderer class
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Base material class
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base star renderer
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
