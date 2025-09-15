# Comets

A collection of comets in our solar system, including periodic comets, long-period comets, and other significant cometary objects. Comets are icy bodies that develop tails when they approach the Sun.

## Overview

Comets are small, icy celestial bodies that orbit the Sun in highly elliptical orbits. When they approach the Sun, they develop a coma (atmosphere) and tail due to sublimation of ices. Comets are remnants from the early solar system and provide insights into its formation.

## Components

### Periodic Comets

Comets with orbital periods less than 200 years:

#### Halley's Comet

The most famous periodic comet, visible from Earth every 76 years.

**Key Properties**:

- **Type**: Periodic comet
- **Mass**: 2.2 × 10¹⁴ kg
- **Radius**: 5.5 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 75.32 years
- **Last Perihelion**: 1986
- **Next Perihelion**: 2061

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 2,667,950,000 km (17.834 AU)
- **Eccentricity**: 0.967
- **Inclination**: 162.26°
- **Longitude of Ascending Node**: 58.42°
- **Argument of Periapsis**: 111.33°
- **Mean Anomaly**: 38.38°

#### Encke's Comet

The comet with the shortest orbital period, completing an orbit every 3.3 years.

**Key Properties**:

- **Type**: Periodic comet
- **Mass**: 1.2 × 10¹³ kg
- **Radius**: 2.4 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 3.30 years
- **Last Perihelion**: 2020
- **Next Perihelion**: 2023

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 335,000,000 km (2.22 AU)
- **Eccentricity**: 0.847
- **Inclination**: 11.78°
- **Longitude of Ascending Node**: 334.57°
- **Argument of Periapsis**: 186.54°
- **Mean Anomaly**: 160.47°

### Long-Period Comets

Comets with orbital periods greater than 200 years:

#### Hale-Bopp

A bright long-period comet that was visible for 18 months in 1996-1997.

**Key Properties**:

- **Type**: Long-period comet
- **Mass**: 2.2 × 10¹⁵ kg
- **Radius**: 30 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 2,533 years
- **Last Perihelion**: 1997
- **Next Perihelion**: 4385

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 186,000,000,000 km (1,244 AU)
- **Eccentricity**: 0.995
- **Inclination**: 89.43°
- **Longitude of Ascending Node**: 282.47°
- **Argument of Periapsis**: 130.59°
- **Mean Anomaly**: 0.00°

#### Hyakutake

A bright long-period comet that passed very close to Earth in 1996.

**Key Properties**:

- **Type**: Long-period comet
- **Mass**: 1.0 × 10¹⁴ kg
- **Radius**: 2.0 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 17,000 years
- **Last Perihelion**: 1996
- **Next Perihelion**: 17,000 years

**Orbital Elements**:

- **Epoch**: J2000
- **Semi-major Axis**: 1,700,000,000,000 km (11,400 AU)
- **Eccentricity**: 0.999
- **Inclination**: 124.92°
- **Longitude of Ascending Node**: 188.05°
- **Argument of Periapsis**: 130.17°
- **Mean Anomaly**: 0.00°

### Other Significant Comets

#### Tempel 1

A periodic comet that was the target of the Deep Impact mission.

**Key Properties**:

- **Type**: Periodic comet
- **Mass**: 7.9 × 10¹³ kg
- **Radius**: 3.0 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 5.52 years
- **Last Perihelion**: 2022
- **Next Perihelion**: 2028

#### Wild 2

A periodic comet that was the target of the Stardust mission.

**Key Properties**:

- **Type**: Periodic comet
- **Mass**: 2.3 × 10¹³ kg
- **Radius**: 2.0 km
- **Density**: 0.6 g/cm³
- **Orbital Period**: 6.39 years
- **Last Perihelion**: 2022
- **Next Perihelion**: 2029

## Data Structure

```typescript
// From comets/index.ts
export const comets: CelestialObject<any>[] = [
  halleysComet, // Halley's Comet
  enckesComet, // Encke's Comet
  haleBopp, // Hale-Bopp
  hyakutake, // Hyakutake
  tempel1, // Tempel 1
  wild2, // Wild 2
  // ... other comets
];
```

## Usage Examples

### Accessing Comets

```typescript
import { comets } from "@teskooano/systems-solar-system";

// Get specific comets
const halleysComet = comets.find((obj) => obj.id === "halleys-comet");
const enckesComet = comets.find((obj) => obj.id === "enckes-comet");
const haleBopp = comets.find((obj) => obj.id === "hale-bopp");

// Get all comets
console.log("Total comets:", comets.length);

// Filter by type
const periodicComets = comets.filter((obj) => obj.type === "periodic-comet");
const longPeriodComets = comets.filter(
  (obj) => obj.type === "long-period-comet",
);
```

### Comet Properties

```typescript
import { comets } from "@teskooano/systems-solar-system";

const halleysComet = comets.find((obj) => obj.id === "halleys-comet");

if (halleysComet) {
  console.log("Halley's Comet Properties:");
  console.log("  Type:", halleysComet.properties.cometType);
  console.log("  Mass:", halleysComet.properties.mass, "kg");
  console.log("  Radius:", halleysComet.properties.radius, "km");
  console.log(
    "  Orbital Period:",
    halleysComet.properties.orbitalPeriod,
    "years",
  );
  console.log("  Last Perihelion:", halleysComet.properties.lastPerihelion);
}
```

### Orbital Information

```typescript
import { comets } from "@teskooano/systems-solar-system";

comets.forEach((comet) => {
  if (comet.orbit) {
    console.log(`${comet.name} Orbital Elements:`);
    console.log(`  Semi-major Axis: ${comet.orbit.semiMajorAxis} km`);
    console.log(`  Eccentricity: ${comet.orbit.eccentricity}`);
    console.log(`  Inclination: ${comet.orbit.inclination} degrees`);
    console.log(`  Orbital Period: ${comet.orbit.period} years`);
  }
});
```

## Physical Properties

### Comet Properties

```typescript
interface CometProperties {
  cometType: "periodic" | "long-period" | "short-period";
  mass: number; // kg
  radius: number; // km
  density: number; // g/cm³
  orbitalPeriod: number; // years
  rotationPeriod: number; // hours
  surfaceTemperature: number; // K
  albedo: number; // reflectivity
  composition: string; // ice, rock, dust
  lastPerihelion: string; // date
  nextPerihelion: string; // date
}
```

## Unique Characteristics

### Coma and Tail Formation

Comets develop distinctive features when approaching the Sun:

- **Coma**: Atmosphere of gas and dust
- **Ion Tail**: Charged particles pushed by solar wind
- **Dust Tail**: Dust particles pushed by radiation pressure
- **Nucleus**: Solid, icy core

### Orbital Characteristics

Comets have highly elliptical orbits:

- **Eccentricity**: 0.5-1.0 (very elliptical)
- **Inclination**: Variable (0°-180°)
- **Perihelion**: Close to Sun
- **Aphelion**: Far from Sun

### Composition

Comets are composed of:

- **Water Ice**: Primary component
- **Carbon Dioxide**: Sublimates at greater distances
- **Methane**: Organic compounds
- **Dust**: Silicate and carbonaceous particles
- **Organic Molecules**: Complex organic compounds

## Orbital Dynamics

### Periodic Comet Orbits

Periodic comets have relatively short orbital periods:

- **Orbital Period**: < 200 years
- **Semi-major Axis**: < 50 AU
- **Eccentricity**: 0.5-0.9
- **Inclination**: Variable

### Long-Period Comet Orbits

Long-period comets have very long orbital periods:

- **Orbital Period**: > 200 years
- **Semi-major Axis**: > 50 AU
- **Eccentricity**: 0.9-1.0
- **Inclination**: Variable

## Surface and Composition

### Surface Features

Comet surfaces are diverse:

- **Craters**: Impact craters
- **Pits**: Sublimation pits
- **Ridges**: Surface topography
- **Boulders**: Large surface rocks
- **Dust**: Surface dust layer

### Composition Types

Comets are classified by composition:

- **C-type**: Carbonaceous
- **P-type**: Primitive
- **D-type**: Dark, organic-rich
- **T-type**: Transitional

## Exploration History

### Spacecraft Missions

Several comets have been visited by spacecraft:

- **Giotto** (1986): Flyby of Halley's Comet
- **Deep Space 1** (2001): Flyby of Borrelly
- **Stardust** (2004): Flyby of Wild 2
- **Deep Impact** (2005): Impact with Tempel 1
- **Rosetta** (2014-2016): Orbited and landed on 67P/Churyumov-Gerasimenko
- **New Horizons** (2019): Flyby of Arrokoth

### Key Discoveries

- **Surface Composition**: Diverse materials
- **Internal Structure**: Porous, low-density
- **Water Evidence**: Abundant water ice
- **Organic Molecules**: Complex organic compounds
- **Formation**: Primordial solar system material

## Integration with Solar System

### Gravitational Interactions

Comets interact with:

- **Sun**: Primary gravitational force
- **Planets**: Gravitational perturbations
- **Oort Cloud**: Source of long-period comets
- **Kuiper Belt**: Source of short-period comets

### Solar System Dynamics

Comets play a role in:

- **Planetary Formation**: Remnants of formation process
- **Water Delivery**: Possible source of Earth's water
- **Organic Delivery**: Source of organic molecules
- **Impact History**: Source of impactors

## Best Practices

1. **Orbital Modeling**: Account for highly elliptical orbits
2. **Tail Rendering**: Show coma and tail development
3. **Surface Rendering**: Display icy, dusty surfaces
4. **Orbital Dynamics**: Model complex orbital evolution
5. **Composition Effects**: Show different surface materials

## Related

- [[halleysComet]] - Detailed Halley's Comet object documentation
- [[enckesComet]] - Detailed Encke's Comet object documentation
- [[haleBopp]] - Detailed Hale-Bopp object documentation
- [[hyakutake]] - Detailed Hyakutake object documentation
- [[tempel1]] - Detailed Tempel 1 object documentation
- [[wild2]] - Detailed Wild 2 object documentation
- [[solarSystemBodies]] - Complete solar system array
- [[initializeSolarSystem]] - System initialization function
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[@teskooano/core-math]] - Astronomical calculations
- [[@teskooano/core-renderer]] - Surface and tail rendering
