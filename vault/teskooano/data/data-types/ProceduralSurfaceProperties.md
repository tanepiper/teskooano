---
aliases: [ProceduralSurfaceProperties]
tags: [data, types, procedural, surface]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# ProceduralSurfaceProperties

Interface defining properties for procedural surface generation and rendering with noise-based terrain and 5-color height gradients.

## Overview

The `ProceduralSurfaceProperties` interface controls the appearance and characteristics of procedurally generated surfaces for planets, moons, and other celestial bodies. It provides comprehensive control over noise-based terrain generation, color gradients, material properties, and terrain algorithms.

## Interface Definition

```typescript
export interface ProceduralSurfaceProperties {
  persistence: number;
  lacunarity: number;
  simplePeriod: number;
  octaves: number;
  bumpScale: number;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  height1: number;
  height2: number;
  height3: number;
  height4: number;
  height5: number;
  shininess: number;
  specularStrength: number;
  roughness: number;
  ambientLightIntensity: number;
  undulation: number;
  terrainType: number;
  terrainAmplitude: number;
  terrainSharpness: number;
  terrainOffset: number;
}
```

## Noise Parameters

### persistence

```typescript
persistence: number;
```

Controls how quickly the noise amplitude decreases with each octave.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Higher values create more persistent detail across octaves

### lacunarity

```typescript
lacunarity: number;
```

Controls how quickly the frequency increases with each octave.

- **Type**: `number`
- **Required**: Yes
- **Range**: Typically > 1.0 (usually 2.0-3.0)
- **Usage**: Higher values create more detailed, fractal-like patterns

### simplePeriod

```typescript
simplePeriod: number;
```

Base frequency for the noise generation.

- **Type**: `number`
- **Required**: Yes
- **Range**: 1.0 to 10.0+
- **Usage**: Controls the scale of the largest features

### octaves

```typescript
octaves: number;
```

Number of noise layers to combine for detail.

- **Type**: `number`
- **Required**: Yes
- **Range**: 1 to 8 (typically 4-6)
- **Usage**: More octaves create more detailed surfaces but cost performance

### bumpScale

```typescript
bumpScale: number;
```

Scale factor for normal map/bump mapping effect.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Controls the intensity of surface normal perturbation

## Color Gradient System

### Color Properties

```typescript
color1: string; // Base color (lowest elevation)
color2: string; // Second color gradient point
color3: string; // Third color gradient point
color4: string; // Fourth color gradient point
color5: string; // Final color (highest elevation)
```

All colors are hex color strings used for height-based color blending.

### Height Thresholds

```typescript
height1: number; // Height threshold for color1 transition
height2: number; // Height threshold for color2 transition
height3: number; // Height threshold for color3 transition
height4: number; // Height threshold for color4 transition
height5: number; // Height threshold for color5 transition
```

Height thresholds define where color transitions occur (0.0 to 1.0).

## Material Properties

### shininess

```typescript
shininess: number;
```

Surface shininess factor.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Controls surface reflectivity and specular highlights

### specularStrength

```typescript
specularStrength: number;
```

Intensity of specular highlights.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Controls the strength of specular reflections

### roughness

```typescript
roughness: number;
```

Surface roughness factor.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Controls surface roughness for PBR materials

### ambientLightIntensity

```typescript
ambientLightIntensity: number;
```

Intensity of ambient lighting.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Controls ambient light contribution

### undulation

```typescript
undulation: number;
```

Controls the amount of surface undulation/waviness.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Adds subtle surface variation and movement

## Terrain Generation

### terrainType

```typescript
terrainType: number;
```

Type of terrain generation algorithm.

- **Type**: `number`
- **Required**: Yes
- **Values**:
  - `1` = Simple terrain (smooth features)
  - `2` = Sharp peaks (mountain-like features)
  - `3` = Sharp valleys (canyon-like features)
- **Usage**: Selects terrain generation algorithm

### terrainAmplitude

```typescript
terrainAmplitude: number;
```

Controls overall height scale of the terrain.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Scales the height variation of terrain features

### terrainSharpness

```typescript
terrainSharpness: number;
```

Controls how defined and sharp terrain features appear.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 2.0
- **Usage**: Higher values create sharper, more defined features

### terrainOffset

```typescript
terrainOffset: number;
```

Base height offset for the entire terrain.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Raises or lowers the entire terrain baseline

## Usage Examples

### Earth-like Terrestrial Surface

```typescript
const terrestrialSurface: ProceduralSurfaceProperties = {
  // Noise parameters
  persistence: 0.5,
  lacunarity: 2.0,
  simplePeriod: 4.0,
  octaves: 6,
  bumpScale: 0.1,

  // Color gradient (ocean to snow)
  color1: "#4682B4", // Steel blue (ocean)
  color2: "#8B4513", // Saddle brown (land)
  color3: "#228B22", // Forest green (vegetation)
  color4: "#DEB887", // Burlywood (mountains)
  color5: "#FFFFFF", // White (snow peaks)

  // Height thresholds
  height1: 0.0, // Sea level
  height2: 0.3, // Coastal plains
  height3: 0.5, // Hills
  height4: 0.7, // Mountains
  height5: 1.0, // Peaks

  // Material properties
  shininess: 0.1,
  specularStrength: 0.2,
  roughness: 0.8,
  ambientLightIntensity: 0.3,
  undulation: 0.1,

  // Terrain generation
  terrainType: 1, // Simple terrain
  terrainAmplitude: 0.2,
  terrainSharpness: 0.5,
  terrainOffset: 0.0,
};
```

### Mars-like Desert Surface

```typescript
const desertSurface: ProceduralSurfaceProperties = {
  // Noise parameters
  persistence: 0.6,
  lacunarity: 2.2,
  simplePeriod: 3.0,
  octaves: 5,
  bumpScale: 0.15,

  // Color gradient (brown to tan)
  color1: "#8B4513", // Dark brown (lowlands)
  color2: "#CD853F", // Peru (plains)
  color3: "#D2691E", // Chocolate (hills)
  color4: "#F4A460", // Sandy brown (highlands)
  color5: "#FFF8DC", // Cornsilk (peaks)

  // Height thresholds
  height1: 0.0,
  height2: 0.2,
  height3: 0.4,
  height4: 0.7,
  height5: 1.0,

  // Material properties (dry, rough)
  shininess: 0.05,
  specularStrength: 0.1,
  roughness: 0.9,
  ambientLightIntensity: 0.4,
  undulation: 0.2,

  // Terrain generation (sharp peaks for canyons)
  terrainType: 2,
  terrainAmplitude: 0.3,
  terrainSharpness: 0.8,
  terrainOffset: 0.1,
};
```

### Ice World Surface

```typescript
const iceSurface: ProceduralSurfaceProperties = {
  // Noise parameters (smoother)
  persistence: 0.4,
  lacunarity: 2.5,
  simplePeriod: 6.0,
  octaves: 4,
  bumpScale: 0.05,

  // Color gradient (ice blues)
  color1: "#E0FFFF", // Light cyan (deep ice)
  color2: "#B0E0E6", // Powder blue (ice plains)
  color3: "#87CEEB", // Sky blue (ridges)
  color4: "#4682B4", // Steel blue (pressure ridges)
  color5: "#FFFFFF", // White (fresh ice)

  // Height thresholds
  height1: 0.0,
  height2: 0.3,
  height3: 0.6,
  height4: 0.8,
  height5: 1.0,

  // Material properties (reflective ice)
  shininess: 0.8,
  specularStrength: 0.9,
  roughness: 0.1,
  ambientLightIntensity: 0.2,
  undulation: 0.05,

  // Terrain generation (simple, smooth)
  terrainType: 1,
  terrainAmplitude: 0.1,
  terrainSharpness: 0.3,
  terrainOffset: 0.0,
};
```

### Volcanic Surface

```typescript
const volcanicSurface: ProceduralSurfaceProperties = {
  // Noise parameters (high detail)
  persistence: 0.7,
  lacunarity: 2.8,
  simplePeriod: 2.0,
  octaves: 7,
  bumpScale: 0.3,

  // Color gradient (lava colors)
  color1: "#8B0000", // Dark red (cooled lava)
  color2: "#DC143C", // Crimson (warm lava)
  color3: "#FF4500", // Orange red (hot lava)
  color4: "#FF6347", // Tomato (very hot)
  color5: "#FFFF00", // Yellow (molten)

  // Height thresholds
  height1: 0.0,
  height2: 0.2,
  height3: 0.4,
  height4: 0.7,
  height5: 1.0,

  // Material properties (rough, emissive)
  shininess: 0.3,
  specularStrength: 0.4,
  roughness: 0.7,
  ambientLightIntensity: 0.6,
  undulation: 0.3,

  // Terrain generation (sharp valleys for lava flows)
  terrainType: 3,
  terrainAmplitude: 0.4,
  terrainSharpness: 1.0,
  terrainOffset: 0.2,
};
```

### Ocean World Surface

```typescript
const oceanSurface: ProceduralSurfaceProperties = {
  // Noise parameters (smooth water)
  persistence: 0.3,
  lacunarity: 1.8,
  simplePeriod: 8.0,
  octaves: 3,
  bumpScale: 0.02,

  // Color gradient (ocean depths)
  color1: "#000080", // Navy (deep ocean)
  color2: "#0000CD", // Medium blue
  color3: "#4169E1", // Royal blue
  color4: "#87CEEB", // Sky blue (shallow)
  color5: "#F0F8FF", // Alice blue (surface)

  // Height thresholds
  height1: 0.0,
  height2: 0.4,
  height3: 0.6,
  height4: 0.8,
  height5: 1.0,

  // Material properties (reflective water)
  shininess: 0.9,
  specularStrength: 1.0,
  roughness: 0.05,
  ambientLightIntensity: 0.25,
  undulation: 0.02,

  // Terrain generation (minimal variation)
  terrainType: 1,
  terrainAmplitude: 0.05,
  terrainSharpness: 0.2,
  terrainOffset: 0.0,
};
```

## Terrain Algorithms

### Type 1: Simple Terrain

- **Characteristics**: Smooth, rolling hills
- **Usage**: Earth-like planets, gentle landscapes
- **Features**: Gradual elevation changes, natural erosion patterns

### Type 2: Sharp Peaks

- **Characteristics**: Mountain ranges, sharp ridges
- **Usage**: Rocky planets, highland regions
- **Features**: Steep slopes, dramatic elevation changes

### Type 3: Sharp Valleys

- **Characteristics**: Canyons, river valleys, lava channels
- **Usage**: Volcanic planets, eroded landscapes
- **Features**: Deep cuts, channel-like formations

## Integration

### Rendering System

- Properties map directly to shader uniforms
- Color gradients drive height-based blending
- Material properties configure PBR rendering
- Terrain algorithms select generation methods

### Procedural Generation

- Noise parameters control surface detail
- Height thresholds define biome boundaries
- Terrain algorithms shape surface features

### Shader Implementation

- All properties become shader uniforms
- Fragment shaders use these for surface generation
- Real-time procedural surface calculation

## Performance Considerations

### Octave Count

- More octaves increase detail but reduce performance
- Balance detail with frame rate requirements
- Consider LOD-based octave reduction

### Shader Complexity

- Complex terrain algorithms are more expensive
- Bump mapping adds fragment shader cost
- Consider simplified versions for distant objects

## 🔗 Related

- [[PlanetProperties]] - Planet properties that use this interface
- [[PlanetType]] - Planet types that determine default surface properties
- [[@teskooano/celestials-terrestrial]] - Terrestrial planet rendering system
- [[@teskooano/systems-procedural-generation]] - Procedural generation system
