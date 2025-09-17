---
aliases: [artificial-satellites, satellites, space-probes, spacecraft]
tags: [systems, solar-system, satellites, spacecraft, astronomy]
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
    "createOrbitalElementsFromTLE",
  ]
constants:
  [
    "iss",
    "hubble",
    "noaa19",
    "ses1",
    "terra",
    "jwst",
    "voyager1",
    "voyager2",
  ]
types:
  [
    "CelestialObject",
    "SatelliteProperties",
  ]
status: active
---

# Artificial Satellites

A collection of artificial satellites and space probes that orbit Earth and other celestial bodies. These human-made objects represent our exploration and utilization of space.

## Overview

Artificial satellites are human-made objects that orbit Earth or other celestial bodies. They serve various purposes including communication, navigation, Earth observation, scientific research, and space exploration. This collection includes both operational and historical satellites.

## Components

### Earth Satellites

Satellites that orbit Earth:

#### International Space Station (ISS)

The largest human-made object in space, serving as a microgravity laboratory.

**Key Properties**:

- **Type**: Space station
- **Mass**: 450,000 kg
- **Dimensions**: 109 × 73 × 20 meters
- **Orbit**: Low Earth orbit (LEO)
- **Altitude**: 408 km (average)
- **Inclination**: 51.6°
- **Orbital Period**: 92.68 minutes
- **Launch Date**: 1998

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 6,778 km
- **Eccentricity**: 0.0001
- **Inclination**: 51.6°
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

#### Hubble Space Telescope

A space telescope that has revolutionized astronomy.

**Key Properties**:

- **Type**: Space telescope
- **Mass**: 11,110 kg
- **Dimensions**: 13.2 × 4.2 meters
- **Orbit**: Low Earth orbit (LEO)
- **Altitude**: 540 km (average)
- **Inclination**: 28.5°
- **Orbital Period**: 95.42 minutes
- **Launch Date**: 1990

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 6,910 km
- **Eccentricity**: 0.0002
- **Inclination**: 28.5°
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

#### James Webb Space Telescope (JWST)

The most powerful space telescope ever built.

**Key Properties**:

- **Type**: Space telescope
- **Mass**: 6,500 kg
- **Dimensions**: 20.2 × 14.2 meters (deployed)
- **Orbit**: L2 Lagrange point
- **Distance**: 1.5 million km from Earth
- **Orbital Period**: 365.25 days (heliocentric)
- **Launch Date**: 2021

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 1.5 × 10⁶ km
- **Eccentricity**: 0.0
- **Inclination**: 0.0°
- **Longitude of Ascending Node**: 0.0°
- **Argument of Periapsis**: 0.0°
- **Mean Anomaly**: Variable

### Deep Space Probes

Spacecraft that have left Earth's orbit:

#### Voyager 1

The farthest human-made object from Earth.

**Key Properties**:

- **Type**: Deep space probe
- **Mass**: 825 kg
- **Dimensions**: 3.7 × 3.7 × 0.5 meters
- **Orbit**: Interstellar space
- **Distance**: 23.8 billion km from Earth
- **Velocity**: 17.0 km/s
- **Launch Date**: 1977

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: -∞ (hyperbolic)
- **Eccentricity**: > 1.0
- **Inclination**: Variable
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

#### Voyager 2

A deep space probe that has visited all four outer planets.

**Key Properties**:

- **Type**: Deep space probe
- **Mass**: 825 kg
- **Dimensions**: 3.7 × 3.7 × 0.5 meters
- **Orbit**: Interstellar space
- **Distance**: 19.9 billion km from Earth
- **Velocity**: 15.4 km/s
- **Launch Date**: 1977

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: -∞ (hyperbolic)
- **Eccentricity**: > 1.0
- **Inclination**: Variable
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

### Communications Satellites

Satellites that provide communication services:

#### NOAA-19

A weather satellite that monitors Earth's atmosphere.

**Key Properties**:

- **Type**: Weather satellite
- **Mass**: 1,420 kg
- **Dimensions**: 4.2 × 2.4 × 2.4 meters
- **Orbit**: Polar orbit
- **Altitude**: 870 km
- **Inclination**: 98.7°
- **Orbital Period**: 102.12 minutes
- **Launch Date**: 2009

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 7,248 km
- **Eccentricity**: 0.0001
- **Inclination**: 98.7°
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

#### Terra

A NASA Earth observation satellite.

**Key Properties**:

- **Type**: Earth observation satellite
- **Mass**: 4,864 kg
- **Dimensions**: 6.8 × 3.5 × 3.5 meters
- **Orbit**: Sun-synchronous orbit
- **Altitude**: 705 km
- **Inclination**: 98.2°
- **Orbital Period**: 98.88 minutes
- **Launch Date**: 1999

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 7,083 km
- **Eccentricity**: 0.0001
- **Inclination**: 98.2°
- **Longitude of Ascending Node**: Variable
- **Argument of Periapsis**: Variable
- **Mean Anomaly**: Variable

## Data Structure

```typescript
// From artificialSatellites/index.ts
export const artificialSatellites: CelestialObject<any>[] = [
  iss, // International Space Station
  hubble, // Hubble Space Telescope
  jwst, // James Webb Space Telescope
  voyager1, // Voyager 1
  voyager2, // Voyager 2
  noaa19, // NOAA-19
  terra, // Terra
  // ... other satellites
];
```

## Usage Examples

### Accessing Artificial Satellites

```typescript
import { artificialSatellites } from "@teskooano/systems-solar-system";

// Get specific satellites
const iss = artificialSatellites.find((obj) => obj.id === "iss");
const hubble = artificialSatellites.find((obj) => obj.id === "hubble");
const jwst = artificialSatellites.find((obj) => obj.id === "jwst");

// Get all satellites
console.log("Total artificial satellites:", artificialSatellites.length);

// Filter by type
const spaceStations = artificialSatellites.filter(
  (obj) => obj.type === "space-station",
);
const telescopes = artificialSatellites.filter(
  (obj) => obj.type === "space-telescope",
);
const probes = artificialSatellites.filter((obj) => obj.type === "space-probe");
```

### Satellite Properties

```typescript
import { artificialSatellites } from "@teskooano/systems-solar-system";

const iss = artificialSatellites.find((obj) => obj.id === "iss");

if (iss) {
  console.log("ISS Properties:");
  console.log("  Type:", iss.properties.satelliteType);
  console.log("  Mass:", iss.properties.mass, "kg");
  console.log("  Dimensions:", iss.properties.dimensions);
  console.log("  Orbit Type:", iss.properties.orbitType);
  console.log("  Altitude:", iss.properties.altitude, "km");
}
```

### Orbital Information

```typescript
import { artificialSatellites } from "@teskooano/systems-solar-system";

artificialSatellites.forEach((satellite) => {
  if (satellite.orbit) {
    console.log(`${satellite.name} Orbital Elements:`);
    console.log(`  Semi-major Axis: ${satellite.orbit.semiMajorAxis} km`);
    console.log(`  Eccentricity: ${satellite.orbit.eccentricity}`);
    console.log(`  Inclination: ${satellite.orbit.inclination} degrees`);
    console.log(`  Orbital Period: ${satellite.orbit.period} minutes`);
  }
});
```

## Physical Properties

### Satellite Properties

```typescript
interface SatelliteProperties {
  satelliteType:
    | "space-station"
    | "space-telescope"
    | "space-probe"
    | "weather-satellite"
    | "communication-satellite";
  mass: number; // kg
  dimensions: string; // length × width × height
  orbitType: string; // LEO, GEO, polar, sun-synchronous, L2, etc.
  altitude: number; // km
  inclination: number; // degrees
  period: number; // minutes
  launchDate: string; // date
  mission: string; // mission description
  status: string; // operational, decommissioned, etc.
}
```

## Unique Characteristics

### Orbit Types

Artificial satellites use various orbital configurations:

- **Low Earth Orbit (LEO)**: 160-2,000 km altitude
- **Geostationary Orbit (GEO)**: 35,786 km altitude
- **Polar Orbit**: High inclination orbits
- **Sun-synchronous**: Precessing orbits
- **Lagrange Points**: L1, L2, L3, L4, L5

### Mission Types

Satellites serve various purposes:

- **Communication**: Global communication networks
- **Navigation**: GPS and positioning systems
- **Earth Observation**: Weather, climate, and environmental monitoring
- **Scientific Research**: Astronomy, physics, and biology
- **Space Exploration**: Planetary and deep space missions

### Operational Status

Satellites have different operational states:

- **Operational**: Currently active and functioning
- **Decommissioned**: No longer operational
- **Planned**: Future missions
- **Historical**: Past missions

## Orbital Dynamics

### Earth Orbiting Satellites

Satellites in Earth orbit:

- **Orbital Period**: 90-100 minutes (LEO)
- **Orbital Speed**: 7.8 km/s (LEO)
- **Atmospheric Drag**: Affects LEO satellites
- **Orbital Decay**: Gradual altitude loss

### Deep Space Probes

Spacecraft that have left Earth's orbit:

- **Interstellar Space**: Beyond heliosphere
- **Hyperbolic Orbits**: Escape trajectories
- **Gravity Assists**: Planetary flybys
- **Long-term Missions**: Decades of operation

## Surface and Composition

### Satellite Construction

Artificial satellites are built from:

- **Aluminum**: Primary structural material
- **Titanium**: High-strength components
- **Carbon Fiber**: Lightweight structures
- **Solar Panels**: Power generation
- **Antennas**: Communication systems
- **Instruments**: Scientific payloads

### Power Systems

Satellites use various power sources:

- **Solar Panels**: Primary power source
- **Batteries**: Energy storage
- **Radioisotope Generators**: Deep space missions
- **Fuel Cells**: Backup power

## Exploration History

### Launch History

Artificial satellites have been launched since:

- **Sputnik 1** (1957): First artificial satellite
- **Explorer 1** (1958): First US satellite
- **Vostok 1** (1961): First human spaceflight
- **Apollo 11** (1969): First human Moon landing
- **Space Shuttle** (1981-2011): Reusable spacecraft
- **International Space Station** (1998-present): Continuous human presence

### Key Achievements

- **Communication**: Global communication networks
- **Navigation**: GPS and positioning systems
- **Earth Observation**: Weather and climate monitoring
- **Scientific Research**: Astronomy and physics
- **Space Exploration**: Planetary and deep space missions

## Integration with Solar System

### Gravitational Interactions

Artificial satellites interact with:

- **Earth**: Primary gravitational force
- **Moon**: Tidal effects
- **Sun**: Solar radiation pressure
- **Other Planets**: Gravity assists

### Solar System Dynamics

Artificial satellites play a role in:

- **Space Exploration**: Human presence in space
- **Scientific Research**: Understanding the universe
- **Technology Development**: Advanced space systems
- **International Cooperation**: Global space programs

## Best Practices

1. **Orbital Modeling**: Account for various orbit types
2. **Surface Rendering**: Show satellite structures and instruments
3. **Mission Simulation**: Model satellite operations
4. **Orbital Dynamics**: Include atmospheric drag and perturbations
5. **Status Tracking**: Display operational status

## Related

- [[iss]] - Detailed ISS object documentation
- [[hubble]] - Detailed Hubble Space Telescope object documentation
- [[jwst]] - Detailed James Webb Space Telescope object documentation
- [[voyager1]] - Detailed Voyager 1 object documentation
- [[voyager2]] - Detailed Voyager 2 object documentation
- [[noaa19]] - Detailed NOAA-19 object documentation
- [[terra]] - Detailed Terra object documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Satellite rendering
