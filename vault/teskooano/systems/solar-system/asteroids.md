# Asteroids

A collection of major asteroids in our solar system, including the largest asteroids in the main belt and other significant minor planets. These objects provide insights into the early solar system and planetary formation.

## Overview

Asteroids are rocky objects that orbit the Sun, primarily located in the asteroid belt between Mars and Jupiter. They range in size from small rocks to dwarf planets and are remnants from the early solar system formation.

## Components

### Major Asteroids

The collection includes the largest and most significant asteroids:

#### Ceres

The largest object in the asteroid belt and the only dwarf planet in the inner solar system.

**Key Properties**:

- **Type**: Dwarf planet
- **Mass**: 9.3835 × 10²⁰ kg
- **Radius**: 469.7 km
- **Density**: 2.162 g/cm³
- **Surface Gravity**: 0.28 m/s²
- **Orbital Period**: 4.60 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 414,001,000 km (2.767 AU)
- **Eccentricity**: 0.0758
- **Inclination**: 10.59°
- **Longitude of Ascending Node**: 80.33°
- **Argument of Periapsis**: 72.59°
- **Mean Anomaly**: 77.37°

#### Vesta

The second-largest asteroid and the brightest asteroid visible from Earth.

**Key Properties**:

- **Type**: Asteroid
- **Mass**: 2.5908 × 10²⁰ kg
- **Radius**: 262.7 km
- **Density**: 3.456 g/cm³
- **Surface Gravity**: 0.25 m/s²
- **Orbital Period**: 3.63 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 353,201,000 km (2.361 AU)
- **Eccentricity**: 0.0887
- **Inclination**: 7.14°
- **Longitude of Ascending Node**: 103.91°
- **Argument of Periapsis**: 151.20°
- **Mean Anomaly**: 309.17°

#### Pallas

The third-largest asteroid and one of the most massive asteroids.

**Key Properties**:

- **Type**: Asteroid
- **Mass**: 2.1088 × 10²⁰ kg
- **Radius**: 256.0 km
- **Density**: 2.989 g/cm³
- **Surface Gravity**: 0.22 m/s²
- **Orbital Period**: 4.62 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 414,701,000 km (2.772 AU)
- **Eccentricity**: 0.2313
- **Inclination**: 34.84°
- **Longitude of Ascending Node**: 173.13°
- **Argument of Periapsis**: 310.76°
- **Mean Anomaly**: 181.41°

#### Hygiea

The fourth-largest asteroid and the largest carbonaceous asteroid.

**Key Properties**:

- **Type**: Asteroid
- **Mass**: 8.67 × 10¹⁹ kg
- **Radius**: 215.0 km
- **Density**: 2.06 g/cm³
- **Surface Gravity**: 0.15 m/s²
- **Orbital Period**: 5.56 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 470,300,000 km (3.139 AU)
- **Eccentricity**: 0.1146
- **Inclination**: 3.84°
- **Longitude of Ascending Node**: 283.45°
- **Argument of Periapsis**: 312.33°
- **Mean Anomaly**: 313.19°

### Near-Earth Asteroids

Asteroids that come close to Earth's orbit:

#### Eros

A near-Earth asteroid and the first asteroid to be orbited by a spacecraft.

**Key Properties**:

- **Type**: Near-Earth asteroid
- **Mass**: 6.687 × 10¹⁵ kg
- **Radius**: 16.84 km
- **Density**: 2.67 g/cm³
- **Surface Gravity**: 0.0023 m/s²
- **Orbital Period**: 1.76 years

#### Apophis

A near-Earth asteroid that was initially thought to pose a collision risk with Earth.

**Key Properties**:

- **Type**: Near-Earth asteroid
- **Mass**: 6.1 × 10¹⁰ kg
- **Radius**: 0.185 km
- **Density**: 2.6 g/cm³
- **Surface Gravity**: 0.00012 m/s²
- **Orbital Period**: 0.89 years

## Data Structure

```typescript
// From asteroids/index.ts
export const asteroids: CelestialObject<any>[] = [
  ceres, // Dwarf planet
  vesta, // Second largest asteroid
  pallas, // Third largest asteroid
  hygiea, // Fourth largest asteroid
  eros, // Near-Earth asteroid
  apophis, // Near-Earth asteroid
  // ... other asteroids
];
```

## Usage Examples

### Accessing Asteroids

```typescript
import { asteroids } from "@teskooano/systems-solar-system";

// Get specific asteroids
const ceres = asteroids.find((obj) => obj.id === "ceres");
const vesta = asteroids.find((obj) => obj.id === "vesta");
const pallas = asteroids.find((obj) => obj.id === "pallas");

// Get all asteroids
console.log("Total asteroids:", asteroids.length);

// Filter by type
const dwarfPlanets = asteroids.filter((obj) => obj.type === "dwarf-planet");
const nearEarthAsteroids = asteroids.filter(
  (obj) => obj.type === "near-earth-asteroid",
);
```

### Asteroid Properties

```typescript
import { asteroids } from "@teskooano/systems-solar-system";

const ceres = asteroids.find((obj) => obj.id === "ceres");

if (ceres) {
  console.log("Ceres Properties:");
  console.log("  Type:", ceres.properties.planetType);
  console.log("  Mass:", ceres.properties.mass, "kg");
  console.log("  Radius:", ceres.properties.radius, "km");
  console.log("  Surface Gravity:", ceres.properties.surfaceGravity, "m/s²");
  console.log("  Orbital Period:", ceres.properties.orbitalPeriod, "years");
}
```

### Orbital Information

```typescript
import { asteroids } from "@teskooano/systems-solar-system";

asteroids.forEach((asteroid) => {
  if (asteroid.orbit) {
    console.log(`${asteroid.name} Orbital Elements:`);
    console.log(`  Semi-major Axis: ${asteroid.orbit.semiMajorAxis} km`);
    console.log(`  Eccentricity: ${asteroid.orbit.eccentricity}`);
    console.log(`  Inclination: ${asteroid.orbit.inclination} degrees`);
    console.log(`  Orbital Period: ${asteroid.orbit.period} years`);
  }
});
```

## Physical Properties

### Asteroid Properties

```typescript
interface AsteroidProperties {
  asteroidType: "main-belt" | "near-earth" | "trojan" | "centaur";
  mass: number; // kg
  radius: number; // km
  density: number; // g/cm³
  surfaceGravity: number; // m/s²
  orbitalPeriod: number; // years
  rotationPeriod: number; // hours
  surfaceTemperature: number; // K
  albedo: number; // reflectivity
  composition: string; // rock, metal, ice
}
```

### Dwarf Planet Properties

```typescript
interface DwarfPlanetProperties {
  planetType: "dwarf-planet";
  mass: number; // kg
  radius: number; // km
  density: number; // g/cm³
  surfaceGravity: number; // m/s²
  orbitalPeriod: number; // years
  rotationPeriod: number; // hours
  surfaceTemperature: number; // K
  albedo: number; // reflectivity
  composition: string; // rock, metal, ice
}
```

## Unique Characteristics

### Main Belt Asteroids

Asteroids in the main belt between Mars and Jupiter:

- **Location**: 2.1-3.3 AU from Sun
- **Composition**: Primarily rocky and metallic
- **Formation**: Primordial solar system material
- **Evolution**: Collisional evolution over time

### Near-Earth Asteroids

Asteroids with orbits that bring them close to Earth:

- **Location**: Within 1.3 AU of Sun
- **Composition**: Similar to main belt asteroids
- **Origin**: Ejected from main belt
- **Risk**: Potential impact hazard

### Dwarf Planets

Large asteroids that meet dwarf planet criteria:

- **Ceres**: Only dwarf planet in inner solar system
- **Criteria**: Spherical shape, not a satellite
- **Classification**: Reclassified from asteroid
- **Significance**: Bridge between asteroids and planets

## Orbital Dynamics

### Main Belt Orbits

Main belt asteroids have diverse orbital characteristics:

- **Semi-major Axis**: 2.1-3.3 AU
- **Eccentricity**: 0.0-0.3 (mostly low)
- **Inclination**: 0°-30° (mostly low)
- **Orbital Period**: 3-6 years

### Near-Earth Orbits

Near-Earth asteroids have more varied orbits:

- **Semi-major Axis**: 0.5-1.3 AU
- **Eccentricity**: 0.0-0.8 (highly variable)
- **Inclination**: 0°-60° (variable)
- **Orbital Period**: 0.5-2.5 years

## Surface and Composition

### Surface Features

Asteroids have diverse surface features:

- **Craters**: Impact craters from collisions
- **Regolith**: Surface dust and debris
- **Rocks**: Exposed bedrock
- **Color Variations**: Different compositions

### Composition Types

Asteroids are classified by composition:

- **C-type**: Carbonaceous (most common)
- **S-type**: Silicate (stony)
- **M-type**: Metallic
- **P-type**: Primitive
- **D-type**: Dark, organic-rich

## Exploration History

### Spacecraft Missions

Several asteroids have been visited by spacecraft:

- **Galileo** (1991, 1993): Flybys of Gaspra and Ida
- **NEAR Shoemaker** (2000): Orbited and landed on Eros
- **Hayabusa** (2005): Landed on Itokawa
- **Dawn** (2011-2018): Orbited Vesta and Ceres
- **Hayabusa2** (2018-2020): Landed on Ryugu
- **OSIRIS-REx** (2020): Landed on Bennu

### Key Discoveries

- **Surface Composition**: Diverse materials
- **Internal Structure**: Differentiated bodies
- **Water Evidence**: Ice and hydrated minerals
- **Impact History**: Collisional evolution
- **Formation**: Primordial solar system material

## Integration with Solar System

### Gravitational Interactions

Asteroids interact with:

- **Sun**: Primary gravitational force
- **Jupiter**: Major perturbations
- **Mars**: Minor perturbations
- **Other Asteroids**: Collisional interactions

### Solar System Dynamics

Asteroids play a role in:

- **Planetary Formation**: Remnants of formation process
- **Impact History**: Source of impactors
- **Resource Potential**: Future mining targets
- **Planetary Defense**: Impact hazard assessment

## Best Practices

1. **Size Modeling**: Account for irregular shapes
2. **Surface Rendering**: Show cratered, rocky surfaces
3. **Orbital Dynamics**: Model diverse orbital characteristics
4. **Composition Effects**: Display different surface materials
5. **Collision Effects**: Show impact craters and debris

## Related

- [[ceres]] - Detailed Ceres object documentation
- [[vesta]] - Detailed Vesta object documentation
- [[pallas]] - Detailed Pallas object documentation
- [[hygiea]] - Detailed Hygiea object documentation
- [[eros]] - Detailed Eros object documentation
- [[apophis]] - Detailed Apophis object documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Surface rendering
