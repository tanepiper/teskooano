---
aliases: [Unit Conversions]
tags: [data, values, utilities, conversion]
type: Utility Module
package: "@teskooano/data-values"
file: "src/utils/conversions.ts"
status: active
---

# Unit Conversions

Pure utility functions for converting between different units used throughout the simulation.

## Overview

The unit conversions module provides a comprehensive set of pure functions for converting between different units used in the Teskooano simulation. These functions are optimized for performance and provide a clean API for unit conversion throughout the codebase.

## Distance Conversions

### Astronomical Units

#### auToMeters

```typescript
export function auToMeters(au: number): number;
```

Convert astronomical units to meters.

**Parameters:**

- **au**: Distance in astronomical units

**Returns:**

- Distance in meters

**Usage Examples:**

```typescript
// Convert Earth's orbital distance
const earthDistance = auToMeters(1.0); // 149,597,870,700 meters

// Convert Mars' orbital distance
const marsDistance = auToMeters(1.52); // ~227 million km

// Convert asteroid belt distance
const asteroidDistance = auToMeters(2.7); // ~404 million km
```

#### metersToAu

```typescript
export function metersToAu(meters: number): number;
```

Convert meters to astronomical units.

**Parameters:**

- **meters**: Distance in meters

**Returns:**

- Distance in astronomical units

**Usage Examples:**

```typescript
// Convert distance for display
const distanceAU = metersToAu(225000000000); // 1.5 AU

// Convert planetary radius to AU
const radiusAU = metersToAu(6371000); // Earth radius in AU

// Convert interplanetary distance
const jupiterDistanceAU = metersToAu(778500000000); // ~5.2 AU
```

### Interstellar Distances

#### lightYearsToMeters

```typescript
export function lightYearsToMeters(ly: number): number;
```

Convert light years to meters.

**Parameters:**

- **ly**: Distance in light years

**Returns:**

- Distance in meters

**Usage Examples:**

```typescript
// Convert distance to Proxima Centauri
const proximaDistance = lightYearsToMeters(4.24); // ~4.01e16 meters

// Convert distance to Sirius
const siriusDistance = lightYearsToMeters(8.6); // ~8.14e16 meters

// Convert galactic distances
const galacticDistance = lightYearsToMeters(26000); // Distance to galactic center
```

#### metersToLightYears

```typescript
export function metersToLightYears(meters: number): number;
```

Convert meters to light years.

**Parameters:**

- **meters**: Distance in meters

**Returns:**

- Distance in light years

**Usage Examples:**

```typescript
// Convert stellar distance for display
const distanceLY = metersToLightYears(4.01e16); // ~4.24 light years

// Convert interstellar probe distance
const probeDistanceLY = metersToLightYears(1.8e13); // Voyager 1 distance

// Convert nebula distance
const nebulaDistanceLY = metersToLightYears(4.14e18); // ~437 light years
```

#### parsecsToMeters

```typescript
export function parsecsToMeters(pc: number): number;
```

Convert parsecs to meters.

**Parameters:**

- **pc**: Distance in parsecs

**Returns:**

- Distance in meters

**Usage Examples:**

```typescript
// Convert stellar distance from parallax
const stellarDistance = parsecsToMeters(1.3); // ~4.01e16 meters

// Convert galactic distances
const galacticCenterDistance = parsecsToMeters(8000); // ~2.47e20 meters

// Convert cluster distances
const clusterDistance = parsecsToMeters(130); // Pleiades distance
```

#### metersToParsecs

```typescript
export function metersToParsecs(meters: number): number;
```

Convert meters to parsecs.

**Parameters:**

- **meters**: Distance in meters

**Returns:**

- Distance in parsecs

**Usage Examples:**

```typescript
// Convert distance for astronomical display
const distancePC = metersToParsecs(4.01e16); // ~1.3 parsecs

// Convert from parallax measurement
const parallaxDistance = metersToParsecs(distance); // For parallax calculations

// Convert interstellar distances
const starDistancePC = metersToParsecs(stellarDistance);
```

## Mass Conversions

### Solar Masses

#### solarMassesToKg

```typescript
export function solarMassesToKg(solarMasses: number): number;
```

Convert solar masses to kilograms.

**Parameters:**

- **solarMasses**: Mass in solar masses

**Returns:**

- Mass in kilograms

**Usage Examples:**

```typescript
// Convert stellar mass for physics calculations
const starMassKg = solarMassesToKg(2.5); // 2.5 solar masses to kg

// Convert binary star masses
const primaryMassKg = solarMassesToKg(1.2);
const secondaryMassKg = solarMassesToKg(0.8);

// Convert massive star mass
const massiveStarKg = solarMassesToKg(25.0); // Massive O-type star
```

#### kgToSolarMasses

```typescript
export function kgToSolarMasses(kg: number): number;
```

Convert kilograms to solar masses.

**Parameters:**

- **kg**: Mass in kilograms

**Returns:**

- Mass in solar masses

**Usage Examples:**

```typescript
// Convert mass for display
const starMassSolar = kgToSolarMasses(3.978e30); // ~2.0 solar masses

// Convert planet mass to solar masses
const planetMassSolar = kgToSolarMasses(5.972e24); // Earth mass in solar masses

// Convert for comparison
const blackHoleMassSolar = kgToSolarMasses(1.989e31); // 10 solar mass black hole
```

### Solar Radii

#### solarRadiiToMeters

```typescript
export function solarRadiiToMeters(solarRadii: number): number;
```

Convert solar radii to meters.

**Parameters:**

- **solarRadii**: Radius in solar radii

**Returns:**

- Radius in meters

**Usage Examples:**

```typescript
// Convert stellar radius for physics calculations
const starRadiusM = solarRadiiToMeters(1.5); // 1.5 solar radii to meters

// Convert red giant radius
const redGiantRadiusM = solarRadiiToMeters(50); // Large red giant

// Convert white dwarf radius
const whiteDwarfRadiusM = solarRadiiToMeters(0.01); // Tiny white dwarf
```

#### metersToSolarRadii

```typescript
export function metersToSolarRadii(meters: number): number;
```

Convert meters to solar radii.

**Parameters:**

- **meters**: Radius in meters

**Returns:**

- Radius in solar radii

**Usage Examples:**

```typescript
// Convert radius for display
const starRadiusSolar = metersToSolarRadii(1.043e9); // ~1.5 solar radii

// Convert planet radius to solar radii
const planetRadiusSolar = metersToSolarRadii(6371000); // Earth radius

// Convert for stellar comparison
const giantRadiusSolar = metersToSolarRadii(3.5e10); // Supergiant radius
```

## Time Conversions

### Days and Seconds

#### daysToSeconds

```typescript
export function daysToSeconds(days: number): number;
```

Convert days to seconds.

**Parameters:**

- **days**: Time in days

**Returns:**

- Time in seconds

**Usage Examples:**

```typescript
// Convert orbital period
const periodSeconds = daysToSeconds(365.25); // Earth's orbital period

// Convert rotation period
const rotationSeconds = daysToSeconds(1.0); // Earth's rotation period

// Convert mission duration
const missionSeconds = daysToSeconds(687); // Mars mission duration
```

#### secondsToDays

```typescript
export function secondsToDays(seconds: number): number;
```

Convert seconds to days.

**Parameters:**

- **seconds**: Time in seconds

**Returns:**

- Time in days

**Usage Examples:**

```typescript
// Convert for display
const periodDays = secondsToDays(86400); // 1 day

// Convert orbital period
const marsPeriodDays = secondsToDays(59354294); // Mars orbital period

// Convert simulation time
const elapsedDays = secondsToDays(simulationTime);
```

### Years and Seconds

#### yearsToSeconds

```typescript
export function yearsToSeconds(years: number): number;
```

Convert years to seconds.

**Parameters:**

- **years**: Time in years

**Returns:**

- Time in seconds

**Usage Examples:**

```typescript
// Convert stellar age
const ageSeconds = yearsToSeconds(4.6e9); // Age of the Sun

// Convert orbital period
const jupiterPeriodSeconds = yearsToSeconds(11.86); // Jupiter's period

// Convert mission duration
const missionSeconds = yearsToSeconds(2.5); // 2.5 year mission
```

#### secondsToYears

```typescript
export function secondsToYears(seconds: number): number;
```

Convert seconds to years.

**Parameters:**

- **seconds**: Time in seconds

**Returns:**

- Time in years

**Usage Examples:**

```typescript
// Convert for display
const ageYears = secondsToYears(1.45e17); // Stellar age in years

// Convert orbital period
const periodYears = secondsToYears(374335776); // Jupiter's period

// Convert simulation time
const simulationYears = secondsToYears(totalSimulationTime);
```

## Batch Conversions

### Multiple Distance Units

```typescript
function convertDistanceToAllUnits(meters: number): {
  meters: number;
  kilometers: number;
  au: number;
  lightYears: number;
  parsecs: number;
} {
  return {
    meters: meters,
    kilometers: meters / 1000,
    au: metersToAu(meters),
    lightYears: metersToLightYears(meters),
    parsecs: metersToParsecs(meters),
  };
}
```

### Multiple Time Units

```typescript
function convertTimeToAllUnits(seconds: number): {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  years: number;
} {
  return {
    seconds: seconds,
    minutes: seconds / 60,
    hours: seconds / 3600,
    days: secondsToDays(seconds),
    years: secondsToYears(seconds),
  };
}
```

### Multiple Mass Units

```typescript
function convertMassToAllUnits(kg: number): {
  kg: number;
  earthMasses: number;
  jupiterMasses: number;
  solarMasses: number;
} {
  return {
    kg: kg,
    earthMasses: kg / EARTH_MASS,
    jupiterMasses: kg / JUPITER_MASS,
    solarMasses: kgToSolarMasses(kg),
  };
}
```

## Performance Optimizations

### Pure Functions

- All conversion functions are pure (no side effects)
- Stateless and thread-safe
- Easily optimizable by JavaScript engines

### Minimal Overhead

- Simple arithmetic operations
- No object allocation
- Compile-time constant folding where possible

### Memoization (if needed)

```typescript
// Example memoization for expensive conversions
const conversionCache = new Map<string, number>();

function memoizedConversion(
  value: number,
  conversionFn: (v: number) => number,
): number {
  const key = `${conversionFn.name}-${value}`;
  if (conversionCache.has(key)) {
    return conversionCache.get(key)!;
  }

  const result = conversionFn(value);
  conversionCache.set(key, result);
  return result;
}
```

## Integration

### Physics System

- Convert between different unit systems
- Normalize units for calculations
- Scale values for numerical stability

### UI System

- Display values in user-friendly units
- Convert user inputs to simulation units
- Provide multiple unit options

### Rendering System

- Convert physics units to rendering units
- Scale objects for visualization
- Normalize distances for LOD calculations

## Error Handling

### Input Validation

```typescript
function validateConversionInput(value: number, functionName: string): void {
  if (!isFinite(value)) {
    throw new Error(
      `${functionName}: Input must be a finite number, got ${value}`,
    );
  }

  if (value < 0 && functionName.includes("Mass")) {
    throw new Error(`${functionName}: Mass cannot be negative, got ${value}`);
  }
}
```

### Safe Conversions

```typescript
function safeAuToMeters(au: number): number {
  validateConversionInput(au, "auToMeters");
  return auToMeters(au);
}

function safeSolarMassesToKg(solarMasses: number): number {
  validateConversionInput(solarMasses, "solarMassesToKg");
  if (solarMasses < 0) {
    throw new Error("Solar masses cannot be negative");
  }
  return solarMassesToKg(solarMasses);
}
```

## 🔗 Related

- [[Physical Constants]] - Constants used in conversions
- [[Astronomical Constants]] - Reference values for conversions
- [[Conversion Factors]] - Multipliers used by these functions
- [[ThreeVector3Converter]] - Vector conversion utility
- [[@teskooano/core-physics]] - Physics system using conversions
- [[@teskooano/renderer-threejs]] - Rendering system using conversions
