---
aliases: [CometProperties]
tags: [data, types, celestial, comets]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# CometProperties

Properties specific to comets with orbital classification, composition, activity levels, and visual effects configuration.

## Overview

The `CometProperties` interface defines properties for comets including orbital classification, chemical composition, outgassing activity, and visual effects for coma and tail rendering. It supports all comet classes from short-period to interstellar comets.

## Interface Definition

```typescript
export interface CometProperties extends SpecificPropertiesBase {
  type: CelestialType.COMET;
  discoveredDate?: string;
  classType: CometClass;
  composition: string[];
  colors: string[];
  heights: number[];
  activity: number;
  visualComaRadius?: number;
  visualComaColor?: string;
  visualComaOpacity?: number;
  visualMaxTailLength?: number;
  visualTailColor?: string;
  visualTailOpacity?: number;
  visuals?: CometVisualParams;
}
```

## Core Properties

### Classification

#### type

```typescript
type: CelestialType.COMET;
```

The fundamental type classification (always COMET).

#### discoveredDate

```typescript
discoveredDate?: string
```

The date the comet was discovered.

- **Type**: `string`
- **Required**: No
- **Format**: ISO date string or descriptive date
- **Usage**: Historical information and cataloging

#### classType

```typescript
classType: CometClass;
```

The orbital classification of the comet.

- **Type**: `CometClass`
- **Required**: Yes
- **Values**: `INTERSTELLAR`, `LONG_PERIOD`, `SHORT_PERIOD`
- **Usage**: Orbital behavior and origin determination

### Composition

#### composition

```typescript
composition: string[]
```

Array listing the primary chemical components.

- **Type**: `string[]`
- **Required**: Yes
- **Examples**: `["water ice", "CO2"]`, `["ammonia", "methane", "dust"]`
- **Usage**: Material properties and outgassing behavior

#### colors

```typescript
colors: string[]
```

An array of up to 4 colors for the comet's procedural texture.

- **Type**: `string[]`
- **Required**: Yes
- **Length**: Up to 4 colors
- **Format**: Hex color strings
- **Usage**: Procedural surface generation

#### heights

```typescript
heights: number[]
```

An array of height thresholds (0-1) corresponding to each color.

- **Type**: `number[]`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Length**: Must match colors array length
- **Usage**: Height-based color blending

### Activity Properties

#### activity

```typescript
activity: number;
```

A measure of the comet's outgassing activity, affecting tail and coma visibility.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 (extinct) to 1.0 (highly active)
- **Usage**: Coma and tail intensity calculations

### Visual Effects

#### visualComaRadius

```typescript
visualComaRadius?: number
```

Visual radius of the coma (in scaled units).

- **Type**: `number`
- **Required**: No
- **Units**: Scaled units
- **Usage**: Coma size for rendering

#### visualComaColor

```typescript
visualComaColor?: string
```

Color of the coma.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Coma color for rendering

#### visualComaOpacity

```typescript
visualComaOpacity?: number
```

Opacity of the coma.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Usage**: Coma transparency

#### visualMaxTailLength

```typescript
visualMaxTailLength?: number
```

Optional visual maximum length of the comet's tail (in scaled units).

- **Type**: `number`
- **Required**: No
- **Units**: Scaled units
- **Usage**: Tail length for rendering

#### visualTailColor

```typescript
visualTailColor?: string
```

Color of the comet's tail.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Tail color for rendering

#### visualTailOpacity

```typescript
visualTailOpacity?: number
```

Opacity of the tail.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Usage**: Tail transparency

### Visual Parameters

#### visuals

```typescript
visuals?: CometVisualParams
```

Optional container for detailed visual parameters of the nucleus shader.

```typescript
interface CometVisualParams {
  noiseScale?: number;
  blendSharpness?: number;
  craterScale?: number;
  craterStrength?: number;
  simplePeriod?: number;
  undulation?: number;
  ambientStrength?: number;
  metallicFactor?: number;
  roughness?: number;
  specularColor?: THREE.Color;
}
```

**Properties:**

- **noiseScale**: Scale for surface noise generation
- **blendSharpness**: Sharpness of color transitions
- **craterScale**: Scale for crater generation
- **craterStrength**: Intensity of crater effects
- **simplePeriod**: Base frequency for noise
- **undulation**: Surface waviness
- **ambientStrength**: Ambient lighting intensity
- **metallicFactor**: Metallic appearance factor
- **roughness**: Surface roughness
- **specularColor**: Specular highlight color

## Usage Examples

### Halley's Comet (Short-Period)

```typescript
const halleyProperties: CometProperties = {
  type: CelestialType.COMET,
  discoveredDate: "1758-01-01",
  classType: CometClass.SHORT_PERIOD,
  composition: ["water ice", "CO2", "ammonia", "methane"],
  colors: ["#8B4513", "#A0522D", "#D2691E", "#CD853F"],
  heights: [0.0, 0.3, 0.6, 1.0],
  activity: 0.8,
  visualComaRadius: 100000,
  visualComaColor: "#87CEEB",
  visualComaOpacity: 0.6,
  visualMaxTailLength: 1000000,
  visualTailColor: "#FFFFFF",
  visualTailOpacity: 0.4,
  visuals: {
    noiseScale: 2.0,
    blendSharpness: 0.8,
    craterScale: 1.5,
    craterStrength: 0.6,
    simplePeriod: 3.0,
    undulation: 0.3,
    ambientStrength: 0.2,
    metallicFactor: 0.1,
    roughness: 0.9,
    specularColor: new THREE.Color("#DDDDDD"),
  },
};
```

### Hale-Bopp (Long-Period)

```typescript
const haleBoppProperties: CometProperties = {
  type: CelestialType.COMET,
  discoveredDate: "1995-07-23",
  classType: CometClass.LONG_PERIOD,
  composition: ["water ice", "CO", "CO2", "dust", "organics"],
  colors: ["#696969", "#808080", "#A9A9A9", "#D3D3D3"],
  heights: [0.0, 0.25, 0.5, 1.0],
  activity: 0.9,
  visualComaRadius: 200000,
  visualComaColor: "#B0C4DE",
  visualComaOpacity: 0.7,
  visualMaxTailLength: 2000000,
  visualTailColor: "#E6E6FA",
  visualTailOpacity: 0.5,
  visuals: {
    noiseScale: 1.8,
    blendSharpness: 0.6,
    craterScale: 1.2,
    craterStrength: 0.4,
    simplePeriod: 4.0,
    undulation: 0.2,
    ambientStrength: 0.15,
    metallicFactor: 0.05,
    roughness: 0.95,
  },
};
```

### Interstellar Comet

```typescript
const interstellarProperties: CometProperties = {
  type: CelestialType.COMET,
  discoveredDate: "2019-08-30",
  classType: CometClass.INTERSTELLAR,
  composition: ["exotic ices", "organic compounds", "silicates"],
  colors: ["#2F4F4F", "#556B2F", "#8B7D6B", "#BC8F8F"],
  heights: [0.0, 0.4, 0.7, 1.0],
  activity: 0.3, // Lower activity due to different composition
  visualComaRadius: 50000,
  visualComaColor: "#708090",
  visualComaOpacity: 0.4,
  visualMaxTailLength: 500000,
  visualTailColor: "#C0C0C0",
  visualTailOpacity: 0.3,
  visuals: {
    noiseScale: 2.5,
    blendSharpness: 1.0,
    craterScale: 2.0,
    craterStrength: 0.8,
    simplePeriod: 2.5,
    undulation: 0.4,
    ambientStrength: 0.1,
    metallicFactor: 0.3,
    roughness: 0.8,
  },
};
```

### Extinct Comet

```typescript
const extinctCometProperties: CometProperties = {
  type: CelestialType.COMET,
  classType: CometClass.SHORT_PERIOD,
  composition: ["depleted ice", "dust", "rock"],
  colors: ["#2F2F2F", "#404040", "#696969", "#808080"],
  heights: [0.0, 0.3, 0.6, 1.0],
  activity: 0.0, // No outgassing
  // No coma or tail properties (extinct)
  visuals: {
    noiseScale: 1.0,
    blendSharpness: 0.4,
    craterScale: 3.0,
    craterStrength: 1.0,
    simplePeriod: 2.0,
    undulation: 0.5,
    ambientStrength: 0.3,
    metallicFactor: 0.2,
    roughness: 1.0,
  },
};
```

## Integration

### Rendering System

- `classType` determines comet behavior and appearance
- `colors` and `heights` drive procedural surface generation
- Visual properties configure coma and tail effects
- `visuals` parameters control nucleus shader

### Physics System

- `activity` affects outgassing forces
- Composition influences density calculations
- Orbital classification affects dynamics

### Activity Modeling

- `activity` level determines coma and tail visibility
- Distance from star affects activity levels
- Composition determines outgassing rates

## Activity-Distance Relationship

```typescript
function calculateCometActivity(
  baseActivity: number,
  distanceFromStar: number,
  stellarLuminosity: number = 1.0,
): number {
  // Activity increases as comet approaches star
  const heliocentric_AU = distanceFromStar / 1.496e11;

  // Activity falloff with distance (inverse square-ish)
  const distanceFactor = Math.min(
    1.0,
    stellarLuminosity / (heliocentric_AU * heliocentric_AU),
  );

  // Apply base activity level
  return Math.min(1.0, baseActivity * distanceFactor);
}
```

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[CometClass]] - Comet classification enumeration
- [[@teskooano/celestials-comet]] - Comet rendering system
