# DynamicEpochProcessor

A sophisticated class for processing celestial objects to calculate their current positions based on the actual current time. Handles different epoch types and converts them to current positions using precise time calculations for maximum accuracy.

## Class Definition

```typescript
export class DynamicEpochProcessor {
  private currentJulianDay: number;
  private currentPreciseEpoch: string;
  private processedObjects: Map<string, ProcessingInfo> = new Map();

  constructor();
  public processObjects<T>(objects: CelestialObject<T>[]): CelestialObject<T>[];
  public getProcessingStats(): EpochProcessingStats;
  public getObjectInfo(objectName: string): ObjectInfo | null;
  public validateProcessing(): ValidationResult;
}
```

## Properties

### `currentJulianDay: number`

The current Julian day number for precise time calculations.

**Type**: `number`

**Example**: `2460327.5` (current Julian day)

### `currentPreciseEpoch: string`

The current precise epoch string for position calculations.

**Type**: `string`

**Example**: `"2024-01-15T12:00:00.000Z"`

### `processedObjects: Map<string, ProcessingInfo>`

Map tracking processing information for each celestial object.

**Type**: `Map<string, ProcessingInfo>`

**Structure**:

```typescript
interface ProcessingInfo {
  originalEpoch: string;
  currentEpoch: string;
  yearsDifference: number;
  timeDifferenceSeconds: number;
  isPreciseCalculation: boolean;
}
```

## Methods

### `constructor()`

Initializes the processor with current time values.

**Example**:

```typescript
const processor = new DynamicEpochProcessor();
```

**Behavior**:

- Gets current Julian day using `getCurrentJulianDay()`
- Gets current precise epoch using `getCurrentPreciseEpoch()`
- Initializes empty processed objects map

### `processObjects<T>(objects: CelestialObject<T>[]): CelestialObject<T>[]`

Processes all celestial objects to calculate their current positions.

**Parameters**:

- `objects`: `CelestialObject<T>[]` - Array of celestial objects to process

**Returns**: `CelestialObject<T>[]` - Array of objects with updated orbital elements

**Example**:

```typescript
const processor = new DynamicEpochProcessor();
const currentObjects = processor.processObjects(historicalObjects);

// Objects now have orbital elements calculated for current time
console.log("Processed objects:", currentObjects.length);
```

**Behavior**:

- Processes each object individually using `processObject()`
- Logs processing summary
- Returns updated objects with current positions

### `getProcessingStats(): EpochProcessingStats`

Gets comprehensive processing statistics for all objects.

**Returns**: `EpochProcessingStats` - Statistics about the processing operation

**Example**:

```typescript
const stats = processor.getProcessingStats();
console.log(`Processed ${stats.totalObjects} objects`);
console.log(`Average time difference: ${stats.averageYearsDifference} years`);
console.log(`Processing time: ${stats.processingTimeMs}ms`);
```

**Statistics Include**:

- Total number of objects processed
- Average, maximum, and minimum years difference
- Number of objects with large time differences
- Total processing time

### `getObjectInfo(objectName: string): ObjectInfo | null`

Gets detailed information about a specific object's epoch processing.

**Parameters**:

- `objectName`: `string` - Name of the celestial object

**Returns**: `ObjectInfo | null` - Processing information or null if not found

**Example**:

```typescript
const earthInfo = processor.getObjectInfo("Earth");
if (earthInfo) {
  console.log(
    `Earth processed from ${earthInfo.originalEpoch} to ${earthInfo.currentEpoch}`,
  );
  console.log(`Time difference: ${earthInfo.yearsDifference} years`);
  console.log(`Julian day difference: ${earthInfo.julianDayDifference}`);
}
```

**Object Info Structure**:

```typescript
interface ObjectInfo {
  originalEpoch: string;
  currentEpoch: string;
  yearsDifference: number;
  timeDifferenceSeconds: number;
  julianDayDifference: number;
  isPreciseCalculation: boolean;
}
```

### `validateProcessing(): ValidationResult`

Validates that all objects have been processed correctly.

**Returns**: `ValidationResult` - Validation results with any issues found

**Example**:

```typescript
const validation = processor.validateProcessing();
if (!validation.isValid) {
  console.warn("Processing validation failed:");
  validation.issues.forEach((issue) => {
    console.warn(`- ${issue.objectName}: ${issue.issue}`);
  });
}
```

**Validation Checks**:

- Epoch consistency (all objects processed to current epoch)
- Time difference warnings (objects with very large time differences)
- Accuracy concerns (objects with >50 year differences)

## Internal Methods

### `processObject<T>(object: CelestialObject<T>): CelestialObject<T>`

Processes a single celestial object to calculate its current position.

**Parameters**:

- `object`: `CelestialObject<T>` - The celestial object to process

**Returns**: `CelestialObject<T>` - Object with updated orbital elements

**Behavior**:

- Skips objects without orbital elements (like the Sun)
- Calculates time difference between original and current epochs
- Uses precise position calculation for maximum accuracy
- Stores processing information for logging and validation

### `logProcessingSummary(): void`

Logs a detailed summary of the epoch processing using shared utilities.

**Behavior**:

- Gets processing statistics
- Logs comprehensive processing summary
- Uses shared logging utilities for consistency

## Usage Examples

### Basic Processing

```typescript
import { DynamicEpochProcessor } from "@teskooano/systems-solar-system";

const processor = new DynamicEpochProcessor();

// Process objects to current positions
const currentObjects = processor.processObjects(historicalObjects);

// Get processing statistics
const stats = processor.getProcessingStats();
console.log("Processing completed:", stats);
```

### Detailed Object Information

```typescript
// Get information about specific objects
const earthInfo = processor.getObjectInfo("Earth");
const marsInfo = processor.getObjectInfo("Mars");

if (earthInfo) {
  console.log("Earth processing details:", {
    originalEpoch: earthInfo.originalEpoch,
    currentEpoch: earthInfo.currentEpoch,
    yearsDifference: earthInfo.yearsDifference,
    timeDifferenceSeconds: earthInfo.timeDifferenceSeconds,
  });
}
```

### Validation and Error Handling

```typescript
// Validate processing results
const validation = processor.validateProcessing();

if (validation.isValid) {
  console.log("All objects processed successfully");
} else {
  console.warn("Processing issues found:");
  validation.issues.forEach((issue) => {
    console.warn(`- ${issue.objectName}: ${issue.issue}`);
  });
}
```

### Processing Statistics Analysis

```typescript
const stats = processor.getProcessingStats();

console.log("Processing Statistics:");
console.log(`- Total objects: ${stats.totalObjects}`);
console.log(
  `- Average time difference: ${stats.averageYearsDifference.toFixed(2)} years`,
);
console.log(
  `- Maximum time difference: ${stats.maxYearsDifference.toFixed(2)} years`,
);
console.log(
  `- Objects with large differences: ${stats.objectsWithLargeTimeDifferences}`,
);
console.log(`- Processing time: ${stats.processingTimeMs}ms`);

// Analyze time differences
if (stats.maxYearsDifference > 100) {
  console.warn("Some objects have very large time differences (>100 years)");
  console.warn("Accuracy may be affected for these objects");
}
```

### Batch Processing with Error Handling

```typescript
try {
  const processor = new DynamicEpochProcessor();
  const processedObjects = processor.processObjects(celestialObjects);

  // Validate results
  const validation = processor.validateProcessing();
  if (!validation.isValid) {
    console.warn("Validation issues:", validation.issues);
  }

  // Get statistics
  const stats = processor.getProcessingStats();
  console.log("Processing completed successfully:", stats);

  return processedObjects;
} catch (error) {
  console.error("Epoch processing failed:", error);
  throw error;
}
```

## Performance Characteristics

- **Efficient Processing**: Optimized for large object sets
- **Memory Management**: Tracks processing information without excessive memory usage
- **Precise Calculations**: Uses high-precision time calculations
- **Validation**: Comprehensive validation with minimal performance impact

## Error Handling

The processor provides comprehensive error handling:

```typescript
// Handle processing errors
try {
  const processedObjects = processor.processObjects(objects);
} catch (error) {
  console.error("Processing failed:", error);
  // Handle error appropriately
}

// Validate processing results
const validation = processor.validateProcessing();
if (!validation.isValid) {
  // Handle validation issues
  validation.issues.forEach((issue) => {
    console.warn(`Issue with ${issue.objectName}: ${issue.issue}`);
  });
}
```

## Integration with Core Systems

The DynamicEpochProcessor integrates with core systems:

```typescript
// Uses core math utilities
import {
  getCurrentJulianDay,
  getCurrentPreciseEpoch,
  getJulianDayForEpoch,
  calculateProcessingStats,
  logProcessingStats,
} from "@teskooano/core-math";

// Uses core physics for position calculations
import { calculateCurrentPositionPrecise } from "@teskooano/core-physics";
```

## Best Practices

1. **Process All Objects**: Always process all objects at once for consistency
2. **Validate Results**: Always validate processing results
3. **Monitor Statistics**: Check processing statistics for accuracy concerns
4. **Handle Errors**: Implement proper error handling for processing failures
5. **Log Processing**: Use logging for debugging and monitoring

## Related

- [[processSolarSystemToCurrentTime]] - Convenience function for processing
- [[@teskooano/core-math]] - Epoch and time calculation utilities
- [[@teskooano/core-physics]] - Orbital mechanics calculations
- [[EpochProcessingStats]] - Processing statistics interface
