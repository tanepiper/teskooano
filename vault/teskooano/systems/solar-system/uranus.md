---
aliases: [uranus, uranus-system, ice-giant]
tags: [systems, solar-system, uranus, ice-giant, astronomy]
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
    "uranus",
    "ariel",
    "umbriel",
    "titania",
    "oberon",
    "miranda",
  ]
types:
  [
    "CelestialObject",
    "GasGiantProperties",
    "PlanetProperties",
  ]
status: active
---

# Uranus System

The Uranus system containing the planet Uranus and all of its 27+ known moons. Uranus is the seventh planet from the Sun and is unique for its extreme axial tilt and retrograde rotation.

## Overview

Uranus is the seventh planet from the Sun and the third-largest planet in our solar system. It has a unique axial tilt of 98°, making it appear to rotate on its side. Uranus has a system of moons and a faint ring system.

## Components

### Uranus

The seventh planet from the Sun, known for its extreme axial tilt and unique rotation.

**Key Properties**:

- **Type**: Ice giant
- **Mass**: 8.681 × 10²⁵ kg (14.5 Earth masses)
- **Radius**: 25,362 km (3.98 Earth radii)
- **Density**: 1.271 g/cm³
- **Surface Gravity**: 8.69 m/s²
- **Surface Temperature**: 76 K (-197°C)
- **Orbital Period**: 84.01 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 2,872,463,405 km (19.191 AU)
- **Eccentricity**: 0.04717
- **Inclination**: 0.772°
- **Longitude of Ascending Node**: 74.006°
- **Argument of Periapsis**: 96.541°
- **Mean Anomaly**: 142.238°

### Major Moons

Uranus has several significant moons, including:

#### Miranda

The smallest and innermost of the five major moons, known for its extreme surface features.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 6.59 × 10¹⁹ kg
- **Radius**: 235.8 km
- **Density**: 1.214 g/cm³
- **Surface Gravity**: 0.079 m/s²
- **Orbital Period**: 1.413 days

#### Ariel

The fourth-largest moon of Uranus, with a relatively smooth surface.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 1.35 × 10²¹ kg
- **Radius**: 578.9 km
- **Density**: 1.592 g/cm³
- **Surface Gravity**: 0.269 m/s²
- **Orbital Period**: 2.520 days

#### Umbriel

The third-largest moon of Uranus, with a dark, heavily cratered surface.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 1.17 × 10²¹ kg
- **Radius**: 584.7 km
- **Density**: 1.390 g/cm³
- **Surface Gravity**: 0.234 m/s²
- **Orbital Period**: 4.144 days

#### Titania

The largest moon of Uranus, with a complex surface.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 3.40 × 10²¹ kg
- **Radius**: 788.9 km
- **Density**: 1.662 g/cm³
- **Surface Gravity**: 0.365 m/s²
- **Orbital Period**: 8.706 days

#### Oberon

The second-largest moon of Uranus, with a heavily cratered surface.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 3.08 × 10²¹ kg
- **Radius**: 761.4 km
- **Density**: 1.559 g/cm³
- **Surface Gravity**: 0.354 m/s²
- **Orbital Period**: 13.463 days

### Ring System

Uranus has a faint ring system consisting of:

- **Zeta Ring**: Innermost ring
- **6 Ring**: Narrow ring
- **5 Ring**: Narrow ring
- **4 Ring**: Narrow ring
- **Alpha Ring**: Main ring
- **Beta Ring**: Main ring
- **Eta Ring**: Main ring
- **Gamma Ring**: Main ring
- **Delta Ring**: Main ring
- **Lambda Ring**: Outer ring
- **Epsilon Ring**: Outermost ring

## Data Structure

```typescript
// From uranus/index.ts
export const uranus: CelestialObject<any>[] = [
  uranusPlanet, // Uranus planet
  ...majorMoons, // Miranda, Ariel, Umbriel, Titania, Oberon
  ...ringSystem, // Ring system components
  ...otherMoons, // Additional moons
];
```

## Usage Examples

### Accessing Uranus System Objects

```typescript
import { uranus } from "@teskooano/systems-solar-system";

// Get Uranus planet
const uranusPlanet = uranus.find((obj) => obj.id === "uranus");

// Get major moons
const miranda = uranus.find((obj) => obj.id === "miranda");
const ariel = uranus.find((obj) => obj.id === "ariel");
const umbriel = uranus.find((obj) => obj.id === "umbriel");
const titania = uranus.find((obj) => obj.id === "titania");
const oberon = uranus.find((obj) => obj.id === "oberon");

// Get all moons
const moons = uranus.filter((obj) => obj.type === "moon");

// Get ring system
const rings = uranus.filter((obj) => obj.type === "ring");

// Get all Uranus system objects
console.log("Uranus system objects:", uranus.length);
```

### Uranus Properties

```typescript
import { uranus } from "@teskooano/systems-solar-system";

const uranusPlanet = uranus.find((obj) => obj.id === "uranus");

if (uranusPlanet) {
  console.log("Uranus Properties:");
  console.log("  Type:", uranusPlanet.properties.planetType);
  console.log("  Mass:", uranusPlanet.properties.mass, "kg");
  console.log("  Radius:", uranusPlanet.properties.radius, "km");
  console.log("  Axial Tilt:", uranusPlanet.properties.axialTilt, "degrees");
  console.log(
    "  Surface Temperature:",
    uranusPlanet.properties.surfaceTemperature,
    "K",
  );
}
```

### Moon Properties

```typescript
import { uranus } from "@teskooano/systems-solar-system";

const majorMoons = ["miranda", "ariel", "umbriel", "titania", "oberon"];

majorMoons.forEach((moonId) => {
  const moon = uranus.find((obj) => obj.id === moonId);
  if (moon) {
    console.log(`${moon.name} Properties:`);
    console.log(`  Mass: ${moon.properties.mass} kg`);
    console.log(`  Radius: ${moon.properties.radius} km`);
    console.log(`  Orbital Period: ${moon.properties.orbitalPeriod} days`);
  }
});
```

## Physical Properties

### Uranus's Planetary Properties

```typescript
interface PlanetProperties {
  planetType: "ice-giant";
  mass: 8.681e25; // kg
  radius: 25362; // km
  density: 1.271; // g/cm³
  surfaceGravity: 8.69; // m/s²
  surfaceTemperature: 76; // K
  rotationPeriod: -0.718; // days (retrograde)
  axialTilt: 97.77; // degrees
  magneticField: 0.23; // G
  atmosphericPressure: 1e5; // Pa (1 bar)
}
```

### Major Moon Properties

```typescript
interface SatelliteProperties {
  satelliteType: "natural";
  mass: number; // kg
  radius: number; // km
  density: number; // g/cm³
  surfaceGravity: number; // m/s²
  orbitalPeriod: number; // days
  rotationPeriod: number; // days (tidally locked)
  surfaceTemperature: number; // K
  magneticField: number; // G
}
```

### Ring Properties

```typescript
interface RingProperties {
  ringType: "planetary";
  innerEdge: number; // km
  outerEdge: number; // km
  thickness: number; // km
  composition: string; // ice, rock, dust
  albedo: number; // reflectivity
  opticalDepth: number; // transparency
}
```

## Unique Characteristics

### Extreme Axial Tilt

Uranus has the most extreme axial tilt in the solar system:

- **Axial Tilt**: 97.77° (nearly on its side)
- **Effect**: Extreme seasonal variations
- **Polar Regions**: Experience 42-year day/night cycles
- **Cause**: Possible ancient impact

### Retrograde Rotation

Uranus rotates backwards compared to most planets:

- **Rotation Period**: 0.718 days (retrograde)
- **Direction**: Clockwise when viewed from above
- **Effect**: Unique day-night patterns
- **Comparison**: Similar to Venus

### Ice Giant Composition

Uranus is classified as an ice giant:

- **Composition**: Water, methane, and ammonia ices
- **Atmosphere**: Hydrogen and helium
- **Core**: Rocky/metallic core
- **Structure**: No clear boundary between atmosphere and interior

## Orbital Dynamics

### Uranus's Orbit

Uranus orbits the Sun in a nearly circular path:

- **Orbital Period**: 84.01 years
- **Average Distance**: 2.872 billion km (19.191 AU)
- **Perihelion**: 2.748 billion km (18.375 AU)
- **Aphelion**: 2.997 billion km (20.007 AU)
- **Orbital Speed**: 6.80 km/s (average)

### Moon Orbits

Uranus's moons have diverse orbital characteristics:

**Major Moons**:

- **Miranda**: 1.413 days orbital period
- **Ariel**: 2.520 days orbital period
- **Umbriel**: 4.144 days orbital period
- **Titania**: 8.706 days orbital period
- **Oberon**: 13.463 days orbital period

**Ring Moons**:

- **Shepherd Moons**: Maintain ring structure
- **Gap Moons**: Create ring divisions
- **Co-orbital Moons**: Share similar orbits

## Atmospheric and Surface Properties

### Atmospheric Composition

Uranus's atmosphere consists of:

- **Hydrogen**: 82.5%
- **Helium**: 15.2%
- **Methane**: 2.3%
- **Ammonia**: 0.01%
- **Water Vapor**: 0.01%
- **Other Gases**: Trace amounts

### Cloud Structure

Uranus has multiple cloud layers:

- **Upper Clouds**: Methane ice crystals
- **Middle Clouds**: Ammonia and hydrogen sulfide
- **Lower Clouds**: Water ice and vapor
- **Deep Atmosphere**: Icy materials

### Surface Features

Uranus has no solid surface:

- **Atmospheric Depth**: Extends thousands of kilometers
- **Core**: Rocky/metallic core
- **Transition**: Gradual transition to icy materials
- **Pressure**: Increases with depth

## Exploration History

### Spacecraft Missions

Uranus has been visited by only one mission:

- **Voyager 2** (1986): Only flyby mission
- **Future Missions**: Proposed but not yet approved

### Key Discoveries

- **Axial Tilt**: Extreme 98° tilt
- **Magnetic Field**: Offset and tilted
- **Ring System**: Faint ring system
- **Moon System**: 27+ known moons
- **Atmospheric Dynamics**: Complex weather patterns

## Integration with Solar System

### Gravitational Interactions

Uranus interacts with:

- **Sun**: Primary gravitational force
- **Saturn**: Minor perturbations
- **Neptune**: Orbital resonances
- **Ring System**: Gravitational influence

### Solar System Dynamics

Uranus plays a role in:

- **Outer Planet Stability**: Ice giant dynamics
- **Ring Evolution**: Gravitational influence
- **Moon Formation**: Tidal effects
- **Planetary Formation**: Influenced early solar system

## Best Practices

1. **Axial Tilt Modeling**: Account for extreme 98° tilt
2. **Atmospheric Rendering**: Show cloud layers and storms
3. **Moon Dynamics**: Include all 27+ moons
4. **Ring-Moon Interactions**: Model gravitational effects
5. **Seasonal Effects**: Display extreme seasonal variations

## Related

- [[uranus]] - Detailed Uranus object documentation
- [[miranda]] - Detailed Miranda object documentation
- [[ariel]] - Detailed Ariel object documentation
- [[umbriel]] - Detailed Umbriel object documentation
- [[titania]] - Detailed Titania object documentation
- [[oberon]] - Detailed Oberon object documentation
- [[ringSystem]] - Detailed ring system documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Atmospheric and surface rendering
