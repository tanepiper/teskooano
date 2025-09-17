---
aliases: [CelestialType]
tags: [data, types, celestial, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# CelestialType

Enumeration defining the primary classification of celestial bodies in the simulation.

## Overview

The `CelestialType` enum provides a comprehensive classification system for all celestial objects in the Teskooano engine. It serves as the primary type discriminator for determining rendering behavior, physics calculations, and system organization.

## Enum Definition

```typescript
export enum CelestialType {
  STAR = "STAR",
  PLANET = "PLANET",
  DWARF_PLANET = "DWARF_PLANET",
  MOON = "MOON",
  ASTEROID = "ASTEROID",
  ASTEROID_FIELD = "ASTEROID_FIELD",
  GAS_GIANT = "GAS_GIANT",
  COMET = "COMET",
  OORT_CLOUD = "OORT_CLOUD",
  RING_SYSTEM = "RING_SYSTEM",
  BARYCENTER = "BARYCENTER",
  SATELLITE = "SATELLITE",
  OTHER = "OTHER",
}
```

## Celestial Types

### Primary Bodies

#### STAR

```typescript
STAR = "STAR";
```

A star, the central body of a system.

**Characteristics:**

- Central gravitational body
- Primary light source
- Hydrogen fusion or stellar remnant
- Massive and luminous

**Examples:**

- Sun, Proxima Centauri, Betelgeuse
- White dwarfs, neutron stars, black holes

**Associated Properties:**

- [[StarProperties]] - Star-specific configuration
- Spectral classification
- Stellar evolution stage
- Luminosity and temperature

#### PLANET

```typescript
PLANET = "PLANET";
```

A planet orbiting a star.

**Characteristics:**

- Orbits a star directly
- Cleared its orbital neighborhood
- Sufficient mass for hydrostatic equilibrium
- Not a satellite of another planet

**Examples:**

- Earth, Mars, Venus, Mercury

**Associated Properties:**

- [[PlanetProperties]] - Planet-specific configuration
- Surface and atmospheric properties
- Composition and geology

#### DWARF_PLANET

```typescript
DWARF_PLANET = "DWARF_PLANET";
```

A planet that meets some but not all criteria for a full planet.

**Characteristics:**

- Orbits a star directly
- Sufficient mass for hydrostatic equilibrium
- Has not cleared its orbital neighborhood
- Not a satellite of another planet

**Examples:**

- Pluto, Ceres, Eris, Makemake

**Associated Properties:**

- [[PlanetProperties]] - Same as regular planets
- Often smaller and more distant
- May have unique orbital characteristics

#### MOON

```typescript
MOON = "MOON";
```

A moon orbiting a planet or gas giant.

**Characteristics:**

- Natural satellite of a planet
- Gravitationally bound to parent
- Can have atmosphere and surface features
- May be tidally locked

**Examples:**

- Luna (Earth's Moon), Europa, Titan, Ganymede

**Associated Properties:**

- [[PlanetProperties]] - Same interface as planets
- `isMoon: true` property
- Parent-child relationship

#### GAS_GIANT

```typescript
GAS_GIANT = "GAS_GIANT";
```

A large planet composed mostly of gases.

**Characteristics:**

- Massive gaseous composition
- Thick atmosphere
- Often have ring systems
- Multiple moons

**Examples:**

- Jupiter, Saturn, Uranus, Neptune

**Associated Properties:**

- [[GasGiantProperties]] - Gas giant-specific configuration
- Atmospheric composition and dynamics
- Ring system configuration

### Small Bodies

#### ASTEROID

```typescript
ASTEROID = "ASTEROID";
```

Individual space rock objects.

**Characteristics:**

- Small rocky or metallic bodies
- Irregular shape
- No atmosphere
- May have rotation

**Examples:**

- Individual asteroids in asteroid belts
- Near-Earth asteroids
- Trojan asteroids

**Associated Properties:**

- [[AsteroidProperties]] - Asteroid-specific configuration
- Composition and color information
- Procedural surface properties

#### COMET

```typescript
COMET = "COMET";
```

An icy body that displays a coma and sometimes a tail when near a star.

**Characteristics:**

- Icy composition
- Elliptical orbits
- Develops coma and tail near star
- Outgassing activity

**Examples:**

- Halley's Comet, Hale-Bopp, NEOWISE

**Associated Properties:**

- [[CometProperties]] - Comet-specific configuration
- Orbital classification
- Coma and tail parameters

### Collections

#### ASTEROID_FIELD

```typescript
ASTEROID_FIELD = "ASTEROID_FIELD";
```

A collection of space rocks, typically forming a belt.

**Characteristics:**

- Multiple asteroids as single entity
- Defined spatial boundaries
- Particle-based rendering
- Density and distribution parameters

**Examples:**

- Main asteroid belt
- Kuiper belt objects
- Scattered disk

**Associated Properties:**

- [[AsteroidFieldProperties]] - Field-specific configuration
- Spatial boundaries and density
- Particle rendering parameters

#### OORT_CLOUD

```typescript
OORT_CLOUD = "OORT_CLOUD";
```

A theoretical cloud of icy planetesimals proposed to surround the sun at great distance.

**Characteristics:**

- Spherical cloud of icy objects
- Very distant from central star
- Source of long-period comets
- Sparse distribution

**Examples:**

- Solar system's Oort cloud
- Hypothetical clouds around other stars

**Associated Properties:**

- [[OortCloudProperties]] - Cloud-specific configuration
- Radial boundaries
- Particle density and composition

#### RING_SYSTEM

```typescript
RING_SYSTEM = "RING_SYSTEM";
```

A distinct system of rings orbiting a celestial body.

**Characteristics:**

- Flattened disk of particles
- Orbits around parent body
- Complex dynamics and structure
- Multiple ring components

**Examples:**

- Saturn's rings, Jupiter's rings
- Uranus's rings, Neptune's rings

**Associated Properties:**

- [[RingSystemProperties]] - Ring-specific configuration
- Ring structure and composition
- Orbital dynamics

### Special Objects

#### BARYCENTER

```typescript
BARYCENTER = "BARYCENTER";
```

The center of mass of a multi-body system.

**Characteristics:**

- Mathematical point, not physical object
- Center of mass for binary systems
- Reference point for orbital calculations
- Usually not rendered directly

**Examples:**

- Earth-Moon barycenter
- Binary star system barycenters
- Pluto-Charon barycenter

**Associated Properties:**

- Minimal properties
- Position and mass information
- System component references

#### SATELLITE

```typescript
SATELLITE = "SATELLITE";
```

A man-made artificial satellite or spacecraft.

**Characteristics:**

- Human-made object
- Orbits natural bodies
- Specific mission purposes
- 3D model representation

**Examples:**

- International Space Station
- Hubble Space Telescope
- GPS satellites

**Associated Properties:**

- [[SatelliteProperties]] - Satellite-specific configuration
- 3D model paths
- Mission and operational data

#### OTHER

```typescript
OTHER = "OTHER";
```

Catch-all for other or undefined celestial types.

**Characteristics:**

- Fallback category
- Custom or experimental objects
- Undefined classification
- Flexible properties

**Usage:**

- Placeholder during development
- Custom celestial objects
- Edge cases not covered by other types

## Usage Examples

### Type-Based Object Creation

```typescript
import { CelestialType, CelestialObject } from "@teskooano/data-types";

function createCelestialObject(type: CelestialType): CelestialObject {
  const baseObject = {
    id: generateId(),
    type,
    name: "Unnamed Object",
    status: CelestialStatus.ACTIVE,
    realRadius_m: 1000,
    realMass_kg: 1e12,
    temperature: 200,
    orbit: createDefaultOrbit(),
  };

  switch (type) {
    case CelestialType.STAR:
      return {
        ...baseObject,
        properties: {
          type: CelestialType.STAR,
          isMainStar: false,
          spectralClass: "M5V",
          luminosity: 0.1,
          color: "#FF6B6B",
        } as StarProperties,
      };

    case CelestialType.PLANET:
      return {
        ...baseObject,
        properties: {
          type: CelestialType.PLANET,
          classType: PlanetType.ROCKY,
          isMoon: false,
          composition: ["rock", "metal"],
        } as PlanetProperties,
      };

    case CelestialType.GAS_GIANT:
      return {
        ...baseObject,
        properties: {
          type: CelestialType.GAS_GIANT,
          classType: GasGiantClass.CLASS_I,
          atmosphereColor: "#D2B48C",
          cloudColor: "#F5DEB3",
          cloudSpeed: 0.5,
        } as GasGiantProperties,
      };

    // ... other cases
    default:
      return baseObject;
  }
}
```

### Type-Based Renderer Selection

```typescript
import { CelestialType } from "@teskooano/data-types";

function selectRenderer(type: CelestialType): string {
  switch (type) {
    case CelestialType.STAR:
      return "StarRenderer";
    case CelestialType.PLANET:
    case CelestialType.MOON:
    case CelestialType.DWARF_PLANET:
      return "PlanetRenderer";
    case CelestialType.GAS_GIANT:
      return "GasGiantRenderer";
    case CelestialType.ASTEROID:
      return "AsteroidRenderer";
    case CelestialType.COMET:
      return "CometRenderer";
    case CelestialType.ASTEROID_FIELD:
      return "AsteroidFieldRenderer";
    case CelestialType.OORT_CLOUD:
      return "OortCloudRenderer";
    case CelestialType.RING_SYSTEM:
      return "RingSystemRenderer";
    case CelestialType.SATELLITE:
      return "SatelliteRenderer";
    case CelestialType.BARYCENTER:
      return "BarycenterRenderer";
    case CelestialType.OTHER:
    default:
      return "DefaultRenderer";
  }
}
```

### Type-Based Physics Behavior

```typescript
import { CelestialType } from "@teskooano/data-types";

function shouldIncludeInPhysics(type: CelestialType): boolean {
  switch (type) {
    case CelestialType.STAR:
    case CelestialType.PLANET:
    case CelestialType.DWARF_PLANET:
    case CelestialType.MOON:
    case CelestialType.GAS_GIANT:
      return true; // Major bodies affect gravity

    case CelestialType.ASTEROID:
    case CelestialType.COMET:
      return false; // Too small for significant gravitational effect

    case CelestialType.ASTEROID_FIELD:
    case CelestialType.OORT_CLOUD:
    case CelestialType.RING_SYSTEM:
      return false; // Particle systems, not discrete bodies

    case CelestialType.SATELLITE:
      return false; // Artificial objects, minimal mass

    case CelestialType.BARYCENTER:
      return false; // Mathematical point, not physical object

    case CelestialType.OTHER:
    default:
      return false; // Safe default
  }
}
```

### Type Filtering

```typescript
import {
  CelestialType,
  RenderableCelestialObject,
} from "@teskooano/data-types";

function filterByType(
  objects: RenderableCelestialObject[],
  type: CelestialType,
): RenderableCelestialObject[] {
  return objects.filter((obj) => obj.type === type);
}

function filterMajorBodies(
  objects: RenderableCelestialObject[],
): RenderableCelestialObject[] {
  const majorTypes = [
    CelestialType.STAR,
    CelestialType.PLANET,
    CelestialType.DWARF_PLANET,
    CelestialType.GAS_GIANT,
  ];
  return objects.filter((obj) => majorTypes.includes(obj.type));
}

function filterSmallBodies(
  objects: RenderableCelestialObject[],
): RenderableCelestialObject[] {
  const smallTypes = [
    CelestialType.MOON,
    CelestialType.ASTEROID,
    CelestialType.COMET,
    CelestialType.SATELLITE,
  ];
  return objects.filter((obj) => smallTypes.includes(obj.type));
}
```

## Type Hierarchy

### Physical Bodies

- **STAR** - Central, massive, luminous
- **PLANET** - Orbiting, cleared orbit
- **DWARF_PLANET** - Orbiting, uncleared orbit
- **MOON** - Satellite of planet
- **GAS_GIANT** - Large, gaseous

### Small Bodies

- **ASTEROID** - Small, rocky
- **COMET** - Icy, eccentric orbit

### Collections

- **ASTEROID_FIELD** - Multiple asteroids
- **OORT_CLOUD** - Distant icy objects
- **RING_SYSTEM** - Orbital ring particles

### Special

- **BARYCENTER** - Mathematical center
- **SATELLITE** - Artificial object
- **OTHER** - Undefined/custom

## Integration Points

### Rendering System

- Determines renderer selection
- Controls LOD behavior
- Influences lighting calculations

### Physics System

- Determines inclusion in n-body calculations
- Affects collision detection
- Controls gravitational influence

### UI System

- Categorizes objects in hierarchies
- Determines available actions
- Controls information display

### State Management

- Primary key for object categorization
- Enables type-based queries
- Supports filtering and grouping

## Performance Considerations

### Enum Comparisons

- String enum values enable fast equality checks
- Switch statements are optimized by JavaScript engines
- Type guards can be created for runtime checking

### Type-Based Optimization

- Different types can have different update frequencies
- Rendering can be optimized per type
- Physics calculations can skip irrelevant types

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[RenderableCelestialObject]] - Renderer-ready celestial object
- [[StarProperties]] - Star-specific properties
- [[PlanetProperties]] - Planet-specific properties
- [[GasGiantProperties]] - Gas giant-specific properties
- [[AsteroidProperties]] - Asteroid-specific properties
- [[CometProperties]] - Comet-specific properties
- [[AsteroidFieldProperties]] - Asteroid field-specific properties
- [[OortCloudProperties]] - Oort cloud-specific properties
- [[RingSystemProperties]] - Ring system-specific properties
- [[SatelliteProperties]] - Satellite-specific properties
- [[CelestialStatus]] - Object status enumeration
- [[@teskooano/core-state]] - State management system
- [[@teskooano/renderer-threejs]] - 3D rendering system
