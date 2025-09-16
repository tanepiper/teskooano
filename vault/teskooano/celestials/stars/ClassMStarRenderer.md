---
aliases: [ClassMStarRenderer, ClassMStarMaterial]
tags: [renderer, threejs, stars, main-sequence, m-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-m.ts"
status: active
---

# ClassMStarRenderer & Material

M-class main-sequence star renderer with spectral subclass support (M0–M9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassMStarRenderer` and `ClassMStarMaterial` provide specialized rendering for M-class main sequence stars, which are red dwarf stars with surface temperatures of 2,400-3,700K and masses of 0.08-0.5 solar masses. These are the most common stars in the universe.

## Class Definition

```typescript
export class ClassMStarRenderer extends MainSequenceStarRenderer<ClassMStarMaterial>
export class ClassMStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassMStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **M0-M9 Subclasses**: Full support for M0V through M9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### M-Class Specific Properties

- **Temperature Range**: 2,400-3,700K surface temperatures
- **Mass Range**: 0.08-0.5 solar masses
- **Luminosity**: 0.001-0.1 solar luminosities
- **Color**: Red colors (B-V index: 1.0 to 1.5)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence
- **Lighting Intensity**: Luminosity-based lighting

## Constructor

### ClassMStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassMStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### M-Class Physical Properties

The material uses comprehensive spectral data for M-class stars:

```typescript
const M_CLASS_DATA: Record<number, MClassSpectralData> = {
  0: {
    mass: 0.5,
    radius: 0.6,
    luminosity: 0.1,
    temperature: 3700,
    colorIndex: 1.0,
  },
  1: {
    mass: 0.4,
    radius: 0.5,
    luminosity: 0.05,
    temperature: 3500,
    colorIndex: 1.1,
  },
  2: {
    mass: 0.3,
    radius: 0.4,
    luminosity: 0.02,
    temperature: 3300,
    colorIndex: 1.2,
  },
  // ... M3-M9 data
  9: {
    mass: 0.08,
    radius: 0.1,
    luminosity: 0.001,
    temperature: 2400,
    colorIndex: 1.5,
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
): ClassMStarMaterial
```

Creates a new `ClassMStarMaterial` instance for the given object.

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
const mStarObject = {
  id: "m-star-1",
  properties: {
    spectralClass: "M5V",
    mass: 0.2,
    radius: 0.3,
    luminosity: 0.01,
    temperature: 2800,
  },
};

const renderer = new ClassMStarRenderer(mStarObject);
const material = renderer.createMaterial(mStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassMStarRenderer(mStarObject, {
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

- **Default Subclass**: Falls back to M5V if parsing fails
- **Default Properties**: Uses M5V properties for missing data
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
