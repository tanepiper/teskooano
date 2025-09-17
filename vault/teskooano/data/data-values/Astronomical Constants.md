---
aliases: [Astronomical Constants]
tags: [data, values, astronomy, constants]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/astronomical.ts"
status: active
---

# Astronomical Constants

Standard astronomical units and measurements based on IAU definitions.

## Overview

The astronomical constants module provides standard astronomical units and measurements used throughout the simulation. These constants are based on IAU (International Astronomical Union) definitions and provide reference values for celestial object properties and calculations.

## Distance Constants

### AU_METERS

```typescript
export const AU_METERS = 149597870700;
```

Astronomical Unit in meters (average distance from Earth to Sun).

**Description:**
The Astronomical Unit (AU) is the standard unit of distance in astronomy, defined as the average distance between Earth and the Sun. Used throughout the simulation for orbital calculations, distance measurements, and scaling celestial objects to appropriate sizes.

**Units:** meters
**Value:** 149,597,870,700 m
**Source:** IAU definition

**Usage Examples:**

```typescript
// Calculate distance from Earth to Mars (1.5 AU)
const earthToMars = 1.5 * AU_METERS; // 224,396,806,050 meters

// Scale a planet's orbit to scene units
const orbitRadius =
  planet.orbitalParameters.semiMajorAxis * AU_METERS * renderScale;

// Convert distance to AU for display
const distanceAU = distance_m / AU_METERS;
```

### LIGHT_YEAR_METERS

```typescript
export const LIGHT_YEAR_METERS = 9.4607304725808e15;
```

Light year in meters.

**Description:**
A light year is the distance that light travels in one Julian year (365.25 days) in a vacuum. Used for measuring interstellar and intergalactic distances in the simulation, particularly for stars, nebulae, and other deep space objects.

**Units:** meters
**Value:** 9.4607304725808×10¹⁵ m
**Source:** Derived from speed of light and Julian year

**Usage Examples:**

```typescript
// Calculate distance to Proxima Centauri (4.24 light years)
const proximaDistance = 4.24 * LIGHT_YEAR_METERS; // ~4.01e16 meters

// Convert light years to scene units for rendering
const sceneDistance = star.distance * LIGHT_YEAR_METERS * renderScale;

// Display stellar distances in light years
const distanceLY = distance_m / LIGHT_YEAR_METERS;
```

### PARSEC_METERS

```typescript
export const PARSEC_METERS = 3.085677581491367e16;
```

Parsec in meters.

**Description:**
A parsec (parallax second) is the distance at which one astronomical unit subtends an angle of one arcsecond. The preferred unit for stellar distances in professional astronomy and used in the simulation for precise distance calculations and parallax measurements.

**Units:** meters
**Value:** 3.085677581491367×10¹⁶ m
**Source:** Derived from AU and arcsecond definition

**Usage Examples:**

```typescript
// Calculate distance using parallax (0.768 arcseconds = 1.3 parsecs)
const parallaxArcseconds = 0.768;
const distance = PARSEC_METERS / parallaxArcseconds; // ~4.02e16 meters

// Convert parsecs to scene units for star positioning
const starDistance = star.parallax * PARSEC_METERS * renderScale;

// Display stellar distances in parsecs
const distancePC = distance_m / PARSEC_METERS;
```

## Solar System Constants

### SOLAR_MASS

```typescript
export const SOLAR_MASS = 1.989e30;
```

Solar mass in kilograms.

**Description:**
The mass of our Sun, used as the standard unit of mass in astronomy. Used throughout the simulation for calculating gravitational forces, orbital dynamics, and scaling other stellar and planetary masses.

**Units:** kilograms
**Value:** 1.989×10³⁰ kg
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate gravitational force between two stars
const force =
  (GRAVITATIONAL_CONSTANT * 2 * SOLAR_MASS * 1.5 * SOLAR_MASS) /
  Math.pow(separationDistance, 2);

// Convert stellar mass to kilograms for physics calculations
const starMassKg = star.mass * SOLAR_MASS; // star.mass is in solar masses

// Calculate stellar gravitational parameter
const mu = GRAVITATIONAL_CONSTANT * starMass * SOLAR_MASS;
```

### SOLAR_RADIUS

```typescript
export const SOLAR_RADIUS = 6.957e8;
```

Solar radius in meters.

**Description:**
The radius of our Sun, used as the standard unit of stellar size in astronomy. Used for scaling stellar objects in the simulation, calculating stellar surface areas, and determining gravitational effects near stars.

**Units:** meters
**Value:** 6.957×10⁸ m
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate stellar surface area
const surfaceArea = 4 * Math.PI * Math.pow(star.radius * SOLAR_RADIUS, 2);

// Scale star size for rendering
const renderRadius = star.radius * SOLAR_RADIUS * renderScale;

// Calculate Roche limit for a planet orbiting a star
const rocheLimit =
  2.44 *
  star.radius *
  SOLAR_RADIUS *
  Math.pow(planet.density / star.density, 1 / 3);
```

### SOLAR_LUMINOSITY

```typescript
export const SOLAR_LUMINOSITY = 3.828e26;
```

Solar luminosity in watts.

**Description:**
The total power output of our Sun, used as the standard unit of stellar brightness in astronomy. Used for calculating stellar energy output, determining habitable zones, and scaling lighting effects in the simulation.

**Units:** watts
**Value:** 3.828×10²⁶ W
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate stellar energy output
const energyOutput = star.luminosity * SOLAR_LUMINOSITY; // watts

// Calculate habitable zone distance
const habitableZone =
  Math.sqrt((star.luminosity * SOLAR_LUMINOSITY) / SOLAR_LUMINOSITY) *
  AU_METERS;

// Scale lighting intensity for rendering
const lightIntensity =
  (star.luminosity * SOLAR_LUMINOSITY) / (4 * Math.PI * distanceSquared);
```

## Earth Constants

### EARTH_MASS

```typescript
export const EARTH_MASS = 5.972e24;
```

Earth mass in kilograms.

**Description:**
The mass of Earth, used as a reference for terrestrial planets and moons in the simulation. Used for calculating gravitational forces on planetary surfaces, orbital dynamics of moons, and scaling planetary masses.

**Units:** kilograms
**Value:** 5.972×10²⁴ kg
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate surface gravity of a planet
const surfaceGravity =
  (GRAVITATIONAL_CONSTANT * planet.mass * EARTH_MASS) /
  Math.pow(planet.radius * EARTH_RADIUS, 2);

// Calculate escape velocity from a planet
const escapeVelocity = Math.sqrt(
  (2 * GRAVITATIONAL_CONSTANT * planet.mass * EARTH_MASS) /
    (planet.radius * EARTH_RADIUS),
);

// Convert planetary mass to kilograms for physics
const planetMassKg = planet.mass * EARTH_MASS; // planet.mass is in Earth masses
```

### EARTH_RADIUS

```typescript
export const EARTH_RADIUS = 6.371e6;
```

Earth radius in meters.

**Description:**
The radius of Earth, used as a reference for terrestrial planets and moons in the simulation. Used for calculating planetary surface areas, atmospheric effects, and scaling planetary sizes for rendering.

**Units:** meters
**Value:** 6.371×10⁶ m
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate planetary surface area
const surfaceArea = 4 * Math.PI * Math.pow(planet.radius * EARTH_RADIUS, 2);

// Scale planet size for rendering
const renderRadius = planet.radius * EARTH_RADIUS * renderScale;

// Calculate atmospheric scale height
const scaleHeight =
  (BOLTZMANN_CONSTANT * temperature) / (molecularMass * surfaceGravity);
```

### EARTH_GRAVITATIONAL_PARAMETER

```typescript
export const EARTH_GRAVITATIONAL_PARAMETER = 3.986e14;
```

Earth's gravitational parameter (μ = GM) in m³/s².

**Description:**
The product of Earth's mass and the gravitational constant, used for orbital mechanics calculations involving Earth. This pre-calculated value is more efficient than computing G \* M_Earth repeatedly in orbital calculations and satellite trajectory computations.

**Units:** m³/s²
**Value:** 3.986×10¹⁴ m³/s²
**Source:** Derived from G × EARTH_MASS

**Usage Examples:**

```typescript
// Calculate orbital period around Earth
const orbitalPeriod =
  2 *
  Math.PI *
  Math.sqrt(Math.pow(semiMajorAxis, 3) / EARTH_GRAVITATIONAL_PARAMETER);

// Calculate orbital velocity at a given altitude
const orbitalVelocity = Math.sqrt(
  EARTH_GRAVITATIONAL_PARAMETER / (EARTH_RADIUS + altitude),
);

// Calculate Hohmann transfer delta-v
const deltaV =
  Math.sqrt(EARTH_GRAVITATIONAL_PARAMETER / r1) *
  (Math.sqrt((2 * r2) / (r1 + r2)) - 1);
```

### EARTH_ORBITAL_PERIOD

```typescript
export const EARTH_ORBITAL_PERIOD = 365.256363004 * 24 * 60 * 60;
```

Earth orbital period in seconds (sidereal year).

**Description:**
The time it takes Earth to complete one orbit around the Sun relative to the fixed stars (sidereal year). Used as a reference for calculating orbital periods of other planets and for time-based simulations and animations.

**Units:** seconds
**Value:** 31,558,149.504 s (365.256363004 days)
**Source:** Astronomical calculation

**Usage Examples:**

```typescript
// Calculate orbital period ratio relative to Earth
const periodRatio = planet.orbitalPeriod / EARTH_ORBITAL_PERIOD;

// Calculate synodic period between two planets
const synodicPeriod = 1 / (1 / planet1Period - 1 / planet2Period);

// Convert orbital period to Earth years for display
const earthYears = planet.orbitalPeriod / EARTH_ORBITAL_PERIOD;
```

## Gas Giant Constants

### JUPITER_MASS

```typescript
export const JUPITER_MASS = 1.898e27;
```

Jupiter mass in kilograms.

**Description:**
The mass of Jupiter, used as a reference for gas giant planets in the simulation. Used for calculating gravitational effects of gas giants, orbital dynamics in multi-planet systems, and scaling planetary masses for physics calculations.

**Units:** kilograms
**Value:** 1.898×10²⁷ kg
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate gravitational influence of a gas giant
const jupiterInfluence =
  (GRAVITATIONAL_CONSTANT * gasGiant.mass * JUPITER_MASS) /
  Math.pow(distance, 2);

// Convert gas giant mass to kilograms
const gasGiantMassKg = gasGiant.mass * JUPITER_MASS; // gasGiant.mass is in Jupiter masses

// Calculate Hill sphere radius for a moon
const hillSphere =
  semiMajorAxis *
  Math.pow(moonMass / (3 * gasGiant.mass * JUPITER_MASS), 1 / 3);
```

### JUPITER_RADIUS

```typescript
export const JUPITER_RADIUS = 6.9911e7;
```

Jupiter radius in meters.

**Description:**
The radius of Jupiter, used as a reference for gas giant planets in the simulation. Used for calculating planetary volumes, atmospheric effects, ring system dimensions, and scaling gas giants for rendering.

**Units:** meters
**Value:** 6.9911×10⁷ m
**Source:** IAU nominal value

**Usage Examples:**

```typescript
// Calculate gas giant volume
const volume =
  (4 / 3) * Math.PI * Math.pow(gasGiant.radius * JUPITER_RADIUS, 3);

// Scale gas giant size for rendering
const renderRadius = gasGiant.radius * JUPITER_RADIUS * renderScale;

// Calculate ring system dimensions relative to planet
const ringInnerRadius = gasGiant.radius * JUPITER_RADIUS * 1.2; // 20% beyond surface
const ringOuterRadius = gasGiant.radius * JUPITER_RADIUS * 2.5; // 2.5x planet radius
```

## Derived Calculations

### Gravitational Parameters

```typescript
// Solar gravitational parameter
const SOLAR_GRAVITATIONAL_PARAMETER = GRAVITATIONAL_CONSTANT * SOLAR_MASS;

// Jupiter gravitational parameter
const JUPITER_GRAVITATIONAL_PARAMETER = GRAVITATIONAL_CONSTANT * JUPITER_MASS;

// Calculate any body's gravitational parameter
function calculateGravitationalParameter(mass_kg: number): number {
  return GRAVITATIONAL_CONSTANT * mass_kg;
}
```

### Characteristic Velocities

```typescript
// Solar escape velocity
const SOLAR_ESCAPE_VELOCITY = Math.sqrt(
  (2 * GRAVITATIONAL_CONSTANT * SOLAR_MASS) / SOLAR_RADIUS,
);

// Earth escape velocity
const EARTH_ESCAPE_VELOCITY = Math.sqrt(
  (2 * GRAVITATIONAL_CONSTANT * EARTH_MASS) / EARTH_RADIUS,
);

// Jupiter escape velocity
const JUPITER_ESCAPE_VELOCITY = Math.sqrt(
  (2 * GRAVITATIONAL_CONSTANT * JUPITER_MASS) / JUPITER_RADIUS,
);
```

### Orbital Velocities

```typescript
// Earth's orbital velocity around the Sun
const EARTH_ORBITAL_VELOCITY = Math.sqrt(
  (GRAVITATIONAL_CONSTANT * SOLAR_MASS) / AU_METERS,
);

// Circular orbital velocity at Earth's surface
const EARTH_SURFACE_ORBITAL_VELOCITY = Math.sqrt(
  (GRAVITATIONAL_CONSTANT * EARTH_MASS) / EARTH_RADIUS,
);
```

## Unit Relationships

### Distance Scale Hierarchy

```typescript
// From smallest to largest
const scales = {
  EARTH_RADIUS: 6.371e6, // ~6,371 km
  JUPITER_RADIUS: 6.9911e7, // ~69,911 km
  SOLAR_RADIUS: 6.957e8, // ~696,000 km
  AU_METERS: 1.496e11, // ~150 million km
  LIGHT_YEAR_METERS: 9.461e15, // ~9.5 trillion km
  PARSEC_METERS: 3.086e16, // ~31 trillion km
};
```

### Mass Scale Hierarchy

```typescript
// From smallest to largest
const masses = {
  EARTH_MASS: 5.972e24, // Earth mass
  JUPITER_MASS: 1.898e27, // ~318 Earth masses
  SOLAR_MASS: 1.989e30, // ~1,047 Jupiter masses
};
```

## Integration

### Physics System

- Gravitational calculations using mass constants
- Orbital mechanics using distance constants
- Velocity calculations using derived values

### Rendering System

- Object scaling using radius constants
- Distance scaling using AU_METERS
- LOD calculations using characteristic scales

### Procedural Generation

- System scaling using solar system constants
- Planet generation using Earth/Jupiter references
- Stellar generation using solar constants

### UI Display

- Unit conversion for user display
- Scale-appropriate formatting
- Reference comparisons

## Validation

### Constant Validation

```typescript
function validateAstronomicalConstants(): boolean {
  // Check relationships between constants
  const auLightTimeCheck = AU_METERS / SPEED_OF_LIGHT; // Should be ~499 seconds
  const isAUValid = auLightTimeCheck > 498 && auLightTimeCheck < 500;

  const earthEscapeVelocity = Math.sqrt(
    (2 * GRAVITATIONAL_CONSTANT * EARTH_MASS) / EARTH_RADIUS,
  );
  const isEarthEscapeValid =
    earthEscapeVelocity > 11000 && earthEscapeVelocity < 11300; // ~11.2 km/s

  return isAUValid && isEarthEscapeValid;
}
```

### Scale Consistency

```typescript
function checkScaleConsistency(): boolean {
  // Verify that derived constants are consistent
  const calculatedEarthGP = GRAVITATIONAL_CONSTANT * EARTH_MASS;
  const gpDifference = Math.abs(
    calculatedEarthGP - EARTH_GRAVITATIONAL_PARAMETER,
  );
  const isGPConsistent = gpDifference < 1e10; // Allow small numerical differences

  return isGPConsistent;
}
```

## 🔗 Related

- [[Physical Constants]] - Fundamental physics constants used in calculations
- [[Conversion Factors]] - Unit conversion multipliers
- [[Unit Conversions]] - Conversion utility functions
- [[Scaling Constants]] - Physics to rendering conversion factors
- [[@teskooano/core-physics]] - Physics engine using astronomical constants
- [[@teskooano/systems-procedural-generation]] - System generation using reference values
