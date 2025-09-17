---
aliases: [earth, earth-system, earth-moon-system]
tags: [systems, solar-system, earth, moon, terrestrial, habitable, astronomy]
type: Data
package: "@teskooano/systems-solar-system"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/data-values",
    "@teskooano/core-math",
    "@teskooano/core-physics",
  ]
classes:
  [
    "CelestialObject",
    "PhysicsStateReal",
    "OrbitalParameters",
    "OSVector3",
    "OSQuaternion",
  ]
functions:
  [
    "createEarthSystem",
    "calculateEarthPosition",
    "calculateMoonPosition",
    "updateEarthSystem",
  ]
constants:
  [
    "EARTH_MASS",
    "EARTH_RADIUS",
    "EARTH_DENSITY",
    "MOON_MASS",
    "MOON_RADIUS",
    "EARTH_MOON_DISTANCE",
  ]
types:
  [
    "EarthData",
    "MoonData",
    "EarthSystemData",
    "TerrestrialProperties",
    "AtmosphericComposition",
  ]
status: active
---

# Earth System

The Earth system containing Earth, its Moon, and all associated artificial satellites. This represents our home planet and its immediate celestial environment.

## Overview

The Earth system is one of the most complex and well-documented systems in our solar system, containing Earth (our home planet), the Moon (our natural satellite), and numerous artificial satellites that orbit our planet.

## Components

### Earth

Our home planet, the third planet from the Sun and the only known planet with life.

**Key Properties**:

- **Type**: Terrestrial planet
- **Mass**: 5.972 × 10²⁴ kg
- **Radius**: 6,371 km
- **Density**: 5.514 g/cm³
- **Surface Gravity**: 9.807 m/s²
- **Atmospheric Pressure**: 101.325 kPa
- **Surface Temperature**: 288 K (15°C)

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 149,597,870.7 km (1 AU)
- **Eccentricity**: 0.0167086
- **Inclination**: 0.00005°
- **Longitude of Ascending Node**: -11.26064°
- **Argument of Periapsis**: 114.20783°
- **Mean Anomaly**: 358.617°

### Moon (Luna)

Earth's natural satellite, the fifth largest moon in the solar system.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 7.342 × 10²² kg
- **Radius**: 1,737.4 km
- **Density**: 3.344 g/cm³
- **Surface Gravity**: 1.62 m/s²
- **Orbital Period**: 27.3217 days
- **Sidereal Period**: 27.3217 days

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 384,400 km
- **Eccentricity**: 0.0549
- **Inclination**: 5.145°
- **Longitude of Ascending Node**: 125.08°
- **Argument of Periapsis**: 318.15°
- **Mean Anomaly**: 135.27°

### Artificial Satellites

Human-made objects orbiting Earth, including space stations, telescopes, and communication satellites.

**Major Satellites**:

- **International Space Station (ISS)**: Low Earth orbit
- **Hubble Space Telescope**: Low Earth orbit
- **James Webb Space Telescope**: L2 Lagrange point
- **NOAA-19**: Polar orbit
- **Terra**: Sun-synchronous orbit

## Data Structure

```typescript
// From earth/index.ts
export const earthSystemBodies: CelestialObject<any>[] = [
  earth, // Earth planet
  moon, // Earth's Moon
  ...satellites, // Artificial satellites
];
```

## Usage Examples

### Accessing Earth System Objects

```typescript
import { earthSystemBodies } from "@teskooano/systems-solar-system";

// Get Earth
const earth = earthSystemBodies.find((obj) => obj.id === "earth");

// Get Moon
const moon = earthSystemBodies.find((obj) => obj.id === "moon");

// Get all satellites
const satellites = earthSystemBodies.filter((obj) => obj.type === "satellite");

// Get all objects
console.log("Earth system objects:", earthSystemBodies.length);
```

### Earth Properties

```typescript
import { earthSystemBodies } from "@teskooano/systems-solar-system";

const earth = earthSystemBodies.find((obj) => obj.id === "earth");

if (earth) {
  console.log("Earth Properties:");
  console.log("  Type:", earth.properties.planetType);
  console.log("  Mass:", earth.properties.mass, "kg");
  console.log("  Radius:", earth.properties.radius, "km");
  console.log("  Surface Gravity:", earth.properties.surfaceGravity, "m/s²");
  console.log(
    "  Atmospheric Pressure:",
    earth.properties.atmosphericPressure,
    "Pa",
  );
}
```

### Moon Properties

```typescript
import { earthSystemBodies } from "@teskooano/systems-solar-system";

const moon = earthSystemBodies.find((obj) => obj.id === "moon");

if (moon) {
  console.log("Moon Properties:");
  console.log("  Type:", moon.properties.satelliteType);
  console.log("  Mass:", moon.properties.mass, "kg");
  console.log("  Radius:", moon.properties.radius, "km");
  console.log("  Orbital Period:", moon.properties.orbitalPeriod, "days");
  console.log("  Surface Gravity:", moon.properties.surfaceGravity, "m/s²");
}
```

### Satellite Information

```typescript
import { earthSystemBodies } from "@teskooano/systems-solar-system";

const satellites = earthSystemBodies.filter((obj) => obj.type === "satellite");

satellites.forEach((satellite) => {
  console.log(`${satellite.name}:`);
  console.log(`  Type: ${satellite.properties.satelliteType}`);
  console.log(`  Orbit: ${satellite.properties.orbitType}`);
  console.log(`  Altitude: ${satellite.properties.altitude} km`);
});
```

## Earth System Hierarchy

The Earth system forms a hierarchical structure:

```
Earth (center)
├── Moon (natural satellite)
└── Artificial Satellites
    ├── International Space Station (ISS)
    ├── Hubble Space Telescope
    ├── James Webb Space Telescope
    ├── NOAA-19
    ├── Terra
    └── ... (other satellites)
```

## Physical Properties

### Earth's Planetary Properties

```typescript
interface PlanetProperties {
  planetType: "terrestrial";
  mass: 5.972e24; // kg
  radius: 6371; // km
  density: 5.514; // g/cm³
  surfaceGravity: 9.807; // m/s²
  atmosphericPressure: 101325; // Pa
  surfaceTemperature: 288; // K
  rotationPeriod: 0.997; // days
  axialTilt: 23.44; // degrees
  magneticField: 0.25; // G
}
```

### Moon's Satellite Properties

```typescript
interface SatelliteProperties {
  satelliteType: "natural";
  mass: 7.342e22; // kg
  radius: 1737.4; // km
  density: 3.344; // g/cm³
  surfaceGravity: 1.62; // m/s²
  orbitalPeriod: 27.3217; // days
  rotationPeriod: 27.3217; // days (tidally locked)
  surfaceTemperature: 220; // K
  magneticField: 0.0; // G (no global field)
}
```

### Satellite Properties

```typescript
interface SatelliteProperties {
  satelliteType: "artificial";
  orbitType: "LEO" | "GEO" | "Polar" | "Sun-synchronous" | "L2";
  altitude: number; // km
  inclination: number; // degrees
  period: number; // minutes
  launchDate: string; // ISO date
  mission: string; // mission description
}
```

## Orbital Dynamics

### Earth's Orbit

Earth orbits the Sun in an elliptical path:

- **Orbital Period**: 365.256 days (1 year)
- **Average Distance**: 149.6 million km (1 AU)
- **Perihelion**: 147.1 million km
- **Aphelion**: 152.1 million km
- **Orbital Speed**: 29.78 km/s (average)

### Moon's Orbit

The Moon orbits Earth in a complex pattern:

- **Orbital Period**: 27.3217 days (sidereal)
- **Synodic Period**: 29.5306 days (lunar month)
- **Average Distance**: 384,400 km
- **Perigee**: 356,500 km
- **Apogee**: 406,700 km
- **Orbital Speed**: 1.022 km/s (average)

### Satellite Orbits

Artificial satellites use various orbital configurations:

- **Low Earth Orbit (LEO)**: 160-2,000 km altitude
- **Geostationary Orbit (GEO)**: 35,786 km altitude
- **Polar Orbit**: High inclination orbits
- **Sun-synchronous**: Precessing orbits
- **Lagrange Points**: L1, L2, L3, L4, L5

## Atmospheric and Surface Properties

### Earth's Atmosphere

- **Composition**: 78% N₂, 21% O₂, 1% other gases
- **Surface Pressure**: 101.325 kPa
- **Scale Height**: 8.5 km
- **Temperature Profile**: Troposphere, stratosphere, mesosphere, thermosphere
- **Weather Systems**: Complex atmospheric circulation

### Earth's Surface

- **Land Coverage**: 29.2% (148.9 million km²)
- **Water Coverage**: 70.8% (361.1 million km²)
- **Highest Point**: Mount Everest (8,848 m)
- **Lowest Point**: Mariana Trench (-11,034 m)
- **Average Elevation**: 840 m above sea level

### Moon's Surface

- **Composition**: Basaltic rock, regolith
- **Surface Features**: Craters, maria, highlands
- **Largest Crater**: South Pole-Aitken Basin
- **Surface Temperature**: 100-400 K (day/night cycle)
- **No Atmosphere**: Vacuum conditions

## Integration with Solar System

### System Position

Earth is the third planet from the Sun:

1. **Mercury** (0.39 AU)
2. **Venus** (0.72 AU)
3. **Earth** (1.00 AU) ← Our position
4. **Mars** (1.52 AU)
5. **Jupiter** (5.20 AU)
6. **Saturn** (9.58 AU)
7. **Uranus** (19.22 AU)
8. **Neptune** (30.05 AU)

### Gravitational Interactions

Earth interacts with:

- **Sun**: Primary gravitational force
- **Moon**: Tidal effects and orbital stability
- **Other Planets**: Minor perturbations
- **Asteroids/Comets**: Occasional close approaches

## Best Practices

1. **Reference Frame**: Use Earth as reference for terrestrial observations
2. **Time Systems**: Use Earth-based time (UTC, local time)
3. **Coordinate Systems**: Use Earth-centered coordinate systems
4. **Atmospheric Effects**: Account for atmospheric refraction
5. **Satellite Tracking**: Monitor artificial satellite positions

## Related

- [[earth]] - Detailed Earth object documentation
- [[moon]] - Detailed Moon object documentation
- [[satellites]] - Detailed satellite documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
