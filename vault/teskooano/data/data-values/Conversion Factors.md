---
aliases: [Conversion Factors]
tags: [data, values, conversion, units]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/conversion.ts"
status: active
---

# Conversion Factors

Standard conversion factors and unit multipliers for converting between different units throughout the simulation.

## Overview

The conversion factors module provides standard multipliers for converting between different units used in the Teskooano simulation. These factors are used for distance calculations, time conversions, UI display formatting, and unit transformations throughout the codebase.

## Distance Conversion Factors

### KM

```typescript
export const KM = 1000;
```

Kilometers to meters conversion factor.

**Description:**
Standard conversion factor for converting kilometers to meters. Used throughout the simulation for distance calculations, UI display, and converting between different distance units.

**Value:** 1,000 meters per kilometer

**Usage Examples:**

```typescript
// Convert distance from kilometers to meters
const distanceInMeters = distanceInKm * KM;

// Display distance in appropriate units
const displayDistance =
  distance > 1000 ? `${distance / KM} km` : `${distance} m`;

// Calculate orbital velocity in m/s from km/s
const velocityMs = velocityKms * KM;
```

### MM

```typescript
export const MM = 1e6;
```

Megameters to meters conversion factor.

**Description:**
Conversion factor for converting megameters (1 million meters) to meters. Used for intermediate-scale distance calculations, particularly for planetary and lunar distances in the simulation.

**Value:** 1,000,000 meters per megameter

**Usage Examples:**

```typescript
// Convert planetary radius from megameters to meters
const radiusInMeters = radiusInMm * MM;

// Calculate distance to moon in appropriate units
const moonDistance = distanceInMm * MM; // e.g., 384 Mm = 384,000 km

// Display large distances in megameters
const displayDistance =
  distance > MM ? `${distance / MM} Mm` : `${distance / KM} km`;
```

### GM

```typescript
export const GM = 1e9;
```

Gigameters to meters conversion factor.

**Description:**
Conversion factor for converting gigameters (1 billion meters) to meters. Used for large-scale distance calculations, particularly for interplanetary distances and solar system scales.

**Value:** 1,000,000,000 meters per gigameter

**Usage Examples:**

```typescript
// Convert interplanetary distance from gigameters to meters
const distanceInMeters = distanceInGm * GM;

// Calculate Mars-Earth distance in gigameters
const marsDistance = 225 * GM; // 225 Gm = 225 million km

// Display solar system distances appropriately
const displayDistance =
  distance > GM ? `${distance / GM} Gm` : `${distance / MM} Mm`;
```

### TM

```typescript
export const TM = 1e12;
```

Terameters to meters conversion factor.

**Description:**
Conversion factor for converting terameters (1 trillion meters) to meters. Used for very large-scale distance calculations, particularly for interstellar distances and outer solar system objects.

**Value:** 1,000,000,000,000 meters per terameter

**Usage Examples:**

```typescript
// Convert interstellar distance from terameters to meters
const distanceInMeters = distanceInTm * TM;

// Calculate distance to outer solar system objects
const plutoDistance = 5.9 * TM; // 5.9 Tm = 5.9 billion km

// Display interstellar distances appropriately
const displayDistance =
  distance > TM ? `${distance / TM} Tm` : `${distance / GM} Gm`;
```

### PM

```typescript
export const PM = 1e15;
```

Petameters to meters conversion factor.

**Description:**
Conversion factor for converting petameters (1 quadrillion meters) to meters. Used for extremely large-scale distance calculations, particularly for intergalactic distances and deep space objects.

**Value:** 1,000,000,000,000,000 meters per petameter

**Usage Examples:**

```typescript
// Convert intergalactic distance from petameters to meters
const distanceInMeters = distanceInPm * PM;

// Calculate distance to nearby galaxies
const andromedaDistance = 2.5e6 * PM; // 2.5 million Pm = 2.5 million light years

// Display intergalactic distances appropriately
const displayDistance =
  distance > PM ? `${distance / PM} Pm` : `${distance / TM} Tm`;
```

## Time Conversion Factors

### SECONDS_PER_MINUTE

```typescript
export const SECONDS_PER_MINUTE = 60;
```

Seconds per minute conversion factor.

**Description:**
Standard conversion factor for converting minutes to seconds. Used for short time calculations, UI time displays, and converting between different time units.

**Value:** 60 seconds per minute

**Usage Examples:**

```typescript
// Convert rotation period from minutes to seconds
const rotationSeconds = rotationMinutes * SECONDS_PER_MINUTE;

// Calculate time step in seconds
const timeStepSeconds = timeStepMinutes * SECONDS_PER_MINUTE;

// Display short time periods
const displayTime =
  time < SECONDS_PER_HOUR
    ? `${time / SECONDS_PER_MINUTE} minutes`
    : `${time / SECONDS_PER_HOUR} hours`;

// Convert orbital period to minutes for display
const periodMinutes = orbitalPeriod / SECONDS_PER_MINUTE;
```

### SECONDS_PER_HOUR

```typescript
export const SECONDS_PER_HOUR = 3600;
```

Seconds per hour conversion factor.

**Description:**
Standard conversion factor for converting hours to seconds. Used for medium-term time calculations, simulation time steps, and converting between different time units.

**Value:** 3,600 seconds per hour

**Usage Examples:**

```typescript
// Convert simulation time from hours to seconds
const simulationSeconds = simulationHours * SECONDS_PER_HOUR;

// Calculate time warp factor
const timeWarp = realTimeSeconds / (simulationTime * SECONDS_PER_HOUR);

// Display medium time periods
const displayTime =
  time < SECONDS_PER_DAY
    ? `${time / SECONDS_PER_HOUR} hours`
    : `${time / SECONDS_PER_DAY} days`;

// Convert orbital period to hours for display
const periodHours = orbitalPeriod / SECONDS_PER_HOUR;
```

### SECONDS_PER_DAY

```typescript
export const SECONDS_PER_DAY = 86400;
```

Seconds per day conversion factor.

**Description:**
Standard conversion factor for converting days to seconds. Used for daily time calculations, planetary rotation periods, and converting between different time units.

**Value:** 86,400 seconds per day

**Usage Examples:**

```typescript
// Convert planetary rotation period from days to seconds
const rotationSeconds = rotationDays * SECONDS_PER_DAY;

// Calculate time elapsed in days
const elapsedDays = elapsedSeconds / SECONDS_PER_DAY;

// Display daily time periods
const displayTime =
  time < SECONDS_PER_YEAR
    ? `${time / SECONDS_PER_DAY} days`
    : `${time / SECONDS_PER_YEAR} years`;

// Convert orbital period to days for display
const periodDays = orbitalPeriod / SECONDS_PER_DAY;

// Calculate synodic period in days
const synodicDays = synodicSeconds / SECONDS_PER_DAY;
```

### SECONDS_PER_YEAR

```typescript
export const SECONDS_PER_YEAR = 31557600;
```

Seconds per year conversion factor (Julian year).

**Description:**
Standard conversion factor for converting Julian years to seconds. Used for annual time calculations, orbital periods, and long-term time measurements in the simulation.

**Value:** 31,557,600 seconds per Julian year

**Usage Examples:**

```typescript
// Convert orbital period from years to seconds
const periodSeconds = periodYears * SECONDS_PER_YEAR;

// Calculate stellar age in seconds
const ageSeconds = ageYears * SECONDS_PER_YEAR;

// Display annual time periods
const displayTime =
  time > SECONDS_PER_YEAR
    ? `${time / SECONDS_PER_YEAR} years`
    : `${time / SECONDS_PER_DAY} days`;

// Convert orbital period to years for display
const periodYears = orbitalPeriod / SECONDS_PER_YEAR;

// Calculate time to next conjunction
const conjunctionTime = conjunctionSeconds / SECONDS_PER_YEAR;
```

### SECONDS_PER_YEAR_GREGORIAN

```typescript
export const SECONDS_PER_YEAR_GREGORIAN = 31536000;
```

Seconds per year conversion factor (Gregorian approximation).

**Description:**
Conversion factor for converting Gregorian years to seconds. This is a simplified approximation (365 days exactly) used for calendar-based calculations and UI displays where precision is less critical than simplicity.

**Value:** 31,536,000 seconds per Gregorian year

**Usage Examples:**

```typescript
// Convert calendar years to seconds for UI display
const calendarSeconds = calendarYears * SECONDS_PER_YEAR_GREGORIAN;

// Calculate time until next calendar event
const timeUntilEvent = eventTime * SECONDS_PER_YEAR_GREGORIAN;

// Display calendar-based time periods
const displayTime =
  time > SECONDS_PER_YEAR_GREGORIAN
    ? `${time / SECONDS_PER_YEAR_GREGORIAN} years`
    : `${time / SECONDS_PER_DAY} days`;

// Convert simulation time to calendar years for display
const calendarYears = simulationTime / SECONDS_PER_YEAR_GREGORIAN;

// Note: For precise astronomical calculations, use SECONDS_PER_YEAR (Julian)
```

## Usage Patterns

### Distance Unit Selection

```typescript
function formatDistance(meters: number): string {
  if (meters >= PM) {
    return `${(meters / PM).toFixed(2)} Pm`;
  } else if (meters >= TM) {
    return `${(meters / TM).toFixed(2)} Tm`;
  } else if (meters >= GM) {
    return `${(meters / GM).toFixed(2)} Gm`;
  } else if (meters >= MM) {
    return `${(meters / MM).toFixed(2)} Mm`;
  } else if (meters >= KM) {
    return `${(meters / KM).toFixed(2)} km`;
  } else {
    return `${meters.toFixed(0)} m`;
  }
}
```

### Time Unit Selection

```typescript
function formatTime(seconds: number): string {
  if (seconds >= SECONDS_PER_YEAR) {
    return `${(seconds / SECONDS_PER_YEAR).toFixed(2)} years`;
  } else if (seconds >= SECONDS_PER_DAY) {
    return `${(seconds / SECONDS_PER_DAY).toFixed(1)} days`;
  } else if (seconds >= SECONDS_PER_HOUR) {
    return `${(seconds / SECONDS_PER_HOUR).toFixed(1)} hours`;
  } else if (seconds >= SECONDS_PER_MINUTE) {
    return `${(seconds / SECONDS_PER_MINUTE).toFixed(1)} minutes`;
  } else {
    return `${seconds.toFixed(1)} seconds`;
  }
}
```

### Unit Conversion Chain

```typescript
function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  const conversionFactors = {
    // Distance factors
    km: KM,
    mm: MM,
    gm: GM,
    tm: TM,
    pm: PM,

    // Time factors
    minute: SECONDS_PER_MINUTE,
    hour: SECONDS_PER_HOUR,
    day: SECONDS_PER_DAY,
    year: SECONDS_PER_YEAR,
    year_gregorian: SECONDS_PER_YEAR_GREGORIAN,
  };

  const fromFactor = conversionFactors[fromUnit] || 1;
  const toFactor = conversionFactors[toUnit] || 1;

  return (value * fromFactor) / toFactor;
}
```

## Performance Considerations

### Compile-Time Constants

- All factors are compile-time constants
- No runtime overhead for constant access
- Tree-shaking eliminates unused factors

### Numerical Precision

- Factors chosen to avoid floating-point precision issues
- Powers of 10 for clean decimal representations
- Sufficient precision for astronomical calculations

### Memory Efficiency

- Single constant definitions
- No object allocation
- Minimal memory footprint

## Integration

### Physics System

- Unit normalization for calculations
- Distance scaling for gravitational forces
- Time scaling for orbital mechanics

### UI System

- User-friendly unit display
- Input validation and conversion
- Multi-unit support

### Rendering System

- Scene unit conversion
- LOD distance calculations
- Camera movement scaling

## 🔗 Related

- [[Unit Conversions]] - Conversion utility functions using these factors
- [[Physical Constants]] - Fundamental constants used with conversions
- [[Astronomical Constants]] - Astronomical units using these factors
- [[Scaling Constants]] - Physics to rendering conversion factors
- [[@teskooano/core-physics]] - Physics system using conversion factors
- [[@teskooano/renderer-threejs]] - Rendering system using conversion factors
