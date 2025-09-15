# Mars System

The Mars system containing the planet Mars and its two natural satellites, Phobos and Deimos. Mars is the fourth planet from the Sun and is often called the "Red Planet" due to its reddish appearance.

## Overview

Mars is the fourth planet from the Sun and is known for its red color, thin atmosphere, and two small moons. It has been a focus of exploration due to its potential for past or present life and its suitability for future human colonization.

## Components

### Mars

The fourth planet from the Sun, known as the "Red Planet" due to iron oxide on its surface.

**Key Properties**:

- **Type**: Terrestrial planet
- **Mass**: 6.417 × 10²³ kg (0.107 Earth masses)
- **Radius**: 3,389.5 km (0.532 Earth radii)
- **Density**: 3.933 g/cm³
- **Surface Gravity**: 3.71 m/s²
- **Surface Temperature**: 210 K (-63°C average)
- **Orbital Period**: 686.98 days

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 227,943,824 km (1.524 AU)
- **Eccentricity**: 0.0934
- **Inclination**: 1.85061°
- **Longitude of Ascending Node**: 49.57854°
- **Argument of Periapsis**: 286.46230°
- **Mean Anomaly**: 19.41248°

### Phobos

Mars's larger and closer moon, named after the Greek god of fear.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 1.0659 × 10¹⁶ kg
- **Radius**: 11.2667 km
- **Density**: 1.876 g/cm³
- **Surface Gravity**: 0.0057 m/s²
- **Orbital Period**: 0.3189 days (7.66 hours)

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 9,376 km
- **Eccentricity**: 0.0151
- **Inclination**: 1.093°
- **Longitude of Ascending Node**: 207.784°
- **Argument of Periapsis**: 150.057°
- **Mean Anomaly**: 92.335°

### Deimos

Mars's smaller and more distant moon, named after the Greek god of terror.

**Key Properties**:

- **Type**: Natural satellite
- **Mass**: 1.4762 × 10¹⁵ kg
- **Radius**: 6.2 km
- **Density**: 1.471 g/cm³
- **Surface Gravity**: 0.003 m/s²
- **Orbital Period**: 1.2624 days (30.3 hours)

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 23,463 km
- **Eccentricity**: 0.0002
- **Inclination**: 0.93°
- **Longitude of Ascending Node**: 339.392°
- **Argument of Periapsis**: 260.729°
- **Mean Anomaly**: 285.161°

## Data Structure

```typescript
// From mars/index.ts
export const mars: CelestialObject<any>[] = [
  marsPlanet, // Mars planet
  phobos, // Phobos moon
  deimos, // Deimos moon
];
```

## Usage Examples

### Accessing Mars System Objects

```typescript
import { mars } from "@teskooano/systems-solar-system";

// Get Mars planet
const marsPlanet = mars.find((obj) => obj.id === "mars");

// Get Phobos moon
const phobos = mars.find((obj) => obj.id === "phobos");

// Get Deimos moon
const deimos = mars.find((obj) => obj.id === "deimos");

// Get all Mars system objects
console.log("Mars system objects:", mars.length);
```

### Mars Properties

```typescript
import { mars } from "@teskooano/systems-solar-system";

const marsPlanet = mars.find((obj) => obj.id === "mars");

if (marsPlanet) {
  console.log("Mars Properties:");
  console.log("  Type:", marsPlanet.properties.planetType);
  console.log("  Mass:", marsPlanet.properties.mass, "kg");
  console.log("  Radius:", marsPlanet.properties.radius, "km");
  console.log(
    "  Surface Gravity:",
    marsPlanet.properties.surfaceGravity,
    "m/s²",
  );
  console.log(
    "  Surface Temperature:",
    marsPlanet.properties.surfaceTemperature,
    "K",
  );
}
```

### Moon Properties

```typescript
import { mars } from "@teskooano/systems-solar-system";

const phobos = mars.find((obj) => obj.id === "phobos");
const deimos = mars.find((obj) => obj.id === "deimos");

if (phobos) {
  console.log("Phobos Properties:");
  console.log("  Mass:", phobos.properties.mass, "kg");
  console.log("  Radius:", phobos.properties.radius, "km");
  console.log("  Orbital Period:", phobos.properties.orbitalPeriod, "days");
}

if (deimos) {
  console.log("Deimos Properties:");
  console.log("  Mass:", deimos.properties.mass, "kg");
  console.log("  Radius:", deimos.properties.radius, "km");
  console.log("  Orbital Period:", deimos.properties.orbitalPeriod, "days");
}
```

## Physical Properties

### Mars's Planetary Properties

```typescript
interface PlanetProperties {
  planetType: "terrestrial";
  mass: 6.417e23; // kg
  radius: 3389.5; // km
  density: 3.933; // g/cm³
  surfaceGravity: 3.71; // m/s²
  surfaceTemperature: 210; // K
  rotationPeriod: 1.026; // days
  axialTilt: 25.19; // degrees
  magneticField: 0.0; // G (no global field)
  atmosphericPressure: 636; // Pa (0.006 bar)
}
```

### Phobos's Satellite Properties

```typescript
interface SatelliteProperties {
  satelliteType: "natural";
  mass: 1.0659e16; // kg
  radius: 11.2667; // km
  density: 1.876; // g/cm³
  surfaceGravity: 0.0057; // m/s²
  orbitalPeriod: 0.3189; // days
  rotationPeriod: 0.3189; // days (tidally locked)
  surfaceTemperature: 233; // K
  magneticField: 0.0; // G
}
```

### Deimos's Satellite Properties

```typescript
interface SatelliteProperties {
  satelliteType: "natural";
  mass: 1.4762e15; // kg
  radius: 6.2; // km
  density: 1.471; // g/cm³
  surfaceGravity: 0.003; // m/s²
  orbitalPeriod: 1.2624; // days
  rotationPeriod: 1.2624; // days (tidally locked)
  surfaceTemperature: 233; // K
  magneticField: 0.0; // G
}
```

## Unique Characteristics

### Red Color

Mars appears red due to iron oxide (rust) on its surface:

- **Surface Composition**: Iron oxide, basalt, and other minerals
- **Color**: Reddish-orange appearance
- **Cause**: Oxidation of iron in the surface rocks
- **Atmospheric Effect**: Dust storms enhance the red color

### Thin Atmosphere

Mars has a very thin atmosphere:

- **Surface Pressure**: 636 Pa (0.006 bar)
- **Composition**: 95.3% CO₂, 2.7% N₂, 1.6% Ar
- **Density**: 0.02 kg/m³ (very low)
- **Effect**: Limited protection from radiation

### Polar Ice Caps

Mars has permanent ice caps at both poles:

- **North Pole**: Water ice and CO₂ ice
- **South Pole**: Primarily CO₂ ice
- **Seasonal Changes**: Ice caps grow and shrink with seasons
- **Composition**: Water ice, dry ice (CO₂), and dust

## Orbital Dynamics

### Mars's Orbit

Mars orbits the Sun in an elliptical path:

- **Orbital Period**: 686.98 days (1.88 years)
- **Average Distance**: 227.9 million km (1.524 AU)
- **Perihelion**: 206.6 million km (1.381 AU)
- **Aphelion**: 249.2 million km (1.666 AU)
- **Orbital Speed**: 24.07 km/s (average)

### Moon Orbits

Both moons orbit Mars in different patterns:

**Phobos**:

- **Orbital Period**: 7.66 hours (faster than Mars rotation)
- **Distance**: 9,376 km from Mars center
- **Orbital Speed**: 2.14 km/s
- **Tidal Effects**: Gradually spiraling inward

**Deimos**:

- **Orbital Period**: 30.3 hours (slower than Mars rotation)
- **Distance**: 23,463 km from Mars center
- **Orbital Speed**: 1.35 km/s
- **Tidal Effects**: Gradually spiraling outward

## Atmospheric and Surface Properties

### Atmospheric Composition

Mars's thin atmosphere consists of:

- **Carbon Dioxide**: 95.3%
- **Nitrogen**: 2.7%
- **Argon**: 1.6%
- **Oxygen**: 0.13%
- **Carbon Monoxide**: 0.08%
- **Water Vapor**: 0.03%

### Surface Features

Mars has diverse surface features:

- **Volcanoes**: Olympus Mons (largest in solar system)
- **Canyons**: Valles Marineris (largest canyon system)
- **Craters**: Impact craters from meteorites
- **Plains**: Vast volcanic plains
- **Polar Regions**: Ice caps and layered terrain

### Weather and Climate

Mars has active weather systems:

- **Dust Storms**: Global dust storms that can last months
- **Seasonal Changes**: Temperature and pressure variations
- **Wind Patterns**: Strong winds and dust devils
- **Temperature Range**: -143°C to 35°C

## Exploration History

### Spacecraft Missions

Mars has been extensively explored:

- **Mariner 4** (1965): First successful flyby
- **Viking Program** (1975-1982): First successful landings
- **Mars Global Surveyor** (1996-2006): Orbital mapping
- **Mars Pathfinder** (1997): First rover mission
- **Mars Exploration Rovers** (2003-2018): Spirit and Opportunity
- **Mars Reconnaissance Orbiter** (2005-present): High-resolution imaging
- **Curiosity Rover** (2012-present): Advanced science mission
- **Perseverance Rover** (2021-present): Sample collection mission

### Key Discoveries

- **Water Evidence**: Past liquid water on surface
- **Atmospheric History**: Thicker atmosphere in the past
- **Geological Activity**: Volcanic and tectonic features
- **Potential Life**: Conditions suitable for microbial life
- **Resource Potential**: Water ice and other resources

## Integration with Solar System

### Gravitational Interactions

Mars interacts with:

- **Sun**: Primary gravitational force
- **Earth**: Occasional close approaches
- **Jupiter**: Minor perturbations
- **Asteroid Belt**: Gravitational influence

### Solar System Dynamics

Mars plays a role in:

- **Inner Planet Stability**: Terrestrial planet dynamics
- **Asteroid Belt**: Gravitational influence on asteroids
- **Planetary Formation**: Understanding terrestrial planet evolution
- **Exploration**: Primary target for human spaceflight

## Best Practices

1. **Atmospheric Modeling**: Account for thin, CO₂-rich atmosphere
2. **Surface Rendering**: Show red color and diverse terrain
3. **Moon Dynamics**: Model Phobos and Deimos orbits
4. **Weather Effects**: Display dust storms and seasonal changes
5. **Exploration History**: Show landing sites and rover tracks

## Related

- [[mars]] - Detailed Mars object documentation
- [[phobos]] - Detailed Phobos object documentation
- [[deimos]] - Detailed Deimos object documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Surface and atmospheric rendering
