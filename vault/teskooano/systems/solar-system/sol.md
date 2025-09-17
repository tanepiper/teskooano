---
aliases: [sol, sun, solar-star, g2v-star]
tags: [systems, solar-system, sun, star, g2v, main-sequence, astronomy]
type: Data
package: "@teskooano/systems-solar-system"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/core-math",
    "@teskooano/core-physics",
  ]
classes:
  [
    "CelestialObject",
  ]
functions:
  [
    "createOrbitalElements",
  ]
constants:
  [
    "sun",
    "asteroidBelt",
    "oortCloud",
  ]
types:
  [
    "CelestialObject",
    "StarProperties",
    "AsteroidFieldProperties",
    "OortCloudProperties",
  ]
status: active
---

# Sol System

The central star system containing the Sun and the main asteroid belt. This is the core of our solar system, providing the gravitational anchor and energy source for all other celestial bodies.

## Overview

The Sol system represents the central components of our solar system, including the Sun (our star) and the main asteroid belt that lies between Mars and Jupiter. These objects form the gravitational and energetic foundation of the entire solar system.

## Components

# Sun (Sol)

The central star of our solar system, a G-type main-sequence star that provides the gravitational anchor and energy source for all other celestial bodies.

**Key Properties**:

- **Type**: G2V main-sequence star
- **Mass**: 1.989 × 10³⁰ kg (1 solar mass)
- **Radius**: 696,340 km (1 solar radius)
- **Luminosity**: 3.828 × 10²⁶ W
- **Surface Temperature**: 5,778 K
- **Age**: ~4.6 billion years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 0 km (center of system)
- **Eccentricity**: 0 (circular orbit)
- **Inclination**: 0° (reference plane)
- **Longitude of Ascending Node**: 0°
- **Argument of Periapsis**: 0°
- **Mean Anomaly**: 0°

### Main Asteroid Belt

A region of space between Mars and Jupiter containing millions of rocky objects, remnants from the early solar system formation.

**Key Properties**:

- **Location**: Between Mars and Jupiter (2.1-3.3 AU)
- **Total Mass**: ~3.4 × 10²¹ kg
- **Number of Objects**: Millions (1.9 million known)
- **Composition**: Rocky and metallic objects
- **Formation**: Primordial solar system material

**Representative Objects**:

- **Ceres**: Largest object (dwarf planet)
- **Vesta**: Second largest (protoplanet)
- **Pallas**: Third largest
- **Hygiea**: Fourth largest

## Data Structure

```typescript
// From systemCelestials
export const systemCelestials: CelestialObject<any>[] = [
  sun, // Central star
  asteroidBelt, // Main asteroid belt
];
```

## Usage Examples

### Accessing Sol System Objects

```typescript
import { systemCelestials } from "@teskooano/systems-solar-system";

// Get the Sun
const sun = systemCelestials.find((obj) => obj.id === "sun");

// Get the asteroid belt
const asteroidBelt = systemCelestials.find((obj) => obj.id === "asteroid-belt");

// Get all objects
console.log("Sol system objects:", systemCelestials.length);
```

### Sun Properties

```typescript
import { systemCelestials } from "@teskooano/systems-solar-system";

const sun = systemCelestials.find((obj) => obj.id === "sun");

if (sun) {
  console.log("Sun Properties:");
  console.log("  Type:", sun.properties.stellarType);
  console.log("  Mass:", sun.properties.mass, "kg");
  console.log("  Radius:", sun.properties.radius, "km");
  console.log("  Temperature:", sun.properties.temperature, "K");
  console.log("  Luminosity:", sun.properties.luminosity, "W");
}
```

### Asteroid Belt Information

```typescript
import { systemCelestials } from "@teskooano/systems-solar-system";

const asteroidBelt = systemCelestials.find((obj) => obj.id === "asteroid-belt");

if (asteroidBelt) {
  console.log("Asteroid Belt Properties:");
  console.log("  Inner Edge:", asteroidBelt.properties.innerEdge, "AU");
  console.log("  Outer Edge:", asteroidBelt.properties.outerEdge, "AU");
  console.log("  Total Mass:", asteroidBelt.properties.totalMass, "kg");
  console.log("  Object Count:", asteroidBelt.properties.objectCount);
}
```

## Solar System Hierarchy

The Sol system forms the top level of the solar system hierarchy:

```
Sun (center)
├── Mercury
├── Venus
├── Earth
│   ├── Moon
│   └── Satellites
├── Mars
│   ├── Phobos
│   └── Deimos
├── Asteroid Belt
├── Jupiter
│   └── 79+ Moons
├── Saturn
│   └── 82+ Moons
├── Uranus
│   └── 27+ Moons
├── Neptune
│   └── 14+ Moons
└── Pluto
    └── Charon
```

## Physical Properties

### Sun's Stellar Properties

```typescript
interface StarProperties {
  stellarType: "G2V";
  mass: 1.989e30; // kg
  radius: 696340; // km
  temperature: 5778; // K
  luminosity: 3.828e26; // W
  age: 4.6e9; // years
  metallicity: 0.0122; // Z/Z☉
  rotationPeriod: 25.05; // days
  magneticField: 1.0; // G
}
```

### Asteroid Belt Properties

```typescript
interface AsteroidBeltProperties {
  innerEdge: 2.1; // AU
  outerEdge: 3.3; // AU
  totalMass: 3.4e21; // kg
  objectCount: 1900000; // known objects
  composition: "rocky"; // primary composition
  formation: "primordial"; // formation type
}
```

## Gravitational Influence

### Sun's Gravitational Field

The Sun's massive gravitational field dominates the entire solar system:

- **Solar System Boundary**: ~1 light-year (Oort Cloud)
- **Gravitational Constant**: 6.674 × 10⁻¹¹ m³/kg⋅s²
- **Escape Velocity**: 617.5 km/s (at surface)
- **Hill Sphere**: ~1 light-year

### Asteroid Belt Dynamics

The asteroid belt is influenced by:

- **Sun's Gravity**: Primary orbital force
- **Jupiter's Gravity**: Resonances and gaps
- **Mars' Gravity**: Minor perturbations
- **Collisional Evolution**: Ongoing process

## Energy and Radiation

### Solar Energy Output

The Sun provides energy to the entire solar system:

- **Total Luminosity**: 3.828 × 10²⁶ W
- **Solar Constant**: 1,361 W/m² (at Earth)
- **Energy Spectrum**: Blackbody radiation
- **Solar Wind**: Continuous particle emission

### Radiation Environment

The Sun creates a complex radiation environment:

- **Electromagnetic Radiation**: Full spectrum
- **Particle Radiation**: Solar wind and flares
- **Magnetic Field**: Heliospheric current sheet
- **Space Weather**: Dynamic conditions

## Integration with Solar System

### Central Role

The Sol system serves as:

1. **Gravitational Center**: All orbits reference the Sun
2. **Energy Source**: Provides light and heat
3. **Reference Frame**: Standard coordinate system
4. **Time Standard**: Solar time and seasons

### System Initialization

```typescript
import { systemCelestials } from "@teskooano/systems-solar-system";

// Initialize Sol system first
function initializeSolSystem() {
  // Add Sun and asteroid belt
  celestialManager.addObjects(systemCelestials);

  // Set Sun as reference for all other objects
  setSolarSystemReference(sun);
}
```

## Best Practices

1. **Initialize First**: Always initialize Sol system before other objects
2. **Reference Frame**: Use Sun as the primary reference
3. **Energy Calculations**: Account for solar radiation
4. **Gravitational Effects**: Consider Sun's influence on all orbits
5. **Time Synchronization**: Use solar time as reference

## Related

- [[sun]] - Detailed Sun object documentation
- [[asteroidBelt]] - Detailed asteroid belt documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Gravitational calculations
- [[@teskooano/core-math]] - Astronomical calculations
