---
aliases: [GasGiantProperties]
tags: [data, types, celestial, gas-giants]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# GasGiantProperties

Properties specific to gas giant planets with atmospheric dynamics, ring systems, and emissive characteristics.

## Overview

The `GasGiantProperties` interface defines properties for gas giant planets including atmospheric composition and dynamics, cloud systems, ring configurations, and emissive properties. It supports all gas giant classes from Jupiter-like to hot Jupiters.

## Interface Definition

```typescript
export interface GasGiantProperties extends SpecificPropertiesBase {
  type: CelestialType.GAS_GIANT;
  classType: GasGiantClass;
  atmosphereColor: string;
  cloudColor: string;
  cloudSpeed: number;
  atmosphere?: {
    composition: string[];
    pressure: number;
    type?: AtmosphereType;
  };
  stormColor?: string;
  stormSpeed?: number;
  ringTilt?: { x?: number; y?: number; z?: number };
  axialTiltDeg?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  ringSystem?: RingSystemConfiguration;
  rings?: RingProperties[];
}
```

## Core Properties

### Classification

#### type

```typescript
type: CelestialType.GAS_GIANT;
```

The fundamental type classification (always GAS_GIANT).

#### classType

```typescript
classType: GasGiantClass;
```

The specific class of gas giant based on atmospheric properties.

- **Type**: `GasGiantClass`
- **Required**: Yes
- **Values**: `CLASS_I`, `CLASS_II`, `CLASS_III`, `CLASS_IV`, `CLASS_V`
- **Usage**: Determines atmospheric rendering and behavior

### Atmospheric Properties

#### atmosphereColor

```typescript
atmosphereColor: string;
```

Base color of the atmospheric layers.

- **Type**: `string`
- **Required**: Yes
- **Format**: Hex color string
- **Usage**: Primary atmospheric color for rendering

#### cloudColor

```typescript
cloudColor: string;
```

Color of the cloud layers and bands.

- **Type**: `string`
- **Required**: Yes
- **Format**: Hex color string
- **Usage**: Cloud layer rendering and atmospheric dynamics

#### cloudSpeed

```typescript
cloudSpeed: number;
```

Speed of cloud movement and atmospheric circulation.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 10.0+
- **Usage**: Animation speed for atmospheric dynamics

#### atmosphere

```typescript
atmosphere?: {
  composition: string[];
  pressure: number;
  type?: AtmosphereType;
}
```

Optional detailed atmospheric properties.

**Properties:**

- **composition**: Chemical composition of the atmosphere
- **pressure**: Atmospheric pressure relative to Earth
- **type**: Atmospheric density classification

### Storm Properties

#### stormColor

```typescript
stormColor?: string
```

Color of storm systems and atmospheric disturbances.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Storm rendering and atmospheric effects

#### stormSpeed

```typescript
stormSpeed?: number
```

Speed of storm movement and circulation.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 10.0+
- **Usage**: Storm animation and atmospheric dynamics

### Orientation Properties

#### ringTilt

```typescript
ringTilt?: { x?: number; y?: number; z?: number }
```

Tilt of ring systems relative to the planet's equator.

- **Type**: Object with optional x, y, z components
- **Required**: No
- **Units**: Radians
- **Usage**: Ring system orientation

#### axialTiltDeg

```typescript
axialTiltDeg?: number
```

Axial tilt of the gas giant in degrees.

- **Type**: `number`
- **Required**: No
- **Units**: Degrees
- **Usage**: Rotational axis orientation and seasonal effects

### Emissive Properties

#### emissiveColor

```typescript
emissiveColor?: string
```

Color of internal heat radiation.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Internal heat glow rendering

#### emissiveIntensity

```typescript
emissiveIntensity?: number
```

Intensity of internal heat radiation.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 2.0
- **Usage**: Internal heat glow intensity

### Ring Systems

#### ringSystem

```typescript
ringSystem?: RingSystemConfiguration
```

Enhanced ring system configuration.

- **Type**: `RingSystemConfiguration`
- **Required**: No
- **Usage**: Modern ring system definition with advanced features

#### rings

```typescript
rings?: RingProperties[]
```

Legacy rings property for backward compatibility.

- **Type**: `RingProperties[]`
- **Required**: No
- **Usage**: Backward compatibility with older ring definitions

## Usage Examples

### Jupiter-like Gas Giant (Class I)

```typescript
const jupiterProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_I,
  atmosphereColor: "#D8CA9D",
  cloudColor: "#FAD5A5",
  cloudSpeed: 0.5,
  atmosphere: {
    composition: ["hydrogen", "helium", "ammonia", "methane"],
    pressure: 1000.0, // Much denser than Earth
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#8B4513",
  stormSpeed: 0.8,
  axialTiltDeg: 3.13,
  emissiveColor: "#FF4500",
  emissiveIntensity: 0.1,
  ringSystem: {
    systemAxialInclination: 0.055, // 3.13 degrees
    inheritParentTilt: true,
    precessionRate: 0.00001,
    unifiedRendering: true,
    rings: [
      {
        innerRadius: 1.8,
        outerRadius: 2.5,
        density: 0.3,
        opacity: 0.4,
        color: "#8B7355",
        rotationRate: 0.05,
        texture: "jupiter_ring_dust",
        composition: ["dust", "rock fragments"],
        type: RockyType.DUST,
      },
    ],
  },
};
```

### Saturn-like Gas Giant (Class II)

```typescript
const saturnProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_II,
  atmosphereColor: "#FAD5A5",
  cloudColor: "#F5DEB3",
  cloudSpeed: 0.7,
  atmosphere: {
    composition: ["hydrogen", "helium", "water vapor", "ammonia"],
    pressure: 950.0,
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#DEB887",
  stormSpeed: 1.2,
  axialTiltDeg: 26.73,
  emissiveColor: "#FFB347",
  emissiveIntensity: 0.05,
  ringSystem: {
    systemAxialInclination: 0.467, // 26.73 degrees
    inheritParentTilt: true,
    precessionRate: 0.00002,
    unifiedRendering: true,
    rings: [
      {
        innerRadius: 1.2,
        outerRadius: 1.5,
        density: 0.9,
        opacity: 0.8,
        color: "#F5DEB3",
        rotationRate: 0.1,
        texture: "saturn_ring_ice",
        composition: ["water ice", "rock"],
        type: RockyType.ICE,
        segmentDensity: 80.0,
        segmentWidth: 0.95,
        particleDetail: 0.6,
      },
      {
        innerRadius: 1.5,
        outerRadius: 2.0,
        density: 0.6,
        opacity: 0.6,
        color: "#D2B48C",
        rotationRate: 0.08,
        texture: "saturn_ring_mixed",
        composition: ["ice", "dust", "rock"],
        type: RockyType.ICE_DUST,
        segmentDensity: 60.0,
        segmentWidth: 0.8,
        particleDetail: 0.4,
      },
    ],
  },
};
```

### Ice Giant (Class III)

```typescript
const neptuneProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_III,
  atmosphereColor: "#4169E1",
  cloudColor: "#87CEEB",
  cloudSpeed: 2.0, // Very fast winds
  atmosphere: {
    composition: ["hydrogen", "helium", "water", "methane", "ammonia"],
    pressure: 1200.0,
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#191970",
  stormSpeed: 3.0, // Extremely fast storms
  axialTiltDeg: 28.32,
  emissiveColor: "#4682B4",
  emissiveIntensity: 0.02, // Less internal heat
  ringSystem: {
    systemAxialInclination: 0.494, // 28.32 degrees
    inheritParentTilt: true,
    precessionRate: 0.00003,
    unifiedRendering: true,
    rings: [
      {
        innerRadius: 2.0,
        outerRadius: 2.8,
        density: 0.2,
        opacity: 0.3,
        color: "#2F4F4F",
        rotationRate: 0.03,
        texture: "neptune_ring_dark",
        composition: ["dark organics", "dust"],
        type: RockyType.DARK_ROCK,
      },
    ],
  },
};
```

### Hot Jupiter (Class IV)

```typescript
const hotJupiterProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_IV,
  atmosphereColor: "#FF6347",
  cloudColor: "#FF4500",
  cloudSpeed: 1.5,
  atmosphere: {
    composition: ["hydrogen", "helium", "sodium", "potassium"],
    pressure: 800.0,
    type: AtmosphereType.DENSE,
  },
  stormColor: "#DC143C",
  stormSpeed: 2.5,
  axialTiltDeg: 0.0, // Tidally locked
  emissiveColor: "#FF0000",
  emissiveIntensity: 0.3, // High internal heat
  // No rings due to extreme heat and proximity to star
};
```

### Super-Hot Jupiter (Class V)

```typescript
const superHotJupiterProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_V,
  atmosphereColor: "#FF0000",
  cloudColor: "#FF6600",
  cloudSpeed: 3.0,
  atmosphere: {
    composition: ["hydrogen", "helium", "silicate vapor", "iron vapor"],
    pressure: 500.0,
    type: AtmosphereType.DENSE,
  },
  stormColor: "#8B0000",
  stormSpeed: 4.0,
  axialTiltDeg: 0.0, // Tidally locked
  emissiveColor: "#FFFF00",
  emissiveIntensity: 0.8, // Very high internal heat
  // No rings due to extreme conditions
};
```

## Integration

### Rendering System

- `classType` determines atmospheric shader selection
- Color properties configure atmospheric rendering
- Ring systems enable ring rendering
- Emissive properties create internal glow effects

### Physics System

- Atmospheric properties affect atmospheric drag
- Ring systems affect gravitational dynamics
- Axial tilt influences rotational mechanics

### Atmospheric Dynamics

- Cloud and storm speeds drive animation
- Atmospheric composition affects visual appearance
- Pressure affects atmospheric scale height

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[GasGiantClass]] - Gas giant classification enumeration
- [[AtmosphereType]] - Atmospheric density types
- [[RingSystemConfiguration]] - Ring system configuration
- [[RingProperties]] - Individual ring properties
- [[@teskooano/celestials-gas-giants]] - Gas giant rendering system
