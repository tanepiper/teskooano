# processSolarSystemToCurrentTime

A high-level function that processes all solar system celestial objects from their original epochs to their current positions based on the actual current time.

## Function Definition

```typescript
export function processSolarSystemToCurrentTime<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[];
```

## Overview

The `processSolarSystemToCurrentTime` function is the main entry point for dynamic epoch processing. It creates a `DynamicEpochProcessor` instance and processes all celestial objects to calculate their current positions from their historical orbital data.

## Parameters

- **`objects`**: `CelestialObject<T>[]` - Array of celestial objects to process

## Returns

- **`CelestialObject<T>[]`** - Array of celestial objects with updated positions for current time

## Behavior

### Processing Flow

1. **Create Processor**: Instantiates a new `DynamicEpochProcessor`
2. **Process Objects**: Calls `processor.processObjects()` to update all objects
3. **Return Results**: Returns the processed objects with current positions

### Implementation

```typescript
export function processSolarSystemToCurrentTime<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  const processor = new DynamicEpochProcessor();
  return processor.processObjects(objects);
}
```

## Usage Examples

### Basic Usage

```typescript
import {
  processSolarSystemToCurrentTime,
  solarSystemBodies,
} from "@teskooano/systems-solar-system";

// Process all solar system bodies to current time
const currentPositionBodies =
  processSolarSystemToCurrentTime(solarSystemBodies);

console.log(
  "Processed",
  currentPositionBodies.length,
  "objects to current time",
);
```

### Integration with Initialization

```typescript
import {
  fixEmptyEpochs,
  processSolarSystemToCurrentTime,
  solarSystemBodies,
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

### Processing Specific Object Sets

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

// Process only planets
const planets = solarSystemBodies.filter((obj) => obj.type === "planet");
const currentPlanets = processSolarSystemToCurrentTime(planets);

// Process only satellites
const satellites = solarSystemBodies.filter((obj) => obj.type === "satellite");
const currentSatellites = processSolarSystemToCurrentTime(satellites);
```

### With Error Handling

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

try {
  const currentPositionBodies =
    processSolarSystemToCurrentTime(solarSystemBodies);
  console.log("Successfully processed objects to current time");
} catch (error) {
  console.error("Failed to process objects to current time:", error);
  // Handle processing failure
}
```

## What Gets Processed

### Position Updates

The function updates orbital elements to reflect current positions:

```typescript
// Example: Earth's orbital elements
const earthOriginal = {
  orbit: {
    epoch: "J2000",
    meanAnomalyDeg: 358.617,
    // ... other elements
  },
};

const earthCurrent = {
  orbit: {
    epoch: "2024-01-15T12:00:00.000Z",
    meanAnomalyDeg: 15.234, // Updated for current time
    // ... other elements updated
  },
};
```

### Epoch Conversion

Objects are processed from their original epochs to current time:

- **J2000 → Current**: Standard astronomical epoch to present
- **Specific Date → Current**: Historical observations to present
- **Current → Current**: No change needed (already current)

## Performance Characteristics

- **Efficient Processing**: Optimized for large object sets
- **Memory Management**: Proper cleanup and resource management
- **Real-time Accuracy**: Precise position calculations
- **Scalable**: Handles hundreds of celestial objects efficiently

## Integration with DynamicEpochProcessor

The function is a convenience wrapper around `DynamicEpochProcessor`:

```typescript
// Equivalent to:
const processor = new DynamicEpochProcessor();
const result = processor.processObjects(objects);

// But more concise:
const result = processSolarSystemToCurrentTime(objects);
```

## Error Handling

The function includes comprehensive error handling:

```typescript
try {
  const currentPositionBodies =
    processSolarSystemToCurrentTime(solarSystemBodies);
} catch (error) {
  if (error.message.includes("epoch")) {
    console.error("Epoch processing failed:", error);
  } else if (error.message.includes("orbit")) {
    console.error("Orbital calculation failed:", error);
  } else {
    console.error("Position processing failed:", error);
  }
}
```

## Use Cases

### Solar System Initialization

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

// Main use case: Initialize solar system with current positions
function initializeSolarSystem() {
  const currentPositionBodies =
    processSolarSystemToCurrentTime(solarSystemBodies);
  celestialManager.addObjects(currentPositionBodies);
}
```

### Real-time Updates

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

// Update positions periodically
function updateSolarSystemPositions() {
  const currentPositionBodies =
    processSolarSystemToCurrentTime(solarSystemBodies);
  celestialManager.updateObjects(currentPositionBodies);
}
```

### Mission Planning

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

// Calculate current positions for mission planning
function planMission() {
  const currentPositions = processSolarSystemToCurrentTime(solarSystemBodies);

  // Use current positions for trajectory calculations
  const trajectory = calculateTrajectory(currentPositions);
  return trajectory;
}
```

## Best Practices

1. **Call After Epoch Fixing**: Always call `fixEmptyEpochs` first
2. **Handle Errors**: Wrap in try-catch for robust error handling
3. **Verify Results**: Check that objects were processed successfully
4. **Performance**: Process objects in batches for large datasets
5. **Synchronization**: Ensure simulation time matches processed positions

## Testing

```typescript
import { processSolarSystemToCurrentTime } from "@teskooano/systems-solar-system";

// Test processing
const testObjects = [
  {
    id: "earth",
    orbit: {
      epoch: "J2000",
      meanAnomalyDeg: 358.617,
      // ... other elements
    },
  },
];

const result = processSolarSystemToCurrentTime(testObjects);

// Verify epoch was updated
console.assert(result[0].orbit.epoch !== "J2000");
console.assert(result[0].orbit.meanAnomalyDeg !== 358.617);
```

## Related

- [[DynamicEpochProcessor]] - The underlying processor class
- [[fixEmptyEpochs]] - Standardizes epochs before processing
- [[initializeSolarSystem]] - Main function that uses this processor
- [[@teskooano/core-physics]] - Provides orbital mechanics calculations
- [[@teskooano/core-math]] - Provides epoch conversion utilities
