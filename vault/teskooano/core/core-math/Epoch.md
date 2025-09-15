---
aliases: [Epoch]
tags: [core, math, epoch, astronomy, time]
type: Module
package: "@teskooano/core-math"
name: epoch
exports:
  [
    "getCurrentEpoch",
    "getCurrentPreciseEpoch",
    "getCurrentJulianDay",
    "J2000_EPOCH",
    "J2000_JULIAN_DAY",
    "dateToJulianDay",
    "julianDayToYearsSinceJ2000",
    "yearsSinceJ2000ToJulianDay",
    "getJulianDayForEpoch",
    "validateEpochConsistency",
    "generateEpochSummary",
    "calculateProcessingStats",
    "logEpochAnalysis",
    "logProcessingStats",
  ]
interfaces: ["EpochProcessingStats", "EpochValidationResult", "EpochSummary"]
status: active
---

# Epoch

Comprehensive epoch utilities for astronomical calculations, time conversions, and celestial object validation in the Open Space engine.

## Overview

The `epoch` module provides comprehensive utilities for handling astronomical epochs, time calculations, and validation of celestial object data. It supports multiple epoch formats, provides conversion between different time systems, and offers validation tools to ensure consistency across celestial objects in the simulation.

## Core Concepts

### Astronomical Epochs

An epoch is a specific moment in time used as a reference point for astronomical calculations. The Open Space engine supports multiple epoch formats:

- **Julian Epoch**: J2000, J2025, etc. (standard astronomical format)
- **Julian Day**: JD 2451545.0, 2460675.0 (continuous day count)
- **ISO Dates**: 2025-05-05, 2025-05-05T12:30:45 (standard date formats)

### Julian Day System

Julian Day is a continuous count of days since January 1, 4713 BC, providing a precise time reference for astronomical calculations.

## API Reference

### Current Time Functions

#### `getCurrentEpoch(): string`

Gets the current date as an epoch string (YYYY-MM-DD format).

**Returns:** Current epoch string

**Usage:**

```typescript
import { getCurrentEpoch } from "@teskooano/core-math";

const currentEpoch = getCurrentEpoch(); // "2025-01-15"
```

**Applications:**

- Dynamic position calculations
- Real-time celestial object positioning
- Current time reference for simulations

#### `getCurrentPreciseEpoch(): string`

Gets the current date and time as a precise epoch string (YYYY-MM-DDTHH:MM:SS format).

**Returns:** Current precise epoch string

**Usage:**

```typescript
import { getCurrentPreciseEpoch } from "@teskooano/core-math";

const preciseEpoch = getCurrentPreciseEpoch(); // "2025-01-15T14:30:45"
```

**Applications:**

- High-precision positioning for fast-moving objects
- Satellite tracking
- Real-time astronomical calculations

#### `getCurrentJulianDay(): number`

Gets the current Julian Day number with time precision.

**Returns:** Current Julian Day number

**Usage:**

```typescript
import { getCurrentJulianDay } from "@teskooano/core-math";

const currentJD = getCurrentJulianDay(); // 2460675.123456
```

**Applications:**

- Most accurate time representation
- Astronomical calculations
- Time difference calculations

### Standard Epochs

#### `J2000_EPOCH`

**Type:** `string`  
**Value:** `"J2000"`

The J2000 epoch as the standard astronomical reference.

**Usage:**

```typescript
import { J2000_EPOCH } from "@teskooano/core-math";

const epoch = J2000_EPOCH; // "J2000"
```

#### `J2000_JULIAN_DAY`

**Type:** `number`  
**Value:** `2451545.0`

Julian Day number for J2000 epoch (January 1, 2000 12:00:00 UTC).

**Usage:**

```typescript
import { J2000_JULIAN_DAY } from "@teskooano/core-math";

const jd = J2000_JULIAN_DAY; // 2451545.0
```

### Conversion Functions

#### `dateToJulianDay(date: Date): number`

Converts a JavaScript Date to Julian Day number.

**Parameters:**

- `date`: JavaScript Date object

**Returns:** Julian Day number

**Usage:**

```typescript
import { dateToJulianDay } from "@teskooano/core-math";

const date = new Date("2025-01-15T12:00:00Z");
const jd = dateToJulianDay(date); // 2460675.0
```

#### `julianDayToYearsSinceJ2000(julianDay: number): number`

Converts Julian Day to years since J2000 epoch.

**Parameters:**

- `julianDay`: Julian Day number

**Returns:** Years since J2000

**Usage:**

```typescript
import { julianDayToYearsSinceJ2000 } from "@teskooano/core-math";

const jd = 2460675.0; // 2025-01-15
const years = julianDayToYearsSinceJ2000(jd); // 25.04
```

#### `yearsSinceJ2000ToJulianDay(years: number): number`

Converts years since J2000 to Julian Day.

**Parameters:**

- `years`: Years since J2000

**Returns:** Julian Day number

**Usage:**

```typescript
import { yearsSinceJ2000ToJulianDay } from "@teskooano/core-math";

const years = 25.04;
const jd = yearsSinceJ2000ToJulianDay(years); // 2460675.0
```

#### `getJulianDayForEpoch(epoch: string): number`

Converts an epoch string to Julian Day number.

**Parameters:**

- `epoch`: Epoch string in various formats

**Returns:** Julian Day number

**Usage:**

```typescript
import { getJulianDayForEpoch } from "@teskooano/core-math";

// Julian epoch format
const jd1 = getJulianDayForEpoch("J2000"); // 2451545.0
const jd2 = getJulianDayForEpoch("J2025"); // 2460675.0

// Julian Day format
const jd3 = getJulianDayForEpoch("JD 2451545.0"); // 2451545.0

// ISO date format
const jd4 = getJulianDayForEpoch("2025-01-15"); // 2460675.0
const jd5 = getJulianDayForEpoch("2025-01-15T12:30:45"); // 2460675.521354
```

### Validation Functions

#### `validateEpochConsistency<T>(objects: Array<{ name: string; orbit?: { epoch: string } }>): EpochValidationResult`

Validates epoch consistency across all celestial objects.

**Parameters:**

- `objects`: Array of celestial objects with orbit data

**Returns:** Comprehensive validation results

**Usage:**

```typescript
import { validateEpochConsistency } from "@teskooano/core-math";

const objects = [
  { name: "Earth", orbit: { epoch: "J2000" } },
  { name: "Mars", orbit: { epoch: "J2000" } },
  { name: "Jupiter", orbit: { epoch: "J2025" } },
];

const validation = validateEpochConsistency(objects);
console.log(validation.isConsistent); // false
console.log(validation.epochs); // Set(["J2000", "J2025"])
console.log(validation.inconsistentObjects); // [{ name: "Jupiter", epoch: "J2025" }]
```

#### `generateEpochSummary<T>(objects: Array<{ orbit?: { epoch: string } }>): EpochSummary`

Generates comprehensive epoch statistics and analysis.

**Parameters:**

- `objects`: Array of celestial objects with orbit data

**Returns:** Detailed epoch summary

**Usage:**

```typescript
import { generateEpochSummary } from "@teskooano/core-math";

const objects = [
  { orbit: { epoch: "J2000" } },
  { orbit: { epoch: "J2000" } },
  { orbit: { epoch: "J2025" } },
];

const summary = generateEpochSummary(objects);
console.log(summary.totalObjects); // 3
console.log(summary.epochCounts); // { "J2000": 2, "J2025": 1 }
```

#### `calculateProcessingStats(processedObjects: Map<string, { originalEpoch: string; currentEpoch: string; yearsDifference: number; timeDifferenceSeconds: number }>): EpochProcessingStats`

Calculates processing statistics from epoch processing operations.

**Parameters:**

- `processedObjects`: Map of processed object information

**Returns:** Complete processing statistics

**Usage:**

```typescript
import { calculateProcessingStats } from "@teskooano/core-math";

const processedObjects = new Map([
  [
    "Earth",
    {
      originalEpoch: "J2000",
      currentEpoch: "2025-01-15",
      yearsDifference: 25,
      timeDifferenceSeconds: 788400000,
    },
  ],
  [
    "Mars",
    {
      originalEpoch: "J2000",
      currentEpoch: "2025-01-15",
      yearsDifference: 25,
      timeDifferenceSeconds: 788400000,
    },
  ],
]);

const stats = calculateProcessingStats(processedObjects);
console.log(stats.totalObjects); // 2
console.log(stats.averageYearsDifference); // 25
```

### Logging Functions

#### `logEpochAnalysis<T>(objects: Array<{ name: string; orbit?: { epoch: string } }>, title?: string): void`

Logs comprehensive epoch analysis information to the console.

**Parameters:**

- `objects`: Array of celestial objects to analyze
- `title`: Optional title for the log output

**Usage:**

```typescript
import { logEpochAnalysis } from "@teskooano/core-math";

const objects = [
  { name: "Earth", orbit: { epoch: "J2000" } },
  { name: "Mars", orbit: { epoch: "J2025" } },
];

logEpochAnalysis(objects, "Solar System Epoch Analysis");
// Outputs detailed analysis to console
```

#### `logProcessingStats(stats: EpochProcessingStats, title?: string): void`

Logs processing statistics from epoch processing operations.

**Parameters:**

- `stats`: Processing statistics to log
- `title`: Optional title for the log output

**Usage:**

```typescript
import { logProcessingStats } from "@teskooano/core-math";

const stats = calculateProcessingStats(processedObjects);
logProcessingStats(stats, "Epoch Processing Results");
// Outputs detailed statistics to console
```

## Data Types

### `EpochProcessingStats`

Statistics about epoch processing across a collection of objects.

```typescript
interface EpochProcessingStats {
  totalObjects: number;
  currentEpoch: string;
  epochTypes: Record<string, number>;
  averageYearsDifference: number;
  maxYearsDifference: number;
  averageTimeDifferenceSeconds: number;
  objectsWithLargeDifferences: Array<{
    name: string;
    yearsDifference: number;
    timeDifferenceSeconds: number;
    originalEpoch: string;
  }>;
}
```

### `EpochValidationResult`

Results of epoch consistency validation.

```typescript
interface EpochValidationResult {
  isConsistent: boolean;
  epochs: Set<string>;
  inconsistentObjects: Array<{ name: string; epoch: string }>;
  issues: Array<{ objectName: string; issue: string }>;
}
```

### `EpochSummary`

Detailed epoch summary for analysis and debugging.

```typescript
interface EpochSummary {
  totalObjects: number;
  epochCounts: Record<string, number>;
  epochBreakdown: Array<{
    epoch: string;
    count: number;
    percentage: number;
    julianDay: number;
    daysDifferenceFromCurrent: number;
  }>;
}
```

## Usage Examples

### Basic Epoch Operations

```typescript
import {
  getCurrentEpoch,
  getCurrentPreciseEpoch,
  getCurrentJulianDay,
  J2000_EPOCH,
  J2000_JULIAN_DAY,
} from "@teskooano/core-math";

// Get current time references
const currentEpoch = getCurrentEpoch(); // "2025-01-15"
const preciseEpoch = getCurrentPreciseEpoch(); // "2025-01-15T14:30:45"
const currentJD = getCurrentJulianDay(); // 2460675.123456

// Use standard epochs
const j2000Epoch = J2000_EPOCH; // "J2000"
const j2000JD = J2000_JULIAN_DAY; // 2451545.0
```

### Epoch Conversions

```typescript
import {
  getJulianDayForEpoch,
  dateToJulianDay,
  julianDayToYearsSinceJ2000,
  yearsSinceJ2000ToJulianDay,
} from "@teskooano/core-math";

// Convert various epoch formats
const jd1 = getJulianDayForEpoch("J2000"); // 2451545.0
const jd2 = getJulianDayForEpoch("J2025"); // 2460675.0
const jd3 = getJulianDayForEpoch("2025-01-15"); // 2460675.0
const jd4 = getJulianDayForEpoch("JD 2451545.0"); // 2451545.0

// Convert JavaScript Date
const date = new Date("2025-01-15T12:00:00Z");
const jd = dateToJulianDay(date); // 2460675.0

// Convert between Julian Day and years since J2000
const years = julianDayToYearsSinceJ2000(2460675.0); // 25.04
const jdBack = yearsSinceJ2000ToJulianDay(25.04); // 2460675.0
```

### Celestial Object Validation

```typescript
import {
  validateEpochConsistency,
  generateEpochSummary,
  logEpochAnalysis,
} from "@teskooano/core-math";

// Define celestial objects
const celestialObjects = [
  { name: "Sun", orbit: { epoch: "J2000" } },
  { name: "Mercury", orbit: { epoch: "J2000" } },
  { name: "Venus", orbit: { epoch: "J2000" } },
  { name: "Earth", orbit: { epoch: "J2000" } },
  { name: "Mars", orbit: { epoch: "J2025" } }, // Inconsistent
  { name: "Jupiter", orbit: { epoch: "J2000" } },
  { name: "Saturn", orbit: { epoch: "J2000" } },
  { name: "Uranus", orbit: { epoch: "J2000" } },
  { name: "Neptune", orbit: { epoch: "J2000" } },
];

// Validate epoch consistency
const validation = validateEpochConsistency(celestialObjects);
console.log("Is consistent:", validation.isConsistent); // false
console.log("Epochs found:", Array.from(validation.epochs)); // ["J2000", "J2025"]
console.log("Inconsistent objects:", validation.inconsistentObjects);
// [{ name: "Mars", epoch: "J2025" }]

// Generate detailed summary
const summary = generateEpochSummary(celestialObjects);
console.log("Total objects:", summary.totalObjects); // 9
console.log("Epoch distribution:", summary.epochCounts);
// { "J2000": 8, "J2025": 1 }

// Log comprehensive analysis
logEpochAnalysis(celestialObjects, "Solar System Epoch Analysis");
```

### Epoch Processing Pipeline

```typescript
import {
  getCurrentPreciseEpoch,
  getJulianDayForEpoch,
  calculateProcessingStats,
  logProcessingStats,
} from "@teskooano/core-math";

class EpochProcessor {
  private processedObjects = new Map<
    string,
    {
      originalEpoch: string;
      currentEpoch: string;
      yearsDifference: number;
      timeDifferenceSeconds: number;
    }
  >();

  processObject(name: string, originalEpoch: string): void {
    const currentEpoch = getCurrentPreciseEpoch();
    const originalJD = getJulianDayForEpoch(originalEpoch);
    const currentJD = getJulianDayForEpoch(currentEpoch);

    const daysDifference = currentJD - originalJD;
    const yearsDifference = daysDifference / 365.25;
    const timeDifferenceSeconds = daysDifference * 86400;

    this.processedObjects.set(name, {
      originalEpoch,
      currentEpoch,
      yearsDifference,
      timeDifferenceSeconds,
    });
  }

  generateReport(): void {
    const stats = calculateProcessingStats(this.processedObjects);
    logProcessingStats(stats, "Epoch Processing Report");
  }
}

// Usage
const processor = new EpochProcessor();
processor.processObject("Earth", "J2000");
processor.processObject("Mars", "J2025");
processor.processObject("Jupiter", "J2000");
processor.generateReport();
```

### Time-Based Calculations

```typescript
import {
  getCurrentJulianDay,
  getJulianDayForEpoch,
  julianDayToYearsSinceJ2000,
} from "@teskooano/core-math";

class TimeCalculator {
  // Calculate time since a specific epoch
  getTimeSinceEpoch(epoch: string): number {
    const currentJD = getCurrentJulianDay();
    const epochJD = getJulianDayForEpoch(epoch);
    return currentJD - epochJD;
  }

  // Calculate years since J2000
  getYearsSinceJ2000(): number {
    const currentJD = getCurrentJulianDay();
    return julianDayToYearsSinceJ2000(currentJD);
  }

  // Check if epoch is recent (within last year)
  isRecentEpoch(epoch: string): boolean {
    const daysSince = this.getTimeSinceEpoch(epoch);
    return daysSince < 365.25;
  }

  // Get epoch age in years
  getEpochAge(epoch: string): number {
    const daysSince = this.getTimeSinceEpoch(epoch);
    return daysSince / 365.25;
  }
}

// Usage
const calculator = new TimeCalculator();
const yearsSinceJ2000 = calculator.getYearsSinceJ2000(); // 25.04
const isRecent = calculator.isRecentEpoch("2024-01-01"); // true
const age = calculator.getEpochAge("J2000"); // 25.04
```

### Astronomical Calculations

```typescript
import {
  getJulianDayForEpoch,
  julianDayToYearsSinceJ2000,
  yearsSinceJ2000ToJulianDay,
} from "@teskooano/core-math";

class AstronomicalCalculator {
  // Calculate orbital position at specific epoch
  calculateOrbitalPosition(
    epoch: string,
    semiMajorAxis: number,
    eccentricity: number,
    meanAnomaly: number,
  ): { x: number; y: number; z: number } {
    const jd = getJulianDayForEpoch(epoch);
    const yearsSinceJ2000 = julianDayToYearsSinceJ2000(jd);

    // Calculate mean anomaly at epoch
    const meanMotion = Math.sqrt(
      1 / (semiMajorAxis * semiMajorAxis * semiMajorAxis),
    );
    const currentMeanAnomaly = meanAnomaly + meanMotion * yearsSinceJ2000;

    // Calculate position (simplified)
    const x = semiMajorAxis * Math.cos(currentMeanAnomaly);
    const y = semiMajorAxis * Math.sin(currentMeanAnomaly);
    const z = 0; // Simplified 2D orbit

    return { x, y, z };
  }

  // Calculate time to next orbital event
  getTimeToNextEvent(currentEpoch: string, eventEpoch: string): number {
    const currentJD = getJulianDayForEpoch(currentEpoch);
    const eventJD = getJulianDayForEpoch(eventEpoch);
    return eventJD - currentJD;
  }
}

// Usage
const calculator = new AstronomicalCalculator();
const position = calculator.calculateOrbitalPosition(
  "J2000",
  1.0, // 1 AU
  0.0167, // Earth's eccentricity
  0, // Mean anomaly at J2000
);
```

## Best Practices

### Epoch Selection

- **Use J2000** for standard astronomical calculations
- **Use current epoch** for real-time simulations
- **Use discovery epoch** for historical accuracy
- **Validate consistency** across related objects

### Performance Considerations

- **Cache conversions** for frequently used epochs
- **Batch process** multiple objects together
- **Use appropriate precision** for the application
- **Validate epochs** before expensive calculations

### Error Handling

- **Handle invalid epochs** gracefully
- **Provide fallback values** for unknown formats
- **Log warnings** for inconsistent epochs
- **Validate time ranges** for reasonable values

## 🔗 Related

- [[Constants]] - Mathematical constants for time calculations
- [[Utils]] - Utility functions for time operations
- [[@teskooano/core-physics]] - Physics calculations using epochs
- [[@teskooano/core-state]] - State management with time references
- [[@teskooano/systems-solar-system]] - Solar system data with epochs
