---
aliases: [ClassFStarRenderer, ClassFStarMaterial]
tags: [renderer, threejs, stars, main-sequence, f-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-f.ts"
status: active
---

# ClassFStarRenderer & Material

F-class main-sequence star renderer with spectral subclass support (F0–F9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassFStarRenderer` and `ClassFStarMaterial` provide specialized rendering for F-class main sequence stars, which are yellow-white stars with surface temperatures of 6,000-7,500K and masses of 1.0-1.6 solar masses. These stars are intermediate between A and G classes.

## Class Definition

```typescript
export class ClassFStarRenderer extends MainSequenceStarRenderer<ClassFStarMaterial>
export class ClassFStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassFStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **F0-F9 Subclasses**: Full support for F0V through F9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### F-Class Specific Properties

- **Temperature Range**: 6,000-7,500K surface temperatures
- **Mass Range**: 1.0-1.6 solar masses
- **Luminosity**: 1.5-6 solar luminosities
- **Color**: Yellow-white colors (B-V index: 0.0 to 0.3)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence
- **Lighting Intensity**: Luminosity-based lighting

## Constructor

### ClassFStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassFStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### F-Class Physical Properties

The material uses comprehensive spectral data for F-class stars:

```typescript
const F_CLASS_DATA: Record<number, FClassSpectralData> = {
  0: {
    mass: 1.6,
    radius: 1.4,
    luminosity: 6,
    temperature: 7500,
    colorIndex: 0.0,
  },
  1: {
    mass: 1.5,
    radius: 1.3,
    luminosity: 5,
    temperature: 7200,
    colorIndex: 0.1,
  },
  2: {
    mass: 1.4,
    radius: 1.2,
    luminosity: 4,
    temperature: 6900,
    colorIndex: 0.2,
  },
  // ... F3-F9 data
  9: {
    mass: 1.0,
    radius: 1.0,
    luminosity: 1.5,
    temperature: 6000,
    colorIndex: 0.3,
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
): ClassFStarMaterial
```

Creates a new `ClassFStarMaterial` instance for the given object.

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
const fStarObject = {
  id: "f-star-1",
  properties: {
    spectralClass: "F5V",
    mass: 1.3,
    radius: 1.2,
    luminosity: 3,
    temperature: 6500,
  },
};

const renderer = new ClassFStarRenderer(fStarObject);
const material = renderer.createMaterial(fStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassFStarRenderer(fStarObject, {
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

- **Default Subclass**: Falls back to F5V if parsing fails
- **Default Properties**: Uses F5V properties for missing data
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
