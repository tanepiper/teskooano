---
aliases: [ClassOStarRenderer, ClassOStarMaterial]
tags: [renderer, threejs, stars, main-sequence, o-class]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/class-o.ts"
status: active
---

# ClassOStarRenderer & Material

O-class main-sequence star renderer with spectral subclass support (O0–O9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Overview

The `ClassOStarRenderer` and `ClassOStarMaterial` provide specialized rendering for O-class main sequence stars, which are the hottest and most massive stars on the main sequence. These stars have surface temperatures of 30,000-50,000K and masses of 16-150 solar masses.

## Class Definition

```typescript
export class ClassOStarRenderer extends MainSequenceStarRenderer<ClassOStarMaterial>
export class ClassOStarMaterial extends EnhancedStarMaterial
```

**Inheritance:**

- `MainSequenceStarRenderer<ClassOStarMaterial>` - Base main sequence star renderer
- `EnhancedStarMaterial` - Enhanced star material with plasma effects

## Key Features

### Spectral Classification Support

- **O0-O9 Subclasses**: Full support for O0V through O9V spectral classifications
- **Physical Properties**: Accurate mass, radius, luminosity, and temperature data
- **Color Index**: B-V color index conversion for realistic colors

### O-Class Specific Properties

- **Temperature Range**: 30,000-50,000K surface temperatures
- **Mass Range**: 16-150 solar masses
- **Luminosity**: 200,000-2,000,000 solar luminosities
- **Color**: Blue-white to blue colors (B-V index: -0.35 to -0.30)

### Material Configuration

- **Noise Scale**: Adjusted based on luminosity (0.01 + luminosity factor)
- **Noise Intensity**: Scaled by temperature (0.08 + temperature factor)
- **Plasma Turbulence**: Mass-dependent turbulence (1.6 + mass factor)
- **Lighting Intensity**: Luminosity-based lighting (1.0 + luminosity factor)

## Constructor

### ClassOStarRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### ClassOStarMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with star properties

## Spectral Data

### O-Class Physical Properties

The material uses comprehensive spectral data for O-class stars:

```typescript
const O_CLASS_DATA: Record<number, OClassSpectralData> = {
  0: {
    mass: 150.0,
    radius: 18.0,
    luminosity: 2000000,
    temperature: 48000,
    colorIndex: -0.335,
  },
  1: {
    mass: 135.0,
    radius: 17.0,
    luminosity: 1800000,
    temperature: 47000,
    colorIndex: -0.333,
  },
  2: {
    mass: 120.0,
    radius: 16.0,
    luminosity: 1600000,
    temperature: 46000,
    colorIndex: -0.33,
  },
  // ... O3-O9 data
  9: {
    mass: 16.0,
    radius: 6.6,
    luminosity: 200000,
    temperature: 30000,
    colorIndex: -0.3,
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
): ClassOStarMaterial
```

Creates a new `ClassOStarMaterial` instance for the given object.

### getStarColor

```typescript
protected getStarColor(star: RenderableCelestialObject): THREE.Color
```

Gets the star color based on its spectral properties.

## Material Properties

### Noise Parameters

- **Noise Scale**: `0.01 + (luminosity - 200000) * 0.00000003`
- **Noise Intensity**: `0.08 + (temperature - 30000) * 0.0000012`
- **Plasma Turbulence**: `1.6 + (mass - 16) * 0.01`

### Lighting

- **Lighting Intensity**: `1.0 + luminosity * 0.000002`

### Color System

- **Hot Color**: Brightest plasma regions
- **Surface Color**: Normal surface areas
- **Cool Color**: Darker regions (rare in O-class stars)

## Usage

### Basic Usage

```typescript
const oStarObject = {
  id: "o-star-1",
  properties: {
    spectralClass: "O5V",
    mass: 40.0,
    radius: 12.0,
    luminosity: 500000,
    temperature: 40000,
  },
};

const renderer = new ClassOStarRenderer(oStarObject);
const material = renderer.createMaterial(oStarObject);
```

### With Custom Options

```typescript
const renderer = new ClassOStarRenderer(oStarObject, {
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

- **Default Subclass**: Falls back to O5V if parsing fails
- **Default Properties**: Uses O5V properties for missing data
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
