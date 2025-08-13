# Data Values Package Architecture

## Overview

The `@teskooano/data-values` package provides centralized constant values and utility functions for the Open Space engine. It is designed to be a pure values library with no dependencies on other Teskooano packages (except for the ThreeVector3Converter which depends on core-math).

## Package Structure

```
src/
├── constants/
│   ├── index.ts          # Re-exports all constants
│   ├── physical.ts       # Fundamental physical constants
│   ├── astronomical.ts   # Astronomical units and measurements
│   ├── conversion.ts     # Unit conversion factors
│   ├── simulation.ts     # Simulation limits and constraints
│   ├── rendering.ts      # Rendering and visualization constants
│   ├── time.ts          # Time and animation constants
│   └── ranges.ts        # Physical property ranges
├── utils/
│   ├── index.ts         # Re-exports all utilities
│   ├── conversions.ts   # Unit conversion functions
│   └── ThreeVector3Converter.ts # Vector conversion utility
└── index.ts             # Main package entry point
```

## Design Principles

### 1. Domain Separation

Constants are organized by their domain of use rather than by type. This makes it easier to find related constants and understand their purpose.

### 2. Single Source of Truth

All constant values are defined in exactly one place. This prevents inconsistencies and makes maintenance easier.

### 3. Clear Documentation

Every constant has JSDoc comments that include:

- What the constant represents
- The units of measurement
- Any relevant context or constraints

### 4. Type Safety

All constants are properly typed and exported with TypeScript declarations.

### 5. Utility Functions

Common conversion operations are provided as utility functions to reduce code duplication and prevent errors.

## Constants Organization

### Physical Constants (`physical.ts`)

Fundamental physical constants based on CODATA recommended values:

- `GRAVITATIONAL_CONSTANT`: Newton's gravitational constant
- `SPEED_OF_LIGHT`: Speed of light in vacuum
- `PLANCK_CONSTANT`: Planck's constant
- `BOLTZMANN_CONSTANT`: Boltzmann constant
- `STEFAN_BOLTZMANN_CONSTANT`: Stefan-Boltzmann constant

### Astronomical Constants (`astronomical.ts`)

Standard astronomical units and measurements:

- `AU_METERS`: Astronomical Unit in meters
- `LIGHT_YEAR_METERS`: Light year in meters
- `PARSEC_METERS`: Parsec in meters
- `SOLAR_MASS`, `SOLAR_RADIUS`, `SOLAR_LUMINOSITY`: Solar properties
- `EARTH_MASS`, `EARTH_RADIUS`, `EARTH_GRAVITATIONAL_PARAMETER`: Earth properties
- `JUPITER_MASS`, `JUPITER_RADIUS`: Jupiter properties

### Conversion Factors (`conversion.ts`)

Unit conversion multipliers:

- Distance: `KM`, `MM`, `GM`, `TM`, `PM`
- Time: `SECONDS_PER_*`

### Simulation Limits (`simulation.ts`)

Numerical limits for simulation stability:

- `MAX_FORCE`, `MAX_VELOCITY`: Physics limits
- `MIN_MASS`, `MAX_MASS`: Mass constraints
- `MAX_CELESTIAL_OBJECTS`, `MAX_PARTICLES`: Performance limits

### Rendering Constants (`rendering.ts`)

Default values for visualization:

- `DEFAULT_FOV`, `MIN_FOV`, `MAX_FOV`: Camera field of view
- `DEFAULT_NEAR`, `DEFAULT_FAR`: Clipping planes
- `DEFAULT_CAMERA_*`: Camera movement speeds

### Time Constants (`time.ts`)

Time simulation and animation settings:

- `DEFAULT_TIME_STEP`, `MIN_TIME_STEP`, `MAX_TIME_STEP`: Simulation time steps
- `DEFAULT_TIME_SCALE`, `MIN_TIME_SCALE`, `MAX_TIME_SCALE`: Time scaling
- `TARGET_FPS`, `MIN_FPS`: Performance targets

### Property Ranges (`ranges.ts`)

Valid ranges for physical properties:

- `MIN_STELLAR_TEMPERATURE`, `MAX_STELLAR_TEMPERATURE`: Temperature bounds
- `MIN_ALBEDO`, `MAX_ALBEDO`: Reflectivity bounds
- `MIN_ECCENTRICITY`, `MAX_ECCENTRICITY`: Orbital eccentricity bounds

## Utility Functions

### Conversion Functions (`utils/conversions.ts`)

Pure functions for unit conversions:

- Distance: `auToMeters`, `metersToAu`, `lightYearsToMeters`, etc.
- Mass: `solarMassesToKg`, `kgToSolarMasses`
- Time: `daysToSeconds`, `yearsToSeconds`, etc.

### ThreeVector3Converter (`utils/ThreeVector3Converter.ts`)

Performance-optimized utility for converting between `OSVector3` arrays and `THREE.Vector3` arrays. Reuses vector instances to minimize garbage collection.

## Usage Patterns

### Direct Import

```typescript
import { GRAVITATIONAL_CONSTANT, SOLAR_MASS } from "@teskooano/data-values";
```

### Conversion Functions

```typescript
import { auToMeters, solarMassesToKg } from "@teskooano/data-values";

const distanceInMeters = auToMeters(1.5); // 1.5 AU to meters
const massInKg = solarMassesToKg(2.0); // 2.0 solar masses to kg
```

### Simulation Limits

```typescript
import { MAX_CELESTIAL_OBJECTS, MAX_FORCE } from "@teskooano/data-values";

if (objectCount > MAX_CELESTIAL_OBJECTS) {
  throw new Error("Too many celestial objects");
}
```

## Dependencies

- **`three`**: Required for ThreeVector3Converter
- **`@teskooano/core-math`**: Required for OSVector3 type in ThreeVector3Converter

## Testing Strategy

Each constants file should have corresponding tests that verify:

- Constants have the expected values
- Conversion functions work correctly
- Utility functions handle edge cases properly

## Future Enhancements

1. **Validation Functions**: Add functions to validate that values fall within expected ranges
2. **Unit System Support**: Consider adding support for different unit systems (CGS, imperial, etc.)
3. **Configuration**: Allow some constants to be configurable at runtime
4. **Performance Monitoring**: Add utilities for monitoring constant usage patterns
