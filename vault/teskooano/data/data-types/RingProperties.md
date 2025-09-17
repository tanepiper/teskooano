---
aliases: [RingProperties]
tags: [data, types, celestial, rings]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# RingProperties

Properties defining a single planetary ring or a segment of a ring system with advanced axial inclination control and accretion disk support.

## Overview

The `RingProperties` interface represents the properties defining a single planetary ring or a segment of a ring system. It includes geometric properties, visual characteristics, composition data, and advanced features like axial inclination control and accretion disk support.

## Interface Definition

```typescript
export interface RingProperties {
  innerRadius: number;
  outerRadius: number;
  density: number;
  opacity: number;
  color: string;
  rotationRate: number;
  texture: string;
  composition: string[];
  type: RockyType;

  // Enhanced Axial Inclination Control
  axialInclination?: number;
  ringTilt?: number;
  inheritParentTilt?: boolean;

  // Accretion Disk Specific Properties
  isAccretionDisk?: boolean;
  temperature?: number;
  accretionRate?: number;
  emissionType?: "thermal" | "synchrotron" | "mixed";
  isRelativistic?: boolean;
  innerEdgeRadius?: number;

  // Ring Segmentation Controls
  segmentDensity?: number;
  segmentWidth?: number;
  particleDetail?: number;
  densityVariation?: number;
}
```

## Geometric Properties

### innerRadius

```typescript
innerRadius: number;
```

The inner boundary radius of the ring (SCALED relative to parent's center).

- **Type**: `number`
- **Required**: Yes
- **Units**: Scaled units relative to parent radius
- **Usage**: Defines inner edge of ring

### outerRadius

```typescript
outerRadius: number;
```

The outer boundary radius of the ring (SCALED relative to parent's center).

- **Type**: `number`
- **Required**: Yes
- **Units**: Scaled units relative to parent radius
- **Usage**: Defines outer edge of ring

### density

```typescript
density: number;
```

The density of particles within the ring, affecting visual appearance.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 to 1.0
- **Usage**: Particle density for rendering

### opacity

```typescript
opacity: number;
```

The opacity of the ring.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0 (transparent) to 1.0 (opaque)
- **Usage**: Ring transparency

## Visual Properties

### color

```typescript
color: string;
```

The base color tint of the ring particles.

- **Type**: `string`
- **Required**: Yes
- **Format**: Hex color string
- **Usage**: Base color for ring rendering

### rotationRate

```typescript
rotationRate: number;
```

The rate at which the ring particles orbit the parent body.

- **Type**: `number`
- **Required**: Yes
- **Units**: Radians per second
- **Usage**: Ring rotation animation

### texture

```typescript
texture: string;
```

Identifier or path for the texture used to render the ring.

- **Type**: `string`
- **Required**: Yes
- **Usage**: Texture mapping for ring particles

### composition

```typescript
composition: string[]
```

Array listing the main composition of the ring particles.

- **Type**: `string[]`
- **Required**: Yes
- **Examples**: `["ice", "rock"]`, `["dust", "organics"]`
- **Usage**: Material properties and color determination

### type

```typescript
type: RockyType;
```

The dominant type of rocky material composing the ring particles.

- **Type**: `RockyType`
- **Required**: Yes
- **Values**: `ICE`, `METALLIC`, `LIGHT_ROCK`, `DARK_ROCK`, `ICE_DUST`, `DUST`
- **Usage**: Material behavior and visual properties

## Axial Inclination Control

### axialInclination

```typescript
axialInclination?: number
```

Axial inclination of the ring system relative to the parent's equatorial plane.

- **Type**: `number`
- **Required**: No
- **Units**: Radians
- **Usage**: Controls the overall tilt of the ring system

### ringTilt

```typescript
ringTilt?: number
```

Individual ring tilt relative to the ring system's plane.

- **Type**: `number`
- **Required**: No
- **Units**: Radians
- **Usage**: Allows for warped or tilted individual rings

### inheritParentTilt

```typescript
inheritParentTilt?: boolean
```

Whether this ring should inherit the parent body's axial tilt.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: Determines if ring follows parent's axial tilt

## Accretion Disk Properties

### isAccretionDisk

```typescript
isAccretionDisk?: boolean
```

Whether this ring represents an accretion disk.

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: Affects rendering and physics behavior

### temperature

```typescript
temperature?: number
```

Temperature of the accretion disk material in Kelvin.

- **Type**: `number`
- **Required**: No
- **Units**: Kelvin
- **Usage**: Emission calculations for accretion disks

### accretionRate

```typescript
accretionRate?: number
```

Accretion rate in solar masses per year.

- **Type**: `number`
- **Required**: No
- **Units**: Solar masses per year
- **Usage**: Luminosity calculations for accretion disks

### emissionType

```typescript
emissionType?: "thermal" | "synchrotron" | "mixed"
```

Type of emission from the accretion disk.

- **Type**: String literal union
- **Required**: No
- **Values**:
  - `"thermal"` - Thermal emission from heated material
  - `"synchrotron"` - Synchrotron radiation from magnetic fields
  - `"mixed"` - Combination of thermal and synchrotron
- **Usage**: Emission spectrum and color calculation

### isRelativistic

```typescript
isRelativistic?: boolean
```

Whether the disk has relativistic effects (for black holes).

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: Enables relativistic rendering effects

### innerEdgeRadius

```typescript
innerEdgeRadius?: number
```

Inner edge of the accretion disk (in gravitational radii for black holes).

- **Type**: `number`
- **Required**: No
- **Units**: Gravitational radii
- **Usage**: Innermost stable circular orbit for accretion disks

## Ring Segmentation Controls

### segmentDensity

```typescript
segmentDensity?: number
```

Number of segments per ring for enhanced visual detail.

- **Type**: `number`
- **Required**: No
- **Default**: 50.0
- **Usage**: Visual detail level for ring rendering

### segmentWidth

```typescript
segmentWidth?: number
```

Width of each segment.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Default**: 0.8
- **Usage**: Segment size for ring rendering

### particleDetail

```typescript
particleDetail?: number
```

Intensity of particle detail within segments.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Default**: 0.3
- **Usage**: Particle detail level

### densityVariation

```typescript
densityVariation?: number
```

Intensity of density variations within segments.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Default**: 0.4
- **Usage**: Density variation for realistic appearance

## Usage Examples

### Saturn's A Ring

```typescript
const saturnARing: RingProperties = {
  innerRadius: 2.02,
  outerRadius: 2.27,
  density: 0.9,
  opacity: 0.8,
  color: "#F5DEB3",
  rotationRate: 0.1,
  texture: "saturn_a_ring",
  composition: ["water ice", "rock fragments"],
  type: RockyType.ICE,
  axialInclination: 0.467, // 26.73 degrees
  inheritParentTilt: true,
  segmentDensity: 100.0,
  segmentWidth: 0.95,
  particleDetail: 0.8,
  densityVariation: 0.2,
};
```

### Saturn's B Ring

```typescript
const saturnBRing: RingProperties = {
  innerRadius: 1.53,
  outerRadius: 2.02,
  density: 1.0, // Densest ring
  opacity: 0.95,
  color: "#FFFACD",
  rotationRate: 0.12,
  texture: "saturn_b_ring",
  composition: ["water ice", "silicates"],
  type: RockyType.ICE,
  axialInclination: 0.467,
  inheritParentTilt: true,
  segmentDensity: 120.0,
  segmentWidth: 0.98,
  particleDetail: 0.9,
  densityVariation: 0.1,
};
```

### Uranus's Epsilon Ring

```typescript
const uranusEpsilonRing: RingProperties = {
  innerRadius: 1.95,
  outerRadius: 2.01,
  density: 0.7,
  opacity: 0.6,
  color: "#2F4F4F",
  rotationRate: 0.05,
  texture: "uranus_epsilon_ring",
  composition: ["dark organics", "dust"],
  type: RockyType.DARK_ROCK,
  axialInclination: 1.706, // 97.77 degrees (extreme tilt)
  inheritParentTilt: true,
  segmentDensity: 40.0,
  segmentWidth: 0.6,
  particleDetail: 0.3,
  densityVariation: 0.6,
};
```

### Black Hole Accretion Disk

```typescript
const accretionDisk: RingProperties = {
  innerRadius: 3.0, // 3 Schwarzschild radii
  outerRadius: 20.0,
  density: 0.8,
  opacity: 0.9,
  color: "#FF4500",
  rotationRate: 10.0, // Very fast rotation
  texture: "accretion_disk",
  composition: ["ionized gas", "plasma"],
  type: RockyType.DUST,

  // Accretion disk specific
  isAccretionDisk: true,
  temperature: 100000, // Very hot
  accretionRate: 0.1, // 0.1 solar masses per year
  emissionType: "mixed",
  isRelativistic: true,
  innerEdgeRadius: 3.0, // Innermost stable circular orbit

  // No axial tilt inheritance for accretion disks
  inheritParentTilt: false,
  axialInclination: 0.0,

  segmentDensity: 200.0, // High detail for accretion disk
  segmentWidth: 0.99,
  particleDetail: 1.0,
  densityVariation: 0.8,
};
```

### Debris Ring

```typescript
const debrisRing: RingProperties = {
  innerRadius: 1.1,
  outerRadius: 1.3,
  density: 0.3,
  opacity: 0.4,
  color: "#A0522D",
  rotationRate: 0.08,
  texture: "debris_ring",
  composition: ["rock fragments", "dust", "metal"],
  type: RockyType.LIGHT_ROCK,
  axialInclination: 0.0,
  ringTilt: 0.087, // 5 degrees individual tilt
  inheritParentTilt: true,
  segmentDensity: 30.0,
  segmentWidth: 0.7,
  particleDetail: 0.2,
  densityVariation: 0.7,
};
```

## Integration

### Rendering System

- Geometric properties define ring geometry
- Visual properties configure appearance
- Segmentation controls enhance detail
- Accretion disk properties enable special effects

### Physics System

- Ring particles follow orbital mechanics
- Accretion disks have complex dynamics
- Relativistic effects for black hole disks

### Parent Body Integration

- `inheritParentTilt` links to parent orientation
- `axialInclination` relative to parent equator
- Ring dynamics follow parent gravity

## Performance Considerations

### Segmentation

- Higher `segmentDensity` increases visual quality but reduces performance
- `particleDetail` affects particle rendering complexity
- Balance detail with performance requirements

### Texture Usage

- Multiple texture paths provide variety
- Texture resolution affects memory usage
- Consider texture atlasing for performance

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[RingSystemConfiguration]] - Ring system configuration
- [[RockyType]] - Ring particle type enumeration
- [[@teskooano/celestials-rings]] - Ring rendering system
