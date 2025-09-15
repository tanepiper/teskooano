---
aliases: [CelestialObject]
tags: [data, types, celestial]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/core.types.ts"
status: active
---

# CelestialObject

Base interface for all celestial bodies within the simulation with real physical properties and orbital mechanics.

## Overview

The `CelestialObject` interface represents the complete state and definition of a celestial object within the simulation. It provides a comprehensive type-safe structure for all celestial bodies, from stars and planets to comets and artificial satellites.

## Interface Definition

```typescript
export interface CelestialObject<T = CelestialSpecificPropertiesUnion> {
  id: string;
  type: CelestialType;
  name: string;
  status: CelestialStatus;
  realRadius_m: number;
  realMass_kg: number;
  orbit: OrbitalParameters;
  temperature: number;
  albedo?: number;
  atmosphere?: PlanetAtmosphereProperties;
  properties?: T;
  parentId?: string;
  lagrangePointTargetId?: string;
  seed?: string;
  ignorePhysics?: boolean;
  ignoreCollisions?: boolean;
  isVisible?: boolean;
}
```

## Core Properties

### Identification

#### id

```typescript
id: string;
```

Unique identifier for the celestial object.

- **Type**: `string`
- **Required**: Yes
- **Usage**: Primary key for object identification across all systems

#### type

```typescript
type: CelestialType;
```

The fundamental type of the object (e.g., STAR, PLANET, MOON).

- **Type**: `CelestialType`
- **Required**: Yes
- **Usage**: Determines rendering, physics, and behavior systems

#### name

```typescript
name: string;
```

The display name of the celestial object.

- **Type**: `string`
- **Required**: Yes
- **Usage**: Human-readable identification in UI

#### status

```typescript
status: CelestialStatus;
```

Current status of the object in the simulation.

- **Type**: `CelestialStatus`
- **Required**: Yes
- **Values**: `ACTIVE`, `DESTROYED`, `ANNIHILATED`
- **Usage**: Simulation state management

### Physical Properties

#### realRadius_m

```typescript
realRadius_m: number;
```

The REAL physical radius of the object (in METERS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Usage**: Physics calculations and rendering scaling

#### realMass_kg

```typescript
realMass_kg: number;
```

The REAL physical mass of the object (in KILOGRAMS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Kilograms
- **Usage**: Gravitational calculations and physics simulation

#### temperature

```typescript
temperature: number;
```

Average surface or effective temperature in Kelvin.

- **Type**: `number`
- **Required**: Yes
- **Units**: Kelvin
- **Usage**: Thermal radiation, atmospheric modeling

#### albedo

```typescript
albedo?: number
```

Optional surface reflectivity (albedo).

- **Type**: `number`
- **Required**: No
- **Range**: 0.0 (absorbs all light) to 1.0 (reflects all light)
- **Usage**: Light scattering and thermal modeling

### Orbital Mechanics

#### orbit

```typescript
orbit: OrbitalParameters;
```

Orbital parameters defining the object's path around its parent.

- **Type**: `OrbitalParameters`
- **Required**: Yes
- **Usage**: Position calculation and trajectory prediction

### Atmospheric Properties

#### atmosphere

```typescript
atmosphere?: PlanetAtmosphereProperties
```

Optional atmospheric properties common to many bodies.

- **Type**: `PlanetAtmosphereProperties`
- **Required**: No
- **Usage**: Atmospheric rendering and effects

### Type-Specific Properties

#### properties

```typescript
properties?: T
```

Object containing properties specific to the type of celestial object.

- **Type**: Generic `T` (defaults to `CelestialSpecificPropertiesUnion`)
- **Required**: No
- **Usage**: Type-specific configuration and rendering parameters

### Hierarchical Relationships

#### parentId

```typescript
parentId?: string
```

Optional reference to parent body ID.

- **Type**: `string`
- **Required**: No
- **Usage**: Hierarchical relationships (moons orbiting planets)

#### lagrangePointTargetId

```typescript
lagrangePointTargetId?: string
```

If the object is at a Lagrange point, the ID of the second body in the system.

- **Type**: `string`
- **Required**: No
- **Usage**: Lagrange point calculations for two-body systems

### Procedural Generation

#### seed

```typescript
seed?: string
```

Optional seed value used for procedural generation.

- **Type**: `string`
- **Required**: No
- **Usage**: Deterministic procedural texture and surface generation

### Simulation Control

#### ignorePhysics

```typescript
ignorePhysics?: boolean
```

When true, excludes object from physics calculations.

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: Performance optimization or special objects

#### ignoreCollisions

```typescript
ignoreCollisions?: boolean
```

When true, excludes object from collision detection.

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: Performance optimization or non-physical objects

#### isVisible

```typescript
isVisible?: boolean
```

When true, object is visible in the simulation.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: Visibility control for rendering

## Generic Type Parameter

### T (Properties Type)

The interface uses a generic type parameter `T` for type-specific properties:

```typescript
CelestialObject<T = CelestialSpecificPropertiesUnion>
```

**Common Specializations:**

- `CelestialObject<StarProperties>` - For stars
- `CelestialObject<PlanetProperties>` - For planets and moons
- `CelestialObject<GasGiantProperties>` - For gas giants
- `CelestialObject<CometProperties>` - For comets
- `CelestialObject<SatelliteProperties>` - For artificial satellites

## Usage Examples

### Basic Star

```typescript
const sun: CelestialObject<StarProperties> = {
  id: "sun-001",
  type: CelestialType.STAR,
  name: "Sun",
  status: CelestialStatus.ACTIVE,
  realRadius_m: 696340000, // 696,340 km
  realMass_kg: 1.989e30, // Solar mass
  temperature: 5778, // Surface temperature in Kelvin
  albedo: 0.306,
  orbit: {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0,
    realAphelion_m: 0,
    realPerihelion_m: 0,
    averageOrbitalSpeed_mps: 0,
  },
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: 1.0,
    color: "#FFD700",
    stellarType: StellarType.MAIN_SEQUENCE,
  },
};
```

### Earth-like Planet

```typescript
const earth: CelestialObject<PlanetProperties> = {
  id: "earth-001",
  type: CelestialType.PLANET,
  name: "Earth",
  status: CelestialStatus.ACTIVE,
  realRadius_m: 6371000, // Earth radius
  realMass_kg: 5.972e24, // Earth mass
  temperature: 288, // Average surface temperature
  albedo: 0.306, // Earth's albedo
  orbit: {
    realSemiMajorAxis_m: 1.496e11, // 1 AU
    eccentricity: 0.0167,
    inclination: 0.00005,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 31557600, // 1 year in seconds
    realAphelion_m: 1.521e11,
    realPerihelion_m: 1.471e11,
    averageOrbitalSpeed_mps: 29780,
  },
  atmosphere: {
    glowColor: "#87CEEB",
    intensity: 0.3,
    power: 2.0,
    thickness: 0.1,
    opacity: 0.8,
  },
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: ["silicates", "iron", "water"],
  },
  parentId: "sun-001",
};
```

### Moon

```typescript
const luna: CelestialObject<PlanetProperties> = {
  id: "luna-001",
  type: CelestialType.MOON,
  name: "Luna",
  status: CelestialStatus.ACTIVE,
  realRadius_m: 1737400, // Moon radius
  realMass_kg: 7.342e22, // Moon mass
  temperature: 250, // Average temperature
  albedo: 0.136, // Moon's albedo
  orbit: {
    realSemiMajorAxis_m: 384400000, // Distance from Earth
    eccentricity: 0.0549,
    inclination: 0.08979,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 2360584, // 27.3 days
    realAphelion_m: 405696000,
    realPerihelion_m: 362600000,
    averageOrbitalSpeed_mps: 1022,
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["silicates", "anorthosite"],
  },
  parentId: "earth-001",
};
```

### Artificial Satellite

```typescript
const iss: CelestialObject<SatelliteProperties> = {
  id: "iss-001",
  type: CelestialType.SATELLITE,
  name: "International Space Station",
  status: CelestialStatus.ACTIVE,
  realRadius_m: 109, // Approximate size
  realMass_kg: 450000, // ISS mass
  temperature: 200, // Operational temperature
  orbit: {
    realSemiMajorAxis_m: 6.78e6, // 408 km altitude
    eccentricity: 0.0001,
    inclination: 0.9006, // 51.6 degrees
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 5550, // ~92 minutes
    realAphelion_m: 6.78e6,
    realPerihelion_m: 6.78e6,
    averageOrbitalSpeed_mps: 7660,
  },
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "/models/iss.glb",
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1998-11-20",
  },
  parentId: "earth-001",
  ignorePhysics: false,
  ignoreCollisions: true,
};
```

## Integration

### Physics System

- **Mass**: Used for gravitational calculations
- **Radius**: Used for collision detection
- **Orbit**: Used for position and velocity calculations

### Rendering System

- **Type**: Determines renderer selection
- **Properties**: Provides renderer-specific configuration
- **Visibility**: Controls rendering state

### State Management

- **ID**: Primary key for state tracking
- **Status**: Lifecycle management
- **Hierarchy**: Parent-child relationships

## Validation

### Required Properties

All required properties must be provided:

- `id`, `type`, `name`, `status`
- `realRadius_m`, `realMass_kg`, `temperature`
- `orbit` (complete orbital parameters)

### Type Safety

TypeScript ensures type safety through:

- Generic type parameter for properties
- Enum constraints for categorical values
- Optional property handling

### Runtime Validation

Consider implementing runtime validation for:

- Positive values for mass and radius
- Valid orbital parameter ranges
- Consistent parent-child relationships

## Performance Considerations

### Memory Usage

- Large object collections require efficient storage
- Optional properties reduce memory footprint
- Type-specific properties use discriminated unions

### Lookup Performance

- ID-based lookups are O(1) with proper indexing
- Type-based filtering uses enum comparisons
- Hierarchical queries traverse parent-child links

## 🔗 Related

- [[RenderableCelestialObject]] - Renderer-ready version of celestial objects
- [[CelestialType]] - Enumeration of celestial object types
- [[CelestialStatus]] - Enumeration of object status values
- [[OrbitalParameters]] - Orbital mechanics definitions
- [[StarProperties]] - Star-specific properties
- [[PlanetProperties]] - Planet-specific properties
- [[GasGiantProperties]] - Gas giant-specific properties
- [[CometProperties]] - Comet-specific properties
- [[SatelliteProperties]] - Satellite-specific properties
- [[PlanetAtmosphereProperties]] - Atmospheric property definitions
- [[@teskooano/core-state]] - State management system
- [[@teskooano/core-physics]] - Physics simulation system
