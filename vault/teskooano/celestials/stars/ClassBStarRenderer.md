---
aliases: [ClassBStarRenderer, ClassBStarMaterial]
tags: [renderer, threejs, stars, main-sequence, b-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-b.ts"
status: active
---

# ClassBStarRenderer & Material

B-class main-sequence star renderer with spectral subclass support (B0–B9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassBStarRenderer` and `ClassBStarMaterial` provide specialized rendering for B-class main sequence stars, which are hot, massive stars with surface temperatures of 10,000-30,000K and masses of 2.1-17.7 solar masses. These stars are blue-white in color and have strong stellar winds.

## Class Definition

```typescript
export class ClassBStarRenderer extends MainSequenceStarRenderer<ClassBStarMaterial>
export class ClassBStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassBStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **B0-B9 Subclasses**: Full support for B0V through B9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### B-Class Specific Properties

- **Temperature Range**: 10,000-30,000K surface temperatures
- **Mass Range**: 2.1-17.7 solar masses
- **Luminosity**: 25-44,668 solar luminosities
- **Color**: Blue-white colors (B-V index: -0.30 to -0.15)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence
- **Lighting Intensity**: Luminosity-based lighting

## Constructor

### ClassBStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassBStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### B-Class Physical Properties

The material uses comprehensive spectral data for B-class stars:

```typescript
const B_CLASS_DATA: Record<number, BClassSpectralData> = {
  0: {
    mass: 17.7,
    radius: 7.16,
    luminosity: 44668,
    temperature: 31400,
    colorIndex: -0.301,
  },
  1: {
    mass: 11.0,
    radius: 5.71,
    luminosity: 13490,
    temperature: 26000,
    colorIndex: -0.278,
  },
  2: {
    mass: 7.3,
    radius: 4.06,
    luminosity: 2692,
    temperature: 20600,
    colorIndex: -0.215,
  },
  // ... B3-B9 data
  9: {
    mass: 2.1,
    radius: 1.8,
    luminosity: 25,
    temperature: 10000,
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
): ClassBStarMaterial
```

Creates a new `ClassBStarMaterial` instance for the given object.

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
const bStarObject = {
  id: "b-star-1",
  properties: {
    spectralClass: "B5V",
    mass: 5.9,
    radius: 3.0,
    luminosity: 1000,
    temperature: 15000,
  },
};

const renderer = new ClassBStarRenderer(bStarObject);
const material = renderer.createMaterial(bStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassBStarRenderer(bStarObject, {
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

- **Default Subclass**: Falls back to B5V if parsing fails
- **Default Properties**: Uses B5V properties for missing data
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
