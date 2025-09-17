---
aliases: [AsteroidFieldProperties]
tags: [data, types, celestial, asteroids]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# AsteroidFieldProperties

Properties specific to asteroid fields with spatial boundaries, population density, and visual configuration.

## Overview

The `AsteroidFieldProperties` interface defines properties for asteroid field collections including spatial boundaries, asteroid population, composition, and visual rendering parameters. It supports various asteroid field types from main belt to Kuiper belt objects.

## Interface Definition

```typescript
export interface AsteroidFieldProperties extends SpecificPropertiesBase {
  type: CelestialType.ASTEROID_FIELD;
  innerRadiusAU: number;
  outerRadiusAU: number;
  heightAU: number;
  count: number;
  color: string;
  composition: string[];
  visualInnerRadius?: number;
  visualOuterRadius?: number;
  visualHeight?: number;
  visualDensity?: number;
  visualParticleColor?: string;
  texturePaths?: string[];
}
```

## Core Properties

### Classification

#### type

```typescript
type: CelestialType.ASTEROID_FIELD;
```

The fundamental type classification (always ASTEROID_FIELD).

### Spatial Boundaries

#### innerRadiusAU

```typescript
innerRadiusAU: number;
```

The inner radius boundary of the field (REAL AU units).

- **Type**: `number`
- **Required**: Yes
- **Units**: Astronomical Units (AU)
- **Usage**: Defines inner boundary of asteroid distribution

#### outerRadiusAU

```typescript
outerRadiusAU: number;
```

The outer radius boundary of the field (REAL AU units).

- **Type**: `number`
- **Required**: Yes
- **Units**: Astronomical Units (AU)
- **Usage**: Defines outer boundary of asteroid distribution

#### heightAU

```typescript
heightAU: number;
```

The vertical thickness or height of the asteroid field (REAL AU units).

- **Type**: `number`
- **Required**: Yes
- **Units**: Astronomical Units (AU)
- **Usage**: Defines vertical extent of asteroid distribution

### Population Properties

#### count

```typescript
count: number;
```

The approximate number of individual asteroids to represent or render within the field.

- **Type**: `number`
- **Required**: Yes
- **Usage**: Determines particle count for rendering

#### color

```typescript
color: string;
```

The base color tint for the asteroids in the field.

- **Type**: `string`
- **Required**: Yes
- **Format**: Hex color string
- **Usage**: Base color for asteroid rendering

#### composition

```typescript
composition: string[]
```

Array listing the primary chemical composition.

- **Type**: `string[]`
- **Required**: Yes
- **Examples**: `["iron", "silicates"]`, `["carbon", "organics"]`
- **Usage**: Material properties and color determination

### Visual Overrides

#### visualInnerRadius

```typescript
visualInnerRadius?: number
```

Optional visual override for inner radius.

- **Type**: `number`
- **Required**: No
- **Units**: Scaled units
- **Usage**: Visual representation different from physical boundary

#### visualOuterRadius

```typescript
visualOuterRadius?: number
```

Optional visual override for outer radius.

- **Type**: `number`
- **Required**: No
- **Units**: Scaled units
- **Usage**: Visual representation different from physical boundary

#### visualHeight

```typescript
visualHeight?: number
```

Optional visual override for height.

- **Type**: `number`
- **Required**: No
- **Units**: Scaled units
- **Usage**: Visual representation different from physical height

#### visualDensity

```typescript
visualDensity?: number
```

Optional visual density override.

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 to 1.0
- **Usage**: Visual particle density for rendering

#### visualParticleColor

```typescript
visualParticleColor?: string
```

Optional visual color override.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Visual particle color different from base color

### Texture Configuration

#### texturePaths

```typescript
texturePaths?: string[]
```

Optional array of texture paths for asteroid rendering.

- **Type**: `string[]`
- **Required**: No
- **Usage**: Custom textures for asteroid particles; fallback textures used if empty

## Usage Examples

### Main Asteroid Belt

```typescript
const mainBeltProperties: AsteroidFieldProperties = {
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 2.1,
  outerRadiusAU: 3.3,
  heightAU: 0.5,
  count: 50000,
  color: "#8B7355",
  composition: ["silicates", "iron", "nickel"],
  visualDensity: 0.3,
  visualParticleColor: "#A0522D",
  texturePaths: [
    "/textures/asteroid_rocky.jpg",
    "/textures/asteroid_metallic.jpg",
    "/textures/asteroid_carbonaceous.jpg",
  ],
};
```

### Kuiper Belt

```typescript
const kuiperBeltProperties: AsteroidFieldProperties = {
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 30.0,
  outerRadiusAU: 50.0,
  heightAU: 10.0,
  count: 100000,
  color: "#4682B4",
  composition: ["water ice", "methane", "ammonia", "organics"],
  visualDensity: 0.1,
  visualParticleColor: "#87CEEB",
  texturePaths: ["/textures/kuiper_ice.jpg", "/textures/kuiper_organic.jpg"],
};
```

### Trojan Asteroids

```typescript
const trojanProperties: AsteroidFieldProperties = {
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 5.0,
  outerRadiusAU: 5.4,
  heightAU: 0.3,
  count: 10000,
  color: "#696969",
  composition: ["dark silicates", "carbon", "organics"],
  visualDensity: 0.5,
  visualParticleColor: "#2F4F4F",
  texturePaths: [
    "/textures/trojan_dark.jpg",
    "/textures/trojan_carbonaceous.jpg",
  ],
};
```

### Scattered Disk

```typescript
const scatteredDiskProperties: AsteroidFieldProperties = {
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 35.0,
  outerRadiusAU: 100.0,
  heightAU: 20.0,
  count: 25000,
  color: "#B0C4DE",
  composition: ["water ice", "methane ice", "rock"],
  visualDensity: 0.05,
  visualParticleColor: "#E0E6F8",
  texturePaths: ["/textures/scattered_ice.jpg"],
};
```

### Near-Earth Asteroid Population

```typescript
const neaProperties: AsteroidFieldProperties = {
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 0.8,
  outerRadiusAU: 1.3,
  heightAU: 0.2,
  count: 5000,
  color: "#CD853F",
  composition: ["silicates", "metals", "organics"],
  visualDensity: 0.8,
  visualParticleColor: "#D2691E",
  texturePaths: ["/textures/nea_rocky.jpg", "/textures/nea_metallic.jpg"],
};
```

## Integration

### Rendering System

- Spatial boundaries define particle distribution
- `count` determines instanced mesh population
- `texturePaths` provide visual variety
- Visual overrides allow artistic control

### Physics System

- Individual asteroids typically don't affect gravity
- Field boundaries define collision zones
- Composition affects average density

### Procedural Generation

- Boundaries define generation space
- Composition influences individual asteroid properties
- Count determines population density

## Spatial Distribution

### Volume Calculation

```typescript
function calculateFieldVolume(props: AsteroidFieldProperties): number {
  const innerRadius = props.innerRadiusAU * 1.496e11; // Convert to meters
  const outerRadius = props.outerRadiusAU * 1.496e11;
  const height = props.heightAU * 1.496e11;

  // Cylindrical volume
  const innerVolume = Math.PI * innerRadius * innerRadius * height;
  const outerVolume = Math.PI * outerRadius * outerRadius * height;

  return outerVolume - innerVolume;
}
```

### Density Calculation

```typescript
function calculateAsteroidDensity(props: AsteroidFieldProperties): number {
  const volume = calculateFieldVolume(props);
  return props.count / volume; // Asteroids per cubic meter
}
```

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[@teskooano/celestials-asteroid-field]] - Asteroid field rendering system
