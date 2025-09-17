---
aliases: [ClassKStarRenderer, ClassKStarMaterial]
tags: [renderer, threejs, stars, main-sequence, k-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-k.ts"
status: active
---

# ClassKStarRenderer & Material

K-class main-sequence star renderer with spectral subclass support (K0–K9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassKStarRenderer` and `ClassKStarMaterial` provide specialized rendering for K-class main sequence stars, which are orange stars with surface temperatures of 3,700-5,200K and masses of 0.5-0.8 solar masses. These stars are cooler and less massive than G-class stars.

## Class Definition

```typescript
export class ClassKStarRenderer extends MainSequenceStarRenderer<ClassKStarMaterial>
export class ClassKStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassKStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **K0-K9 Subclasses**: Full support for K0V through K9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### K-Class Specific Properties

- **Temperature Range**: 3,700-5,200K surface temperatures
- **Mass Range**: 0.5-0.8 solar masses
- **Luminosity**: 0.1-0.4 solar luminosities
- **Color**: Orange colors (B-V index: 0.6 to 1.0)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity
- **Noise Intensity**: Scaled by temperature
- **Plasma Turbulence**: Mass-dependent turbulence
- **Lighting Intensity**: Luminosity-based lighting

## Constructor

### ClassKStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassKStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### K-Class Physical Properties

The material uses comprehensive spectral data for K-class stars:

```typescript
const K_CLASS_DATA: Record<number, KClassSpectralData> = {
  0: {
    mass: 0.8,
    radius: 0.8,
    luminosity: 0.4,
    temperature: 5200,
    colorIndex: 0.6,
  },
  1: {
    mass: 0.75,
    radius: 0.75,
    luminosity: 0.3,
    temperature: 5000,
    colorIndex: 0.7,
  },
  2: {
    mass: 0.7,
    radius: 0.7,
    luminosity: 0.25,
    temperature: 4800,
    colorIndex: 0.8,
  },
  // ... K3-K9 data
  9: {
    mass: 0.5,
    radius: 0.6,
    luminosity: 0.1,
    temperature: 3700,
    colorIndex: 1.0,
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
): ClassKStarMaterial
```

Creates a new `ClassKStarMaterial` instance for the given object.

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
const kStarObject = {
  id: "k-star-1",
  properties: {
    spectralClass: "K5V",
    mass: 0.7,
    radius: 0.7,
    luminosity: 0.25,
    temperature: 4800,
  },
};

const renderer = new ClassKStarRenderer(kStarObject);
const material = renderer.createMaterial(kStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassKStarRenderer(kStarObject, {
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

- **Default Subclass**: Falls back to K5V if parsing fails
- **Default Properties**: Uses K5V properties for missing data
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
