---
aliases: [fixEmptyEpochs]
tags: [systems, solar-system, epoch, function, astronomy, physics]
type: Function
package: "@teskooano/systems-solar-system"
dependencies: ["@teskooano/data-types"]
classes: ["CelestialObject"]
functions: ["fixEmptyEpochs"]
constants: ["J2000"]
types: ["CelestialObject"]
status: active
---

# fixEmptyEpochs

A utility function that standardizes epoch values for celestial objects by setting empty or missing epochs to the standard astronomical epoch (J2000).

## Function Definition

```typescript
export function fixEmptyEpochs<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[];
```

## Overview

The `fixEmptyEpochs` function ensures that all celestial objects have valid epoch values by replacing empty, null, or undefined epochs with "J2000", the standard astronomical epoch. This is crucial for maintaining consistency in orbital calculations and position processing.

## Parameters

- **`objects`**: `CelestialObject<T>[]` - Array of celestial objects to process

## Returns

- **`CelestialObject<T>[]`** - Array of celestial objects with standardized epochs

## Behavior

### Epoch Standardization Process

The function processes each celestial object and:

1. **Checks for Empty Epochs**: Identifies objects with missing, empty, or whitespace-only epochs
2. **Sets Default Epoch**: Replaces empty epochs with "J2000"
3. **Preserves Existing Epochs**: Leaves objects with valid epochs unchanged
4. **Maintains Object Structure**: Preserves all other object properties

### Implementation Details

```typescript
export function fixEmptyEpochs<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  return objects.map((object) => {
    if (
      object.orbit &&
      (!object.orbit.epoch || object.orbit.epoch.trim() === "")
    ) {
      return {
        ...object,
        orbit: {
          ...object.orbit,
          epoch: "J2000",
        },
      };
    }
    return object;
  });
}
```

## Usage Examples

### Basic Usage

```typescript
import { fixEmptyEpochs } from "@teskooano/systems-solar-system";

const celestialObjects = [
  {
    id: "earth",
    orbit: {
      epoch: "", // Empty epoch
      semiMajorAxis: 149597870.7,
      // ... other orbital elements
    },
  },
  {
    id: "mars",
    orbit: {
      epoch: "J2000", // Valid epoch
      semiMajorAxis: 227943824,
      // ... other orbital elements
    },
  },
];

const fixedObjects = fixEmptyEpochs(celestialObjects);

// Result: earth.orbit.epoch is now "J2000", mars.orbit.epoch remains "J2000"
```

### Processing Solar System Bodies

```typescript
import {
  fixEmptyEpochs,
  solarSystemBodies,
} from "@teskooano/systems-solar-system";

// Fix epochs for all solar system bodies
const standardizedBodies = fixEmptyEpochs(solarSystemBodies);

console.log("Epochs standardized for", standardizedBodies.length, "objects");
```

### Integration with Initialization

```typescript
import {
  fixEmptyEpochs,
  processSolarSystemToCurrentTime,
} from "@teskooano/systems-solar-system";

function initializeSolarSystem() {
  // Step 1: Standardize epochs
  const fixedEpochBodies = fixEmptyEpochs(solarSystemBodies);

  // Step 2: Process to current time
  const currentPositionBodies =
    processSolarSystemToCurrentTime(fixedEpochBodies);

  // Step 3: Initialize in celestial manager
  celestialManager.addObjects(currentPositionBodies);
}
```

## Epoch Types Handled

### Empty Epochs (Fixed)

- `""` - Empty string
- `"   "` - Whitespace only
- `null` - Null value
- `undefined` - Undefined value

### Valid Epochs (Preserved)

- `"J2000"` - Standard astronomical epoch
- `"2024-01-15T12:00:00.000Z"` - Specific date/time
- `"2024-01-15"` - Date only
- Any non-empty string

## Examples of Epoch Standardization

### Before Processing

```typescript
const objects = [
  {
    id: "mercury",
    orbit: { epoch: "", semiMajorAxis: 57909050 },
  },
  {
    id: "venus",
    orbit: { epoch: "   ", semiMajorAxis: 108208000 },
  },
  {
    id: "earth",
    orbit: { epoch: "J2000", semiMajorAxis: 149597870.7 },
  },
  {
    id: "mars",
    orbit: { epoch: "2024-01-15", semiMajorAxis: 227943824 },
  },
];
```

### After Processing

```typescript
const fixedObjects = [
  {
    id: "mercury",
    orbit: { epoch: "J2000", semiMajorAxis: 57909050 }, // Fixed
  },
  {
    id: "venus",
    orbit: { epoch: "J2000", semiMajorAxis: 108208000 }, // Fixed
  },
  {
    id: "earth",
    orbit: { epoch: "J2000", semiMajorAxis: 149597870.7 }, // Preserved
  },
  {
    id: "mars",
    orbit: { epoch: "2024-01-15", semiMajorAxis: 227943824 }, // Preserved
  },
];
```

## Why J2000?

The J2000 epoch (January 1, 2000, 12:00:00 TT) is used as the standard because:

1. **Astronomical Standard**: Widely used in astronomy and space science
2. **Precision**: Provides a consistent reference point for orbital calculations
3. **Compatibility**: Works with existing astronomical software and databases
4. **Stability**: Reduces numerical errors in long-term calculations

## Performance Characteristics

- **Efficient**: Simple map operation with minimal overhead
- **Non-destructive**: Creates new objects without modifying originals
- **Scalable**: Handles large arrays of celestial objects efficiently
- **Memory-safe**: Proper object cloning prevents reference issues

## Error Handling

The function is designed to be robust:

```typescript
// Handles various edge cases
const edgeCases = [
  { orbit: null }, // No orbit
  { orbit: { epoch: null } }, // Null epoch
  { orbit: { epoch: undefined } }, // Undefined epoch
  { orbit: { epoch: "" } }, // Empty string
  { orbit: { epoch: "   " } }, // Whitespace
];

const fixed = fixEmptyEpochs(edgeCases);
// All objects with orbits get epoch: "J2000"
```

## Integration with Other Functions

### With DynamicEpochProcessor

```typescript
import {
  fixEmptyEpochs,
  DynamicEpochProcessor,
} from "@teskooano/systems-solar-system";

const processor = new DynamicEpochProcessor();

// Standardize epochs first
const fixedObjects = fixEmptyEpochs(solarSystemBodies);

// Then process to current time
const currentObjects = processor.processObjects(fixedObjects);
```

### With Celestial Manager

```typescript
import { fixEmptyEpochs } from "@teskooano/systems-solar-system";
import { celestialManager } from "@teskooano/core-state";

// Fix epochs before adding to manager
const fixedObjects = fixEmptyEpochs(solarSystemBodies);
celestialManager.addObjects(fixedObjects);
```

## Best Practices

1. **Call Early**: Use before any epoch-dependent processing
2. **Batch Processing**: Process all objects at once for efficiency
3. **Verify Results**: Check that epochs are properly standardized
4. **Handle Edge Cases**: Ensure robust handling of various epoch formats

## Testing

```typescript
import { fixEmptyEpochs } from "@teskooano/systems-solar-system";

// Test various epoch scenarios
const testObjects = [
  { orbit: { epoch: "" } },
  { orbit: { epoch: "   " } },
  { orbit: { epoch: "J2000" } },
  { orbit: { epoch: "2024-01-15" } },
];

const result = fixEmptyEpochs(testObjects);

// Verify all epochs are now "J2000" or preserved valid values
result.forEach((obj) => {
  console.assert(
    obj.orbit.epoch === "J2000" || obj.orbit.epoch === "2024-01-15",
  );
});
```

## 📚 Related Documentation

- **[[systems/solar-system/DynamicEpochProcessor|Dynamic Epoch Processor]]** - Processes objects from their epochs to current time
- **[[systems/solar-system/processSolarSystemToCurrentTime|Process Solar System to Current Time]]** - Main function that uses fixEmptyEpochs
- **[[systems/solar-system/initializeSolarSystem|Solar System Initialization]]** - Uses fixEmptyEpochs in the initialization process
- **[[core/core-physics/core-physics|Core Physics Engine]]** - Provides orbital mechanics calculations
- **[[core/core-math/core-math|Core Math Library]]** - Provides epoch conversion utilities
