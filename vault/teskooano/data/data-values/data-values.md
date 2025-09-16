---
aliases: [data-values]
tags: [data, values]
type: index
package: "@teskooano/data-values"
version: "0.1.0"
dependencies: ["three"]
devDependencies: ["typescript", "vitest", "eslint", "@types/three"]
classes: []
status: active
---

# Data Values (`@teskooano/data-values`)

Centralized constant values and utility functions for the Open Space engine providing physical constants, astronomical measurements, and unit conversion utilities.

## Overview

The `@teskooano/data-values` library provides centralized constant values and utility functions used throughout the Open Space engine. This library maintains a clean separation between type definitions and actual values, serving as the single source of truth for all constants, measurements, and conversion utilities.

## Key Features

### Comprehensive Constants Library

- **Physical Constants**: Fundamental physics constants (G, c, h, k, σ)
- **Astronomical Units**: Standard astronomical measurements (AU, solar mass, Earth properties)
- **Conversion Factors**: Unit conversion multipliers for all scales
- **Simulation Limits**: Numerical constraints for stability and performance
- **Rendering Constants**: Default values for visualization and camera settings
- **Time Constants**: Time simulation and animation settings
- **Property Ranges**: Valid ranges for physical properties

### Domain-Organized Structure

- **Physical**: Fundamental physics constants from CODATA
- **Astronomical**: IAU standard astronomical units and measurements
- **Conversion**: Unit conversion factors for all scales
- **Orbital**: Orbital mechanics calculation constants
- **Simulation**: Numerical limits and constraints
- **Rendering**: Visualization and camera defaults
- **Time**: Time simulation settings
- **Ranges**: Physical property validation ranges

### Utility Functions

- **Unit Conversions**: Pure functions for converting between units
- **Vector Conversion**: Optimized conversion between OSVector3 and THREE.Vector3
- **Performance Optimization**: Efficient conversion utilities with object reuse

## Architecture

### Constants Organization

#### [[Physical Constants]]

Fundamental physical constants based on CODATA recommended values.

**Key Constants:**

- **GRAVITATIONAL_CONSTANT**: Newton's gravitational constant (6.6743×10⁻¹¹ m³/kg·s²)
- **SPEED_OF_LIGHT**: Speed of light in vacuum (2.99792458×10⁸ m/s)
- **PLANCK_CONSTANT**: Planck's constant (6.62607015×10⁻³⁴ J·s)
- **BOLTZMANN_CONSTANT**: Boltzmann constant (1.380649×10⁻²³ J/K)
- **STEFAN_BOLTZMANN_CONSTANT**: Stefan-Boltzmann constant (5.670374419×10⁻⁸ W/m²·K⁴)

#### [[Astronomical Constants]]

Standard astronomical units and measurements from IAU definitions.

**Key Constants:**

- **AU_METERS**: Astronomical unit (149,597,870,700 m)
- **LIGHT_YEAR_METERS**: Light year (9.4607304725808×10¹⁵ m)
- **PARSEC_METERS**: Parsec (3.085677581491367×10¹⁶ m)
- **SOLAR_MASS**: Solar mass (1.989×10³⁰ kg)
- **SOLAR_RADIUS**: Solar radius (6.957×10⁸ m)
- **SOLAR_LUMINOSITY**: Solar luminosity (3.828×10²⁶ W)
- **EARTH_MASS**: Earth mass (5.972×10²⁴ kg)
- **EARTH_RADIUS**: Earth radius (6.371×10⁶ m)

#### [[Conversion Factors]]

Unit conversion multipliers for all measurement scales.

**Key Factors:**

- **Distance**: KM, MM, GM, TM, PM (kilometers to petameters)
- **Time**: SECONDS_PER_MINUTE, SECONDS_PER_HOUR, SECONDS_PER_DAY, SECONDS_PER_YEAR
- **Calendar**: SECONDS_PER_YEAR_GREGORIAN for calendar calculations

#### [[Orbital Constants]]

Constants for orbital mechanics calculations and Kepler equation solving.

**Key Constants:**

- **Kepler Tolerances**: BASE_KEPLER_TOLERANCE, MIN/MAX_KEPLER_TOLERANCE
- **Iteration Limits**: MAX_KEPLER_ITERATIONS
- **Collision Physics**: COLLISION_RESTITUTION

#### [[Simulation Limits]]

Numerical limits and constraints for simulation stability.

**Key Limits:**

- **Physics Limits**: MAX_FORCE, MAX_VELOCITY, MIN/MAX_MASS
- **Performance Limits**: MAX_CELESTIAL_OBJECTS, MAX_PARTICLES, MAX_TRAIL_POINTS
- **Safety Parameters**: GRAVITATIONAL_SOFTENING_SQUARED, MASS_DIFF_THRESHOLD

#### [[Rendering Constants]]

Default values and limits for camera and visualization settings.

**Key Constants:**

- **Camera Settings**: DEFAULT_FOV, MIN/MAX_FOV, DEFAULT_NEAR/FAR
- **Movement**: DEFAULT_CAMERA_SPEED, DEFAULT_CAMERA_ROTATION_SPEED, DEFAULT_CAMERA_ZOOM_SPEED
- **LOD**: LOD_DISTANCE_THRESHOLD

#### [[Time Constants]]

Time simulation and animation settings.

**Key Constants:**

- **Time Steps**: DEFAULT_TIME_STEP, MIN/MAX_TIME_STEP
- **Time Scaling**: DEFAULT_TIME_SCALE, MIN/MAX_TIME_SCALE
- **Performance**: TARGET_FPS, MIN_FPS

#### [[Scaling Constants]]

Scaling factors for converting between physics and rendering units.

**Key Constants:**

- **SCALE Object**: DISTANCE, SIZE, TIME, MASS, RENDER_SCALE_AU
- **Conversion**: METERS_TO_SCENE_UNITS
- **Render Scaling**: DEFAULT/MIN/MAX_RENDER_SCALE_AU

#### [[Property Ranges]]

Valid ranges for physical properties used in validation.

**Key Ranges:**

- **Temperature**: MIN/MAX_STELLAR_TEMPERATURE, MIN/MAX_PLANETARY_TEMPERATURE
- **Reflectivity**: MIN/MAX_ALBEDO
- **Orbital**: MIN/MAX_ECCENTRICITY

### Utility Functions

#### [[Unit Conversions]]

Pure functions for converting between different units.

**Distance Conversions:**

- `auToMeters` / `metersToAu`
- `lightYearsToMeters` / `metersToLightYears`
- `parsecsToMeters` / `metersToParsecs`

**Mass Conversions:**

- `solarMassesToKg` / `kgToSolarMasses`
- `solarRadiiToMeters` / `metersToSolarRadii`

**Time Conversions:**

- `daysToSeconds` / `secondsToDays`
- `yearsToSeconds` / `secondsToYears`

#### [[ThreeVector3Converter]]

Performance-optimized utility for converting between OSVector3 and THREE.Vector3 arrays.

**Features:**

- Object reuse to minimize garbage collection
- Efficient array conversion
- Bridge between physics and rendering systems

## Usage Examples

### Physical Constants

```typescript
import {
  GRAVITATIONAL_CONSTANT,
  SPEED_OF_LIGHT,
  STEFAN_BOLTZMANN_CONSTANT,
} from "@teskooano/data-values";

// Calculate gravitational force
const force = (GRAVITATIONAL_CONSTANT * mass1 * mass2) / (distance * distance);

// Calculate stellar luminosity
const luminosity =
  4 *
  Math.PI *
  radius *
  radius *
  STEFAN_BOLTZMANN_CONSTANT *
  Math.pow(temperature, 4);

// Check for relativistic speeds
const isRelativistic = velocity > 0.1 * SPEED_OF_LIGHT;
```

### Astronomical Measurements

```typescript
import {
  AU_METERS,
  SOLAR_MASS,
  EARTH_MASS,
  JUPITER_RADIUS,
} from "@teskooano/data-values";

// Convert orbital distance to meters
const orbitalDistance = 5.2 * AU_METERS; // Jupiter's distance

// Calculate gravitational parameter
const mu = GRAVITATIONAL_CONSTANT * SOLAR_MASS;

// Scale planet size
const planetRadius = 0.5 * JUPITER_RADIUS; // Half Jupiter's size
```

### Unit Conversions

```typescript
import {
  auToMeters,
  solarMassesToKg,
  yearsToSeconds,
  metersToAu,
} from "@teskooano/data-values";

// Convert astronomical units
const distanceMeters = auToMeters(1.5); // 1.5 AU to meters
const distanceAU = metersToAu(225000000000); // 225 million km to AU

// Convert stellar mass
const starMassKg = solarMassesToKg(2.5); // 2.5 solar masses to kg

// Convert orbital period
const periodSeconds = yearsToSeconds(11.86); // Jupiter's period
```

### Simulation Configuration

```typescript
import {
  MAX_CELESTIAL_OBJECTS,
  TARGET_FPS,
  DEFAULT_TIME_STEP,
  MAX_FORCE,
} from "@teskooano/data-values";

// Validate object count
if (objectCount > MAX_CELESTIAL_OBJECTS) {
  console.warn("Too many objects for optimal performance");
}

// Configure simulation
const config = {
  timeStep: DEFAULT_TIME_STEP,
  targetFrameRate: TARGET_FPS,
  maxForce: MAX_FORCE,
};
```

### Rendering Setup

```typescript
import {
  DEFAULT_FOV,
  DEFAULT_NEAR,
  DEFAULT_FAR,
  DEFAULT_CAMERA_SPEED,
} from "@teskooano/data-values";

// Initialize camera
const camera = new THREE.PerspectiveCamera(
  DEFAULT_FOV,
  aspectRatio,
  DEFAULT_NEAR,
  DEFAULT_FAR,
);

// Configure camera controls
const controls = {
  movementSpeed: DEFAULT_CAMERA_SPEED,
  rotationSpeed: DEFAULT_CAMERA_ROTATION_SPEED,
};
```

### Vector Conversion

```typescript
import { ThreeVector3Converter } from "@teskooano/data-values";

const converter = new ThreeVector3Converter();
const osVectors: OSVector3[] = getPhysicsPositions();
const threeVectors: THREE.Vector3[] = [];

// Efficient conversion with object reuse
converter.update(osVectors, threeVectors);
```

## Performance Optimizations

### Constant Access

- All constants are compile-time constants
- No runtime overhead for constant access
- Tree-shaking eliminates unused constants

### Utility Functions

- Pure functions with no side effects
- Optimized for performance-critical paths
- Minimal memory allocation

### Vector Conversion

- Object reuse minimizes garbage collection
- Efficient array operations
- Bridge between physics and rendering systems

## Integration

### Dependencies

- **Three.js**: Required for ThreeVector3Converter
- **@teskooano/core-math**: Required for OSVector3 type (indirect dependency)

### Usage Across Packages

- **Core Physics**: Physical constants and orbital parameters
- **Core State**: Simulation limits and time constants
- **Renderer Packages**: Rendering constants and conversion utilities
- **Systems Packages**: Astronomical constants and ranges
- **Application**: All constants and utilities

## Design Principles

### Single Source of Truth

- All constant values defined in exactly one place
- Prevents inconsistencies across the codebase
- Centralized maintenance and updates

### Domain Separation

- Constants organized by domain rather than type
- Related constants grouped together
- Easy to find and understand context

### Clear Documentation

- Every constant has comprehensive JSDoc comments
- Includes units, context, and usage examples
- Explains rationale behind specific values

### Type Safety

- All constants properly typed
- TypeScript declarations for all exports
- Compile-time validation of constant usage

## 🔗 Related

- [[Physical Constants]] - Fundamental physics constants
- [[Astronomical Constants]] - Standard astronomical measurements
- [[Conversion Factors]] - Unit conversion multipliers
- [[Orbital Constants]] - Orbital mechanics constants
- [[Simulation Limits]] - Numerical constraints and limits
- [[Rendering Constants]] - Visualization and camera settings
- [[Time Constants]] - Time simulation settings
- [[Scaling Constants]] - Physics to rendering conversion
- [[Property Ranges]] - Physical property validation ranges
- [[Unit Conversions]] - Conversion utility functions
- [[ThreeVector3Converter]] - Vector conversion utility
- [[@teskooano/data-types]] - Type definitions that use these values
- [[@teskooano/core-physics]] - Physics engine using constants
- [[@teskooano/core-state]] - State management with constants
