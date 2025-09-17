---
aliases: [StellarType]
tags: [data, types, celestial, stars, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# StellarType

Classification of stars based on their spectral characteristics and evolutionary stage representing actual astrophysical types.

## Overview

The `StellarType` enum provides a comprehensive classification system for stars based on stellar evolution theory. It represents the actual astrophysical type of stars, covering their entire lifecycle from formation to final remnants.

## Enum Definition

```typescript
export enum StellarType {
  MAIN_SEQUENCE = "MAIN_SEQUENCE",
  PROTOSTAR = "PROTOSTAR",
  PRE_MAIN_SEQUENCE = "PRE_MAIN_SEQUENCE",

  // Mature Stars - Post-Main Sequence Evolution
  SUBGIANT = "SUBGIANT",
  RED_GIANT = "RED_GIANT",
  HORIZONTAL_BRANCH = "HORIZONTAL_BRANCH",
  ASYMPTOTIC_GIANT_BRANCH = "ASYMPTOTIC_GIANT_BRANCH",
  POST_AGB = "POST_AGB",
  SUPERGIANT = "SUPERGIANT",

  // Special Types
  WOLF_RAYET = "WOLF_RAYET",
  HYPERGIANT = "HYPERGIANT",

  // Stellar Remnants
  WHITE_DWARF = "WHITE_DWARF",
  NEUTRON_STAR = "NEUTRON_STAR",
  BLACK_HOLE = "BLACK_HOLE",
}
```

## Stellar Evolution Stages

### Young Stars

#### PROTOSTAR

```typescript
PROTOSTAR = "PROTOSTAR";
```

Young stars still forming and accreting material (not yet optically visible).

**Characteristics:**

- Still accreting material from surrounding disk
- Core temperature insufficient for hydrogen fusion
- Embedded in dusty envelope
- Infrared emission dominant

**Duration:** ~10⁶ years
**Mass Range:** 0.1 - 100+ solar masses
**Temperature:** 1000 - 3000K

#### PRE_MAIN_SEQUENCE

```typescript
PRE_MAIN_SEQUENCE = "PRE_MAIN_SEQUENCE";
```

Pre-main sequence stars that have become optically visible but haven't started hydrogen fusion.

**Characteristics:**

- Optically visible
- Contracting toward main sequence
- Variable luminosity
- Strong stellar winds

**Duration:** ~10⁷ years
**Examples:** T Tauri stars, Herbig Ae/Be stars

### Main Sequence

#### MAIN_SEQUENCE

```typescript
MAIN_SEQUENCE = "MAIN_SEQUENCE";
```

Stars fusing hydrogen in their core, like the Sun.

**Characteristics:**

- Stable hydrogen fusion in core
- Hydrostatic equilibrium
- Long-lived stable phase
- Spectral classes O, B, A, F, G, K, M

**Duration:** 10⁷ - 10¹² years (mass dependent)
**Examples:** Sun, Proxima Centauri, Sirius

### Post-Main Sequence Evolution

#### SUBGIANT

```typescript
SUBGIANT = "SUBGIANT";
```

Stars that have exhausted hydrogen in their core and are fusing hydrogen in a shell.

**Characteristics:**

- Hydrogen shell burning
- Expanding and cooling
- Transition to giant phase
- Increased luminosity

**Duration:** ~10⁸ years
**Examples:** Procyon A

#### RED_GIANT

```typescript
RED_GIANT = "RED_GIANT";
```

Large, cool stars with hydrogen shell burning and convective envelopes.

**Characteristics:**

- Large radius (10-100 solar radii)
- Cool surface temperature
- High luminosity
- Convective envelope

**Duration:** ~10⁸ years
**Examples:** Arcturus, Aldebaran

#### HORIZONTAL_BRANCH

```typescript
HORIZONTAL_BRANCH = "HORIZONTAL_BRANCH";
```

Stars with helium core burning, contracted from red giant phase.

**Characteristics:**

- Helium fusion in core
- Hydrogen shell burning
- Smaller than red giants
- Blue or red depending on mass loss

**Duration:** ~10⁸ years
**Examples:** RR Lyrae variables

#### ASYMPTOTIC_GIANT_BRANCH

```typescript
ASYMPTOTIC_GIANT_BRANCH = "ASYMPTOTIC_GIANT_BRANCH";
```

Stars with carbon/oxygen core and helium/hydrogen shell burning.

**Characteristics:**

- Double shell burning
- Thermal pulses
- Mass loss via stellar winds
- Carbon/oxygen core formation

**Duration:** ~10⁶ years
**Examples:** Mira variables

#### POST_AGB

```typescript
POST_AGB = "POST_AGB";
```

Hot central stars of planetary nebulae, contracted from AGB phase.

**Characteristics:**

- Very hot surface (30,000-200,000K)
- Small radius
- Ionizes surrounding nebula
- Evolving toward white dwarf

**Duration:** ~10⁴ years
**Examples:** Central stars of planetary nebulae

### Massive Star Evolution

#### SUPERGIANT

```typescript
SUPERGIANT = "SUPERGIANT";
```

Massive, luminous stars in advanced fusion stages with strong stellar winds.

**Characteristics:**

- Very large radius (100-1000 solar radii)
- High luminosity (10⁴-10⁶ solar luminosities)
- Advanced nuclear burning
- Strong mass loss

**Duration:** ~10⁶ years
**Examples:** Betelgeuse, Rigel, Antares

#### WOLF_RAYET

```typescript
WOLF_RAYET = "WOLF_RAYET";
```

Massive, hot star losing mass via strong stellar winds.

**Characteristics:**

- Very hot (30,000-200,000K)
- Strong stellar winds
- Exposed helium/carbon/oxygen layers
- Broad emission lines

**Duration:** ~10⁵ years
**Examples:** WR 104, WR 136

#### HYPERGIANT

```typescript
HYPERGIANT = "HYPERGIANT";
```

Very large, luminous evolved stars.

**Characteristics:**

- Extremely large (1000+ solar radii)
- Very high luminosity (10⁶+ solar luminosities)
- Unstable and variable
- Rare and short-lived

**Duration:** ~10⁴ years
**Examples:** VY Canis Majoris, UY Scuti

### Stellar Remnants

#### WHITE_DWARF

```typescript
WHITE_DWARF = "WHITE_DWARF";
```

Dense remnant of a low-to-medium mass star.

**Characteristics:**

- Earth-sized but stellar mass
- No nuclear fusion
- Cooling over billions of years
- Electron degeneracy pressure support

**Lifetime:** ~10¹⁰ years (cooling time)
**Mass Range:** 0.17 - 1.4 solar masses
**Examples:** Sirius B, Procyon B

#### NEUTRON_STAR

```typescript
NEUTRON_STAR = "NEUTRON_STAR";
```

Extremely dense remnant of a massive star's supernova.

**Characteristics:**

- City-sized but 1-2 solar masses
- Neutron degeneracy pressure
- Extreme magnetic fields
- May be pulsars or magnetars

**Mass Range:** 1.4 - 3.0 solar masses
**Radius:** ~10-15 km
**Examples:** Crab Pulsar, Vela Pulsar

#### BLACK_HOLE

```typescript
BLACK_HOLE = "BLACK_HOLE";
```

Region of spacetime where gravity is so strong nothing can escape.

**Characteristics:**

- Event horizon
- Spacetime curvature
- Hawking radiation
- Gravitational lensing

**Mass Range:** 3+ solar masses
**Types:** Stellar, intermediate, supermassive
**Examples:** Cygnus X-1, Sagittarius A\*

## Usage Examples

### Stellar Evolution Sequence

```typescript
function getEvolutionSequence(initialMass: number): StellarType[] {
  if (initialMass < 0.5) {
    // Low mass stars
    return [
      StellarType.PROTOSTAR,
      StellarType.PRE_MAIN_SEQUENCE,
      StellarType.MAIN_SEQUENCE,
      StellarType.RED_GIANT,
      StellarType.WHITE_DWARF,
    ];
  } else if (initialMass < 8.0) {
    // Solar mass stars
    return [
      StellarType.PROTOSTAR,
      StellarType.PRE_MAIN_SEQUENCE,
      StellarType.MAIN_SEQUENCE,
      StellarType.SUBGIANT,
      StellarType.RED_GIANT,
      StellarType.HORIZONTAL_BRANCH,
      StellarType.ASYMPTOTIC_GIANT_BRANCH,
      StellarType.POST_AGB,
      StellarType.WHITE_DWARF,
    ];
  } else if (initialMass < 25.0) {
    // Massive stars
    return [
      StellarType.PROTOSTAR,
      StellarType.PRE_MAIN_SEQUENCE,
      StellarType.MAIN_SEQUENCE,
      StellarType.SUPERGIANT,
      StellarType.NEUTRON_STAR,
    ];
  } else {
    // Very massive stars
    return [
      StellarType.PROTOSTAR,
      StellarType.PRE_MAIN_SEQUENCE,
      StellarType.MAIN_SEQUENCE,
      StellarType.SUPERGIANT,
      StellarType.WOLF_RAYET,
      StellarType.BLACK_HOLE,
    ];
  }
}
```

### Renderer Selection

```typescript
function selectStarRenderer(stellarType: StellarType): string {
  switch (stellarType) {
    case StellarType.MAIN_SEQUENCE:
    case StellarType.PRE_MAIN_SEQUENCE:
    case StellarType.PROTOSTAR:
      return "MainSequenceStarRenderer";

    case StellarType.SUBGIANT:
      return "SubgiantRenderer";

    case StellarType.RED_GIANT:
      return "RedGiantRenderer";

    case StellarType.HORIZONTAL_BRANCH:
      return "HorizontalBranchRenderer";

    case StellarType.ASYMPTOTIC_GIANT_BRANCH:
      return "AGBRenderer";

    case StellarType.POST_AGB:
      return "PostAGBRenderer";

    case StellarType.SUPERGIANT:
      return "SupergiantRenderer";

    case StellarType.WOLF_RAYET:
      return "WolfRayetRenderer";

    case StellarType.HYPERGIANT:
      return "HypergiantRenderer";

    case StellarType.WHITE_DWARF:
      return "WhiteDwarfRenderer";

    case StellarType.NEUTRON_STAR:
      return "NeutronStarRenderer";

    case StellarType.BLACK_HOLE:
      return "BlackHoleRenderer";

    default:
      return "DefaultStarRenderer";
  }
}
```

### Lifetime Calculation

```typescript
function calculateStellarLifetime(
  mass: number,
  stellarType: StellarType,
): number {
  // Lifetime in years
  switch (stellarType) {
    case StellarType.MAIN_SEQUENCE:
      // Main sequence lifetime scales as M^-2.5
      return 10e9 * Math.pow(mass, -2.5);

    case StellarType.RED_GIANT:
      return 1e8; // ~100 million years

    case StellarType.SUPERGIANT:
      return 1e6; // ~1 million years

    case StellarType.WOLF_RAYET:
      return 1e5; // ~100,000 years

    case StellarType.WHITE_DWARF:
      return 1e10; // ~10 billion years (cooling time)

    case StellarType.NEUTRON_STAR:
    case StellarType.BLACK_HOLE:
      return Infinity; // Effectively immortal

    default:
      return 1e9; // Default 1 billion years
  }
}
```

## Physical Properties by Type

### Temperature Ranges

```typescript
function getTemperatureRange(stellarType: StellarType): [number, number] {
  switch (stellarType) {
    case StellarType.MAIN_SEQUENCE:
      return [2400, 50000]; // M to O class
    case StellarType.RED_GIANT:
      return [3000, 5000]; // Cool giants
    case StellarType.SUPERGIANT:
      return [3000, 40000]; // Wide range
    case StellarType.WOLF_RAYET:
      return [30000, 200000]; // Very hot
    case StellarType.WHITE_DWARF:
      return [4000, 150000]; // Cooling sequence
    case StellarType.NEUTRON_STAR:
      return [100000, 1000000]; // Surface temperature
    default:
      return [3000, 10000]; // Default range
  }
}
```

### Luminosity Ranges

```typescript
function getLuminosityRange(stellarType: StellarType): [number, number] {
  switch (stellarType) {
    case StellarType.MAIN_SEQUENCE:
      return [0.00001, 2000000]; // M to O class
    case StellarType.RED_GIANT:
      return [10, 10000]; // Luminous giants
    case StellarType.SUPERGIANT:
      return [1000, 1000000]; // Very luminous
    case StellarType.HYPERGIANT:
      return [100000, 5000000]; // Extremely luminous
    case StellarType.WHITE_DWARF:
      return [0.00001, 1]; // Fading remnants
    case StellarType.NEUTRON_STAR:
      return [0.00001, 0.001]; // Very dim
    default:
      return [0.1, 100]; // Default range
  }
}
```

## Integration

### Renderer System

- Determines which star renderer to use
- Affects LOD behavior and visual effects
- Controls corona and atmospheric effects

### Physics System

- Influences gravitational behavior
- Affects stellar wind modeling
- Determines fusion processes

### Procedural Generation

- Guides system generation rules
- Affects planet formation probability
- Influences habitable zone calculations

## 🔗 Related

- [[StarProperties]] - Star properties that use this enumeration
- [[CelestialObject]] - Base celestial object interface
- [[SpectralClass]] - Spectral classification system
- [[LuminosityClass]] - Luminosity classification
- [[@teskooano/celestials-stars]] - Star rendering system
