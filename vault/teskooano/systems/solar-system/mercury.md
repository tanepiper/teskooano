# Mercury System

The Mercury system containing the planet Mercury and its associated objects. Mercury is the innermost planet in our solar system, orbiting closest to the Sun.

## Overview

Mercury is the smallest and innermost planet in our solar system, with extreme temperature variations and a unique orbital pattern. It has no natural satellites but is an important object for understanding planetary formation and solar system dynamics.

## Components

### Mercury

The innermost planet, known for its extreme temperatures and unique orbital characteristics.

**Key Properties**:

- **Type**: Terrestrial planet
- **Mass**: 3.301 × 10²³ kg (0.055 Earth masses)
- **Radius**: 2,439.7 km (0.383 Earth radii)
- **Density**: 5.427 g/cm³
- **Surface Gravity**: 3.7 m/s²
- **Surface Temperature**: 100-700 K (day/night cycle)
- **Orbital Period**: 87.97 days

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 57,909,050 km (0.387 AU)
- **Eccentricity**: 0.205630
- **Inclination**: 7.00487°
- **Longitude of Ascending Node**: 48.33167°
- **Argument of Periapsis**: 29.12478°
- **Mean Anomaly**: 174.7948°

## Data Structure

```typescript
// From mercury/index.ts
export const mercury: CelestialObject<any>[] = [
  mercuryPlanet, // Mercury planet (no moons)
];
```

## Usage Examples

### Accessing Mercury

```typescript
import { mercury } from "@teskooano/systems-solar-system";

// Get Mercury planet
const mercuryPlanet = mercury.find((obj) => obj.id === "mercury");

// Get all Mercury system objects
console.log("Mercury system objects:", mercury.length);
```

### Mercury Properties

```typescript
import { mercury } from "@teskooano/systems-solar-system";

const mercuryPlanet = mercury.find((obj) => obj.id === "mercury");

if (mercuryPlanet) {
  console.log("Mercury Properties:");
  console.log("  Type:", mercuryPlanet.properties.planetType);
  console.log("  Mass:", mercuryPlanet.properties.mass, "kg");
  console.log("  Radius:", mercuryPlanet.properties.radius, "km");
  console.log(
    "  Surface Gravity:",
    mercuryPlanet.properties.surfaceGravity,
    "m/s²",
  );
  console.log(
    "  Orbital Period:",
    mercuryPlanet.properties.orbitalPeriod,
    "days",
  );
}
```

### Orbital Information

```typescript
import { mercury } from "@teskooano/systems-solar-system";

const mercuryPlanet = mercury.find((obj) => obj.id === "mercury");

if (mercuryPlanet && mercuryPlanet.orbit) {
  console.log("Mercury Orbital Elements:");
  console.log("  Semi-major Axis:", mercuryPlanet.orbit.semiMajorAxis, "km");
  console.log("  Eccentricity:", mercuryPlanet.orbit.eccentricity);
  console.log("  Inclination:", mercuryPlanet.orbit.inclination, "degrees");
  console.log("  Orbital Period:", mercuryPlanet.orbit.period, "days");
}
```

## Physical Properties

### Mercury's Planetary Properties

```typescript
interface PlanetProperties {
  planetType: "terrestrial";
  mass: 3.301e23; // kg
  radius: 2439.7; // km
  density: 5.427; // g/cm³
  surfaceGravity: 3.7; // m/s²
  surfaceTemperature: 440; // K (average)
  rotationPeriod: 58.646; // days
  axialTilt: 0.034; // degrees
  magneticField: 0.003; // G
  atmosphericPressure: 0; // Pa (no atmosphere)
}
```

## Unique Characteristics

### Extreme Temperature Variations

Mercury experiences the most extreme temperature variations in the solar system:

- **Daytime Temperature**: Up to 700 K (427°C)
- **Nighttime Temperature**: Down to 100 K (-173°C)
- **Temperature Range**: 600 K difference
- **Cause**: No atmosphere to retain heat

### Orbital Resonance

Mercury has a unique 3:2 spin-orbit resonance:

- **Orbital Period**: 87.97 days
- **Rotation Period**: 58.646 days
- **Resonance Ratio**: 3:2 (3 rotations per 2 orbits)
- **Effect**: Creates complex day-night cycles

### Surface Features

Mercury's surface is heavily cratered and geologically diverse:

- **Crater Density**: Very high (similar to Moon)
- **Largest Crater**: Caloris Basin (1,550 km diameter)
- **Surface Composition**: Basaltic rock, regolith
- **Geological Activity**: Limited (no plate tectonics)

## Orbital Dynamics

### Heliocentric Orbit

Mercury orbits the Sun in a highly elliptical path:

- **Orbital Period**: 87.97 days (0.24 years)
- **Average Distance**: 57.9 million km (0.387 AU)
- **Perihelion**: 46.0 million km (0.307 AU)
- **Aphelion**: 69.8 million km (0.467 AU)
- **Orbital Speed**: 47.87 km/s (average)

### Orbital Precession

Mercury's orbit exhibits significant precession:

- **Precession Rate**: 43 arcseconds per century
- **Cause**: General relativity effects
- **Historical Significance**: Confirmed Einstein's theory
- **Modern Measurement**: Very precise tracking

### Solar System Position

Mercury is the innermost planet:

1. **Mercury** (0.387 AU) ← Our position
2. **Venus** (0.723 AU)
3. **Earth** (1.000 AU)
4. **Mars** (1.524 AU)
5. **Jupiter** (5.203 AU)
6. **Saturn** (9.537 AU)
7. **Uranus** (19.191 AU)
8. **Neptune** (30.069 AU)

## Atmospheric and Surface Properties

### No Atmosphere

Mercury has virtually no atmosphere:

- **Surface Pressure**: ~10⁻¹⁵ Pa (exosphere only)
- **Composition**: Trace amounts of hydrogen, helium, oxygen
- **Source**: Solar wind and surface outgassing
- **Effect**: No weather or atmospheric protection

### Surface Environment

Mercury's surface is harsh and inhospitable:

- **Radiation**: Intense solar radiation
- **Micrometeorites**: Constant bombardment
- **Thermal Stress**: Extreme temperature cycling
- **Vacuum**: Hard vacuum conditions

## Exploration History

### Spacecraft Missions

Mercury has been visited by several spacecraft:

- **Mariner 10** (1974-1975): First flyby mission
- **MESSENGER** (2004-2015): Orbital mission
- **BepiColombo** (2018-present): Joint ESA/JAXA mission

### Key Discoveries

- **Magnetic Field**: Unexpected global magnetic field
- **Water Ice**: Ice in permanently shadowed craters
- **Surface Composition**: Volatile-rich surface materials
- **Orbital Dynamics**: Precise orbital measurements

## Integration with Solar System

### Gravitational Interactions

Mercury interacts with:

- **Sun**: Dominant gravitational force
- **Venus**: Occasional close approaches
- **Other Planets**: Minor perturbations
- **General Relativity**: Significant orbital effects

### Solar System Dynamics

Mercury plays a role in:

- **Solar System Stability**: Inner planet dynamics
- **Orbital Resonances**: Complex gravitational interactions
- **Planetary Formation**: Understanding terrestrial planet evolution
- **Solar System Evolution**: Long-term stability studies

## Best Practices

1. **Temperature Modeling**: Account for extreme temperature variations
2. **Orbital Calculations**: Include general relativity effects
3. **Surface Rendering**: Show cratered, airless surface
4. **Solar Proximity**: Handle intense solar radiation
5. **Orbital Resonance**: Model 3:2 spin-orbit coupling

## Related

- [[mercury]] - Detailed Mercury object documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Surface rendering
