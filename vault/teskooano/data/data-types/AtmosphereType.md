---
aliases: [AtmosphereType]
tags: [data, types, celestial, atmosphere, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# AtmosphereType

Describes the general density of a celestial body's atmosphere for atmospheric modeling and rendering.

## Overview

The `AtmosphereType` enum provides a classification system for atmospheric density levels across different celestial bodies. It enables consistent atmospheric modeling and rendering effects based on atmospheric pressure and density characteristics.

## Enum Definition

```typescript
export enum AtmosphereType {
  NONE = "NONE",
  THIN = "THIN",
  NORMAL = "NORMAL",
  DENSE = "DENSE",
  VERY_DENSE = "VERY_DENSE",
}
```

## Atmosphere Types

### NONE

```typescript
NONE = "NONE";
```

No atmosphere.

**Characteristics:**

- **Pressure**: 0 Pa (vacuum)
- **Density**: 0 kg/m³
- **Visual Effects**: No atmospheric glow or scattering
- **Examples**: Moon, Mercury, most asteroids

**Rendering:**

- No atmospheric effects
- No edge glow
- Sharp horizon
- No atmospheric scattering

### THIN

```typescript
THIN = "THIN";
```

Very low pressure, minimal atmospheric effects.

**Characteristics:**

- **Pressure**: 0.01-1% of Earth's atmosphere
- **Density**: Very low
- **Visual Effects**: Minimal atmospheric glow
- **Examples**: Mars, Titan (relative to Earth)

**Rendering:**

- Subtle atmospheric glow
- Minimal scattering effects
- Slight horizon softening
- Reduced atmospheric thickness

### NORMAL

```typescript
NORMAL = "NORMAL";
```

Earth-like atmospheric pressure.

**Characteristics:**

- **Pressure**: 50-200% of Earth's atmosphere
- **Density**: Earth-like
- **Visual Effects**: Full atmospheric effects
- **Examples**: Earth, Venus (pressure-wise), habitable exoplanets

**Rendering:**

- Full atmospheric glow
- Rayleigh scattering
- Atmospheric perspective
- Complete horizon effects

### DENSE

```typescript
DENSE = "DENSE";
```

High pressure, significant atmospheric effects.

**Characteristics:**

- **Pressure**: 2-10x Earth's atmosphere
- **Density**: High
- **Visual Effects**: Strong atmospheric effects
- **Examples**: Venus, super-Earths with thick atmospheres

**Rendering:**

- Strong atmospheric glow
- Enhanced scattering
- Thick atmospheric layer
- Pronounced horizon effects

### VERY_DENSE

```typescript
VERY_DENSE = "VERY_DENSE";
```

A very dense atmosphere, potentially hazardous.

**Characteristics:**

- **Pressure**: 10x+ Earth's atmosphere
- **Density**: Very high
- **Visual Effects**: Extreme atmospheric effects
- **Examples**: Gas giants, super-dense exoplanet atmospheres

**Rendering:**

- Very strong atmospheric glow
- Extreme scattering effects
- Very thick atmospheric layer
- Complete atmospheric dominance

## Usage Examples

### Atmospheric Configuration

```typescript
function getAtmosphericProperties(type: AtmosphereType): {
  pressure: number;
  glowIntensity: number;
  scatteringStrength: number;
  thickness: number;
} {
  switch (type) {
    case AtmosphereType.NONE:
      return {
        pressure: 0,
        glowIntensity: 0,
        scatteringStrength: 0,
        thickness: 0,
      };

    case AtmosphereType.THIN:
      return {
        pressure: 0.006, // Mars-like (0.6% of Earth)
        glowIntensity: 0.1,
        scatteringStrength: 0.2,
        thickness: 0.02,
      };

    case AtmosphereType.NORMAL:
      return {
        pressure: 1.0, // Earth-like
        glowIntensity: 0.3,
        scatteringStrength: 1.0,
        thickness: 0.1,
      };

    case AtmosphereType.DENSE:
      return {
        pressure: 5.0, // 5x Earth pressure
        glowIntensity: 0.5,
        scatteringStrength: 2.0,
        thickness: 0.15,
      };

    case AtmosphereType.VERY_DENSE:
      return {
        pressure: 50.0, // Gas giant levels
        glowIntensity: 0.8,
        scatteringStrength: 5.0,
        thickness: 0.3,
      };
  }
}
```

### Planet Type Integration

```typescript
function getDefaultAtmosphereType(planetType: PlanetType): AtmosphereType {
  switch (planetType) {
    case PlanetType.TERRESTRIAL:
      return AtmosphereType.NORMAL;

    case PlanetType.OCEAN:
      return AtmosphereType.NORMAL;

    case PlanetType.DESERT:
      return AtmosphereType.THIN;

    case PlanetType.LAVA:
      return AtmosphereType.DENSE; // Volcanic outgassing

    case PlanetType.ICE:
      return AtmosphereType.THIN; // Sublimation atmosphere

    case PlanetType.ROCKY:
      return AtmosphereType.THIN;

    case PlanetType.BARREN:
    default:
      return AtmosphereType.NONE;
  }
}
```

### Gas Giant Integration

```typescript
function getGasGiantAtmosphereType(
  gasGiantClass: GasGiantClass,
): AtmosphereType {
  // Gas giants always have very dense atmospheres
  return AtmosphereType.VERY_DENSE;
}
```

### Atmospheric Effects

```typescript
function calculateAtmosphericEffects(
  type: AtmosphereType,
  planetRadius: number,
  stellarDistance: number,
): {
  scaleHeight: number;
  opticalDepth: number;
  escapeVelocity: number;
} {
  const properties = getAtmosphericProperties(type);

  const scaleHeight = planetRadius * 0.1 * properties.thickness;
  const opticalDepth = properties.scatteringStrength * properties.pressure;
  const escapeVelocity =
    Math.sqrt(2 * 9.81 * planetRadius) * Math.sqrt(properties.pressure);

  return {
    scaleHeight,
    opticalDepth,
    escapeVelocity,
  };
}
```

## Integration

### Rendering System

- Determines atmospheric shader selection
- Controls atmospheric glow intensity
- Affects scattering calculations
- Influences atmospheric thickness

### Physics System

- Affects atmospheric drag calculations
- Influences escape velocity
- Determines atmospheric scale height
- Controls atmospheric loss rates

### Procedural Generation

- Guides atmospheric property generation
- Affects planet habitability calculations
- Influences atmospheric composition

## 🔗 Related

- [[PlanetProperties]] - Planet properties that use atmospheric types
- [[GasGiantProperties]] - Gas giant properties with atmospheric data
- [[PlanetAtmosphereProperties]] - Detailed atmospheric properties
- [[PlanetType]] - Planet types that determine default atmosphere types
- [[@teskooano/celestials-terrestrial]] - Planet rendering with atmospheric effects
